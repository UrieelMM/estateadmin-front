// src/store/useUnidentifiedPaymentsStore.ts
import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import axios from "axios";

export interface UnidentifiedPayment {
  id: string;
  condominiumNumber: string;
  amountPaid: number; // en pesos
  pendingAmount: number; // en pesos
  paymentType: string;
  paymentDate: Date;
  registrationDate: Date; // corresponde a dateRegistered en Firestore
  isUnidentifiedPayment: boolean;
  attachmentPayment?: string; // URL o referencia del archivo, si existe
  appliedToUser: boolean; // se maneja como booleano
  financialAccountId?: string;
}

interface ChargeAssignment {
  chargeId: string;
  amount: number;
  dueDate?: number;
}

interface UnidentifiedPaymentsState {
  payments: UnidentifiedPayment[];
  loading: boolean;
  error: string | null;
  selectedPayment: UnidentifiedPayment | null;
  lastVisible: any | null; // Último documento para paginación
  hasMore: boolean;

  // Trae los pagos no identificados desde Firestore, con filtros y paginación (20 en 20)
  fetchPayments: (filterMonth?: number, filterYear?: number, append?: boolean) => Promise<void>;

  // Aplica el pago no identificado asignándolo a un usuario.
  // Se añade el tercer parámetro attachmentPayment, para recibir la URL actualizada
  applyPayment: (
    userId: string,
    selectedCharges: ChargeAssignment[],
    attachmentPayment?: string
  ) => Promise<void>;

  openPaymentModal: (payment: UnidentifiedPayment) => void;
  closePaymentModal: () => void;
}

