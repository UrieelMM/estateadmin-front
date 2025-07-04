// src/store/paymentSummaryStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  documentId,
  onSnapshot,
  orderBy,
  limit,
  startAfter as firestoreStartAfter,
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
  amountPaid: number; // en pesos
  amountPending: number; // en pesos
  concept: string;
  paymentType?: string; // Tipo de pago (Transferencia, Efectivo, etc.)
  creditBalance: number; // en pesos
  creditUsed?: number; // crédito utilizado (en pesos)
  paid: boolean;
  financialAccountId: string;
  paymentDate?: string;
  attachmentPayment?: string; // URL del comprobante de pago
  chargeId?: string; // ID del cargo asociado
  userId?: string; // ID del usuario asociado
  referenceAmount: number; // en pesos
}

export type MonthlyStat = {
  month: string;
  paid: number;
  pending: number;
  saldo: number;
  unidentifiedPayments: number;
  complianceRate: number;
  delinquencyRate: number;
  creditUsed: number;
  charges: number;
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
  comparativePercentages: Record<
    string,
    { compliance: number; default: number }
  >;
  monthlyStats: MonthlyStat[];
  totalCondominiums: number;
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureUrl: string;
  signatureBase64: string;
  loading: boolean;
  error: string | null;
  selectedYear: string;
  byFinancialAccount: Record<string, PaymentRecord[]>;
  financialAccountsMap: Record<string, FinancialAccountInfo>;
  lastFetch: Record<string, number>;
  unsubscribe: Record<string, () => void>;
  completedPayments: PaymentRecord[];
  totalCompletedPayments: number;
  lastPaymentDoc: any | null;
  loadingPayments: boolean;
  pageSize?: number;
  startAfter?: any;
  filters?: { month?: string; year?: string };

  fetchSummary: (year?: string, forceUpdate?: boolean) => Promise<void>;
  setSelectedYear: (year: string) => void;
  shouldFetchData: (year: string) => boolean;
  setupRealtimeListeners: (year: string) => void;
  cleanupListeners: (year: string) => void;
  fetchCompletedPayments: (
    pageSize?: number,
    startAfter?: any
  ) => Promise<void>;
  resetPaymentsState: () => void;
  fetchPaymentHistory: (
    pageSize?: number,
    startAfter?: any,
    filters?: { month?: string; year?: string }
  ) => Promise<number>;
  searchPaymentByFolio: (folio: string) => Promise<PaymentRecord[]>;
  // Nueva función para procesar datos para reportes individuales
  prepareSingleReportData: (numberCondominium: string) => {
    detailed: Record<string, PaymentRecord[]>;
    detailedByConcept: Record<string, Record<string, PaymentRecord[]>>;
  };
};

// Variable de caché para resultados de paginación (clave basada en filtros y cursor)
const paymentHistoryCache: Record<
  string,
  { payments: PaymentRecord[]; lastDoc: any }
> = {};

