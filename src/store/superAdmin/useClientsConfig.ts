import { create } from "zustand";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { executeSuperAdminOperation } from "../../services/superAdminService";
import toast from "react-hot-toast";

// Interfaces
export interface Client {
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

export interface ClientFormData {
  id: string;
  companyName: string;
  email: string;
  country: string;
  RFC: string;
  status: "active" | "inactive" | "pending";
  plan: string;
}

export interface CondominiumFormData {
  name: string;
  address: string;
}

export interface ClientCredentials {
  email: string;
  password: string;
}

interface ClientsConfigStore {
  // Estado
  clientsWithCondominiums: Client[];
  currentClient: ClientFormData | null;
  condominiumForm: CondominiumFormData;
  credentials: ClientCredentials | null;
  loading: boolean;
  addingCondominium: boolean;

  // Acciones
  fetchClientsWithCondominiums: (clients: Client[]) => Promise<void>;
  setCurrentClient: (client: Client | null) => void;
  updateClientForm: (field: string, value: string) => void;
  updateCondominiumForm: (field: string, value: string) => void;
  resetCondominiumForm: () => void;
  submitClientEdit: () => Promise<boolean>;
  createCondominium: () => Promise<boolean>;
  setCredentials: (credentials: ClientCredentials | null) => void;
}

const initialCondominiumForm: CondominiumFormData = {
  name: "",
  address: "",
};

const db = getFirestore();

// Store para gestión de clientes y condominios
const useClientsConfig = create<ClientsConfigStore>((set, get) => ({
  // Estado inicial
  clientsWithCondominiums: [],
  currentClient: null,
  condominiumForm: initialCondominiumForm,
  credentials: null,
  loading: false,
  addingCondominium: false,

  // Cargar clientes con sus condominios
  fetchClientsWithCondominiums: async (clients) => {
    if (clients.length === 0) return;

    try {
      const updatedClients = await Promise.all(
        clients.map(async (client) => {
          try {
            const condominiumsRef = collection(
              db,
              `clients/${client.id}/condominiums`
            );
            const condominiumsSnapshot = await getDocs(condominiumsRef);
            return {
              ...client,
              condominiumsCount: condominiumsSnapshot.size,
            };
          } catch (error) {
            console.error(
              `Error al obtener condominios para ${client.id}:`,
              error
            );
            return client;
          }
        })
      );

      set({ clientsWithCondominiums: updatedClients });
    } catch (error) {
      console.error("Error al cargar clientes con condominios:", error);
    }
  },

  // Establecer cliente actual para edición
  setCurrentClient: (client) => {
    if (!client) {
      set({ currentClient: null });
      return;
    }

    set({
      currentClient: {
        id: client.id,
        companyName: client.companyName,
        email: client.email,
        country: client.country || "",
        RFC: client.RFC || "",
        status: client.status,
        plan: client.plan || "Free",
      },
    });
  },

  // Actualizar campo del formulario de cliente
  updateClientForm: (field, value) => {
    const { currentClient } = get();
    if (!currentClient) return;

    set({
      currentClient: {
        ...currentClient,
        [field]: value,
      },
    });
  },

  // Actualizar campo del formulario de condominio
  updateCondominiumForm: (field, value) => {
    set({
      condominiumForm: {
        ...get().condominiumForm,
        [field]: value,
      },
    });
  },

  // Reiniciar formulario de condominio
  resetCondominiumForm: () => {
    set({ condominiumForm: initialCondominiumForm });
  },

  // Enviar datos actualizados del cliente
  submitClientEdit: async () => {
    const { currentClient } = get();
    if (!currentClient) return false;

    set({ loading: true });

    try {
      // Usar la Cloud Function para actualizar cliente
      const result = await executeSuperAdminOperation(
        "update_client",
        currentClient.id,
        {
          companyName: currentClient.companyName,
          email: currentClient.email,
          country: currentClient.country,
          RFC: currentClient.RFC,
          status: currentClient.status,
          plan: currentClient.plan,
        }
      );

      if (result && result.success) {
        toast.success("Cliente actualizado con éxito");
        set({ loading: false });
        return true;
      } else {
        toast.error("No se pudo actualizar el cliente");
        set({ loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Error al actualizar cliente:", error);
      toast.error("Error al actualizar la información del cliente");
      set({ loading: false });
      return false;
    }
  },

  // Crear nuevo condominio
  createCondominium: async () => {
    const { currentClient, condominiumForm } = get();
    if (!currentClient) return false;

    set({ addingCondominium: true });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/register-condominium`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: condominiumForm.name,
            address: condominiumForm.address,
            clientId: currentClient.id,
          }),
        }
      );

      if (response.ok) {
        toast.success("Condominio agregado con éxito");
        // Limpiar formulario
        set({
          condominiumForm: initialCondominiumForm,
          addingCondominium: false,
        });
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "No se pudo agregar el condominio");
        set({ addingCondominium: false });
        return false;
      }
    } catch (error: any) {
      console.error("Error al agregar condominio:", error);
      toast.error("Error al agregar el condominio: " + error.message);
      set({ addingCondominium: false });
      return false;
    }
  },

  // Establecer credenciales después de crear cliente
  setCredentials: (credentials) => {
    set({ credentials });
  },
}));

export default useClientsConfig;
