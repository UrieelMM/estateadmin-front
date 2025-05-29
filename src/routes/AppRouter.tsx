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
import DataDeletion from "../presentation/screens/presentation/DataDeletion";
import PrivacyPolicy from "../presentation/screens/presentation/PrivacyPolicy";
import AboutUs from "../presentation/screens/presentation/AboutUs";
import AIFeatures from "../presentation/screens/presentation/AIFeatures";
import {
  GuidesList,
  GuidePage,
} from "../presentation/components/newsAndGuides";
import { HelmetProvider } from "react-helmet-async";
import NewCustomerInformationForm from "../presentation/screens/public/NewCustomerInformationForm";
import FormSubmissionSuccess from "../presentation/screens/public/FormSubmissionSuccess";
import AttendancePublic from "../presentation/screens/public/AttendancePublic";

export const AppRouterPage = () => {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/presentation" element={<Hero />} />
          <Route path="/contacto" element={<ContactForm />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/eliminar-datos" element={<DataDeletion />} />
          <Route path="/sobre-nosotros" element={<AboutUs />} />
          <Route
            path="/caracteristicas-inteligencia-artificial"
            element={<AIFeatures />}
          />
          <Route
            path="/unidentified-payments/:qrId"
            element={<UnidentifiedPaymentsPublic />}
          />
          <Route path="/attendance/:qrId" element={<AttendancePublic />} />

          {/* Rutas para el formulario de nuevos clientes */}
          <Route
            path="/nuevo-cliente/:formId"
            element={<NewCustomerInformationForm />}
          />
          <Route
            path="/formulario-completado"
            element={<FormSubmissionSuccess />}
          />

          {/* Rutas para guías */}
          <Route path="/guias" element={<GuidesList />} />
          <Route path="/guias/:slug" element={<GuidePage />} />

          {/* Rutas protegidas para usuarios normales */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <LayoutDashboard>
                  <Outlet />
                </LayoutDashboard>
              }
            >
              {routesApp.map((route) => (
                <Route
                  key={route.to}
                  path={route.to}
                  element={route.component}
                />
              ))}
              <Route index element={<Navigate to="/dashboard/home" />} />
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
    </HelmetProvider>
  );
};
