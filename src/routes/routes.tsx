import Calendar from "../presentation/screens/dashboard/calendar/Calendar";
import ClientConfig from "../presentation/screens/dashboard/config/ClientConfig";
import Charges from "../presentation/screens/dashboard/financialIncome/Charges/Charges";
import Expenses from "../presentation/screens/dashboard/financialIncome/Expenses/Expenses";
import Income from "../presentation/screens/dashboard/financialIncome/Income/Income";
import DashboardHome from "../presentation/screens/dashboard/home/DashboardHome";
import Maintenance from "../presentation/screens/dashboard/maintenance/Maintenance";
import ParcelReception from "../presentation/screens/dashboard/parcel-reception/ParcelReception";
import ProviderList from "../presentation/screens/dashboard/providers/ProvidersList";
import Publications from "../presentation/screens/dashboard/publications/Publications";
import UsersRegistration from "../presentation/screens/dashboard/users/UsersRegistration";
import UsersScreen from "../presentation/screens/dashboard/users/UsersScreen";


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
    to: "/dasboard/parcel-reception",
    icon: "fa-solid fa-spell-check",
    title: "Paquetería",
    description: "Gestión de paquetería en el condominio",
    component: <ParcelReception />,
  },
  {
    to: "/dasboard/providers",
    icon: "fa-solid fa-spell-check",
    title: "Proveedores",
    description: "Gestión de proveedores en el condominio",
    component: <ProviderList />,
  },
  {
    to: "/dasboard/publications",
    icon: "fa-solid fa-spell-check",
    title: "Publicaciones",
    description: "Gestión de publicaciones en el condominio",
    component: <Publications  />,
  },
  {
    to: "/dashborad/income",
    icon: "fa-solid fa-spell-check",
    title: "Cuotas",
    description: "Gestión de cuotas de mantenimiento",
    component: <Income  />,
  },
  {
    to: "/dashborad/charges",
    icon: "fa-solid fa-spell-check",
    title: "Cargos",
    description: "Gestión de cargos",
    component: <Charges  />,
  },
  {
    to: "/dashborad/client-config",
    icon: "fa-solid fa-spell-check",
    title: "Configuración",
    description: "Configuración del cliente",
    component: <ClientConfig />,
  },
  {
    to: "/dasboard/maintenance-reports",
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
];
