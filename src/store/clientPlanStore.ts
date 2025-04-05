import { create } from "./createStore";
import axios from "axios";

// Tipos para los planes de cliente
export type ClientPlan = "Basic" | "Pro" | "Enterprise";

// Tipo para la respuesta del endpoint
interface ClientPlanResponse {
  plan: ClientPlan;
  proFunctions: string[];
}

// Interfaz del store
interface ClientPlanStore {
  // Estado
  clientId: string | null;
  condominiumId: string | null;
  plan: ClientPlan | null;
  proFunctions: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  // Timestamp de la última petición para evitar múltiples solicitudes
  lastRequestTimestamp: number | null;
  // Caché para evitar solicitudes repetidas
  requestCache: Record<
    string,
    { timestamp: number; response: ClientPlanResponse }
  >;

  // Acciones
  setClientData: (clientId: string, condominiumId: string) => void;
  updateCondominiumId: (condominiumId: string) => void;
  fetchClientPlan: () => Promise<void>;
  resetClientPlan: () => void;
  hasAccess: (functionName: string) => boolean;
  // Para depuración
  forceUpdate: () => void; // Función para forzar una actualización
}

export const useClientPlanStore = create<ClientPlanStore>()((set, get) => ({
  // Estado inicial
  clientId: null,
  condominiumId: null,
  plan: null,
  proFunctions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  // Timestamp de la última petición para evitar múltiples solicitudes
  lastRequestTimestamp: null as number | null,
  // Caché para evitar solicitudes repetidas
  requestCache: {} as Record<
    string,
    { timestamp: number; response: ClientPlanResponse }
  >,

  // Establecer los datos del cliente
  setClientData: (clientId: string, condominiumId: string) => {
    if (!clientId || !condominiumId) {
      return;
    }

    // Si ya tenemos estos datos, no hacemos nada
    const currentState = get();
    if (
      currentState.clientId === clientId &&
      currentState.condominiumId === condominiumId
    ) {
      return;
    }

    // Si los datos cambiaron, actualizamos el estado y obtenemos el plan
    set({ clientId, condominiumId });

    // Después de un pequeño delay para evitar múltiples solicitudes
    setTimeout(() => {
      // Verificar que los IDs no hayan cambiado durante el timeout
      if (
        get().clientId === clientId &&
        get().condominiumId === condominiumId &&
        !get().isLoading
      ) {
        get().fetchClientPlan();
      }
    }, 100);
  },

  // Actualizar solo el condominiumId (útil cuando el usuario cambia de condominio)
  updateCondominiumId: (condominiumId: string) => {
    if (!condominiumId) return;

    // Si es el mismo condominio, no hacemos nada
    if (get().condominiumId === condominiumId) {
      return;
    }

    set({ condominiumId });

    // Volver a cargar el plan con el nuevo condominiumId
    const clientId = get().clientId;
    if (clientId && condominiumId) {
      get().fetchClientPlan();
    }
  },

  // Obtener el plan del cliente desde el servidor
  fetchClientPlan: async () => {
    const {
      clientId,
      condominiumId,
      isLoading,
      lastRequestTimestamp,
      requestCache,
    } = get();

    // Evitar múltiples solicitudes simultáneas
    if (isLoading) return;

    if (!clientId) {
      set({ error: "No hay ID de cliente establecido" });
      return;
    }

    if (!condominiumId) {
      set({ error: "No hay ID de condominio establecido" });
      return;
    }

    // Crear una clave única para esta combinación
    const cacheKey = `${clientId}_${condominiumId}`;

    // Verificar si tenemos una respuesta en caché reciente (menos de 5 minutos)
    const now = Date.now();
    const cachedData = requestCache[cacheKey];
    if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
      // Usar datos de caché
      set({
        plan: cachedData.response.plan,
        proFunctions: cachedData.response.proFunctions || [],
        error: null,
        lastUpdated: cachedData.timestamp,
      });
      return;
    }

    // Limitar la frecuencia de solicitudes (no más de una cada 2 segundos)
    if (lastRequestTimestamp && now - lastRequestTimestamp < 2000) {
      return;
    }

    set({ isLoading: true, error: null, lastRequestTimestamp: now });

    try {
      const url = `${import.meta.env.VITE_URL_SERVER}/tools/client-plan`;

      const response = await axios.post<ClientPlanResponse>(url, {
        clientId,
        condominiumId,
      });

      // Si la respuesta está vacía o incompleta
      if (!response.data || !response.data.plan) {
        const errorMsg = "La API no devolvió un plan válido";
        set({
          error: errorMsg,
          isLoading: false,
        });
        return;
      }

      // Actualizar la caché
      const updatedCache = {
        ...requestCache,
        [cacheKey]: {
          timestamp: now,
          response: response.data,
        },
      };

      // Actualizar con los datos recibidos
      set({
        plan: response.data.plan,
        proFunctions: response.data.proFunctions || [],
        isLoading: false,
        error: null,
        lastUpdated: now,
        requestCache: updatedCache,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error desconocido";

      set({
        error: `Error al cargar el plan del cliente: ${errorMessage}`,
        isLoading: false,
      });
    }
  },

  // Reiniciar el estado
  resetClientPlan: () =>
    set({
      clientId: null,
      condominiumId: null,
      plan: null,
      proFunctions: [],
      error: null,
      lastUpdated: null,
    }),

  // Verificar si tiene acceso a una función específica
  hasAccess: (functionName: string) => {
    const { plan, proFunctions } = get();

    // Si no tiene plan asignado, no tiene acceso
    if (!plan) return false;

    // Si es Enterprise, tiene acceso a todo
    if (plan === "Enterprise") return true;

    // Si es Pro, verificar si la función está en su lista de funciones permitidas
    if (plan === "Pro") {
      // Verificación explícita para más claridad
      const hasFunction = proFunctions.includes(functionName);
      return hasFunction;
    }

    // Si es Basic, solo tiene acceso a funciones básicas (que no son Pro)
    return false;
  },

  // Forzar una actualización (útil para depuración)
  forceUpdate: () => {
    const { clientId, condominiumId } = get();

    if (clientId && condominiumId) {
      get().fetchClientPlan();
    } else {
      console.error(
        "[clientPlanStore] No se puede forzar la actualización sin clientId y condominiumId"
      );
    }
  },
}));
