// src/store/expenseSummaryStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getAuth, getIdTokenResult, onAuthStateChanged, type User } from "firebase/auth";

/**
 * Función auxiliar para convertir una URL de imagen a base64
 */
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

/**
 * NUEVO: Función para convertir centavos (enteros) a pesos (float)
 */
function centsToPesos(value: any): number {
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

async function getAuthenticatedUserWithRetry(timeoutMs = 5000): Promise<User | null> {
  const auth = getAuth();
  if (auth.currentUser) return auth.currentUser;

  return await new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(auth.currentUser);
      }
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

async function getCondominiumIdWithRetry(timeoutMs = 5000): Promise<string | null> {
  const immediate = localStorage.getItem("condominiumId");
  if (immediate) return immediate;

  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const value = localStorage.getItem("condominiumId");
      if (value) {
        clearInterval(interval);
        resolve(value);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(null);
      }
    }, 250);
  });
}

export interface ExpenseRecord {
  id: string;
  folio: string; // "EA-..."
  amount: number; // Monto del egreso en pesos (float)
  concept: string; // Concepto del egreso
  paymentType: string; // Tipo de pago
  financialAccountId?: string;
  expenseDate: string; // "YYYY-MM-DD HH:mm"
  registerDate: string; // "YYYY-MM-DD HH:mm"
  invoiceUrl?: string; // Comprobante, opcional
  description?: string; // Descripción adicional
  providerId?: string; // ID del proveedor asociado, opcional
}

/**
 * Estadística mensual: Para cada mes, cuánto se gastó en total.
 */
export interface ExpenseMonthlyStat {
  month: string; // "01", "02", etc.
  spent: number; // Suma de amount
}

interface ExpenseSummaryState {
  expenses: ExpenseRecord[];
  totalSpent: number;
  conceptRecords: Record<string, ExpenseRecord[]>;
  monthlyStats: ExpenseMonthlyStat[];
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureBase64: string;
  loading: boolean;
  error: string | null;
  selectedYear: string;
  unsubscribe: Record<string, (() => void) | undefined>;
  lastFetch: Record<string, number>;
  completedExpenses: ExpenseRecord[];
  totalCompletedExpenses: number;
  lastExpenseDoc: any | null;
  loadingExpenses: boolean;
  pageSize?: number;
  startAfter?: any;
  filters?: { month?: string; year?: string };

  // Métodos
  fetchSummary: (year?: string, forceUpdate?: boolean) => Promise<void>;
  setSelectedYear: (year: string) => void;
  shouldFetchData: (year: string) => boolean;
  setupRealtimeListeners: (year: string) => void;
  cleanupListeners: (year: string) => void;
  resetExpensesState: () => void;
  fetchExpenseHistory: (
    pageSize?: number,
    startAfter?: any,
    filters?: { month?: string; year?: string }
  ) => Promise<number>;
  searchExpenseByFolio: (folio: string) => Promise<ExpenseRecord | null>;
  getExpensesByProvider: (
    providerId: string,
    year: string
  ) => Promise<ExpenseRecord[]>;
}

// Variable de caché para resultados de paginación
const expenseHistoryCache: Record<
  string,
  { expenses: ExpenseRecord[]; lastDoc: any }
> = {};

