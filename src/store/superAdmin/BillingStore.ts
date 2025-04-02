import { create } from "zustand";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
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
  status: "pending" | "paid" | "overdue" | "canceled";
  createdAt: Date;
  concept: string;
  invoiceNumber: string;
  generatedAt?: Date;
  isPaid: boolean;
  clientId: string;
  condominiumId: string;
}

interface BillingStore {
  loading: boolean;
  error: string | null;
  createInvoice: (
    clientId: string,
    condominiumId: string,
    invoiceData: InvoiceData,
    file: File
  ) => Promise<boolean>;
}

const db = getFirestore();
const storage = getStorage();

const useBillingStore = create<BillingStore>((set) => ({
  loading: false,
  error: null,

  createInvoice: async (clientId, condominiumId, invoiceData, file) => {
    set({ loading: true, error: null });
    try {
      // 1. Subir el archivo a Storage
      const invoiceFileName = `invoice_${Date.now()}_${file.name}`;
      const storagePath = `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated/${invoiceFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const invoiceURL = await getDownloadURL(storageRef);

      // 2. Crear documento en Firestore con la URL del archivo
      const invoicesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`
      );

      const now = new Date();

      await addDoc(invoicesRef, {
        ...invoiceData,
        invoiceURL,
        createdAt: now,
        generatedAt: Timestamp.fromDate(now),
        isPaid: false,
        status: "pending",
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
}));

export default useBillingStore;
