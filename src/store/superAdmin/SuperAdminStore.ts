import { create } from "../createStore";
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
import toast from "react-hot-toast";
import { CondominiumStatus } from "../../presentation/components/superAdmin/NewClientForm";

interface Client {
  id: string;
  companyName: string;
  email: string;
  country: string;
  createdDate: any; // Firestore timestamp
  RFC: string;
  status: "active" | "inactive" | "pending" | "blocked";
  plan?: string;
  condominiumsCount?: number;
  businessName?: string;
  fullFiscalAddress?: string;
  taxRegime?: string;
  businessActivity?: string;
  condominiumLimit?: number;
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  responsiblePersonName?: string;
  responsiblePersonPosition?: string;
  billingFrequency?: string;
  cfdiUse?: string;
  serviceStartDate?: any;
  termsAccepted?: boolean;
  address?: string;
  currency?: string; // Nuevo campo para moneda
  language?: string; // Nuevo campo para idioma
}

interface NewClientData {
  // Campos obligatorios
  name: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  companyName: string;
  fullFiscalAddress: string;
  RFC: string;
  country: string;
  businessName: string;
  taxRegime: string;
  businessActivity: string;
  responsiblePersonName: string;
  responsiblePersonPosition: string;
  condominiumLimit: number;
  condominiumInfo: {
    name: string;
    address: string;
    status: CondominiumStatus;
    currency: string;
    language: string;
  };

  // Campos opcionales con valores predeterminados
  photoURL?: string;
  plan: "Basic" | "Essential" | "Professional" | "Premium";
  proFunctions?: string[];
  cfdiUse?: string;
  serviceStartDate?: Date;
  billingFrequency?: "monthly" | "quarterly" | "biannual" | "annual";
  termsAccepted?: boolean;
  address?: string; // Mantenido por compatibilidad
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
  creatingClient: boolean;

  fetchClients: () => Promise<void>;
  fetchRecentAudits: () => Promise<void>;
  createClient: (
    clientData: NewClientData
  ) => Promise<{ success: boolean; credentials?: ClientCredentials }>;
}

const db = getFirestore();

// Store específico para operaciones de solo lectura de Super Admin
const useSuperAdminStore = create<SuperAdminStore>()((set, _get) => ({
  clients: [],
  recentAudits: [],
  loadingClients: false,
  loadingAudits: false,
  error: null,
  creatingClient: false,

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
        // Extraer todos los campos disponibles
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
          // Datos adicionales
          businessName: data.businessName || "",
          fullFiscalAddress: data.fullFiscalAddress || "",
          taxRegime: data.taxRegime || "",
          businessActivity: data.businessActivity || "",
          condominiumLimit: data.condominiumLimit || 0,
          // Datos del administrador
          name: data.name || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          responsiblePersonName: data.responsiblePersonName || "",
          responsiblePersonPosition: data.responsiblePersonPosition || "",
          // Otros campos
          billingFrequency: data.billingFrequency || "",
          cfdiUse: data.cfdiUse || "",
          serviceStartDate: data.serviceStartDate || null,
          termsAccepted: data.termsAccepted || false,
          address: data.address || "",
          currency: data.currency || "",
          language: data.language || "",
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
    set({ creatingClient: true, error: null });

    try {
      // Validar la compatibilidad entre plan y condominiumLimit
      const isValidPlanLimit = validatePlanCondominiumLimit(
        clientData.plan,
        clientData.condominiumLimit
      );

      if (!isValidPlanLimit.valid) {
        toast.error(
          isValidPlanLimit.message ||
            "Límite de condominios incompatible con el plan seleccionado"
        );
        set({ creatingClient: false });
        return { success: false };
      }

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

      const responseData = await response.json();

      if (response.ok) {
        // Recargar la lista de clientes después de crear uno nuevo
        await _get().fetchClients();
        toast.success("Cliente creado exitosamente");
        set({ creatingClient: false });
        return {
          success: true,
          credentials: {
            email: clientData.email,
            password: clientData.password,
          },
        };
      } else {
        toast.error(responseData.message || "Error al crear el cliente");
        set({
          creatingClient: false,
          error: responseData.message || "Error al crear el cliente",
        });
        return { success: false };
      }
    } catch (error: any) {
      Sentry.captureException(error);
      const errorMessage = error.message || "Error al crear el cliente";
      toast.error(errorMessage);
      set({ error: errorMessage, creatingClient: false });
      return { success: false };
    }
  },
}));

// Función auxiliar para validar la compatibilidad entre plan y límite de condominios
function validatePlanCondominiumLimit(
  plan: string,
  limit: number
): { valid: boolean; message?: string } {
  switch (plan) {
    case "Basic":
      if (limit < 1 || limit > 50) {
        return {
          valid: false,
          message: "El plan Basic permite entre 1 y 50 condominios",
        };
      }
      break;
    case "Essential":
      if (limit < 51 || limit > 100) {
        return {
          valid: false,
          message: "El plan Essential permite entre 51 y 100 condominios",
        };
      }
      break;
    case "Professional":
      if (limit < 101 || limit > 250) {
        return {
          valid: false,
          message: "El plan Professional permite entre 101 y 250 condominios",
        };
      }
      break;
    case "Premium":
      if (limit < 251 || limit > 500) {
        return {
          valid: false,
          message: "El plan Premium permite entre 251 y 500 condominios",
        };
      }
      break;
    default:
      return { valid: false, message: "Plan no válido" };
  }

  return { valid: true };
}

export default useSuperAdminStore;
