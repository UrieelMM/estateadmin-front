import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export type FinancialAccount = {
  id?: string;
  name: string;
  type: string;
  description?: string;
  initialBalance: number;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type FinancialAccountsState = {
  accounts: FinancialAccount[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: Partial<FinancialAccount>) => Promise<void>;
  updateAccount: (
    accountId: string,
    data: Partial<FinancialAccount>
  ) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
};

export const useFinancialAccountsStore = create<FinancialAccountsState>()(
  (set, get) => ({
    accounts: [],
    loading: false,
    error: null,

    fetchAccounts: async () => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const accountsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "financialAccounts"
        );
        const querySnapshot = await getDocs(accountsRef);
        const accounts: FinancialAccount[] = [];
        querySnapshot.forEach((docSnap) => {
          accounts.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as FinancialAccount);
        });
        set({ accounts, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createAccount: async (data: Partial<FinancialAccount>) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const accountsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "financialAccounts"
        );
        await addDoc(accountsRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        set({ loading: false });
        await get().fetchAccounts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateAccount: async (
      accountId: string,
      data: Partial<FinancialAccount>
    ) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const accountDoc = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "financialAccounts",
          accountId
        );
        await updateDoc(accountDoc, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        set({ loading: false });
        await get().fetchAccounts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteAccount: async (accountId: string) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const accountDoc = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "financialAccounts",
          accountId
        );
        // Soft delete: se marca la cuenta como inactiva para conservar registros históricos
        await updateDoc(accountDoc, {
          active: false,
          updatedAt: serverTimestamp(),
        });
        set({ loading: false });
        await get().fetchAccounts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },
  })
);
