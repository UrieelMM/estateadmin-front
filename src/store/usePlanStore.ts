// src/store/usePlanStore.ts
import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { PLAN_FEATURES } from "../config/planFeatures";

export type PlanType = "basic" | "pro";

// Asegurar que al menos tengamos un objeto vacío si algo falla
const DEFAULT_FEATURES: Record<string, boolean> = {
  chatBot: false,
};

interface PlanState {
  currentPlan: PlanType;
  features: Record<string, boolean>;
  clientId: string | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
  hasAccess: (featureName: string) => boolean;
  fetchPlanDetails: () => Promise<void>;
  resetPlanState: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: "basic",
  features: DEFAULT_FEATURES,
  clientId: null,
  userId: null,
  loading: true,
  error: null,

  hasAccess: (featureName) => {
    const state = get();
    const auth = getAuth();

    // Verificación de cambio de usuario - si detectamos discrepancia, denegar acceso
    if (auth.currentUser?.uid !== state.userId) {
      console.warn(
        "Discrepancia de usuario detectada al verificar acceso a feature. Recargar plan."
      );
      return false;
    }

    // Verificación estricta: si no tenemos clientId o estamos cargando, denegar acceso
    if (state.loading || !state.clientId || !state.features) return false;

    // Para mayor seguridad, verificar que el cliente actual coincida con el almacenado
    if (!auth.currentUser) return false;

    // Verificar el feature específico
    return !!state.features[featureName];
  },

  fetchPlanDetails: async () => {
    // Primero limpiamos el estado para evitar información residual
    set({
      currentPlan: "basic",
      features: DEFAULT_FEATURES,
      clientId: null,
      userId: null,
      loading: true,
      error: null,
    });

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user, true); // Forzar refresco de token
      const clientId = tokenResult.claims["clientId"] as string;

      if (!clientId) {
        throw new Error(
          "No se encontró el ID del cliente en los claims del usuario"
        );
      }

      const db = getFirestore();

      // Obtener el plan directamente del documento del cliente
      const clientDoc = await getDoc(doc(db, `clients/${clientId}`));

      if (!clientDoc.exists()) {
        throw new Error("Cliente no encontrado");
      }

      const clientData = clientDoc.data();
      const plan = (clientData.plan || "basic") as PlanType;

      // Usar los features del plan si existen, o un fallback seguro
      const planFeatures = PLAN_FEATURES[plan] || DEFAULT_FEATURES;

      console.log(
        `Plan cargado para clientId ${clientId}, userId ${user.uid}: ${plan}`,
        planFeatures
      );

      set({
        currentPlan: plan,
        features: planFeatures,
        clientId: clientId,
        userId: user.uid,
        loading: false,
      });
    } catch (error: any) {
      console.error("Error al cargar detalles del plan:", error);
      // Establecer valores por defecto seguros
      set({
        currentPlan: "basic",
        features: DEFAULT_FEATURES,
        clientId: null,
        userId: null,
        loading: false,
        error: error.message || "Error al obtener detalles del plan",
      });
    }
  },

  resetPlanState: () => {
    console.log("Reseteando estado del plan");
    set({
      currentPlan: "basic",
      features: DEFAULT_FEATURES,
      clientId: null,
      userId: null,
      loading: true,
      error: null,
    });
  },
}));
