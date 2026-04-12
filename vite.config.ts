import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-sw-env",
      transform(code, id) {
        if (id.endsWith("firebase-messaging-sw.js")) {
          return code
            .replace(
              "FIREBASE_API_KEY",
              JSON.stringify(process.env.VITE_FIREBASE_APIKEY),
            )
            .replace(
              "FIREBASE_AUTH_DOMAIN",
              JSON.stringify(process.env.VITE_FIREBASE_AUTHDOMAIN),
            )
            .replace(
              "FIREBASE_PROJECT_ID",
              JSON.stringify(process.env.VITE_FIREBASE_PROJECTID),
            )
            .replace(
              "FIREBASE_STORAGE_BUCKET",
              JSON.stringify(process.env.VITE_FIREBASE_STORAGEBUCKET),
            )
            .replace(
              "FIREBASE_MESSAGING_SENDER_ID",
              JSON.stringify(process.env.VITE_FIREBASE_MESSAGINGSENDERID),
            )
            .replace(
              "FIREBASE_APP_ID",
              JSON.stringify(process.env.VITE_FIREBASE_APPID),
            );
        }
      },
    },
    sentryVitePlugin({
      org: "omnipixel-nm",
      project: "javascript-react",
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    sourcemap: true,
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase")) return "vendor-firebase";
          if (id.includes("@sentry")) return "vendor-sentry";
          if (
            id.includes("echarts") ||
            id.includes("recharts") ||
            id.includes("chart.js") ||
            id.includes("react-chartjs") ||
            id.includes("echarts-for-react")
          )
            return "vendor-charts";
          if (
            id.includes("jspdf") ||
            id.includes("jspdf-autotable") ||
            id.includes("exceljs") ||
            id.includes("xlsx") ||
            id.includes("file-saver")
          )
            return "vendor-docs";
          if (id.includes("framer-motion") || id.includes("/motion/"))
            return "vendor-motion";
          if (
            id.includes("@headlessui") ||
            id.includes("@heroicons") ||
            id.includes("@heroui") ||
            id.includes("swiper")
          )
            return "vendor-ui";
        },
      },
    },
  },
});
