import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(() => {
        // Service Worker registrado exitosamente
      })
      .catch((_err) => {
        // Aquí podrías usar un servicio de logging como Sentry, LogRocket, etc.
        // Por ejemplo: Sentry.captureException(err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
