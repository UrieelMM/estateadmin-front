import { create } from "zustand";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

export interface CondominiumInfo {
  name: string;
  address: string;
}

export interface NewCustomerInfo {
  name: string;
  lastName: string;
  email: string;
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
  condominiumInfo: CondominiumInfo;
  photoURL?: string;
  plan?: string;
  cfdiUse?: string;
  billingFrequency?: string;
  recordId?: string;
  formId?: string;
  registrationDate?: string;
}

export interface FormUrlInfo {
  formId: string;
  active: boolean;
  createdAt: string;
  expirationDate: string;
  customerInfoId?: string;
  status: "pending" | "used" | "expired";
  usedAt?: string;
  lastUpdated?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface FormExpirationResponse {
  expired: boolean;
  formId: string;
  message: string;
  expirationDate?: string;
  daysRemaining?: number;
}

interface NewCustomerFormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  generatedLink: string | null;
  formId: string | null;
  formExpiration: FormExpirationResponse | null;

  // Acciones
  generateNewForm: () => Promise<string>;
  generateFormUrl: (formId: string) => Promise<boolean>;
  checkFormExpiration: (formId: string) => Promise<FormExpirationResponse>;
  submitCustomerInfo: (
    formId: string,
    customerInfo: NewCustomerInfo
  ) => Promise<boolean>;
  fetchCustomerInformation: (
    page: number,
    perPage: number
  ) => Promise<PaginatedResult<NewCustomerInfo>>;
  fetchFormUrls: (
    page: number,
    perPage: number
  ) => Promise<PaginatedResult<FormUrlInfo>>;
  clearState: () => void;
}

const useNewCustomerFormStore = create<NewCustomerFormState>((set, _get) => ({
  isLoading: false,
  error: null,
  success: false,
  generatedLink: null,
  formId: null,
  formExpiration: null,

  // 1. Generar un nuevo formulario (genera el ID y llama a generateFormUrl)
  generateNewForm: async () => {
    set({ isLoading: true, error: null, success: false });
    try {
      // Generar un UUID único para el formulario
      const formId = uuidv4();

      // Llamar a la función que envía el ID al backend
      const success = await _get().generateFormUrl(formId);

      if (success) {
        return formId;
      } else {
        throw new Error("No se pudo generar el formulario");
      }
    } catch (error) {
      console.error("Error al generar el formulario:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        success: false,
      });
      toast.error("Error al generar el formulario");
      return "";
    }
  },

  // 2. Enviar el ID al backend para registrar el formulario
  generateFormUrl: async (formId: string) => {
    try {
      // Enviar el ID del formulario al endpoint correspondiente
      const response = await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/tools/generate-form-url`,
        {
          formId,
          registrationDate: new Date().toISOString(),
        }
      );

      if (response.data) {
        // Crear el enlace para compartir con el cliente
        const generatedLink = `${window.location.origin}/nuevo-cliente/${formId}`;

        set({
          isLoading: false,
          success: true,
          formId,
          generatedLink,
        });

        toast.success("Formulario generado con éxito");
        return true;
      } else {
        throw new Error("Error al registrar el formulario en el servidor");
      }
    } catch (error) {
      console.error("Error al registrar el formulario:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        success: false,
      });
      return false;
    }
  },

  // 3. Verificar si un formulario ha expirado
  checkFormExpiration: async (formId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_URL_SERVER
        }/tools/check-form-expiration?formId=${formId}`
      );
      set({
        isLoading: false,
        formExpiration: response.data,
      });
      return response.data;
    } catch (error) {
      console.error("Error al verificar expiración del formulario:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      throw error;
    }
  },

  // 4. Enviar la información del cliente cuando completa el formulario
  submitCustomerInfo: async (formId: string, customerInfo: NewCustomerInfo) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_URL_SERVER
        }/tools/new-customer-information/${formId}`,
        customerInfo
      );

      if (response.data) {
        set({ isLoading: false, success: true });
        toast.success("Información enviada con éxito");
        return true;
      } else {
        throw new Error("No se pudo enviar la información");
      }
    } catch (error) {
      console.error("Error al enviar la información:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        success: false,
      });
      toast.error("Error al enviar la información");
      return false;
    }
  },

  // 5. Obtener información de clientes con paginación
  fetchCustomerInformation: async (page: number, perPage: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL_SERVER}/tools/customer-information`,
        {
          params: {
            page,
            perPage,
          },
        }
      );

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error("Error al obtener información de clientes:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      toast.error("Error al cargar información de clientes");
      // Devolver un objeto vacío para evitar errores
      return {
        data: [],
        total: 0,
        page: 1,
        perPage,
        totalPages: 0,
      };
    }
  },

  // 6. Obtener URLs de formularios con paginación
  fetchFormUrls: async (page: number, perPage: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL_SERVER}/tools/form-urls`,
        {
          params: {
            page,
            perPage,
          },
        }
      );

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error("Error al obtener URLs de formularios:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      toast.error("Error al cargar URLs de formularios");
      // Devolver un objeto vacío para evitar errores
      return {
        data: [],
        total: 0,
        page: 1,
        perPage,
        totalPages: 0,
      };
    }
  },

  clearState: () => {
    set({
      isLoading: false,
      error: null,
      success: false,
      generatedLink: null,
      formId: null,
      formExpiration: null,
    });
  },
}));

export default useNewCustomerFormStore;
