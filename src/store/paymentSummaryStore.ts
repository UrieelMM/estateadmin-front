// src/store/paymentSummaryStore.ts
import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  documentId,
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

// NUEVO: Para convertir centavos (enteros) a pesos (float)
function centsToPesos(val: any): number {
  const intVal = parseInt(val, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

// NUEVA función auxiliar para formatear una fecha a "dd/mm/aaaa"
function formatDate(d: Date): string {
  const day = ("0" + d.getDate()).slice(-2);
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  numberCondominium: string;
  month: string; // "MM"
  amountPaid: number;     // en pesos
  amountPending: number;  // en pesos
  concept: string;
  // Se mantienen los valores de saldo a favor pero ahora se resta el crédito usado
  creditBalance: number;  // en pesos
  creditUsed?: number;    // crédito utilizado (en pesos)
  paid: boolean;
  // ID de la cuenta financiera a la que se aplicó el pago
  financialAccountId: string;
  // Campo de fecha de pago, formateado a "dd/mm/aaaa"
  paymentDate?: string;
}

export type MonthlyStat = {
  month: string;
  paid: number;
  pending: number;
  saldo: number;
  complianceRate: number;
  delinquencyRate: number;
};

type FinancialAccountInfo = {
  id: string;
  name: string;
};

type PaymentSummaryState = {
  payments: PaymentRecord[];
  totalIncome: number;
  totalPending: number;
  detailed: Record<string, PaymentRecord[]>;
  conceptRecords: Record<string, PaymentRecord[]>;
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
  byFinancialAccount: Record<string, PaymentRecord[]>;
  // NUEVO: Mapa con info de cada cuenta financiera
  financialAccountsMap: Record<string, FinancialAccountInfo>;

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
  byFinancialAccount: {},
  financialAccountsMap: {}, // ← NUEVO

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

      // Obtener datos de la administradora
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

      // 1. Obtener todos los usuarios (condóminos)
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
      const chargeCount: Record<string, number> = {};
      const paidChargeCount: Record<string, number> = {};
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        chargeCount[m] = 0;
        paidChargeCount[m] = 0;
      }

      const selectedYearStr = year || new Date().getFullYear().toString();

      // 2. Recorrer usuarios y sus cargos
      for (const userObj of users) {
        const numberCondominium = String(userObj.number);
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userObj.id}/charges`
        );
        const chargesSnapshot = await getDocs(chargesRef);

        for (const chargeDoc of chargesSnapshot.docs) {
          const chargeData = chargeDoc.data();
          if (!chargeData.startAt || typeof chargeData.startAt !== "string") continue;
          if (!chargeData.startAt.startsWith(selectedYearStr)) continue;

          // Extraer el mes (formato "YYYY-MM-DD")
          const monthCode = chargeData.startAt.substring(5, 7);

          chargeCount[monthCode] = (chargeCount[monthCode] || 0) + 1;
          if (chargeData.paid === true) {
            paidChargeCount[monthCode] = (paidChargeCount[monthCode] || 0) + 1;
          }

          // 3. Subcolección de payments
          const paymentsRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userObj.id}/charges/${chargeDoc.id}/payments`
          );
          const paymentsSnapshot = await getDocs(paymentsRef);

          let totalAmountPaid = 0;
          let totalAmountPendingFromPayments = 0;
          let totalCreditBalance = 0;
          let totalCreditUsed = 0;
          let accountId = "";
          let formattedDate = "";

          paymentsSnapshot.forEach((paymentDoc) => {
            const paymentData = paymentDoc.data();
            totalAmountPaid += centsToPesos(paymentData.amountPaid) || 0;
            totalAmountPendingFromPayments += centsToPesos(paymentData.amountPending) || 0;
            totalCreditBalance += centsToPesos(paymentData.creditBalance) || 0;
            totalCreditUsed += paymentData.creditUsed
              ? centsToPesos(paymentData.creditUsed)
              : 0;

            if (!accountId && paymentData.financialAccountId) {
              accountId = paymentData.financialAccountId;
            }

            // Procesar paymentDate y formatearlo
            if (paymentData.paymentDate) {
              if (paymentData.paymentDate.toDate) {
                const d = paymentData.paymentDate.toDate();
                formattedDate = formatDate(d);
              } else if (typeof paymentData.paymentDate === "string") {
                const d = new Date(paymentData.paymentDate);
                formattedDate = !isNaN(d.getTime())
                  ? formatDate(d)
                  : paymentData.paymentDate;
              }
            }
          });

          let pendingAmount = 0;
          if (chargeData.paid === false) {
            pendingAmount = centsToPesos(chargeData.amount) || 0;
          } else {
            pendingAmount = totalAmountPendingFromPayments;
          }

          const record: PaymentRecord = {
            id: chargeDoc.id,
            clientId,
            numberCondominium,
            month: monthCode,
            amountPaid: parseFloat(totalAmountPaid.toFixed(2)),
            amountPending: parseFloat(pendingAmount.toFixed(2)),
            concept: chargeData.concept || "Desconocido",
            creditBalance: parseFloat(totalCreditBalance.toFixed(2)),
            creditUsed: parseFloat(totalCreditUsed.toFixed(2)),
            paid: chargeData.paid === true,
            financialAccountId: accountId || "N/A",
            paymentDate: formattedDate,
          };
          paymentRecords.push(record);
        }
      }

      // Calcular totales, agrupaciones, etc.
      const chartData: Record<string, { paid: number; pending: number; saldo: number }> = {};
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        chartData[m] = { paid: 0, pending: 0, saldo: 0 };
      }
      let totalIncome = 0;
      let totalPending = 0;
      paymentRecords.forEach((pr) => {
        chartData[pr.month].paid += pr.amountPaid;
        if (!pr.paid) {
          chartData[pr.month].pending += pr.amountPending;
          totalPending += pr.amountPending;
        }
        chartData[pr.month].saldo += pr.creditBalance - (pr.creditUsed || 0);
        totalIncome += pr.amountPaid;
      });

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
          paid: parseFloat(paid.toFixed(2)),
          pending: parseFloat(pending.toFixed(2)),
          saldo: parseFloat(saldo.toFixed(2)),
          complianceRate: parseFloat(compliance.toFixed(2)),
          delinquencyRate: parseFloat(delinquency.toFixed(2)),
        });
      }

      const detailed: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.numberCondominium || "Desconocido";
        if (!detailed[key]) {
          detailed[key] = [];
        }
        detailed[key].push(pr);
      });

      const conceptRecords: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.concept || "Desconocido";
        if (!conceptRecords[key]) {
          conceptRecords[key] = [];
        }
        conceptRecords[key].push(pr);
      });

      const byFinancialAccount: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.financialAccountId;
        if (!byFinancialAccount[key]) {
          byFinancialAccount[key] = [];
        }
        byFinancialAccount[key].push(pr);
      });

      // NUEVO: obtener nombres de las cuentas
      const uniqueAccountIds = Array.from(
        new Set(paymentRecords.map((pr) => pr.financialAccountId))
      ).filter((id) => id && id !== "N/A");

      let financialAccountsMap: Record<string, { id: string; name: string }> = {};
      if (uniqueAccountIds.length > 0) {
        const accountsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
        );

        // Si hay <= 10 IDs, se puede usar query con where in
        // Si hay más, considera dividir la consulta o hacer un getDoc por cada ID
        if (uniqueAccountIds.length <= 10) {
          const q = query(accountsRef, where(documentId(), "in", uniqueAccountIds));
          const accountsSnap = await getDocs(q);
          accountsSnap.forEach((accDoc) => {
            if (accDoc.exists()) {
              const data = accDoc.data();
              financialAccountsMap[accDoc.id] = {
                id: accDoc.id,
                name: data.name || "Sin nombre",
              };
            }
          });
        } else {
          // Para evitar problemas con más de 10 IDs en "where in", haz fetch individual
          for (const accId of uniqueAccountIds) {
            const accRef = doc(accountsRef, accId);
            const accSnap = await getDoc(accRef);
            if (accSnap.exists()) {
              const data = accSnap.data();
              financialAccountsMap[accId] = {
                id: accId,
                name: data.name || "Sin nombre",
              };
            }
          }
        }
      }

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
        byFinancialAccount,
        financialAccountsMap, // Guardamos el mapa de cuentas con su nombre
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
