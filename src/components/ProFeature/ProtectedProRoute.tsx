import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useClientPlanStore } from "../../store/clientPlanStore";

interface ProtectedProRouteProps {
  children: React.ReactNode;
  featureName: string;
  redirectTo?: string;
}

/**
 * Componente HOC que protege rutas de funciones Pro.
 * Redirige al usuario si no tiene acceso a la característica.
 *
 * @param {ReactNode} children - La ruta a proteger
 * @param {string} featureName - El nombre de la función pro a verificar
 * @param {string} redirectTo - Ruta a la que redirigir si no tiene acceso (por defecto a dashboard)
 */
const ProtectedProRoute: React.FC<ProtectedProRouteProps> = ({
  children,
  featureName,
  redirectTo = "/dashboard/home",
}) => {
  const hasAccess = useClientPlanStore((state) => state.hasAccess(featureName));
  const location = useLocation();

  if (!hasAccess) {
    // Redirigir con state para mostrar un mensaje opcional
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location,
          accessDenied: true,
          featureName: featureName,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedProRoute;
