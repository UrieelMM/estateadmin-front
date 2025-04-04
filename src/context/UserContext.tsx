import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { usePlanStore } from "../store/usePlanStore";

interface UserContextType {
  currentUserId: string | null;
  isUserSwitching: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUserId: null,
  isUserSwitching: false,
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);
  const [isUserSwitching, setIsUserSwitching] = useState<boolean>(false);

  const resetPlanState = usePlanStore((state) => state.resetPlanState);

  // Listener centralizado para cambios de usuario
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Detectar cambio de usuario
      if (user?.uid !== currentUserId) {
        console.log(
          `Cambio de usuario global detectado: de ${
            previousUserId || "ninguno"
          } a ${user?.uid || "ninguno"}`
        );

        // Si hay un cambio real de usuario (no solo un logout/login del mismo)
        if (currentUserId && user?.uid && currentUserId !== user.uid) {
          console.log(
            "¡USUARIO DIFERENTE DETECTADO! Iniciando limpieza profunda"
          );
          setIsUserSwitching(true);

          // Limpiar estado
          resetPlanState();

          // Forzar recarga de la página para descartar cualquier dato residual
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }

        // Actualizar IDs de usuario
        setPreviousUserId(currentUserId);
        setCurrentUserId(user?.uid || null);
      }
    });

    return () => unsubscribe();
  }, [currentUserId, previousUserId, resetPlanState]);

  // Reestablecer bandera después de completada la limpieza
  useEffect(() => {
    if (isUserSwitching) {
      const timer = setTimeout(() => {
        setIsUserSwitching(false);
      }, 1000); // Dar tiempo suficiente

      return () => clearTimeout(timer);
    }
  }, [isUserSwitching]);

  return (
    <UserContext.Provider value={{ currentUserId, isUserSwitching }}>
      {!isUserSwitching ? (
        children
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md">
            <div className="animate-spin mb-4 mx-auto h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <h2 className="text-xl font-bold mb-2">Cambiando de usuario</h2>
            <p className="text-gray-600">
              Limpiando datos de sesión anterior...
            </p>
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
};
