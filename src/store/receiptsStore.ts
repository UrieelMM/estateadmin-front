// receiptsStore.ts
import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import axios from "axios";

type ReceiptStoreState = {
  loading: boolean;
  error: string | null;
  sendReceipts: (year: string, month: string, docType: string) => Promise<void>;
};

export const useReceiptStore = create<ReceiptStoreState>((set) => ({
  loading: false,
  error: null,

  sendReceipts: async (year: string, month: string, docType: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("ID del condominio no encontrado");
      }

      // Obtener el email (aquí se usa un email de prueba; descomenta y ajusta según corresponda)
      const dataUserActiveStr = localStorage.getItem("dataUserActive");
      if (!dataUserActiveStr) {
        throw new Error("dataUserActive no encontrada en localStorage");
      }
      let email = "";
      try {
        // const dataUserActive = JSON.parse(dataUserActiveStr);
        // email = dataUserActive.email;
        email = "urieel.mm@gmail.com";
      } catch (error) {
        throw new Error("Error al parsear dataUserActive");
      }
      if (!email) {
        throw new Error("Email no encontrado en dataUserActive");
      }

      // Asegurar que el mes esté en formato de dos dígitos (ej: "03")
      const monthFormatted = month.toString().padStart(2, "0");

      // Construir el endpoint usando el campo compuesto esperado (yearMonth = "yyyy-MM")
      const endpoint = `https://us-central1-administracioncondominio-93419.cloudfunctions.net/sendReceiptsByEmail?year=${year}&month=${monthFormatted}&clientId=${clientId}&condominiumId=${condominiumId}&email=${encodeURIComponent(
        email
      )}&docType=${docType}`;

      const response = await axios.get(endpoint);
      alert(response.data);
    } catch (error: any) {
      console.error("Error al enviar recibos:", error);
      set({ error: error.message });
      alert("Error: " + error.message);
    } finally {
      set({ loading: false });
    }
  },
}));
