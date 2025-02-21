// useChargeStore.ts
import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";


/**
 * Interfaz para la creación de cargos.
 * startAt y dueDate ahora vendrán como string con fecha y hora,
 * p.ej. "2025-02-01 00:00" y "2025-02-01 23:59"
 */
interface CreateChargeOptions {
  concept: string;
  amount: number;
  // Se guardarán como string
  startAt: string; // "YYYY-MM-DD HH:mm"
  dueDate: string; // "YYYY-MM-DD HH:mm"
  paid: boolean;
}

interface ChargeState {
  loading: boolean;
  error: string | null;
  createChargeForOne: (userId: string, options: CreateChargeOptions) => Promise<void>;
  createChargeForAll: (options: CreateChargeOptions) => Promise<void>;
}

export const useChargeStore = create<ChargeState>((set) => ({
  loading: false,
  error: null,

  /**
   * Crear un cargo para un único condómino
   */
  createChargeForOne: async (userId: string, options: CreateChargeOptions) => {
    set({ loading: true, error: null });
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

      const db = getFirestore();
      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
      );

      // generatedAt sí la guardamos como Date (Timestamp), porque queremos
      // tener la marca de tiempo de cuando se creó el cargo
      const now = new Date();

      const parseDateString = (dateString: string) => {
        // Reemplaza el espacio por 'T' y agrega ":00" para los segundos.
        const isoString = dateString.replace(" ", "T") + ":00";
        return new Date(isoString);
      }

      // Registrar el cargo con startAt y dueDate como string
      await addDoc(chargesRef, {
        concept: options.concept,
        amount: options.amount,
        generatedAt: now, // Se guarda como Date, correcto
        // Convertir startAt y dueDate a Timestamp usando la función de parseo
        startAt: Timestamp.fromDate(parseDateString(options.startAt)),
        dueDate: Timestamp.fromDate(parseDateString(options.dueDate)),
        paid: options.paid,
      });

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al crear cargo para un usuario:", error);
      set({ loading: false, error: error.message || "Error al crear el cargo" });
    }
  },

  /**
   * Crear un cargo para TODOS los usuarios del condominio
   */
  createChargeForAll: async (options: CreateChargeOptions) => {
    set({ loading: true, error: null });
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

      const db = getFirestore();
      const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`);
      const usersSnapshot = await getDocs(usersRef);

      const now = new Date();

      const batchPromises: Promise<void>[] = [];
      usersSnapshot.forEach((docUser) => {
        const userData = docUser.data();
        const role = userData.role || "owner";

        // Excluir roles admin, admin-assistant
        if (role === "admin" || role === "admin-assistant") {
          return;
        }

        const userId = docUser.id;
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
        );

        // Registrar el cargo con startAt y dueDate como string
        batchPromises.push(
          addDoc(chargesRef, {
            concept: options.concept,
            amount: options.amount,
            generatedAt: now,        // Timestamp real
            startAt: options.startAt, // "YYYY-MM-DD HH:mm"
            dueDate: options.dueDate, // "YYYY-MM-DD HH:mm"
            paid: options.paid,
          }).then(() => Promise.resolve())
        );
      });

      await Promise.all(batchPromises);
      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al crear cargo para todos los usuarios:", error);
      set({ loading: false, error: error.message || "Error al crear los cargos" });
    }
  },
}));
