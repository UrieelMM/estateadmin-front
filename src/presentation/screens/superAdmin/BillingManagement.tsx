import React, { useEffect, useState } from "react";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import InvoiceCreationModal from "../../components/superAdmin/invoices/InvoiceCreationModal";
import InvoicesTable from "../../components/superAdmin/invoices/InvoicesTable";
import useBillingStore, {
  InvoiceRecord,
} from "../../../store/superAdmin/BillingStore";
import useAIUsageAdminStore from "../../../store/superAdmin/AIUsageAdminStore";
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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { invoices, fetchInvoices } = useBillingStore();
  const {
    loading: aiUsageLoading,
    error: aiUsageError,
    totalRequests: aiTotalRequests,
    totalTokens: aiTotalTokens,
    totalInputTokens: aiInputTokens,
    totalOutputTokens: aiOutputTokens,
    byCondominium: aiByCondominium,
    byFeature: aiByFeature,
    fetchOverview: fetchAIOverview,
  } = useAIUsageAdminStore();

  useEffect(() => {
    const calculateStats = async () => {
      try {
        setLoading(true);

        // Cargar facturas para los cálculos estadísticos
        await fetchInvoices(100); // Cargar un buen número para estadísticas

        const totalPaid = invoices
          .filter((invoice) => invoice.status === "paid")
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        const totalPending = invoices
          .filter((invoice) => invoice.status === "pending")
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        const totalOverdue = invoices
          .filter((invoice) => invoice.status === "overdue")
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        const totalCanceled = invoices
          .filter((invoice) => invoice.status === "canceled")
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        // Calcular facturación del mes actual y anterior
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const currentMonthBilling = invoices
          .filter((invoice) => {
            const invoiceDate =
              invoice.createdAt && invoice.createdAt.toDate
                ? invoice.createdAt.toDate()
                : new Date(invoice.createdAt);
            return (
              invoiceDate.getMonth() === currentMonth &&
              invoiceDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const previousMonthBilling = invoices
          .filter((invoice) => {
            const invoiceDate =
              invoice.createdAt && invoice.createdAt.toDate
                ? invoice.createdAt.toDate()
                : new Date(invoice.createdAt);
            return (
              invoiceDate.getMonth() === previousMonth &&
              invoiceDate.getFullYear() === previousYear
            );
          })
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        // Calcular tasa de crecimiento
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
          totalBilling: totalPaid + totalPending + totalOverdue,
          currentMonthBilling,
          previousMonthBilling,
          growthRate,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error al calcular estadísticas:", error);
        toast.error("Error al cargar los datos estadísticos");
        setLoading(false);
      }
    };

    calculateStats();
  }, [fetchInvoices, invoices]);

  useEffect(() => {
    fetchAIOverview(7);
  }, [fetchAIOverview]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const handleViewInvoice = (invoice: InvoiceRecord) => {
    // Implementar visualización detallada de factura
    console.log("Ver detalles de factura:", invoice);
  };

  const handleMarkAsPaid = (_invoice: InvoiceRecord) => {
    // Implementar marcar como pagado
    toast.success("Esta funcionalidad será implementada próximamente");
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

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Consumo IA (últimos 7 días)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Seguimiento global y por condominio para control de costos.
          </p>
        </div>

        {aiUsageError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {aiUsageError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Requests IA</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {aiUsageLoading ? "..." : aiTotalRequests.toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tokens totales</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {aiUsageLoading ? "..." : aiTotalTokens.toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Input tokens</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {aiUsageLoading ? "..." : aiInputTokens.toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Output tokens</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {aiUsageLoading ? "..." : aiOutputTokens.toLocaleString("es-MX")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Top condominios por tokens
            </p>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-2">Cliente</th>
                    <th className="py-2 pr-2">Condominio</th>
                    <th className="py-2 pr-2">Requests</th>
                    <th className="py-2 pr-2">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {aiByCondominium.slice(0, 10).map((row) => (
                    <tr key={row.key} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2">{row.clientId}</td>
                      <td className="py-2 pr-2">{row.condominiumId}</td>
                      <td className="py-2 pr-2">{row.totalRequests.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-2">{row.totalTokens.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Consumo por feature
            </p>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-2">Feature</th>
                    <th className="py-2 pr-2">Requests</th>
                    <th className="py-2 pr-2">Input</th>
                    <th className="py-2 pr-2">Output</th>
                    <th className="py-2 pr-2">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {aiByFeature.map((row) => (
                    <tr key={row.feature} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2">{row.feature}</td>
                      <td className="py-2 pr-2">{row.totalRequests.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-2">{row.inputTokens.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-2">{row.outputTokens.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-2">{row.totalTokens.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1"></div>
        <div className="flex space-x-2">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Factura
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Componente de tabla de facturas */}
      <InvoicesTable
        onViewInvoice={handleViewInvoice}
        onMarkAsPaid={handleMarkAsPaid}
      />

      {/* Modal de creación de facturas */}
      <InvoiceCreationModal
        open={isInvoiceModalOpen}
        setOpen={setIsInvoiceModalOpen}
        onSuccess={() => {
          // Recargar los datos de facturación después de crear una nueva factura
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default BillingManagement;
