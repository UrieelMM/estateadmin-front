import React from "react";
import BillingManagement from "../presentation/screens/superAdmin/BillingManagement";
import ClientsManagement from "../presentation/screens/superAdmin/ClientsManagement";
import SuperAdminDashboard from "../presentation/screens/superAdmin/SuperAdminDashboard";
import SystemSettings from "../presentation/screens/superAdmin/SystemSettings";
import UserManagement from "../presentation/screens/superAdmin/UserManagement";

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
    to: "settings",
    path: "super-admin/settings",
    Component: SystemSettings,
    name: "Configuración del Sistema",
  },
];
