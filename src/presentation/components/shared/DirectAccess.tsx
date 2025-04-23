import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PresentationChartBarIcon,
  Cog6ToothIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { Card } from "@heroui/react";

const items = [
  {
    title: "Panel Principal",
    description: "Visualiza las estadísticas y resumen general del condominio.",
    icon: HomeIcon,
    background: "bg-indigo-600 dark:bg-indigo-500",
    href: "/dashboard/home",
  },
  {
    title: "Gestión de Residentes",
    description: "Administra los usuarios, permisos y accesos del condominio.",
    icon: UserGroupIcon,
    background: "bg-blue-600 dark:bg-blue-500",
    href: "/dashboard/users",
  },
  {
    title: "Control de Pagos",
    description: "Registra y supervisa los pagos de mantenimiento y servicios.",
    icon: CurrencyDollarIcon,
    background: "bg-green-600 dark:bg-green-500",
    href: "/dashborad/income",
  },
  {
    title: "Egresos",
    description: "Registra y supervisa los egresos del condominio.",
    icon: BanknotesIcon,
    background: "bg-yellow-600 dark:bg-yellow-500",
    href: "/dashboard/expenses",
  },
  {
    title: "Proyectos",
    description: "Gestiona los proyectos del condominio.",
    icon: PresentationChartBarIcon,
    background: "bg-red-600 dark:bg-red-500",
    href: "/dashboard/projects",
  },
  {
    title: "Configuración",
    description: "Personaliza la configuración general del condominio.",
    icon: Cog6ToothIcon,
    background: "bg-purple-600 dark:bg-purple-500",
    href: "/dashboard/client-config",
  },
];

const DirectAccess = () => {
  return (
    <Card className="w-full">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Accesos Directos
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Accede rápidamente a las funciones principales del sistema.
      </p>
      <div
        className="mt-6 w-full grid grid-cols-1 gap-4 
                   sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item, itemIdx) => (
          <Link
            key={itemIdx}
            to={item.href}
            className="group relative flex items-center gap-4 rounded-xl p-4 
                     transition-all duration-200 ease-in-out
                     bg-white dark:bg-gray-800
                     hover:bg-gray-50 dark:hover:bg-gray-700
                     border border-gray-200 dark:border-gray-700
                     shadow-sm hover:shadow-md"
          >
            <div
              className={`${item.background} 
                         flex h-12 w-12 items-center justify-center rounded-lg 
                         shadow-lg group-hover:scale-110 transition-transform duration-200`}
            >
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default DirectAccess;
