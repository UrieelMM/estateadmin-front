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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as Sentry from "@sentry/react";

/** Config general en clients/{clientId}. (Incluyendo darkMode) */
export type Config = {
  companyName: string;
  businessName?: string;
  email: string;
  phoneNumber: string;
  address: string;
  fullFiscalAddress?: string;
  RFC: string;
  country: string;
  businessActivity?: string;
  logoUrl?: string;
  signatureUrl?: string;
  logo?: string; // Derivado de logoUrl para la UI
  logoReports?: string;
  darkMode?: boolean;
  hasMaintenanceApp?: boolean;
};

/** Información del mensaje de pago para clientes */
export interface PaymentMessageInfo {
  bankAccount: string;
  bankName: string;
  dueDay: number;
  paymentMessage: string;
  updatedAt: Date;
}

/** Información de un documento público */
export interface PublicDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  description?: string;
  fileName?: string;
}

type ConfigState = {
  config: Config | null;
  paymentMessageInfo: PaymentMessageInfo | null;
  publicDocuments: Record<string, PublicDocument>;
  loading: boolean;
  uploading: Record<string, boolean>;
  error: string | null;
  hasMaintenanceApp: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (
    data: Partial<Config> & { darkMode?: boolean },
    logoFile?: File,
    signatureFile?: File,
    logoReportsFile?: File
  ) => Promise<void>;
  updatePaymentMessageInfo: (
    data: Omit<PaymentMessageInfo, "updatedAt">
  ) => Promise<void>;
  fetchPaymentMessageInfo: () => Promise<void>;
  fetchPublicDocuments: () => Promise<void>;
  uploadPublicDocument: (
    documentId: string,
    file: File,
    documentName: string,
    description?: string
  ) => Promise<void>;
  deletePublicDocument: (documentId: string) => Promise<void>;
  checkMaintenanceAppAccess: () => Promise<boolean>;
};