export const useUnidentifiedPaymentsStore = create<UnidentifiedPaymentsState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  selectedPayment: null,
  lastVisible: null,
  hasMore: true,

  // Trae los pagos no identificados desde Firestore, con filtros y paginación (20 en 20)
  fetchPayments: async (filterMonth?: number, filterYear?: number, append: boolean = false) => {
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
      const unidentifiedRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
      );

      // Construir condiciones para la query
      const conditions = [];
      if (filterMonth !== undefined && filterYear !== undefined) {
        const startDate = Timestamp.fromDate(new Date(filterYear, filterMonth - 1, 1));
        const endDate = Timestamp.fromDate(new Date(filterYear, filterMonth, 1));
        conditions.push(where("paymentDate", ">=", startDate));
        conditions.push(where("paymentDate", "<", endDate));
      }

      const pageSize = 20;
      let q;
      if (append && get().lastVisible) {
        q = query(unidentifiedRef, ...conditions, startAfter(get().lastVisible), limit(pageSize));
      } else {
        q = query(unidentifiedRef, ...conditions, limit(pageSize));
      }

      const snapshot = await getDocs(q);

      const newPayments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          condominiumNumber: data.numberCondominium || "N/A",
          amountPaid: data.amountPaid ? Number(data.amountPaid) / 100 : 0,
          pendingAmount: data.amountPending ? Number(data.amountPending) / 100 : 0,
          paymentType: data.paymentType || "",
          paymentDate:
            data.paymentDate && data.paymentDate.toDate
              ? data.paymentDate.toDate()
              : new Date(data.paymentDate),
          registrationDate:
            data.dateRegistered && data.dateRegistered.toDate
              ? data.dateRegistered.toDate()
              : new Date(data.dateRegistered),
          isUnidentifiedPayment: data.isUnidentifiedPayment,
          attachmentPayment: data.attachmentPayment || null,
          appliedToUser: data.appliedToUser === true || data.appliedToUser === "true",
          financialAccountId: data.financialAccountId || "",
        } as UnidentifiedPayment;
      });

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      if (append) {
        set((state) => ({
          payments: [...state.payments, ...newPayments],
          lastVisible,
          hasMore,
          loading: false,
        }));
      } else {
        set({
          payments: newPayments,
          lastVisible,
          hasMore,
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching unidentified payments:", error);
      set({ error: error.message || "Error al obtener pagos no identificados", loading: false });
    }
  },

  // Abre el modal asignando el pago seleccionado
  openPaymentModal: (payment: UnidentifiedPayment) => set({ selectedPayment: payment }),

  closePaymentModal: () => set({ selectedPayment: null }),

  // Aplica el pago no identificado asignándolo a un usuario.
  // TERCER PARÁMETRO: attachmentPayment
  applyPayment: async (userId: string, selectedCharges: ChargeAssignment[], attachmentPayment?: string) => {
    const { selectedPayment } = get();
    if (!selectedPayment) throw new Error("No hay pago seleccionado");

    // Si recibimos un nuevo attachmentPayment, actualizamos el selectedPayment
    if (attachmentPayment) {
      selectedPayment.attachmentPayment = attachmentPayment;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuario no autenticado");

    const tokenResult = await getIdTokenResult(currentUser);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) throw new Error("Condominio no seleccionado");

    const toCents = (amount: number) => Math.round(amount * 100);

    // 1. FormData para aplicar el pago al usuario
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("email", "");
    formData.append("numberCondominium", selectedPayment.condominiumNumber);
    formData.append("condominiumId", condominiumId);
    formData.append("comments", "");
    formData.append("isUnidentifiedPayment", "false");
    formData.append("appliedToUser", JSON.stringify(true));
    formData.append("amountPaid", "0");

    const amountPendingCents = toCents(selectedPayment.pendingAmount);
    formData.append("amountPending", String(amountPendingCents));

    const paymentGroupId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    formData.append("paymentGroupId", paymentGroupId);
    formData.append("useCreditBalance", "false");
    formData.append("paymentType", selectedPayment.paymentType);
    formData.append("creditUsed", "0");
    formData.append("paymentDate", selectedPayment.paymentDate.toISOString());
    formData.append("financialAccountId", selectedPayment.financialAccountId || "");

    // Aseguramos enviar la URL o valor de attachmentPayment
    formData.append("attachmentPayment", selectedPayment.attachmentPayment || "");

    formData.append("userId", userId);

    // Lógica de cargos
    if (selectedCharges.length === 1) {
      formData.append("chargeId", selectedCharges[0].chargeId);
    } else if (selectedCharges.length > 1) {
      formData.append("creditBalance", "0");
      const enrichedSelected = selectedCharges
        .map((sc) => ({
          chargeId: sc.chargeId,
          amount: toCents(sc.amount),
          dueDate: sc.dueDate || 0,
        }))
        .sort((a, b) => a.dueDate - b.dueDate);
      formData.append("chargeAssignments", JSON.stringify(enrichedSelected));
    } else {
      throw new Error("Debe seleccionar al menos un cargo para asignar el pago");
    }

    set({ loading: true, error: null });
    try {
      // 1. Aplicar el pago al usuario
      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // 2. Actualizar el registro del pago no identificado
      const updateFormData = new FormData();
      updateFormData.append("paymentId", selectedPayment.id);
      updateFormData.append("clientId", clientId);
      updateFormData.append("numberCondominium", selectedPayment.condominiumNumber);
      updateFormData.append("condominiumId", condominiumId);
      updateFormData.append("isUnidentifiedPayment", "true");
      updateFormData.append("appliedToUser", JSON.stringify(true));
      updateFormData.append("amountPaid", String(Math.round(selectedPayment.amountPaid * 100)));
      updateFormData.append("amountPending", String(amountPendingCents));
      updateFormData.append("paymentGroupId", paymentGroupId);
      updateFormData.append("paymentType", selectedPayment.paymentType);
      updateFormData.append("creditUsed", "0");
      updateFormData.append("paymentDate", selectedPayment.paymentDate.toISOString());
      updateFormData.append("appliedToCondomino", userId);
      updateFormData.append("financialAccountId", selectedPayment.financialAccountId || "");

      // Mismo valor de attachmentPayment
      updateFormData.append("attachmentPayment", selectedPayment.attachmentPayment || "");

      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create-unidentified`,
        updateFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Actualiza el state
      set((state) => ({
        payments: state.payments.map((p) =>
          p.id === selectedPayment.id
            ? { ...p, appliedToUser: true, isUnidentifiedPayment: true }
            : p
        ),
        selectedPayment: null,
        loading: false,
      }));

      // Recargar la lista
      await get().fetchPayments(undefined, undefined);
    } catch (error: any) {
      console.error("Error applying unidentified payment:", error);
      set({ error: error.message || "Error al aplicar el pago", loading: false });
      throw error;
    }
  },
}));
