// src/store/expenseStore.ts

import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/**
 * Tipos de datos para un egreso
 */
export interface ExpenseRecord {
  id: string;                   // ID del documento en Firestore
  folio: string;                // "EA-xxxxxx" 
  amount: number;               // Monto del egreso en pesos (float)
  concept: string;              // Concepto (select con ~30 tipos)
  paymentType: string;          // Tipo de pago (efectivo, transferencia, etc.)
  expenseDate: string;          // Fecha del egreso (ej: "2025-06-30 14:00")
  registerDate: string;         // Fecha/hora en que se registra (ej: "2025-06-30 14:55")
  invoiceUrl?: string;          // URL o referencia al archivo de factura/recibo
  description?: string;         // Descripción opcional
}

/**
 * Datos para crear un egreso.
 */
export interface ExpenseCreateInput {
  amount: number;               // en pesos (ej: 255.20)
  concept: string;
  paymentType: string;
  expenseDate: string;          // "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File;                  // Comprobante, factura, etc.
}

interface ExpenseState {
  expenses: ExpenseRecord[];
  loading: boolean;
  error: string | null;
  /**
   * fetchExpenses: Carga todos los egresos de un condominio.
   */
  fetchExpenses: (condominiumId: string, year?: string) => Promise<void>;
  /**
   * addExpense: Crea un nuevo egreso con subida de archivo opcional a Storage.
   */
  addExpense: (data: ExpenseCreateInput) => Promise<void>;
}

// NUEVO: Función para convertir centavos (enteros) a pesos (float)
function centsToPesos(value: any): number {
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

export const useExpenseStore = create<ExpenseState>((set, _get) => ({
  expenses: [],
  loading: false,
  error: null,

  fetchExpenses: async (condominiumId: string, year?: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const expensesRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/expenses`);
      const q = query(expensesRef);
      const snap = await getDocs(q);

      let fetched: ExpenseRecord[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          folio: data.folio ?? "",
          // Convertir amount (que viene en centavos) a pesos
          amount: centsToPesos(data.amount),
          concept: data.concept ?? "",
          paymentType: data.paymentType ?? "",
          expenseDate: data.expenseDate ?? "",
          registerDate: data.registerDate ?? "",
          invoiceUrl: data.invoiceUrl ?? undefined,
          description: data.description ?? "",
        };
      });

      if (year) {
        fetched = fetched.filter((ex) => ex.expenseDate.startsWith(year));
      }

      set({ expenses: fetched, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar egresos:", error);
      set({ loading: false, error: error.message || "Error al cargar egresos" });
    }
  },

  addExpense: async (data: ExpenseCreateInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();

      // Generar folio secuencial sencillo: "EA-" + Date.now()
      const folio = `EA-${Date.now()}`;

      // Fecha de registro
      const now = new Date();
      const registerDateStr = now.toISOString().slice(0, 16).replace("T", " ");

      // Subir archivo a Storage si existe
      let invoiceUrl = "";
      if (data.file) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/expenses/${folio}-${data.file.name}`
        );
        const uploadResult = await uploadBytes(storageRef, data.file);
        invoiceUrl = await getDownloadURL(uploadResult.ref);
      }

      // Convertir amount de pesos a centavos
      const amountCents = Math.round(data.amount * 100);

      const docData = {
        folio,
        amount: amountCents, // Guardado en centavos
        concept: data.concept,
        paymentType: data.paymentType,
        expenseDate: data.expenseDate,  // Se asume que viene en "YYYY-MM-DD HH:mm"
        registerDate: registerDateStr,  // "YYYY-MM-DD HH:mm"
        invoiceUrl: invoiceUrl,
        description: data.description || "",
      };

      const expensesRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/expenses`);
      const newDocRef = doc(expensesRef);
      await setDoc(newDocRef, docData);

      const newExpense = {
        id: newDocRef.id,
        ...docData,
        // Convertir de centavos a pesos para que la vista muestre el valor correcto
        amount: amountCents / 100,
      };

      set((state) => ({
        expenses: [...state.expenses, newExpense],
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error("Error al agregar egreso:", error);
      set({ loading: false, error: error.message || "Error al agregar egreso" });
    }
  },
}));
