import axios from "axios";

const DEFAULT_TIMEOUT_MS = 30000;

const getServerBaseUrl = (): string => {
  const value = String(import.meta.env.VITE_URL_SERVER || "").trim();
  if (!value) {
    throw new Error("VITE_URL_SERVER no está configurado para edición de egresos");
  }
  return value.replace(/\/$/, "");
};

type TenantRequest = { clientId: string; condominiumId: string };

export type ExpenseEditLinkedSource = "pettyCash" | "maintenanceCost" | null;

export type ExpenseEditEligibility = {
  editable: boolean;
  amountEditable: boolean;
  periodClosed: boolean;
  linkedSource: ExpenseEditLinkedSource;
  lockReason: string | null;
  expense: {
    expenseId: string;
    folio: string;
    amount: number;
    concept: string;
    expenseDate: string;
    financialAccountId: string;
    description: string;
    invoiceUrl: string;
    editCount: number;
  };
};

export type ExpenseEditCommitPayload = {
  expenseId: string;
  expectedAmount: number;
  amount?: number;
  description?: string;
  invoiceUrl?: string;
  reason: string;
  notes?: string;
};

export type ExpenseEditCommitResponse = {
  editId: string;
  status: string;
  message?: string;
  expenseId: string;
  expenseFolio: string;
  changedFields: Array<"amount" | "description" | "invoiceUrl">;
  expense: {
    amount: number;
    description: string;
    invoiceUrl: string;
    editCount: number;
  };
  reconciliationMarkRemoved?: boolean;
};

const buildHeaders = (idToken: string, idempotencyKey?: string) => ({
  Authorization: `Bearer ${idToken}`,
  "Content-Type": "application/json",
  ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
});

const unwrap = <T>(raw: { data?: T } | T): T =>
  raw && typeof raw === "object" && "data" in raw ? ((raw as { data: T }).data ?? (raw as T)) : (raw as T);

export const expenseEditService = {
  async fetchEligibility(payload: TenantRequest & { expenseId: string }, idToken: string) {
    const response = await axios.get(`${getServerBaseUrl()}/expenses/edits/eligibility`, {
      headers: buildHeaders(idToken),
      params: payload,
      timeout: DEFAULT_TIMEOUT_MS,
    });
    return unwrap<ExpenseEditEligibility>(response.data);
  },

  async commit(
    payload: TenantRequest & ExpenseEditCommitPayload,
    idToken: string,
    idempotencyKey: string
  ) {
    const response = await axios.post(`${getServerBaseUrl()}/expenses/edits/commit`, payload, {
      headers: buildHeaders(idToken, idempotencyKey),
      timeout: DEFAULT_TIMEOUT_MS,
    });
    return unwrap<ExpenseEditCommitResponse>(response.data);
  },
};
