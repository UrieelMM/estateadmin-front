import React from "react";
import BillingManagement from "../presentation/screens/superAdmin/BillingManagement";
import ClientsManagement from "../presentation/screens/superAdmin/ClientsManagement";
import SuperAdminDashboard from "../presentation/screens/superAdmin/SuperAdminDashboard";
import SystemSettings from "../presentation/screens/superAdmin/SystemSettings";
import UserManagement from "../presentation/screens/superAdmin/UserManagement";
import NewsAndGuides from "../presentation/screens/superAdmin/NewsAndGuides";
import { NewCustomerFormManager } from "../presentation/screens/superAdmin/newCustomerInformationForm";
import EmailManagement from "../presentation/screens/superAdmin/emails/EmailManagement";

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
    to: "users",
    path: "super-admin/users",
    Component: UserManagement,
    name: "Gestión de Usuarios",
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
    to: "settings",
    path: "super-admin/settings",
    Component: SystemSettings,
    name: "Configuración del Sistema",
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
];
