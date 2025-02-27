import { HomeIcon, UsersIcon, ChartBarIcon, UserGroupIcon, WrenchIcon, TruckIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

export const navigation = [
  { name: 'Inicio', href: '/dashboard/home', icon: HomeIcon, current: false },
  {
    name: 'Usuarios',
    icon: UsersIcon,
    current: false,
    children: [
      { name: 'Registro de condominos', href: '/dashboard/users-registration' },
      { name: 'Condominos', href: '/dashboard/users' },
    ],
  },
  {
    name: 'Finanzas',
    icon: ChartBarIcon,
    current: false,
    children: [
      { name: 'Egresos', href: '/dashboard/expenses' },
      { name: 'Ingresos', href: '/dashborad/income' },
      { name: 'Cargos', href: '/dashborad/charges' },
    ],
  },
  { name: 'Comunidad', href: '/dasboard/community', icon: UserGroupIcon, current: false, children: [
    { name: 'Áreas comunes', href: '/dashboard/events' },
    { name: 'Calendario', href: '/dashboard/calendar' },
    { name: 'Publicaciones', href: '/dasboard/publications' },
    { name: 'Visitas', href: '/dashboard/home' },
    { name: 'Votaciones', href: '/dashboard/home' },
  ]},
  { name: 'Paquetería', href: '/dasboard/parcel-reception', icon: TruckIcon, current: false },
  { name: 'Mantenimiento', href: '/dasboard/maintenance-reports', icon: WrenchIcon, current: false },
  { name: 'Proveedores', href: '/dasboard/providers', icon: BuildingStorefrontIcon, current: false },
]
