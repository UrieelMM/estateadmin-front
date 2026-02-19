import { create } from "./createStore";
import {
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth } from "../firebase/firebase";
import {
  NotificationEventType,
  NotificationModule,
  NotificationPriority,
} from "../types/notifications";

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  readAt?: any;
  createdAt: any;
  module?: NotificationModule;
  priority?: NotificationPriority;
  eventType?: NotificationEventType;
  sourceEventId?: string;
  sourceQueueId?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationStore {
  notifications: UserNotification[];
  isInitialized: boolean;
  unsubscribe: Unsubscribe | null;
  subscriptionPath: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

const db = getFirestore();
let globalUnsubscribe: Unsubscribe | null = null;

const waitForAuthUser = async (): Promise<any> => {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Tiempo de espera agotado para usuario autenticado"));
    }, 5000);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      }
    });
  });
};

const resolveNotificationPath = async (): Promise<{
  path: string;
  uid: string;
} | null> => {
  const currentUser = await waitForAuthUser();
  if (!currentUser) return null;

  const condominiumId = localStorage.getItem("condominiumId");
  if (!condominiumId) return null;

  const tokenResult = await currentUser.getIdTokenResult();
  const clientId = tokenResult?.claims["clientId"] as string;
  if (!clientId) return null;

  return {
    uid: currentUser.uid,
    path: `clients/${clientId}/condominiums/${condominiumId}/users/${currentUser.uid}/notifications`,
  };
};

const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  isInitialized: false,
  unsubscribe: null,
  subscriptionPath: null,

  fetchNotifications: async () => {
    try {
      const pathData = await resolveNotificationPath();
      if (!pathData) {
        set({ isInitialized: false });
        return;
      }

      const nextPath = pathData.path;
      if (
        get().isInitialized &&
        globalUnsubscribe &&
        get().subscriptionPath === nextPath
      ) {
        return;
      }

      if (globalUnsubscribe) {
        globalUnsubscribe();
        globalUnsubscribe = null;
      }

      const notifRef = collection(db, pathData.path);
      const q = query(notifRef, orderBy("createdAt", "desc"), limit(100));

      const unsubscribeListener = onSnapshot(
        q,
        (snapshot) => {
          const nextNotifications: UserNotification[] = snapshot.docs.map(
            (docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<UserNotification, "id">),
            })
          );
          set({
            notifications: nextNotifications,
            isInitialized: true,
          });
        },
        (error) => {
          console.error("Error en listener de notificaciones:", error);
          set({ isInitialized: false });
        }
      );

      globalUnsubscribe = unsubscribeListener;
      set({ unsubscribe: unsubscribeListener, subscriptionPath: nextPath });
    } catch (error) {
      console.error("Error en fetchNotifications:", error);
      set({ isInitialized: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const pathData = await resolveNotificationPath();
      if (!pathData) return;

      const notifDocRef = doc(db, pathData.path, notificationId);
      await updateDoc(notifDocRef, {
        read: true,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      const pathData = await resolveNotificationPath();
      if (!pathData) return;

      const unread = get().notifications.filter((item) => !item.read);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach((notification) => {
        const notifDocRef = doc(db, pathData.path, notification.id);
        batch.update(notifDocRef, {
          read: true,
          readAt: new Date(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  },

  clearNotifications: () => {
    if (globalUnsubscribe) {
      globalUnsubscribe();
      globalUnsubscribe = null;
    }
    set({
      notifications: [],
      unsubscribe: null,
      isInitialized: false,
      subscriptionPath: null,
    });
  },
}));

export default useNotificationStore;
