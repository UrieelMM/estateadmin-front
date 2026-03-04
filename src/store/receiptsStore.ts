// receiptsStore.ts
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";

type ReceiptStoreState = {
  loading: boolean;
  error: string | null;
  sendReceipts: (
    year: string,
    month: string,
    docType: "recibos" | "comprobantes"
  ) => Promise<void>;
};

export const useReceiptStore = create<ReceiptStoreState>()((set) => ({
  loading: false,
  error: null,

  sendReceipts: async (year, month, docType) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const idToken = await user.getIdToken();

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("ID del condominio no encontrado");
      }

      // Asegurar que el mes esté en formato de dos dígitos (ej: "03")
      const monthFormatted = month.toString().padStart(2, "0");

      // Definir la URL base del endpoint
      const endpoint = "https://us-central1-administracioncondominio-93419.cloudfunctions.net/sendReceiptsByEmail";

      // Preparar los datos para enviar como JSON
      const requestData = {
        year,
        month: monthFormatted,
        clientId,
        condominiumId,
        docType,
        targetUserId: user.uid,
      };

      // Usar fetch con método POST
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Lanzar error específico para 404
        if (response.status === 404) {
          throw new Error(
            "Resultados no encontrados para el período seleccionado."
          );
        }
        // Lanzar error genérico para otros errores HTTP
        throw new Error(
          `Error del servidor: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      const sentTo = data?.data?.sentTo ? ` a ${data.data.sentTo}` : "";
      const totalFiles = data?.data?.totalFiles ?? 0;
      toast.success(`Correo enviado${sentTo}. Archivos: ${totalFiles}.`);
    } catch (error: any) {
      console.error("Error al enviar recibos:", error);
      set({ error: error.message });
      // Usar directamente el mensaje del error (ahora más descriptivo)
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
}));
