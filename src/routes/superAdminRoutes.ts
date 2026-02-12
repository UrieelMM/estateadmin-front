import React from "react";
import BillingManagement from "../presentation/screens/superAdmin/BillingManagement";
import ClientsManagement from "../presentation/screens/superAdmin/ClientsManagement";
import SuperAdminDashboard from "../presentation/screens/superAdmin/SuperAdminDashboard";
import NewsAndGuides from "../presentation/screens/superAdmin/NewsAndGuides";
import { NewCustomerFormManager } from "../presentation/screens/superAdmin/newCustomerInformationForm";
import EmailManagement from "../presentation/screens/superAdmin/emails/EmailManagement";
import SupportTicketsManagement from "../presentation/screens/superAdmin/SupportTicketsManagement";

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
