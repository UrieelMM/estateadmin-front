// receiptsStore.ts
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";

type ReceiptStoreState = {
  loading: boolean;
  error: string | null;
  sendReceipts: (year: string, month: string, docType: string) => Promise<void>;
};

export const useReceiptStore = create<ReceiptStoreState>()((set) => ({
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

      // Definir la URL base del endpoint
      const endpoint = `https://sendreceiptsbyemail-aannml376a-uc.a.run.app`;

      // Preparar los datos para enviar como JSON
      const requestData = {
        year,
        month: monthFormatted,
        clientId,
        condominiumId,
        email,
        docType,
      };

      // Usar fetch con método POST
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        mode: "cors",
        credentials: "omit", // No incluir credenciales para evitar problemas de CORS
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

      const data = await response.text();
      toast.success(data);
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
