import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";

export type OpeningCredit = {
  id: string;
  userId: string;
  userName: string;
  numberCondominium: string;
  tower: string;
  amount: number;
  cutoffDate: string | null;
  notes: string;
  status: "active" | "cancelled";
  cancelReason: string;
  createdByName: string;
  createdAt: string | null;
  cancelledAt: string | null;
};

const api = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Inicia sesión para continuar.");
  const token = await getIdTokenResult(user);
  const clientId = String(token.claims["clientId"] || "");
  const condominiumId = String(
    localStorage.getItem("condominiumId") || token.claims["condominiumId"] || ""
  );
  if (!clientId || !condominiumId) throw new Error("Selecciona un condominio.");
  const baseURL = String(import.meta.env.VITE_URL_SERVER || "").replace(/\/$/, "");
  if (!baseURL) throw new Error("El servidor financiero no está configurado.");
  return {
    tenant: { clientId, condominiumId },
    http: axios.create({
      baseURL,
      timeout: 30000,
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    }),
  };
};

export const openingCreditError = (error: any): string => {
  const raw = error?.response?.data?.message;
  if (raw) return Array.isArray(raw) ? raw.join(". ") : String(raw);
  return String(error?.message || "No se pudo completar la operación.");
};

export const openingCreditService = {
  async list(): Promise<OpeningCredit[]> {
    const { tenant, http } = await api();
    const { data } = await http.get("/opening-credits", { params: tenant });
    return data?.data?.items || [];
  },

  async create(payload: {
    userId: string;
    amount: number;
    cutoffDate?: string;
    notes?: string;
  }): Promise<OpeningCredit & { totalCreditBalanceCents: number }> {
    const { tenant, http } = await api();
    const { data } = await http.post("/opening-credits", { ...tenant, ...payload });
    return data.data;
  },

  async cancel(
    id: string,
    reason: string
  ): Promise<{ userId: string; totalCreditBalanceCents: number }> {
    const { tenant, http } = await api();
    const { data } = await http.post(`/opening-credits/${encodeURIComponent(id)}/cancel`, {
      ...tenant,
      reason,
    });
    return data.data;
  },
};
