import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { create } from "./createStore";
import {
  expenseEditService,
  type ExpenseEditCommitPayload,
  type ExpenseEditCommitResponse,
  type ExpenseEditEligibility,
} from "../services/expenseEditService";

type ExpenseEditState = {
  eligibility: ExpenseEditEligibility | null;
  eligibilityLoading: boolean;
  commitLoading: boolean;
  error: string | null;
  loadExpenseEditEligibility: (expenseId: string) => Promise<ExpenseEditEligibility>;
  commitExpenseEdit: (
    payload: Omit<ExpenseEditCommitPayload, "invoiceUrl"> & { file?: File | null }
  ) => Promise<ExpenseEditCommitResponse>;
  reset: () => void;
};

const buildIdempotencyKey = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `expense-edit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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
    throw new Error("Solo los administradores pueden editar egresos");
  }

  return { clientId, condominiumId, idToken: await user.getIdToken() };
};

const normalizeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const raw = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (raw) return Array.isArray(raw) ? raw.join(". ") : String(raw);
  }
  if (error instanceof Error && error.message) return error.message;
  return "No fue posible editar el egreso";
};

const uploadReceipt = async (params: {
  clientId: string;
  condominiumId: string;
  folio: string;
  file: File;
}) => {
  const safeName = params.file.name.replace(/[^\w.-]+/g, "_").slice(-120) || "comprobante";
  const fileRef = ref(
    getStorage(),
    `clients/${params.clientId}/condominiums/${params.condominiumId}/expenses/${params.folio}/${Date.now()}_${safeName}`
  );
  await uploadBytes(fileRef, params.file);
  return getDownloadURL(fileRef);
};

const useExpenseEditStore = create<ExpenseEditState>()((set, get) => ({
  eligibility: null,
  eligibilityLoading: false,
  commitLoading: false,
  error: null,

  loadExpenseEditEligibility: async (expenseId) => {
    set({ eligibilityLoading: true, error: null, eligibility: null });
    try {
      const { clientId, condominiumId, idToken } = await resolveTenantContext();
      const result = await expenseEditService.fetchEligibility(
        { clientId, condominiumId, expenseId },
        idToken
      );
      set({ eligibility: result, eligibilityLoading: false });
      return result;
    } catch (error: unknown) {
      const message = normalizeError(error);
      set({ eligibilityLoading: false, error: message });
      throw new Error(message);
    }
  },

  commitExpenseEdit: async ({ file, ...payload }) => {
    set({ commitLoading: true, error: null });
    try {
      if (!payload.reason.trim()) throw new Error("El motivo de la edición es obligatorio");
      const folio = get().eligibility?.expense.folio || payload.expenseId;

      const { clientId, condominiumId, idToken } = await resolveTenantContext();
      const invoiceUrl = file
        ? await uploadReceipt({ clientId, condominiumId, folio, file })
        : undefined;
      const result = await expenseEditService.commit(
        {
          clientId,
          condominiumId,
          ...payload,
          invoiceUrl,
          reason: payload.reason.trim(),
          notes: payload.notes?.trim() || undefined,
        },
        idToken,
        buildIdempotencyKey()
      );
      set({ commitLoading: false });
      return result;
    } catch (error: unknown) {
      const message = normalizeError(error);
      set({ commitLoading: false, error: message });
      throw new Error(message);
    }
  },

  reset: () =>
    set({ eligibility: null, eligibilityLoading: false, commitLoading: false, error: null }),
}));

export default useExpenseEditStore;
