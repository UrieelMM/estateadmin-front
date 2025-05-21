// useChargeStore.ts

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import * as Sentry from "@sentry/react";
import { syncWithAIContext } from "../services/aiContextService";

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

// Función para formatear fechas en formato legible
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

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

      // Obtener información del usuario desde Firestore
      const userRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}`
      );
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userName = userData?.name || "";
      const userEmail = userData?.email || "";
      const userNumber = userData?.number || "";

      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
      );

      // Convierte el monto en pesos a centavos, y lo guardamos como entero
      const amountCents = Math.round(options.amount * 100);

      const now = new Date();

      // Ya no generamos un chargeId personalizado, usaremos el UID de Firestore
      const docRef = await addDoc(chargesRef, {
        concept: options.concept,
        amount: amountCents,
        referenceAmount: amountCents, // Guardamos el monto original
        generatedAt: now,
        startAt: options.startAt,
        dueDate: options.dueDate,
        paid: options.paid,
        clientId: clientId,
        condominiumId: condominiumId,
        notificationSent: false,
        email: userEmail,
        name: userName,
      });

      // Actualizamos el documento con su propio ID como chargeId
      await updateDoc(docRef, {
        chargeId: docRef.id,
      });

      // NUEVO: Sincronizar con la API de IA
      try {
        const chargeData = {
          // Información básica del cargo
          chargeId: docRef.id,
          concept: options.concept,
          amount: options.amount, // Monto en pesos
          amountCents: amountCents, // Monto en centavos
          generatedAt: now.toISOString(),
          startAt: options.startAt,
          startAtFormatted: formatDisplayDate(options.startAt),
          dueDate: options.dueDate,
          dueDateFormatted: formatDisplayDate(options.dueDate),
          paid: options.paid,

          // Información del condómino
          condominoNombre: userName,
          condominoEmail: userEmail,
          condominoNumero: userNumber,
          condominoTipo: userData?.type || "Propietario",
          condominoTelefono: userData?.phone || "No disponible",

          // Metadatos adicionales
          tipoOperacion: "cargo_individual",
          fechaRegistro: now.toISOString(),
          currency: "MXN",

          // Información de facturación
          facturaRequerida: userData?.invoiceRequired || false,
          facturaGenerada: false,

          // Datos administrativos
          notificationSent: false,
        };

        await syncWithAIContext(
          "charges", // Tipo de tienda en el middleware
          chargeData,
          clientId,
          condominiumId
        );
      } catch (syncError) {
        // Capturar error pero no detener el flujo
        console.error(
          "[AI Context] Error al sincronizar cargo individual:",
          syncError
        );
      }

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
      const createdCharges: any[] = [];

      usersSnapshot.forEach((docUser) => {
        const userData = docUser.data();
        const role = userData.role || "owner";
        const userName = userData.name || "";
        const userEmail = userData.email || "";
        const userNumber = userData.number || "";

        // Excluir roles admin, admin-assistant, etc. si procede
        if (
          role === "admin" ||
          role === "admin-assistant" ||
          role === "super-admin" ||
          role === "security"
        ) {
          return;
        }

        const userId = docUser.id;
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
        );

        // Ya no generamos un chargeId personalizado, usaremos el UID de Firestore
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
            notificationSent: false,
            email: userEmail,
            name: userName,
          }).then((docRef) => {
            // Guardamos información para sincronizar después
            createdCharges.push({
              docRef,
              userData: {
                userName,
                userEmail,
                userNumber,
                userType: userData.type || "Propietario",
                userPhone: userData.phone || "No disponible",
                invoiceRequired: userData.invoiceRequired || false,
              },
            });

            // Actualizamos el documento con su propio ID como chargeId
            return updateDoc(docRef, {
              chargeId: docRef.id,
            });
          })
        );
      });

      await Promise.all(batchPromises);

      // NUEVO: Sincronizar con la API de IA (cargo masivo)
      try {
        // Primero un registro del cargo masivo general
        const chargeDataGeneral = {
          concept: options.concept,
          amount: options.amount,
          amountCents: amountCents,
          generatedAt: now.toISOString(),
          startAt: options.startAt,
          startAtFormatted: formatDisplayDate(options.startAt),
          dueDate: options.dueDate,
          dueDateFormatted: formatDisplayDate(options.dueDate),
          paid: options.paid,

          tipoOperacion: "cargo_masivo",
          fechaRegistro: now.toISOString(),
          currency: "MXN",

          cantidadCondominios: createdCharges.length,
          montoTotal: options.amount * createdCharges.length,

          esFacturable: false,
        };

        await syncWithAIContext(
          "charges-batch",
          chargeDataGeneral,
          clientId,
          condominiumId
        );

        // Luego sincronizar cada cargo individual
        for (const item of createdCharges) {
          const chargeData = {
            chargeId: item.docRef.id,
            concept: options.concept,
            amount: options.amount,
            amountCents: amountCents,
            generatedAt: now.toISOString(),
            startAt: options.startAt,
            startAtFormatted: formatDisplayDate(options.startAt),
            dueDate: options.dueDate,
            dueDateFormatted: formatDisplayDate(options.dueDate),
            paid: options.paid,

            condominoNombre: item.userData.userName,
            condominoEmail: item.userData.userEmail,
            condominoNumero: item.userData.userNumber,
            condominoTipo: item.userData.userType,
            condominoTelefono: item.userData.userPhone,

            tipoOperacion: "cargo_masivo_individual",
            fechaRegistro: now.toISOString(),
            currency: "MXN",

            facturaRequerida: item.userData.invoiceRequired,
            facturaGenerada: false,

            notificationSent: false,
          };

          await syncWithAIContext(
            "charges",
            chargeData,
            clientId,
            condominiumId
          );
        }
      } catch (syncError) {
        console.error(
          "[AI Context] Error al sincronizar cargos masivos:",
          syncError
        );
      }

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
