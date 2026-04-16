import { create } from "./createStore";
import {
  getFirestore,
  collection,
  collectionGroup,
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
  plan?: string;
  userEmail?: string;
  userUID?: string;
  nextBillingDate?: any;
  message?: string;
  invoicePdfStoragePath?: string;
  invoicePdfStorageUrl?: string;
  billingDedupeKey?: string;
  billingFrequency?: string;
  currency?: string;
  issueDate?: any;
  periodKey?: string;
  pricingBaseSnapshot?: number;
  pricingSnapshot?: number;
  source?: string;
  invoiceType?: string;
  stripeCustomerId?: string;
  stripeHostedInvoiceUrl?: string;
  stripeInvoiceId?: string;
  stripeInvoicePdf?: string;
  stripeInvoiceStatus?: string;
  stripeTaxRateId?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  taxBreakdownApplied?: boolean;
  taxMode?: string;
  taxRatePercent?: number;
  updatedAt?: any;
  condominiumLimitSnapshot?: number;
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
    filters?: { status?: string; condominiumId?: string }
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
    invoice: ClientInvoice,
    customSuccessUrl?: string,
    customCancelUrl?: string
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

const clearInvoiceCache = () => {
  Object.keys(invoiceCache).forEach((key) => {
    delete invoiceCache[key];
  });
};

const extractCondominiumIdFromPath = (path: string): string => {
  const pathSegments = String(path || "").split("/");
  if (
    pathSegments.length >= 4 &&
    pathSegments[0] === "clients" &&
    pathSegments[2] === "condominiums"
  ) {
    return pathSegments[3] || "";
  }
  return "";
};

const getCondominiumNamesByClient = async (
  clientId: string
): Promise<Record<string, string>> => {
  const condominiumNames: Record<string, string> = {};

  const condominiumsSnapshot = await getDocs(
    collection(db, `clients/${clientId}/condominiums`)
  );

  condominiumsSnapshot.forEach((condominiumDoc) => {
    const condominiumData = condominiumDoc.data() || {};
    const condominiumName = String(
      condominiumData.name ||
        condominiumData.condominiumName ||
        condominiumData.uid ||
        condominiumDoc.id
    ).trim();

    condominiumNames[condominiumDoc.id] = condominiumName;
  });

  return condominiumNames;
};

const getTimestampMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") {
    return Number(value.toMillis()) || 0;
  }
  if (typeof value?.toDate === "function") {
    return Number(value.toDate().getTime()) || 0;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const sortInvoicesByMostRecent = (invoices: ClientInvoice[]): ClientInvoice[] => {
  return [ ...invoices ].sort((a, b) => {
    const left =
      getTimestampMillis(a.createdAt) ||
      getTimestampMillis(a.issueDate) ||
      getTimestampMillis(a.updatedAt) ||
      getTimestampMillis(a.dueDate);
    const right =
      getTimestampMillis(b.createdAt) ||
      getTimestampMillis(b.issueDate) ||
      getTimestampMillis(b.updatedAt) ||
      getTimestampMillis(b.dueDate);
    return right - left;
  });
};

const mapInvoiceRecord = (params: {
  docId: string;
  data: Record<string, any>;
  defaultClientId: string;
  fallbackCondominiumId?: string;
  condominiumNamesById?: Record<string, string>;
}): ClientInvoice => {
  const {
    docId,
    data,
    defaultClientId,
    fallbackCondominiumId = "",
    condominiumNamesById = {},
  } = params;
  const invoiceCondominiumId = String(
    data.condominiumId || fallbackCondominiumId || ""
  ).trim();
  const invoiceCondominiumName =
    String(data.condominiumName || "").trim() ||
    condominiumNamesById[invoiceCondominiumId] ||
    invoiceCondominiumId ||
    "N/A";

  return {
    id: docId,
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
    clientId: data.clientId || defaultClientId,
    condominiumId: invoiceCondominiumId,
    condominiumName: invoiceCondominiumName,
    plan: data.plan,
    userEmail: data.userEmail || "",
    userUID: data.userUID || "",
    nextBillingDate: data.nextBillingDate,
    message: data.message,
    invoicePdfStoragePath: data.invoicePdfStoragePath,
    invoicePdfStorageUrl: data.invoicePdfStorageUrl,
    billingDedupeKey: data.billingDedupeKey,
    billingFrequency: data.billingFrequency,
    currency: data.currency || "MXN",
    issueDate: data.issueDate,
    periodKey: data.periodKey,
    pricingBaseSnapshot: data.pricingBaseSnapshot,
    pricingSnapshot: data.pricingSnapshot,
    source: data.source,
    invoiceType: data.invoiceType,
    stripeCustomerId: data.stripeCustomerId,
    stripeHostedInvoiceUrl: data.stripeHostedInvoiceUrl,
    stripeInvoiceId: data.stripeInvoiceId,
    stripeInvoicePdf: data.stripeInvoicePdf,
    stripeInvoiceStatus: data.stripeInvoiceStatus,
    stripeTaxRateId: data.stripeTaxRateId,
    subtotalAmount: data.subtotalAmount,
    taxAmount: data.taxAmount,
    taxBreakdownApplied: data.taxBreakdownApplied,
    taxMode: data.taxMode,
    taxRatePercent: data.taxRatePercent,
    updatedAt: data.updatedAt,
    condominiumLimitSnapshot: data.condominiumLimitSnapshot,
  };
};

const fetchInvoicesFromCondominiumCollections = async (params: {
  clientId: string;
  status?: string;
  condominiumId?: string;
}): Promise<ClientInvoice[]> => {
  const { clientId, status, condominiumId } = params;
  let condominiumNamesById: Record<string, string> = {};
  try {
    condominiumNamesById = await getCondominiumNamesByClient(clientId);
  } catch (error) {
    console.warn(
      "No se pudo leer la lista de condominios del cliente para fallback:",
      error
    );
  }
  const condominiumIds = condominiumId
    ? [condominiumId]
    : Object.keys(condominiumNamesById);

  const snapshots = await Promise.all(
    condominiumIds.map(async (condominiumId) => {
      try {
        const invoicesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`
        );
        let invoicesQuery = query(
          invoicesRef,
          where("clientId", "==", clientId)
        );
        if (status) {
          invoicesQuery = query(
            invoicesQuery,
            where("paymentStatus", "==", status)
          );
        }
        const invoicesSnapshot = await getDocs(invoicesQuery);

        return invoicesSnapshot.docs.map((invoiceDoc) =>
          mapInvoiceRecord({
            docId: invoiceDoc.id,
            data: invoiceDoc.data(),
            defaultClientId: clientId,
            fallbackCondominiumId: condominiumId,
            condominiumNamesById,
          })
        );
      } catch (error) {
        console.warn(
          `No se pudieron consultar facturas del condominio ${condominiumId} en fallback:`,
          error
        );
        return [];
      }
    })
  );

  let legacyInvoices: ClientInvoice[] = [];
  try {
    let legacyQuery = query(
      collection(db, `clients/${clientId}/invoicesGenerated`),
      where("clientId", "==", clientId)
    );
    if (status) {
      legacyQuery = query(legacyQuery, where("paymentStatus", "==", status));
    }
    if (condominiumId) {
      legacyQuery = query(
        legacyQuery,
        where("condominiumId", "==", condominiumId)
      );
    }

    const legacyInvoicesSnapshot = await getDocs(legacyQuery);
    legacyInvoices = legacyInvoicesSnapshot.docs.map((invoiceDoc) =>
      mapInvoiceRecord({
        docId: invoiceDoc.id,
        data: invoiceDoc.data(),
        defaultClientId: clientId,
        fallbackCondominiumId: extractCondominiumIdFromPath(invoiceDoc.ref.path),
        condominiumNamesById,
      })
    );
  } catch (error) {
    console.warn("No se pudieron consultar facturas legacy en fallback:", error);
  }

  const mergedInvoices = sortInvoicesByMostRecent([
    ...snapshots.flat(),
    ...legacyInvoices,
  ]);

  if (!status && !condominiumId) {
    return mergedInvoices;
  }

  return mergedInvoices.filter((invoice) => {
    const paymentStatus = String(invoice.paymentStatus || "").toLowerCase();
    const genericStatus = String(invoice.status || "").toLowerCase();
    const targetStatus = String(status || "").toLowerCase();
    const statusMatch =
      !status || paymentStatus === targetStatus || genericStatus === targetStatus;
    const condominiumMatch =
      !condominiumId ||
      String(invoice.condominiumId || "").trim() === condominiumId;
    return statusMatch && condominiumMatch;
  });
};

const useClientInvoicesStore = create<ClientInvoicesState>()((set, get) => ({
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
      const clientId =
        (tokenResult.claims.clientId as string) ||
        String(localStorage.getItem("clientId") || "");

      if (!clientId) {
        throw new Error("No se encontró clientId");
      }

      // Generar clave para caché basada en filtros y cursor
      const startAfterOffset =
        typeof (startAfter as any)?.__offset === "number"
          ? Number((startAfter as any).__offset)
          : null;
      const hasOffsetCursor = startAfterOffset !== null;
      const cacheKey = JSON.stringify({
        clientId,
        filters,
        startAfter: hasOffsetCursor
          ? `offset:${startAfterOffset}`
          : startAfter
          ? startAfter.id
          : "first",
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

      let invoicesQuery = query(
        collectionGroup(db, "invoicesGenerated"),
        where("clientId", "==", clientId),
        orderBy("createdAt", "desc")
      );

      // Aplicar filtros si existen
      if (filters.status) {
        invoicesQuery = query(
          invoicesQuery,
          where("paymentStatus", "==", filters.status)
        );
      }
      if (filters.condominiumId) {
        invoicesQuery = query(
          invoicesQuery,
          where("condominiumId", "==", filters.condominiumId)
        );
      }

      // Aplicar paginación
      if (startAfter && !hasOffsetCursor) {
        invoicesQuery = query(invoicesQuery, firestoreStartAfter(startAfter));
      }

      // Aplicar límite de página
      invoicesQuery = query(invoicesQuery, limit(pageSize));

      let invoiceRecords: ClientInvoice[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let queryFailed = false;
      let fallbackTotalCount: number | null = null;

      try {
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const condominiumNamesById = await getCondominiumNamesByClient(clientId);

        for (const invoiceDoc of invoicesSnapshot.docs) {
          const data = invoiceDoc.data();
          const invoiceCondominiumId =
            data.condominiumId ||
            extractCondominiumIdFromPath(invoiceDoc.ref.path);
          invoiceRecords.push(
            mapInvoiceRecord({
              docId: invoiceDoc.id,
              data,
              defaultClientId: clientId,
              fallbackCondominiumId: invoiceCondominiumId,
              condominiumNamesById,
            })
          );
          lastDoc = invoiceDoc;
        }
      } catch (groupQueryError) {
        queryFailed = true;
        console.warn(
          "No se pudo consultar facturas con collectionGroup, usando fallback por condominio:",
          groupQueryError
        );
      }

      const shouldUseFallback =
        hasOffsetCursor || queryFailed || (invoiceRecords.length === 0 && !startAfter);
      if (shouldUseFallback) {
        const fallbackRecords = await fetchInvoicesFromCondominiumCollections({
          clientId,
          status: filters.status,
          condominiumId: filters.condominiumId,
        });
        fallbackTotalCount = fallbackRecords.length;
        const startOffset = startAfterOffset || 0;
        const paginatedFallbackRecords = fallbackRecords.slice(
          startOffset,
          startOffset + pageSize
        );
        const nextOffset = startOffset + paginatedFallbackRecords.length;
        const hasMoreFallback = nextOffset < fallbackRecords.length;
        lastDoc = hasMoreFallback
          ? ({ __offset: nextOffset } as any as QueryDocumentSnapshot<DocumentData>)
          : null;
        invoiceRecords = paginatedFallbackRecords;
      }

      // Almacenar en caché si no hay filtros específicos
      if (!filters.status && invoiceRecords.length > 0) {
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
        totalInvoices: fallbackTotalCount ?? invoiceRecords.length,
      });

      if (shouldUseFallback && fallbackTotalCount !== null) {
        const startOffset = startAfterOffset || 0;
        const hasMore = startOffset + invoiceRecords.length < fallbackTotalCount;
        if (!hasMore && invoiceRecords.length === pageSize) {
          return Math.max(pageSize - 1, 0);
        }
      }

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
      const clientId =
        (tokenResult.claims.clientId as string) ||
        String(localStorage.getItem("clientId") || "");

      if (!clientId) {
        throw new Error("No se encontró clientId");
      }

      let invoiceRecords: ClientInvoice[] = [];

      try {
        const searchQuery = query(
          collectionGroup(db, "invoicesGenerated"),
          where("clientId", "==", clientId),
          where("invoiceNumber", "==", invoiceNumber)
        );

        const searchSnapshot = await getDocs(searchQuery);
        const condominiumNamesById = await getCondominiumNamesByClient(clientId);

        searchSnapshot.forEach((invoiceDoc) => {
          const data = invoiceDoc.data();
          const invoiceCondominiumId =
            data.condominiumId ||
            extractCondominiumIdFromPath(invoiceDoc.ref.path);
          invoiceRecords.push(
            mapInvoiceRecord({
              docId: invoiceDoc.id,
              data,
              defaultClientId: clientId,
              fallbackCondominiumId: invoiceCondominiumId,
              condominiumNamesById,
            })
          );
        });
      } catch (searchError) {
        console.warn(
          "No se pudo buscar por collectionGroup, usando fallback por condominio:",
          searchError
        );
      }

      if (invoiceRecords.length === 0) {
        const fallbackRecords = await fetchInvoicesFromCondominiumCollections({
          clientId,
        });
        invoiceRecords = fallbackRecords.filter(
          (invoice) => invoice.invoiceNumber === invoiceNumber
        );
      }

      set({ loading: false });

      return sortInvoicesByMostRecent(invoiceRecords);
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
      const clientId =
        (tokenResult.claims.clientId as string) ||
        String(localStorage.getItem("clientId") || "");
      const localCondominiumId = localStorage.getItem("condominiumId");
      const invoiceFromState = get().invoices.find(
        (invoice) => invoice.id === invoiceId
      );
      const condominiumId =
        invoiceFromState?.condominiumId || localCondominiumId || "";

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
    clearInvoiceCache();
    set({
      invoices: [],
      lastInvoiceDoc: null,
      totalInvoices: 0,
      loading: false,
      error: null,
    });
  },

  initiateStripePayment: async (
    invoice: ClientInvoice,
    customSuccessUrl?: string,
    customCancelUrl?: string
  ) => {
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
      // Incluir invoice_id como parámetro para poder identificar la factura en rutas genéricas
      const successUrl = customSuccessUrl || `${currentDomain}/dashboard/payment-success?invoice_id=${invoice.id}`;
      const cancelUrl = customCancelUrl || `${currentDomain}/dashboard/payment-cancel?invoice_id=${invoice.id}`;

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
      return { id: "", url: "" };
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
