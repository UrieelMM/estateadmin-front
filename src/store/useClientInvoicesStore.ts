import { create } from "zustand";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  startAfter as firestoreStartAfter,
  updateDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  concept: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  createdAt: any;
  dueDate: any;
  paidDate?: any;
  invoiceURL?: string;
  isPaid: boolean;
  optionalMessage: string;
  clientId: string;
  condominiumId: string;
}

interface ClientInvoicesState {
  invoices: ClientInvoice[];
  lastInvoiceDoc: QueryDocumentSnapshot<DocumentData> | null;
  totalInvoices: number;
  loading: boolean;
  error: string | null;

  // Obtener facturas con paginación
  fetchInvoices: (
    pageSize?: number,
    startAfter?: QueryDocumentSnapshot<DocumentData> | null,
    filters?: { status?: string }
  ) => Promise<number>;

  // Buscar factura por número
  searchInvoiceByNumber: (invoiceNumber: string) => Promise<ClientInvoice[]>;

  // Marcar factura como pagada (para integración futura con stripe)
  markInvoiceAsPaid: (
    invoiceId: string,
    paymentMethod: string,
    paymentReference: string
  ) => Promise<boolean>;

  // Limpiar estado del store
  resetInvoicesState: () => void;

  // Iniciar pago con Stripe
  initiateStripePayment: (
    invoice: ClientInvoice
  ) => Promise<{ id: string; url: string }>;

  // Verificar estado de pago
  checkPaymentStatus: (
    sessionId: string
  ) => Promise<{ status: string; paymentIntent: string; metadata: any }>;
}

