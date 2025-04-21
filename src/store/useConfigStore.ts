import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as Sentry from "@sentry/react";

/** Config general en clients/{clientId}. (Incluyendo darkMode) */
export type Config = {
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  RFC: string;
  country: string;
  logoUrl?: string;
  signatureUrl?: string;
  logo?: string; // Derivado de logoUrl para la UI
  logoReports?: string;
  darkMode?: boolean;
};

/** Información del mensaje de pago para clientes */
export interface PaymentMessageInfo {
  bankAccount: string;
  bankName: string;
  dueDay: number;
  paymentMessage: string;
  updatedAt: Date;
}

type ConfigState = {
  config: Config | null;
  paymentMessageInfo: PaymentMessageInfo | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (
    data: Partial<Config> & { darkMode?: boolean },
    logoFile?: File,
    signatureFile?: File,
    logoReportsFile?: File
  ) => Promise<void>;
  updatePaymentMessageInfo: (data: Omit<PaymentMessageInfo, "updatedAt">) => Promise<void>;
  fetchPaymentMessageInfo: () => Promise<void>;
};

export const useConfigStore = create<ConfigState>()((set, get) => ({
  config: null,
  paymentMessageInfo: null,
  loading: false,
  error: null,

  /**
   * 1) Lee la config general de `clients/{clientId}`.
   * 2) Busca el doc del usuario por email en `clients/{clientId}/condominiums/{condominiumId}/users`.
   * 3) (Opcional) Lee darkMode de ese documento.
   */
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      // Obtenemos condominiumId de localStorage
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();

      // (A) Lee config en clients/{clientId}
      const configDocRef = doc(db, "clients", clientId);
      const configDocSnap = await getDoc(configDocRef);
      if (!configDocSnap.exists()) {
        throw new Error("No se encontró la configuración general");
      }
      const data = configDocSnap.data() as Config;
      // Derivamos logo
      data.logo = data.logoUrl;

      // (B) Buscar el doc del usuario por email
      const userCollRef = collection(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "users"
      );
      const allDocs = await getDocs(userCollRef);
      const userDoc = allDocs.docs.find(
        (doc) => doc.data().email.toLowerCase() === user.email?.toLowerCase()
      );

      if (!userDoc) {
        throw new Error(
          "No existe un usuario en la subcolección con ese email."
        );
      }

      // Actualizamos el state
      set({ config: data, loading: false });
    } catch (err: any) {
      Sentry.captureException(err);
      set({ error: err.message, loading: false });
    }
  },

  /**
   * 1) Actualiza la config general en `clients/{clientId}` (sin darkMode).
   * 2) Elimina darkMode del doc principal si existía.
   * 3) Localiza el doc del usuario (por email) en la subcolección y guarda `darkMode`.
   */
  updateConfig: async (data, logoFile, signatureFile, logoReportsFile) => {
    set({ loading: true, error: null });
    try {
      // Obtenemos condominiumId
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();
      const storage = getStorage();

      // Manejamos posibles uploads
      let logoUrl = data.logoUrl;
      let signatureUrl = data.signatureUrl;
      let logoReportsUrl = data.logoReports;

      if (logoFile) {
        const logoRef = ref(
          storage,
          `clients/${clientId}/clientAssets/logo_${Date.now()}_${logoFile.name}`
        );
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }
      if (signatureFile) {
        const signatureRef = ref(
          storage,
          `clients/${clientId}/clientAssets/signature_${Date.now()}_${
            signatureFile.name
          }`
        );
        await uploadBytes(signatureRef, signatureFile);
        signatureUrl = await getDownloadURL(signatureRef);
      }
      if (logoReportsFile) {
        const logoReportsRef = ref(
          storage,
          `clients/${clientId}/clientAssets/logoReports_${Date.now()}_${
            logoReportsFile.name
          }`
        );
        await uploadBytes(logoReportsRef, logoReportsFile);
        logoReportsUrl = await getDownloadURL(logoReportsRef);
      }

      // Preparamos update para `clients/{clientId}`
      const updateData: Partial<Config> = {
        ...data,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(signatureUrl !== undefined ? { signatureUrl } : {}),
        ...(logoReportsUrl !== undefined
          ? { logoReports: logoReportsUrl }
          : {}),
      };

      // Actualizamos config
      const configDocRef = doc(db, "clients", clientId);
      await updateDoc(configDocRef, updateData);

      // Éxito: recargar config general
      set({ loading: false });
      await get().fetchConfig();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
      throw err;
    }
  },

  /**
   * Actualiza la información del mensaje de pago en una nueva colección en Firestore
   * Estos datos se guardan en clients/{clientId}/condominiums/{condominiumId}/paymentMessageInfo/config
   */
  updatePaymentMessageInfo: async (data) => {
    set({ loading: true, error: null });
    try {
      // Obtenemos condominiumId
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();
      
      // Preparamos los datos con la fecha de actualización
      const paymentMessageData: PaymentMessageInfo = {
        ...data,
        updatedAt: new Date()
      };

      // Guardamos en la colección paymentMessageInfo
      const paymentMsgDocRef = doc(
        db, 
        "clients", 
        clientId, 
        "condominiums", 
        condominiumId, 
        "paymentMessageInfo", 
        "config"
      );
      
      await setDoc(paymentMsgDocRef, paymentMessageData);

      // Actualizamos el estado local
      set({ 
        paymentMessageInfo: paymentMessageData, 
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
      throw err;
    }
  },

  /**
   * Obtiene la información del mensaje de pago desde Firestore
   * Estos datos se leen de clients/{clientId}/condominiums/{condominiumId}/paymentMessageInfo/config
   */
  fetchPaymentMessageInfo: async () => {
    set({ loading: true, error: null });
    try {
      // Obtenemos condominiumId
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();
      
      // Leemos el documento de la colección paymentMessageInfo
      const paymentMsgDocRef = doc(
        db, 
        "clients", 
        clientId, 
        "condominiums", 
        condominiumId, 
        "paymentMessageInfo", 
        "config"
      );
      
      const docSnap = await getDoc(paymentMsgDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentMessageInfo;
        // Aseguramos que updatedAt sea un objeto Date
        if (data.updatedAt && typeof data.updatedAt !== 'object') {
          data.updatedAt = (data.updatedAt as any).toDate();
        }
        set({ paymentMessageInfo: data, loading: false });
      } else {
        // Si no existe, establecemos un valor por defecto
        const defaultPaymentInfo: PaymentMessageInfo = {
          bankAccount: "",
          bankName: "",
          dueDay: 10,
          paymentMessage: "",
          updatedAt: new Date()
        };
        set({ paymentMessageInfo: defaultPaymentInfo, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
    }
  },
}));
