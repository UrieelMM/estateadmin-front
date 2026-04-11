import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import * as Sentry from "@sentry/react";

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Si no hay usuario (página pública/landing), no modificar el dark mode.
      // La landing usa useLocalDarkMode con localStorage para gestionarlo.
      if (!user) {
        return;
      }

      try {
        // Obtener datos necesarios
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"];

        if (!clientId) {
          setIsDarkMode(false);
          document.documentElement.classList.remove("dark");
          return;
        }

        // Referencia al documento del cliente en Firestore
        const db = getFirestore();
        const clientDocRef = doc(db, "clients", clientId as string);
        const clientDoc = await getDoc(clientDocRef);

        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          const darkModePreference = clientData.darkMode ?? false;

          // Aplicar el tema inmediatamente
          setIsDarkMode(darkModePreference);
          if (darkModePreference) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // Si no existe el documento del cliente, usar tema claro
          setIsDarkMode(false);
          document.documentElement.classList.remove("dark");
        }

        // Pequeño delay para asegurar que el tema se aplique
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error: any) {
        // Capturar el error y reportarlo a Sentry
        Sentry.captureException(error, {
          tags: {
            location: "theme-loading",
            userId: user.uid,
          },
        });

        // Establecer tema por defecto
        setIsDarkMode(false);
        document.documentElement.classList.remove("dark");
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleDarkMode = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);

    // Actualizar en Firestore
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"];

      if (!clientId) return;

      const db = getFirestore();
      const clientDocRef = doc(db, "clients", clientId as string);
      await updateDoc(clientDocRef, { darkMode: newTheme });
    } catch (error: any) {
      // Capturar el error y reportarlo a Sentry
      Sentry.captureException(error, {
        tags: {
          location: "theme-toggle",
          userId: user.uid,
        },
      });

      // Revertir el cambio de tema si falla la actualización
      setIsDarkMode(!newTheme);
      document.documentElement.classList.toggle("dark", !newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
