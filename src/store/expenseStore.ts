// src/store/expenseStore.ts

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  setDoc,
  doc as createDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Tipos de datos para un egreso
 */
export interface ExpenseRecord {
  id: string; // ID del documento en Firestore
  folio: string; // "EA-xxxxxx"
  amount: number; // Monto del egreso en pesos
  concept: string; // Concepto (select con ~30 tipos)
  paymentType: string; // Tipo de pago (efectivo, transferencia, etc.)
  expenseDate: string; // Fecha del egreso (ej: "2025-06-30 14:00")
  registerDate: string; // Fecha/hora en que se registra (ej: "2025-06-30 14:55")
  invoiceUrl?: string; // URL o referencia al archivo de factura/recibo
  description?: string; // Descripción opcional
  financialAccountId: string; // ID de la cuenta financiera
  providerId?: string;
}

/**
 * Datos para crear un egreso.
 */
export interface ExpenseCreateInput {
  amount: number; // en pesos
  concept: string;
  paymentType: string;
  expenseDate: string; // "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File; // Comprobante, factura, etc.
  invoiceUrl?: string; // URL existente del comprobante (opcional)
  financialAccountId: string; // Nuevo campo requerido
  providerId?: string;
}

/**
 * Datos para actualizar un egreso.
 */
export interface ExpenseUpdateInput {
  amount?: number; // en pesos
  concept?: string;
  paymentType?: string;
  expenseDate?: string;
  description?: string;
  file?: File; // Comprobante, factura, etc.
  invoiceUrl?: string; // URL existente del comprobante (opcional)
  financialAccountId?: string;
  providerId?: string;
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
  addExpense: (data: ExpenseCreateInput) => Promise<string>;
  /**
   * updateExpense: Actualiza un egreso existente.
   */
  updateExpense: (expenseId: string, data: ExpenseUpdateInput) => Promise<void>;
  /**
   * deleteExpense: Elimina un egreso existente.
   */
  deleteExpense: (expenseId: string) => Promise<void>;
  /**
   * refreshExpenses: Actualiza la lista de egresos.
   */
  refreshExpenses: () => Promise<void>;
}

// NUEVO: Función para convertir centavos (enteros) a pesos (float)
function centsToPesos(value: any): number {
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

// Función para generar un folio único
async function generateUniqueFolio(): Promise<string> {
  // Generar 12 números aleatorios
  const randomNumbers = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `EA-${randomNumbers}`;
}

export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  expenses: [],
  loading: false,
  error: null,

  refreshExpenses: async () => {
    const condominiumId = localStorage.getItem("condominiumId");
    if (condominiumId) {
      await get().fetchExpenses(condominiumId);
    }
  },

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
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
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
          financialAccountId: data.financialAccountId ?? "",
          providerId: data.providerId ?? undefined,
        };
      });

      if (year) {
        fetched = fetched.filter((ex) => ex.expenseDate.startsWith(year));
      }

      set({ expenses: fetched, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar egresos:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar egresos",
      });
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
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );

      // Generar folio único
      const folio = await generateUniqueFolio();

      // Convertir el monto a centavos (el monto viene en pesos, multiplicamos por 100)
      const amountCents = Math.round(data.amount * 100);

      // Crear el documento del egreso
      const expenseData: ExpenseRecord = {
        id: "", // Se llenará con el ID de Firestore
        folio,
        amount: amountCents,
        concept: data.concept,
        paymentType: data.paymentType,
        expenseDate: data.expenseDate,
        registerDate: new Date().toISOString(),
        description: data.description || "",
        financialAccountId: data.financialAccountId,
      };

      // Solo agregar providerId si existe
      if (data.providerId) {
        expenseData.providerId = data.providerId;
      }

      // Subir archivo si existe
      let invoiceUrl = "";
      if (data.file) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/expenses/${folio}/${data.file.name}`
        );
        await uploadBytes(fileRef, data.file);
        invoiceUrl = await getDownloadURL(fileRef);
      }

      // Agregar URL del archivo si existe
      if (invoiceUrl) {
        expenseData.invoiceUrl = invoiceUrl;
      } else if (data.invoiceUrl) {
        expenseData.invoiceUrl = data.invoiceUrl;
      }

      // Crear documento con ID automático de Firestore
      const newDocRef = createDoc(expensesRef);
      expenseData.id = newDocRef.id;

      // Guardar en Firestore
      await setDoc(newDocRef, expenseData);

      // Actualizar la lista de egresos
      await get().refreshExpenses();
      return newDocRef.id;
    } catch (error) {
      console.error("Error al crear egreso:", error);
      set({ error: "Error al registrar el egreso" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateExpense: async (expenseId: string, data: ExpenseUpdateInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const expenseDocRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`,
        expenseId
      );

      const currentSnap = await getDoc(expenseDocRef);
      if (!currentSnap.exists()) {
        throw new Error("Egreso no encontrado");
      }

      const currentData = currentSnap.data();
      const folio = currentData.folio || expenseId;

      let invoiceUrl = data.invoiceUrl;
      if (data.file) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/expenses/${folio}/${data.file.name}`
        );
        await uploadBytes(fileRef, data.file);
        invoiceUrl = await getDownloadURL(fileRef);
      }

      const updateData: any = {};

      if (data.amount !== undefined) {
        updateData.amount = Math.round(data.amount * 100);
      }
      if (data.concept !== undefined) updateData.concept = data.concept;
      if (data.paymentType !== undefined) updateData.paymentType = data.paymentType;
      if (data.expenseDate !== undefined) updateData.expenseDate = data.expenseDate;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.financialAccountId !== undefined) {
        updateData.financialAccountId = data.financialAccountId;
      }
      if (data.providerId !== undefined) updateData.providerId = data.providerId;
      if (invoiceUrl !== undefined) updateData.invoiceUrl = invoiceUrl;

      if (Object.keys(updateData).length === 0) {
        set({ loading: false });
        return;
      }

      await updateDoc(expenseDocRef, updateData);
      await get().refreshExpenses();
    } catch (error: any) {
      console.error("Error al actualizar egreso:", error);
      set({ error: "Error al actualizar el egreso" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteExpense: async (expenseId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const expenseDocRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`,
        expenseId
      );

      const currentSnap = await getDoc(expenseDocRef);
      if (currentSnap.exists()) {
        await deleteDoc(expenseDocRef);
      }

      await get().refreshExpenses();
    } catch (error: any) {
      console.error("Error al eliminar egreso:", error);
      set({ error: "Error al eliminar el egreso" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
