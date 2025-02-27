// src/store/expenseSummaryStore.ts

import { create } from "zustand";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

/**
 * Estructura base de un egreso.
 * Ajusta los campos según lo que guardas en Firestore.
 */
export interface ExpenseRecord {
  id: string;
  folio: string;           // "EA-... "
  amount: number;          // Monto del egreso
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
  // Puedes añadir otros campos si lo deseas (topConcept, etc.)
}

/**
 * Estado del store: estadísticas y resúmenes de egresos.
 */
interface ExpenseSummaryState {
  expenses: ExpenseRecord[];                       // Todos los egresos (filtrados por año, si se pasa)
  totalSpent: number;                              // Suma de todos los amount
  conceptRecords: Record<string, ExpenseRecord[]>; // Agrupar por concepto
  monthlyStats: ExpenseMonthlyStat[];              // Lista con {month, spent}
  loading: boolean;
  error: string | null;
  selectedYear: string;
  fetchSummary: (year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
}

export const useExpenseSummaryStore = create<ExpenseSummaryState>((set) => ({
  expenses: [],
  totalSpent: 0,
  conceptRecords: {},
  monthlyStats: [],
  loading: false,
  error: null,
  selectedYear: new Date().getFullYear().toString(), // Por defecto, año actual

  /**
   * setSelectedYear: Actualiza el año seleccionado en el store
   */
  setSelectedYear: (year: string) => {
    set({ selectedYear: year });
  },

  /**
   * fetchSummary: Carga todos los egresos de la subcolección "expenses"
   * y calcula totales, agrupaciones por concepto, etc.
   */
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

      // Colección de egresos
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
      // Obtener todos los documentos
      const snap = await getDocs(expensesRef);

      // Arreglo de ExpenseRecord
      const expenseRecords: ExpenseRecord[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        // Filtramos por 'year' si "expenseDate" (ej: "2025-01-15 10:00") empieza con year
        // en caso de usar un string. Ajusta si usas timestamp real.
        if (year) {
          if (!data.expenseDate?.startsWith(year)) {
            return; // Filtra localmente
          }
        }
        expenseRecords.push({
          id: docSnap.id,
          folio: data.folio || "",
          amount: data.amount || 0,
          concept: data.concept || "Desconocido",
          paymentType: data.paymentType || "Desconocido",
          expenseDate: data.expenseDate || "",
          registerDate: data.registerDate || "",
          invoiceUrl: data.invoiceUrl || undefined,
          description: data.description || "",
        });
      });

      // Calcular totalSpent, agrupar por concepto, etc.
      let totalSpent = 0;
      const conceptRecords: Record<string, ExpenseRecord[]> = {};
      // Aux para monthlyStats
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

      expenseRecords.forEach((exp) => {
        totalSpent += exp.amount;

        // Agrupar por concepto
        if (!conceptRecords[exp.concept]) {
          conceptRecords[exp.concept] = [];
        }
        conceptRecords[exp.concept].push(exp);

        // Agregar al month
        // Asumimos exp.expenseDate = "YYYY-MM-DD HH:mm"
        // Sacamos el "MM"
        const mm = exp.expenseDate.substring(5, 7);
        if (monthlyMap[mm] !== undefined) {
          monthlyMap[mm] += exp.amount;
        }
      });

      // Construir monthlyStats
      const monthlyStats = Object.entries(monthlyMap).map(([m, spent]) => ({
        month: m,
        spent,
      }));

      set({
        expenses: expenseRecords,
        totalSpent,
        conceptRecords,
        monthlyStats,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Error fetching expense summary:", err);
      set({
        error: err.message || "Error fetching expense summary",
        loading: false,
      });
    }
  },
}));
