import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import Loading from "../presentation/components/shared/loaders/Loading";
import toast from "react-hot-toast";

const SuperAdminProtectedRoute = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(user, true);
        const role = tokenResult.claims.role;

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
    });

    return () => unsubscribe();
  }, [auth]);

  // Mientras verificamos, mostramos un loading
  if (isSuperAdmin === null) {
    return <Loading />;
  }

  // Si no es super admin, redireccionar al login
  if (isSuperAdmin === false) {
    return <Navigate to="/login" replace />;
  }

  // Si es super admin, mostrar la ruta
  return <Outlet />;
};

export default SuperAdminProtectedRoute;
