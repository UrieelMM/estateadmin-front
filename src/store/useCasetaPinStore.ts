// useCasetaPinStore.ts
//
// Store del PIN de caseta para visitas agendadas.
// Habla con los endpoints administrativos (Bearer token de Firebase):
//   GET    /scheduled-visits-caseta/pin/status
//   POST   /scheduled-visits-caseta/pin
//   DELETE /scheduled-visits-caseta/pin
//
// El PIN nunca se guarda en estado persistente: solo se mantiene en memoria
// el resultado de la creación para mostrarlo al admin la primera vez.

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";

const API_BASE = (
  import.meta.env.VITE_URL_SERVER ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

export interface CasetaPinStatus {
  configured: boolean;
  updatedAt: any | null; // Timestamp del backend
  updatedBy: string | null;
}

interface CasetaPinState {
  status: CasetaPinStatus | null;
  // PIN en plano que el admin acaba de generar / definir.
  // Se guarda solo en memoria para mostrarlo una vez y luego se limpia.
  lastGeneratedPin: string | null;

  loadingStatus: boolean;
  saving: boolean;
  deleting: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  setPin: (pin: string) => Promise<boolean>;
  deletePin: () => Promise<boolean>;
  clearLastGenerated: () => void;
}

const getAuthContext = async (): Promise<{
  idToken: string;
  clientId: string;
  condominiumId: string;
} | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;

  const tokenResult = await getIdTokenResult(user);
  const clientId = tokenResult.claims["clientId"] as string | undefined;
  const condominiumId = localStorage.getItem("condominiumId");

  if (!clientId || !condominiumId) return null;
  const idToken = await user.getIdToken();
  return { idToken, clientId, condominiumId };
};

const extractError = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.reason === "string") return data.reason;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message) && data.message[0])
      return String(data.message[0]);
  } catch (_e) {}
  return fallback;
};

export const useCasetaPinStore = create<CasetaPinState>()((set, get) => ({
  status: null,
  lastGeneratedPin: null,
  loadingStatus: false,
  saving: false,
  deleting: false,
  error: null,

  fetchStatus: async () => {
    set({ loadingStatus: true, error: null });
    try {
      if (!API_BASE) throw new Error("URL del backend no configurada");
      const ctx = await getAuthContext();
      if (!ctx) throw new Error("Sesión o condominio no disponibles");

      const url = `${API_BASE}/scheduled-visits-caseta/pin/status?clientId=${encodeURIComponent(
        ctx.clientId,
      )}&condominiumId=${encodeURIComponent(ctx.condominiumId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${ctx.idToken}` },
      });

      if (!response.ok) {
        throw new Error(
          await extractError(response, "Error al consultar el PIN"),
        );
      }
      const data = await response.json();
      set({
        status: {
          configured: !!data.configured,
          updatedAt: data.updatedAt ?? null,
          updatedBy: data.updatedBy ?? null,
        },
        loadingStatus: false,
      });
    } catch (err: any) {
      console.error("Error fetchStatus PIN:", err);
      set({
        loadingStatus: false,
        error: err?.message || "Error al consultar el PIN",
      });
    }
  },

  setPin: async (pin: string) => {
    set({ saving: true, error: null });
    try {
      if (!/^\d{6}$/.test(pin)) {
        throw new Error("El PIN debe ser de exactamente 6 dígitos");
      }
      if (!API_BASE) throw new Error("URL del backend no configurada");
      const ctx = await getAuthContext();
      if (!ctx) throw new Error("Sesión o condominio no disponibles");

      const response = await fetch(
        `${API_BASE}/scheduled-visits-caseta/pin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ctx.idToken}`,
          },
          body: JSON.stringify({
            clientId: ctx.clientId,
            condominiumId: ctx.condominiumId,
            pin,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await extractError(response, "Error al guardar el PIN"));
      }

      set({
        saving: false,
        lastGeneratedPin: pin,
      });

      toast.success("PIN configurado");
      // Refrescar status para que el badge se actualice
      await get().fetchStatus();
      return true;
    } catch (err: any) {
      console.error("Error setPin:", err);
      set({ saving: false, error: err?.message || "Error al guardar el PIN" });
      toast.error(err?.message || "Error al guardar el PIN");
      return false;
    }
  },

  deletePin: async () => {
    set({ deleting: true, error: null });
    try {
      if (!API_BASE) throw new Error("URL del backend no configurada");
      const ctx = await getAuthContext();
      if (!ctx) throw new Error("Sesión o condominio no disponibles");

      const response = await fetch(
        `${API_BASE}/scheduled-visits-caseta/pin`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ctx.idToken}`,
          },
          body: JSON.stringify({
            clientId: ctx.clientId,
            condominiumId: ctx.condominiumId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await extractError(response, "Error al eliminar el PIN"),
        );
      }

      set({
        deleting: false,
        lastGeneratedPin: null,
        status: { configured: false, updatedAt: null, updatedBy: null },
      });
      toast.success("PIN eliminado");
      return true;
    } catch (err: any) {
      console.error("Error deletePin:", err);
      set({ deleting: false, error: err?.message || "Error al eliminar el PIN" });
      toast.error(err?.message || "Error al eliminar el PIN");
      return false;
    }
  },

  clearLastGenerated: () => set({ lastGeneratedPin: null }),
}));

// Genera un PIN de 6 dígitos con crypto.getRandomValues (criptográficamente
// fuerte). Asegura que el primer dígito no sea 0 para que siempre tenga 6
// caracteres como string.
export function generateSecurePin(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Mapea a 100000–999999
  const pin = (buf[0] % 900000) + 100000;
  return String(pin);
}
