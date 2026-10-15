import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import {
  expenseReversalService,
  type ExpenseReversalCommitResponse,
  type ExpenseReversalHistoryFilters,
  type ExpenseReversalHistoryResponse,
  type ExpenseReversalPreviewResponse,
} from "../services/expenseReversalService";

type ExpenseReversalState = {
  preview: ExpenseReversalPreviewResponse | null;
  previewLoading: boolean;
  commitLoading: boolean;
  historyLoading: boolean;
  error: string | null;
  previewExpenseReversal: (expenseId: string) => Promise<ExpenseReversalPreviewResponse>;
  commitExpenseReversal: (payload: {
    expenseId: string;
    reason: string;
    notes?: string;
  }) => Promise<ExpenseReversalCommitResponse>;
  fetchExpenseReversalHistory: (
    filters?: ExpenseReversalHistoryFilters
  ) => Promise<ExpenseReversalHistoryResponse>;
  reset: () => void;
};

const buildIdempotencyKey = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `expense-reversal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const resolveTenantContext = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const tokenResult = await getIdTokenResult(user);
  const clientId = String(tokenResult.claims["clientId"] || "").trim();
  const condominiumId = String(
    localStorage.getItem("condominiumId") || tokenResult.claims["condominiumId"] || ""
  ).trim();
  if (!clientId || !condominiumId) {
    throw new Error("No se pudo resolver el contexto del condominio");
  }
  if (String(tokenResult.claims["role"] || "") !== "admin") {
    throw new Error("Solo los administradores pueden revertir egresos");
  }

  return { clientId, condominiumId, idToken: await user.getIdToken() };
};

const normalizeError = (error: any): string => {
  const raw = error?.response?.data?.message;
  if (raw) return Array.isArray(raw) ? raw.join(". ") : String(raw);
  return String(error?.message || "No fue posible completar la reversa del egreso");
};

const useExpenseReversalStore = create<ExpenseReversalState>()((set, get) => ({
  preview: null,
  previewLoading: false,
  commitLoading: false,
  historyLoading: false,
  error: null,

  previewExpenseReversal: async (expenseId) => {
    set({ previewLoading: true, error: null, preview: null });
    try {
      const { clientId, condominiumId, idToken } = await resolveTenantContext();
      const result = await expenseReversalService.preview(
        { clientId, condominiumId, expenseId },
        idToken
      );
      set({ preview: result, previewLoading: false });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ previewLoading: false, error: message });
      throw new Error(message);
    }
  },

  commitExpenseReversal: async ({ expenseId, reason, notes }) => {
    set({ commitLoading: true, error: null });
    try {
      const operationId = get().preview?.operationId;
      if (!operationId) throw new Error("Primero valida el egreso a revertir");
      if (!reason.trim()) throw new Error("El motivo de la reversa es obligatorio");

      const { clientId, condominiumId, idToken } = await resolveTenantContext();
      const result = await expenseReversalService.commit(
        {
          clientId,
          condominiumId,
          expenseId,
          operationId,
          reason: reason.trim(),
          notes: notes?.trim() || undefined,
        },
        idToken,
        buildIdempotencyKey()
      );
      set({ commitLoading: false });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ commitLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchExpenseReversalHistory: async (filters = {}) => {
    set({ historyLoading: true, error: null });
    try {
      const { clientId, condominiumId, idToken } = await resolveTenantContext();
      const result = await expenseReversalService.fetchHistory(
        { clientId, condominiumId },
        idToken,
        filters
      );
      set({ historyLoading: false });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ historyLoading: false, error: message });
      throw new Error(message);
    }
  },

  reset: () =>
    set({ preview: null, previewLoading: false, commitLoading: false, error: null }),
}));

export default useExpenseReversalStore;
