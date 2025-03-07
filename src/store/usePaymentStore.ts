// usePaymentStore.ts

import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import axios from "axios";

export type Charge = {
  id: string;
  concept: string;
  amount: number; // Monto pendiente a pagar (en dólares, como float)
  month?: string;
  paid: boolean;
  invoiceRequired?: boolean;
  dueDate?: Date; // Para ordenar por fecha de vencimiento
};

/**
 * Representa un pago de mantenimiento.
 * Los montos (amountPaid, amountPending, etc.) se capturan en dólares
 * pero se enviarán al backend en centavos (int).
 */
export type MaintenancePayment = {
  email: string;
  numberCondominium: string;
  comments?: string;

  // Estos vienen en dólares, float
  amountPaid: number;
  amountPending: number;

  file: File | File[] | null;
  chargeId?: string;
  month?: string;
  selectedCharges?: { chargeId: string; amount: number }[];
  creditBalance?: number;
  useCreditBalance?: boolean;
  paymentType?: string;

  // fecha de pago y cuenta financiera
  paymentDate?: string;      // se manda como string (ISO, etc.)
  financialAccountId?: string;

  // Nuevo campo: crédito utilizado (en dólares)
  creditUsed?: number;
};

type FinancialAccount = {
  id: string;
  name: string;
};

type MaintenancePaymentState = {
  charges: Charge[];
  loading: boolean;
  error: string | null;

  // arreglo de cuentas y su cargador
  financialAccounts: FinancialAccount[];
  fetchFinancialAccounts: () => Promise<void>;

  fetchUserCharges: (numberCondominium: string) => Promise<void>;
  addMaintenancePayment: (payment: MaintenancePayment) => Promise<void>;
};

