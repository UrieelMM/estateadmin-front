// useChargeStore.ts

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import * as Sentry from "@sentry/react";
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
  createChargeForOne: (
    userId: string,
    options: CreateChargeOptions
  ) => Promise<void>;
  createChargeForAll: (options: CreateChargeOptions) => Promise<void>;
}

export const useChargeStore = create<ChargeState>()((set) => ({
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

      await addDoc(chargesRef, {
        concept: options.concept,
        amount: amountCents,
        referenceAmount: amountCents, // Guardamos el monto original
        generatedAt: now,
        startAt: options.startAt,
        dueDate: options.dueDate,
        paid: options.paid,
        clientId: clientId,
        condominiumId: condominiumId,
      });

      set({ loading: false, error: null });
    } catch (error: any) {
      Sentry.captureException(error);
      set({
        loading: false,
        error: error.message || "Error al crear el cargo",
      });
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
            referenceAmount: amountCents, // Guardamos el monto original
            generatedAt: now,
            startAt: options.startAt, // Se almacena como string
            dueDate: options.dueDate, // String
            paid: options.paid,
            clientId: clientId,
            condominiumId: condominiumId,
          }).then(() => Promise.resolve())
        );
      });

      await Promise.all(batchPromises);
      set({ loading: false, error: null });
    } catch (error: any) {
      Sentry.captureException(error);
      set({
        loading: false,
        error: error.message || "Error al crear los cargos",
      });
    }
  },
}));
