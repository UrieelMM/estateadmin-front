// firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getVertexAI, getGenerativeModel, Schema } from "firebase/vertexai";
import { getMessaging } from "firebase/messaging"; // <-- Importa Messaging

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

// Instancia Vertex AI a partir de tu app de Firebase
const vertexAI = getVertexAI(app);

export const model = getGenerativeModel(vertexAI, {
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
export const jsonModel = getGenerativeModel(vertexAI, {
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: myJsonSchema,
  },
});

// Inicializa Firebase Messaging y expórtalo
export const messaging = getMessaging(app);
