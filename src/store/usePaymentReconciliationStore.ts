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

export type InternalPaymentMovement = {
  id: string;
  userId: string;
  userNumber: string;
  chargeId: string;
  paymentId: string;
  amount: number;
  paymentDate: Date | null;
  paymentType: string;
  paymentReference: string;
  referenceText: string;
};

export type BankMovement = {
  id: string;
  date: Date | null;
  amount: number;
  description: string;
  reference: string;
  source: "csv";
  status: ReconciliationStatus;
  matchedPaymentId?: string;
  confidence?: number;
};

export type ReconciliationSummary = {
  bankCredits: number;
  bankCreditsMatched: number;
  bankCreditsPending: number;
  internalPayments: number;
  internalMatched: number;
  unmatchedDifference: number;
};

type ReconciliationSession = {
  id: string;
  name: string;
  createdAt: Date;
  summary: ReconciliationSummary;
};

type UsePaymentReconciliationState = {
  loading: boolean;
  error: string | null;
  internalPayments: InternalPaymentMovement[];
  bankMovements: BankMovement[];
  sessions: ReconciliationSession[];
  summary: ReconciliationSummary;
  lastLoadedAt: Date | null;
  activeSessionId: string | null;
  loadInternalPayments: () => Promise<void>;
  importBankCsv: (csvText: string) => void;
  runAutoMatch: (
    dateToleranceDays?: number,
    amountTolerance?: number,
    dateFrom?: string,
    dateTo?: string
  ) => void;
  setManualMatch: (bankMovementId: string, internalPaymentId: string) => void;
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
  reset: () => void;
  saveSession: (name: string) => Promise<void>;
};

