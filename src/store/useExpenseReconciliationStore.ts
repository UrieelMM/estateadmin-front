import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { writeAuditLog } from "../services/auditService";
import { emitDomainNotificationEvent } from "../services/notificationCenterService";

type ReconciliationStatus = "pending" | "matched" | "manual_match" | "ignored";

export type InternalExpenseMovement = {
  id: string;
  expenseId: string;
  folio: string;
  amount: number;
  expenseDate: Date | null;
  concept: string;
  paymentType: string;
  referenceText: string;
};

export type BankExpenseMovement = {
  id: string;
  date: Date | null;
  amount: number;
  description: string;
  reference: string;
  source: "csv";
  status: ReconciliationStatus;
  matchedExpenseId?: string;
  confidence?: number;
};

export type ExpenseReconciliationSummary = {
  bankDebits: number;
  bankDebitsMatched: number;
  bankDebitsPending: number;
  internalExpenses: number;
  internalMatched: number;
  unmatchedDifference: number;
};

type UseExpenseReconciliationState = {
  loading: boolean;
  error: string | null;
  internalExpenses: InternalExpenseMovement[];
  bankMovements: BankExpenseMovement[];
  summary: ExpenseReconciliationSummary;
  activeSessionId: string | null;
  loadInternalExpenses: () => Promise<void>;
  importBankCsv: (csvText: string) => void;
  runAutoMatch: (
    dateToleranceDays?: number,
    amountTolerance?: number,
    dateFrom?: string,
    dateTo?: string
  ) => void;
  setManualMatch: (bankMovementId: string, internalExpenseId: string) => void;
  clearMatch: (bankMovementId: string) => void;
  ignoreMovement: (bankMovementId: string) => void;
  saveProgressSession: (
    name: string,
    options?: { dateFrom?: string; dateTo?: string; csvFile?: File | null }
  ) => Promise<void>;
  resumeLatestDraft: () => Promise<
    | {
        id: string;
        name: string;
        dateFrom: string;
        dateTo: string;
      }
    | null
  >;
  resumeDraftById: (
    draftId: string
  ) => Promise<
    | {
        id: string;
        name: string;
        dateFrom: string;
        dateTo: string;
      }
    | null
  >;
  saveSession: (name: string) => Promise<void>;
  reset: () => void;
};

const EMPTY_SUMMARY: ExpenseReconciliationSummary = {
  bankDebits: 0,
  bankDebitsMatched: 0,
  bankDebitsPending: 0,
  internalExpenses: 0,
  internalMatched: 0,
  unmatchedDifference: 0,
};

function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const yearRaw = Number(slash[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hydrateBankExpenseMovement(raw: any): BankExpenseMovement {
  return {
    id: String(raw?.id || ""),
    date: toDateOrNull(raw?.date),
    amount: Number(raw?.amount || 0),
    description: String(raw?.description || ""),
    reference: String(raw?.reference || ""),
    source: "csv",
    status: (raw?.status || "pending") as ReconciliationStatus,
    matchedExpenseId: raw?.matchedExpenseId ? String(raw.matchedExpenseId) : undefined,
    confidence:
      typeof raw?.confidence === "number" ? Number(raw.confidence) : undefined,
  };
}

function hydrateInternalExpense(raw: any): InternalExpenseMovement {
  return {
    id: String(raw?.id || ""),
    expenseId: String(raw?.expenseId || raw?.id || ""),
    folio: String(raw?.folio || ""),
    amount: Number(raw?.amount || 0),
    expenseDate: toDateOrNull(raw?.expenseDate),
    concept: String(raw?.concept || ""),
    paymentType: String(raw?.paymentType || ""),
    referenceText: String(raw?.referenceText || ""),
  };
}

async function replaceSubcollectionDocs(
  parentPath: string,
  subcollectionName: string,
  items: Record<string, any>[]
) {
  const db = getFirestore();
  const subRef = collection(db, `${parentPath}/${subcollectionName}`);
  const existingSnap = await getDocs(subRef);
  const existingDocs = existingSnap.docs;

  for (let i = 0; i < existingDocs.length; i += 400) {
    const batch = writeBatch(db);
    existingDocs.slice(i, i + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }

  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db);
    items.slice(i, i + 400).forEach((item) => {
      const newRef = doc(subRef);
      batch.set(newRef, item);
    });
    await batch.commit();
  }
}

async function loadSubcollectionDocs(parentPath: string, subcollectionName: string) {
  const db = getFirestore();
  const subRef = collection(db, `${parentPath}/${subcollectionName}`);
  const snap = await getDocs(subRef);
  return snap.docs.map((item) => item.data());
}

function daysDiff(a: Date | null, b: Date | null): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function inDateRange(date: Date | null, dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!date) return false;
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function parseCsvRows(csvText: string): string[][] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, "").trim());
  });
}

