import React from "react";

const BillingManagement = React.lazy(
  () => import("../presentation/screens/superAdmin/BillingManagement"),
);
const ClientsManagement = React.lazy(
  () => import("../presentation/screens/superAdmin/ClientsManagement"),
);
const SuperAdminDashboard = React.lazy(
  () => import("../presentation/screens/superAdmin/SuperAdminDashboard"),
);
const NewsAndGuides = React.lazy(
  () => import("../presentation/screens/superAdmin/NewsAndGuides"),
);
const NewCustomerFormManager = React.lazy(() =>
  import("../presentation/screens/superAdmin/newCustomerInformationForm").then(
    (m) => ({ default: m.NewCustomerFormManager }),
  ),
);
const EmailManagement = React.lazy(
  () => import("../presentation/screens/superAdmin/emails/EmailManagement"),
);
const SupportTicketsManagement = React.lazy(
  () => import("../presentation/screens/superAdmin/SupportTicketsManagement"),
);

interface Route {
  to: string;
  path: string;
  Component: React.ComponentType;
  name: string;
}

export const superAdminRoutes: Route[] = [
  {
    to: "dashboard",
    path: "super-admin/dashboard",
    Component: SuperAdminDashboard,
    name: "Panel Principal",
  },
  {
    to: "clients",
    path: "super-admin/clients",
    Component: ClientsManagement,
    name: "Gestión de Clientes",
  },
  {
    to: "billing",
    path: "super-admin/billing",
    Component: BillingManagement,
    name: "Facturación",
  },
  {
    to: "new-customer-form",
    path: "super-admin/new-customer-form",
    Component: NewCustomerFormManager,
    name: "Formularios Nuevos Clientes",
  },
  {
    to: "news-and-guides",
    path: "super-admin/news-and-guides",
    Component: NewsAndGuides,
    name: "Novedades y Guías",
  },
  {
    to: "emails",
    path: "super-admin/emails",
    Component: EmailManagement,
    name: "Correos",
  },
  {
    to: "support-tickets",
    path: "super-admin/support-tickets",
    Component: SupportTicketsManagement,
    name: "Tickets Soporte",
  },
];
