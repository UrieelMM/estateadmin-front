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
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { syncWithAIContext } from "../services/aiContextService";

/**
 * Tipos de datos para un egreso
 */
export interface ExpenseRecord {
  id: string; // ID del documento en Firestore
  folio: string; // "EA-xxxxxx"
  amount: number; // Monto del egreso en centavos
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
  amount: number; // en centavos
  concept: string;
  paymentType: string;
  expenseDate: string; // "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File; // Comprobante, factura, etc.
  financialAccountId: string; // Nuevo campo requerido
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
  addExpense: (data: ExpenseCreateInput) => Promise<void>;
  /**
   * refreshExpenses: Actualiza la lista de egresos.
   */
  refreshExpenses: () => Promise<void>;
}

// Función para convertir centavos (enteros) a pesos (float)
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

// Función para formatear fecha en formato legible
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

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
      }

      // Crear documento con ID automático de Firestore
      const newDocRef = createDoc(expensesRef);
      expenseData.id = newDocRef.id;

      // Guardar en Firestore
      await setDoc(newDocRef, expenseData);

      // NUEVO: Obtener información de la cuenta financiera
      let accountName = "No especificada";
      if (data.financialAccountId) {
        try {
          const accountRef = createDoc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/financialAccounts/${data.financialAccountId}`
          );
          const accountSnap = await getDoc(accountRef);
          if (accountSnap.exists()) {
            accountName = accountSnap.data()?.name || "No especificada";
          }
        } catch (e) {
          console.error("Error al obtener nombre de cuenta:", e);
        }
      }

      // NUEVO: Obtener información del proveedor
      let providerInfo = {
        providerName: "No especificado",
        providerEmail: "",
        providerPhone: "",
        providerCategory: "",
      };

      if (data.providerId) {
        try {
          const providerRef = createDoc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/providers/${data.providerId}`
          );
          const providerSnap = await getDoc(providerRef);
          if (providerSnap.exists()) {
            const providerData = providerSnap.data();
            providerInfo = {
              providerName: providerData?.name || "No especificado",
              providerEmail: providerData?.email || "",
              providerPhone: providerData?.phone || "",
              providerCategory: providerData?.category || "",
            };
          }
        } catch (e) {
          console.error("Error al obtener datos del proveedor:", e);
        }
      }

      // NUEVO: Sincronizar con la API de IA
      try {
        const expenseAIData = {
          // Datos básicos del egreso
          id: newDocRef.id,
          folio: folio,
          amount: data.amount, // Monto en pesos
          amountCents: amountCents, // Monto en centavos
          concept: data.concept,
          paymentType: data.paymentType,
          expenseDate: data.expenseDate,
          expenseDateFormatted: formatDisplayDate(data.expenseDate),
          registerDate: expenseData.registerDate,
          registerDateFormatted: formatDisplayDate(expenseData.registerDate),
          description: data.description || "",

          // Información financiera
          cuentaFinanciera: accountName,
          financialAccountId: data.financialAccountId,

          // Información del proveedor
          ...providerInfo,
          providerId: data.providerId || "",

          // Metadatos
          hasInvoice: !!invoiceUrl,
          invoiceUrl: invoiceUrl || "",
          currency: "MXN",

          // Detalles administrativos
          tipo: "egreso",
          categoriaEgreso: data.concept,
          status: "completado",

          // Información adicional para búsquedas
          año: new Date(data.expenseDate).getFullYear().toString(),
          mes: (new Date(data.expenseDate).getMonth() + 1)
            .toString()
            .padStart(2, "0"),
        };

        // Enviar a la API
        await syncWithAIContext(
          "expense",
          expenseAIData,
          clientId,
          condominiumId
        );
      } catch (syncError) {
        console.error("[AI Context] Error al sincronizar egreso:", syncError);
        // No afecta el flujo principal
      }

      // Actualizar la lista de egresos
      await get().refreshExpenses();
    } catch (error) {
      console.error("Error al crear egreso:", error);
      set({ error: "Error al registrar el egreso" });
    } finally {
      set({ loading: false });
    }
  },
}));
