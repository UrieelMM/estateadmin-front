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
  onSnapshot,
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

// Función para convertir centavos (enteros) a pesos (float)
function centsToPesos(val: any): number {
  const intVal = parseInt(val, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

// Función auxiliar para formatear una fecha a "dd/mm/aaaa"
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
  creditBalance: number;  // en pesos
  creditUsed?: number;    // crédito utilizado (en pesos)
  paid: boolean;
  financialAccountId: string;
  paymentDate?: string;
}

export type MonthlyStat = {
  month: string;
  paid: number;
  pending: number;
  saldo: number;
  unidentifiedPayments: number;
  complianceRate: number;
  delinquencyRate: number;
};

export type FinancialAccountInfo = {
  id: string;
  name: string;
  initialBalance: number;
  creationMonth: string;
};

export type PaymentSummaryState = {
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
  financialAccountsMap: Record<string, FinancialAccountInfo>;
  lastFetch: Record<string, number>;
  unsubscribe: Record<string, () => void>;

  fetchSummary: (year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
  shouldFetchData: (year: string) => boolean;
  setupRealtimeListeners: (year: string) => void;
  cleanupListeners: (year: string) => void;
};

export const usePaymentSummaryStore = create<PaymentSummaryState>((set, get) => ({
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
  financialAccountsMap: {},
  lastFetch: {},
  unsubscribe: {},

  shouldFetchData: (year: string) => {
    const lastFetchTime = get().lastFetch[year];
    const now = Date.now();
    // Recargar si no hay datos previos o si han pasado más de 5 minutos
    return !lastFetchTime || (now - lastFetchTime) > 300000;
  },

  fetchSummary: async (year?: string) => {
    const currentYear = year || new Date().getFullYear().toString();
    const store = get();
    
    // Si ya tenemos datos recientes, no recargar
    if (!store.shouldFetchData(currentYear)) {
      return;
    }

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
        const [logoRes, signRes] = await Promise.all([
          logoUrl ? getBase64FromUrl(logoUrl) : Promise.resolve(""),
          signUrl ? getBase64FromUrl(signUrl) : Promise.resolve(""),
        ]);
        logoBase64 = logoRes;
        signatureBase64 = signRes;
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

      const selectedYearStr = currentYear;

      // 2. Procesar en paralelo los cargos y pagos de cada usuario
      const userRecordsArrays = await Promise.all(
        users.map(async (userObj) => {
          const numberCondominium = String(userObj.number);
          const chargesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userObj.id}/charges`
          );
          const chargesSnapshot = await getDocs(chargesRef);
          const chargeRecords = await Promise.all(
            chargesSnapshot.docs.map(async (chargeDoc) => {
              const chargeData = chargeDoc.data();
              if (!chargeData.startAt || typeof chargeData.startAt !== "string") return null;
              if (!chargeData.startAt.startsWith(selectedYearStr)) return null;

              const monthCode = chargeData.startAt.substring(5, 7);
              chargeCount[monthCode] = (chargeCount[monthCode] || 0) + 1;
              if (chargeData.paid === true) {
                paidChargeCount[monthCode] = (paidChargeCount[monthCode] || 0) + 1;
              }

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
                totalCreditUsed += paymentData.creditUsed ? centsToPesos(paymentData.creditUsed) : 0;

                if (!accountId && paymentData.financialAccountId) {
                  accountId = paymentData.financialAccountId;
                }

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
              return record;
            })
          );
          return chargeRecords.filter((record) => record !== null) as PaymentRecord[];
        })
      );
      paymentRecords.push(...userRecordsArrays.flat());

      // Incluir pagos NO identificados
      const unidentifiedPaymentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
      );
      const unidentifiedPaymentsSnapshot = await getDocs(unidentifiedPaymentsRef);
      unidentifiedPaymentsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let include = false;
        let paymentDateObj: Date | null = null;
        let formattedDate = "";
        if (data.paymentDate) {
          if (data.paymentDate.toDate) {
            paymentDateObj = data.paymentDate.toDate();
          } else {
            paymentDateObj = new Date(data.paymentDate);
          }
          if (paymentDateObj && paymentDateObj.getFullYear().toString() === selectedYearStr) {
            include = true;
            if (paymentDateObj) {
              formattedDate = formatDate(paymentDateObj);
            }
          }
        }
        if (!include) return;
        
        let monthVal = data.month;
        if (!monthVal && paymentDateObj) {
          monthVal = (paymentDateObj.getMonth() + 1).toString().padStart(2, "0");
        }

        const record: PaymentRecord = {
          id: docSnap.id,
          clientId,
          numberCondominium: data.numberCondominium || "N/A",
          month: monthVal || "",
          amountPaid: parseFloat(centsToPesos(data.amountPaid).toFixed(2)),
          amountPending: parseFloat(centsToPesos(data.amountPending).toFixed(2)),
          concept: "Pago no identificado",
          creditBalance: data.creditBalance ? parseFloat(centsToPesos(data.creditBalance).toFixed(2)) : 0,
          creditUsed: data.creditUsed ? parseFloat(centsToPesos(data.creditUsed).toFixed(2)) : 0,
          paid: false,
          financialAccountId: data.financialAccountId || "N/A",
          paymentDate: formattedDate,
        };
        paymentRecords.push(record);
      });

      // Calcular totales y agrupaciones
      const chartData: Record<string, { 
        paid: number; 
        pending: number; 
        saldo: number;
        unidentifiedPayments: number;
      }> = {};
      
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        chartData[m] = { 
          paid: 0, 
          pending: 0, 
          saldo: 0,
          unidentifiedPayments: 0
        };
      }

      let totalIncome = 0;
      let totalPending = 0;
      paymentRecords.forEach((pr) => {
        if (!pr.month) return;
        chartData[pr.month].paid += pr.amountPaid;
        if (!pr.paid) {
          chartData[pr.month].pending += pr.amountPending;
          totalPending += pr.amountPending;
        }
        chartData[pr.month].saldo += pr.creditBalance - (pr.creditUsed || 0);
        if (pr.concept === "Pago no identificado" && !pr.paid) {
          chartData[pr.month].unidentifiedPayments += pr.amountPaid;
        }
        totalIncome += pr.amountPaid;
      });

      const monthlyStats: MonthlyStat[] = [];
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        const paid = chartData[m].paid;
        const pending = chartData[m].pending;
        const saldo = chartData[m].saldo;
        const unidentifiedPayments = chartData[m].unidentifiedPayments;
        const totalCharges = chargeCount[m];
        const paidCharges = paidChargeCount[m];
        const compliance = totalCharges > 0 ? (paidCharges / totalCharges) * 100 : 0;
        const delinquency = 100 - compliance;
        
        monthlyStats.push({
          month: m,
          paid: parseFloat(paid.toFixed(2)),
          pending: parseFloat(pending.toFixed(2)),
          saldo: parseFloat(saldo.toFixed(2)),
          unidentifiedPayments: parseFloat(unidentifiedPayments.toFixed(2)),
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
        if (pr.financialAccountId === "N/A") return;
        if (!byFinancialAccount[pr.financialAccountId]) {
          byFinancialAccount[pr.financialAccountId] = [];
        }
        byFinancialAccount[pr.financialAccountId].push(pr);
      });

      const uniqueAccountIds = Array.from(
        new Set(paymentRecords.map((pr) => pr.financialAccountId))
      ).filter((id) => id && id !== "N/A");

      let financialAccountsMap: Record<string, FinancialAccountInfo> = {};
      if (uniqueAccountIds.length > 0) {
        const accountsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
        );

        const getCreationMonth = (createdAt: any): string => {
          let date: Date;
          if (createdAt && createdAt.toDate) {
            date = createdAt.toDate();
          } else if (createdAt) {
            date = new Date(createdAt);
          } else {
            return "01";
          }
          return (date.getMonth() + 1).toString().padStart(2, "0");
        };

        if (uniqueAccountIds.length <= 10) {
          const q = query(accountsRef, where(documentId(), "in", uniqueAccountIds));
          const accountsSnap = await getDocs(q);
          accountsSnap.forEach((accDoc) => {
            if (accDoc.exists()) {
              const data = accDoc.data();
              financialAccountsMap[accDoc.id] = {
                id: accDoc.id,
                name: data.name || "Sin nombre",
                initialBalance:
                  data.initialBalance != null ? Number(data.initialBalance) / 100 : 0,
                creationMonth: getCreationMonth(data.createdAt),
              };
            }
          });
        } else {
          for (const accId of uniqueAccountIds) {
            const accRef = doc(accountsRef, accId);
            const accSnap = await getDoc(accRef);
            if (accSnap.exists()) {
              const data = accSnap.data();
              financialAccountsMap[accId] = {
                id: accId,
                name: data.name || "Sin nombre",
                initialBalance:
                  data.initialBalance != null ? Number(data.initialBalance) / 100 : 0,
                creationMonth: getCreationMonth(data.createdAt),
              };
            }
          }
        }
      }

      let totalInitialBalance = 0;
      for (const accId in financialAccountsMap) {
        totalInitialBalance += financialAccountsMap[accId].initialBalance;
      }
      totalIncome += totalInitialBalance;

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
        financialAccountsMap,
        lastFetch: {
          ...get().lastFetch,
          [currentYear]: Date.now()
        }
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

  setupRealtimeListeners: async (year: string) => {
    const store = get();
    if (store.unsubscribe[year]) {
      store.unsubscribe[year]();
    }

    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const cleanupFunctions: (() => void)[] = [];

      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const usersSnapshot = await getDocs(usersRef);
      const users = usersSnapshot.docs.filter(
        doc => !["admin", "super-admin", "security", "admin-assistant"].includes(doc.data().role)
      );

      for (const userDoc of users) {
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
        );
        const unsubscribeCharges = onSnapshot(
          chargesRef,
          async () => {
            set(state => ({
              lastFetch: {
                ...state.lastFetch,
                [year]: 0
              }
            }));
            await get().fetchSummary(year);
          },
          (error) => {
            console.error("Error en listener de cargos:", error);
          }
        );
        cleanupFunctions.push(unsubscribeCharges);
      }

      const unidentifiedPaymentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
      );
      const unsubscribeUnidentified = onSnapshot(
        unidentifiedPaymentsRef,
        async () => {
          set(state => ({
            lastFetch: {
              ...state.lastFetch,
              [year]: 0
            }
          }));
          await get().fetchSummary(year);
        },
        (error) => {
          console.error("Error en listener de pagos no identificados:", error);
        }
      );
      cleanupFunctions.push(unsubscribeUnidentified);

      const financialAccountsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
      );
      const unsubscribeAccounts = onSnapshot(
        financialAccountsRef,
        async () => {
          set(state => ({
            lastFetch: {
              ...state.lastFetch,
              [year]: 0
            }
          }));
          await get().fetchSummary(year);
        },
        (error) => {
          console.error("Error en listener de cuentas financieras:", error);
        }
      );
      cleanupFunctions.push(unsubscribeAccounts);

      set(state => ({
        unsubscribe: {
          ...state.unsubscribe,
          [year]: () => {
            cleanupFunctions.forEach(cleanup => cleanup());
          }
        }
      }));

    } catch (error: any) {
      console.error("Error setting up listeners:", error);
      set({ error: error.message, loading: false });
    }
  },

  cleanupListeners: (year: string) => {
    const store = get();
    if (store.unsubscribe[year]) {
      store.unsubscribe[year]();
      set(state => ({
        unsubscribe: { ...state.unsubscribe, [year]: undefined as unknown as () => void }
      }));
    }
  },
}));