export const useConfigStore = create<ConfigState>()((set, get) => ({
  config: null,
  paymentMessageInfo: null,
  publicDocuments: {},
  loading: false,
  uploading: {},
  error: null,
  hasMaintenanceApp: false,

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

      // Actualizamos el state incluyendo hasMaintenanceApp
      set({ 
        config: data, 
        hasMaintenanceApp: data.hasMaintenanceApp || false,
        loading: false 
      });
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
        updatedAt: new Date(),
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
        loading: false,
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
        if (data.updatedAt && typeof data.updatedAt !== "object") {
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
          updatedAt: new Date(),
        };
        set({ paymentMessageInfo: defaultPaymentInfo, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
    }
  },

  /**
   * Obtiene los documentos públicos almacenados en Firestore
   * Estos datos se leen de clients/{clientId}/condominiums/{condominiumId}/publicDocuments/config
   */
  fetchPublicDocuments: async () => {
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

      // Leemos el documento de la colección publicDocuments
      const publicDocsRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "publicDocuments",
        "config"
      );

      const docSnap = await getDoc(publicDocsRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, PublicDocument>;

        // Aseguramos que uploadedAt sea un objeto Date en cada documento
        Object.keys(data).forEach((key) => {
          if (
            data[key].uploadedAt &&
            typeof data[key].uploadedAt !== "object"
          ) {
            data[key].uploadedAt = (data[key].uploadedAt as any).toDate();
          }
          // Extraer el nombre del archivo de la URL si existe
          if (data[key].fileUrl && !data[key].fileName) {
            const urlParts =
              data[key].fileUrl.split("/").pop()?.split("_") || [];
            if (urlParts.length > 2) {
              data[key].fileName = urlParts.slice(2).join("_");
            }
          }
        });

        set({ publicDocuments: data, loading: false });
      } else {
        // Si no existe, establecemos un objeto vacío
        set({ publicDocuments: {}, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
    }
  },

  /**
   * Sube un documento público a Firebase Storage y guarda su referencia en Firestore
   * @param documentId Identificador único del tipo de documento
   * @param file Archivo a subir
   * @param documentName Nombre para mostrar del documento
   * @param description Descripción opcional del documento
   */
  uploadPublicDocument: async (documentId, file, documentName, description) => {
    set((state) => ({
      uploading: { ...state.uploading, [documentId]: true },
      error: null,
    }));
    try {
      // Obtenemos condominiumId
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", uploading: {} });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const storage = getStorage();
      const db = getFirestore();

      // Crear referencia al archivo en Storage
      const fileRef = ref(
        storage,
        `clients/${clientId}/condominiums/${condominiumId}/publicDocuments/${documentId}_${Date.now()}_${
          file.name
        }`
      );

      // Subir archivo
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      // Preparar datos del documento
      const docInfo: PublicDocument = {
        id: documentId,
        name: documentName,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date(),
        description,
        fileName: file.name,
      };

      // Obtener documento actual o crear uno nuevo
      const docRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "publicDocuments",
        "config"
      );

      const docSnap = await getDoc(docRef);
      let currentData: Record<string, PublicDocument> = {};

      if (docSnap.exists()) {
        currentData = docSnap.data() as Record<string, PublicDocument>;

        // Si ya existe un documento con este ID, intentar eliminar el archivo anterior
        if (currentData[documentId] && currentData[documentId].fileUrl) {
          try {
            const oldFileRef = ref(storage, currentData[documentId].fileUrl);
            await deleteObject(oldFileRef);
          } catch (error) {
            console.warn("Error al eliminar archivo anterior:", error);
            // Continuamos aunque falle la eliminación del archivo anterior
          }
        }
      }

      // Actualizar datos
      currentData[documentId] = docInfo;

      // Guardar en Firestore
      if (docSnap.exists()) {
        await updateDoc(docRef, currentData);
      } else {
        await setDoc(docRef, currentData);
      }

      // Actualizar estado local
      set((state) => ({
        publicDocuments: {
          ...state.publicDocuments,
          [documentId]: docInfo,
        },
        uploading: { ...state.uploading, [documentId]: false },
      }));
    } catch (err: any) {
      set((state) => ({
        error: err.message,
        uploading: { ...state.uploading, [documentId]: false },
      }));
      Sentry.captureException(err);
      throw err;
    }
  },

  /**
   * Elimina un documento público de Firebase Storage y su referencia en Firestore
   * @param documentId Identificador único del documento a eliminar
   */
  deletePublicDocument: async (documentId) => {
    set((state) => ({
      uploading: { ...state.uploading, [documentId]: true },
      error: null,
    }));
    try {
      // Verificar que exista el documento
      const currentDocs = get().publicDocuments;
      if (!currentDocs[documentId]?.fileUrl) {
        set({ uploading: {} });
        return;
      }

      // Obtenemos condominiumId
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", uploading: {} });
        return;
      }

      // Obtenemos user y clientId
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const storage = getStorage();
      const db = getFirestore();

      // Eliminar archivo de Storage
      try {
        const fileRef = ref(storage, currentDocs[documentId].fileUrl);
        await deleteObject(fileRef);
      } catch (error) {
        console.warn("Error al eliminar archivo de Storage:", error);
        // Continuamos aunque falle la eliminación del archivo
      }

      // Actualizar documento en Firestore
      const docRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "publicDocuments",
        "config"
      );

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, PublicDocument>;

        if (data[documentId]) {
          // Mantener el documento pero limpiar la información del archivo
          data[documentId] = {
            ...data[documentId],
            fileUrl: "",
            fileType: "",
            fileSize: 0,
            uploadedAt: new Date(),
            fileName: "",
          };

          await updateDoc(docRef, data);

          // Actualizar estado local
          set((state) => ({
            publicDocuments: {
              ...state.publicDocuments,
              [documentId]: data[documentId],
            },
            uploading: { ...state.uploading, [documentId]: false },
          }));
        }
      }
    } catch (err: any) {
      set((state) => ({
        error: err.message,
        uploading: { ...state.uploading, [documentId]: false },
      }));
      Sentry.captureException(err);
      throw err;
    }
  },

  /**
   * Verifica si el cliente tiene acceso a la App de Mantenimiento
   * Lee el campo hasMaintenanceApp de clients/{clientId}
   */
  checkMaintenanceAppAccess: async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return false;

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) return false;

      const db = getFirestore();
      const configDocRef = doc(db, "clients", clientId);
      const configDocSnap = await getDoc(configDocRef);
      
      if (!configDocSnap.exists()) return false;
      
      const data = configDocSnap.data();
      const hasAccess = data.hasMaintenanceApp || false;
      
      set({ hasMaintenanceApp: hasAccess });
      return hasAccess;
    } catch (err: any) {
      Sentry.captureException(err);
      return false;
    }
  },
}));
