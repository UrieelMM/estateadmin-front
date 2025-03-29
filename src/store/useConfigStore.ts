import { create } from "zustand";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteField,
  collection,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as Sentry from "@sentry/react";

/** Config general en clients/{clientId}. (Sin incluir darkMode) */
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
};

type ConfigState = {
  config: Config | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (
    data: Partial<Config> & { darkMode?: boolean },
    logoFile?: File,
    signatureFile?: File,
    logoReportsFile?: File
  ) => Promise<void>;
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
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

      // Separamos darkMode
      const { darkMode, ...generalData } = data;

      // Manejamos posibles uploads
      let logoUrl = generalData.logoUrl;
      let signatureUrl = generalData.signatureUrl;
      let logoReportsUrl = generalData.logoReports;

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
      const updateData: Partial<Config> & { darkMode?: any } = {
        ...generalData,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(signatureUrl !== undefined ? { signatureUrl } : {}),
        ...(logoReportsUrl !== undefined
          ? { logoReports: logoReportsUrl }
          : {}),
        darkMode: deleteField(),
        // Elimina darkMode del doc principal si existía
      };

      // (A) Actualizamos config
      const configDocRef = doc(db, "clients", clientId);
      await updateDoc(configDocRef, updateData);

      // (B) Actualizar darkMode en el doc del usuario en la subcolección,
      // SI Y SOLO SI 'darkMode' es boolean
      if (typeof darkMode === "boolean") {
        // 1) Localizar el doc del usuario por email
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

        // 2) Actualizamos el darkMode en ese doc
        await setDoc(userDoc.ref, { darkMode }, { merge: true });
      }

      // Éxito: recargar config general
      set({ loading: false });
      await get().fetchConfig();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      Sentry.captureException(err);
      throw err;
    }
  },
}));
