import { useEffect, useRef } from "react";
import { useCondominiumStore } from "../store/useCondominiumStore";
import { useClientPlanStore } from "../store/clientPlanStore";
import { getAuth } from "firebase/auth";

/**
 * Hook para sincronizar el plan del cliente cuando cambia el condominio seleccionado.
 * Debe usarse en un componente de alto nivel para asegurar que siempre
 * se tenga el plan correcto para el condominio actual.
 */
export const useSyncClientPlan = () => {
  const selectedCondominium = useCondominiumStore(
    (state) => state.selectedCondominium
  );
  const { setClientData, updateCondominiumId, clientId, condominiumId } =
    useClientPlanStore();
  const initialized = useRef(false);
  const setupCompleted = useRef(false);

  // Inicialización - se ejecuta solo una vez
  useEffect(() => {
    // Si ya completamos la inicialización, no hacemos nada
    if (setupCompleted.current) return;

    const initClientPlan = async () => {
      try {
        // Obtener claims solo una vez
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const tokenResult = await user.getIdTokenResult();
        const clientIdFromToken = tokenResult.claims.clientId as string;

        if (!clientIdFromToken) {
          console.warn(
            "[useSyncClientPlan] No hay clientId en los claims del token"
          );
          return;
        }

        // Establecer datos iniciales solo si no existen ya
        if (!clientId) {
          // Usamos el condominio seleccionado o el del token
          const condoId =
            selectedCondominium?.id ||
            (tokenResult.claims.condominiumId as string);

          if (condoId) {
            setClientData(clientIdFromToken, condoId);
            initialized.current = true;
          }
        } else {
          initialized.current = true;
        }

        // Marcar como completado para evitar ejecuciones futuras
        setupCompleted.current = true;
      } catch (error) {
        console.error("[useSyncClientPlan] Error en la inicialización:", error);
      }
    };

    initClientPlan();
  }, [clientId, selectedCondominium, setClientData]);

  // Solo actualizar condominiumId cuando cambia el condominio seleccionado
  useEffect(() => {
    // No hacer nada hasta que estemos inicializados
    if (!initialized.current || !selectedCondominium?.id) return;

    // Si el ID del condominio seleccionado es diferente del actual, actualizarlo
    if (condominiumId !== selectedCondominium.id) {
      updateCondominiumId(selectedCondominium.id);
    }
  }, [selectedCondominium?.id, condominiumId, updateCondominiumId]);

  return null;
};
