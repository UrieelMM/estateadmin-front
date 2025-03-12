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
  startAfter
} from "firebase/firestore";
import axios from "axios";

export interface UnidentifiedPayment {
  id: string;
  condominiumNumber: string;
  amountPaid: number;       // en pesos
  pendingAmount: number;    // en pesos
  paymentType: string;
  paymentDate: Date;
  registrationDate: Date;   // corresponde a dateRegistered en Firestore
  isUnidentifiedPayment: boolean;
  attachmentPayment?: string; // URL o referencia del archivo, si existe
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
  // Permite filtrar por mes y año (según dateRegistered) y paginar (append: true para traer la siguiente página)
  fetchPayments: (filterMonth?: number, filterYear?: number, append?: boolean) => Promise<void>;
  applyPayment: (userId: string, selectedCharges: ChargeAssignment[]) => Promise<void>;
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
      const conditions = [ where("isUnidentifiedPayment", "==", true) ];
      if (filterMonth !== undefined && filterYear !== undefined) {
        // Se asume que filterMonth es de 1 a 12
        const startDate = new Date(filterYear, filterMonth - 1, 1);
        const endDate = new Date(filterYear, filterMonth, 1);
        conditions.push(where("dateRegistered", ">=", startDate));
        conditions.push(where("dateRegistered", "<", endDate));
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
          paymentDate: data.paymentDate && data.paymentDate.toDate 
            ? data.paymentDate.toDate() 
            : new Date(data.paymentDate),
          registrationDate: data.dateRegistered && data.dateRegistered.toDate 
            ? data.dateRegistered.toDate() 
            : new Date(data.dateRegistered),
          isUnidentifiedPayment: data.isUnidentifiedPayment,
          attachmentPayment: data.attachmentPayment || null,
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

  // Aplica el pago no identificado asignándolo a un usuario (convirtiéndolo en pago identificado)
  // mediante el endpoint `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`
  applyPayment: async (userId: string, selectedCharges: ChargeAssignment[]) => {
    const { selectedPayment } = get();
    if (!selectedPayment) throw new Error("No hay pago seleccionado");

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuario no autenticado");
    
    const tokenResult = await getIdTokenResult(currentUser);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) throw new Error("Condominio no seleccionado");

    const toCents = (amount: number) => Math.round(amount * 100);

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("email", "");
    formData.append("numberCondominium", selectedPayment.condominiumNumber);
    formData.append("condominiumId", condominiumId);
    formData.append("comments", "");

    // Actualizar campos para marcar el pago como identificado
    formData.append("isUnidentifiedPayment", "false");
    formData.append("appliedToUser", "true");
    formData.append("amountPaid", "0");
    const amountPendingCents = toCents(selectedPayment.pendingAmount);
    formData.append("amountPending", String(amountPendingCents));
    
    // Generar identificador de grupo similar al de usePaymentStore
    const paymentGroupId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    formData.append("paymentGroupId", paymentGroupId);
    formData.append("useCreditBalance", "false");
    formData.append("paymentType", selectedPayment.paymentType);
    formData.append("creditUsed", "0");
    formData.append("paymentDate", selectedPayment.paymentDate.toISOString());
    formData.append("financialAccountId", "");
    formData.append("userId", userId);

    // Lógica para asignar cargo único o múltiples cargos
    if (selectedCharges.length === 1) {
      formData.append("chargeId", selectedCharges[0].chargeId);
    } else if (selectedCharges.length > 1) {
      formData.append("creditBalance", "0");
      const enrichedSelected = selectedCharges
        .map(sc => ({
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
      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      set((state) => ({
        payments: state.payments.filter((p) => p.id !== selectedPayment.id),
        selectedPayment: null,
        loading: false,
      }));
    } catch (error: any) {
      console.error("Error applying unidentified payment:", error);
      set({ error: error.message || "Error al aplicar el pago", loading: false });
      throw error;
    }
  },
}));
