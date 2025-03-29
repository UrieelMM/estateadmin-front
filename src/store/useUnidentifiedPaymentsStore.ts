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
  startAfter as firestoreStartAfter,
  Timestamp,
  doc,
  setDoc,
  getDoc,
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
  // La función ahora recibe un parámetro opcional startAfter para paginación,
  // y opcionalmente filterMonth y filterYear.
  fetchPayments: (
    pageSize?: number,
    startAfter?: any,
    filterMonth?: number,
    filterYear?: number
  ) => Promise<number>;

  // Aplica el pago no identificado asignándolo a un usuario.
  // Se añade el tercer parámetro attachmentPayment, para recibir la URL actualizada
  applyPayment: (
    userId: string,
    selectedCharges: ChargeAssignment[],
    attachmentPayment?: string
  ) => Promise<void>;

  openPaymentModal: (payment: UnidentifiedPayment) => void;
  closePaymentModal: () => void;

  createQRData: (qrId: string) => Promise<void>;
  getQRData: (qrId: string) => Promise<UnidentifiedPayment[]>;
}

// Variable de caché para resultados de paginación de pagos no identificados.
// Se usará la llave basada en filtros y cursor.
const unidentifiedPaymentsCache: Record<
  string,
  { payments: UnidentifiedPayment[]; lastVisible: any }
> = {};

