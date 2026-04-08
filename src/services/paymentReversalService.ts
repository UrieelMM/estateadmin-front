import axios from "axios";

const DEFAULT_TIMEOUT_MS = 30000;

const getServerBaseUrl = (): string => {
  const value = String(import.meta.env.VITE_URL_SERVER || "").trim();
  if (!value) {
    throw new Error("VITE_URL_SERVER no está configurado para reversa de pagos");
  }
  return value.replace(/\/$/, "");
};

const buildUrl = (path: string): string => `${getServerBaseUrl()}${path}`;

type ApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
};

export type PaymentReversalPreviewRequest = {
  clientId: string;
  condominiumId: string;
  paymentId: string;
  reason?: string;
  notes?: string;
  operationId?: string;
};

export type PaymentReversalCommitRequest = {
  clientId: string;
  condominiumId: string;
  paymentId: string;
  reason: string;
  notes?: string;
  operationId?: string;
};

export type PaymentReversalPreviewResponse = {
  operationId?: string;
  reversible?: boolean;
  message?: string;
  reasonCode?: string;
  reasons?: string[];
  impact?: Record<string, any>;
  impactSummary?: Record<string, any>;
  payment?: Record<string, any>;
  [key: string]: any;
};

export type PaymentReversalCommitResponse = {
  operationId?: string;
  status?: string;
  message?: string;
  [key: string]: any;
};

export type PaymentReversalHistoryFilters = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  paymentId?: string;
};

export type PaymentReversalHistoryResponse = {
  items?: Record<string, any>[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: any;
};

const buildHeaders = (idToken: string, idempotencyKey?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
};

const unwrap = <T>(raw: ApiEnvelope<T> | T): T => {
  if (raw && typeof raw === "object" && "data" in (raw as ApiEnvelope<T>)) {
    return ((raw as ApiEnvelope<T>).data ?? raw) as T;
  }
  return raw as T;
};

export const paymentReversalService = {
  async preview(
    payload: PaymentReversalPreviewRequest,
    idToken: string,
    idempotencyKey?: string
  ): Promise<PaymentReversalPreviewResponse> {
    const response = await axios.post<ApiEnvelope<PaymentReversalPreviewResponse>>(
      buildUrl("/payments/reversals/preview"),
      payload,
      {
        headers: buildHeaders(idToken, idempotencyKey),
        timeout: DEFAULT_TIMEOUT_MS,
      }
    );

    return unwrap<PaymentReversalPreviewResponse>(response.data);
  },

  async commit(
    payload: PaymentReversalCommitRequest,
    idToken: string,
    idempotencyKey: string
  ): Promise<PaymentReversalCommitResponse> {
    const response = await axios.post<ApiEnvelope<PaymentReversalCommitResponse>>(
      buildUrl("/payments/reversals/commit"),
      payload,
      {
        headers: buildHeaders(idToken, idempotencyKey),
        timeout: DEFAULT_TIMEOUT_MS,
      }
    );

    return unwrap<PaymentReversalCommitResponse>(response.data);
  },

  async fetchHistory(
    context: { clientId: string; condominiumId: string },
    idToken: string,
    filters: PaymentReversalHistoryFilters = {}
  ): Promise<PaymentReversalHistoryResponse> {
    const response = await axios.get<ApiEnvelope<PaymentReversalHistoryResponse>>(
      buildUrl("/payments/reversals/history"),
      {
        headers: buildHeaders(idToken),
        params: {
          clientId: context.clientId,
          condominiumId: context.condominiumId,
          ...filters,
        },
        timeout: DEFAULT_TIMEOUT_MS,
      }
    );

    return unwrap<PaymentReversalHistoryResponse>(response.data);
  },
};
