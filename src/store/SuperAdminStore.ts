import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getSuperAdminSessionToken } from "../services/superAdminService";

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

interface SuperAdminStore {
  clients: Client[];
  recentAudits: any[];
  loadingClients: boolean;
  loadingAudits: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;
  fetchRecentAudits: () => Promise<void>;
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
}));

export default useSuperAdminStore;
