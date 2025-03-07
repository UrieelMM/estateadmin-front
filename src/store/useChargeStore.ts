// useChargeStore.ts

import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  Timestamp
} from "firebase/firestore";

/**
 * Interfaz para la creación de cargos.
 * startAt y dueDate: "YYYY-MM-DD HH:mm"
 */
interface CreateChargeOptions {
  concept: string;
  amount: number; // En pesos (float), se convertirá a centavos antes de guardar
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

      // Convierte el monto en pesos a centavos, y lo guardamos como entero
      const amountCents = Math.round(options.amount * 100);

      const now = new Date();

      const parseDateString = (dateString: string) => {
        // Reemplaza el espacio por 'T' y agrega ":00" para segundos
        const isoString = dateString.replace(" ", "T") + ":00";
        return new Date(isoString);
      };

      await addDoc(chargesRef, {
        concept: options.concept,
        // GUARDAMOS EN CENTAVOS
        amount: amountCents,
        generatedAt: now, // Date real
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
      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const usersSnapshot = await getDocs(usersRef);

      // Convierte el monto en pesos a centavos
      const amountCents = Math.round(options.amount * 100);

      const now = new Date();

      const batchPromises: Promise<void>[] = [];

      usersSnapshot.forEach((docUser) => {
        const userData = docUser.data();
        const role = userData.role || "owner";

        // Excluir roles admin, admin-assistant, etc. si procede
        if (role === "admin" || role === "admin-assistant") {
          return;
        }

        const userId = docUser.id;
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
        );

        // Registramos el cargo con startAt, dueDate y amountCents
        batchPromises.push(
          addDoc(chargesRef, {
            concept: options.concept,
            amount: amountCents, // GUARDADO EN CENTAVOS
            generatedAt: now,
            startAt: options.startAt,  // Se almacena como string
            dueDate: options.dueDate,  // String
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
