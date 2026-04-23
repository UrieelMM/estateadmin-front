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
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { writeAuditLog } from "../services/auditService";
import { emitDomainNotificationEvent } from "../services/notificationCenterService";
import {
  parseBankFile,
  ParseResult,
  ParseWarning,
  parseBankDate,
} from "../services/reconciliation/bankFileParser";
import { saveSnapshotToStorage } from "../services/reconciliation/reconciliationStorage";
import { hydrateDraftData } from "../services/reconciliation/hybridPersistence";
import {
  runAutoMatchEngine,
  MatchOptions,
  DEFAULT_MATCH_OPTIONS,
} from "../services/reconciliation/matchingEngine";

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
  source: "csv" | "xlsx" | "xls";
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

export type ExpenseImportDiagnostics = {
  fileKind: "csv" | "xlsx" | "xls" | "unknown";
  fileName: string;
  warnings: ParseWarning[];
  errors: ParseWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    totalAmount: number;
    dateRange: { from: Date | null; to: Date | null };
  };
};

type UseExpenseReconciliationState = {
  loading: boolean;
  saving: boolean;
  saveProgressLabel: string;
  error: string | null;
  lastImport: ExpenseImportDiagnostics | null;
  internalExpenses: InternalExpenseMovement[];
  bankMovements: BankExpenseMovement[];
  summary: ExpenseReconciliationSummary;
  activeSessionId: string | null;
  loadInternalExpenses: () => Promise<void>;
  importBankFile: (file: File) => Promise<ParseResult | null>;
  applyParseResult: (parseResult: ParseResult, file: File) => void;
  runAutoMatch: (options?: Partial<MatchOptions>) => void;
  setManualMatch: (bankMovementId: string, internalExpenseId: string) => void;
  clearMatch: (bankMovementId: string) => void;
  ignoreMovement: (bankMovementId: string) => void;
  bulkUpdateStatus: (
    bankMovementIds: string[],
    status: ReconciliationStatus
  ) => void;
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

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hydrateBankExpenseMovement(raw: any): BankExpenseMovement {
  const sourceValue = String(raw?.source || "csv");
  const source: BankExpenseMovement["source"] =
    sourceValue === "xlsx" || sourceValue === "xls" ? sourceValue : "csv";
  return {
    id: String(raw?.id || `bank_exp_${uuidv4()}`),
    date: toDateOrNull(raw?.date),
    amount: Number(raw?.amount || 0),
    description: String(raw?.description || ""),
    reference: String(raw?.reference || ""),
    source,
    status: (raw?.status || "pending") as ReconciliationStatus,
    matchedExpenseId: raw?.matchedExpenseId
      ? String(raw.matchedExpenseId)
      : undefined,
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

function buildSummary(
  bankMovements: BankExpenseMovement[],
  internalExpenses: InternalExpenseMovement[]
): ExpenseReconciliationSummary {
  const bankDebits = bankMovements.reduce((acc, item) => acc + item.amount, 0);
  const bankDebitsMatched = bankMovements
    .filter(
      (item) => item.status === "matched" || item.status === "manual_match"
    )
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
    internalExpenses: internalExpenses.reduce(
      (acc, item) => acc + item.amount,
      0
    ),
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

export const useExpenseReconciliationStore =
  create<UseExpenseReconciliationState>()((set, get) => ({
    loading: false,
    saving: false,
    saveProgressLabel: "",
    error: null,
    lastImport: null,
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
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          )
        );

        const internalExpenses: InternalExpenseMovement[] = expensesSnap.docs.map(
          (expenseDoc) => {
            const data = expenseDoc.data();
            const amount = Number(data.amount || 0) / 100;
            return {
              id: expenseDoc.id,
              expenseId: expenseDoc.id,
              folio: String(data.folio || ""),
              amount: Number.isFinite(amount) ? amount : 0,
              expenseDate: parseBankDate(
                String(data.expenseDate || data.registerDate || "")
              ),
              concept: String(data.concept || ""),
              paymentType: String(data.paymentType || ""),
              referenceText: String(
                data.folio || data.description || data.concept || ""
              ),
            };
          }
        );

        const currentSummary = buildSummary(
          get().bankMovements,
          internalExpenses
        );
        set({ internalExpenses, summary: currentSummary, loading: false });
      } catch (error: any) {
        console.error("Error loading internal expenses for reconciliation:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible cargar egresos internos",
        });
      }
    },

    importBankFile: async (file: File) => {
      try {
        set({ loading: true, error: null });
        const parseResult = await parseBankFile(file, "expenses");
        if (parseResult.errors.length > 0) {
          set({
            loading: false,
            error: parseResult.errors[0].message,
            lastImport: {
              fileKind: parseResult.fileKind,
              fileName: file.name,
              warnings: parseResult.warnings,
              errors: parseResult.errors,
              stats: parseResult.stats,
            },
          });
          return parseResult;
        }
        get().applyParseResult(parseResult, file);
        set({ loading: false });
        return parseResult;
      } catch (error: any) {
        console.error("Error importing bank file for expenses:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible procesar el archivo",
        });
        return null;
      }
    },

    applyParseResult: (parseResult: ParseResult, file: File) => {
      const sourceKind: BankExpenseMovement["source"] =
        parseResult.fileKind === "xlsx"
          ? "xlsx"
          : parseResult.fileKind === "xls"
          ? "xls"
          : "csv";
      const mapped: BankExpenseMovement[] = parseResult.rows
        .map((row) => ({
          id: row.id,
          date: row.date,
          amount: Math.abs(row.amount),
          description: row.description,
          reference: row.reference,
          source: sourceKind,
          status: "pending" as ReconciliationStatus,
        }))
        .filter((row) => row.amount > 0);
      const currentSummary = buildSummary(mapped, get().internalExpenses);
      set({
        bankMovements: mapped,
        summary: currentSummary,
        lastImport: {
          fileKind: parseResult.fileKind,
          fileName: file.name,
          warnings: parseResult.warnings,
          errors: parseResult.errors,
          stats: {
            ...parseResult.stats,
            totalAmount: mapped.reduce((acc, item) => acc + item.amount, 0),
          },
        },
        error: null,
      });
    },

    runAutoMatch: (options?: Partial<MatchOptions>) => {
      const { bankMovements, internalExpenses } = get();
      const resolved: MatchOptions = {
        ...DEFAULT_MATCH_OPTIONS,
        ...options,
      };

      const engineResult = runAutoMatchEngine(
        bankMovements.map((m) => ({
          id: m.id,
          date: m.date,
          amount: m.amount,
          description: m.description,
          reference: m.reference,
          status: m.status,
          matchedId: m.matchedExpenseId,
          confidence: m.confidence,
        })),
        internalExpenses.map((expense) => ({
          id: expense.id,
          amount: expense.amount,
          date: expense.expenseDate,
          reference: expense.folio || "",
          referenceText: expense.referenceText,
        })),
        resolved
      );

      const updated: BankExpenseMovement[] = bankMovements.map(
        (bankItem, idx) => {
          const engineItem = engineResult[idx];
          return {
            ...bankItem,
            status: engineItem.status as ReconciliationStatus,
            matchedExpenseId: engineItem.matchedId || undefined,
            confidence: engineItem.confidence,
          };
        }
      );

      set({
        bankMovements: updated,
        summary: buildSummary(updated, internalExpenses),
      });
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

    bulkUpdateStatus: (bankMovementIds, status) => {
      const { bankMovements, internalExpenses } = get();
      const idSet = new Set(bankMovementIds);
      const updated = bankMovements.map((item) =>
        idSet.has(item.id)
          ? {
              ...item,
              status,
              ...(status === "ignored" || status === "pending"
                ? { matchedExpenseId: undefined, confidence: undefined }
                : {}),
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalExpenses) });
    },

    saveProgressSession: async (name, options) => {
      set({
        saving: true,
        saveProgressLabel: "Preparando borrador...",
        error: null,
      });
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

        const { bankMovements, internalExpenses, summary, activeSessionId } =
          get();
        const db = getFirestore();
        const storage = getStorage();
        const sessionIdForStorage = activeSessionId || `draft_${uuidv4()}`;

        let csvSource: Record<string, any> | null = null;
        if (options?.csvFile) {
          set({ saveProgressLabel: "Subiendo archivo fuente..." });
          const extension =
            options.csvFile.name.split(".").pop()?.toLowerCase() || "csv";
          const path = `clients/${clientId}/condominiums/${condominiumId}/reconciliations/expenses/${sessionIdForStorage}/source.${extension}`;
          const fileRef = ref(storage, path);
          await uploadBytes(fileRef, options.csvFile, {
            contentType:
              options.csvFile.type ||
              (extension === "csv" ? "text/csv" : "application/octet-stream"),
          });
          const fileUrl = await getDownloadURL(fileRef);
          csvSource = {
            fileUrl,
            path,
            fileName: options.csvFile.name || `source.${extension}`,
            size: options.csvFile.size || 0,
            kind: extension,
          };
        }

        set({ saveProgressLabel: "Subiendo snapshot a Storage..." });
        const snapshotRef = await saveSnapshotToStorage({
          clientId,
          condominiumId,
          direction: "expenses",
          sessionId: sessionIdForStorage,
          summary,
          bankMovements,
          internalMovements: internalExpenses,
        });

        const payload: Record<string, any> = {
          name: name.trim() || "Conciliación egresos (borrador)",
          type: "expenses",
          status: "draft",
          version: 2,
          storageMode: "storage_v2",
          snapshotRef,
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

        set({ saveProgressLabel: "Guardando metadatos..." });
        if (activeSessionId) {
          const draftRef = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`
          );
          await updateDoc(draftRef, payload);
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
              storageMode: "storage_v2",
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
              storageMode: "storage_v2",
            },
          });
          set({ activeSessionId: created.id });
        }

        set({ saving: false, saveProgressLabel: "" });
      } catch (error: any) {
        console.error("Error al guardar borrador de conciliación egresos:", error);
        set({
          saving: false,
          saveProgressLabel: "",
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
        const hydrated = await hydrateDraftData(
          `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${draftDoc.id}`,
          draftData
        );
        set({
          bankMovements: hydrated.bankMovements.map(hydrateBankExpenseMovement),
          internalExpenses: hydrated.internalMovements.map(hydrateInternalExpense),
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
        const hydrated = await hydrateDraftData(
          `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${draftDoc.id}`,
          draftData
        );
        set({
          bankMovements: hydrated.bankMovements.map(hydrateBankExpenseMovement),
          internalExpenses: hydrated.internalMovements.map(hydrateInternalExpense),
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
      set({
        saving: true,
        saveProgressLabel: "Preparando sesión final...",
        error: null,
      });
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

        const { bankMovements, internalExpenses, summary, activeSessionId } =
          get();
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

        const sessionIdForStorage = activeSessionId || `session_${uuidv4()}`;
        set({ saveProgressLabel: "Subiendo snapshot a Storage..." });
        const snapshotRef = await saveSnapshotToStorage({
          clientId,
          condominiumId,
          direction: "expenses",
          sessionId: sessionIdForStorage,
          summary,
          bankMovements,
          internalMovements: internalExpenses,
        });

        const payload = {
          name: sessionName,
          type: "expenses",
          status: "completed",
          version: 2,
          storageMode: "storage_v2" as const,
          snapshotRef,
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

        set({ saveProgressLabel: "Guardando metadatos..." });
        if (activeSessionId) {
          const refDoc = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations/${activeSessionId}`
          );
          await updateDoc(refDoc, payload);
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
              storageMode: "storage_v2",
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
              storageMode: "storage_v2",
            },
          });
          savedSessionId = saved.id;
        }

        set({
          loading: false,
          saving: false,
          saveProgressLabel: "",
          activeSessionId: null,
        });

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
          saving: false,
          saveProgressLabel: "",
          error:
            error?.message ||
            "No fue posible guardar la conciliación de egresos",
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
        lastImport: null,
      });
    },
  }));