function buildSummary(
  bankMovements: BankExpenseMovement[],
  internalExpenses: InternalExpenseMovement[]
): ExpenseReconciliationSummary {
  const bankDebits = bankMovements.reduce((acc, item) => acc + item.amount, 0);
  const bankDebitsMatched = bankMovements
    .filter((item) => item.status === "matched" || item.status === "manual_match")
    .reduce((acc, item) => acc + item.amount, 0);
  const bankDebitsPending = bankMovements
    .filter((item) => item.status === "pending")
    .reduce((acc, item) => acc + item.amount, 0);

  const matchedIds = new Set(
    bankMovements
      .filter((item) => item.matchedExpenseId)
      .map((item) => item.matchedExpenseId as string)
  );
  const internalMatched = internalExpenses
    .filter((item) => matchedIds.has(item.id))
    .reduce((acc, item) => acc + item.amount, 0);

  return {
    bankDebits,
    bankDebitsMatched,
    bankDebitsPending,
    internalExpenses: internalExpenses.reduce((acc, item) => acc + item.amount, 0),
    internalMatched,
    unmatchedDifference: bankDebits - internalMatched,
  };
}

function computeSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export const useExpenseReconciliationStore = create<UseExpenseReconciliationState>()(
  (set, get) => ({
    loading: false,
    error: null,
    internalExpenses: [],
    bankMovements: [],
    summary: EMPTY_SUMMARY,
    activeSessionId: null,

    loadInternalExpenses: async () => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(currentUser);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!clientId || !condominiumId) {
          throw new Error("Contexto de cliente/condominio no disponible");
        }

        const db = getFirestore();
        const expensesSnap = await getDocs(
          collection(db, `clients/${clientId}/condominiums/${condominiumId}/expenses`)
        );

        const internalExpenses: InternalExpenseMovement[] = expensesSnap.docs.map((doc) => {
          const data = doc.data();
          const amount = Number(data.amount || 0) / 100;
          return {
            id: doc.id,
            expenseId: doc.id,
            folio: String(data.folio || ""),
            amount: Number.isFinite(amount) ? amount : 0,
            expenseDate: parseDate(String(data.expenseDate || data.registerDate || "")),
            concept: String(data.concept || ""),
            paymentType: String(data.paymentType || ""),
            referenceText: String(data.folio || data.description || data.concept || ""),
          };
        });

        const currentSummary = buildSummary(get().bankMovements, internalExpenses);
        set({ internalExpenses, summary: currentSummary, loading: false });
      } catch (error: any) {
        console.error("Error loading internal expenses for reconciliation:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible cargar egresos internos",
        });
      }
    },

    importBankCsv: (csvText: string) => {
      try {
        const rows = parseCsvRows(csvText);
        if (rows.length < 2) {
          set({ error: "Archivo CSV sin datos" });
          return;
        }

        const headers = rows[0].map((h) => normalizeText(h));
        const getIndex = (candidates: string[]) =>
          headers.findIndex((h) => candidates.some((candidate) => h.includes(candidate)));

        const dateIdx = getIndex(["fecha"]);
        const descIdx = getIndex(["descripcion", "concepto", "detalle", "movimiento"]);
        const refIdx = getIndex(["referencia", "folio", "ref"]);
        const amountIdx = getIndex(["monto", "importe"]);
        const debitIdx = getIndex(["cargo", "debito", "retiro"]);

        const mapped: BankExpenseMovement[] = rows
          .slice(1)
          .map((row, index) => {
            const debitAmount = debitIdx >= 0 ? parseAmount(row[debitIdx] || "") : 0;
            const fallbackAmount = amountIdx >= 0 ? parseAmount(row[amountIdx] || "") : 0;
            const amount = debitAmount > 0 ? debitAmount : fallbackAmount;

            return {
              id: `bank_exp_${Date.now()}_${index}`,
              date: dateIdx >= 0 ? parseDate(row[dateIdx] || "") : null,
              amount,
              description: descIdx >= 0 ? row[descIdx] || "" : "",
              reference: refIdx >= 0 ? row[refIdx] || "" : "",
              source: "csv" as const,
              status: "pending" as ReconciliationStatus,
            };
          })
          .filter((row) => row.amount > 0);

        const currentSummary = buildSummary(mapped, get().internalExpenses);
        set({ bankMovements: mapped, summary: currentSummary, error: null });
      } catch (error: any) {
        console.error("Error importing expense reconciliation CSV:", error);
        set({ error: error?.message || "No fue posible procesar el CSV" });
      }
    },

    runAutoMatch: (
      dateToleranceDays = 3,
      amountTolerance = 0.01,
      dateFrom,
      dateTo
    ) => {
      const { bankMovements, internalExpenses } = get();
      const usedInternal = new Set<string>();

      const updated: BankExpenseMovement[] = bankMovements.map((bankItem) => {
        if (bankItem.status === "ignored") return bankItem;
        if (!inDateRange(bankItem.date, dateFrom, dateTo)) return bankItem;

        let bestCandidate: InternalExpenseMovement | null = null;
        let bestScore = -1;

        for (const expense of internalExpenses) {
          if (usedInternal.has(expense.id)) continue;
          if (!inDateRange(expense.expenseDate, dateFrom, dateTo)) continue;
          const amountGap = Math.abs(expense.amount - bankItem.amount);
          if (amountGap > amountTolerance) continue;

          const dateGap = daysDiff(expense.expenseDate, bankItem.date);
          if (dateGap > dateToleranceDays) continue;

          const haystack = normalizeText(`${bankItem.description} ${bankItem.reference}`);
          const refText = normalizeText(expense.referenceText);
          const bonusByRef = refText && haystack.includes(refText) ? 0.15 : 0;
          const score = Math.max(0, 1 - dateGap / Math.max(dateToleranceDays, 1)) + bonusByRef;

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = expense;
          }
        }

        if (!bestCandidate) {
          return {
            ...bankItem,
            status: "pending" as ReconciliationStatus,
            matchedExpenseId: undefined,
            confidence: undefined,
          };
        }

        usedInternal.add(bestCandidate.id);
        return {
          ...bankItem,
          status: "matched" as ReconciliationStatus,
          matchedExpenseId: bestCandidate.id,
          confidence: Number(bestScore.toFixed(2)),
        };
      });

      set({ bankMovements: updated, summary: buildSummary(updated, internalExpenses) });
    },

    setManualMatch: (bankMovementId: string, internalExpenseId: string) => {
      const { bankMovements, internalExpenses } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "manual_match" as ReconciliationStatus,
              matchedExpenseId: internalExpenseId,
              confidence: 1,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalExpenses) });
    },

    clearMatch: (bankMovementId: string) => {
      const { bankMovements, internalExpenses } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "pending" as ReconciliationStatus,
              matchedExpenseId: undefined,
              confidence: undefined,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalExpenses) });
    },

    ignoreMovement: (bankMovementId: string) => {
      const { bankMovements, internalExpenses } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "ignored" as ReconciliationStatus,
              matchedExpenseId: undefined,
              confidence: undefined,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalExpenses) });
    },

    saveProgressSession: async (name, options) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(currentUser);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!clientId || !condominiumId) {
          throw new Error("Contexto de cliente/condominio no disponible");
        }

        const { bankMovements, internalExpenses, summary, activeSessionId } = get();
        const db = getFirestore();
        const storage = getStorage();

        let csvSource: Record<string, any> | null = null;
        if (options?.csvFile) {
          const path = `clients/${clientId}/condominiums/${condominiumId}/reconciliations/expenses/${
            activeSessionId || Date.now()
          }/source.csv`;
          const fileRef = ref(storage, path);
          await uploadBytes(fileRef, options.csvFile, {
            contentType: options.csvFile.type || "text/csv",
          });
          const fileUrl = await getDownloadURL(fileRef);
          csvSource = {
            fileUrl,
            path,
            fileName: options.csvFile.name || "source.csv",
            size: options.csvFile.size || 0,
          };
        }

        const payload: Record<string, any> = {
          name: name.trim() || "Conciliación egresos (borrador)",
          type: "expenses",
          status: "draft",
          version: 1,
          storageMode: "subcollections_v1",
          clientId,
          condominiumId,
          summary,
          updatedAt: serverTimestamp(),
          dateRange: {
            from: options?.dateFrom || "",
            to: options?.dateTo || "",
          },
          traceability: {
            bankMovementsCount: bankMovements.length,
            internalMovementsCount: internalExpenses.length,
            matchedMovementsCount: bankMovements.filter(
              (item) =>
                item.status === "matched" || item.status === "manual_match"
            ).length,
            source: "manual_csv_reconciliation",
            lastAction: "save_draft",
          },
        };
        if (csvSource) payload.csvSource = csvSource;

        if (activeSessionId) {
          const draftRef = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`
          );
          await updateDoc(draftRef, payload);
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`,
            "internalMovements",
            internalExpenses
          );
          await writeAuditLog({
            module: "ConciliacionEgresos",
            entityType: "expense_reconciliation",
            entityId: activeSessionId,
            action: "save_draft",
            summary: `Se actualizó borrador de conciliación de egresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalExpensesCount: internalExpenses.length,
              dateFrom: options?.dateFrom || "",
              dateTo: options?.dateTo || "",
            },
          });
        } else {
          payload.createdAt = serverTimestamp();
          payload.createdBy = {
            uid: currentUser.uid,
            role:
              (tokenResult.claims["role"] as string) ||
              (tokenResult.claims["userRole"] as string) ||
              "",
          };
          const created = await addDoc(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations`
            ),
            payload
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${created.id}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${created.id}`,
            "internalMovements",
            internalExpenses
          );
          await writeAuditLog({
            module: "ConciliacionEgresos",
            entityType: "expense_reconciliation",
            entityId: created.id,
            action: "save_draft",
            summary: `Se creó borrador de conciliación de egresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalExpensesCount: internalExpenses.length,
              dateFrom: options?.dateFrom || "",
              dateTo: options?.dateTo || "",
            },
          });
          set({ activeSessionId: created.id });
        }

        set({ loading: false });
      } catch (error: any) {
        console.error("Error al guardar borrador de conciliación egresos:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible guardar el progreso",
        });
      }
    },

    resumeLatestDraft: async () => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(currentUser);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!clientId || !condominiumId) {
          throw new Error("Contexto de cliente/condominio no disponible");
        }
        const db = getFirestore();
        const q = query(
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations`
          ),
          where("status", "==", "draft"),
          orderBy("updatedAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          set({ loading: false });
          return null;
        }
        const draftDoc = snap.docs[0];
        const draftData = draftDoc.data();
        let resolvedBankMovements = Array.isArray(draftData.bankMovements)
          ? draftData.bankMovements
          : null;
        let resolvedInternalExpenses = Array.isArray(draftData.internalExpenses)
          ? draftData.internalExpenses
          : null;
        if (!resolvedBankMovements || !resolvedInternalExpenses) {
          const parentPath = `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${draftDoc.id}`;
          const [bankRows, internalRows] = await Promise.all([
            loadSubcollectionDocs(parentPath, "bankMovements"),
            loadSubcollectionDocs(parentPath, "internalMovements"),
          ]);
          resolvedBankMovements = bankRows;
          resolvedInternalExpenses = internalRows;
        }
        set({
          bankMovements: (resolvedBankMovements || []).map(hydrateBankExpenseMovement),
          internalExpenses: (resolvedInternalExpenses || []).map(hydrateInternalExpense),
          summary: draftData.summary || EMPTY_SUMMARY,
          activeSessionId: draftDoc.id,
          loading: false,
        });
        return {
          id: draftDoc.id,
          name: draftData.name || "",
          dateFrom: draftData?.dateRange?.from || "",
          dateTo: draftData?.dateRange?.to || "",
        };
      } catch (error: any) {
        console.error("Error al reanudar borrador de conciliación egresos:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible reanudar el borrador",
        });
        return null;
      }
    },

    resumeDraftById: async (draftId: string) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(currentUser);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!clientId || !condominiumId) {
          throw new Error("Contexto de cliente/condominio no disponible");
        }
        const db = getFirestore();
        const q = query(
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations`
          ),
          where("__name__", "==", draftId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          set({ loading: false });
          return null;
        }
        const draftDoc = snap.docs[0];
        const draftData = draftDoc.data();
        if (draftData.status !== "draft") {
          set({ loading: false });
          return null;
        }
        let resolvedBankMovements = Array.isArray(draftData.bankMovements)
          ? draftData.bankMovements
          : null;
        let resolvedInternalExpenses = Array.isArray(draftData.internalExpenses)
          ? draftData.internalExpenses
          : null;
        if (!resolvedBankMovements || !resolvedInternalExpenses) {
          const parentPath = `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${draftDoc.id}`;
          const [bankRows, internalRows] = await Promise.all([
            loadSubcollectionDocs(parentPath, "bankMovements"),
            loadSubcollectionDocs(parentPath, "internalMovements"),
          ]);
          resolvedBankMovements = bankRows;
          resolvedInternalExpenses = internalRows;
        }
        set({
          bankMovements: (resolvedBankMovements || []).map(hydrateBankExpenseMovement),
          internalExpenses: (resolvedInternalExpenses || []).map(hydrateInternalExpense),
          summary: draftData.summary || EMPTY_SUMMARY,
          activeSessionId: draftDoc.id,
          loading: false,
        });
        return {
          id: draftDoc.id,
          name: draftData.name || "",
          dateFrom: draftData?.dateRange?.from || "",
          dateTo: draftData?.dateRange?.to || "",
        };
      } catch (error: any) {
        console.error("Error al reanudar borrador por ID (egresos):", error);
        set({
          loading: false,
          error: error?.message || "No fue posible reanudar el borrador",
        });
        return null;
      }
    },

    saveSession: async (name: string) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(currentUser);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!clientId || !condominiumId) {
          throw new Error("Contexto de cliente/condominio no disponible");
        }

        const { bankMovements, internalExpenses, summary, activeSessionId } = get();
        const sessionName =
          name.trim() || `Conciliacion egresos ${new Date().toISOString()}`;
        let savedSessionId = activeSessionId || "";
        const tracePayload = JSON.stringify({
          summary,
          bankCount: bankMovements.length,
          internalCount: internalExpenses.length,
          matchedCount: bankMovements.filter(
            (item) =>
              item.status === "matched" || item.status === "manual_match"
          ).length,
        });
        const snapshotHash = computeSimpleHash(tracePayload);
        const db = getFirestore();
        const payload = {
            name: sessionName,
            type: "expenses",
            status: "completed",
            version: 1,
            storageMode: "subcollections_v1",
            clientId,
            condominiumId,
            summary,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: {
              uid: currentUser.uid,
              role:
                (tokenResult.claims["role"] as string) ||
                (tokenResult.claims["userRole"] as string) ||
                "",
            },
            traceability: {
              snapshotHash,
              bankMovementsCount: bankMovements.length,
              internalMovementsCount: internalExpenses.length,
              matchedMovementsCount: bankMovements.filter(
                (item) =>
                  item.status === "matched" || item.status === "manual_match"
              ).length,
              source: "manual_csv_reconciliation",
              lastAction: "save_session",
            },
            auditTrail: [
              {
                action: "created",
                by: currentUser.uid,
                at: new Date(),
                note: "Sesion de conciliacion de egresos guardada",
              },
            ],
          };
        if (activeSessionId) {
          const refDoc = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`
          );
          await updateDoc(refDoc, payload);
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`,
            "internalMovements",
            internalExpenses
          );
          await writeAuditLog({
            module: "ConciliacionEgresos",
            entityType: "expense_reconciliation",
            entityId: activeSessionId,
            action: "complete",
            summary: `Se completó una conciliación de egresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalExpensesCount: internalExpenses.length,
              matchedMovementsCount: bankMovements.filter(
                (item) =>
                  item.status === "matched" || item.status === "manual_match"
              ).length,
            },
          });
          savedSessionId = activeSessionId;
        } else {
          const saved = await addDoc(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations`
            ),
            {
              ...payload,
              createdAt: serverTimestamp(),
            }
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${saved.id}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${saved.id}`,
            "internalMovements",
            internalExpenses
          );
          await writeAuditLog({
            module: "ConciliacionEgresos",
            entityType: "expense_reconciliation",
            entityId: saved.id,
            action: "complete",
            summary: `Se guardó conciliación final de egresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalExpensesCount: internalExpenses.length,
              matchedMovementsCount: bankMovements.filter(
                (item) =>
                  item.status === "matched" || item.status === "manual_match"
              ).length,
            },
          });
          savedSessionId = saved.id;
        }

        set({ loading: false, activeSessionId: null });

        const netDifference = Number(summary.unmatchedDifference || 0);
        if (Math.abs(netDifference) >= 0.01) {
          void emitDomainNotificationEvent({
            eventType: "finance.reconciliation_net_difference",
            module: "finance",
            priority: Math.abs(netDifference) >= 1000 ? "high" : "medium",
            dedupeKey: `finance:reconciliation:expense:${savedSessionId}:net_difference`,
            entityId: savedSessionId,
            entityType: "expense_reconciliation",
            title: "Conciliación de egresos con diferencia neta",
            body: `La conciliación ${sessionName} cerró con diferencia neta de $${netDifference.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}.`,
            metadata: {
              reconciliationType: "expense",
              sessionId: savedSessionId,
              sessionName,
              unmatchedDifference: netDifference,
              bankDebits: summary.bankDebits,
              internalMatched: summary.internalMatched,
            },
          });
        }
      } catch (error: any) {
        console.error("Error saving expense reconciliation session:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible guardar la conciliación de egresos",
        });
      }
    },

    reset: () => {
      set({
        error: null,
        internalExpenses: [],
        bankMovements: [],
        summary: EMPTY_SUMMARY,
        activeSessionId: null,
      });
    },
  })
);
