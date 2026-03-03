// src/stores/condominiumStore.ts
import toast from "react-hot-toast";
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";

interface CondominiumState {
  sendExcel: (file: File) => Promise<boolean>;
  dryRunMassUpsert: (
    file: File,
    mode?: "upsert" | "update_only" | "create_only",
    options?: {
      skipEmptyUpdates?: boolean;
      matchBy?: "auto" | "email" | "number_tower";
      allowRoleUpdate?: boolean;
      allowEmailUpdate?: boolean;
      allowNumberUpdate?: boolean;
    }
  ) => Promise<{
    ok: boolean;
    operationId: string;
    expiresAt: string;
    mode: string;
    options: Record<string, unknown>;
    fileHash?: string;
    summary: {
      totalRows: number;
      validRows: number;
      errorRows: number;
      willCreate: number;
      willUpdate: number;
      willSkip: number;
    };
    rows: Array<{
      rowNumber: number;
      action: "create" | "update" | "skip" | "error";
      matchStrategy?: string;
      reasons?: string[];
      normalizedPayload?: Record<string, unknown>;
      matchedUserId?: string;
    }>;
  }>;
  commitMassUpsert: (
    file: File,
    operationId: string
  ) => Promise<{
    ok: boolean;
    operationId: string;
    summary: {
      createdCount: number;
      updatedCount: number;
      skippedCount: number;
      errorCount: number;
    };
    errors?: Array<{ rowNumber: number; reason: string }>;
    resultFile?: {
      fileName: string;
      mimeType: string;
      base64: string;
    };
  }>;
  isProcessing: boolean;
}

// Constantes para la validación del archivo
const ALLOWED_EXTENSIONS_REGEX = /\.(xls|xlsx)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useCondominiumStore = create<CondominiumState>()((set, _get) => ({
  isProcessing: false,

  dryRunMassUpsert: async (file, mode = "upsert", options = {}) => {
    if (!ALLOWED_EXTENSIONS_REGEX.test(file.name)) {
      throw new Error("El archivo debe ser un Excel (.xls, .xlsx)");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo no debe pesar más de 10MB");
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = String(tokenResult.claims["clientId"] || "");
    if (!clientId) {
      throw new Error("ClientId no disponible");
    }

    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) {
      throw new Error("No se encontró el ID del condominio");
    }

    const idToken = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("condominiumId", condominiumId);
    formData.append("mode", mode);
    formData.append("options", JSON.stringify(options));

    const response = await fetch(
      `${import.meta.env.VITE_URL_SERVER}/users-auth/upsert-condominiums/dry-run`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMessage = "Error al ejecutar la prevalidación";
      try {
        const errorData = await response.json();
        errorMessage = Array.isArray(errorData?.message)
          ? errorData.message.join(" ")
          : errorData?.message || errorData?.error || errorMessage;
      } catch {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  commitMassUpsert: async (file, operationId) => {
    if (!operationId) {
      throw new Error("operationId requerido");
    }
    if (!ALLOWED_EXTENSIONS_REGEX.test(file.name)) {
      throw new Error("El archivo debe ser un Excel (.xls, .xlsx)");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo no debe pesar más de 10MB");
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = String(tokenResult.claims["clientId"] || "");
    if (!clientId) {
      throw new Error("ClientId no disponible");
    }

    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) {
      throw new Error("No se encontró el ID del condominio");
    }

    const idToken = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("condominiumId", condominiumId);
    formData.append("operationId", operationId);

    const response = await fetch(
      `${import.meta.env.VITE_URL_SERVER}/users-auth/upsert-condominiums/commit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMessage = "Error al confirmar la importación";
      try {
        const errorData = await response.json();
        errorMessage = Array.isArray(errorData?.message)
          ? errorData.message.join(" ")
          : errorData?.message || errorData?.error || errorMessage;
      } catch {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  sendExcel: async (file: File) => {
    try {
      set({ isProcessing: true });

      // Validación del archivo: extensión y tamaño
      if (!ALLOWED_EXTENSIONS_REGEX.test(file.name)) {
        toast.error("El archivo debe ser un Excel (.xls, .xlsx)");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("El archivo no debe pesar más de 10MB");
        return false;
      }

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error("Usuario no autenticado");
        return false;
      }

      // Obtener el token y extraer el clientId de los claims
      let tokenResult;
      try {
        tokenResult = await getIdTokenResult(user);
      } catch (error) {
        console.error("Error al obtener token:", error);
        toast.error("Error al obtener token de autenticación");
        return false;
      }

      const clientId = tokenResult.claims["clientId"];
      if (!clientId) {
        toast.error("ClientId no disponible");
        return false;
      }

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        toast.error("No se encontró el ID del condominio");
        return false;
      }

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
        }
      );

      if (!response.ok) {
        // Si hay un error, intentar obtener el mensaje detallado
        let errorMessage = "Error al procesar el archivo";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si no se puede parsear como JSON, usar el texto completo
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      // Verificar el tipo de contenido para saber si estamos recibiendo un Excel
      const contentType = response.headers.get("Content-Type");
      const contentDisposition = response.headers.get("Content-Disposition");

      if (
        contentType?.includes("spreadsheetml") ||
        contentDisposition?.includes("attachment")
      ) {
        // Es un archivo Excel, proceder a descargarlo
        const blob = await response.blob();
        const fileName = contentDisposition
          ? extractFilenameFromContentDisposition(contentDisposition)
          : "resultado-registro-condominos.xlsx";

        // Crear un enlace para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        // Limpiar después de la descarga
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          "Proceso completado, se ha descargado un archivo con los resultados del registro."
        );
        return true;
      } else {
        toast.error(
          "Proceso completado, pero no se recibió el archivo de resultados esperado."
        );
        return false;
      }
    } catch (error) {
      toast.error(
        `Ha ocurrido un error desconocido, por favor vuelve a intentarlo}`
      );
      return false;
    } finally {
      set({ isProcessing: false });
    }
  },
}));

// Función auxiliar para extraer el nombre del archivo de la cabecera Content-Disposition
function extractFilenameFromContentDisposition(
  contentDisposition: string
): string {
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = filenameRegex.exec(contentDisposition);
  if (matches && matches[1]) {
    return matches[1].replace(/['"]/g, "");
  }
  return "resultado-registro-condominos.xlsx";
}
