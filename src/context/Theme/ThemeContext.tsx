import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Obtener datos necesarios
          const tokenResult = await getIdTokenResult(user);
          const clientId = tokenResult.claims["clientId"];
          const condominiumId = localStorage.getItem("condominiumId");
          const userId = user.uid;

          if (!clientId || !condominiumId) {
            setIsThemeLoaded(true);
            return;
          }

          // Referencia al documento del usuario en Firestore
          const db = getFirestore();
          const userDocRef = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${userId}`
          );
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const darkModePreference = userData.darkMode ?? false;
            
            // Aplicar el tema inmediatamente
            setIsDarkMode(darkModePreference);
            if (darkModePreference) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }

          // Pequeño delay para asegurar que el tema se aplique
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Error cargando el tema:", error);
        }
      }

      // Marcar como cargado después del timeout
      setTimeout(() => setIsThemeLoaded(true), 100);
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

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"];
    const condominiumId = localStorage.getItem("condominiumId");
    const userId = user.uid;

    if (!clientId || !condominiumId) return;

    const db = getFirestore();
    const userDocRef = doc(
      db,
      `clients/${clientId}/condominiums/${condominiumId}/users/${userId}`
    );
    await updateDoc(userDocRef, { darkMode: newTheme });
  };

  // No renderizar hasta que el tema esté listo
  if (!isThemeLoaded) {
    return null; // O un componente de carga
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);