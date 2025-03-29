import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getFirestore,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

export interface Provider {
  id: string;
  name: string;
  service: string;
  serviceLabel: string;
  phone?: string;
  email?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderStore {
  providers: Provider[];
  filteredProviders: Provider[];
  loading: boolean;
  error: string | null;
  selectedProvider: Provider | null;
  searchTerm: string;
  fetchProviders: () => Promise<void>;
  addProvider: (
    provider: Omit<Provider, "id" | "createdAt" | "updatedAt">
  ) => Promise<boolean>;
  updateProvider: (id: string, provider: Partial<Provider>) => Promise<boolean>;
  deleteProvider: (id: string) => Promise<boolean>;
  setSelectedProvider: (provider: Provider | null) => void;
  searchProviders: (term: string) => void;
}

const useProviderStore = create<ProviderStore>((set, get) => ({
  providers: [],
  filteredProviders: [],
  loading: false,
  error: null,
  selectedProvider: null,
  searchTerm: "",

  fetchProviders: async () => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const providersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/providersList`
      );

      const snapshot = await getDocs(providersRef);
      const providers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Provider[];

      set({
        providers,
        filteredProviders: providers,
        searchTerm: "",
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addProvider: async (provider) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const providersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/providersList`
      );

      const newProvider = {
        ...provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(providersRef, newProvider);
      const addedProvider = { id: docRef.id, ...newProvider };

      set((state) => ({
        providers: [...state.providers, addedProvider],
        filteredProviders: [...state.filteredProviders, addedProvider],
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateProvider: async (id, provider) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const providerRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/providersList`,
        id
      );

      const updatedProvider = {
        ...provider,
        updatedAt: new Date(),
      };

      await updateDoc(providerRef, updatedProvider);

      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, ...updatedProvider } : p
        ),
        filteredProviders: state.filteredProviders.map((p) =>
          p.id === id ? { ...p, ...updatedProvider } : p
        ),
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteProvider: async (id) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const providerRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/providersList`,
        id
      );

      await deleteDoc(providerRef);

      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
        filteredProviders: state.filteredProviders.filter((p) => p.id !== id),
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedProvider: (provider) => {
    set({ selectedProvider: provider });
  },

  searchProviders: (term) => {
    const { providers } = get();
    const searchTerm = term.toLowerCase();

    const filtered = providers.filter((provider) =>
      provider.name.toLowerCase().includes(searchTerm)
    );

    set({
      filteredProviders: filtered,
      searchTerm: term,
    });
  },
}));

export default useProviderStore;
