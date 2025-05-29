import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  UserGroupIcon,
  WrenchIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentCheckIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/solid";

export const navigation = [
  { name: "Inicio", href: "/dashboard/home", icon: HomeIcon, current: false },
  {
    name: "Usuarios",
    icon: UsersIcon,
    current: false,
    children: [
      { name: "Registro de condominos", href: "/dashboard/users-registration" },
      { name: "Condominos", href: "/dashboard/users" },
    ],
  },
  {
    name: "Finanzas",
    icon: ChartBarIcon,
    current: false,
    children: [
      { name: "Ingresos", href: "/dashboard/income" },
      { name: "Caja Chica", href: "/dashboard/pettycash" },
      { name: "Egresos", href: "/dashboard/expenses" },
      { name: "Balance General", href: "/dashboard/balance" },
      { name: "Cargos", href: "/dashboard/charges" },
      {
        name: "Recibos y Comprobantes",
        href: "/dashboard/receipts-and-invoices",
      },
      { name: "Proyectos", href: "/dashboard/projects" },
    ],
  },
  {
    name: "Comunidad",
    href: "/dashboard/community",
    icon: UserGroupIcon,
    current: false,
    children: [
      { name: "Áreas comunes", href: "/dashboard/common-areas" },
      { name: "Calendario", href: "/dashboard/calendar" },
      { name: "Publicaciones", href: "/dashboard/publications" },
    ],
  },
  {
    name: "Paquetería",
    href: "/dashboard/parcel-reception",
    icon: TruckIcon,
    current: false,
  },
  {
    name: "Mantenimiento",
    href: "/dashboard/maintenance-reports",
    icon: WrenchIcon,
    current: false,
  },
  {
    name: "Proveedores",
    href: "/dashboard/providers",
    icon: BuildingStorefrontIcon,
    current: false,
  },
  // {
  //   name: "Planificación",
  //   href: "/dashboard/planning",
  //   icon: CalendarDaysIcon,
  //   current: false,
  // },
  {
    name: "Inventario",
    href: "/dashboard/inventory",
    icon: ClipboardDocumentCheckIcon,
    current: false,
  },
  {
    name: "Personal",
    href: "/dashboard/personal-administration",
    icon: RectangleGroupIcon,
    current: false,
  },
];
