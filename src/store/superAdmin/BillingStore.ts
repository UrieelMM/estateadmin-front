import { create } from "zustand";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter as firestoreStartAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

export interface InvoiceData {
  amount: number;
  dueDate: Date;
  optionalMessage: string;
  userEmail: string;
  userUID: string;
  invoiceURL?: string;
  xmlURL?: string;
  status?: "pending" | "paid" | "overdue" | "canceled";
  paymentStatus: "pending" | "paid" | "overdue" | "canceled";
  createdAt: Date;
  concept: string;
  invoiceNumber: string;
  generatedAt?: Date;
  isPaid: boolean;
  clientId: string;
  condominiumId: string;
}

export interface InvoiceRecord {
  id: string;
  clientId: string;
  clientName: string;
  condominiumId: string;
  condominiumName?: string;
  amount: number;
  status?: "pending" | "paid" | "overdue" | "canceled";
  paymentStatus: "pending" | "paid" | "overdue" | "canceled";
  invoiceNumber: string;
  concept: string;
  createdAt: any;
  dueDate: any;
  paidDate?: any;
  plan?: string;
  isPaid: boolean;
  invoiceURL?: string;
  xmlURL?: string;
  userEmail: string;
  userUID: string;
  optionalMessage: string;
}

interface BillingStore {
  loading: boolean;
  error: string | null;
  invoices: InvoiceRecord[];
  lastInvoiceDoc: QueryDocumentSnapshot<DocumentData> | null;
  totalInvoices: number;
  loadingInvoices: boolean;

  createInvoice: (
    clientId: string,
    condominiumId: string,
    invoiceData: InvoiceData,
    file: File,
    xmlFile?: File | null
  ) => Promise<boolean>;

  fetchInvoices: (
    pageSize?: number,
    startAfter?: QueryDocumentSnapshot<DocumentData> | null,
    filters?: { status?: string; clientId?: string }
  ) => Promise<number>;

  searchInvoiceByFolio: (folio: string) => Promise<InvoiceRecord[]>;

  resetInvoicesState: () => void;
}

const db = getFirestore();
const storage = getStorage();

