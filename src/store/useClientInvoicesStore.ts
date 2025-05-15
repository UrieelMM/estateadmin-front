import { create } from "./createStore";
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
  paymentStatus: "pending" | "paid" | "overdue" | "canceled";
  paymentMethod?: string;
  paymentIntentId?: string;
  createdAt: any;
  dueDate: any;
  paidDate?: any;
  invoiceURL?: string;
  xmlURL?: string;
  isPaid: boolean;
  optionalMessage: string;
  clientId: string;
  condominiumId: string;
  condominiumName?: string;
  priceId?: string;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  currentPeriodEnd: any;
  cancelAtPeriodEnd: boolean;
  priceId?: string;
  planName?: string;
  planAmount?: number;
  startDate?: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  interval: "month" | "year";
  currency: string;
  priceId: string;
  features?: string[];
  isPopular?: boolean;
  isCustom?: boolean;
}

interface ClientInvoicesState {
  invoices: ClientInvoice[];
  lastInvoiceDoc: QueryDocumentSnapshot<DocumentData> | null;
  totalInvoices: number;
  loading: boolean;
  error: string | null;
  subscriptionInfo: SubscriptionInfo | null;
  availablePlans: SubscriptionPlan[];

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

  // Iniciar suscripción con Stripe
  initiateStripeSubscription: (
    invoice: ClientInvoice
  ) => Promise<{ id: string; url: string }>;

  // Obtener información de la suscripción actual
  fetchSubscriptionInfo: () => Promise<SubscriptionInfo | null>;

  // Listar planes de suscripción disponibles
  listSubscriptionPlans: () => Promise<SubscriptionPlan[]>;

  // Actualizar suscripción existente
  updateSubscription: (
    subscriptionId: string,
    newPriceId?: string,
    cancelAtPeriodEnd?: boolean
  ) => Promise<SubscriptionInfo | null>;

