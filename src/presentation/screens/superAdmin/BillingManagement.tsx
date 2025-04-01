import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface BillingRecord {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "canceled";
  invoiceNumber: string;
  concept: string;
  createdAt: any; // Firestore timestamp
  dueDate: any; // Firestore timestamp
  paidDate?: any; // Firestore timestamp, opcional
  plan: string;
}

const statusColors = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

interface BillingStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalCanceled: number;
  totalBilling: number;
  currentMonthBilling: number;
  previousMonthBilling: number;
  growthRate: number;
}

const BillingManagement: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalCanceled: 0,
    totalBilling: 0,
    currentMonthBilling: 0,
    previousMonthBilling: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        // En una implementación real, estos datos vendrían de Firestore
        // Aquí simulamos una carga de datos
        setTimeout(() => {
          const mockData: BillingRecord[] = [
            {
              id: "bill1",
              clientId: "client1",
              clientName: "Condominio Las Palmas",
              amount: 1200,
              status: "paid",
              invoiceNumber: "INV-2024-001",
              concept: "Suscripción Mensual",
              createdAt: { toDate: () => new Date("2024-03-01") },
              dueDate: { toDate: () => new Date("2024-03-15") },
              paidDate: { toDate: () => new Date("2024-03-10") },
              plan: "Premium",
            },
            {
              id: "bill2",
              clientId: "client2",
              clientName: "Residencial Los Robles",
              amount: 800,
              status: "paid",
              invoiceNumber: "INV-2024-002",
              concept: "Suscripción Mensual",
              createdAt: { toDate: () => new Date("2024-03-01") },
              dueDate: { toDate: () => new Date("2024-03-15") },
              paidDate: { toDate: () => new Date("2024-03-12") },
              plan: "Básico",
            },
            {
              id: "bill3",
              clientId: "client3",
              clientName: "Torres de Aragón",
              amount: 1500,
              status: "pending",
              invoiceNumber: "INV-2024-003",
              concept: "Suscripción Mensual",
              createdAt: { toDate: () => new Date("2024-04-01") },
              dueDate: { toDate: () => new Date("2024-04-15") },
              plan: "Empresarial",
            },
            {
              id: "bill4",
              clientId: "client4",
              clientName: "Conjunto Pacific Hills",
              amount: 1200,
              status: "overdue",
              invoiceNumber: "INV-2024-004",
              concept: "Suscripción Mensual",
              createdAt: { toDate: () => new Date("2024-03-01") },
              dueDate: { toDate: () => new Date("2024-03-15") },
              plan: "Premium",
            },
            {
              id: "bill5",
              clientId: "client5",
              clientName: "Condominio Vista Real",
              amount: 1000,
              status: "canceled",
              invoiceNumber: "INV-2024-005",
              concept: "Suscripción Mensual",
              createdAt: { toDate: () => new Date("2024-02-01") },
              dueDate: { toDate: () => new Date("2024-02-15") },
              plan: "Estándar",
            },
          ];

          setBillingRecords(mockData);

          // Calcular estadísticas
          const totalPaid = mockData
            .filter((record) => record.status === "paid")
            .reduce((sum, record) => sum + record.amount, 0);

          const totalPending = mockData
            .filter((record) => record.status === "pending")
            .reduce((sum, record) => sum + record.amount, 0);

          const totalOverdue = mockData
            .filter((record) => record.status === "overdue")
            .reduce((sum, record) => sum + record.amount, 0);

          const totalCanceled = mockData
            .filter((record) => record.status === "canceled")
            .reduce((sum, record) => sum + record.amount, 0);

          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();

          const currentMonthBilling = mockData
            .filter((record) => {
              const recordDate = record.createdAt.toDate();
              return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear
              );
            })
            .reduce((sum, record) => sum + record.amount, 0);

          const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const previousYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

          const previousMonthBilling = mockData
            .filter((record) => {
              const recordDate = record.createdAt.toDate();
              return (
                recordDate.getMonth() === previousMonth &&
                recordDate.getFullYear() === previousYear
              );
            })
            .reduce((sum, record) => sum + record.amount, 0);

          const growthRate =
            previousMonthBilling !== 0
              ? ((currentMonthBilling - previousMonthBilling) /
                  previousMonthBilling) *
                100
              : 0;

          setStats({
            totalPaid,
            totalPending,
            totalOverdue,
            totalCanceled,
            totalBilling: totalPaid + totalPending + totalOverdue, // Excluye cancelados
            currentMonthBilling,
            previousMonthBilling,
            growthRate,
          });

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error al cargar datos de facturación:", error);
        toast.error("Error al cargar los datos de facturación");
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredRecords = billingRecords.filter(
    (record) =>
      record.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.concept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado";
      case "pending":
        return "Pendiente";
      case "overdue":
        return "Vencido";
      case "canceled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Facturación
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra la facturación de todos los clientes
        </p>
      </div>

      {/* Estadísticas de facturación */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CreditCardIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Facturación Total
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {loading ? (
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      ) : (
                        formatCurrency(stats.totalBilling)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <DocumentTextIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pagado
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {loading ? (
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      ) : (
                        formatCurrency(stats.totalPaid)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <DocumentTextIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pendiente
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {loading ? (
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      ) : (
                        formatCurrency(stats.totalPending)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <DocumentTextIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Vencido
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {loading ? (
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      ) : (
                        formatCurrency(stats.totalOverdue)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          {/* Barra de búsqueda */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm max-w-lg">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Buscar facturas..."
              />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Factura
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="animate-pulse p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Factura
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Plan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Monto
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Fecha Emisión
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Fecha Vencimiento
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {record.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {record.concept}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {record.clientName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {record.clientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[record.status]
                        }`}
                      >
                        {formatStatus(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.createdAt.toDate().toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.dueDate.toDate().toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Descargar PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        {record.status === "pending" && (
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Marcar como pagado"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingManagement;
