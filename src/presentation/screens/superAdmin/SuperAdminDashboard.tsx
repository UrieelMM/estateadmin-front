import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  UsersIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

interface DashboardStat {
  name: string;
  value: number;
  icon: React.ElementType;
  change: number;
  color: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        // Simulamos carga de datos
        setTimeout(() => {
          setStats([
            {
              name: "Clientes Activos",
              value: 42,
              icon: BuildingOffice2Icon,
              change: 12,
              color: "bg-blue-500",
            },
            {
              name: "Usuarios Registrados",
              value: 167,
              icon: UsersIcon,
              change: 3.2,
              color: "bg-green-500",
            },
            {
              name: "Ingresos Mensuales",
              value: 48500,
              icon: CreditCardIcon,
              change: 5.4,
              color: "bg-purple-500",
            },
            {
              name: "Instancias Activas",
              value: 27,
              icon: ServerIcon,
              change: -2.1,
              color: "bg-indigo-500",
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        setError("Error al cargar datos del dashboard");
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-MX").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                  <div className="ml-5 w-full">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="mt-2 h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error al cargar datos
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Panel de Control Super Admin
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vista global de la plataforma y todos los clientes
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stat.name.includes("Ingresos")
                          ? formatCurrency(stat.value)
                          : formatNumber(stat.value)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div
                  className={`flex items-center text-sm ${
                    stat.change >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    desde el mes pasado
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de actividad reciente */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Actividad de la Plataforma
          </h3>
          <div className="mt-4 h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Gráfico de actividad reciente</p>
              <p className="text-sm mt-2">
                (Implementación de gráficos pendiente)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes recientes */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Clientes Recientes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Últimos clientes registrados en la plataforma
            </p>
          </div>
          <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
            Ver todos
          </button>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Datos simulados - Implementación pendiente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