  // Cancelar suscripción
  cancelSubscription: (
    subscriptionId: string,
    cancelImmediately?: boolean
  ) => Promise<boolean>;

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

const useClientInvoicesStore = create<ClientInvoicesState>()((set, get) => ({
  invoices: [],
  lastInvoiceDoc: null,
  totalInvoices: 0,
  loading: false,
  error: null,
  subscriptionInfo: null,
  availablePlans: [],

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
          where("paymentStatus", "==", filters.status)
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
          paymentStatus: data.paymentStatus || data.status || "pending",
          paymentMethod: data.paymentMethod,
          paymentIntentId: data.paymentIntentId,
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          invoiceURL: data.invoiceURL,
          xmlURL: data.xmlURL,
          isPaid: data.isPaid || false,
          optionalMessage: data.optionalMessage || "",
          clientId,
          condominiumId,
          condominiumName: data.condominiumName,
          priceId: data.priceId,
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
          paymentStatus: data.paymentStatus || data.status || "pending",
          paymentMethod: data.paymentMethod,
          paymentIntentId: data.paymentIntentId,
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          invoiceURL: data.invoiceURL,
          xmlURL: data.xmlURL,
          isPaid: data.isPaid || false,
          optionalMessage: data.optionalMessage || "",
          clientId,
          condominiumId,
          condominiumName: data.condominiumName,
          priceId: data.priceId,
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
        paymentStatus: "paid" as const,
        isPaid: true,
        paidDate: new Date(),
        paymentMethod,
        paymentIntentId: paymentReference,
      });

      // Actualizar el estado local
      const updatedInvoices = get().invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              status: "paid" as const,
              paymentStatus: "paid" as const,
              isPaid: true,
              paidDate: new Date(),
              paymentMethod,
              paymentIntentId: paymentReference,
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
      subscriptionInfo: null,
      availablePlans: [],
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

      // Obtener clientId de los claims del token, como en useSignaturesStore
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        throw new Error("No se encontró clientId en los claims");
      }

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("No se encontró condominiumId");
      }

      // Asegurarse de usar el clientId de los claims en lugar del de la factura
      invoice.clientId = clientId;
      invoice.condominiumId = condominiumId;

      // Construir URLs con el dominio actual y las rutas correctas de la aplicación
      const currentDomain = window.location.origin;
      console.log("Dominio actual:", currentDomain);

      // URLs para redireccionamiento después del pago
      // Incluir invoice_id como parámetro para poder identificar la factura
      const successUrl = `${currentDomain}/dashboard/payment-success?invoice_id=${invoice.id}`;
      const cancelUrl = `${currentDomain}/dashboard/payment-cancel?invoice_id=${invoice.id}`;

      console.log("URL de éxito:", successUrl);
      console.log("URL de cancelación:", cancelUrl);

      // Llamar al endpoint del backend para crear la sesión de checkout
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:8080"
        }/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientId,
            condominiumId,
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
      return { id: "", url: "" };
    }
  },

  initiateStripeSubscription: async (invoice: ClientInvoice) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Obtener clientId de los claims del token, como en useSignaturesStore
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        throw new Error("No se encontró clientId en los claims");
      }

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("No se encontró condominiumId");
      }

      // Asegurarse de usar el clientId de los claims en lugar del de la factura
      invoice.clientId = clientId;
      invoice.condominiumId = condominiumId;

      // Construir URLs con el dominio actual y las rutas correctas de la aplicación
      const currentDomain = window.location.origin;
      console.log("Dominio actual:", currentDomain);

      // URLs para redireccionamiento después del pago
      const successUrl = `${currentDomain}/dashboard/subscription-success?invoice_id=${invoice.id}`;
      const cancelUrl = `${currentDomain}/dashboard/subscription-cancel?invoice_id=${invoice.id}`;

      console.log("URL de éxito:", successUrl);
      console.log("URL de cancelación:", cancelUrl);

      // Asegurar que tenemos los datos necesarios
      if (!invoice.priceId) {
        throw new Error("No se encontró priceId en la factura");
      }

      // Llamar al nuevo endpoint para crear la sesión de suscripción
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:8080"
        }/stripe/create-subscription-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientId,
            condominiumId,
            userUID: user.uid,
            priceId: invoice.priceId,
            userEmail: user.email || "",
            description: invoice.concept || "Suscripción mensual",
            successUrl,
            cancelUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar la suscripción");
      }

      const data = await response.json();
      set({ loading: false });

      // Si tenemos un ID de suscripción preliminar, guardarlo
      if (data.subscription_id) {
        localStorage.setItem("subscriptionId", data.subscription_id);
      }

      return data; // { id: session.id, url: session.url }
    } catch (error: any) {
      console.error("Error al iniciar la suscripción con Stripe:", error);
      set({
        error: error.message || "Error al iniciar la suscripción",
        loading: false,
      });
      toast.error("Error al iniciar la suscripción");
      throw error; // Propagar el error para manejarlo en el componente
      return { id: "", url: "" }; // Esto no se ejecutará debido al throw
    }
  },

  fetchSubscriptionInfo: async () => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims.clientId as string;
      const condominiumId = localStorage.getItem("condominiumId");

      // Intentar obtener el subscriptionId del localStorage
      const subscriptionId = localStorage.getItem("subscriptionId");

      // Si no hay subscriptionId almacenado, retornar null sin hacer la llamada API
      if (!subscriptionId) {
        console.log(
          "No se encontró subscriptionId en localStorage, asumiendo que no hay suscripción activa"
        );
        set({
          subscriptionInfo: null,
          loading: false,
        });
        return null;
      }

      if (!clientId || !condominiumId) {
        throw new Error("No se encontró clientId o condominiumId");
      }

      // Llamar al endpoint para obtener la información de la suscripción
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:3000"
        }/stripe/subscription-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            clientId,
            condominiumId,
            userUID: user.uid,
            subscriptionId, // Ahora enviamos el subscriptionId desde localStorage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Si el error es 404, simplemente significa que no hay suscripción
        if (response.status === 404) {
          // Borrar el subscriptionId del localStorage ya que parece no ser válido
          localStorage.removeItem("subscriptionId");
          set({
            subscriptionInfo: null,
            loading: false,
          });
          return null;
        }
        throw new Error(
          errorData.message || "Error al obtener información de suscripción"
        );
      }

      const data = await response.json();
      const subscriptionInfo: SubscriptionInfo = {
        id: data.id,
        status: data.status,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        priceId: data.price?.id,
        planName: data.price?.product?.name,
        planAmount: data.price?.unit_amount / 100,
        startDate: data.start_date ? new Date(data.start_date * 1000) : null,
      };

      // Guardar el ID de suscripción en localStorage para futuras consultas
      localStorage.setItem("subscriptionId", subscriptionInfo.id);

      set({
        subscriptionInfo,
        loading: false,
      });

      return subscriptionInfo;
    } catch (error: any) {
      console.error("Error al obtener información de suscripción:", error);
      set({
        error: error.message || "Error al obtener información de suscripción",
        loading: false,
      });
      return null;
    }
  },

  listSubscriptionPlans: async () => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
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

      // Llamar al endpoint para listar planes de suscripción
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:3000"
        }/stripe/list-plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            clientId,
            condominiumId,
            userUID: user.uid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al obtener planes de suscripción"
        );
      }

      const data = await response.json();
      const plans: SubscriptionPlan[] = data.plans.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || "",
        amount: plan.amount / 100,
        interval: plan.interval,
        currency: plan.currency,
        priceId: plan.priceId,
        features: plan.features || [],
        isPopular: plan.isPopular || false,
        isCustom: plan.isCustom || false,
      }));

      set({
        availablePlans: plans,
        loading: false,
      });

      return plans;
    } catch (error: any) {
      console.error("Error al obtener planes de suscripción:", error);
      set({
        error: error.message || "Error al obtener planes de suscripción",
        loading: false,
      });
      return [];
    }
  },

  updateSubscription: async (
    subscriptionId: string,
    newPriceId?: string,
    cancelAtPeriodEnd?: boolean
  ) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
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

      // Llamar al endpoint para actualizar suscripción
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:3000"
        }/stripe/update-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            clientId,
            condominiumId,
            userUID: user.uid,
            subscriptionId,
            newPriceId,
            cancelAtPeriodEnd,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar suscripción");
      }

      const data = await response.json();

      // Actualizar información de la suscripción local
      await get().fetchSubscriptionInfo();

      toast.success(data.message || "Suscripción actualizada con éxito");
      set({ loading: false });

      return get().subscriptionInfo;
    } catch (error: any) {
      console.error("Error al actualizar suscripción:", error);
      set({
        error: error.message || "Error al actualizar suscripción",
        loading: false,
      });
      toast.error(error.message || "Error al actualizar suscripción");
      return null;
    }
  },

  cancelSubscription: async (
    subscriptionId: string,
    cancelImmediately = false
  ) => {
    set({ loading: true, error: null });
    try {
      // Obtener datos del usuario actual
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

      // Llamar al endpoint para cancelar suscripción
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER || "http://localhost:3000"
        }/stripe/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            clientId,
            condominiumId,
            userUID: user.uid,
            subscriptionId,
            cancelImmediately,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cancelar suscripción");
      }

      const data = await response.json();

      // Actualizar información de la suscripción
      await get().fetchSubscriptionInfo();

      toast.success(data.message || "Suscripción cancelada con éxito");
      set({ loading: false });

      return true;
    } catch (error: any) {
      console.error("Error al cancelar suscripción:", error);
      set({
        error: error.message || "Error al cancelar suscripción",
        loading: false,
      });
      toast.error(error.message || "Error al cancelar suscripción");
      return false;
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
                paymentStatus: "paid" as const,
                isPaid: true,
                paidDate: new Date(),
                paymentMethod: "stripe",
                paymentIntentId: data.paymentIntent,
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
