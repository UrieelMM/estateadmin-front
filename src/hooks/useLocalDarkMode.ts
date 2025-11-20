import { useState, useEffect } from "react";

const DARK_MODE_KEY = "estateadmin-dark-mode";

/**
 * Hook personalizado para manejar el dark mode en localStorage
 * Diseñado para páginas públicas que no requieren autenticación
 */
export const useLocalDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Leer el estado inicial desde localStorage
    const savedMode = localStorage.getItem(DARK_MODE_KEY);
    if (savedMode !== null) {
      return savedMode === "true";
    }
    // Si no hay valor guardado, usar preferencia del sistema
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Aplicar la clase dark al documento
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Guardar en localStorage
    localStorage.setItem(DARK_MODE_KEY, isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, toggleDarkMode };
};
