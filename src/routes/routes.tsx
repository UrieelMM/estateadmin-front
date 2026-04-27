import React from "react";

const Calendar = React.lazy(
  () => import("../presentation/screens/dashboard/calendar/Calendar"),
);
const ClientConfig = React.lazy(
  () => import("../presentation/screens/dashboard/config/ClientConfig"),
);
const Balance = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/Balance/Balance"),
);
const Charges = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/Charges/Charges"),
);
const Expenses = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/Expenses/Expenses"),
);
const Income = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/Income/Income"),
);
const FinancialReconciliation = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/Reconciliation/FinancialReconciliation"),
);
const DashboardHome = React.lazy(
  () => import("../presentation/screens/dashboard/home/DashboardHome"),
);
const Maintenance = React.lazy(
  () => import("../presentation/screens/dashboard/maintenance/Maintenance"),
);
const ParcelReception = React.lazy(
  () =>
    import("../presentation/screens/dashboard/parcel-reception/ParcelReception"),
);
const Projects = React.lazy(
  () => import("../presentation/screens/dashboard/projects/Projects"),
);
const ProviderList = React.lazy(
  () => import("../presentation/screens/dashboard/providers/ProvidersList"),
);
const Publications = React.lazy(
  () => import("../presentation/screens/dashboard/publications/Publications"),
);
const UsersRegistration = React.lazy(
  () => import("../presentation/screens/dashboard/users/UsersRegistration"),
);
const UsersScreen = React.lazy(
  () => import("../presentation/screens/dashboard/users/UsersScreen"),
);
const PaymentSuccess = React.lazy(
  () =>
    import("../presentation/screens/dashboard/client/redirects/PaymentSuccess"),
);
const PaymentCancel = React.lazy(
  () =>
    import("../presentation/screens/dashboard/client/redirects/PaymentCancel"),
);
const ReceiptsAndInvoices = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/ReceiptsAndInvoices/ReceiptsAndInvoices"),
);
const PettyCash = React.lazy(
  () =>
    import("../presentation/screens/dashboard/financialIncome/PettyCash/PettyCash"),
);
const InventoryCategories = React.lazy(
  () =>
    import("../presentation/screens/dashboard/inventory/InventoryCategories"),
);
const InventoryItemDetail = React.lazy(
  () =>
    import("../presentation/screens/dashboard/inventory/InventoryItemDetail"),
);
const InventoryList = React.lazy(
  () => import("../presentation/screens/dashboard/inventory/InventoryList"),
);
const InventoryMovements = React.lazy(
  () =>
    import("../presentation/screens/dashboard/inventory/InventoryMovements"),
);
const InventoryAlerts = React.lazy(
  () => import("../presentation/screens/dashboard/inventory/InventoryAlerts"),
);
const CommonAreas = React.lazy(
  () => import("../presentation/screens/dashboard/commonAreas/CommonAreas"),
);
const PersonalDashboard = React.lazy(
  () =>
    import("../presentation/screens/dashboard/PersonalAdministration/PersonalDashboard"),
);
const AuditTrail = React.lazy(
  () => import("../presentation/screens/dashboard/audit/AuditTrail"),
);
const ScheduledVisits = React.lazy(
  () =>
    import("../presentation/screens/dashboard/scheduledVisits/ScheduledVisits"),
);

