import { create } from "zustand";
import * as Sentry from "@sentry/react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  getSuperAdminSessionToken,
  // executeSuperAdminOperation,
} from "../../services/superAdminService";

interface Client {
  id: string;
  companyName: string;
  email: string;
  country: string;
  createdDate: any; // Firestore timestamp
  RFC: string;
  status: "active" | "inactive" | "pending";
  plan?: string;
  condominiumsCount?: number;
}

interface NewClientData {
  email: string;
  name: string;
  lastName: string;
  password: string;
  phoneNumber: string;
  plan: string;
  proFunctions: string[];
  companyName: string;
  address: string;
  RFC: string;
  country: string;
  businessName: string;
  taxResidence: string;
  taxRegime: string;
  condominiumName: string;
  condominiumInfo: {
    name: string;
    address: string;
  };
}

interface ClientCredentials {
  email: string;
  password: string;
}

interface SuperAdminStore {
  clients: Client[];
  recentAudits: any[];
  loadingClients: boolean;
  loadingAudits: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;
  fetchRecentAudits: () => Promise<void>;
  createClient: (
    clientData: NewClientData
  ) => Promise<{ success: boolean; credentials?: ClientCredentials }>;
}

const db = getFirestore();

// Store específico para operaciones de solo lectura de Super Admin
const useSuperAdminStore = create<SuperAdminStore>((set, _get) => ({
  clients: [],
  recentAudits: [],
  loadingClients: false,
  loadingAudits: false,
  error: null,

  // Fetchear clientes (operación de solo lectura)
  fetchClients: async () => {
    // Verificar que haya una sesión válida de Super Admin
    if (!getSuperAdminSessionToken()) {
      set({ error: "No tienes una sesión válida de Super Admin" });
      return;
    }

    set({ loadingClients: true, error: null });
    try {
      const clientsCollection = collection(db, "clients");
      const clientsQuery = query(
        clientsCollection,
        orderBy("createdDate", "desc")
      );
      const clientsSnapshot = await getDocs(clientsQuery);

      const clientsData: Client[] = clientsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          companyName: data.companyName || "",
          email: data.email || "",
          country: data.country || "",
          createdDate: data.createdDate,
          RFC: data.RFC || "",
          status: data.status || "pending",
          plan: data.plan || "Free",
          condominiumsCount: data.condominiumsCount || 0,
        };
      });

      set({ clients: clientsData, loadingClients: false });
    } catch (error: any) {
      console.error("Error al cargar clientes:", error);
      set({
        error: error.message || "Error al cargar datos",
        loadingClients: false,
      });
    }
  },

  // Fetchear auditoría reciente (operación de solo lectura)
  fetchRecentAudits: async () => {
    // Verificar que haya una sesión válida de Super Admin
    if (!getSuperAdminSessionToken()) {
      set({ error: "No tienes una sesión válida de Super Admin" });
      return;
    }

    set({ loadingAudits: true, error: null });
    try {
      const auditsCollection = collection(db, "super_admin_audit");
      const auditsQuery = query(
        auditsCollection,
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const auditsSnapshot = await getDocs(auditsQuery);

      const auditsData = auditsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      set({ recentAudits: auditsData, loadingAudits: false });
    } catch (error: any) {
      console.error("Error al cargar auditoría:", error);
      set({
        error: error.message || "Error al cargar datos de auditoría",
        loadingAudits: false,
      });
    }
  },

  // Crear nuevo cliente
  createClient: async (clientData: NewClientData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/register-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientData),
        }
      );

      if (response.ok) {
        // Recargar la lista de clientes después de crear uno nuevo
        await _get().fetchClients();
        return {
          success: true,
          credentials: {
            email: clientData.email,
            password: clientData.password,
          },
        };
      }
      return { success: false };
    } catch (error: any) {
      Sentry.captureException(error);
      set({ error: error.message || "Error al crear el cliente" });
      return { success: false };
    }
  },
}));

export default useSuperAdminStore;
