import { create } from "../createStore";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { executeSuperAdminOperation } from "../../services/superAdminService";
import toast from "react-hot-toast";
import { CondominiumStatus } from "../../presentation/components/superAdmin/NewClientForm";

// Interfaces
export interface Client {
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
  // Propiedades adicionales
  phoneNumber?: string;
  address?: string;
  cfdiUse?: string;
  responsiblePersonName?: string;
  responsiblePersonPosition?: string;
  billingFrequency?: string;
  hasMaintenanceApp?: boolean;
}

export interface ClientFormData {
  id: string;
  companyName: string;
  email: string;
  country: string;
  RFC: string;
  status: "active" | "inactive" | "pending" | "blocked";
  plan: string;
  businessName?: string;
  fullFiscalAddress?: string;
  taxRegime?: string;
  businessActivity?: string;
  condominiumLimit?: number;
  phoneNumber?: string;
  address?: string;
  cfdiUse?: string;
  responsiblePersonName?: string;
  responsiblePersonPosition?: string;
  billingFrequency?: string;
  hasMaintenanceApp?: boolean;
}

export interface CondominiumFormData {
  id?: string;
  name: string;
  address: string;
  plan?: string;
  proFunctions?: string[];
  status?: CondominiumStatus;
  clientId?: string;
  condominiumLimit?: number;
}

export interface ClientCredentials {
  email: string;
  password: string;
}

// Agregar una interfaz para los usuarios
export interface User {
  id: string;
  role?: string;
  [key: string]: any; // Para otras propiedades que pueda tener un usuario
}

// Extender la interfaz CondominiumFormData para incluir usuarios
export interface CondominiumWithUsers extends CondominiumFormData {
  users?: User[];
  adminUsersCount?: number;
  regularUsersCount?: number;
}

// Límites de condominios por plan
const PLAN_LIMITS = {
  Basic: { min: 1, max: 50 },
  Essential: { min: 51, max: 100 },
  Professional: { min: 101, max: 250 },
  Premium: { min: 251, max: 500 },
};

interface ClientsConfigStore {
  // Estado
  clientsWithCondominiums: Client[];
  currentClient: ClientFormData | null;
  condominiumForm: CondominiumFormData;
  currentCondominium: CondominiumFormData | null;
  credentials: ClientCredentials | null;
  loading: boolean;
  addingCondominium: boolean;
  updatingCondominium: boolean;

  // Acciones
  fetchClientsWithCondominiums: (clients: Client[]) => Promise<void>;
  setCurrentClient: (client: Client | null) => void;
  setCurrentCondominium: (condominium: any | null) => void;
  updateClientForm: (field: string, value: any) => void;
  updateCondominiumForm: (field: string, value: any) => void;
  resetCondominiumForm: () => void;
  submitClientEdit: () => Promise<boolean>;
  createCondominium: () => Promise<boolean>;
  updateCondominium: () => Promise<boolean>;
  setCredentials: (credentials: ClientCredentials | null) => void;
}

const initialCondominiumForm: CondominiumFormData = {
  name: "",
  address: "",
  plan: "Free",
  proFunctions: [],
  status: CondominiumStatus.Pending,
};

const db = getFirestore();

