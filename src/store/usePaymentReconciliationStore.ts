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
} from "../services/reconciliation/bankFileParser";
import { saveSnapshotToStorage } from "../services/reconciliation/reconciliationStorage";
import { hydrateDraftData } from "../services/reconciliation/hybridPersistence";
import {
  runAutoMatchEngine,
  MatchOptions,
  DEFAULT_MATCH_OPTIONS,
} from "../services/reconciliation/matchingEngine";

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
  source: "csv" | "xlsx" | "xls";
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

export type ImportDiagnostics = {
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

type ReconciliationSession = {
  id: string;
  name: string;
  createdAt: Date;
  summary: ReconciliationSummary;
};

type UsePaymentReconciliationState = {
  loading: boolean;
  saving: boolean;
  saveProgressLabel: string;
  error: string | null;
  lastImport: ImportDiagnostics | null;
  internalPayments: InternalPaymentMovement[];
  bankMovements: BankMovement[];
  sessions: ReconciliationSession[];
  summary: ReconciliationSummary;
  lastLoadedAt: Date | null;
  activeSessionId: string | null;
  loadInternalPayments: () => Promise<void>;
  importBankFile: (file: File) => Promise<ParseResult | null>;
  applyParseResult: (parseResult: ParseResult, file: File) => void;
  runAutoMatch: (options?: Partial<MatchOptions>) => void;
  setManualMatch: (bankMovementId: string, internalPaymentId: string) => void;
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

function hydrateBankMovement(raw: any): BankMovement {
  const sourceValue = String(raw?.source || "csv");
  const source: BankMovement["source"] =
    sourceValue === "xlsx" || sourceValue === "xls" ? sourceValue : "csv";
  return {
    id: String(raw?.id || `bank_${uuidv4()}`),
    date: toDateOrNull(raw?.date),
    amount: Number(raw?.amount || 0),
    description: String(raw?.description || ""),
    reference: String(raw?.reference || ""),
    source,
    status: (raw?.status || "pending") as ReconciliationStatus,
    matchedPaymentId: raw?.matchedPaymentId
      ? String(raw.matchedPaymentId)
      : undefined,
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

function buildSummary(
  bankMovements: BankMovement[],
  internalPayments: InternalPaymentMovement[]
): ReconciliationSummary {
  const bankCredits = bankMovements.reduce((acc, item) => acc + item.amount, 0);
  const bankCreditsMatched = bankMovements
    .filter(
      (item) => item.status === "matched" || item.status === "manual_match"
    )
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
    internalPayments: internalPayments.reduce(
      (acc, item) => acc + item.amount,
      0
    ),
    internalMatched,
    unmatchedDifference: bankCredits - internalMatched,
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

export const usePaymentReconciliationStore =
  create<UsePaymentReconciliationState>()((set, get) => ({
    loading: false,
    saving: false,
    saveProgressLabel: "",
    error: null,
    lastImport: null,
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
          if (
            ["admin", "super-admin", "admin-assistant", "security"].includes(role)
          ) {
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
                dateValue?.toDate?.() ||
                (typeof dateValue === "string" ? new Date(dateValue) : null);

              internalPayments.push({
                id: `${userDoc.id}_${chargeDoc.id}_${paymentDoc.id}`,
                userId: userDoc.id,
                userNumber: String(userNumber),
                chargeId: chargeDoc.id,
                paymentId: paymentDoc.id,
                amount,
                paymentDate:
                  paymentDate instanceof Date && !Number.isNaN(paymentDate.getTime())
                    ? paymentDate
                    : null,
                paymentType: String(paymentData.paymentType || ""),
                paymentReference: String(
                  paymentData.paymentReference || paymentData.reference || ""
                ),
                referenceText: String(
                  paymentData.reference ||
                    paymentData.comments ||
                    paymentData.folio ||
                    ""
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
          error:
            error?.message || "No fue posible cargar pagos para conciliación",
        });
      }
    },

    importBankFile: async (file: File) => {
      try {
        set({ loading: true, error: null });
        const parseResult = await parseBankFile(file, "income");
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
        console.error("Error importing bank file:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible procesar el archivo",
        });
        return null;
      }
    },

    applyParseResult: (parseResult: ParseResult, file: File) => {
      const sourceKind: BankMovement["source"] =
        parseResult.fileKind === "xlsx"
          ? "xlsx"
          : parseResult.fileKind === "xls"
          ? "xls"
          : "csv";
      const mapped: BankMovement[] = parseResult.rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: row.amount,
        description: row.description,
        reference: row.reference,
        source: sourceKind,
        status: "pending" as ReconciliationStatus,
      }));
      const currentSummary = buildSummary(mapped, get().internalPayments);
      set({
        bankMovements: mapped,
        summary: currentSummary,
        lastImport: {
          fileKind: parseResult.fileKind,
          fileName: file.name,
          warnings: parseResult.warnings,
          errors: parseResult.errors,
          stats: parseResult.stats,
        },
        error: null,
      });
    },

    runAutoMatch: (options?: Partial<MatchOptions>) => {
      const { bankMovements, internalPayments } = get();
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
          matchedId: m.matchedPaymentId,
          confidence: m.confidence,
        })),
        internalPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          date: p.paymentDate,
          reference: p.paymentReference,
          referenceText: p.referenceText,
        })),
        resolved
      );

      const updated: BankMovement[] = bankMovements.map((bankItem, idx) => {
        const engineItem = engineResult[idx];
        return {
          ...bankItem,
          status: engineItem.status as ReconciliationStatus,
          matchedPaymentId: engineItem.matchedId || undefined,
          confidence: engineItem.confidence,
        };
      });

      set({
        bankMovements: updated,
        summary: buildSummary(updated, internalPayments),
      });
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

    bulkUpdateStatus: (bankMovementIds, status) => {
      const { bankMovements, internalPayments } = get();
      const idSet = new Set(bankMovementIds);
      const updated = bankMovements.map((item) =>
        idSet.has(item.id)
          ? {
              ...item,
              status,
              ...(status === "ignored" || status === "pending"
                ? { matchedPaymentId: undefined, confidence: undefined }
                : {}),
            }
          : item
      );
      set({ bankMovements: updated, summary: buildSummary(updated, internalPayments) });
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

        const { bankMovements, internalPayments, summary, activeSessionId } =
          get();
        const db = getFirestore();
        const storage = getStorage();
        const sessionIdForStorage = activeSessionId || `draft_${uuidv4()}`;

        let csvSource: Record<string, any> | null = null;
        if (options?.csvFile) {
          set({ saveProgressLabel: "Subiendo archivo fuente..." });
          const extension =
            options.csvFile.name.split(".").pop()?.toLowerCase() || "csv";
          const path = `clients/${clientId}/condominiums/${condominiumId}/reconciliations/income/${sessionIdForStorage}/source.${extension}`;
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
          direction: "income",
          sessionId: sessionIdForStorage,
          summary,
          bankMovements,
          internalMovements: internalPayments,
        });

        const payload: Record<string, any> = {
          name: name.trim() || "Conciliación ingresos (borrador)",
          type: "income",
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

        set({ saveProgressLabel: "Guardando metadatos..." });
        if (activeSessionId) {
          const draftRef = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`
          );
          await updateDoc(draftRef, payload);
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
              `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
            ),
            payload
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
              storageMode: "storage_v2",
            },
          });
          set({ activeSessionId: created.id });
        }

        set({ saving: false, saveProgressLabel: "" });
      } catch (error: any) {
        console.error(
          "Error al guardar borrador de conciliación ingresos:",
          error
        );
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
        const hydrated = await hydrateDraftData(
          `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${draftDoc.id}`,
          draftData
        );
        set({
          bankMovements: hydrated.bankMovements.map(hydrateBankMovement),
          internalPayments: hydrated.internalMovements.map(hydrateInternalPayment),
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
        console.error(
          "Error al reanudar borrador de conciliación ingresos:",
          error
        );
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
        const hydrated = await hydrateDraftData(
          `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${draftDoc.id}`,
          draftData
        );
        set({
          bankMovements: hydrated.bankMovements.map(hydrateBankMovement),
          internalPayments: hydrated.internalMovements.map(hydrateInternalPayment),
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
        lastImport: null,
      });
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

        const {
          bankMovements,
          internalPayments,
          summary,
          sessions,
          activeSessionId,
        } = get();
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

        const sessionIdForStorage = activeSessionId || `session_${uuidv4()}`;
        set({ saveProgressLabel: "Subiendo snapshot a Storage..." });
        const snapshotRef = await saveSnapshotToStorage({
          clientId,
          condominiumId,
          direction: "income",
          sessionId: sessionIdForStorage,
          summary,
          bankMovements,
          internalMovements: internalPayments,
        });

        const payload = {
          name: sessionName,
          type: "income",
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
        set({ saveProgressLabel: "Guardando metadatos..." });
        if (activeSessionId) {
          const refDoc = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations/${activeSessionId}`
          );
          await updateDoc(refDoc, payload);
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
              storageMode: "storage_v2",
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
              storageMode: "storage_v2",
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
          saving: false,
          saveProgressLabel: "",
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
          saving: false,
          saveProgressLabel: "",
          error: error?.message || "No fue posible guardar la conciliacion",
        });
      }
    },
  }));

