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
  amount: number; // Monto pendiente a pagar
  month?: string;
  paid: boolean;
  invoiceRequired?: boolean;
  dueDate?: Date; // Para ordenar por fecha de vencimiento
};

/**
 * Esta interfaz se enfoca en los datos de un PAGO.
 * En pagos a múltiples cargos, si se usa crédito, la suma de los montos asignados
 * no tiene que coincidir con amountPaid, ya que el backend combinará el monto abonado con el crédito disponible.
 */
export type MaintenancePayment = {
  email: string;
  numberCondominium: string;
  comments?: string;
  amountPaid: number;
  amountPending: number;
  file: File | File[] | null;
  chargeId?: string;
  month?: string;
  selectedCharges?: { chargeId: string; amount: number }[];
  creditBalance?: number;
  useCreditBalance?: boolean;
  paymentType?: string;
};

type MaintenancePaymentState = {
  charges: Charge[];
  loading: boolean;
  error: string | null;
  fetchUserCharges: (numberCondominium: string) => Promise<void>;
  addMaintenancePayment: (payment: MaintenancePayment) => Promise<void>;
};

const MONTH_NAMES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const usePaymentStore = create<MaintenancePaymentState>((set, get) => ({
  charges: [],
  loading: false,
  error: null,

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
      const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`);
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
        if (data.dueDate) {
          dueDate = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate.replace(" ", "T"));
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
      formData.append("amountPaid", (Math.round(payment.amountPaid * 100) / 100).toFixed(2));
      formData.append("amountPending", (Math.round(payment.amountPending * 100) / 100).toFixed(2));
      
      const paymentGroupId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      formData.append("paymentGroupId", paymentGroupId);
      
      formData.append("useCreditBalance", payment.useCreditBalance ? "true" : "false");
      formData.append("paymentType", payment.paymentType);
      
      const { charges } = get();

      // Pago a múltiples cargos
      if (payment.selectedCharges && payment.selectedCharges.length > 0) {
        const totalSelected = payment.selectedCharges.reduce((sum, sc) => sum + sc.amount, 0);
        if (!payment.useCreditBalance) {
          // Sin uso de crédito, la suma asignada debe igualar amountPaid
          if (
            Number((Math.round(totalSelected * 100) / 100).toFixed(2)) !==
            Number((Math.round(payment.amountPaid * 100) / 100).toFixed(2))
          ) {
            throw new Error("El monto abonado debe coincidir exactamente con la suma de los cargos asignados.");
          }
        }
        // Si se usa crédito en multi-cargo, omitimos la validación global
        payment.creditBalance = 0;
        formData.append("creditBalance", "0.00");
        const enrichedSelected = payment.selectedCharges
          .map((sc) => {
            const charge = charges.find((c) => c.id === sc.chargeId);
            return {
              ...sc,
              amount: Number((Math.round(sc.amount * 100) / 100).toFixed(2)),
              dueDate: charge?.dueDate ? charge.dueDate.getTime() : 0,
            };
          })
          .sort((a, b) => a.dueDate - b.dueDate);
        formData.append("chargeAssignments", JSON.stringify(enrichedSelected));
      }
      // Pago a un único cargo
      else if (payment.chargeId) {
        formData.append("chargeId", payment.chargeId);
        const charge = charges.find((c) => c.id === payment.chargeId);
        if (charge) {
          if (!payment.useCreditBalance && payment.amountPaid > charge.amount) {
            const creditBalance = payment.amountPaid - charge.amount;
            payment.creditBalance = creditBalance;
            formData.append("creditBalance", (Math.round(creditBalance * 100) / 100).toFixed(2));
          }
          // Si se usa crédito, se deja que el backend combine amountPaid con el crédito disponible.
        }
      }
      if (payment.month) {
        formData.append("month", payment.month);
      }
      if (payment.file) {
        if (Array.isArray(payment.file)) {
          payment.file.forEach((f) => formData.append("attachments", f));
        } else {
          formData.append("attachments", payment.file);
        }
      }
      
      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      await get().fetchUserCharges(payment.numberCondominium);
      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al registrar el pago/cargo:", error);
      set({ loading: false, error: error.message || "Error al registrar el pago/cargo" });
      throw error;
    }
  },
}));
