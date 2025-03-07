// src/store/expenseSummaryStore.ts
import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
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
  fetchSummary: (year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
}

export const useExpenseSummaryStore = create<ExpenseSummaryState>((set) => ({
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

  setSelectedYear: (year: string) => {
    set({ selectedYear: year });
  },

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

      // Colección de egresos
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
      const snap = await getDocs(expensesRef);

      let fetched: ExpenseRecord[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          folio: data.folio || "",
          // Convertir 'amount' de centavos a pesos
          amount: centsToPesos(data.amount),
          concept: data.concept || "Desconocido",
          paymentType: data.paymentType || "Desconocido",
          expenseDate: data.expenseDate || "",
          registerDate: data.registerDate || "",
          invoiceUrl: data.invoiceUrl || undefined,
          description: data.description || "",
        };
      });

      // Filtrar por año, si se pasa
      if (year) {
        fetched = fetched.filter((ex) => ex.expenseDate.startsWith(year));
      }

      // Calcular totalSpent, agrupar por concepto y estadísticas mensuales
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

        // Asumiendo que expenseDate es "YYYY-MM-DD HH:mm"
        const mm = exp.expenseDate.substring(5, 7);
        if (monthlyMap[mm] !== undefined) {
          monthlyMap[mm] += exp.amount;
        }
      });

      const monthlyStats = Object.entries(monthlyMap).map(([m, spent]) => ({
        month: m,
        spent,
      }));

      set({
        expenses: fetched,
        totalSpent,
        conceptRecords,
        monthlyStats,
        adminCompany,
        adminPhone,
        adminEmail,
        logoBase64,
        signatureBase64,
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
