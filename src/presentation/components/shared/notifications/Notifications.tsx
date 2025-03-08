// Notifications.tsx
import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../../../firebase/firebase";
import useAuthStore from "../../../../store/AuthStore";


const Notifications = () => {
  const { user, updateNotificationToken } = useAuthStore();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Efecto para obtener el token FCM una sola vez
  useEffect(() => {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPIDKEY;
    getToken(messaging, { vapidKey })
      .then((currentToken) => {
        if (currentToken) {
          console.log("Token obtenido:", currentToken);
          setFcmToken(currentToken);
          // Si el usuario ya está autenticado, actualizamos el token de inmediato
          if (user) {
            updateNotificationToken(currentToken);
          }
        } else {
          console.log("No se obtuvo token; es posible que el usuario no haya otorgado permiso.");
        }
      })
      .catch((err) => {
        console.error("Error al obtener token:", err);
      });
  }, []);

  // Efecto que se dispara cuando el usuario cambia o cuando ya tenemos el token
  useEffect(() => {
    if (user && fcmToken) {
      // Se llama a la función del store para actualizar el token en el perfil del usuario
      updateNotificationToken(fcmToken);
    }
  }, [user, fcmToken, updateNotificationToken]);

  // Escucha mensajes en primer plano
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Mensaje recibido en primer plano:", payload);
      // Aquí puedes agregar lógica para mostrar la notificación en la UI si lo deseas
    });
    return () => unsubscribe();
  }, []);

  return null;
};

export default Notifications;
