import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Condominium {
  id: string;
  name: string;
  address?: string;
  createdAt?: Date;
}

interface CondominiumStore {
  condominiums: Condominium[];
  selectedCondominium: Condominium | null;
  isLoading: boolean;
  error: string | null;
  fetchCondominiums: () => Promise<void>;
  setSelectedCondominium: (condominium: Condominium) => Promise<void>;
  getCurrentCondominiumId: () => string | null;
}

export const useCondominiumStore = create<CondominiumStore>()((set, get) => ({
  condominiums: [],
  selectedCondominium: null,
  isLoading: false,
  error: null,

  getCurrentCondominiumId: () => {
    return localStorage.getItem("condominiumId");
  },

  fetchCondominiums: async () => {
    try {
      console.log("Iniciando fetchCondominiums");
      set({ isLoading: true, error: null });
      
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        throw new Error("clientId no disponible");
      }

      // Obtener todos los condominios del cliente
      const db = getFirestore();
      const condominiumsRef = collection(db, `clients/${clientId}/condominiums`);
      const snapshot = await getDocs(condominiumsRef);
      
      console.log("Total de condominios encontrados:", snapshot.docs.length);

      if (snapshot.empty) {
        throw new Error("No hay condominios disponibles");
      }

      const availableCondominiums: Condominium[] = [];

      // Procesar cada condominio
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const condominiumData = {
          id: doc.id,
          name: data.name || "Sin nombre",
          address: data.address,
          createdAt: data.createdAt?.toDate(),
        };
        console.log("Añadiendo condominio:", condominiumData);
        availableCondominiums.push(condominiumData);
      }

      console.log("Condominios disponibles:", availableCondominiums.length);

      // Intentar restaurar el condominio seleccionado
      const savedCondominiumId = localStorage.getItem("condominiumId");
      console.log("ID guardado en localStorage:", savedCondominiumId);
      
      let selectedCondominium = null;

      if (savedCondominiumId) {
        selectedCondominium = availableCondominiums.find(c => c.id === savedCondominiumId);
        console.log("Condominio encontrado en localStorage:", selectedCondominium?.name);
      }

      // Si no hay condominio guardado o no está disponible, usar el primero
      if (!selectedCondominium) {
        selectedCondominium = availableCondominiums[0];
        console.log("Usando primer condominio disponible:", selectedCondominium.name);
        localStorage.setItem("condominiumId", selectedCondominium.id);
      }
      
      console.log("Estado final:", {
        condominiums: availableCondominiums,
        selectedCondominium
      });

      set({ 
        condominiums: availableCondominiums,
        selectedCondominium,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error("Error al cargar condominios:", error);
      const errorMessage = error.message || "Error al cargar condominios";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false,
        selectedCondominium: null,
        condominiums: []
      });
      localStorage.removeItem("condominiumId");
    }
  },

  setSelectedCondominium: async (condominium: Condominium) => {
    console.log("Cambiando condominio a:", condominium.name);
    const { selectedCondominium } = get();
    
    if (selectedCondominium?.id === condominium.id) {
      console.log("Mismo condominio seleccionado, no se hace nada");
      return;
    }

    try {
      console.log("Actualizando estado y localStorage");
      localStorage.setItem("condominiumId", condominium.id);
      set({ selectedCondominium: condominium });
      
      console.log("Recargando página");
      window.location.reload();
    } catch (error: any) {
      console.error("Error al cambiar de condominio:", error);
      const errorMessage = error.message || "Error al cambiar de condominio";
      toast.error(errorMessage);
      set({ error: errorMessage });
    }
  },
})); 