import axios from "axios";

const DEFAULT_TIMEOUT_MS = 30000;

const getServerBaseUrl = (): string => {
  const value = String(import.meta.env.VITE_URL_SERVER || "").trim();
  if (!value) {
    throw new Error("VITE_URL_SERVER no está configurado para reversa de egresos");
  }
  return value.replace(/\/$/, "");
};

type TenantRequest = { clientId: string; condominiumId: string };

export type ExpenseReversalPreviewResponse = {
  operationId: string;
  reversible: boolean;
  message?: string;
  expiresAt?: string;
  expense?: {
    expenseId: string;
    folio: string;
    amount: number;
    concept: string;
    expenseDate: string;
    financialAccountId: string;
  };
};

export type ExpenseReversalCommitResponse = {
  operationId: string;
  reversalId: string;
  status: string;
  message?: string;
  expenseId: string;
  expenseFolio: string;
  reconciliationMarkRemoved?: boolean;
};

export type ExpenseReversalHistoryItem = {
  id: string;
  operationId: string;
  expenseId: string;
  expenseFolio: string;
  concept: string;
  amount: number;
  expenseDate: string;
  reason: string;
  notes: string;
  status: string;
  performedByName: string;
  performedAt: string | null;
};

export type ExpenseReversalHistoryFilters = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  folio?: string;
};

export type ExpenseReversalHistoryResponse = {
  items: ExpenseReversalHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

const buildHeaders = (idToken: string, idempotencyKey?: string) => ({
  Authorization: `Bearer ${idToken}`,
  "Content-Type": "application/json",
  ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
});

const unwrap = <T>(raw: { data?: T } | T): T =>
  raw && typeof raw === "object" && "data" in raw ? ((raw as { data: T }).data ?? (raw as T)) : (raw as T);

export const expenseReversalService = {
  async preview(payload: TenantRequest & { expenseId: string }, idToken: string) {
    const response = await axios.post(
      `${getServerBaseUrl()}/expenses/reversals/preview`,
      payload,
      { headers: buildHeaders(idToken), timeout: DEFAULT_TIMEOUT_MS }
    );
    return unwrap<ExpenseReversalPreviewResponse>(response.data);
  },

  async commit(
    payload: TenantRequest & {
      expenseId: string;
      operationId: string;
      reason: string;
      notes?: string;
    },
    idToken: string,
    idempotencyKey: string
  ) {
    const response = await axios.post(
      `${getServerBaseUrl()}/expenses/reversals/commit`,
      payload,
      { headers: buildHeaders(idToken, idempotencyKey), timeout: DEFAULT_TIMEOUT_MS }
    );
    return unwrap<ExpenseReversalCommitResponse>(response.data);
  },

  async fetchHistory(
    context: TenantRequest,
    idToken: string,
    filters: ExpenseReversalHistoryFilters = {}
  ) {
    const response = await axios.get(`${getServerBaseUrl()}/expenses/reversals/history`, {
      headers: buildHeaders(idToken),
      params: { ...context, ...filters },
      timeout: DEFAULT_TIMEOUT_MS,
    });
    return unwrap<ExpenseReversalHistoryResponse>(response.data);
  },
};
