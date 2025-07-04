import Calendar from "../presentation/screens/dashboard/calendar/Calendar";
import ClientConfig from "../presentation/screens/dashboard/config/ClientConfig";
import Balance from "../presentation/screens/dashboard/financialIncome/Balance/Balance";
import Charges from "../presentation/screens/dashboard/financialIncome/Charges/Charges";
import Expenses from "../presentation/screens/dashboard/financialIncome/Expenses/Expenses";
import Income from "../presentation/screens/dashboard/financialIncome/Income/Income";
import DashboardHome from "../presentation/screens/dashboard/home/DashboardHome";
import Maintenance from "../presentation/screens/dashboard/maintenance/Maintenance";
import ParcelReception from "../presentation/screens/dashboard/parcel-reception/ParcelReception";
import Projects from "../presentation/screens/dashboard/projects/Projects";
import ProviderList from "../presentation/screens/dashboard/providers/ProvidersList";
import Publications from "../presentation/screens/dashboard/publications/Publications";
import UsersRegistration from "../presentation/screens/dashboard/users/UsersRegistration";
import UsersScreen from "../presentation/screens/dashboard/users/UsersScreen";
import PaymentSuccess from "../presentation/screens/dashboard/client/redirects/PaymentSuccess";
import PaymentCancel from "../presentation/screens/dashboard/client/redirects/PaymentCancel";
import ReceiptsAndInvoices from "../presentation/screens/dashboard/financialIncome/ReceiptsAndInvoices/ReceiptsAndInvoices";
import PettyCash from "../presentation/screens/dashboard/financialIncome/PettyCash/PettyCash";
import PettyCashDashboard from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashDashboard";
import PettyCashExpenseForm from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashExpenseForm";
import PettyCashAuditForm from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashAuditForm";
import PettyCashReplenishForm from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashReplenishForm";
import PettyCashSetupForm from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashSetupForm";
import PettyCashTransactions from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashTransactions";
import PettyCashAudits from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashAudits";
import PettyCashHistory from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashHistory";
import PettyCashFinalize from "../presentation/screens/dashboard/financialIncome/PettyCash/components/PettyCashFinalize";
import InventoryCategories from "../presentation/screens/dashboard/inventory/InventoryCategories";
import InventoryItemDetail from "../presentation/screens/dashboard/inventory/InventoryItemDetail";
import InventoryList from "../presentation/screens/dashboard/inventory/InventoryList";
import InventoryMovements from "../presentation/screens/dashboard/inventory/InventoryMovements";
import InventoryAlerts from "../presentation/screens/dashboard/inventory/InventoryAlerts";
import CommonAreas from "../presentation/screens/dashboard/commonAreas/CommonAreas";
import PersonalDashboard from "../presentation/screens/dashboard/PersonalAdministration/PersonalDashboard";

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
    to: "/dashboard/income",
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
    to: "/dashboard/client-config",
    icon: "fa-solid fa-spell-check",
    title: "Configuración",
    description: "Configuración del cliente",
    component: <ClientConfig />,
  },
  {
    to: "/dashboard/maintenance-reports",
    icon: "fa-solid fa-spell-check",
    title: "Mantenimiento de condominio",
    description: "Gestión de reportes de mantenimiento",
    component: <Maintenance />,
  },
  {
    to: "/dashboard/expenses",
    icon: "fa-solid fa-spell-check",
    title: "Registro de gastos",
    description: "Gestión de gastos",
    component: <Expenses />,
  },
  {
    to: "/dashboard/balance",
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
    to: "/dashboard/receipts-and-invoices",
    icon: "fa-solid fa-file-invoice",
    title: "Recibos y Comprobantes",
    description: "Gestión de recibos y comprobantes",
    component: <ReceiptsAndInvoices />,
  },
  {
    to: "/dashboard/pettycash",
    icon: "fa-solid fa-cash-register",
    title: "Caja chica",
    description: "Gestión de caja chica",
    component: <PettyCash />,
  },
  {
    to: "/dashboard/pettycash/setup",
    icon: "fa-solid fa-cog",
    title: "Configuración de Caja Chica",
    description: "Configuración inicial de caja chica",
    component: <PettyCashSetupForm />,
  },
  {
    to: "/dashboard/pettycash/expense",
    icon: "fa-solid fa-receipt",
    title: "Registrar Gasto",
    description: "Registrar gasto de caja chica",
    component: <PettyCashExpenseForm />,
  },
  {
    to: "/dashboard/pettycash/audit",
    icon: "fa-solid fa-clipboard-check",
    title: "Cierre de Caja",
    description: "Realizar Cierre de caja chica",
    component: <PettyCashAuditForm />,
  },
  {
    to: "/dashboard/pettycash/replenish",
    icon: "fa-solid fa-money-bill",
    title: "Reposición de Fondos",
    description: "Reponer fondos de caja chica",
    component: <PettyCashReplenishForm />,
  },
  {
    to: "/dashboard/pettycash/audits",
    icon: "fa-solid fa-clipboard-list",
    title: "Administrar Cierres",
    description: "Administrar Cierres de caja chica",
    component: <PettyCashAudits />,
  },
  {
    to: "/dashboard/pettycash/transactions",
    icon: "fa-solid fa-list",
    title: "Transacciones",
    description: "Ver transacciones de caja chica",
    component: <PettyCashTransactions />,
  },
  {
    to: "/dashboard/pettycash/dashboard",
    icon: "fa-solid fa-list",
    title: "Dashboard",
    description: "Dashboard de caja chica",
    component: <PettyCashDashboard />,
  },
  {
    to: "/dashboard/pettycash/history",
    icon: "fa-solid fa-history",
    title: "Historial de Cajas",
    description: "Ver historial de cajas chica cerradas",
    component: <PettyCashHistory />,
  },
  {
    to: "/dashboard/pettycash/finalize",
    icon: "fa-solid fa-flag-checkered",
    title: "Finalizar Caja",
    description: "Finalizar caja actual y crear nueva",
    component: <PettyCashFinalize />,
  },
  {
    to: "/dashboard/inventory",
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
    to: "/dashboard/personal-administration",
    icon: "fa-solid fa-user-gear",
    title: "Gestión de Personal",
    description: "Administración y control del personal del condominio",
    component: <PersonalDashboard />,
  },
  // {
  //   to: "/dashboard/planning",
  //   icon: "fa-solid fa-calendar-check",
  //   title: "Planificación",
  //   description: "Gestión de planificaciones del condominio",
  //   component: <Planning />,
  // },
];
