// src/stores/condominiumStore.ts
import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";

interface CondominiumState {
  sendExcel: (file: File, condominiumId: string) => Promise<void>;
}

// Constantes para la validación del archivo
const ALLOWED_EXTENSIONS_REGEX = /\.(xls|xlsx)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useCondominiumStore = create<CondominiumState>(() => ({
  sendExcel: async (file: File, condominiumId: string) => {
    // Validación del archivo: extensión y tamaño
    if (!ALLOWED_EXTENSIONS_REGEX.test(file.name)) {
      alert("El archivo debe ser un Excel (.xls, .xlsx)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("El archivo no debe pesar más de 10MB");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    // Obtener el token y extraer el clientId de los claims
    let tokenResult;
    try {
      tokenResult = await getIdTokenResult(user);
    } catch (error) {
      console.error("Error al obtener token:", error);
      alert("Error al obtener token de autenticación");
      return;
    }

    const clientId = tokenResult.claims["clientId"];
    if (!clientId) {
      alert("ClientId no disponible");
      return;
    }

    try {
      // Preparar los datos a enviar en el FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("condominiumId", condominiumId);
      formData.append("clientId", String(clientId));

      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/register-condominiums`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al enviar el formulario: ${errorText}`);
      }

      // Ya no se descarga el excel; se asume que el registro fue exitoso.
      return;
    } catch (error) {
      console.error("Error al enviar el formulario: ", error);
      throw error;
    }
  },
}));
