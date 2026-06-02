import { create } from "../createStore";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { executeSuperAdminOperation } from "../../services/superAdminService";
import toast from "react-hot-toast";
import { CondominiumStatus } from "../../presentation/components/superAdmin/NewClientForm";

// Constantes de cálculo de pricing alineadas con NewClientForm.tsx,
// ClientEditModal.tsx (pestaña Agregar Condominio) y CondominiumEditModal.tsx.
// Mantener sincronizadas en los 4 lugares.
const PLAN_BASE = 499;
const COST_PER_UNIT = 4.0;
const IVA_RATE = 0.16;
const MIN_PRICING_UNITS = 20;

const computePricingFromUnits = (
  unitsRaw: number | string | undefined | null,
): { pricing: number; pricingWithoutTax: number; units: number } => {
  const parsed = parseInt(String(unitsRaw ?? ""), 10);
  const units =
    !isNaN(parsed) && parsed > 0 ? parsed : MIN_PRICING_UNITS;
  const sub = PLAN_BASE + units * COST_PER_UNIT;
  const pricing = Math.round(sub * (1 + IVA_RATE) * 100) / 100;
  const pricingWithoutTax = Math.round(sub * 100) / 100;
  return { pricing, pricingWithoutTax, units };
};

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
  CP?: string;
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
  pricing?: number;
  condominiumManager?: string;
  // Estado del cupón / pago inicial (a nivel cliente).
  coupon?: string;
  couponStatus?: string;
  couponType?: string;
  couponCreatedAt?: any;
  couponRedeemedAt?: any;
  initialSetupPaymentBypassed?: boolean;
  initialSetupPaymentPending?: boolean;
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
  CP?: string;
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
  pricing?: number;
  condominiumManager?: string;
  // Estado del cupón / bypass de pago inicial. Se exponen para que el modal
  // de edición pueda mostrar el cupón actual y asignar un cupón de rescate
  // cuando aplica.
  coupon?: string;
  couponStatus?: string;
  couponType?: string;
  couponCreatedAt?: any;
  couponRedeemedAt?: any;
  initialSetupPaymentBypassed?: boolean;
  initialSetupPaymentPending?: boolean;
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
  condominiumManager?: string;
  hasMaintenanceApp?: boolean;
  maintenanceAppContractedAt?: string | null;
  coupon?: string;
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
  // Asigna un cupón "de rescate" al cliente actual (o a un condominio
  // específico de ese cliente) y persiste en backend. El cupón queda
  // `active` y debe ser redimido manualmente por el administrador.
  assignRescueCoupon: (params: {
    coupon: string;
    condominiumId?: string;
  }) => Promise<boolean>;
  // Sincroniza permisos de administradores con todos los condominios del
  // cliente. Útil para regularizar clientes creados antes del fix de
  // propagación automática.
  syncAdminCondominiums: () => Promise<boolean>;
  setCredentials: (credentials: ClientCredentials | null) => void;
}

const initialCondominiumForm: CondominiumFormData = {
  name: "",
  address: "",
  plan: "Free",
  proFunctions: [],
  status: CondominiumStatus.Pending,
  condominiumManager: "",
  hasMaintenanceApp: false,
  maintenanceAppContractedAt: null,
  coupon: "",
};

const db = getFirestore();

