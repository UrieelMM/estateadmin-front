import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuth, getIdTokenResult } from "firebase/auth";
import Loading from "../presentation/components/shared/loaders/Loading";
import toast from "react-hot-toast";

const SuperAdminProtectedRoute = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const checkSuperAdminRole = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setIsSuperAdmin(false);
          return;
        }

        // Obtener los claims personalizados del token
        const tokenResult = await getIdTokenResult(currentUser, true);
        const role = tokenResult.claims.role;

        // Verificar si tiene el rol de super-provider-admin
        const hasSuperAdminRole = role === "super-provider-admin";

        setIsSuperAdmin(hasSuperAdminRole);

        if (!hasSuperAdminRole) {
          toast.error("No tienes permisos para acceder a esta sección");
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error);
        setIsSuperAdmin(false);
        toast.error("Error al verificar permisos. Redirigiendo...");
      }
    };

    checkSuperAdminRole();
  }, [auth]);

  // Mientras verificamos, mostramos un loading
  if (isSuperAdmin === null) {
    return <Loading />;
  }

  // Si no es super admin, redireccionar
  if (isSuperAdmin === false) {
    return <Navigate to="/dashboard/home" replace />;
  }

  // Si es super admin, mostrar la ruta
  return <Outlet />;
};

export default SuperAdminProtectedRoute;
