// src/store/aiContextMiddleware.ts

import { StateCreator, StoreApi } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { debounce } from "lodash"; // Asegúrate de tener lodash instalado
import { syncWithAIContext } from "../../services/aiContextService";

// Tipos para la configuración
export interface AIContextConfig<T> {
  // Nombre del store para identificarlo en los logs y metadata
  storeName: string;
  // Claves específicas a incluir (si no se especifica, se incluyen todas menos las excluidas)
  includeKeys?: (keyof T)[];
  // Claves a excluir (datos no relevantes para IA como loading, error, etc.)
  excludeKeys?: (keyof T)[];
  // Tiempo de debounce en ms para evitar muchas llamadas
  debounceTime?: number;
  // Función personalizada para procesar/transformar los datos antes de enviarlos
  processData?: (state: T) => any;
  // Si se debe sincronizar automáticamente en cada cambio de estado
  autoSync?: boolean;
}

// Caché para almacenar el último estado enviado y evitar duplicados
const lastSyncedState = new Map<string, string>();

// Función para enviar datos al backend
const syncWithBackend = async (
  storeName: string,
  data: any,
  clientId: string,
  condominiumId: string
) => {
  try {
    // Crear hash simple del contenido para comparar con caché
    const contentHash = JSON.stringify(data);
    const cacheKey = `${clientId}-${condominiumId}-${storeName}`;

    // Verificar si los datos son idénticos a la última sincronización
    if (lastSyncedState.get(cacheKey) === contentHash) {
      console.log(
        `[AI Sync] No cambios detectados en ${storeName}, omitiendo sincronización`
      );
      return;
    }

    // Enviar al backend solo si hay cambios
    const success = await syncWithAIContext(
      storeName,
      data,
      clientId,
      condominiumId
    );

    if (success) {
      // Actualizar caché con este nuevo estado
      lastSyncedState.set(cacheKey, contentHash);
      console.log(`[AI Sync] ${storeName} sincronizado exitosamente`);
    }
  } catch (error) {
    console.error(`[AI Sync] Error al sincronizar ${storeName}:`, error);
  }
};

// El middleware principal que se aplicará a los stores
export const withAIContext =
  <T extends object>(config: AIContextConfig<T>) =>
  (createState: StateCreator<T>) =>
  (
    set: StoreApi<T>["setState"],
    get: StoreApi<T>["getState"],
    api: StoreApi<T>
  ) => {
    // Crear la función de sincronización con debounce
    const debouncedSync = debounce(async (state: T) => {
      try {
        // Verificar autenticación
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) return;

        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) return;

        // Procesar el estado según la configuración
        let dataToSync: any;

        if (config.processData) {
          // Usar la función personalizada si está definida
          dataToSync = config.processData(state);
        } else {
          // Filtrar según reglas de inclusión/exclusión
          dataToSync = Object.fromEntries(
            Object.entries(state).filter(([key]) => {
              const typedKey = key as keyof T;

              // Excluir funciones y métodos
              if (typeof state[typedKey] === "function") return false;

              // Aplicar reglas de inclusión/exclusión
              if (config.includeKeys && !config.includeKeys.includes(typedKey))
                return false;
              if (config.excludeKeys && config.excludeKeys.includes(typedKey))
                return false;

              return true;
            })
          );
        }

        // Enviar al backend
        await syncWithBackend(
          config.storeName,
          dataToSync,
          clientId,
          condominiumId
        );
      } catch (error) {
        console.error("[AI Sync] Error en middleware:", error);
      }
    }, config.debounceTime || 2000);

    // Crear función de establecimiento personalizada que intercepta los cambios
    const customSet: typeof set = (updater, replace) => {
      // Aplicar la actualización original
      set(updater, replace);

      // Solo sincronizar si autoSync está habilitado (por defecto true)
      if (config.autoSync !== false) {
        debouncedSync(get());
      }
    };

    // Agregar método manual de sincronización al API del store
    const storeApi = api as StoreApi<T & { syncWithAI: () => Promise<void> }>;

    // Método que permite sincronizar manualmente
    const syncWithAI = async () => {
      await debouncedSync.flush(); // Ejecuta inmediatamente si hay una sincronización pendiente
      debouncedSync(get()); // Programa una nueva sincronización
    };

    // Crear el estado con el set personalizado
    const state = createState(customSet, get, storeApi);

    // Añadir el método de sincronización manual
    return {
      ...state,
      syncWithAI,
    };
  };

// Función de utilidad para forzar sincronización desde otros componentes
export const triggerAISync = async (storeName: string, storeApi: any) => {
  if (storeApi && typeof storeApi.syncWithAI === "function") {
    console.log(`[AI Sync] Sincronización manual iniciada para ${storeName}`);
    await storeApi.syncWithAI();
    return true;
  }
  return false;
};
