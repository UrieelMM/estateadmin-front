// src/stores/condominiumStore.ts
import toast from "react-hot-toast";
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";

interface CondominiumState {
  sendExcel: (file: File) => Promise<void>;
  isProcessing: boolean;
}

// Constantes para la validación del archivo
const ALLOWED_EXTENSIONS_REGEX = /\.(xls|xlsx)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useCondominiumStore = create<CondominiumState>()((set, _get) => ({
  isProcessing: false,

  sendExcel: async (file: File) => {
    try {
      set({ isProcessing: true });

      // Validación del archivo: extensión y tamaño
      if (!ALLOWED_EXTENSIONS_REGEX.test(file.name)) {
        toast.error("El archivo debe ser un Excel (.xls, .xlsx)");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("El archivo no debe pesar más de 10MB");
        return;
      }

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Obtener el token y extraer el clientId de los claims
      let tokenResult;
      try {
        tokenResult = await getIdTokenResult(user);
      } catch (error) {
        console.error("Error al obtener token:", error);
        toast.error("Error al obtener token de autenticación");
        return;
      }

      const clientId = tokenResult.claims["clientId"];
      if (!clientId) {
        toast.error("ClientId no disponible");
        return;
      }

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        toast.error("No se encontró el ID del condominio");
        return;
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
      } else {
        toast.error(
          "Proceso completado, pero no se recibió el archivo de resultados esperado."
        );
      }
    } catch (error) {
      toast.error(
        `Ha ocurrido un error desconocido, por favor vuelve a intentarlo}`
      );
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