const toIsoDateString = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    const converted = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
  }

  return null;
};

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
        CP: client.CP || "",
        taxRegime: client.taxRegime || "",
        businessActivity: client.businessActivity || "",
        condominiumLimit: client.condominiumLimit || 50,
        phoneNumber: client.phoneNumber || "",
        address: client.address || "",
        cfdiUse: client.cfdiUse || "",
        responsiblePersonName: client.responsiblePersonName || "",
        responsiblePersonPosition: client.responsiblePersonPosition || "",
        billingFrequency: client.billingFrequency || "monthly",
        pricing: client.pricing,
        condominiumManager: client.condominiumManager || "",
        // Estado del cupón / pago inicial (para mostrar y manejar el cupón
        // de rescate en el modal de edición).
        coupon: (client as any).coupon || "",
        couponStatus: (client as any).couponStatus || "",
        couponType: (client as any).couponType || "",
        couponCreatedAt: (client as any).couponCreatedAt || null,
        couponRedeemedAt: (client as any).couponRedeemedAt || null,
        initialSetupPaymentBypassed: Boolean(
          (client as any).initialSetupPaymentBypassed,
        ),
        initialSetupPaymentPending: Boolean(
          (client as any).initialSetupPaymentPending,
        ),
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
        hasMaintenanceApp: Boolean(condominium.hasMaintenanceApp),
        maintenanceAppContractedAt: toIsoDateString(
          condominium.maintenanceAppContractedAt
        ),
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
          pricing: currentClient.pricing,
          businessName: currentClient.businessName,
          fullFiscalAddress: currentClient.fullFiscalAddress,
          CP: currentClient.CP,
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
          condominiumManager: currentClient.condominiumManager,
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
      const hasMaintenanceApp = Boolean(currentCondominium.hasMaintenanceApp);
      const maintenanceAppContractedAt = hasMaintenanceApp
        ? toIsoDateString(currentCondominium.maintenanceAppContractedAt) ||
          new Date().toISOString()
        : null;

      // Recalculamos pricing a partir de las unidades, igual que al crear
      // un condominio nuevo. Esto mantiene `pricing` y `pricingWithoutTax`
      // coherentes con la calculadora del formulario de edición.
      const {
        pricing: resolvedPricing,
        pricingWithoutTax: resolvedPricingWithoutTax,
        units: resolvedUnits,
      } = computePricingFromUnits(
        currentCondominium.plan ?? currentCondominium.condominiumLimit,
      );

      const payload = {
        clientId: currentClient.id,
        name: currentCondominium.name,
        address: currentCondominium.address,
        plan: String(resolvedUnits),
        pricing: resolvedPricing,
        pricingWithoutTax: resolvedPricingWithoutTax,
        proFunctions: currentCondominium.proFunctions || [],
        status: currentCondominium.status,
        condominiumLimit: resolvedUnits,
        hasMaintenanceApp,
        maintenanceAppContractedAt,
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
        plan: payload.plan,
        pricing: payload.pricing,
        pricingWithoutTax: payload.pricingWithoutTax,
        proFunctions: payload.proFunctions,
        status: payload.status || CondominiumStatus.Pending,
        condominiumLimit: payload.condominiumLimit,
        hasMaintenanceApp: payload.hasMaintenanceApp,
        maintenanceAppContractedAt: payload.hasMaintenanceApp
          ? payload.maintenanceAppContractedAt
            ? new Date(payload.maintenanceAppContractedAt)
            : serverTimestamp()
          : null,
        updatedAt: serverTimestamp(),
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

  // Asigna un cupón de rescate al cliente actual (o a un condominio
  // específico de ese cliente). Caso de uso: clientes que se crearon antes
  // de la implementación de cupones o que se quedaron atorados en el paso
  // de pago inicial.
  assignRescueCoupon: async ({ coupon, condominiumId }) => {
    const { currentClient } = get();
    if (!currentClient || !currentClient.id) {
      toast.error("No hay cliente seleccionado.");
      return false;
    }

    const normalizedCoupon = String(coupon || "").trim().toUpperCase();
    if (normalizedCoupon.length < 8) {
      toast.error("El cupón debe tener al menos 8 caracteres.");
      return false;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error("Tu sesión de super admin no está disponible.");
        return false;
      }
      const idToken = await user.getIdToken();

      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/assign-rescue-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            clientId: currentClient.id,
            coupon: normalizedCoupon,
            ...(condominiumId ? { condominiumId } : {}),
          }),
        },
      );

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          responseData?.message || "No se pudo asignar el cupón de rescate.",
        );
        return false;
      }

      toast.success(
        responseData?.message ||
          "Cupón de rescate asignado. El administrador podrá redimirlo desde su dashboard.",
      );

      // Reflejar el cambio en el state local del cliente para que el modal
      // muestre de inmediato el cupón activo. Solo aplica al alcance cliente,
      // ya que el alcance condominio se refresca al recargar la lista.
      if (!condominiumId) {
        set({
          currentClient: {
            ...currentClient,
            coupon: normalizedCoupon,
            couponStatus: "active",
            couponType: "rescue",
            couponRedeemedAt: null,
            initialSetupPaymentBypassed: false,
          },
        });
      }

      return true;
    } catch (error: any) {
      console.error("Error al asignar cupón de rescate:", error);
      toast.error(
        `Error al asignar el cupón de rescate: ${error.message || ""}`,
      );
      return false;
    }
  },

  // Sincroniza permisos de administradores con todos los condominios del
  // cliente actual. Llama al endpoint sync-admin-condominiums.
  syncAdminCondominiums: async () => {
    const { currentClient } = get();
    if (!currentClient || !currentClient.id) {
      toast.error("No hay cliente seleccionado.");
      return false;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error("Tu sesión de super admin no está disponible.");
        return false;
      }
      const idToken = await user.getIdToken();

      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/sync-admin-condominiums`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ clientId: currentClient.id }),
        },
      );

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          responseData?.message ||
            "No se pudo sincronizar los permisos de administradores.",
        );
        return false;
      }

      toast.success(
        responseData?.message ||
          "Permisos de administradores sincronizados con éxito.",
      );
      return true;
    } catch (error: any) {
      console.error("Error al sincronizar permisos de admins:", error);
      toast.error(
        `Error al sincronizar permisos: ${error.message || ""}`,
      );
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

    const normalizedCoupon = String(condominiumForm.coupon || "")
      .trim()
      .toUpperCase();
    if (normalizedCoupon && normalizedCoupon.length < 8) {
      toast.error("El cupón debe tener al menos 8 caracteres.");
      return false;
    }

    set({ addingCondominium: true });

    try {
      const hasMaintenanceApp = Boolean(condominiumForm.hasMaintenanceApp);
      const maintenanceAppContractedAt = hasMaintenanceApp
        ? toIsoDateString(condominiumForm.maintenanceAppContractedAt) ||
          new Date().toISOString()
        : null;

      // El plan ahora representa el número de unidades contratadas. A partir
      // de ese número derivamos pricing (total con IVA) y pricingWithoutTax
      // (subtotal). El backend usa estos campos para generar la factura
      // inicial — sin ellos llegan null y la factura queda incompleta.
      const { pricing, pricingWithoutTax, units: resolvedUnits } =
        computePricingFromUnits(
          condominiumForm.plan ?? condominiumForm.condominiumLimit,
        );
      const resolvedPlan = String(resolvedUnits);

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
            plan: resolvedPlan,
            pricing,
            pricingWithoutTax,
            proFunctions: condominiumForm.proFunctions || [],
            status: condominiumForm.status || CondominiumStatus.Pending,
            condominiumLimit: resolvedUnits,
            condominiumManager: condominiumForm.condominiumManager || "",
            hasMaintenanceApp,
            maintenanceAppContractedAt,
            ...(normalizedCoupon ? { coupon: normalizedCoupon } : {}),
          }),
        }
      );

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success("Condominio agregado con éxito");
        if (responseData?.billing?.message) {
          toast.success(responseData.billing.message, { duration: 5000 });
        }
        // Limpiar formulario
        set({
          condominiumForm: initialCondominiumForm,
          addingCondominium: false,
        });
        return true;
      } else {
        toast.error(
          responseData?.message || "No se pudo agregar el condominio"
        );
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