// Conviertes un monto en dólares (float) a un entero en centavos
function toCents(amountInDollars: number): number {
  // Redondeamos al entero más cercano
  return Math.round(amountInDollars * 100);
}

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const usePaymentStore = create<MaintenancePaymentState>((set, get) => ({
  charges: [],
  loading: false,
  error: null,

  financialAccounts: [],
  fetchFinancialAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const accRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
      );
      const snap = await getDocs(accRef);
      const accounts: FinancialAccount[] = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "Sin nombre",
      }));

      set({ financialAccounts: accounts, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al obtener cuentas financieras:", error);
      set({
        error: error.message || "Error al obtener cuentas financieras",
        loading: false,
      });
    }
  },

  fetchUserCharges: async (numberCondominium) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      // Buscar el usuario por número
      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const userQuery = query(usersRef, where("number", "==", numberCondominium));
      const userSnap = await getDocs(userQuery);
      if (userSnap.empty) {
        throw new Error(`No se encontró un usuario con el número ${numberCondominium}`);
      }
      const userDoc = userSnap.docs[0];

      // Obtener los cargos no pagados
      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
      );
      const chargesQuery = query(chargesRef, where("paid", "==", false));
      const chargesSnap = await getDocs(chargesQuery);

      const newCharges: Charge[] = chargesSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        let monthLabel = "";
        let dueDate: Date | undefined = undefined;

        // Procesar startAt
        if (data.startAt) {
          let d: Date;
          if (data.startAt.toDate) {
            d = data.startAt.toDate();
          } else {
            d = new Date(data.startAt.replace(" ", "T"));
          }
          const year = d.getFullYear();
          const monthIndex = d.getMonth();
          const monthName = MONTH_NAMES_ES[monthIndex] || "";
          monthLabel = `${monthName} ${year}`;
        }

        // Procesar dueDate
        if (data.dueDate) {
          dueDate = data.dueDate.toDate
            ? data.dueDate.toDate()
            : new Date(data.dueDate.replace(" ", "T"));
        }

        return {
          id: docSnap.id,
          concept: data.concept ?? "",
          amount: data.amount ?? 0,
          month: monthLabel,
          paid: data.paid ?? false,
          invoiceRequired: data.invoiceRequired ?? false,
          dueDate,
        };
      });

      set({ charges: newCharges, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al obtener cargos:", error);
      set({ error: error.message || "Error al obtener cargos", loading: false });
    }
  },

  addMaintenancePayment: async (payment) => {
    set({ loading: true, error: null });
    try {
      if (!payment.paymentType) {
        throw new Error("El campo tipo de pago es obligatorio.");
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("email", payment.email || "");
      formData.append("numberCondominium", payment.numberCondominium || "");
      formData.append("condominiumId", condominiumId);
      formData.append("comments", payment.comments || "");

      // Convertimos amountPaid, amountPending a centavos
      const amountPaidCents = toCents(payment.amountPaid);
      const amountPendingCents = toCents(payment.amountPending);
      formData.append("amountPaid", String(amountPaidCents));
      formData.append("amountPending", String(amountPendingCents));

      // Identificador de grupo
      const paymentGroupId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      formData.append("paymentGroupId", paymentGroupId);

      // Saldo a favor
      formData.append("useCreditBalance", payment.useCreditBalance ? "true" : "false");
      // Tipo de pago
      formData.append("paymentType", payment.paymentType || "");

      // <-- Nueva línea: enviar el crédito utilizado en centavos
      formData.append("creditUsed", payment.creditUsed ? String(toCents(payment.creditUsed)) : "0");

      // Fecha y cuenta financiera
      formData.append("paymentDate", payment.paymentDate || "");
      formData.append("financialAccountId", payment.financialAccountId || "");

      // Tomamos la lista de cargos locales
      const { charges } = get();

      // Lógica multi-cargo
      if (payment.selectedCharges && payment.selectedCharges.length > 0) {
        // Calculamos la suma en centavos
        const totalSelectedCents = payment.selectedCharges.reduce(
          (sum, sc) => sum + toCents(sc.amount),
          0
        );

        if (!payment.useCreditBalance) {
          // Comparar con amountPaidCents
          if (totalSelectedCents !== amountPaidCents) {
            throw new Error(
              "El monto abonado (en centavos) debe coincidir exactamente con la suma de los cargos asignados."
            );
          }
        }
        // Forzamos creditBalance a 0 en multi-cargo (el backend lo re-calculará si hay sobrante)
        formData.append("creditBalance", "0");

        // Enriquecemos las asignaciones en centavos
        const enrichedSelected = payment.selectedCharges
          .map((sc) => {
            const foundCharge = charges.find((c) => c.id === sc.chargeId);
            const dueDateNum = foundCharge?.dueDate ? foundCharge.dueDate.getTime() : 0;

            // amount -> centavos
            return {
              ...sc,
              amount: toCents(sc.amount),
              dueDate: dueDateNum,
            };
          })
          .sort((a, b) => a.dueDate - b.dueDate);

        formData.append("chargeAssignments", JSON.stringify(enrichedSelected));
      }
      // Lógica cargo único
      else if (payment.chargeId) {
        formData.append("chargeId", payment.chargeId);
        const foundCharge = charges.find((c) => c.id === payment.chargeId);
        if (foundCharge) {
          // Si NO se usa crédito y se paga más de lo que vale el cargo
          // generamos un creditBalance en centavos
          const chargeCents = toCents(foundCharge.amount);
          if (!payment.useCreditBalance && amountPaidCents > chargeCents) {
            const creditBalanceCents = amountPaidCents - chargeCents;
            payment.creditBalance = creditBalanceCents / 100; // si lo quisieras en dólares
            formData.append("creditBalance", String(creditBalanceCents));
          }
        }
      } else {
        // Sin selectedCharges ni chargeId => nada
      }

      // Mes opcional
      if (payment.month) {
        formData.append("month", payment.month);
      }

      // Adjuntos
      if (payment.file) {
        // Modificación: se envía solo el primer archivo, ya que el backend ahora espera una única URL
        if (Array.isArray(payment.file)) {
          formData.append("attachments", payment.file[0]);
        } else {
          formData.append("attachments", payment.file);
        }
      }

      // Enviamos al backend
      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Recargar cargos
      await get().fetchUserCharges(payment.numberCondominium);

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al registrar el pago/cargo:", error);
      set({
        loading: false,
        error: error.message || "Error al registrar el pago/cargo",
      });
      throw error;
    }
  },
}));
