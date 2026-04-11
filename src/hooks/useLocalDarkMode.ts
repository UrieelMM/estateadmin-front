import { useState, useEffect } from "react";

const DARK_MODE_KEY = "estateadmin-dark-mode";
const DARK_MODE_EVENT = "estateadmin-dark-mode-change";

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // silently fail in restricted environments (e.g. Facebook IAB)
    }
  },
};

const safeMatchMedia = (query: string): boolean => {
  try {
    return typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false;
  } catch {
    return false;
  }
};

/**
 * Hook personalizado para manejar el dark mode en localStorage
 * Diseñado para páginas públicas que no requieren autenticación
 */
export const useLocalDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Leer el estado inicial desde localStorage
    const savedMode = safeStorage.getItem(DARK_MODE_KEY);
    if (savedMode !== null) {
      return savedMode === "true";
    }
    // Si no hay valor guardado, usar preferencia del sistema
    return safeMatchMedia("(prefers-color-scheme: light)");
  });

  useEffect(() => {
    // Aplicar la clase dark al documento
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Guardar en localStorage
    safeStorage.setItem(DARK_MODE_KEY, isDarkMode.toString());

    // Sincronizar otras instancias del hook en la misma pestaña
    try {
      window.dispatchEvent(
        new CustomEvent(DARK_MODE_EVENT, { detail: { isDarkMode } }),
      );
    } catch {
      // silently fail in environments that don't support CustomEvent
    }
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
