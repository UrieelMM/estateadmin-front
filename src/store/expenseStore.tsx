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
  amount: number;               // Monto del egreso
  concept: string;              // Concepto (select con ~30 tipos)
  paymentType: string;          // Tipo de pago (efectivo, transferencia, etc.)
  expenseDate: string;          // Fecha del egreso (el usuario la elige, ej: "2025-06-30 14:00")
  registerDate: string;         // Fecha/hora en que se registra (auto, ej: "2025-06-30 14:55")
  invoiceUrl?: string;          // URL o referencia al archivo de factura/recibo
  description?: string;         // Descripción opcional
}

/**
 * Datos que se requieren para crear un nuevo egreso.
 * Se omite el id, folio y registerDate porque se generan automáticamente.
 */
export interface ExpenseCreateInput {
  amount: number;
  concept: string;
  paymentType: string;
  expenseDate: string;         // Formato "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File;                 // Comprobante, facturas, etc. (opcional)
}

interface ExpenseState {
  expenses: ExpenseRecord[];
  loading: boolean;
  error: string | null;
  /**
   * fetchExpenses: Carga todos los egresos de un condominio (puedes filtrar por año).
   */
  fetchExpenses: (condominiumId: string, year?: string) => Promise<void>;
  /**
   * addExpense: Crea un nuevo egreso con subida de archivo opcional a Storage.
   */
  addExpense: (data: ExpenseCreateInput) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, _get) => ({
  expenses: [],
  loading: false,
  error: null,

  /**
   * fetchExpenses: Carga los egresos desde la subcolección "expenses" de un condominio.
   * (Puedes filtrar localmente por 'year' si la fecha se guarda en un string con "YYYY-MM-DD".)
   */
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
          amount: data.amount ?? 0,
          concept: data.concept ?? "",
          paymentType: data.paymentType ?? "",
          expenseDate: data.expenseDate ?? "",
          registerDate: data.registerDate ?? "",
          invoiceUrl: data.invoiceUrl ?? undefined,
          description: data.description ?? "",
        };
      });

      // Filtrar localmente por 'year'
      if (year) {
        fetched = fetched.filter((ex) => ex.expenseDate.startsWith(year));
      }

      set({ expenses: fetched, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar egresos:", error);
      set({ loading: false, error: error.message || "Error al cargar egresos" });
    }
  },

  /**
   * addExpense: Crea un nuevo egreso y sube el archivo de factura (opcional) a Storage.
   */
  addExpense: async (data) => {
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

      // Fecha/hora de registro (automática)
      const now = new Date();
      const registerDateStr = now.toISOString().slice(0, 16).replace("T", " ");

      // Subir archivo (factura/recibo) a Storage si existe
      let invoiceUrl = "";
      if (data.file) {
        const storage = getStorage();
        // Ubicación en storage: "clients/{clientId}/condominiums/{condominiumId}/expenses/folio-{file.name}"
        const storageRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/expenses/${folio}-${data.file.name}`
        );
        const uploadResult = await uploadBytes(storageRef, data.file);
        // Obtener la URL de descarga
        invoiceUrl = await getDownloadURL(uploadResult.ref);
      }

      // Preparar doc a guardar en Firestore
      const docData = {
        folio,
        amount: data.amount,
        concept: data.concept,
        paymentType: data.paymentType,
        expenseDate: data.expenseDate,  // "YYYY-MM-DD HH:mm"
        registerDate: registerDateStr,  // "YYYY-MM-DD HH:mm" 
        invoiceUrl: invoiceUrl,
        description: data.description || "",
      };

      // Crear doc en la subcolección
      const expensesRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/expenses`);
      const newDocRef = doc(expensesRef);
      await setDoc(newDocRef, docData);

      // Actualizar el state local
      const newExpense = {
        id: newDocRef.id,
        ...docData,
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