export const useUnidentifiedPaymentsStore = create<UnidentifiedPaymentsState>(
  (set, get) => ({
    payments: [],
    loading: false,
    error: null,
    selectedPayment: null,
    lastVisible: null,
    hasMore: true,

    // Función actualizada de fetchPayments con paginación y caché.
    fetchPayments: async (
      pageSize = 20,
      startAfter = null,
      filterMonth?: number,
      filterYear?: number
    ): Promise<number> => {
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

        // Construir condiciones para la query basadas en los filtros de mes y año
        const conditions = [];
        if (filterMonth !== undefined && filterYear !== undefined) {
          const startDate = Timestamp.fromDate(
            new Date(filterYear, filterMonth - 1, 1)
          );
          const endDate = Timestamp.fromDate(
            new Date(filterYear, filterMonth, 1)
          );
          conditions.push(where("paymentDate", ">=", startDate));
          conditions.push(where("paymentDate", "<", endDate));
        }

        // Generar llave de caché basada en filtros y cursor.
        // Usaremos la caché solo si no se aplican filtros.
        const cacheKey = JSON.stringify({
          filterMonth,
          filterYear,
          startAfter: startAfter ? startAfter.id : "first",
        });
        if (
          filterMonth === undefined &&
          filterYear === undefined &&
          unidentifiedPaymentsCache[cacheKey]
        ) {
          const cached = unidentifiedPaymentsCache[cacheKey];
          set({
            payments: cached.payments,
            lastVisible: cached.lastVisible,
            hasMore: cached.payments.length === pageSize,
            loading: false,
          });
          return cached.payments.length;
        }

        // Construir la query
        let q;
        if (startAfter) {
          q = query(
            unidentifiedRef,
            ...conditions,
            firestoreStartAfter(startAfter),
            limit(pageSize)
          );
        } else {
          q = query(unidentifiedRef, ...conditions, limit(pageSize));
        }

        const snapshot = await getDocs(q);
        const newPayments: UnidentifiedPayment[] = snapshot.docs.map(
          (docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              condominiumNumber: data.numberCondominium || "N/A",
              amountPaid: data.amountPaid ? Number(data.amountPaid) / 100 : 0,
              pendingAmount: data.amountPending
                ? Number(data.amountPending) / 100
                : 0,
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
              appliedToUser:
                data.appliedToUser === true || data.appliedToUser === "true",
              financialAccountId: data.financialAccountId || "",
            } as UnidentifiedPayment;
          }
        );

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const hasMore = snapshot.docs.length === pageSize;

        // Guardar en caché el resultado si no se aplican filtros.
        if (filterMonth === undefined && filterYear === undefined) {
          unidentifiedPaymentsCache[cacheKey] = {
            payments: newPayments,
            lastVisible: lastVisibleDoc,
          };
        }

        set({
          payments: newPayments,
          lastVisible: lastVisibleDoc,
          hasMore,
          loading: false,
        });
        return newPayments.length;
      } catch (error: any) {
        console.error("Error fetching unidentified payments:", error);
        set({
          error: error.message || "Error al obtener pagos no identificados",
          loading: false,
        });
        return 0;
      }
    },

    // Abre el modal asignando el pago seleccionado
    openPaymentModal: (payment: UnidentifiedPayment) =>
      set({ selectedPayment: payment }),

    closePaymentModal: () => set({ selectedPayment: null }),

    // La función applyPayment se mantiene sin cambios
    applyPayment: async (
      userId: string,
      selectedCharges: ChargeAssignment[],
      attachmentPayment?: string
    ) => {
      const { selectedPayment } = get();
      if (!selectedPayment) throw new Error("No hay pago seleccionado");

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

      const paymentGroupId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      formData.append("paymentGroupId", paymentGroupId);
      formData.append("useCreditBalance", "false");
      formData.append("paymentType", selectedPayment.paymentType);
      formData.append("creditUsed", "0");
      formData.append("paymentDate", selectedPayment.paymentDate.toISOString());
      formData.append(
        "financialAccountId",
        selectedPayment.financialAccountId || ""
      );

      formData.append(
        "attachmentPayment",
        selectedPayment.attachmentPayment || ""
      );

      formData.append("userId", userId);

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
        throw new Error(
          "Debe seleccionar al menos un cargo para asignar el pago"
        );
      }

      set({ loading: true, error: null });
      try {
        await axios.post(
          `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const updateFormData = new FormData();
        updateFormData.append("paymentId", selectedPayment.id);
        updateFormData.append("clientId", clientId);
        updateFormData.append(
          "numberCondominium",
          selectedPayment.condominiumNumber
        );
        updateFormData.append("condominiumId", condominiumId);
        updateFormData.append("isUnidentifiedPayment", "true");
        updateFormData.append("appliedToUser", JSON.stringify(true));
        updateFormData.append(
          "amountPaid",
          String(Math.round(selectedPayment.amountPaid * 100))
        );
        updateFormData.append("amountPending", String(amountPendingCents));
        updateFormData.append("paymentGroupId", paymentGroupId);
        updateFormData.append("paymentType", selectedPayment.paymentType);
        updateFormData.append("creditUsed", "0");
        updateFormData.append(
          "paymentDate",
          selectedPayment.paymentDate.toISOString()
        );
        updateFormData.append("appliedToCondomino", userId);
        updateFormData.append(
          "financialAccountId",
          selectedPayment.financialAccountId || ""
        );

        updateFormData.append(
          "attachmentPayment",
          selectedPayment.attachmentPayment || ""
        );

        await axios.post(
          `${
            import.meta.env.VITE_URL_SERVER
          }/maintenance-fees/create-unidentified`,
          updateFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === selectedPayment.id
              ? { ...p, appliedToUser: true, isUnidentifiedPayment: true }
              : p
          ),
          selectedPayment: null,
          loading: false,
        }));

        await get().fetchPayments(undefined, undefined);
      } catch (error: any) {
        console.error("Error applying unidentified payment:", error);
        set({
          error: error.message || "Error al aplicar el pago",
          loading: false,
        });
        throw error;
      }
    },

    createQRData: async (qrId: string) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("No autorizado");

        const tokenResult = await user.getIdTokenResult();
        const clientId = tokenResult.claims.clientId as string;
        if (!clientId) throw new Error("No se encontró el ID del cliente");

        // Obtener los pagos no identificados
        await get().fetchPayments(100);
        const currentPayments = get().payments;

        // Filtrar solo los últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentPayments = currentPayments.filter(
          (payment) => new Date(payment.paymentDate) > thirtyDaysAgo
        );

        // Guardar los datos en una colección pública
        const db = getFirestore();
        const qrRef = doc(db, "publicQRs", qrId);
        await setDoc(qrRef, {
          payments: recentPayments,
          createdAt: new Date(),
          clientId,
        });
      } catch (error: any) {
        console.error("Error al crear datos del QR:", error);
        throw error;
      }
    },

    getQRData: async (qrId: string) => {
      try {
        const db = getFirestore();
        const qrRef = doc(db, "publicQRs", qrId);
        const qrDoc = await getDoc(qrRef);

        if (!qrDoc.exists()) {
          throw new Error("QR no encontrado");
        }

        const qrData = qrDoc.data();
        return qrData.payments as UnidentifiedPayment[];
      } catch (error: any) {
        console.error("Error al obtener datos del QR:", error);
        throw error;
      }
    },
  })
);
