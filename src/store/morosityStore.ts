import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";

interface MorosityState {
  clientId: string | null;
  condominiumId: string | null;
  isLoading: boolean;
  error: string | null;
  notifyDebtor: (debtorData: {
    userUID: string;
    amount: number;
    concept: string;
    numberCondominium: string;
  }) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useMorosityStore = create<MorosityState>()((set, get) => ({
  clientId: null,
  condominiumId: null,
  isLoading: false,
  error: null,

  initialize: async () => {
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
        throw new Error("Condominio no seleccionado");
      }

      set({ clientId, condominiumId, error: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  notifyDebtor: async (debtorData) => {
    const { clientId, condominiumId } = get();
    set({ isLoading: true, error: null });

    try {
      if (!clientId || !condominiumId) {
        throw new Error("Faltan datos de cliente o condominio");
      }

      const response = await fetch(
        import.meta.env.VITE_NOTIFICATION_MOROSIDAD_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            condominiumId,
            userUID: debtorData.userUID,
            debtDetails: {
              amount: debtorData.amount,
              concept: debtorData.concept,
              numberCondominium: debtorData.numberCondominium,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al enviar la notificación");
      }

      set({ isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || "Error al enviar la notificación";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
}));
