import React, { useEffect, useState } from "react";
import { usePlanStore } from "../../../store/usePlanStore";
import { getFeatureConfig } from "../../../config/planFeatures";
import { getAuth } from "firebase/auth";

/**
 * Componente que muestra una promoción para actualizar al plan Pro
 */
const UpgradePrompt: React.FC<{ featureName: string }> = ({ featureName }) => {
  const [isClosed, setIsClosed] = useState(false);
  const storageKey = `proFeature_${featureName}_closed`;

  useEffect(() => {
    // Verificar si ya se cerró anteriormente
    const wasClosed = localStorage.getItem(storageKey) === "true";
    if (wasClosed) {
      setIsClosed(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    setIsClosed(true);
    localStorage.setItem(storageKey, "true");
  };

  if (isClosed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg shadow-xl overflow-hidden">
      <div className="absolute top-2 right-2">
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Cerrar banner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="mr-3 bg-white bg-opacity-20 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold">¡Potencia tu experiencia!</h3>
        </div>

        <p className="mb-4 text-sm">
          Desbloquea <strong>{featureName}</strong> y todas las funciones de IA
          avanzada actualizando a nuestro Plan Pro.
        </p>

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-1 text-xs text-white text-opacity-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Acceso ilimitado</span>
          </div>

          <button
            className="bg-white text-indigo-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors shadow-md"
            onClick={() =>
              window.open(
                "mailto:ventas@estateadmin.com?subject=Upgrade a Plan Pro",
                "_blank"
              )
            }
          >
            Actualizar ahora
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * HOC que protege componentes Pro
 * @param WrappedComponent Componente a proteger
 * @param featureKey Clave de la característica en el store (ej: "chatBot")
 * @param FallbackComponent Componente opcional a mostrar para usuarios Basic (si no se proporciona, no se muestra nada)
 */
export const withProFeature = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureKey: string,
  FallbackComponent?: React.ComponentType<P>
) => {
  const WithProFeature: React.FC<P> = (props) => {
    const { hasAccess, fetchPlanDetails, loading, clientId, currentPlan } =
      usePlanStore();
    const auth = getAuth();
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Obtener información de la característica con valor fallback
    const featureConfig = getFeatureConfig(featureKey);
    const featureDisplayName = featureConfig?.displayName || featureKey;

    // Detectar cambios de usuario para forzar reverificación
    useEffect(() => {
      const userId = auth.currentUser?.uid || null;

      // Si el ID de usuario cambió, forzar reverificación
      if (userId !== currentUserId) {
        console.log(
          "Cambio de usuario detectado en componente Pro, reverificando permisos"
        );
        setCurrentUserId(userId);
        setIsVerified(false);
      }
    }, [auth.currentUser, currentUserId]);

    // Cargar detalles del plan al montar el componente y cuando cambie el usuario
    useEffect(() => {
      let mounted = true;

      const verifyAccess = async () => {
        if (!mounted) return;

        setIsVerified(false);

        try {
          // Solo intentar cargar el plan si hay un usuario autenticado
          if (auth.currentUser) {
            // Forzar refresco del plan para evitar datos antiguos
            await fetchPlanDetails();

            // Si el componente sigue montado, marcar como verificado
            if (mounted) setIsVerified(true);
          } else {
            console.log("No hay usuario autenticado, omitiendo carga del plan");
            if (mounted) setIsVerified(true);
          }
        } catch (error) {
          console.error("Error al verificar acceso:", error);
          if (mounted) setIsVerified(true);
        }
      };

      // Si cambió el usuario o no está verificado, verificar acceso
      if (auth.currentUser?.uid !== currentUserId || !isVerified) {
        verifyAccess();
      }

      // Cleanup
      return () => {
        mounted = false;
      };
    }, [fetchPlanDetails, auth.currentUser, currentUserId, isVerified]);

    // Mostrar loader mientras se verifica el plan
    if (loading || !isVerified) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    // Verificar acceso de manera segura
    let hasProAccess = false;
    try {
      // Verificación más estricta incluyendo el plan y clientId
      hasProAccess =
        !!clientId &&
        !!auth.currentUser &&
        currentPlan === "pro" &&
        hasAccess(featureKey);

      console.log(
        `Acceso a ${featureKey}: ${
          hasProAccess ? "Permitido" : "Denegado"
        } (Plan: ${currentPlan}, Cliente: ${clientId || "ninguno"})`
      );
    } catch (error) {
      console.error(
        `Error al verificar acceso a feature ${featureKey}:`,
        error
      );
    }

    // Si tiene acceso Pro, mostrar el componente Pro
    if (hasProAccess) {
      return <WrappedComponent {...props} />;
    }

    // Si no tiene acceso Pro pero hay un componente fallback, mostrarlo junto con la promoción
    if (FallbackComponent) {
      return (
        <>
          <FallbackComponent {...props} />
          <UpgradePrompt featureName={featureDisplayName} />
        </>
      );
    }

    // Si no hay componente fallback, mostrar solo la promoción
    return <UpgradePrompt featureName={featureDisplayName} />;
  };

  // Para facilitar debugging
  WithProFeature.displayName = `WithProFeature(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithProFeature;
};
