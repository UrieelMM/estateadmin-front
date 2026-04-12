// firebase.ts

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getVertexAI, getGenerativeModel, Schema } from "firebase/vertexai";
import { getMessaging, Messaging } from "firebase/messaging";

// Config de tu proyecto Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_FIREBASE_APPID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID,
};

// Inicializa la App
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Persistencia con fallback para WKWebView (Facebook IAB en iPhone)
// que puede bloquear IndexedDB / localStorage
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, inMemoryPersistence).catch(() => {
    // silently fail
  });
});

// Instancia Vertex AI a partir de tu app de Firebase
let model: ReturnType<typeof getGenerativeModel> | null = null;
let jsonModel: ReturnType<typeof getGenerativeModel> | null = null;
try {
  const vertexAI = getVertexAI(app);
  model = getGenerativeModel(vertexAI, {
    model: "gemini-2.0-flash",
  });
  const myJsonSchema = Schema.object({
    properties: {
      stats: Schema.array({
        items: Schema.object({
          properties: {
            month: Schema.string(),
            income: Schema.number(),
            expenses: Schema.number(),
          },
        }),
      }),
    },
  });
  jsonModel = getGenerativeModel(vertexAI, {
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: myJsonSchema,
    },
  });
} catch {
  // Vertex AI no disponible en este entorno
}
export { model, jsonModel };

// Firebase Messaging — solo disponible donde hay Service Workers
// getMessaging() lanza en WKWebView (Facebook IAB en iPhone)
let messaging: Messaging | null = null;
try {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch {
  // messaging/unsupported-browser en entornos sin Service Workers
}
export { messaging };
