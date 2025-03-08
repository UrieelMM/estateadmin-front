// authStore.ts
import { UserCredential, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { create } from "zustand";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

interface User {
  email: string;
  name: string;
  photoURL?: File | string;
  password?: string;
  uid: string;
}

interface AuthStore {
  user: User | null | undefined;
  authError: string | null;
  loginWithEmailAndPassword?: (user: { email: string; password: string }) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  updateNotificationToken: (token: string) => Promise<void>;
}

const db = getFirestore();

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  authError: null,

  loginWithEmailAndPassword: async (userData) => {
    const response: UserCredential = await signInWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const loggedUser: User = {
      email: response.user?.email || "",
      name: response.user?.displayName || "",
      uid: response.user?.uid || "",
    };

    set({ user: loggedUser, authError: null });
    localStorage.setItem("dataUserActive", JSON.stringify(loggedUser));
    return loggedUser;
  },

  logoutUser: async () => {
    try {
      localStorage.removeItem("dataUserActive");
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      localStorage.removeItem("dataUserActive");
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  },

  updateNotificationToken: async (token: string) => {
    const currentUser = get().user;
    if (!currentUser) {
      console.error("No hay usuario autenticado");
      return;
    }

    // Obtener el clientId de los claims del token
    const tokenResult = await auth.currentUser?.getIdTokenResult();
    const clientId = tokenResult?.claims["clientId"] as string;
    if (!clientId) throw new Error("No se encontró clientId en los claims");

    // Obtener el condominiumId del localStorage
    const condominiumId = localStorage.getItem("condominiumId");
    if (!condominiumId) throw new Error("No se encontró condominiumId en el localStorage");

    // Buscar el usuario en la colección mediante su email
    const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`);
    const q = query(usersRef, where("email", "==", currentUser.email));
    const querySnapshot = await getDocs(q);

    // Actualizar cada documento encontrado (generalmente habrá uno)
    querySnapshot.forEach(async (docSnapshot) => {
      await updateDoc(
        doc(db, `clients/${clientId}/condominiums/${condominiumId}/users`, docSnapshot.id),
        { fcmToken: token }
      );
    });
  },
}));

export default useAuthStore;
