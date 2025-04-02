// notificationsStore.ts
import { create } from "zustand";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Unsubscribe,
} from "firebase/firestore";
import { auth } from "../firebase/firebase";
// No dependemos directamente del AuthStore, usamos Firebase Auth
// import useAuthStore from "./AuthStore";

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  invoiceId?: string;
  createdAt: any; // normalmente un Timestamp de Firestore
  read: boolean;
}

interface NotificationStore {
  notifications: UserNotification[];
  isInitialized: boolean;
  unsubscribe: Unsubscribe | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => void;
}

const db = getFirestore();

// Variable global para mantener la suscripción entre renders
let globalUnsubscribe: Unsubscribe | null = null;

const waitForAuthUser = async (): Promise<any> => {
  // Si auth.currentUser ya existe, lo retornamos
  if (auth.currentUser) return auth.currentUser;
  // De lo contrario, esperamos a que se establezca el usuario
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });
  });
};

const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isInitialized: false,
  unsubscribe: null,

  fetchNotifications: async () => {
    try {
      // Si ya estamos inicializados y tenemos una suscripción, no hacemos nada
      if (get().isInitialized && globalUnsubscribe) {
        console.log("Ya existe una suscripción activa a notificaciones");
        return;
      }

      // Primero cancelamos cualquier suscripción existente
      if (globalUnsubscribe) {
        console.log("Cancelando suscripción anterior");
        globalUnsubscribe();
        globalUnsubscribe = null;
      }

      console.log("Iniciando fetchNotifications...");
      const currentUser = await waitForAuthUser();
      if (!currentUser) {
        console.error("No hay usuario autenticado");
        return;
      }

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        console.error("No se encontró condominiumId en localStorage");
        return;
      }

      const tokenResult = await currentUser.getIdTokenResult();
      const clientId = tokenResult?.claims["clientId"] as string;
      if (!clientId) {
        console.error("No se encontró clientId en los claims");
        return;
      }

      console.log(
        `Configurando listener para: Cliente ${clientId}, Condominio ${condominiumId}, Usuario ${currentUser.uid}`
      );

      // Referencia a la subcolección de notificaciones
      const notifPath = `clients/${clientId}/condominiums/${condominiumId}/users/${currentUser.uid}/notifications`;
      console.log("Ruta de notificaciones:", notifPath);

      const notifRef = collection(db, notifPath);
      const q = query(notifRef, orderBy("createdAt", "desc"));

      // Se establece la suscripción en tiempo real
      const unsubscribeListener = onSnapshot(
        q,
        (snapshot) => {
          console.log(`Snapshot recibido con ${snapshot.size} documentos`);
          const notifs: UserNotification[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            console.log("Notificación recibida:", { id: docSnap.id, ...data });
            notifs.push({ id: docSnap.id, ...data } as UserNotification);
          });
          set({
            notifications: notifs,
            isInitialized: true,
          });
        },
        (error) => {
          console.error("Error en la suscripción de notificaciones:", error);
          set({ isInitialized: false });
        }
      );

      // Guardamos la función de cancelación tanto en el store como globalmente
      globalUnsubscribe = unsubscribeListener;
      set({ unsubscribe: unsubscribeListener });
    } catch (error) {
      console.error("Error en fetchNotifications:", error);
      set({ isInitialized: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const currentUser = await waitForAuthUser();
      if (!currentUser) {
        console.error("No hay usuario autenticado");
        return;
      }
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        console.error("No se encontró condominiumId en localStorage");
        return;
      }
      const tokenResult = await currentUser.getIdTokenResult();
      const clientId = tokenResult?.claims["clientId"] as string;
      if (!clientId) {
        console.error("No se encontró clientId en los claims");
        return;
      }

      const notifDocRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${currentUser.uid}/notifications`,
        notificationId
      );

      await updateDoc(notifDocRef, { read: true });

      // No actualizamos el estado local porque la suscripción en tiempo real lo hará automáticamente
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  },

  clearNotifications: () => {
    // Cancelamos la suscripción si existe
    if (globalUnsubscribe) {
      globalUnsubscribe();
      globalUnsubscribe = null;
    }
    set({ notifications: [], unsubscribe: null, isInitialized: false });
  },
}));

export default useNotificationStore;
