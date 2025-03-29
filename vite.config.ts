import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: "inject-sw-env",
    transform(code, id) {
      if (id.endsWith("firebase-messaging-sw.js")) {
        return code
          .replace(
            "FIREBASE_API_KEY",
            JSON.stringify(process.env.VITE_FIREBASE_APIKEY)
          )
          .replace(
            "FIREBASE_AUTH_DOMAIN",
            JSON.stringify(process.env.VITE_FIREBASE_AUTHDOMAIN)
          )
          .replace(
            "FIREBASE_PROJECT_ID",
            JSON.stringify(process.env.VITE_FIREBASE_PROJECTID)
          )
          .replace(
            "FIREBASE_STORAGE_BUCKET",
            JSON.stringify(process.env.VITE_FIREBASE_STORAGEBUCKET)
          )
          .replace(
            "FIREBASE_MESSAGING_SENDER_ID",
            JSON.stringify(process.env.VITE_FIREBASE_MESSAGINGSENDERID)
          )
          .replace(
            "FIREBASE_APP_ID",
            JSON.stringify(process.env.VITE_FIREBASE_APPID)
          );
      }
    },
  }, sentryVitePlugin({
    org: "omnipixel-nm",
    project: "javascript-react"
  })],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    sourcemap: true
  }
});