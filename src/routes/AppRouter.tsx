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
import { superAdminRoutes } from "./superAdminRoutes";
import NotFoundPage from "../presentation/screens/NotFoundPage/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import ResetPasswordScreen from "../presentation/screens/login/ResetPasswordScreen";
import UnidentifiedPaymentsPublic from "../presentation/screens/public/UnidentifiedPaymentsPublic";
import SuperAdminProtectedRoute from "./SuperAdminProtectedRoute";
import SuperAdminLayout from "../presentation/screens/layout/SuperAdminLayout";
import ContactForm from "../presentation/screens/public/ContactForm";

export const AppRouterPage = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/presentation" element={<Hero />} />
        <Route path="/contact" element={<ContactForm />} />
        <Route
          path="/unidentified-payments/:qrId"
          element={<UnidentifiedPaymentsPublic />}
        />

        {/* Rutas protegidas para usuarios normales */}
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

        {/* Rutas protegidas para Super Admin */}
        <Route element={<SuperAdminProtectedRoute />}>
          <Route
            path="/super-admin"
            element={
              <SuperAdminLayout>
                <Outlet />
              </SuperAdminLayout>
            }
          >
            {superAdminRoutes.map((route) => (
              <Route
                key={route.to}
                path={route.to}
                element={<route.Component />}
              />
            ))}
            <Route index element={<Navigate to={superAdminRoutes[0].to} />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};
