// src/store/expenseSummaryStore.ts
import { create } from "zustand";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

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

export interface ExpenseRecord {
  id: string;
  folio: string;           // "EA-..."
  amount: number;          // Monto del egreso en pesos (float)
  concept: string;         // Concepto del egreso
  paymentType: string;     // Tipo de pago
  expenseDate: string;     // "YYYY-MM-DD HH:mm"
  registerDate: string;    // "YYYY-MM-DD HH:mm"
  invoiceUrl?: string;     // Comprobante, opcional
  description?: string;    // Descripción adicional
}

/**
 * Estadística mensual: Para cada mes, cuánto se gastó en total.
 */
export interface ExpenseMonthlyStat {
  month: string;   // "01", "02", etc.
  spent: number;   // Suma de amount
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

  // Métodos
  fetchSummary: (year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
  shouldFetchData: (year: string) => boolean;
  setupRealtimeListeners: (year: string) => void;
  cleanupListeners: (year: string) => void;
}

export const useExpenseSummaryStore = create<ExpenseSummaryState>((set, get) => {
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
          expenseDate: data.expenseDate || "",
          registerDate: data.registerDate || "",
          invoiceUrl: data.invoiceUrl || undefined,
          description: data.description || "",
        };
      })
      .filter((ex: ExpenseRecord) => ex.expenseDate.startsWith(year));

    let totalSpent = 0;
    const conceptRecords: Record<string, ExpenseRecord[]> = {};
    const monthlyMap: Record<string, number> = {
      "01": 0, "02": 0, "03": 0, "04": 0,
      "05": 0, "06": 0, "07": 0, "08": 0,
      "09": 0, "10": 0, "11": 0, "12": 0,
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

    fetchSummary: async (year?: string) => {
      const currentYear = year || new Date().getFullYear().toString();
      const store = get();
      
      if (!store.shouldFetchData(currentYear)) {
        return;
      }

      set({ loading: true, error: null });
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
        const updateData = await processExpenseData(snapshot, currentYear, clientId, true);

        set({
          ...updateData,
          lastFetch: {
            ...get().lastFetch,
            [currentYear]: Date.now()
          }
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
        const unsubscribe = onSnapshot(expensesRef, async (snapshot) => {
          const updateData = await processExpenseData(snapshot, year, clientId, true);
          set(updateData);
        }, (error) => {
          console.error("Error en listener:", error);
          set({ error: error.message, loading: false });
        });

        set(state => ({
          unsubscribe: {
            ...state.unsubscribe,
            [year]: unsubscribe
          }
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
      return !lastFetchTime || (now - lastFetchTime) > 300000;
    },

    cleanupListeners: (year: string) => {
      const store = get();
      if (store.unsubscribe[year]) {
        store.unsubscribe[year]!();
        set(state => ({
          unsubscribe: {
            ...state.unsubscribe,
            [year]: undefined
          }
        }));
      }
    }
  };
});
