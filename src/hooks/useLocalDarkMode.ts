import { useState, useEffect } from "react";

const DARK_MODE_KEY = "estateadmin-dark-mode";
const DARK_MODE_EVENT = "estateadmin-dark-mode-change";

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
    return window.matchMedia("(prefers-color-scheme: light)").matches;
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

    // Sincronizar otras instancias del hook en la misma pestaña
    window.dispatchEvent(
      new CustomEvent(DARK_MODE_EVENT, { detail: { isDarkMode } })
    );
  }, [isDarkMode]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== DARK_MODE_KEY || event.newValue === null) return;
      setIsDarkMode(event.newValue === "true");
    };

    const handleLocalModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
      if (typeof customEvent.detail?.isDarkMode !== "boolean") return;
      setIsDarkMode(customEvent.detail.isDarkMode);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(DARK_MODE_EVENT, handleLocalModeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(DARK_MODE_EVENT, handleLocalModeChange);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, toggleDarkMode };
};
