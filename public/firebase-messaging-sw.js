// firebase-messaging-sw.js

// Importa los scripts necesarios de Firebase
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js"
);

// Variables que serán reemplazadas durante el build
const FIREBASE_CONFIG = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID",
};

// Inicializa Firebase en el Service Worker
firebase.initializeApp(FIREBASE_CONFIG);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title || "Notificación en segundo plano";
  const notificationOptions = {
    body: payload.notification?.body || "Has recibido una nueva notificación.",
    icon: payload.notification?.icon || "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
