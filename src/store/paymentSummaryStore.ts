// src/store/paymentSummaryStore.ts
import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Función auxiliar para convertir una URL de imagen a base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  numberCondominium: string;
  month: string; // Mes en formato "MM" obtenido de charge.startAt
  amountPaid: number;
  amountPending: number;
  concept: string; // Tipo de cargo (por ejemplo, "Cuota de mantenimiento", "Electricidad", etc.)
  creditBalance: number; // Puede ser 0 si no se reporta
  paid: boolean; // Indica si el cargo fue pagado (cumplimiento) o no (morosidad)
}

export type MonthlyStat = {
  month: string; // "01", "02", ...
  paid: number;      // Suma de amountPaid
  pending: number;   // Suma de amountPending
  saldo: number;     // Suma de creditBalance
  complianceRate: number;  // % de cargos pagados ese mes
  delinquencyRate: number; // 100 - complianceRate
};

type PaymentSummaryState = {
  payments: PaymentRecord[];
  totalIncome: number;
  totalPending: number;
  detailed: Record<string, PaymentRecord[]>; // Agrupados por número de condómino
  conceptRecords: Record<string, PaymentRecord[]>; // Registros agrupados por concepto
  comparativePercentages: Record<string, { compliance: number; default: number }>;
  monthlyStats: MonthlyStat[];
  totalCondominiums: number;
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureBase64: string;
  loading: boolean;
  error: string | null;
  selectedYear: string;
  fetchSummary: (year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
};

export const usePaymentSummaryStore = create<PaymentSummaryState>((set) => ({
  payments: [],
  totalIncome: 0,
  totalPending: 0,
  detailed: {},
  conceptRecords: {},
  comparativePercentages: {},
  monthlyStats: [],
  totalCondominiums: 0,
  adminCompany: "",
  adminPhone: "",
  adminEmail: "",
  logoBase64: "",
  signatureBase64: "",
  loading: false,
  error: null,
  selectedYear: new Date().getFullYear().toString(),

  fetchSummary: async (year?: string) => {
    set({ loading: true, error: null });
    try {
      const db = getFirestore();
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

      // Obtener datos del cliente (administradora)
      const clientDocRef = doc(db, "clients", clientId);
      const clientDocSnap = await getDoc(clientDocRef);
      let adminCompany = "";
      let adminPhone = "";
      let adminEmail = "";
      let logoBase64 = "";
      let signatureBase64 = "";
      if (clientDocSnap.exists()) {
        const clientData = clientDocSnap.data();
        adminCompany = clientData.companyName || "";
        adminPhone = clientData.phoneNumber || "";
        adminEmail = clientData.email || "";
        const logoUrl = clientData.logoReports || "";
        const signUrl = clientData.signReports || "";
        if (logoUrl) {
          logoBase64 = await getBase64FromUrl(logoUrl);
        }
        if (signUrl) {
          signatureBase64 = await getBase64FromUrl(signUrl);
        }
      }

      // 1. Obtener todos los usuarios (condóminos) del condominio (excluyendo roles administrativos)
      const usersQuery = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          number: doc.data().number,
          ...doc.data(),
        }))
        .filter(
          (u: any) =>
            !["admin", "super-admin", "security", "admin-assistant"].includes(u.role)
        );
      const totalCondominiums = users.length;

      const paymentRecords: PaymentRecord[] = [];
      // Contadores por mes para cargos y cargos pagados (para estadísticas mensuales)
      const chargeCount: Record<string, number> = {};
      const paidChargeCount: Record<string, number> = {};
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        chargeCount[m] = 0;
        paidChargeCount[m] = 0;
      }

      // 2. Recorrer cada usuario y sus cargos (charges)
      for (const userObj of users) {
        const numberCondominium = String(userObj.number);
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userObj.id}/charges`
        );
        const chargesSnapshot = await getDocs(chargesRef);
        for (const chargeDoc of chargesSnapshot.docs) {
          const chargeData = chargeDoc.data();
          // Considerar solo cargos con startAt del año seleccionado
          if (!chargeData.startAt || typeof chargeData.startAt !== "string") continue;
          if (!chargeData.startAt.startsWith(year || new Date().getFullYear().toString()))
            continue;
          // Extraer el mes (por ejemplo, "2025-01-01 00:00" → "01")
          const monthCode = chargeData.startAt.substring(5, 7);

          // Contabilizar el cargo para el mes
          chargeCount[monthCode] = (chargeCount[monthCode] || 0) + 1;
          if (chargeData.paid === true) {
            paidChargeCount[monthCode] = (paidChargeCount[monthCode] || 0) + 1;
          }

          // 3. Agregar datos de la subcolección de payments (si existen)
          const paymentsRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userObj.id}/charges/${chargeDoc.id}/payments`
          );
          const paymentsSnapshot = await getDocs(paymentsRef);
          let totalAmountPaid = 0;
          let totalAmountPendingFromPayments = 0;
          let totalCreditBalance = 0;
          paymentsSnapshot.forEach((paymentDoc) => {
            const paymentData = paymentDoc.data();
            totalAmountPaid += parseFloat(paymentData.amountPaid) || 0;
            totalAmountPendingFromPayments += parseFloat(paymentData.amountPending) || 0;
            totalCreditBalance += parseFloat(paymentData.creditBalance) || 0;
          });
          // Si el cargo NO está pagado, se debe usar el monto pendiente declarado en chargeData (campo "amount")
          // Asumimos que chargeData.amount contiene el monto total a recaudar para ese cargo
          const pendingAmount =
            chargeData.paid === false
              ? parseFloat(chargeData.amount) || 0
              : totalAmountPendingFromPayments;

          const record: PaymentRecord = {
            id: chargeDoc.id,
            clientId,
            numberCondominium,
            month: monthCode,
            amountPaid: totalAmountPaid,
            amountPending: pendingAmount,
            concept: chargeData.concept || "Desconocido",
            creditBalance: totalCreditBalance,
            paid: chargeData.paid === true,
          };
          paymentRecords.push(record);
        }
      }

      // 4. Calcular totales mensuales a partir de los PaymentRecord
      const chartData: Record<string, { paid: number; pending: number; saldo: number }> = {};
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        chartData[m] = { paid: 0, pending: 0, saldo: 0 };
      }
      let totalIncome = 0;
      let totalPending = 0;
      paymentRecords.forEach((pr) => {
        chartData[pr.month].paid += pr.amountPaid;
        // Solo se suma pendiente de cargos no pagados
        if (!pr.paid) {
          chartData[pr.month].pending += pr.amountPending;
          totalPending += pr.amountPending;
        }
        chartData[pr.month].saldo += pr.creditBalance;
        totalIncome += pr.amountPaid;
      });

      // 5. Construir el array de estadísticas mensuales (monthlyStats)
      const monthlyStats: MonthlyStat[] = [];
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        const paid = chartData[m].paid;
        const pending = chartData[m].pending;
        const saldo = chartData[m].saldo;
        const totalCharges = chargeCount[m];
        const paidCharges = paidChargeCount[m];
        const compliance = totalCharges > 0 ? (paidCharges / totalCharges) * 100 : 0;
        const delinquency = 100 - compliance;
        monthlyStats.push({
          month: m,
          paid,
          pending,
          saldo,
          complianceRate: parseFloat(compliance.toFixed(2)),
          delinquencyRate: parseFloat(delinquency.toFixed(2)),
        });
      }

      // 6. Agrupar los PaymentRecord por número de condómino para la vista detallada
      const detailed: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.numberCondominium || "Desconocido";
        if (!detailed[key]) {
          detailed[key] = [];
        }
        detailed[key].push(pr);
      });

      // 7. Agrupar los PaymentRecord por concepto para la vista por concepto
      const conceptRecords: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.concept || "Desconocido";
        if (!conceptRecords[key]) {
          conceptRecords[key] = [];
        }
        conceptRecords[key].push(pr);
      });

      set({
        payments: paymentRecords,
        totalIncome,
        totalPending,
        detailed,
        conceptRecords,
        comparativePercentages: {},
        monthlyStats,
        totalCondominiums,
        adminCompany,
        adminPhone,
        adminEmail,
        logoBase64,
        signatureBase64,
        loading: false,
      });
    } catch (error: any) {
      console.error("Error fetching payment summary:", error);
      set({
        error: error.message || "Error fetching summary",
        loading: false,
      });
    }
  },

  setSelectedYear: (year: string) => set({ selectedYear: year }),
}));