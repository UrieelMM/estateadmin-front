import React, { useEffect, useState } from "react";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import InvoiceCreationModal from "../../components/superAdmin/invoices/InvoiceCreationModal";
import InvoicesTable from "../../components/superAdmin/invoices/InvoicesTable";
import useBillingStore, {
  InvoiceRecord,
} from "../../../store/superAdmin/BillingStore";
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

  const handleMarkAsPaid = (invoice: InvoiceRecord) => {
    // Implementar marcar como pagado
    console.log("Marcar como pagado:", invoice);
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
