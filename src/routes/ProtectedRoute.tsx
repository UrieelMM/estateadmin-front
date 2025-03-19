// ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import Loading from "../presentation/components/shared/loaders/Loading";
import useAuthStore from "../store/AuthStore";


const ProtectedRoute = () => {
  const { user } = useAuthStore();

  // Si el estado de autenticación aún no se ha determinado, mostramos un loader.
  if (user === undefined) {
    return <Loading />;
  }

  // Si no hay usuario, redirigimos a /login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario activo, renderizamos las rutas hijas.
  return <Outlet />;
};

export default ProtectedRoute;
