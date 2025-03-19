// AppRouter.tsx
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import LayoutDashboard from "../presentation/screens/layout/LayoutDashboard";
import LoginScreen from "../presentation/screens/login/LoginScreen";
import Hero from "../presentation/screens/presentation/Hero";
import { routesApp } from "./routes";
import NotFoundPage from "../presentation/screens/NotFoundPage/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

export const AppRouterPage = () => {
  return (
    <Router>
      <Routes>
        {/* Página de inicio de sesión */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/presentation" element={<Hero />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <LayoutDashboard>
                <Outlet />
              </LayoutDashboard>
            }
          >
            {routesApp.map((route) => (
              <Route key={route.to} path={route.to} element={route.component} />
            ))}
            <Route index element={<Navigate to={routesApp[0].to} />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};
