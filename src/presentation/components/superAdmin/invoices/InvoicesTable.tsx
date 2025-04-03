import React, { useState, useEffect } from "react";
import {
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import useBillingStore, {
  InvoiceRecord,
} from "../../../../store/superAdmin/BillingStore";
import LoadingApp from "../../shared/loaders/LoadingApp";
import toast from "react-hot-toast";

interface InvoicesTableProps {
  onViewInvoice?: (invoice: InvoiceRecord) => void;
  onMarkAsPaid?: (invoice: InvoiceRecord) => void;
}

const ITEMS_PER_PAGE = 20;

const formatDate = (timestamp: any): string => {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-MX");
  } catch (error) {
    return "Fecha inválida";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const statusColors = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
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

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  onViewInvoice,
  onMarkAsPaid,
}) => {
  const {
    fetchInvoices,
    invoices,
    lastInvoiceDoc,
    loadingInvoices,
    resetInvoicesState,
    searchInvoiceByFolio,
  } = useBillingStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [folio, setFolio] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    clientId?: string;
  }>({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<InvoiceRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar facturas iniciales
  useEffect(() => {
    const loadInitialInvoices = async () => {
      try {
        const count = await fetchInvoices(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar facturas iniciales:", error);
        toast.error("Error al cargar las facturas");
      }
    };

    loadInitialInvoices();

    // Limpiar estado al desmontar
    return () => {
      resetInvoicesState();
    };
  }, [fetchInvoices, resetInvoicesState, filters]);

  // Manejar búsqueda por folio
  const handleFolioChange = async (value: string) => {
    setFolio(value);

    if (value.trim()) {
      setIsSearching(true);
      try {
        const results = await searchInvoiceByFolio(value.trim());
        setSearchResults(results);
        setShowSearchModal(true);
      } catch (error) {
        console.error("Error al buscar por folio:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowSearchModal(false);
      setSearchResults([]);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: string, value: string) => {
    if (loadingInvoices) return;

    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete newFilters[key as keyof typeof newFilters];
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Manejar cambio de página
  const handlePageChange = async (newPage: number) => {
    if (loadingInvoices || newPage === currentPage) return;

    try {
      if (newPage > currentPage) {
        // Avanzar a la siguiente página
        const count = await fetchInvoices(
          ITEMS_PER_PAGE,
          lastInvoiceDoc,
          filters
        );
        setHasMore(count === ITEMS_PER_PAGE);
      } else {
        // Volver a la primera página
        const count = await fetchInvoices(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
      }

      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    }
  };

  const totalPages = hasMore ? currentPage + 1 : currentPage;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Facturas
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Lista de todas las facturas generadas para los clientes
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-4">
          {/* Barra de búsqueda por folio */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              value={folio}
              onChange={(e) => handleFolioChange(e.target.value)}
              placeholder="Buscar por folio..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="shadow-lg rounded p-4">
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Estado
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabla */}
      {invoices.length > 0 ? (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                      >
                        <div className="flex items-center gap-1">
                          Factura
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-20 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Número de factura
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Cliente
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Monto
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Fecha de Emisión
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Fecha de Vencimiento
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {invoice.invoiceNumber}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {invoice.concept}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {invoice.clientName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[invoice.status]
                            }`}
                          >
                            {formatStatus(invoice.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Ver detalles"
                              onClick={() =>
                                onViewInvoice && onViewInvoice(invoice)
                              }
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Descargar PDF"
                              onClick={() => {
                                if (invoice.invoiceURL) {
                                  window.open(invoice.invoiceURL, "_blank");
                                } else {
                                  toast.error(
                                    "No hay factura disponible para descargar"
                                  );
                                }
                              }}
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            {invoice.status === "pending" && (
                              <button
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Marcar como pagado"
                                onClick={() =>
                                  onMarkAsPaid && onMarkAsPaid(invoice)
                                }
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
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          {loadingInvoices ? (
            <div className="flex justify-center">
              <LoadingApp />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron facturas
            </p>
          )}
        </div>
      )}

      {/* Paginación */}
      {invoices.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Página <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loadingInvoices}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2 cursor-pointer"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? "z-10 bg-indigo-700 border-2 text-white border-indigo-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                          : "z-10 border-2 border-indigo-700 rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={loadingInvoices || !hasMore}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2 cursor-pointer"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de búsqueda por folio */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => {
                      setShowSearchModal(false);
                      setFolio("");
                    }}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Resultados de búsqueda por folio
                  </h3>

                  {isSearching ? (
                    <div className="flex justify-center items-center py-8">
                      <LoadingApp />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron facturas con el folio especificado
                    </div>
                  ) : (
                    <div className="mt-4 flow-root">
                      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle">
                          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th
                                  scope="col"
                                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                                >
                                  Factura
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Cliente
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Monto
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Estado
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Fecha de Emisión
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                              {searchResults.map((invoice) => (
                                <tr
                                  key={invoice.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {invoice.invoiceNumber}
                                      </span>
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {invoice.concept}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                    {invoice.clientName}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                    {formatCurrency(invoice.amount)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        statusColors[invoice.status]
                                      }`}
                                    >
                                      {formatStatus(invoice.status)}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                    {formatDate(invoice.createdAt)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        title="Ver detalles"
                                        onClick={() =>
                                          onViewInvoice &&
                                          onViewInvoice(invoice)
                                        }
                                      >
                                        <EyeIcon className="h-5 w-5" />
                                      </button>
                                      <button
                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                        title="Descargar PDF"
                                        onClick={() => {
                                          if (invoice.invoiceURL) {
                                            window.open(
                                              invoice.invoiceURL,
                                              "_blank"
                                            );
                                          } else {
                                            toast.error(
                                              "No hay factura disponible para descargar"
                                            );
                                          }
                                        }}
                                      >
                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                      </button>
                                      {invoice.status === "pending" && (
                                        <button
                                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                          title="Marcar como pagado"
                                          onClick={() =>
                                            onMarkAsPaid &&
                                            onMarkAsPaid(invoice)
                                          }
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTable;