const EMPTY_SUMMARY: ReconciliationSummary = {
  bankCredits: 0,
  bankCreditsMatched: 0,
  bankCreditsPending: 0,
  internalPayments: 0,
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

function normalizeReference(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
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

function hydrateBankMovement(raw: any): BankMovement {
  return {
    id: String(raw?.id || ""),
    date: toDateOrNull(raw?.date),
    amount: Number(raw?.amount || 0),
    description: String(raw?.description || ""),
    reference: String(raw?.reference || ""),
    source: "csv",
    status: (raw?.status || "pending") as ReconciliationStatus,
    matchedPaymentId: raw?.matchedPaymentId ? String(raw.matchedPaymentId) : undefined,
    confidence:
      typeof raw?.confidence === "number" ? Number(raw.confidence) : undefined,
  };
}

function hydrateInternalPayment(raw: any): InternalPaymentMovement {
  return {
    id: String(raw?.id || ""),
    userId: String(raw?.userId || ""),
    userNumber: String(raw?.userNumber || ""),
    chargeId: String(raw?.chargeId || ""),
    paymentId: String(raw?.paymentId || ""),
    amount: Number(raw?.amount || 0),
    paymentDate: toDateOrNull(raw?.paymentDate),
    paymentType: String(raw?.paymentType || ""),
    paymentReference: String(raw?.paymentReference || ""),
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

function buildSummary(
  bankMovements: BankMovement[],
  internalPayments: InternalPaymentMovement[]
): ReconciliationSummary {
  const bankCredits = bankMovements.reduce((acc, item) => acc + item.amount, 0);
  const bankCreditsMatched = bankMovements
    .filter((item) => item.status === "matched" || item.status === "manual_match")
    .reduce((acc, item) => acc + item.amount, 0);
  const bankCreditsPending = bankMovements
    .filter((item) => item.status === "pending")
    .reduce((acc, item) => acc + item.amount, 0);

  const matchedPaymentIds = new Set(
    bankMovements
      .filter((item) => item.matchedPaymentId)
      .map((item) => item.matchedPaymentId as string)
  );

  const internalMatched = internalPayments
    .filter((item) => matchedPaymentIds.has(item.id))
    .reduce((acc, item) => acc + item.amount, 0);

  return {
    bankCredits,
    bankCreditsMatched,
    bankCreditsPending,
    internalPayments: internalPayments.reduce((acc, item) => acc + item.amount, 0),
    internalMatched,
    unmatchedDifference: bankCredits - internalMatched,
  };
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

function computeSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export const usePaymentReconciliationStore = create<UsePaymentReconciliationState>()(
  (set, get) => ({
    loading: false,
    error: null,
    internalPayments: [],
    bankMovements: [],
    sessions: [],
    summary: EMPTY_SUMMARY,
    lastLoadedAt: null,
    activeSessionId: null,

    loadInternalPayments: async () => {
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
        const usersSnap = await getDocs(
          collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`)
        );

        const internalPayments: InternalPaymentMovement[] = [];
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          const role = userData.role;
          if (["admin", "super-admin", "admin-assistant", "security"].includes(role)) {
            continue;
          }

          const userNumber = userData.number || "";
          const chargesSnap = await getDocs(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
            )
          );

          for (const chargeDoc of chargesSnap.docs) {
            const paymentsSnap = await getDocs(
              collection(
                db,
                `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges/${chargeDoc.id}/payments`
              )
            );

            paymentsSnap.forEach((paymentDoc) => {
              const paymentData = paymentDoc.data();
              const amountCents = Number(paymentData.amountPaid ?? 0);
              const amount = Number.isFinite(amountCents) ? amountCents / 100 : 0;
              const dateValue = paymentData.paymentDate;
              const paymentDate =
                dateValue?.toDate?.() || (typeof dateValue === "string" ? parseDate(dateValue) : null);

              internalPayments.push({
                id: `${userDoc.id}_${chargeDoc.id}_${paymentDoc.id}`,
                userId: userDoc.id,
                userNumber: String(userNumber),
                chargeId: chargeDoc.id,
                paymentId: paymentDoc.id,
                amount,
                paymentDate,
                paymentType: String(paymentData.paymentType || ""),
                paymentReference: String(
                  paymentData.paymentReference || paymentData.reference || ""
                ),
                referenceText: String(
                  paymentData.reference || paymentData.comments || paymentData.folio || ""
                ),
              });
            });
          }
        }

        const currentSummary = buildSummary(get().bankMovements, internalPayments);
        set({
          internalPayments,
          summary: currentSummary,
          lastLoadedAt: new Date(),
          loading: false,
        });
      } catch (error: any) {
        console.error("Error loading reconciliation payments:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible cargar pagos para conciliacion",
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
        const amountIdx = getIndex(["monto", "importe", "abono", "deposito", "credito"]);
        const debitIdx = getIndex(["cargo", "debito"]);
        const creditIdx = getIndex(["abono", "credito", "deposito"]);

        const mapped: BankMovement[] = rows
          .slice(1)
          .map((row, index) => {
            const creditAmount = creditIdx >= 0 ? parseAmount(row[creditIdx] || "") : 0;
            const debitAmount = debitIdx >= 0 ? parseAmount(row[debitIdx] || "") : 0;
            const fallbackAmount = amountIdx >= 0 ? parseAmount(row[amountIdx] || "") : 0;
            const amount = creditAmount > 0 ? creditAmount : fallbackAmount - debitAmount;

            return {
              id: `bank_${Date.now()}_${index}`,
              date: dateIdx >= 0 ? parseDate(row[dateIdx] || "") : null,
              amount,
              description: descIdx >= 0 ? row[descIdx] || "" : "",
              reference: refIdx >= 0 ? row[refIdx] || "" : "",
              source: "csv" as const,
              status: "pending" as ReconciliationStatus,
            };
          })
          .filter((row) => row.amount > 0);

        const currentSummary = buildSummary(mapped, get().internalPayments);
        set({ bankMovements: mapped, summary: currentSummary, error: null });
      } catch (error: any) {
        console.error("Error importing CSV for reconciliation:", error);
        set({ error: error?.message || "No fue posible procesar el CSV" });
      }
    },

    runAutoMatch: (
      dateToleranceDays = 3,
      amountTolerance = 0.01,
      dateFrom,
      dateTo
    ) => {
      const { bankMovements, internalPayments } = get();
      const usedInternal = new Set<string>();

      const updated: BankMovement[] = bankMovements.map((bankItem) => {
        if (bankItem.status === "ignored") return bankItem;
        if (!inDateRange(bankItem.date, dateFrom, dateTo)) return bankItem;

        // Regla de precisión: para autoconciliar, se requiere referencia exacta (normalizada) + monto.
        const bankRef = normalizeReference(bankItem.reference || bankItem.description || "");
        if (!bankRef) {
          return {
            ...bankItem,
            status: "pending" as ReconciliationStatus,
            matchedPaymentId: undefined,
            confidence: undefined,
          };
        }

        let bestCandidate: InternalPaymentMovement | null = null;
        let bestScore = -1;

        for (const payment of internalPayments) {
          if (usedInternal.has(payment.id)) continue;
          if (!inDateRange(payment.paymentDate, dateFrom, dateTo)) continue;
          const amountGap = Math.abs(payment.amount - bankItem.amount);
          if (amountGap > amountTolerance) continue;
          const paymentRef = normalizeReference(payment.paymentReference);
          if (!paymentRef || paymentRef !== bankRef) continue;

          // La fecha ya no es criterio de bloqueo; solo suma confianza auxiliar.
          const dateGap = daysDiff(payment.paymentDate, bankItem.date);
          const dateScore = Number.isFinite(dateGap)
            ? Math.max(0, 1 - dateGap / Math.max(dateToleranceDays, 1))
            : 0;
          const score = 1 + dateScore;

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = payment;
          }
        }

        if (!bestCandidate) {
          return {
            ...bankItem,
            status: "pending" as ReconciliationStatus,
            matchedPaymentId: undefined,
            confidence: undefined,
          };
        }

        usedInternal.add(bestCandidate.id);
        return {
          ...bankItem,
          status: "matched" as ReconciliationStatus,
          matchedPaymentId: bestCandidate.id,
          confidence: Number(bestScore.toFixed(2)),
        };
      });

      set({ bankMovements: updated, summary: buildSummary(updated, internalPayments) });
    },

    setManualMatch: (bankMovementId: string, internalPaymentId: string) => {
      const { bankMovements, internalPayments } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "manual_match" as ReconciliationStatus,
              matchedPaymentId: internalPaymentId,
              confidence: 1,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalPayments) });
    },

    clearMatch: (bankMovementId: string) => {
      const { bankMovements, internalPayments } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "pending" as ReconciliationStatus,
              matchedPaymentId: undefined,
              confidence: undefined,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalPayments) });
    },

    ignoreMovement: (bankMovementId: string) => {
      const { bankMovements, internalPayments } = get();
      const updated = bankMovements.map((item) =>
        item.id === bankMovementId
          ? {
              ...item,
              status: "ignored" as ReconciliationStatus,
              matchedPaymentId: undefined,
              confidence: undefined,
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalPayments) });
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

        const { bankMovements, internalPayments, summary, activeSessionId } = get();
        const db = getFirestore();
        const storage = getStorage();

        let csvSource: Record<string, any> | null = null;
        if (options?.csvFile) {
          const path = `clients/${clientId}/condominiums/${condominiumId}/reconciliations/income/${
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
          name: name.trim() || "Conciliación ingresos (borrador)",
          type: "income",
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
            internalMovementsCount: internalPayments.length,
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
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`
          );
          await updateDoc(draftRef, payload);
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`,
            "internalMovements",
            internalPayments
          );
          await writeAuditLog({
            module: "ConciliacionIngresos",
            entityType: "payment_reconciliation",
            entityId: activeSessionId,
            action: "save_draft",
            summary: `Se actualizó borrador de conciliación de ingresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalPaymentsCount: internalPayments.length,
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
              `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
            ),
            payload
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${created.id}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${created.id}`,
            "internalMovements",
            internalPayments
          );
          await writeAuditLog({
            module: "ConciliacionIngresos",
            entityType: "payment_reconciliation",
            entityId: created.id,
            action: "save_draft",
            summary: `Se creó borrador de conciliación de ingresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalPaymentsCount: internalPayments.length,
              dateFrom: options?.dateFrom || "",
              dateTo: options?.dateTo || "",
            },
          });
          set({ activeSessionId: created.id });
        }

        set({ loading: false });
      } catch (error: any) {
        console.error("Error al guardar borrador de conciliación ingresos:", error);
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
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
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
        let resolvedInternalPayments = Array.isArray(draftData.internalPayments)
          ? draftData.internalPayments
          : null;
        if (!resolvedBankMovements || !resolvedInternalPayments) {
          const parentPath = `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${draftDoc.id}`;
          const [bankRows, internalRows] = await Promise.all([
            loadSubcollectionDocs(parentPath, "bankMovements"),
            loadSubcollectionDocs(parentPath, "internalMovements"),
          ]);
          resolvedBankMovements = bankRows;
          resolvedInternalPayments = internalRows;
        }
        set({
          bankMovements: (resolvedBankMovements || []).map(hydrateBankMovement),
          internalPayments: (resolvedInternalPayments || []).map(hydrateInternalPayment),
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
        console.error("Error al reanudar borrador de conciliación ingresos:", error);
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
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
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
        let resolvedInternalPayments = Array.isArray(draftData.internalPayments)
          ? draftData.internalPayments
          : null;
        if (!resolvedBankMovements || !resolvedInternalPayments) {
          const parentPath = `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${draftDoc.id}`;
          const [bankRows, internalRows] = await Promise.all([
            loadSubcollectionDocs(parentPath, "bankMovements"),
            loadSubcollectionDocs(parentPath, "internalMovements"),
          ]);
          resolvedBankMovements = bankRows;
          resolvedInternalPayments = internalRows;
        }
        set({
          bankMovements: (resolvedBankMovements || []).map(hydrateBankMovement),
          internalPayments: (resolvedInternalPayments || []).map(hydrateInternalPayment),
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
        console.error("Error al reanudar borrador por ID (ingresos):", error);
        set({
          loading: false,
          error: error?.message || "No fue posible reanudar el borrador",
        });
        return null;
      }
    },

    reset: () => {
      set({
        error: null,
        internalPayments: [],
        bankMovements: [],
        summary: EMPTY_SUMMARY,
        lastLoadedAt: null,
        activeSessionId: null,
      });
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

        const { bankMovements, internalPayments, summary, sessions, activeSessionId } =
          get();
        const sessionName =
          name.trim() || `Conciliacion ingresos ${new Date().toISOString()}`;
        const tracePayload = JSON.stringify({
          summary,
          bankCount: bankMovements.length,
          internalCount: internalPayments.length,
          matchedCount: bankMovements.filter(
            (item) =>
              item.status === "matched" || item.status === "manual_match"
          ).length,
        });
        const snapshotHash = computeSimpleHash(tracePayload);
        const db = getFirestore();
        const payload = {
            name: sessionName,
            type: "income",
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
              internalMovementsCount: internalPayments.length,
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
                note: "Sesion de conciliacion guardada",
              },
            ],
          };
        let savedId = activeSessionId || "";
        if (activeSessionId) {
          const refDoc = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`
          );
          await updateDoc(refDoc, payload);
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`,
            "internalMovements",
            internalPayments
          );
          await writeAuditLog({
            module: "ConciliacionIngresos",
            entityType: "payment_reconciliation",
            entityId: activeSessionId,
            action: "complete",
            summary: `Se completó una conciliación de ingresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalPaymentsCount: internalPayments.length,
              matchedMovementsCount: bankMovements.filter(
                (item) =>
                  item.status === "matched" || item.status === "manual_match"
              ).length,
            },
          });
        } else {
          const docRef = await addDoc(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
            ),
            {
              ...payload,
              createdAt: serverTimestamp(),
            }
          );
          savedId = docRef.id;
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${savedId}`,
            "bankMovements",
            bankMovements
          );
          await replaceSubcollectionDocs(
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${savedId}`,
            "internalMovements",
            internalPayments
          );
          await writeAuditLog({
            module: "ConciliacionIngresos",
            entityType: "payment_reconciliation",
            entityId: savedId,
            action: "complete",
            summary: `Se guardó conciliación final de ingresos`,
            metadata: {
              bankMovementsCount: bankMovements.length,
              internalPaymentsCount: internalPayments.length,
              matchedMovementsCount: bankMovements.filter(
                (item) =>
                  item.status === "matched" || item.status === "manual_match"
              ).length,
            },
          });
        }

        set({
          sessions: [
            {
              id: savedId,
              name: name.trim() || "Conciliacion",
              createdAt: new Date(),
              summary,
            },
            ...sessions,
          ],
          activeSessionId: null,
          loading: false,
        });

        const netDifference = Number(summary.unmatchedDifference || 0);
        if (Math.abs(netDifference) >= 0.01) {
          void emitDomainNotificationEvent({
            eventType: "finance.reconciliation_net_difference",
            module: "finance",
            priority: Math.abs(netDifference) >= 1000 ? "high" : "medium",
            dedupeKey: `finance:reconciliation:income:${savedId}:net_difference`,
            entityId: savedId,
            entityType: "payment_reconciliation",
            title: "Conciliación de ingresos con diferencia neta",
            body: `La conciliación ${sessionName} cerró con diferencia neta de $${netDifference.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}.`,
            metadata: {
              reconciliationType: "income",
              sessionId: savedId,
              sessionName,
              unmatchedDifference: netDifference,
              bankCredits: summary.bankCredits,
              internalMatched: summary.internalMatched,
            },
          });
        }
      } catch (error: any) {
        console.error("Error saving reconciliation session:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible guardar la conciliacion",
        });
      }
    },
  })
);
