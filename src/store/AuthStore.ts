// authStore.ts
import {
  UserCredential,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { create } from "zustand";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

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
  loginWithEmailAndPassword: (user: { email: string; password: string }) => Promise<User | null>;
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
      console.log("Cerrando sesión por inactividad.");
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
        console.error("Error en login:", error);
        // Manejo centralizado de errores: se actualiza el estado 'authError'
        set({ authError: error.message || "Error al iniciar sesión" });
        return null;
      }
    },

    logoutUser: async () => {
      try {
        await signOut(auth);
        localStorage.removeItem("dataUserActive");
        localStorage.removeItem("condominiumId");
        set({ user: null, authError: null });
        removeActivityListeners();
        if (inactivityTimeout) {
          clearTimeout(inactivityTimeout);
          inactivityTimeout = null;
        }
      } catch (error: any) {
        console.error("Error al cerrar sesión:", error);
        set({ authError: error.message || "Error al cerrar sesión" });
        throw error;
      }
    },

    updateNotificationToken: async (token: string) => {
      try {
        const currentUser = get().user;
        if (!currentUser) {
          throw new Error("No hay usuario autenticado");
        }

        // Obtener el clientId de los claims del token
        const tokenResult = await auth.currentUser?.getIdTokenResult();
        const clientId = tokenResult?.claims["clientId"] as string;
        if (!clientId) throw new Error("No se encontró clientId en los claims");

        // Obtener el condominiumId desde el localStorage
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("No se encontró condominiumId en el localStorage");

        // Buscar el usuario en la colección mediante su email
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );
        const allDocs = await getDocs(usersRef);
        const userDoc = allDocs.docs.find(doc => 
          doc.data().email.toLowerCase() === currentUser.email.toLowerCase()
        );

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
        console.error("Error al actualizar el token de notificación:", error);
        set({ authError: error.message || "Error al actualizar token" });
        throw error;
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
