// notificationsStore.ts
import { create } from "zustand";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc 
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
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => void;
}

const db = getFirestore();

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

const useNotificationStore = create<NotificationStore>((set, _get) => ({
  notifications: [],
  
  fetchNotifications: async () => {
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
    
    // Referencia a la subcolección de notificaciones
    const notifRef = collection(
      db,
      `clients/${clientId}/condominiums/${condominiumId}/users/${currentUser.uid}/notifications`
    );
    const q = query(notifRef, orderBy("createdAt", "desc"));
    
    // Se establece la suscripción en tiempo real
    onSnapshot(q, (snapshot) => {
      const notifs: UserNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as UserNotification);
      });
      set({ notifications: notifs });
    });
  },

  markAsRead: async (notificationId: string) => {
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
  },

  clearNotifications: () => set({ notifications: [] }),
}));

export default useNotificationStore;
