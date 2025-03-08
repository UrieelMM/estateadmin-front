// Notifications.tsx
import { useEffect } from "react";

import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../../../firebase/firebase";

const Notifications = () => {
  useEffect(() => {
    // Reemplaza 'TU_VAPID_KEY' con la clave VAPID que obtuviste en la consola de Firebase
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPIDKEY;

    getToken(messaging, { vapidKey })
      .then((currentToken) => {
        if (currentToken) {
          console.log("Token obtenido:", currentToken);
          // Aquí podrías enviarlo a tu backend o guardarlo para usarlo en Cloud Functions
        } else {
          console.log("No se obtuvo token; es posible que el usuario no haya otorgado permiso.");
        }
      })
      .catch((err) => {
        console.error("Error al obtener token:", err);
      });

    // Escucha los mensajes cuando la aplicación está en primer plano
    onMessage(messaging, (payload) => {
      console.log("Mensaje recibido en primer plano:", payload);
      // Aquí podrías actualizar la UI o mostrar una notificación customizada
    });
  }, []);

  return null;
};

export default Notifications;