// Cache para resultados de paginación
const invoiceCache: Record<
  string,
  {
    invoices: InvoiceRecord[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }
> = {};

const useBillingStore = create<BillingStore>((set, _get) => ({
  loading: false,
  error: null,
  invoices: [],
  lastInvoiceDoc: null,
  totalInvoices: 0,
  loadingInvoices: false,

  createInvoice: async (
    clientId,
    condominiumId,
    invoiceData,
    file,
    xmlFile
  ) => {
    set({ loading: true, error: null });
    try {
      // 1. Subir el archivo de factura a Storage
      const invoiceFileName = `invoice_${Date.now()}_${file.name}`;
      const storagePath = `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated/${invoiceFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const invoiceURL = await getDownloadURL(storageRef);

      // 2. Subir el archivo XML a Storage (si existe)
      let xmlURL = null;
      if (xmlFile) {
        const xmlFileName = `xml_${Date.now()}_${xmlFile.name}`;
        const xmlStoragePath = `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated/${xmlFileName}`;
        const xmlStorageRef = ref(storage, xmlStoragePath);

        await uploadBytes(xmlStorageRef, xmlFile);
        xmlURL = await getDownloadURL(xmlStorageRef);
      }

      // 3. Crear documento en Firestore con las URLs de los archivos
      const invoicesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`
      );

      const now = new Date();

      await addDoc(invoicesRef, {
        ...invoiceData,
        invoiceURL,
        xmlURL,
        createdAt: now,
        generatedAt: Timestamp.fromDate(now),
        isPaid: false,
        paymentStatus: "pending",
        clientId,
        condominiumId,
      });

      set({ loading: false });
      toast.success("Factura creada exitosamente");
      return true;
    } catch (error: any) {
      console.error("Error al crear factura:", error);
      set({
        error: error.message || "Error al crear la factura",
        loading: false,
      });
      toast.error("Error al crear la factura");
      return false;
    }
  },

  fetchInvoices: async (pageSize = 20, startAfter = null, filters = {}) => {
    set({ loadingInvoices: true });
    try {
      // Generar clave para caché basada en filtros y cursor
      const cacheKey = JSON.stringify({
        filters,
        startAfter: startAfter ? startAfter.id : "first",
      });

      // Usar caché si está disponible y no hay filtros específicos
      if (!filters.status && !filters.clientId && invoiceCache[cacheKey]) {
        const cached = invoiceCache[cacheKey];
        set({
          invoices: cached.invoices,
          lastInvoiceDoc: cached.lastDoc,
          loadingInvoices: false,
          totalInvoices: cached.invoices.length,
        });
        return cached.invoices.length;
      }

      // Consulta de facturas usando collectionGroup para obtener de todos los clientes
      let invoicesQuery = query(
        collectionGroup(db, "invoicesGenerated"),
        orderBy("createdAt", "desc")
      );

      // Aplicar filtros si existen
      if (filters.status) {
        invoicesQuery = query(
          invoicesQuery,
          where("paymentStatus", "==", filters.status)
        );
      }

      if (filters.clientId) {
        invoicesQuery = query(
          invoicesQuery,
          where("clientId", "==", filters.clientId)
        );
      }

      // Aplicar paginación
      if (startAfter) {
        invoicesQuery = query(invoicesQuery, firestoreStartAfter(startAfter));
      }

      // Aplicar límite de página
      invoicesQuery = query(invoicesQuery, limit(pageSize));

      const invoicesSnapshot = await getDocs(invoicesQuery);

      // Procesar resultados
      const invoiceRecords: InvoiceRecord[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      for (const doc of invoicesSnapshot.docs) {
        const data = doc.data();

        // Construir objeto de factura
        const invoice: InvoiceRecord = {
          id: doc.id,
          clientId: data.clientId || "",
          clientName: data.clientName || "Cliente sin nombre",
          condominiumId: data.condominiumId || "",
          condominiumName: data.condominiumName,
          amount: data.amount || 0,
          status: data.status,
          paymentStatus: data.paymentStatus || data.status || "pending",
          invoiceNumber: data.invoiceNumber || "",
          concept: data.concept || "Suscripción Mensual",
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          plan: data.plan,
          isPaid: data.isPaid || false,
          invoiceURL: data.invoiceURL,
          xmlURL: data.xmlURL,
          userEmail: data.userEmail || "",
          userUID: data.userUID || "",
          optionalMessage: data.optionalMessage || "",
        };

        invoiceRecords.push(invoice);
        lastDoc = doc;
      }

      // Almacenar en caché si no hay filtros específicos
      if (!filters.status && !filters.clientId) {
        invoiceCache[cacheKey] = {
          invoices: invoiceRecords,
          lastDoc,
        };
      }

      // Actualizar estado
      set({
        invoices: invoiceRecords,
        lastInvoiceDoc: lastDoc,
        loadingInvoices: false,
        totalInvoices: invoiceRecords.length,
      });

      return invoiceRecords.length;
    } catch (error: any) {
      console.error("Error al obtener facturas:", error);
      set({
        error: error.message || "Error al obtener las facturas",
        loadingInvoices: false,
      });
      return 0;
    }
  },

  searchInvoiceByFolio: async (folio: string) => {
    set({ loadingInvoices: true, invoices: [] });
    try {
      // Buscar facturas por número de factura (folio)
      const invoicesQuery = query(
        collectionGroup(db, "invoicesGenerated"),
        where("invoiceNumber", "==", folio)
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);

      const invoiceRecords: InvoiceRecord[] = [];

      invoicesSnapshot.forEach((doc) => {
        const data = doc.data();

        const invoice: InvoiceRecord = {
          id: doc.id,
          clientId: data.clientId || "",
          clientName: data.clientName || "Cliente sin nombre",
          condominiumId: data.condominiumId || "",
          condominiumName: data.condominiumName,
          amount: data.amount || 0,
          status: data.status,
          paymentStatus: data.paymentStatus || data.status || "pending",
          invoiceNumber: data.invoiceNumber || "",
          concept: data.concept || "Suscripción Mensual",
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          paidDate: data.paidDate,
          plan: data.plan,
          isPaid: data.isPaid || false,
          invoiceURL: data.invoiceURL,
          xmlURL: data.xmlURL,
          userEmail: data.userEmail || "",
          userUID: data.userUID || "",
          optionalMessage: data.optionalMessage || "",
        };

        invoiceRecords.push(invoice);
      });

      set({
        invoices: invoiceRecords,
        loadingInvoices: false,
        totalInvoices: invoiceRecords.length,
        lastInvoiceDoc: null,
        error: null,
      });

      return invoiceRecords;
    } catch (error: any) {
      console.error("Error al buscar factura por folio:", error);
      set({
        error: error.message || "Error al buscar factura",
        loadingInvoices: false,
        invoices: [],
        totalInvoices: 0,
        lastInvoiceDoc: null,
      });
      return [];
    }
  },

  resetInvoicesState: () => {
    set({
      invoices: [],
      lastInvoiceDoc: null,
      totalInvoices: 0,
      loadingInvoices: false,
      error: null,
    });
  },
}));

export default useBillingStore;