export const routesApp = [
  {
    to: "/dashboard/home",
    icon: "fa-solid fa-spell-check",
    title: "Usuarios",
    description: "Home",
    component: <DashboardHome />,
  },
  {
    to: "/dashboard/users-registration",
    icon: "fa-solid fa-spell-check",
    title: "Usuarios",
    description: "Gestión de usuarios",
    component: <UsersRegistration />,
  },
  {
    to: "/dashboard/users",
    icon: "fa-solid fa-spell-check",
    title: "Usuarios",
    description: "Gestión de usuarios",
    component: <UsersScreen />,
  },
  {
    to: "/dashboard/calendar",
    icon: "fa-solid fa-spell-check",
    title: "Calendario",
    description: "Calendario de eventos en el condominio",
    component: <Calendar />,
  },
  {
    to: "/dashboard/parcel-reception",
    icon: "fa-solid fa-spell-check",
    title: "Paquetería",
    description: "Gestión de paquetería en el condominio",
    component: <ParcelReception />,
  },
  {
    to: "/dashboard/providers",
    icon: "fa-solid fa-spell-check",
    title: "Proveedores",
    description: "Gestión de proveedores en el condominio",
    component: <ProviderList />,
  },
  {
    to: "/dashboard/publications",
    icon: "fa-solid fa-spell-check",
    title: "Publicaciones",
    description: "Gestión de publicaciones en el condominio",
    component: <Publications />,
  },
  {
    to: "/dashboard/income/*",
    icon: "fa-solid fa-spell-check",
    title: "Cuotas",
    description: "Gestión de cuotas de mantenimiento",
    component: <Income />,
  },
  {
    to: "/dashboard/charges",
    icon: "fa-solid fa-spell-check",
    title: "Cargos",
    description: "Gestión de cargos",
    component: <Charges />,
  },
  {
    to: "/dashboard/client-config/*",
    icon: "fa-solid fa-spell-check",
    title: "Configuración",
    description: "Configuración del cliente",
    component: <ClientConfig />,
  },
  {
    to: "/dashboard/maintenance-reports/*",
    icon: "fa-solid fa-spell-check",
    title: "Mantenimiento de condominio",
    description: "Gestión de reportes de mantenimiento",
    component: <Maintenance />,
  },
  {
    to: "/dashboard/expenses/*",
    icon: "fa-solid fa-spell-check",
    title: "Registro de gastos",
    description: "Gestión de gastos",
    component: <Expenses />,
  },
  {
    to: "/dashboard/reconciliation/*",
    icon: "fa-solid fa-scale-balanced",
    title: "Conciliación",
    description: "Conciliación bancaria de ingresos y egresos",
    component: <FinancialReconciliation />,
  },
  {
    to: "/dashboard/audit-trail",
    icon: "fa-solid fa-clipboard-list",
    title: "Auditoría",
    description: "Bitácora de acciones críticas del sistema",
    component: <AuditTrail />,
  },
  {
    to: "/dashboard/balance/*",
    icon: "fa-solid fa-spell-check",
    title: "Balance general",
    description: "Balance general de ingresos y egresos",
    component: <Balance />,
  },
  {
    to: "/dashboard/payment-success",
    icon: "fa-solid fa-check-circle",
    title: "Pago Exitoso",
    description: "Pago procesado exitosamente",
    component: <PaymentSuccess />,
  },
  {
    to: "/dashboard/payment-cancel",
    icon: "fa-solid fa-times-circle",
    title: "Pago Cancelado",
    description: "Pago cancelado",
    component: <PaymentCancel />,
  },
  {
    to: "/dashboard/projects",
    icon: "fa-solid fa-diagram-project",
    title: "Proyectos",
    description: "Gestión de proyectos de mejoras",
    component: <Projects />,
  },
  {
    to: "/dashboard/receipts-and-invoices/*",
    icon: "fa-solid fa-file-invoice",
    title: "Recibos y Comprobantes",
    description: "Gestión de recibos y comprobantes",
    component: <ReceiptsAndInvoices />,
  },
  {
    to: "/dashboard/pettycash/*",
    icon: "fa-solid fa-cash-register",
    title: "Caja chica",
    description: "Gestión de caja chica",
    component: <PettyCash />,
  },
  {
    to: "/dashboard/inventory",
    icon: "fa-solid fa-boxes-stacked",
    title: "Inventario",
    description: "Gestión de inventario del condominio",
    component: <InventoryList />,
  },
  {
    to: "/dashboard/inventory/items",
    icon: "fa-solid fa-boxes-stacked",
    title: "Inventario",
    description: "Gestión de inventario del condominio",
    component: <InventoryList />,
  },
  {
    to: "/dashboard/inventory/categories",
    icon: "fa-solid fa-tags",
    title: "Categorías de Inventario",
    description: "Gestión de categorías de inventario",
    component: <InventoryCategories />,
  },
  {
    to: "/dashboard/inventory/item/:id",
    icon: "fa-solid fa-box",
    title: "Detalle de Item",
    description: "Información detallada del ítem",
    component: <InventoryItemDetail />,
  },
  {
    to: "/dashboard/inventory/movements",
    icon: "fa-solid fa-arrows-rotate",
    title: "Movimientos de Inventario",
    description: "Historial de movimientos de inventario",
    component: <InventoryMovements />,
  },
  {
    to: "/dashboard/inventory/alerts",
    icon: "fa-solid fa-triangle-exclamation",
    title: "Alertas de Stock",
    description: "Items con stock bajo",
    component: <InventoryAlerts />,
  },
  {
    to: "/dashboard/common-areas",
    icon: "fa-solid fa-person-swimming",
    title: "Áreas Comunes",
    description: "Gestión de áreas comunes del condominio",
    component: <CommonAreas />,
  },
  {
    to: "/dashboard/personal-administration/*",
    icon: "fa-solid fa-user-gear",
    title: "Gestión de Personal",
    description: "Administración y control del personal del condominio",
    component: <PersonalDashboard />,
  },
  {
    to: "/dashboard/scheduled-visits",
    icon: "fa-solid fa-id-card",
    title: "Visitas",
    description: "Gestión de visitas agendadas con QR",
    component: <ScheduledVisits />,
  },
  // {
  //   to: "/dashboard/planning",
  //   icon: "fa-solid fa-calendar-check",
  //   title: "Planificación",
  //   description: "Gestión de planificaciones del condominio",
  //   component: <Planning />,
  // },
];
