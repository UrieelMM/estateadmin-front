import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import {
  paymentReversalService,
  type PaymentReversalPreviewResponse,
  type PaymentReversalCommitResponse,
  type PaymentReversalHistoryResponse,
  type PaymentReversalHistoryFilters,
} from "../services/paymentReversalService";

type PreviewPayload = {
  paymentId: string;
  reason?: string;
  notes?: string;
  operationId?: string;
};

type CommitPayload = {
  paymentId: string;
  reason: string;
  notes?: string;
  operationId?: string;
};

type TenantContext = {
  clientId: string;
  condominiumId: string;
  role: string;
  idToken: string;
};

type PaymentReversalState = {
  preview: PaymentReversalPreviewResponse | null;
  commitResult: PaymentReversalCommitResponse | null;
  history: PaymentReversalHistoryResponse | null;
  previewLoading: boolean;
  commitLoading: boolean;
  historyLoading: boolean;
  error: string | null;
  previewPaymentReversal: (
    payload: PreviewPayload
  ) => Promise<PaymentReversalPreviewResponse>;
  commitPaymentReversal: (
    payload: CommitPayload
  ) => Promise<PaymentReversalCommitResponse>;
  fetchReversalHistory: (
    filters?: PaymentReversalHistoryFilters
  ) => Promise<PaymentReversalHistoryResponse>;
  clearError: () => void;
  reset: () => void;
};

const buildIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `reversal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolveTenantContext = async (): Promise<TenantContext> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const tokenResult = await getIdTokenResult(user);
  const clientId = String(tokenResult.claims["clientId"] || "").trim();
  const condominiumClaim = String(tokenResult.claims["condominiumId"] || "").trim();
  const condominiumStorage = String(localStorage.getItem("condominiumId") || "").trim();
  const condominiumId = condominiumClaim || condominiumStorage;
  const role = String(tokenResult.claims["role"] || "").trim();

  if (!clientId || !condominiumId) {
    throw new Error("No se pudo resolver el contexto del condominio");
  }

  const idToken = await user.getIdToken();

  return {
    clientId,
    condominiumId,
    role,
    idToken,
  };
};

const ensureAdminRole = (role: string) => {
  if (role !== "admin") {
    throw new Error(
      "Solo los administradores pueden ejecutar reversas de pago"
    );
  }
};

const normalizeError = (error: any): string => {
  if (error?.response?.data?.message) {
    const raw = error.response.data.message;
    return Array.isArray(raw) ? raw.join(". ") : String(raw);
  }

  if (error?.message) {
    return String(error.message);
  }

  return "No fue posible completar la operación de reversa";
};

const usePaymentReversalStore = create<PaymentReversalState>()((set) => ({
  preview: null,
  commitResult: null,
  history: null,
  previewLoading: false,
  commitLoading: false,
  historyLoading: false,
  error: null,

  previewPaymentReversal: async (payload) => {
    set({ previewLoading: true, error: null, commitResult: null });

    try {
      const context = await resolveTenantContext();
      ensureAdminRole(context.role);

      const result = await paymentReversalService.preview(
        {
          clientId: context.clientId,
          condominiumId: context.condominiumId,
          paymentId: payload.paymentId,
          reason: payload.reason,
          notes: payload.notes,
          operationId: payload.operationId,
        },
        context.idToken,
        buildIdempotencyKey()
      );

      set({ preview: result, previewLoading: false, error: null });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ previewLoading: false, error: message });
      throw new Error(message);
    }
  },

  commitPaymentReversal: async (payload) => {
    set({ commitLoading: true, error: null });

    try {
      const context = await resolveTenantContext();
      ensureAdminRole(context.role);

      const reason = String(payload.reason || "").trim();
      if (!reason) {
        throw new Error("El motivo de reversa es obligatorio");
      }

      const result = await paymentReversalService.commit(
        {
          clientId: context.clientId,
          condominiumId: context.condominiumId,
          paymentId: payload.paymentId,
          reason,
          notes: payload.notes,
          operationId: payload.operationId,
        },
        context.idToken,
        buildIdempotencyKey()
      );

      set({ commitResult: result, commitLoading: false, error: null });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ commitLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchReversalHistory: async (filters = {}) => {
    set({ historyLoading: true, error: null });

    try {
      const context = await resolveTenantContext();
      ensureAdminRole(context.role);

      const result = await paymentReversalService.fetchHistory(
        {
          clientId: context.clientId,
          condominiumId: context.condominiumId,
        },
        context.idToken,
        filters
      );

      set({ history: result, historyLoading: false, error: null });
      return result;
    } catch (error: any) {
      const message = normalizeError(error);
      set({ historyLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      preview: null,
      commitResult: null,
      previewLoading: false,
      commitLoading: false,
      error: null,
    }),
}));

export default usePaymentReversalStore;
