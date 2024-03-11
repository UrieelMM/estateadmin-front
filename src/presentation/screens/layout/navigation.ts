import { CalendarIcon, HomeIcon, UsersIcon, ChartBarIcon, UserGroupIcon, WrenchIcon, TruckIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

export const navigation = [
  { name: 'Inicio', href: '/dashboard/home', icon: HomeIcon, current: false },
  {
    name: 'Usuarios',
    icon: UsersIcon,
    current: false,
    children: [
      { name: 'Registro de usuarios', href: '/dashboard/users-registration' },
      { name: 'Gestión de usuarios', href: '/dashboard/users-managment' },
      { name: 'Usuarios', href: '/dashboard/users' },
    ],
  },
  {
    name: 'Finanzas',
    icon: ChartBarIcon,
    current: false,
    children: [
      { name: 'Facturación', href: '#' },
      { name: 'Egresos', href: '#' },
      { name: 'Ingresos', href: '#' },
    ],
  },
  { name: 'Calendario', href: '/dashboard/calendar', icon: CalendarIcon, current: false },
  { name: 'Áreas comunes', href: '/dasboard/common-areas', icon: UserGroupIcon, current: false },
  { name: 'Paquetería', href: '/dasboard/parcel-reception', icon: TruckIcon, current: false },
  { name: 'Mantenimiento', href: '/dasboard/maintenance', icon: WrenchIcon, current: false },
  { name: 'Proveedores', href: '/dasboard/providers', icon: BuildingStorefrontIcon, current: false },
]