export const useExpenseSummaryStore = create<ExpenseSummaryState>()(
  (set, get) => {
    // Función auxiliar para procesar los datos
    const processExpenseData = async (
      snapshot: any,
      year: string,
      clientId: string,
      updateAdminData = false
    ) => {
      let fetched: ExpenseRecord[] = snapshot.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            folio: data.folio || "",
            amount: centsToPesos(data.amount),
            concept: data.concept || "Desconocido",
            paymentType: data.paymentType || "Desconocido",
            financialAccountId: data.financialAccountId || undefined,
            expenseDate: data.expenseDate || "",
            registerDate: data.registerDate || "",
            invoiceUrl: data.invoiceUrl || undefined,
            description: data.description || "",
            providerId: data.providerId || undefined,
          };
        })
        // Solo filtrar por año si se ha seleccionado un año específico
        .filter(
          (ex: ExpenseRecord) => !year || ex.expenseDate.startsWith(year)
        );

      let totalSpent = 0;
      const conceptRecords: Record<string, ExpenseRecord[]> = {};
      const monthlyMap: Record<string, number> = {
        "01": 0,
        "02": 0,
        "03": 0,
        "04": 0,
        "05": 0,
        "06": 0,
        "07": 0,
        "08": 0,
        "09": 0,
        "10": 0,
        "11": 0,
        "12": 0,
      };

      fetched.forEach((exp) => {
        totalSpent += exp.amount;
        if (!conceptRecords[exp.concept]) {
          conceptRecords[exp.concept] = [];
        }
        conceptRecords[exp.concept].push(exp);

        const mm = exp.expenseDate.substring(5, 7);
        if (monthlyMap[mm] !== undefined) {
          monthlyMap[mm] += exp.amount;
        }
      });

      const monthlyStats = Object.entries(monthlyMap).map(([m, spent]) => ({
        month: m,
        spent,
      }));

      const updateData: Partial<ExpenseSummaryState> = {
        expenses: fetched,
        totalSpent,
        conceptRecords,
        monthlyStats,
        loading: false,
        error: null,
      };

      // Actualizar datos del administrador si es necesario
      if (updateAdminData) {
        const db = getFirestore();
        const clientDocRef = doc(db, "clients", clientId);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          updateData.adminCompany = clientData.companyName || "";
          updateData.adminPhone = clientData.phoneNumber || "";
          updateData.adminEmail = clientData.email || "";

          const logoUrl = clientData.logoReports || "";
          const signUrl = clientData.signReports || "";
          if (logoUrl || signUrl) {
            // Ejecutar las conversiones a base64 en paralelo
            const [logoBase64, signatureBase64] = await Promise.all([
              logoUrl ? getBase64FromUrl(logoUrl) : Promise.resolve(""),
              signUrl ? getBase64FromUrl(signUrl) : Promise.resolve(""),
            ]);
            updateData.logoBase64 = logoBase64;
            updateData.signatureBase64 = signatureBase64;
          }
        }
      }

      return updateData;
    };

    return {
      expenses: [],
      totalSpent: 0,
      conceptRecords: {},
      monthlyStats: [],
      adminCompany: "",
      adminPhone: "",
      adminEmail: "",
      logoBase64: "",
      signatureBase64: "",
      loading: false,
      error: null,
      selectedYear: new Date().getFullYear().toString(),
      unsubscribe: {},
      lastFetch: {},
      completedExpenses: [],
      totalCompletedExpenses: 0,
      lastExpenseDoc: null,
      loadingExpenses: false,

      fetchSummary: async (year?: string, forceUpdate: boolean = false) => {
        // Si year es undefined, null o string vacío, significa "Todos los años"
        const currentYear = year;
        const store = get();

        // Solo verificamos shouldFetchData si no es forceUpdate
        if (!forceUpdate && !store.shouldFetchData(currentYear || "all")) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const db = getFirestore();
          const user = await getAuthenticatedUserWithRetry();
          if (!user) throw new Error("Usuario no autenticado");

          const tokenResult = await getIdTokenResult(user);
          const clientId = tokenResult.claims["clientId"] as string;
          const condominiumId = await getCondominiumIdWithRetry();
          if (!condominiumId) throw new Error("Condominio no seleccionado");

          const expensesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          );

          const snapshot = await getDocs(expensesRef);
          const updateData = await processExpenseData(
            snapshot,
            currentYear || "",
            clientId,
            true
          );

          set({
            ...updateData,
            lastFetch: {
              ...get().lastFetch,
              [currentYear || "all"]: Date.now(),
            },
          });
        } catch (error: any) {
          console.error("Error fetching expense summary:", error);
          set({
            error: error.message || "Error fetching expense summary",
            loading: false,
          });
        }
      },

      setupRealtimeListeners: async (year: string) => {
        const store = get();
        if (store.unsubscribe[year]) return;

        try {
          const db = getFirestore();
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) throw new Error("Usuario no autenticado");

          const tokenResult = await getIdTokenResult(user);
          const clientId = tokenResult.claims["clientId"] as string;
          const condominiumId = localStorage.getItem("condominiumId");
          if (!condominiumId) throw new Error("Condominio no seleccionado");

          const expensesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          );

          // Configurar listener en tiempo real
          const unsubscribe = onSnapshot(
            expensesRef,
            async (snapshot) => {
              const updateData = await processExpenseData(
                snapshot,
                year,
                clientId,
                true
              );
              set(updateData);
            },
            (error) => {
              console.error("Error en listener:", error);
              set({ error: error.message, loading: false });
            }
          );

          set((state) => ({
            unsubscribe: {
              ...state.unsubscribe,
              [year]: unsubscribe,
            },
          }));
        } catch (error: any) {
          console.error("Error setting up listeners:", error);
          set({ error: error.message, loading: false });
        }
      },

      setSelectedYear: (year: string) => set({ selectedYear: year }),

      shouldFetchData: (year: string) => {
        const lastFetchTime = get().lastFetch[year];
        const now = Date.now();
        // Si no hay datos previos o han pasado más de 5 minutos, recargar
        return !lastFetchTime || now - lastFetchTime > 300000;
      },

      cleanupListeners: (year: string) => {
        const store = get();
        if (store.unsubscribe[year]) {
          store.unsubscribe[year]!();
          set((state) => ({
            unsubscribe: {
              ...state.unsubscribe,
              [year]: undefined,
            },
          }));
        }
      },

      resetExpensesState: () => {
        set({
          completedExpenses: [],
          totalCompletedExpenses: 0,
          lastExpenseDoc: null,
          loadingExpenses: false,
        });
      },

      fetchExpenseHistory: async (
        pageSize = 20,
        startAfter = null,
        filters = {}
      ): Promise<number> => {
        set({ loadingExpenses: true });
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

          // Usar caché solo si no se aplican filtros
          if (
            !filters.month &&
            !filters.year &&
            expenseHistoryCache[cacheKey]
          ) {
            const cached = expenseHistoryCache[cacheKey];
            set({
              completedExpenses: cached.expenses,
              lastExpenseDoc: cached.lastDoc,
              loadingExpenses: false,
              totalCompletedExpenses: cached.expenses.length,
            });
            return cached.expenses.length;
          }

          const expensesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          );

          const expensesQuery = query(
            expensesRef,
            orderBy("expenseDate", "desc"),
            ...(startAfter ? [startAfter(startAfter)] : []),
            limit(pageSize)
          );

          const snapshot = await getDocs(expensesQuery);
          let expenseRecords: ExpenseRecord[] = [];
          let lastDoc: any = null;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const expenseDate = data.expenseDate || "";

            // Aplicar filtros si se especifican
            if (expenseDate) {
              const [year, month] = expenseDate.split("-");
              if (filters.month && month !== filters.month) return;
              if (filters.year && year !== filters.year) return;
            }

            const record: ExpenseRecord = {
              id: doc.id,
              folio: data.folio || "",
              amount: centsToPesos(data.amount),
              concept: data.concept || "Desconocido",
              paymentType: data.paymentType || "Desconocido",
              financialAccountId: data.financialAccountId || undefined,
              expenseDate: data.expenseDate || "",
              registerDate: data.registerDate || "",
              invoiceUrl: data.invoiceUrl || undefined,
              description: data.description || "",
              providerId: data.providerId || undefined,
            };

            expenseRecords.push(record);
            lastDoc = doc;
          });

          // Ordenar por fecha (más reciente primero)
          expenseRecords.sort((a, b) => {
            const dateA = a.expenseDate ? new Date(a.expenseDate) : new Date(0);
            const dateB = b.expenseDate ? new Date(b.expenseDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          expenseRecords = expenseRecords.slice(0, pageSize);

          // Guardar en caché el resultado solo si no se aplican filtros
          if (!filters.month && !filters.year) {
            expenseHistoryCache[cacheKey] = {
              expenses: expenseRecords,
              lastDoc,
            };
          }

          set({
            completedExpenses: expenseRecords,
            lastExpenseDoc: lastDoc,
            loadingExpenses: false,
            totalCompletedExpenses: expenseRecords.length,
          });

          return expenseRecords.length;
        } catch (error: any) {
          console.error("Error fetching expense history:", error);
          set({
            error: error.message || "Error fetching expense history",
            loadingExpenses: false,
          });
          return 0;
        }
      },

      searchExpenseByFolio: async (
        folio: string
      ): Promise<ExpenseRecord | null> => {
        try {
          const db = getFirestore();
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) throw new Error("Usuario no autenticado");

          const tokenResult = await getIdTokenResult(user);
          const clientId = tokenResult.claims["clientId"] as string;
          const condominiumId = localStorage.getItem("condominiumId");
          if (!condominiumId) throw new Error("Condominio no seleccionado");

          const expensesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          );

          const snapshot = await getDocs(expensesRef);
          const expense = snapshot.docs.find(
            (doc) => doc.data().folio === folio
          );

          if (expense) {
            const data = expense.data();
            return {
              id: expense.id,
              folio: data.folio || "",
              amount: centsToPesos(data.amount),
              concept: data.concept || "Desconocido",
              paymentType: data.paymentType || "Desconocido",
              financialAccountId: data.financialAccountId || undefined,
              expenseDate: data.expenseDate || "",
              registerDate: data.registerDate || "",
              invoiceUrl: data.invoiceUrl || undefined,
              description: data.description || "",
              providerId: data.providerId || undefined,
            };
          }

          return null;
        } catch (error: any) {
          console.error("Error al buscar egreso por folio:", error);
          return null;
        }
      },

      // Nueva función para obtener egresos por proveedor
      getExpensesByProvider: async (
        providerId: string,
        year: string
      ): Promise<ExpenseRecord[]> => {
        try {
          const db = getFirestore();
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) throw new Error("Usuario no autenticado");

          const tokenResult = await getIdTokenResult(user);
          const clientId = tokenResult.claims["clientId"] as string;
          const condominiumId = localStorage.getItem("condominiumId");
          if (!condominiumId) throw new Error("Condominio no seleccionado");

          const expensesRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/expenses`
          );

          const snapshot = await getDocs(expensesRef);
          const expenses = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                folio: data.folio || "",
                amount: centsToPesos(data.amount),
                concept: data.concept || "Desconocido",
                paymentType: data.paymentType || "Desconocido",
                financialAccountId: data.financialAccountId || undefined,
                expenseDate: data.expenseDate || "",
                registerDate: data.registerDate || "",
                invoiceUrl: data.invoiceUrl || undefined,
                description: data.description || "",
                providerId: data.providerId || undefined,
              };
            })
            .filter(
              (expense) =>
                expense.providerId === providerId &&
                expense.expenseDate.startsWith(year)
            );

          return expenses;
        } catch (error: any) {
          console.error("Error al obtener egresos por proveedor:", error);
          return [];
        }
      },
    };
  }
);
