import type { StateCreator } from "zustand";
import { create as actualCreate } from "zustand";

// Almacenamos las funciones de reinicio para cada store
const storeResetFns = new Set<() => void>();

// Función para reiniciar todos los stores
export const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => {
    resetFn();
  });
};

// Función create personalizada que captura el estado inicial
export const create = <T>() => {
  // Usamos este approach ya que la estructura de Zustand
  // no permite acceder directamente al estado inicial
  return (initializer: StateCreator<T>) => {
    // Variable para almacenar una copia del estado inicial
    let initialState: T;

    // Creamos un nuevo inicializador que captura el estado inicial
    const storeInitializer: StateCreator<T> = (set, get, store) => {
      // Creamos el store con el inicializador original
      const result = initializer(set, get, store);

      // Guardamos una copia del estado inicial
      initialState = { ...result };

      return result;
    };

    // Creamos el store con nuestro inicializador personalizado
    const store = actualCreate<T>()(storeInitializer);

    // Registramos la función de reinicio para este store
    const resetFn = () => {
      store.setState(initialState, true);
    };

    storeResetFns.add(resetFn);

    return store;
  };
};