export const usePaymentSummaryStore = create<PaymentSummaryState>()(
  (set, get) => ({
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
    signatureUrl: "",
    signatureBase64: "",
    loading: false,
    error: null,
    selectedYear: new Date().getFullYear().toString(),
    byFinancialAccount: {},
    financialAccountsMap: {},
    lastFetch: {},
    unsubscribe: {},
    completedPayments: [],
    totalCompletedPayments: 0,
    lastPaymentDoc: null,
    loadingPayments: false,

    shouldFetchData: (year: string) => {
      const lastFetchTime = get().lastFetch[year];
      const now = Date.now();
      // Recargar si no hay datos previos o si han pasado más de 5 minutos
      return !lastFetchTime || now - lastFetchTime > 300000;
    },

    fetchSummary: async (year?: string, forceUpdate: boolean = false) => {
      const currentYear =
        year === undefined || year === null
          ? new Date().getFullYear().toString()
          : year;
      const store = get();

      // Solo verificamos shouldFetchData si no es forceUpdate
      if (!forceUpdate && !store.shouldFetchData(currentYear)) {
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
        let signatureUrl = "";
        let signatureBase64 = "";
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          adminCompany = clientData.companyName || "";
          adminPhone = clientData.phoneNumber || "";
          adminEmail = clientData.email || "";
          signatureUrl = clientData.signatureUrl || "";

          try {
            const logoUrl = clientData.logoReports;
            const [logoRes, signRes] = await Promise.all([
              logoUrl ? getBase64FromUrl(logoUrl) : Promise.resolve(""),
              signatureUrl
                ? getBase64FromUrl(signatureUrl)
                : Promise.resolve(""),
            ]);
            logoBase64 = logoRes || "";
            signatureBase64 = signRes || "";
          } catch (error) {
            console.error("Error al cargar logo o firma:", error);
            logoBase64 = "";
            signatureBase64 = "";
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
              !["admin", "super-admin", "security", "admin-assistant"].includes(
                u.role
              )
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
                if (
                  !chargeData.startAt ||
                  typeof chargeData.startAt !== "string"
                )
                  return null;
                if (
                  selectedYearStr &&
                  !chargeData.startAt.startsWith(selectedYearStr)
                )
                  return null;

                const monthCode = chargeData.startAt.substring(5, 7);
                // Solo contar cargos que tengan un monto mayor a 0
                if (centsToPesos(chargeData.amount) > 0) {
                  chargeCount[monthCode] = (chargeCount[monthCode] || 0) + 1;
                  // Si el amount es 0, significa que está pagado completamente
                  if (centsToPesos(chargeData.amount) === 0) {
                    paidChargeCount[monthCode] =
                      (paidChargeCount[monthCode] || 0) + 1;
                  }
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
                  totalAmountPendingFromPayments +=
                    centsToPesos(paymentData.amountPending) || 0;
                  totalCreditBalance +=
                    centsToPesos(paymentData.creditBalance) || 0;
                  totalCreditUsed += paymentData.creditUsed
                    ? centsToPesos(paymentData.creditUsed)
                    : 0;

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

                // Obtener el referenceAmount directamente del cargo
                const referenceAmount =
                  centsToPesos(chargeData.referenceAmount) || 0;

                const record: PaymentRecord = {
                  id: chargeDoc.id,
                  clientId,
                  numberCondominium,
                  month: monthCode,
                  amountPaid: parseFloat(totalAmountPaid.toFixed(2)),
                  amountPending: parseFloat(pendingAmount.toFixed(2)),
                  concept: Array.isArray(chargeData.concept)
                    ? chargeData.concept.join(", ")
                    : chargeData.concept || "Desconocido",
                  paymentType: chargeData.paymentType,
                  creditBalance: parseFloat(totalCreditBalance.toFixed(2)),
                  creditUsed: parseFloat(totalCreditUsed.toFixed(2)),
                  paid: chargeData.paid === true,
                  financialAccountId: accountId || "N/A",
                  paymentDate: formattedDate,
                  attachmentPayment: chargeData.attachmentPayment,
                  chargeId: chargeDoc.id,
                  userId: userObj.id,
                  referenceAmount: parseFloat(referenceAmount.toFixed(2)),
                };
                return record;
              })
            );
            return chargeRecords.filter(
              (record) => record !== null
            ) as PaymentRecord[];
          })
        );
        paymentRecords.push(...userRecordsArrays.flat());

        // Incluir pagos NO identificados
        const unidentifiedPaymentsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
        );
        const unidentifiedPaymentsSnapshot = await getDocs(
          unidentifiedPaymentsRef
        );
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
            if (
              !selectedYearStr ||
              (paymentDateObj &&
                paymentDateObj.getFullYear().toString() === selectedYearStr)
            ) {
              include = true;
              if (paymentDateObj) {
                formattedDate = formatDate(paymentDateObj);
              }
            }
          }
          if (!include) return;

          let monthVal = data.month;
          if (!monthVal && paymentDateObj) {
            monthVal = (paymentDateObj.getMonth() + 1)
              .toString()
              .padStart(2, "0");
          }

          const record: PaymentRecord = {
            id: docSnap.id,
            clientId,
            numberCondominium: data.numberCondominium || "N/A",
            month: monthVal || "",
            amountPaid: parseFloat(centsToPesos(data.amountPaid).toFixed(2)),
            amountPending: parseFloat(
              centsToPesos(data.amountPending).toFixed(2)
            ),
            concept: "Pago no identificado",
            paymentType: data.paymentType,
            creditBalance: data.creditBalance
              ? parseFloat(centsToPesos(data.creditBalance).toFixed(2))
              : 0,
            creditUsed: data.creditUsed
              ? parseFloat(centsToPesos(data.creditUsed).toFixed(2))
              : 0,
            paid: false,
            financialAccountId: data.financialAccountId || "N/A",
            paymentDate: formattedDate,
            attachmentPayment: data.attachmentPayment,
            chargeId: docSnap.id,
            userId: docSnap.id,
            referenceAmount: parseFloat(
              centsToPesos(data.referenceAmount).toFixed(2)
            ),
          };
          paymentRecords.push(record);
        });

        // Calcular totales y agrupaciones
        const chartData: Record<
          string,
          {
            paid: number;
            pending: number;
            saldo: number;
            unidentifiedPayments: number;
            creditUsed: number;
            charges: number;
          }
        > = {};

        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, "0");
          chartData[m] = {
            paid: 0,
            pending: 0,
            saldo: 0,
            unidentifiedPayments: 0,
            creditUsed: 0,
            charges: 0,
          };
        }

        let totalIncome = 0;
        let totalPending = 0;

        // Procesar todos los registros
        paymentRecords.forEach((pr) => {
          if (!pr.month) return;

          // Sumar el referenceAmount a los cargos del mes
          chartData[pr.month].charges += pr.referenceAmount;

          // Resto de cálculos
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
          chartData[pr.month].creditUsed += pr.creditUsed || 0;
        });

        const monthlyStats: MonthlyStat[] = [];
        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, "0");
          const paid = chartData[m].paid;
          const pending = chartData[m].pending;
          const saldo = chartData[m].saldo;
          const unidentifiedPayments = chartData[m].unidentifiedPayments;
          const totalCharges = chartData[m].charges;
          const totalChargesForMonth = chargeCount[m];
          const paidChargesForMonth = paidChargeCount[m];
          const compliance =
            totalChargesForMonth > 0
              ? (paidChargesForMonth / totalChargesForMonth) * 100
              : 0;
          const delinquency = 100 - compliance;

          // Calcular el crédito utilizado para este mes
          const totalCreditUsed = chartData[m].creditUsed || 0;

          monthlyStats.push({
            month: m,
            paid: parseFloat(paid.toFixed(2)),
            pending: parseFloat(pending.toFixed(2)),
            saldo: parseFloat(saldo.toFixed(2)),
            unidentifiedPayments: parseFloat(unidentifiedPayments.toFixed(2)),
            complianceRate: parseFloat(compliance.toFixed(2)),
            delinquencyRate: parseFloat(delinquency.toFixed(2)),
            creditUsed: parseFloat(totalCreditUsed.toFixed(2)),
            charges: parseFloat(totalCharges.toFixed(2)),
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
            const q = query(
              accountsRef,
              where(documentId(), "in", uniqueAccountIds)
            );
            const accountsSnap = await getDocs(q);
            accountsSnap.forEach((accDoc) => {
              if (accDoc.exists()) {
                const data = accDoc.data();
                financialAccountsMap[accDoc.id] = {
                  id: accDoc.id,
                  name: data.name || "Sin nombre",
                  initialBalance:
                    data.initialBalance != null
                      ? Number(data.initialBalance) / 100
                      : 0,
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
                    data.initialBalance != null
                      ? Number(data.initialBalance) / 100
                      : 0,
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
          signatureUrl,
          signatureBase64,
          loading: false,
          byFinancialAccount,
          financialAccountsMap,
          lastFetch: {
            ...get().lastFetch,
            [currentYear]: Date.now(),
          },
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
          (doc) =>
            !["admin", "super-admin", "security", "admin-assistant"].includes(
              doc.data().role
            )
        );

        for (const userDoc of users) {
          const chargesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
          );
          const unsubscribeCharges = onSnapshot(
            chargesRef,
            async () => {
              set((state) => ({
                lastFetch: {
                  ...state.lastFetch,
                  [year]: 0,
                },
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
            set((state) => ({
              lastFetch: {
                ...state.lastFetch,
                [year]: 0,
              },
            }));
            await get().fetchSummary(year);
          },
          (error) => {
            console.error(
              "Error en listener de pagos no identificados:",
              error
            );
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
            set((state) => ({
              lastFetch: {
                ...state.lastFetch,
                [year]: 0,
              },
            }));
            await get().fetchSummary(year);
          },
          (error) => {
            console.error("Error en listener de cuentas financieras:", error);
          }
        );
        cleanupFunctions.push(unsubscribeAccounts);

        set((state) => ({
          unsubscribe: {
            ...state.unsubscribe,
            [year]: () => {
              cleanupFunctions.forEach((cleanup) => cleanup());
            },
          },
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
        set((state) => ({
          unsubscribe: {
            ...state.unsubscribe,
            [year]: undefined as unknown as () => void,
          },
        }));
      }
    },

    resetPaymentsState: () => {
      set({
        completedPayments: [],
        totalCompletedPayments: 0,
        lastPaymentDoc: null,
        loadingPayments: false,
      });
    },

    fetchCompletedPayments: async (pageSize = 20, startAfter = null) => {
      set({ loadingPayments: true });
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

        // 1. Obtener usuarios
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );
        const usersSnapshot = await getDocs(usersRef);
        const users = usersSnapshot.docs.filter(
          (doc) =>
            !["admin", "super-admin", "security", "admin-assistant"].includes(
              doc.data().role
            )
        );

        const paymentRecords: PaymentRecord[] = [];
        let processedPayments = 0;

        // 2. Para cada usuario, obtener sus cargos y pagos
        for (const userDoc of users) {
          const userData = userDoc.data();
          const chargesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
          );
          const chargesSnapshot = await getDocs(chargesRef);

          for (const chargeDoc of chargesSnapshot.docs) {
            const chargeData = chargeDoc.data();
            const paymentsRef = collection(chargeDoc.ref, "payments");
            const paymentsSnapshot = await getDocs(paymentsRef);

            for (const paymentDoc of paymentsSnapshot.docs) {
              if (processedPayments >= pageSize) break;

              const paymentData = paymentDoc.data();
              let formattedDate = "";

              if (paymentData.paymentDate) {
                if (paymentData.paymentDate.toDate) {
                  formattedDate = formatDate(paymentData.paymentDate.toDate());
                } else if (typeof paymentData.paymentDate === "string") {
                  const d = new Date(paymentData.paymentDate);
                  formattedDate = !isNaN(d.getTime())
                    ? formatDate(d)
                    : paymentData.paymentDate;
                }
              }

              const record: PaymentRecord = {
                id: paymentDoc.id,
                clientId,
                numberCondominium: userData.number || "N/A",
                month: chargeData.startAt
                  ? chargeData.startAt.substring(5, 7)
                  : "",
                amountPaid: centsToPesos(paymentData.amountPaid),
                amountPending: centsToPesos(paymentData.amountPending),
                concept: Array.isArray(chargeData.concept)
                  ? chargeData.concept.join(", ")
                  : chargeData.concept || "Desconocido",
                paymentType: paymentData.paymentType,
                creditBalance: centsToPesos(paymentData.creditBalance),
                creditUsed: paymentData.creditUsed
                  ? centsToPesos(paymentData.creditUsed)
                  : 0,
                paid: true,
                financialAccountId: paymentData.financialAccountId || "N/A",
                paymentDate: formattedDate,
                attachmentPayment: paymentData.attachmentPayment,
                chargeId: chargeDoc.id,
                userId: userDoc.id,
                referenceAmount: parseFloat(
                  centsToPesos(chargeData.amount).toFixed(2)
                ),
              };

              paymentRecords.push(record);
              processedPayments++;
            }

            if (processedPayments >= pageSize) break;
          }

          if (processedPayments >= pageSize) break;
        }

        // 3. Incluir pagos no identificados si hay espacio
        if (processedPayments < pageSize) {
          const unidentifiedRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
          );
          const unidentifiedSnapshot = await getDocs(unidentifiedRef);

          for (const docSnap of unidentifiedSnapshot.docs) {
            if (processedPayments >= pageSize) break;

            const data = docSnap.data();
            let formattedDate = "";

            if (data.paymentDate) {
              if (data.paymentDate.toDate) {
                formattedDate = formatDate(data.paymentDate.toDate());
              } else if (typeof data.paymentDate === "string") {
                const d = new Date(data.paymentDate);
                formattedDate = !isNaN(d.getTime())
                  ? formatDate(d)
                  : data.paymentDate;
              }
            }

            const record: PaymentRecord = {
              id: docSnap.id,
              clientId,
              numberCondominium: data.numberCondominium || "N/A",
              month: data.month || "",
              amountPaid: centsToPesos(data.amountPaid),
              amountPending: centsToPesos(data.amountPending),
              concept: "Pago no identificado",
              paymentType: data.paymentType,
              creditBalance: data.creditBalance
                ? centsToPesos(data.creditBalance)
                : 0,
              creditUsed: data.creditUsed ? centsToPesos(data.creditUsed) : 0,
              paid: true,
              financialAccountId: data.financialAccountId || "N/A",
              paymentDate: formattedDate,
              attachmentPayment: data.attachmentPayment,
              chargeId: docSnap.id,
              userId: docSnap.id,
              referenceAmount: parseFloat(
                centsToPesos(data.referenceAmount).toFixed(2)
              ),
            };

            paymentRecords.push(record);
            processedPayments++;
          }
        }

        // Ordenar por fecha de pago (más reciente primero)
        paymentRecords.sort((a, b) => {
          const dateA = a.paymentDate
            ? new Date(a.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          const dateB = b.paymentDate
            ? new Date(b.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        // Actualizar el estado
        set((state) => ({
          completedPayments: startAfter
            ? [...state.completedPayments, ...paymentRecords]
            : paymentRecords,
          lastPaymentDoc: paymentRecords[paymentRecords.length - 1]?.id || null,
          loadingPayments: false,
          totalCompletedPayments: paymentRecords.length, // Esto se actualizará con el total real en la siguiente iteración
        }));
      } catch (error: any) {
        console.error("Error fetching completed payments:", error);
        set({
          error: error.message || "Error fetching payments",
          loadingPayments: false,
        });
      }
    },

    // NUEVA IMPLEMENTACIÓN DE fetchPaymentHistory CON OPTIMIZACIÓN (COLLECTION GROUP + CACHÉ + PAGINACIÓN CLÁSICA)
    fetchPaymentHistory: async (
      pageSize = 20,
      startAfter = null,
      filters = {}
    ): Promise<number> => {
      set({ loadingPayments: true });
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

        // Generar llave para caché basada en filtros y cursor
        const cacheKey = JSON.stringify({
          filters,
          startAfter: startAfter ? startAfter.id : "first",
        });
        // Usar caché solo si no se aplican filtros (para asegurar que se obtengan datos actualizados)
        if (!filters.month && !filters.year && paymentHistoryCache[cacheKey]) {
          const cached = paymentHistoryCache[cacheKey];
          set({
            completedPayments: cached.payments,
            lastPaymentDoc: cached.lastDoc,
            loadingPayments: false,
            totalCompletedPayments: cached.payments.length,
          });
          return cached.payments.length;
        }

        const paymentsQuery = query(
          collectionGroup(db, "payments"),
          where("clientId", "==", clientId),
          where("condominiumId", "==", condominiumId),
          orderBy("paymentDate", "desc"),
          ...(startAfter ? [firestoreStartAfter(startAfter)] : []),
          limit(pageSize)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);

        let paymentRecords: PaymentRecord[] = [];
        let lastDoc: any = null;
        paymentsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedDate = "";
          if (data.paymentDate) {
            if (data.paymentDate.toDate) {
              formattedDate = formatDate(data.paymentDate.toDate());
            } else if (typeof data.paymentDate === "string") {
              const d = new Date(data.paymentDate);
              formattedDate = !isNaN(d.getTime())
                ? formatDate(d)
                : data.paymentDate;
            }
          }
          // Aplicar filtros (por mes y año) si se especifican
          if (formattedDate) {
            const [_day, month, year] = formattedDate.split("/");
            if (filters.month && month !== filters.month) return;
            if (filters.year && year !== filters.year) return;
          }
          const record: PaymentRecord = {
            id: docSnap.id,
            clientId,
            numberCondominium: data.numberCondominium || "N/A",
            month:
              data.month || (formattedDate ? formattedDate.split("/")[1] : ""),
            amountPaid: centsToPesos(data.amountPaid),
            amountPending: centsToPesos(data.amountPending),
            concept: Array.isArray(data.concept)
              ? data.concept.join(", ")
              : data.concept || "Desconocido",
            paymentType: data.paymentType,
            creditBalance: centsToPesos(data.creditBalance),
            creditUsed: data.creditUsed ? centsToPesos(data.creditUsed) : 0,
            paid: true,
            financialAccountId: data.financialAccountId || "N/A",
            paymentDate: formattedDate,
            attachmentPayment: data.attachmentPayment,
            chargeId: data.chargeId || "",
            userId: data.userId || "",
            referenceAmount: parseFloat(centsToPesos(data.amount).toFixed(2)),
          };
          paymentRecords.push(record);
          lastDoc = docSnap;
        });

        // Si no se alcanzó el pageSize, incluir pagos no identificados
        if (paymentRecords.length < pageSize) {
          const unidentifiedQuery = query(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
            ),
            orderBy("paymentDate", "desc"),
            ...(startAfter ? [firestoreStartAfter(startAfter)] : []),
            limit(pageSize - paymentRecords.length)
          );
          const unidentifiedSnapshot = await getDocs(unidentifiedQuery);
          unidentifiedSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let formattedDate = "";
            if (data.paymentDate) {
              if (data.paymentDate.toDate) {
                formattedDate = formatDate(data.paymentDate.toDate());
              } else if (typeof data.paymentDate === "string") {
                const d = new Date(data.paymentDate);
                formattedDate = !isNaN(d.getTime())
                  ? formatDate(d)
                  : data.paymentDate;
              }
            }
            if (formattedDate) {
              const [_day, month, year] = formattedDate.split("/");
              if (filters.month && month !== filters.month) return;
              if (filters.year && year !== filters.year) return;
            }
            const record: PaymentRecord = {
              id: docSnap.id,
              clientId,
              numberCondominium: data.numberCondominium || "N/A",
              month:
                data.month ||
                (formattedDate ? formattedDate.split("/")[1] : ""),
              amountPaid: centsToPesos(data.amountPaid),
              amountPending: centsToPesos(data.amountPending),
              concept: "Pago no identificado",
              paymentType: data.paymentType,
              creditBalance: data.creditBalance
                ? centsToPesos(data.creditBalance)
                : 0,
              creditUsed: data.creditUsed ? centsToPesos(data.creditUsed) : 0,
              paid: true,
              financialAccountId: data.financialAccountId || "N/A",
              paymentDate: formattedDate,
              attachmentPayment: data.attachmentPayment,
              chargeId: docSnap.id,
              userId: docSnap.id,
              referenceAmount: parseFloat(centsToPesos(data.amount).toFixed(2)),
            };
            paymentRecords.push(record);
            lastDoc = docSnap;
          });
        }

        // Ordenar globalmente por fecha (más reciente primero)
        paymentRecords.sort((a, b) => {
          const dateA = a.paymentDate
            ? new Date(a.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          const dateB = b.paymentDate
            ? new Date(b.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        paymentRecords = paymentRecords.slice(0, pageSize);

        // Guardar en caché el resultado solo si no se aplican filtros
        if (!filters.month && !filters.year) {
          paymentHistoryCache[cacheKey] = {
            payments: paymentRecords,
            lastDoc,
          };
        }

        set({
          completedPayments: paymentRecords,
          lastPaymentDoc: lastDoc,
          loadingPayments: false,
          totalCompletedPayments: paymentRecords.length,
        });
        return paymentRecords.length;
      } catch (error: any) {
        console.error("Error fetching payment history:", error);
        set({
          error: error.message || "Error fetching payment history",
          loadingPayments: false,
        });
        return 0;
      }
    },

    searchPaymentByFolio: async (folio: string): Promise<PaymentRecord[]> => {
      set({ loadingPayments: true, completedPayments: [] });
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

        // Buscar en pagos regulares
        const paymentsQuery = query(
          collectionGroup(db, "payments"),
          where("clientId", "==", clientId),
          where("condominiumId", "==", condominiumId),
          where("folio", "==", folio)
        );

        // Buscar en pagos no identificados
        const unidentifiedQuery = query(
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/unidentifiedPayments`
          ),
          where("folio", "==", folio)
        );

        const [paymentsSnapshot, unidentifiedSnapshot] = await Promise.all([
          getDocs(paymentsQuery),
          getDocs(unidentifiedQuery),
        ]);

        let paymentRecords: PaymentRecord[] = [];

        // Procesar pagos regulares
        paymentsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedDate = "";
          if (data.paymentDate) {
            if (data.paymentDate.toDate) {
              formattedDate = formatDate(data.paymentDate.toDate());
            } else if (typeof data.paymentDate === "string") {
              const d = new Date(data.paymentDate);
              formattedDate = !isNaN(d.getTime())
                ? formatDate(d)
                : data.paymentDate;
            }
          }

          const record: PaymentRecord = {
            id: docSnap.id,
            clientId,
            numberCondominium: data.numberCondominium || "N/A",
            month:
              data.month || (formattedDate ? formattedDate.split("/")[1] : ""),
            amountPaid: centsToPesos(data.amountPaid),
            amountPending: centsToPesos(data.amountPending),
            concept: Array.isArray(data.concept)
              ? data.concept.join(", ")
              : data.concept || "Desconocido",
            paymentType: data.paymentType,
            creditBalance: centsToPesos(data.creditBalance),
            creditUsed: data.creditUsed ? centsToPesos(data.creditUsed) : 0,
            paid: true,
            financialAccountId: data.financialAccountId || "N/A",
            paymentDate: formattedDate,
            attachmentPayment: data.attachmentPayment,
            chargeId: data.chargeId || "",
            userId: data.userId || "",
            referenceAmount: parseFloat(centsToPesos(data.amount).toFixed(2)),
          };
          paymentRecords.push(record);
        });

        // Procesar pagos no identificados
        unidentifiedSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedDate = "";
          if (data.paymentDate) {
            if (data.paymentDate.toDate) {
              formattedDate = formatDate(data.paymentDate.toDate());
            } else if (typeof data.paymentDate === "string") {
              const d = new Date(data.paymentDate);
              formattedDate = !isNaN(d.getTime())
                ? formatDate(d)
                : data.paymentDate;
            }
          }

          const record: PaymentRecord = {
            id: docSnap.id,
            clientId,
            numberCondominium: data.numberCondominium || "N/A",
            month:
              data.month || (formattedDate ? formattedDate.split("/")[1] : ""),
            amountPaid: centsToPesos(data.amountPaid),
            amountPending: centsToPesos(data.amountPending),
            concept: "Pago no identificado",
            paymentType: data.paymentType,
            creditBalance: data.creditBalance
              ? centsToPesos(data.creditBalance)
              : 0,
            creditUsed: data.creditUsed ? centsToPesos(data.creditUsed) : 0,
            paid: true,
            financialAccountId: data.financialAccountId || "N/A",
            paymentDate: formattedDate,
            attachmentPayment: data.attachmentPayment,
            chargeId: docSnap.id,
            userId: docSnap.id,
            referenceAmount: parseFloat(
              centsToPesos(data.referenceAmount).toFixed(2)
            ),
          };
          paymentRecords.push(record);
        });

        // Ordenar por fecha de pago (más reciente primero)
        paymentRecords.sort((a, b) => {
          const dateA = a.paymentDate
            ? new Date(a.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          const dateB = b.paymentDate
            ? new Date(b.paymentDate.split("/").reverse().join("-"))
            : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        set({
          completedPayments: paymentRecords,
          loadingPayments: false,
          totalCompletedPayments: paymentRecords.length,
          lastPaymentDoc: null,
          error: null,
        });

        return paymentRecords;
      } catch (error: any) {
        console.error("Error searching payment by folio:", error);
        set({
          error: error.message || "Error searching payment",
          loadingPayments: false,
          completedPayments: [],
          totalCompletedPayments: 0,
          lastPaymentDoc: null,
        });
        return [];
      }
    },

    // Nueva función para procesar correctamente los datos para reportes individuales
    prepareSingleReportData: (numberCondominium: string) => {
      const state = get();
      const detailed: Record<string, PaymentRecord[]> = {};
      const detailedByConcept: Record<
        string,
        Record<string, PaymentRecord[]>
      > = {};

      // Obtener los pagos del condominio específico
      const condominiumPayments = state.payments.filter(
        (payment) => payment.numberCondominium === numberCondominium
      );

      // Organizar pagos por mes (YYYY-MM)
      condominiumPayments.forEach((payment) => {
        if (!payment.month) return;

        const year = state.selectedYear;
        const month = payment.month;
        const key = `${year}-${month}`;

        if (!detailed[key]) {
          detailed[key] = [];
        }

        // Asegurarse de que no duplicamos registros
        const isDuplicate = detailed[key].some((p) => p.id === payment.id);
        if (!isDuplicate) {
          detailed[key].push(payment);
        }
      });

      // Organizar pagos por concepto y luego por mes
      condominiumPayments.forEach((payment) => {
        if (!payment.month || !payment.concept) return;

        const concept = payment.concept;
        const year = state.selectedYear;
        const month = payment.month;
        const key = `${year}-${month}`;

        if (!detailedByConcept[concept]) {
          detailedByConcept[concept] = {};
        }

        if (!detailedByConcept[concept][key]) {
          detailedByConcept[concept][key] = [];
        }

        // Asegurarse de que no duplicamos registros y que solo incluimos los del concepto correcto
        const isDuplicate = detailedByConcept[concept][key].some(
          (p) => p.id === payment.id
        );
        if (!isDuplicate && payment.concept === concept) {
          detailedByConcept[concept][key].push(payment);
        }
      });

      return { detailed, detailedByConcept };
    },
  })
);
