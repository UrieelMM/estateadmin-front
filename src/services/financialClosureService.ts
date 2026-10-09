import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export type LedgerMovement = {
  id: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  concept: string;
  condominiumUnit: string;
  reference: string;
  accountId: string;
  description: string;
};

export type LedgerSummary = {
  incomeCents: number;
  expenseCents: number;
  incomeCount: number;
  expenseCount: number;
  digest: string;
};

export type ClosureRecord = LedgerSummary & {
  id: string;
  month: string;
  from: string;
  to: string;
  status: "closed" | "open";
  openingBalanceCents: number;
  closingBalanceCents: number;
  revision: number;
  closedAt?: { seconds: number };
};

const context = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Inicia sesión para continuar.");
  const token = await getIdTokenResult(user);
  const clientId = String(token.claims["clientId"] || "");
  const condominiumId = String(localStorage.getItem("condominiumId") || token.claims["condominiumId"] || "");
  if (!clientId || !condominiumId) throw new Error("Selecciona un condominio.");
  return { clientId, condominiumId, idToken: await user.getIdToken() };
};

const api = async () => {
  const tenant = await context();
  const baseURL = String(import.meta.env.VITE_URL_SERVER || "").replace(/\/$/, "");
  if (!baseURL) throw new Error("El servidor financiero no está configurado.");
  return { tenant, http: axios.create({ baseURL, timeout: 120000, headers: { Authorization: `Bearer ${tenant.idToken}` } }) };
};

export const financialClosureError = (error: any): string =>
  String(error?.response?.data?.message || error?.message || "No se pudo completar la operación.");

export const assertFinancialMonthOpen = async (dateValue: string): Promise<void> => {
  const date = String(dateValue || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Selecciona una fecha válida.");
  const { clientId, condominiumId } = await context();
  const snap = await getDoc(doc(getFirestore(), "clients", clientId, "condominiums", condominiumId, "financialClosures", date.slice(0, 7)));
  if (snap.exists() && ["closed", "closing"].includes(snap.data()?.status)) {
    throw new Error(`El mes ${date.slice(0, 7)} está cerrado. Solicita su reapertura antes de registrar o modificar movimientos.`);
  }
};

export const financialClosureService = {
  async movements(filters: { from: string; to: string; direction: "all" | "income" | "expense"; search: string; page: number; limit: number }) {
    const { tenant, http } = await api();
    const { data } = await http.get<{ items: LedgerMovement[]; total: number; page: number; limit: number; summary: LedgerSummary }>("/financial-closures/movements", {
      params: { clientId: tenant.clientId, condominiumId: tenant.condominiumId, ...filters },
    });
    return data;
  },
  async list(page = 1, limit = 10) {
    const { tenant, http } = await api();
    const { data } = await http.get<{ items: ClosureRecord[]; total: number; page: number; limit: number }>("/financial-closures", {
      params: { clientId: tenant.clientId, condominiumId: tenant.condominiumId, page, limit },
    });
    return data;
  },
  async get(month: string) {
    const { tenant, http } = await api();
    const { data } = await http.get<ClosureRecord | null>(`/financial-closures/${month}`, {
      params: { clientId: tenant.clientId, condominiumId: tenant.condominiumId },
    });
    return data;
  },
  async close(month: string, openingBalanceCents: number, expectedDigest: string) {
    const { tenant, http } = await api();
    const { data } = await http.post("/financial-closures/close", {
      clientId: tenant.clientId, condominiumId: tenant.condominiumId, month, openingBalanceCents, expectedDigest,
    });
    return data;
  },
  async requestReopen(month: string) {
    const { tenant, http } = await api();
    const { data } = await http.post<{ sent: boolean; phoneLast4: string; expiresInSeconds: number }>(`/financial-closures/${month}/request-reopen`, {
      clientId: tenant.clientId, condominiumId: tenant.condominiumId,
    });
    return data;
  },
  async reopen(month: string, code: string) {
    const { tenant, http } = await api();
    const { data } = await http.post(`/financial-closures/${month}/reopen`, { clientId: tenant.clientId, condominiumId: tenant.condominiumId, code });
    return data;
  },
};
