import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import * as XLSX from "xlsx";

interface User {
  id: string;
  role: string;
  // Otros campos del usuario que puedan existir
}

interface CondominiumLimitsState {
  condominiumLimit: number;
  currentUserCount: number;
  isLoading: boolean;
  error: string | null;
  getCondominiumLimit: () => Promise<number>;
  getCurrentUserCount: () => Promise<number>;
  validateExcelUsers: (file: File) => Promise<{
    isValid: boolean;
    message?: string;
    excelUserCount?: number;
  }>;
}

export const useCondominiumLimitsStore = create<CondominiumLimitsState>()(
  (set, get) => ({
    condominiumLimit: 0,
    currentUserCount: 0,
    isLoading: false,
    error: null,

    // Obtener el límite de condominos permitidos
    getCondominiumLimit: async () => {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ isLoading: false, error: "Usuario no autenticado" });
        throw new Error("Usuario no autenticado");
      }

      try {
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"];

        if (!clientId) {
          set({ isLoading: false, error: "ClientId no disponible" });
          throw new Error("ClientId no disponible");
        }

        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({
            isLoading: false,
            error: "No se encontró el ID del condominio",
          });
          throw new Error("No se encontró el ID del condominio");
        }

        // CORRECCIÓN: Eliminado el body para la petición GET
        const response = await fetch(
          `${
            import.meta.env.VITE_URL_SERVER
          }/clients/${clientId}/condominiums/${condominiumId}/limit`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
            // No incluir body en solicitudes GET
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Error al obtener límite de condominos: ${errorText}`
          );
        }

        const data = await response.json();
        const limit = data.condominiumLimit || 0;

        set({ condominiumLimit: limit, isLoading: false });
        return limit;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    // Obtener la cantidad actual de usuarios (excluyendo admin y admin-assistant)
    getCurrentUserCount: async () => {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ isLoading: false, error: "Usuario no autenticado" });
        throw new Error("Usuario no autenticado");
      }

      try {
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"];

        if (!clientId) {
          set({ isLoading: false, error: "ClientId no disponible" });
          throw new Error("ClientId no disponible");
        }

        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({
            isLoading: false,
            error: "No se encontró el ID del condominio",
          });
          throw new Error("No se encontró el ID del condominio");
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_URL_SERVER
          }/clients/${clientId}/condominiums/${condominiumId}/users`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Error al obtener usuarios del condominio: ${errorText}`
          );
        }

        const users: User[] = await response.json();

        // Filtramos los usuarios administrativos (admin y admin-assistant)
        const nonAdminUsers = users.filter(
          (user) => user.role !== "admin" && user.role !== "admin-assistant"
        );

        const count = nonAdminUsers.length;
        set({ currentUserCount: count, isLoading: false });
        return count;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    // Validar si los usuarios del Excel se pueden registrar según el límite
    validateExcelUsers: async (file: File) => {
      set({ isLoading: true, error: null });

      try {
        // Leer el archivo Excel y contar las filas
        const totalRows = await readExcelRowCount(file);

        // Restar 1 por la fila de encabezado
        const excelUserCount = totalRows - 1;

        // Obtener límite y usuarios actuales
        let limit = 0;
        let currentCount = 0;

        try {
          limit = await get().getCondominiumLimit();
        } catch (error) {
          set({
            isLoading: false,
            error: "Error al obtener límite de condominos",
          });
          throw error;
        }

        try {
          currentCount = await get().getCurrentUserCount();
        } catch (error) {
          set({
            isLoading: false,
            error: "Error al obtener cantidad de usuarios actuales",
          });
          throw error;
        }

        // Verificar si excede el límite
        const totalAfterImport = currentCount + excelUserCount;

        if (totalAfterImport > limit) {
          set({ isLoading: false });
          return {
            isValid: false,
            message: `No puedes importar ${excelUserCount} usuarios. Actualmente tienes ${currentCount} de ${limit} permitidos.`,
            excelUserCount,
          };
        }

        set({ isLoading: false });
        return {
          isValid: true,
          message: `Se importarán ${excelUserCount} usuarios (${totalAfterImport} de ${limit} permitidos)`,
          excelUserCount,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
  })
);

// Función auxiliar para leer el número de filas del Excel
const readExcelRowCount = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error("Resultado de lectura vacío");
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Obtener la primera hoja del Excel
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON para contar filas
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Simplemente devolver la longitud + 1 (para contar la fila de encabezado)
        // Pero asegurarse de que sea al menos 2 (encabezado + 1 fila)
        resolve(Math.max(jsonData.length + 1, 2));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsArrayBuffer(file);
  });
};
