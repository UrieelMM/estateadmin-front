// firebase-messaging-sw.js

// Importa los scripts necesarios de Firebase
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Inicializa Firebase en el Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyAAEWH_XwI-kcSMCx9C1Yx2wDAVgAENvrg",
  authDomain: "administracioncondominio-93419.firebaseapp.com",
  projectId: "administracioncondominio-93419",
  storageBucket: "administracioncondominio-93419.appspot.com",
  messagingSenderId: "181336013991",
  appId: "1:181336013991:web:117138a3766158621fef82"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "Notificación en segundo plano";
  const notificationOptions = {
    body: payload.notification?.body || "Has recibido una nueva notificación.",
    icon: payload.notification?.icon || "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
