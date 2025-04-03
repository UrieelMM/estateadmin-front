// authStore.ts
import {
  UserCredential,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import * as Sentry from "@sentry/react";

// Se elimina el campo 'password' de la interfaz para evitar almacenar datos sensibles
interface User {
  email: string;
  name: string;
  photoURL?: File | string;
  uid: string;
}

interface AuthStore {
  user: User | null;
  authError: string | null;
  // Inicia sesión con email y contraseña, retornando el usuario autenticado o null en error
  loginWithEmailAndPassword: (user: {
    email: string;
    password: string;
  }) => Promise<User | null>;
  // Cierra sesión del usuario
  logoutUser: () => Promise<void>;
  // Actualiza el token de notificación en Firestore usando actualización en lote
  updateNotificationToken: (token: string) => Promise<void>;
  // Inicializa un hook para sincronizar el estado de autenticación con Firebase y gestionar el cierre de sesión por inactividad
  initializeAuthListener: () => void;
}

const db = getFirestore();

// Sincronización del estado desde el almacenamiento local al inicializar el store
const loadUserFromLocalStorage = (): User | null => {
  const data = localStorage.getItem("dataUserActive");
  if (data) {
    try {
      return JSON.parse(data) as User;
    } catch (error) {
      console.error("Error al parsear el usuario desde localStorage:", error);
      localStorage.removeItem("dataUserActive");
    }
  }
  return null;
};

const useAuthStore = create<AuthStore>((set, get) => {
  // Timer de inactividad
  let inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
  // Duración de inactividad permitida: 48 horas en milisegundos
  const INACTIVITY_LIMIT = 48 * 60 * 60 * 1000; // 172800000 ms

  const resetInactivityTimer = () => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    inactivityTimeout = setTimeout(async () => {
      await get().logoutUser();
    }, INACTIVITY_LIMIT);
  };

  const attachActivityListeners = () => {
    const events = ["mousemove", "keydown", "click"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer);
    });
  };

  const removeActivityListeners = () => {
    const events = ["mousemove", "keydown", "click"];
    events.forEach((eventName) => {
      window.removeEventListener(eventName, resetInactivityTimer);
    });
  };

  return {
    user: loadUserFromLocalStorage(),
    authError: null,

    loginWithEmailAndPassword: async (userData) => {
      try {
        const response: UserCredential = await signInWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        if (!response.user) {
          throw new Error("No se obtuvo usuario de la autenticación");
        }
        const loggedUser: User = {
          email: response.user.email || "",
          name: response.user.displayName || "",
          uid: response.user.uid || "",
        };

        set({ user: loggedUser, authError: null });
        localStorage.setItem("dataUserActive", JSON.stringify(loggedUser));
        return loggedUser;
      } catch (error: any) {
        let errorMessage = "";
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "Usuario no encontrado";
            break;
          case "auth/wrong-password":
            errorMessage = "Contraseña incorrecta";
            break;
          case "auth/invalid-credential":
            errorMessage = "Correo o contraseña incorrectas";
            break;
          case "auth/too-many-requests":
            errorMessage = "Demasiados intentos, intente más tarde";
            break;
          default:
            errorMessage = "Usuario o contraseña incorrectos";
        }
        set({ authError: errorMessage });
        Sentry.captureException(error);
        throw new Error(errorMessage);
      }
    },

    logoutUser: async () => {
      try {
        await signOut(auth);
        // Limpieza explícita del tema dark al cerrar sesión
        document.documentElement.classList.remove("dark");
        localStorage.removeItem("dataUserActive");
        localStorage.removeItem("condominiumId");
        set({ user: null, authError: null });
        removeActivityListeners();
        if (inactivityTimeout) {
          clearTimeout(inactivityTimeout);
          inactivityTimeout = null;
        }
      } catch (error: any) {
        Sentry.captureException(error);
        set({ authError: error.message || "Error al cerrar sesión" });
        throw new Error(error.message || "Error al cerrar sesión");
      }
    },

    updateNotificationToken: async (token: string) => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("No hay usuario autenticado");
        }

        // Obtener los claims del usuario
        const tokenResult = await getIdTokenResult(user);
        const role = tokenResult.claims.role as string;

        // Si es Super Admin, no necesitamos actualizar el token
        if (role === "super-provider-admin") {
          return;
        }

        // Para otros roles, verificar clientId y condominiumId
        const clientId = tokenResult.claims.clientId as string;
        const condominiumId = tokenResult.claims.condominiumId as string;

        if (!clientId || !condominiumId) {
          throw new Error(
            "No se encontró clientId o condominiumId en los claims"
          );
        }

        // Buscar el documento del usuario
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const userDoc = querySnapshot.docs[0];

        if (!userDoc) {
          throw new Error("No se encontró el usuario en la colección");
        }

        // Actualizar el token del usuario
        const docRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`,
          userDoc.id
        );
        await updateDoc(docRef, { fcmToken: token });
      } catch (error: any) {
        Sentry.captureException(error);
        set({ authError: error.message || "Error al actualizar token" });
        throw new Error(error.message || "Error al actualizar token");
      }
    },

    // Integración de hook de Firebase: escucha de cambios en la autenticación
    // Además, configura la detección de inactividad para cerrar sesión automáticamente tras 48 horas sin actividad
    initializeAuthListener: () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const loggedUser: User = {
            email: user.email || "",
            name: user.displayName || "",
            uid: user.uid || "",
          };
          set({ user: loggedUser, authError: null });
          localStorage.setItem("dataUserActive", JSON.stringify(loggedUser));
          // Configurar detección de actividad y reiniciar el timer de inactividad
          attachActivityListeners();
          resetInactivityTimer();
        } else {
          set({ user: null });
          localStorage.removeItem("dataUserActive");
          removeActivityListeners();
          if (inactivityTimeout) {
            clearTimeout(inactivityTimeout);
            inactivityTimeout = null;
          }
        }
      });
    },
  };
});

export default useAuthStore;