// Cache para resultados de paginación
const invoiceCache: Record<
  string,
  {
    invoices: ClientInvoice[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }
> = {};

const useClientInvoicesStore = create<ClientInvoicesState>((set, get) => ({
  invoices: [],
  lastInvoiceDoc: null,
  totalInvoices: 0,
  loading: false,
  error: null,

  fetchInvoices: async (pageSize = 10, startAfter = null, filters = {}) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos de autenticación
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims.clientId as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!clientId || !condominiumId) {
        throw new Error("No se encontró clientId o condominiumId");
      }

      // Generar clave para caché basada en filtros y cursor
      const cacheKey = JSON.stringify({
        clientId,
        condominiumId,
        filters,
        startAfter: startAfter ? startAfter.id : "first",
      });

      // Usar caché si está disponible y no hay filtros específicos
      if (!filters.status && invoiceCache[cacheKey]) {
        const cached = invoiceCache[cacheKey];
        set({
          invoices: cached.invoices,
          lastInvoiceDoc: cached.lastDoc,
          loading: false,
          totalInvoices: cached.invoices.length,
        });
        return cached.invoices.length;
      }

      // Construir la ruta a la colección de facturas del cliente
      const invoicesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`
      );

      // Construir la consulta
      let invoicesQuery = query(invoicesRef, orderBy("createdAt", "desc"));

      // Aplicar filtros si existen
      if (filters.status) {
        invoicesQuery = query(
          invoicesQuery,
          where("status", "==", filters.status)
        );
      }

      // Aplicar paginación
      if (startAfter) {
        invoicesQuery = query(invoicesQuery, firestoreStartAfter(startAfter));
      }

      // Aplicar límite de página
      invoicesQuery = query(invoicesQuery, limit(pageSize));

      // Ejecutar consulta
      const invoicesSnapshot = await getDocs(invoicesQuery);

      // Procesar resultados
      const invoiceRecords: ClientInvoice[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      for (const doc of invoicesSnapshot.docs) {
        const data = doc.data();

        const invoice: ClientInvoice = {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || "",
          concept: data.concept || "Suscripción Mensual",
          amount: data.amount || 0,
          status: data.status || "pending",
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          invoiceURL: data.invoiceURL,
          isPaid: data.isPaid || false,
          optionalMessage: data.optionalMessage || "",
          clientId,
          condominiumId,
        };

        invoiceRecords.push(invoice);
        lastDoc = doc;
      }

      // Almacenar en caché si no hay filtros específicos
      if (!filters.status) {
        invoiceCache[cacheKey] = {
          invoices: invoiceRecords,
          lastDoc,
        };
      }

      // Actualizar estado
      set({
        invoices: invoiceRecords,
        lastInvoiceDoc: lastDoc,
        loading: false,
        totalInvoices: invoiceRecords.length,
      });

      return invoiceRecords.length;
    } catch (error: any) {
      console.error("Error al obtener facturas del cliente:", error);
      set({
        error: error.message || "Error al obtener las facturas",
        loading: false,
      });
      return 0;
    }
  },

  searchInvoiceByNumber: async (invoiceNumber: string) => {
    set({ loading: true });
    try {
      // Obtener datos de autenticación
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims.clientId as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!clientId || !condominiumId) {
        throw new Error("No se encontró clientId o condominiumId");
      }

      // Construir la ruta a la colección de facturas
      const invoicesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`
      );

      // Construir consulta de búsqueda
      const searchQuery = query(
        invoicesRef,
        where("invoiceNumber", "==", invoiceNumber)
      );

      const searchSnapshot = await getDocs(searchQuery);

      const invoiceRecords: ClientInvoice[] = [];

      searchSnapshot.forEach((doc) => {
        const data = doc.data();

        const invoice: ClientInvoice = {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || "",
          concept: data.concept || "Suscripción Mensual",
          amount: data.amount || 0,
          status: data.status || "pending",
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          invoiceURL: data.invoiceURL,
          isPaid: data.isPaid || false,
          optionalMessage: data.optionalMessage || "",
          clientId,
          condominiumId,
        };

        invoiceRecords.push(invoice);
      });

      set({ loading: false });

      return invoiceRecords;
    } catch (error: any) {
      console.error("Error al buscar factura:", error);
      set({
        error: error.message || "Error al buscar factura",
        loading: false,
      });
      return [];
    }
  },

  markInvoiceAsPaid: async (
    invoiceId: string,
    paymentMethod: string,
    paymentReference: string
  ) => {
    set({ loading: true });
    try {
      // Obtener datos de autenticación
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims.clientId as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!clientId || !condominiumId) {
        throw new Error("No se encontró clientId o condominiumId");
      }

      // Actualizar la factura
      const invoiceRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated/${invoiceId}`
      );

      // Verificar que la factura existe
      const invoiceSnap = await getDoc(invoiceRef);
      if (!invoiceSnap.exists()) {
        throw new Error("La factura no existe");
      }

      // Actualizar estado de la factura
      await updateDoc(invoiceRef, {
        status: "paid" as const,
        isPaid: true,
        paidDate: new Date(),
        paymentMethod,
        paymentReference,
      });

      // Actualizar el estado local
      const updatedInvoices = get().invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              status: "paid" as const,
              isPaid: true,
              paidDate: new Date(),
            }
          : invoice
      );

      set({
        invoices: updatedInvoices,
        loading: false,
      });

      toast.success("Factura marcada como pagada");
      return true;
    } catch (error: any) {
      console.error("Error al marcar factura como pagada:", error);
      set({
        error: error.message || "Error al marcar factura como pagada",
        loading: false,
      });
      toast.error("Error al marcar factura como pagada");
      return false;
    }
  },

  resetInvoicesState: () => {
    set({
      invoices: [],
      lastInvoiceDoc: null,
      totalInvoices: 0,
      loading: false,
      error: null,
    });
  },

  initiateStripePayment: async (invoice: ClientInvoice) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Construir URLs con el dominio actual y las rutas correctas de la aplicación
      const currentDomain = window.location.origin || "http://localhost:3000";

      // URLs para redireccionamiento después del pago
      // Incluir invoice_id como parámetro para poder identificar la factura
      const successUrl = `${currentDomain}/dashboard/payment-success?invoice_id=${invoice.id}`;
      const cancelUrl = `${currentDomain}/dashboard/payment-cancel?invoice_id=${invoice.id}`;

      console.log("URLs de redirección:", { successUrl, cancelUrl });

      // Llamar al endpoint del backend para crear la sesión de checkout
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:3000"
        }/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientId: invoice.clientId,
            condominiumId: invoice.condominiumId,
            amount: invoice.amount,
            invoiceNumber: invoice.invoiceNumber,
            userEmail: user.email || "",
            description: invoice.concept || "Pago de factura",
            successUrl,
            cancelUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar el pago");
      }

      const data = await response.json();
      set({ loading: false });

      return data; // { id: session.id, url: session.url }
    } catch (error: any) {
      console.error("Error al iniciar el pago con Stripe:", error);
      set({
        error: error.message || "Error al iniciar el pago",
        loading: false,
      });
      toast.error("Error al iniciar el pago");
      throw error;
    }
  },

  checkPaymentStatus: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Llamar al endpoint para verificar el estado del pago
      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/stripe/check-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ sessionId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al verificar el pago");
      }

      const data = await response.json();
      set({ loading: false });

      // Si el pago es exitoso, actualizar el estado de las facturas localmente
      if (data.status === "paid" && data.metadata?.invoiceId) {
        const updatedInvoices = get().invoices.map((invoice) =>
          invoice.id === data.metadata.invoiceId
            ? {
                ...invoice,
                status: "paid" as const,
                isPaid: true,
                paidDate: new Date(),
              }
            : invoice
        );

        set({ invoices: updatedInvoices });
      }

      return data;
    } catch (error: any) {
      console.error("Error al verificar el estado del pago:", error);
      set({
        error: error.message || "Error al verificar el pago",
        loading: false,
      });
      throw error;
    }
  },
}));

const db = getFirestore();

export default useClientInvoicesStore;
