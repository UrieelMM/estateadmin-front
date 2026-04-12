// Notifications.tsx
import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../../../firebase/firebase";
import { getAuth } from "firebase/auth";
import useAuthStore from "../../../../store/AuthStore";

const Notifications = () => {
  const { user, updateNotificationToken } = useAuthStore();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Efecto para obtener el token FCM una sola vez (solo si hay usuario autenticado)
  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser || !messaging) return;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPIDKEY;
    getToken(messaging, { vapidKey })
      .then((currentToken) => {
        if (currentToken) {
          setFcmToken(currentToken);
          if (user) {
            updateNotificationToken(currentToken);
          }
        }
      })
      .catch(() => {
        // silently fail - permisos no otorgados o usuario sin autenticar
      });
  }, []);

  // Efecto que se dispara cuando el usuario cambia o cuando ya tenemos el token
  useEffect(() => {
    const auth = getAuth();
    if (user && fcmToken && auth.currentUser) {
      updateNotificationToken(fcmToken);
    }
  }, [user, fcmToken, updateNotificationToken]);

  // Escucha mensajes en primer plano (solo si messaging está disponible)
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (_payload) => {
      // Aquí puedes agregar lógica para mostrar la notificación en la UI si lo deseas
    });
    return () => unsubscribe();
  }, []);

  return null;
};

export default Notifications;
