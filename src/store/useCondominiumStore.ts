import { create, resetAllStores } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import useUserStore from "./UserDataStore";

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
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const role = tokenResult.claims["role"] as string;

      if (!clientId) {
        throw new Error("clientId no disponible");
      }

      const db = getFirestore();
      let availableCondominiums: Condominium[] = [];

      // Obtener los condominios asignados al usuario desde el documento del usuario
      const condominiumId = tokenResult.claims["condominiumId"] as string;

      // Si el usuario tiene rol super-provider-admin, mostrar todos los condominios
      if (role === "super-provider-admin") {
        const condominiumsRef = collection(
          db,
          `clients/${clientId}/condominiums`
        );
        const snapshot = await getDocs(condominiumsRef);

        if (snapshot.empty) {
          throw new Error("No hay condominios disponibles");
        }

        // Procesar cada condominio
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const condominiumData = {
            id: doc.id,
            name: data.name || "Sin nombre",
            address: data.address,
            createdAt: data.createdAt?.toDate(),
          };
          availableCondominiums.push(condominiumData);
        }
      } else {
        // Para otros roles, buscar el documento del usuario para obtener condominiumUids
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );

        const q = query(usersRef, where("uid", "==", user.uid));
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          throw new Error("No se encontró el usuario en la base de datos");
        }

        const userData = userSnapshot.docs[0].data();
        const assignedCondominiums = userData.condominiumUids || [];

        if (assignedCondominiums.length === 0) {
          // Si no hay condominios asignados, usar solo el condominio actual
          const currentCondominiumDoc = await getDoc(
            doc(db, `clients/${clientId}/condominiums/${condominiumId}`)
          );

          if (currentCondominiumDoc.exists()) {
            const data = currentCondominiumDoc.data();
            availableCondominiums.push({
              id: condominiumId,
              name: data.name || "Sin nombre",
              address: data.address,
              createdAt: data.createdAt?.toDate(),
            });
          }
        } else {
          // Obtener información de cada condominio asignado
          for (const condId of assignedCondominiums) {
            const condDoc = await getDoc(
              doc(db, `clients/${clientId}/condominiums/${condId}`)
            );

            if (condDoc.exists()) {
              const data = condDoc.data();
              availableCondominiums.push({
                id: condId,
                name: data.name || "Sin nombre",
                address: data.address,
                createdAt: data.createdAt?.toDate(),
              });
            }
          }
        }
      }

      if (availableCondominiums.length === 0) {
        throw new Error("No hay condominios disponibles para este usuario");
      }

      // Intentar restaurar el condominio seleccionado
      const savedCondominiumId = localStorage.getItem("condominiumId");

      let selectedCondominium = null;

      if (savedCondominiumId) {
        selectedCondominium = availableCondominiums.find(
          (c) => c.id === savedCondominiumId
        );
      }

      // Si no hay condominio guardado o no está disponible, usar el primero
      if (!selectedCondominium) {
        selectedCondominium = availableCondominiums[0];
        localStorage.setItem("condominiumId", selectedCondominium.id);
      }

      set({
        condominiums: availableCondominiums,
        selectedCondominium,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Error al cargar condominios:", error);
      const errorMessage = error.message || "Error al cargar condominios";
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        selectedCondominium: null,
        condominiums: [],
      });
      localStorage.removeItem("condominiumId");
    }
  },

  setSelectedCondominium: async (condominium: Condominium) => {
    const { selectedCondominium } = get();

    if (selectedCondominium?.id === condominium.id) {
      return;
    }

    try {
      console.log(
        `Cambiando condominio de ${selectedCondominium?.id} a ${condominium.id}`
      );

      // 1. Primero limpiar los datos de usuarios
      useUserStore.getState().resetCondominiumUserData();

      // 2. Preservar datos de sesión importantes
      preserveSessionData(condominium.id);

      // 3. Actualizar el store de condominios
      set({ selectedCondominium: condominium });

      // 4. Reiniciar los demás stores
      resetAllStores();

      // 5. Pequeña pausa para asegurar que todo se limpia antes de recargar
      setTimeout(() => {
        // Recargar la página para aplicar los cambios
        window.location.reload();
      }, 100);
    } catch (error: any) {
      console.error("Error al cambiar de condominio:", error);
      const errorMessage = error.message || "Error al cambiar de condominio";
      toast.error(errorMessage);
      set({ error: errorMessage });
    }
  },
}));

// Función auxiliar para preservar datos de sesión importantes
const preserveSessionData = (newCondominiumId: string) => {
  // Guardar datos críticos antes de limpiar localStorage
  const keysToPreserve = ["dataUserActive", "theme"];
  const savedData: Record<string, string | null> = {};

  // Guardar temporalmente los datos críticos
  keysToPreserve.forEach((key) => {
    savedData[key] = localStorage.getItem(key);
  });

  // Limpiar localStorage
  localStorage.clear();

  // Restaurar datos críticos
  Object.entries(savedData).forEach(([key, value]) => {
    if (value) {
      localStorage.setItem(key, value);
    }
  });

  // Establecer el nuevo ID de condominio
  localStorage.setItem("condominiumId", newCondominiumId);
};
