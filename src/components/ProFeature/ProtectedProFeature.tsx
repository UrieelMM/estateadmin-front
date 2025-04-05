import React, { ReactNode, useEffect, useRef } from "react";
import { useClientPlanStore } from "../../store/clientPlanStore";

interface ProtectedProFeatureProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
}

/**
 * Componente HOC que protege las funciones Pro.
 * Renderiza el contenido solo si el usuario tiene acceso a la característica.
 *
 * @param {ReactNode} children - El componente a proteger
 * @param {string} featureName - El nombre de la función pro a verificar
 * @param {ReactNode} fallback - Componente opcional a mostrar si no tiene acceso
 */
const ProtectedProFeature: React.FC<ProtectedProFeatureProps> = ({
  children,
  featureName,
  fallback = null,
}) => {
  // Obtenemos todos los datos que necesitamos del store como propiedades individuales
  const plan = useClientPlanStore((state) => state.plan);
  const proFunctions = useClientPlanStore((state) => state.proFunctions);
  const isLoading = useClientPlanStore((state) => state.isLoading);
  const error = useClientPlanStore((state) => state.error);

  // Control para logs (solo mostramos una vez por error)
  const hasLoggedError = useRef(false);

  // Verificamos explícitamente el acceso aquí en lugar de usar la función hasAccess
  // para tener más control sobre la lógica y depuración
  const hasAccess = React.useMemo(() => {
    // Si no hay información de plan, no hay acceso
    if (!plan) return false;

    // Si es Enterprise, tiene acceso a todo
    if (plan === "Enterprise") return true;

    // Si es Pro, verificar si la función está en su lista
    if (plan === "Pro") {
      const hasFunction = proFunctions.includes(featureName);
      return hasFunction;
    }

    // Para Basic, no hay acceso a funciones Pro
    return false;
  }, [plan, proFunctions, featureName]);

  // Log para depuración solo cuando hay cambios importantes y solo una vez
  useEffect(() => {
    if (error && !hasLoggedError.current) {
      hasLoggedError.current = true;
      console.warn(
        `[ProtectedProFeature] Error al verificar acceso a ${featureName}:`,
        error
      );
    }
  }, [error, featureName]);

  // Si todavía está cargando, mostrar indicador
  if (isLoading) return null;

  // Si es usuario Basic, no mostrar nada (ni siquiera el fallback)
  if (!plan || plan === "Basic") return null;

  // Verificar acceso de forma explícita
  if (hasAccess) {
    return <>{children}</>;
  } else {
    return plan === "Pro" || plan === "Enterprise" ? <>{fallback}</> : null;
  }
};

export default ProtectedProFeature;
