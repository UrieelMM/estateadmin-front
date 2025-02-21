import { create } from 'zustand';
import { getAuth, getIdTokenResult } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type Config = {
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  RFC: string;
  country: string;
  logoUrl?: string;
  signatureUrl?: string;
  logo?: string;
};

type ConfigState = {
  config: Config | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (
    data: Partial<Config>,
    logoFile?: File,
    signatureFile?: File
  ) => Promise<void>;
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");
      const db = getFirestore();
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Config;
        // Asignamos logo usando el logoUrl recibido desde Firestore
        data.logo = data.logoUrl;
        set({ config: data, loading: false });
      } else {
        throw new Error("No se encontró la configuración");
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateConfig: async (data, logoFile, signatureFile) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();
      const storage = getStorage();

      let logoUrl = data.logoUrl;
      let signatureUrl = data.signatureUrl;

      // Subir logo si se proporcionó
      if (logoFile) {
        const logoRef = ref(storage, `clients/${clientId}/clientAssets/logo_${Date.now()}_${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }
      // Subir firma si se proporcionó
      if (signatureFile) {
        const signatureRef = ref(storage, `clients/${clientId}/clientAssets/signature_${Date.now()}_${signatureFile.name}`);
        await uploadBytes(signatureRef, signatureFile);
        signatureUrl = await getDownloadURL(signatureRef);
      }

      // Solo se incluyen los campos si tienen valor (no undefined)
      const updateData: Partial<Config> = {
        ...data,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(signatureUrl !== undefined ? { signatureUrl } : {}),
      };

      const docRef = doc(db, 'clients', clientId);
      await updateDoc(docRef, updateData);
      set({ loading: false });
      // Recargar la configuración actualizada
      await get().fetchConfig();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
