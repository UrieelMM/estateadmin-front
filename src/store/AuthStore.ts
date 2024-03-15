import { UserCredential, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { create } from "zustand";

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
    loginWithEmailAndPassword?: (user: {
        email: string;
        password: string;
      }) => Promise<User | null>;
      logoutUser: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    authError: null,

    loginWithEmailAndPassword: async (user) => {
        const response: UserCredential = await signInWithEmailAndPassword(
          auth,
          user.email,
          user.password
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
}));

export default useAuthStore;