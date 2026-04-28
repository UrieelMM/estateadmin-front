// AppRouter.tsx
import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import Hero from "../presentation/screens/presentation/Hero";
import { routesApp } from "./routes";
import { superAdminRoutes } from "./superAdminRoutes";
import ProtectedRoute from "./ProtectedRoute";
import SuperAdminProtectedRoute from "./SuperAdminProtectedRoute";
import FloatingWhatsAppButton from "../presentation/components/public/FloatingWhatsAppButton";
import LoadingApp from "../presentation/components/shared/loaders/LoadingApp";

const LayoutDashboard = React.lazy(
  () => import("../presentation/screens/layout/LayoutDashboard"),
);
const SuperAdminLayout = React.lazy(
  () => import("../presentation/screens/layout/SuperAdminLayout"),
);
const LoginScreen = React.lazy(
  () => import("../presentation/screens/login/LoginScreen"),
);
const ResetPasswordScreen = React.lazy(
  () => import("../presentation/screens/login/ResetPasswordScreen"),
);
const NotFoundPage = React.lazy(
  () => import("../presentation/screens/NotFoundPage/NotFoundPage"),
);
const ContactForm = React.lazy(
  () => import("../presentation/screens/public/ContactForm"),
);
const UnidentifiedPaymentsPublic = React.lazy(
  () => import("../presentation/screens/public/UnidentifiedPaymentsPublic"),
);
const AttendancePublic = React.lazy(
  () => import("../presentation/screens/public/AttendancePublic"),
);
const ScheduledVisitPublic = React.lazy(
  () => import("../presentation/screens/public/ScheduledVisitPublic"),
);
const ScheduledVisitLegacyRedirect = React.lazy(
  () => import("../presentation/screens/public/ScheduledVisitLegacyRedirect"),
);
const NewCustomerInformationForm = React.lazy(
  () => import("../presentation/screens/public/NewCustomerInformationForm"),
);
const FormSubmissionSuccess = React.lazy(
  () => import("../presentation/screens/public/FormSubmissionSuccess"),
);
const DataDeletion = React.lazy(
  () => import("../presentation/screens/presentation/DataDeletion"),
);
const PrivacyPolicy = React.lazy(
  () => import("../presentation/screens/presentation/PrivacyPolicy"),
);
const AboutUs = React.lazy(
  () => import("../presentation/screens/presentation/AboutUs"),
);
const AIFeatures = React.lazy(
  () => import("../presentation/screens/presentation/AIFeatures"),
);
const FaqPage = React.lazy(
  () => import("../presentation/screens/presentation/FaqPage"),
);
const ForWhoPage = React.lazy(
  () => import("../presentation/screens/presentation/ForWhoPage"),
);
const PricingPage = React.lazy(
  () => import("../presentation/screens/presentation/PricingPage"),
);
const GuidesList = React.lazy(() =>
  import("../presentation/components/newsAndGuides").then((m) => ({
    default: m.GuidesList,
  })),
);
const GuidePage = React.lazy(() =>
  import("../presentation/components/newsAndGuides").then((m) => ({
    default: m.GuidePage,
  })),
);
const MaintenanceAppLanding = React.lazy(
  () => import("../presentation/screens/presentation/MaintenanceAppLanding"),
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
    <LoadingApp />
  </div>
);

const ContentLoader = () => (
  <div className="flex items-center justify-center w-full min-h-[60vh]">
    <LoadingApp />
  </div>
);

export const AppRouterPage = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/presentation" element={<Navigate to="/" replace />} />
          <Route path="/contacto" element={<ContactForm />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/eliminar-datos" element={<DataDeletion />} />
          <Route path="/sobre-nosotros" element={<AboutUs />} />
          <Route path="/para-quien-es" element={<ForWhoPage />} />
          <Route path="/preguntas-frecuentes" element={<FaqPage />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route
            path="/caracteristicas-inteligencia-artificial"
            element={<AIFeatures />}
          />
          <Route
            path="/unidentified-payments/:qrId"
            element={<UnidentifiedPaymentsPublic />}
          />
          <Route path="/attendance/:qrId" element={<AttendancePublic />} />
          <Route
            path="/scheduled-visits/:qrId"
            element={<ScheduledVisitPublic />}
          />
          {/* Compat: QRs viejos generados con la ruta /scheduled-visits-qr/ */}
          <Route
            path="/scheduled-visits-qr/:qrId"
            element={<ScheduledVisitLegacyRedirect />}
          />

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

          {/* App de Mantenimiento - landing page */}
          <Route
            path="/app-mantenimiento"
            element={<MaintenanceAppLanding />}
          />

          {/* Rutas protegidas para usuarios normales */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <LayoutDashboard>
                  <Suspense fallback={<ContentLoader />}>
                    <Outlet />
                  </Suspense>
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
                  <Suspense fallback={<ContentLoader />}>
                    <Outlet />
                  </Suspense>
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
      </Suspense>
      <FloatingWhatsAppButton />
    </Router>
  );
};
