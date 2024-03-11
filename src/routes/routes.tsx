import CalendarEvents from "../presentation/screens/dashboard/calendar/CalendarEvents";
import DashboardHome from "../presentation/screens/dashboard/home/DashboardHome";
import ProviderList from "../presentation/screens/dashboard/providers/ProvidersList";
import UsersManagment from "../presentation/screens/dashboard/users/UsersManagment";
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
    to: "/dashboard/users-managment",
    icon: "fa-solid fa-spell-check",
    title: "Usuarios",
    description: "Gestión de usuarios",
    component: <UsersManagment />,
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
    component: <CalendarEvents />,
  },
  {
    to: "/dasboard/providers",
    icon: "fa-solid fa-spell-check",
    title: "Proveedores",
    description: "Gestión de proveedores en el condominio",
    component: <ProviderList />,
  },

];