// Store para gestión de clientes y condominios
const useClientsConfig = create<ClientsConfigStore>()((set, get) => ({
  // Estado inicial
  clientsWithCondominiums: [],
  currentClient: null,
  condominiumForm: initialCondominiumForm,
  currentCondominium: null,
  credentials: null,
  loading: false,
  addingCondominium: false,
  updatingCondominium: false,

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

            // Obtener los datos completos de cada condominio incluyendo sus usuarios
            const condominiums = await Promise.all(
              condominiumsSnapshot.docs.map(async (doc) => {
                const condominiumData: CondominiumWithUsers = {
                  id: doc.id,
                  name: doc.data().name || "",
                  address: doc.data().address || "",
                  ...doc.data(),
                  users: [], // Inicializar el array de usuarios
                };

                // Obtener los usuarios (condóminos) de este condominio
                try {
                  const usersRef = collection(
                    db,
                    `clients/${client.id}/condominiums/${doc.id}/users`
                  );
                  const usersSnapshot = await getDocs(usersRef);

                  // Agregar los usuarios al condominio
                  condominiumData.users = usersSnapshot.docs.map((userDoc) => ({
                    id: userDoc.id,
                    ...userDoc.data(),
                  })) as User[];

                  // Calcular usuarios administrativos y no administrativos
                  condominiumData.adminUsersCount =
                    condominiumData.users.filter(
                      (user) =>
                        user.role === "admin" || user.role === "admin-assistant"
                    ).length;

                  condominiumData.regularUsersCount =
                    condominiumData.users.length -
                    (condominiumData.adminUsersCount || 0);
                } catch (error) {
                  console.error(
                    `Error al obtener usuarios para el condominio ${doc.id}:`,
                    error
                  );
                }

                return condominiumData;
              })
            );

            // Calcular el total de usuarios regulares (no administrativos) en todos los condominios
            const totalRegularUsers = condominiums.reduce(
              (total, condo) => total + (condo.regularUsersCount || 0),
              0
            );

            return {
              ...client,
              condominiumsCount: condominiumsSnapshot.size,
              condominiums: condominiums,
              totalRegularUsers: totalRegularUsers, // Total de usuarios no administrativos
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

    if (!client.id) {
      toast.error("Error: No se puede editar un cliente sin ID");
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
        businessName: client.businessName || "",
        fullFiscalAddress: client.fullFiscalAddress || "",
        taxRegime: client.taxRegime || "",
        businessActivity: client.businessActivity || "",
        condominiumLimit: client.condominiumLimit || 1,
        phoneNumber: client.phoneNumber || "",
        address: client.address || "",
        cfdiUse: client.cfdiUse || "",
        responsiblePersonName: client.responsiblePersonName || "",
        responsiblePersonPosition: client.responsiblePersonPosition || "",
        billingFrequency: client.billingFrequency || "monthly",
        hasMaintenanceApp: client.hasMaintenanceApp || false,
      },
    });
  },

  // Establecer condominio actual para edición
  setCurrentCondominium: (condominium) => {
    if (!condominium) {
      set({ currentCondominium: null });
      return;
    }

    if (!condominium.id) {
      toast.error("Error: No se puede editar un condominio sin ID");
      return;
    }

    set({
      currentCondominium: {
        id: condominium.id,
        name: condominium.name || "",
        address: condominium.address || "",
        plan: condominium.plan || "Free",
        proFunctions: condominium.proFunctions || [],
        status: condominium.status || CondominiumStatus.Pending,
        clientId: condominium.clientId || get().currentClient?.id,
        condominiumLimit: condominium.condominiumLimit || 1,
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
  updateCondominiumForm: (field: string, value: any) => {
    // Si estamos editando un condominio existente
    if (get().currentCondominium) {
      set({
        currentCondominium: {
          ...get().currentCondominium!,
          [field]: value,
        },
      });
    } else {
      // Si estamos creando un nuevo condominio
      set({
        condominiumForm: {
          ...get().condominiumForm,
          [field]: value,
        },
      });
    }
  },

  // Reiniciar formulario de condominio
  resetCondominiumForm: () => {
    set({
      condominiumForm: initialCondominiumForm,
      currentCondominium: null,
    });
  },

  // Enviar datos actualizados del cliente
  submitClientEdit: async () => {
    const { currentClient } = get();
    if (!currentClient) {
      toast.error("No hay cliente seleccionado para editar");
      return false;
    }

    if (!currentClient.id) {
      toast.error("Error: Intentando actualizar un cliente sin ID");
      return false;
    }

    set({ loading: true });

    try {
      // Validar plan y condominiumLimit si existe
      if (currentClient.plan && currentClient.condominiumLimit) {
        const planLimits =
          PLAN_LIMITS[currentClient.plan as keyof typeof PLAN_LIMITS];
        if (
          planLimits &&
          (currentClient.condominiumLimit < planLimits.min ||
            currentClient.condominiumLimit > planLimits.max)
        ) {
          toast.error(
            `El plan ${currentClient.plan} permite entre ${planLimits.min} y ${planLimits.max} condominios`
          );
          set({ loading: false });
          return false;
        }
      }

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
          businessName: currentClient.businessName,
          fullFiscalAddress: currentClient.fullFiscalAddress,
          taxRegime: currentClient.taxRegime,
          businessActivity: currentClient.businessActivity,
          condominiumLimit: currentClient.condominiumLimit,
          // Propiedades adicionales
          phoneNumber: currentClient.phoneNumber,
          address: currentClient.address,
          cfdiUse: currentClient.cfdiUse,
          responsiblePersonName: currentClient.responsiblePersonName,
          responsiblePersonPosition: currentClient.responsiblePersonPosition,
          billingFrequency: currentClient.billingFrequency,
          hasMaintenanceApp: currentClient.hasMaintenanceApp,
        }
      );

      if (result && result.success) {
        toast.success("Cliente actualizado con éxito");
        set({ loading: false });
        return true;
      } else {
        toast.error(result?.message || "No se pudo actualizar el cliente");
        set({ loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Error al actualizar cliente:", error);
      toast.error(
        `Error al actualizar la información del cliente: ${error.message || ""}`
      );
      set({ loading: false });
      return false;
    }
  },

  // Actualizar condominio existente
  updateCondominium: async () => {
    const { currentCondominium, currentClient } = get();
    if (!currentCondominium) {
      toast.error("No hay condominio seleccionado para editar");
      return false;
    }

    if (!currentCondominium.id) {
      toast.error("Error: Intentando actualizar un condominio sin ID");
      return false;
    }

    if (!currentClient || !currentClient.id) {
      toast.error("Error: No hay un cliente asociado al condominio");
      return false;
    }

    set({ updatingCondominium: true });

    try {
      const payload = {
        clientId: currentClient.id,
        name: currentCondominium.name,
        address: currentCondominium.address,
        plan: currentCondominium.plan,
        proFunctions: currentCondominium.proFunctions || [],
        status: currentCondominium.status,
        condominiumLimit: Number(currentCondominium.condominiumLimit || 1),
      };

      // Intento primario: Cloud Function de super admin
      try {
        const result = await executeSuperAdminOperation(
          "update_condominium",
          currentCondominium.id,
          payload
        );

        if (result && result.success) {
          toast.success("Condominio actualizado con éxito");
          set({ updatingCondominium: false, currentCondominium: null });
          return true;
        }
      } catch (operationError: any) {
        const message = String(operationError?.message || "");
        if (!message.includes("Operación no soportada: update_condominium")) {
          throw operationError;
        }
      }

      // Fallback: actualización directa si backend aún no soporta update_condominium
      const condominiumRef = doc(
        db,
        `clients/${currentClient.id}/condominiums/${currentCondominium.id}`
      );
      await updateDoc(condominiumRef, {
        name: payload.name,
        address: payload.address,
        plan: payload.plan || "Basic",
        proFunctions: payload.proFunctions,
        status: payload.status || CondominiumStatus.Pending,
        condominiumLimit: payload.condominiumLimit,
      });

      toast.success("Condominio actualizado con éxito");
      set({ updatingCondominium: false, currentCondominium: null });
      return true;
    } catch (error: any) {
      console.error("Error al actualizar condominio:", error);
      toast.error(`Error al actualizar el condominio: ${error.message || ""}`);
      set({ updatingCondominium: false });
      return false;
    }
  },

  // Crear nuevo condominio
  createCondominium: async () => {
    const { currentClient, condominiumForm } = get();
    if (!currentClient) {
      toast.error("No hay cliente seleccionado para agregar condominio");
      return false;
    }

    if (!currentClient.id) {
      toast.error("Error: Cliente sin ID válido para asociar condominio");
      return false;
    }

    if (!condominiumForm.name || !condominiumForm.address) {
      toast.error("Debes proporcionar el nombre y dirección del condominio");
      return false;
    }

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
            plan: condominiumForm.plan || "Free",
            proFunctions: condominiumForm.proFunctions || [],
            status: condominiumForm.status || CondominiumStatus.Pending,
            condominiumLimit: condominiumForm.condominiumLimit || 1,
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
      toast.error(`Error al agregar el condominio: ${error.message || ""}`);
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
