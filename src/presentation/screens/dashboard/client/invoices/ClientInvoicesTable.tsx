import React, { useState, useEffect } from "react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import useClientInvoicesStore, {
  ClientInvoice,
} from "../../../../store/useClientInvoicesStore";
import LoadingApp from "../../shared/loaders/LoadingApp";
import toast from "react-hot-toast";
import SubscriptionManagement from "../subscriptions/SubscriptionManagement";

interface ClientInvoicesTableProps {
  onViewInvoice?: (invoice: ClientInvoice) => void;
  onPayInvoice?: (invoice: ClientInvoice) => void;
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

const truncateText = (text: string | undefined, maxLength: number = 25) => {
  if (!text) return "N/A";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  trialing:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  past_due:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  incomplete: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  incomplete_expired:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
    case "active":
      return "Activa";
    case "trialing":
      return "Periodo de prueba";
    case "past_due":
      return "Pago atrasado";
    case "incomplete":
      return "Incompleta";
    case "incomplete_expired":
      return "Expirada";
    case "unpaid":
      return "No pagada";
    default:
      return status;
  }
};

const ClientInvoicesTable: React.FC<ClientInvoicesTableProps> = ({
  onPayInvoice,
}) => {
  const {
    fetchInvoices,
    invoices,
    lastInvoiceDoc,
    loading,
    resetInvoicesState,
    searchInvoiceByNumber,
    initiateStripePayment,
    initiateStripeSubscription,
    fetchSubscriptionInfo,
    listSubscriptionPlans,
  } = useClientInvoicesStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
  }>({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<ClientInvoice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);

  // Cargar facturas iniciales y datos de suscripción
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Primero, obtener las facturas - esto siempre se debe intentar
        const count = await fetchInvoices(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        setCurrentPage(1);

        try {
          // Verificar si existe un subscriptionId en localStorage antes de intentar obtener info
          const hasSubscriptionId = Boolean(
            localStorage.getItem("subscriptionId")
          );

          if (hasSubscriptionId) {
            // Solo cargar información de suscripción si tenemos un ID
            await fetchSubscriptionInfo();
          }

          // Siempre intentar cargar planes disponibles, ya que el usuario
          // podría querer iniciar una nueva suscripción
          await listSubscriptionPlans();
        } catch (subError) {
          console.error("Error al cargar datos de suscripción:", subError);
          // No mostrar toast para estos errores específicos de suscripción
          // ya que pueden ser normales si el usuario no tiene una suscripción activa
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        toast.error("Error al cargar los datos");
      }
    };

    loadInitialData();

    // Limpiar estado al desmontar
    return () => {
      resetInvoicesState();
    };
  }, [
    fetchInvoices,
    resetInvoicesState,
    filters,
    fetchSubscriptionInfo,
    listSubscriptionPlans,
  ]);

  // Manejar búsqueda por número de factura
  const handleInvoiceNumberChange = async (value: string) => {
    setInvoiceNumber(value);

    if (value.trim()) {
      setIsSearching(true);
      try {
        const results = await searchInvoiceByNumber(value.trim());
        setSearchResults(results);
        setShowSearchModal(true);
      } catch (error) {
        console.error("Error al buscar por número:", error);
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
    if (loading) return;

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
    if (loading || newPage === currentPage) return;

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

  // Función para pagar con suscripción de Stripe
  const handlePayWithStripe = async (invoice: ClientInvoice) => {
    try {
      // Si hay un handler personalizado, usarlo
      if (onPayInvoice) {
        onPayInvoice(invoice);
        return;
      }

      // Usar la implementación de suscripción directamente
      const { url } = await initiateStripeSubscription(invoice);

      // Redirigir al usuario a la página de pago de Stripe
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No se pudo iniciar la suscripción");
      }
    } catch (error) {
      console.error("Error al iniciar la suscripción:", error);
      toast.error("Error al iniciar la suscripción");
    }
  };

  // Función para pago único (uso anterior)
  const handleSinglePayment = async (invoice: ClientInvoice) => {
    try {
      // Usar la implementación de pago directo
      const { url } = await initiateStripePayment(invoice);

      if (url) {
        window.location.href = url;
      } else {
        toast.error("No se pudo iniciar el pago");
      }
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
      toast.error("Error al iniciar el pago");
    }
  };

  // Función para iniciar suscripción
  const handleStartSubscription = () => {
    // Primero intentar encontrar una factura existente con priceId
    const invoice = invoices.find((inv) => inv.priceId);

    if (invoice) {
      // Si existe una factura con priceId, usar esa
      handlePayWithStripe(invoice);
    } else {
      // Si no hay facturas con priceId, crear una "factura temporal" con el priceId de la variable de entorno
      const defaultPriceId = "price_1ROndGQYiUs7o8UP0Zgy81U6";

      if (!defaultPriceId) {
        toast.error("No se encontró un ID de plan de suscripción configurado");
        return;
      }

      console.log("Iniciando suscripción con priceId:", defaultPriceId);

      // Crear una factura temporal con el mínimo de datos necesarios
      const temporaryInvoice: ClientInvoice = {
        id: "temp-" + new Date().getTime(),
        invoiceNumber: "SUBS-" + new Date().getTime(),
        concept: "Nueva suscripción",
        amount: 0, // El precio real viene del plan en Stripe
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        dueDate: new Date(),
        isPaid: false,
        optionalMessage: "",
        clientId: "", // Lo obtenemos desde los claims en el store
        condominiumId: localStorage.getItem("condominiumId") || "",
        priceId: defaultPriceId,
      };

      // Iniciar el proceso de suscripción con esta factura temporal
      handlePayWithStripe(temporaryInvoice);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Facturas y Suscripciones
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Lista de todas tus facturas y estado de suscripción
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-4">
          {/* Botón para mostrar información de suscripción */}
          <button
            type="button"
            onClick={() => setShowSubscriptionInfo(!showSubscriptionInfo)}
            className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 mr-2"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Estado de Suscripción
          </button>

          {/* Barra de búsqueda por número de factura */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => handleInvoiceNumberChange(e.target.value)}
              placeholder="Buscar por número de factura..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Panel de información de suscripción */}
      {showSubscriptionInfo && (
        <div className="mt-6">
          <SubscriptionManagement
            onStartSubscription={handleStartSubscription}
          />
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="mt-4 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Filtros
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Estado
              </label>
              <select
                id="status-filter"
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-pointer"
              >
                <option value="">Todos los estados</option>
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="overdue">Vencido</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading && invoices.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <LoadingApp />
        </div>
      ) : invoices.length > 0 ? (
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
                        Factura
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
                        Condominio
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
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {truncateText(invoice.condominiumName)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[invoice.paymentStatus || "pending"]
                            }`}
                          >
                            {formatStatus(invoice.paymentStatus || "pending")}
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
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 group relative"
                              onClick={() => {
                                if (invoice.xmlURL) {
                                  window.open(invoice.xmlURL, "_blank");
                                } else {
                                  toast.error("No hay XML disponible para ver");
                                }
                              }}
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                              <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Descargar XML
                              </span>
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 group relative"
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
                              <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Descargar PDF
                              </span>
                            </button>
                            {(invoice.paymentStatus || "pending") ===
                              "pending" && (
                              <button
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 group relative"
                                onClick={() =>
                                  invoice.priceId
                                    ? handlePayWithStripe(invoice)
                                    : handleSinglePayment(invoice)
                                }
                              >
                                <CreditCardIcon className="h-5 w-5" />
                                <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {invoice.priceId
                                    ? "Iniciar suscripción"
                                    : "Pagar factura"}
                                </span>
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
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron facturas
          </p>
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
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2 cursor-pointer dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
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
                  disabled={loading || !hasMore}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2 cursor-pointer dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de búsqueda por número de factura */}
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
                      setInvoiceNumber("");
                    }}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Resultados de búsqueda
                  </h3>

                  {isSearching ? (
                    <div className="flex justify-center items-center py-8">
                      <LoadingApp />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron facturas con el número especificado
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
                                  Monto
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                  Condominio
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
                                    {formatCurrency(invoice.amount)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                    {truncateText(invoice.condominiumName)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        statusColors[
                                          invoice.paymentStatus || "pending"
                                        ]
                                      }`}
                                    >
                                      {formatStatus(
                                        invoice.paymentStatus || "pending"
                                      )}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                    {formatDate(invoice.createdAt)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 group relative"
                                        onClick={() => {
                                          if (invoice.xmlURL) {
                                            window.open(
                                              invoice.xmlURL,
                                              "_blank"
                                            );
                                          } else {
                                            toast.error(
                                              "No hay XML disponible para ver"
                                            );
                                          }
                                        }}
                                      >
                                        <DocumentTextIcon className="h-5 w-5" />
                                        <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                          Ver XML
                                        </span>
                                      </button>
                                      <button
                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 group relative"
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
                                        <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                          Descargar PDF
                                        </span>
                                      </button>
                                      {(invoice.paymentStatus || "pending") ===
                                        "pending" && (
                                        <button
                                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 group relative"
                                          onClick={() =>
                                            invoice.priceId
                                              ? handlePayWithStripe(invoice)
                                              : handleSinglePayment(invoice)
                                          }
                                        >
                                          <CreditCardIcon className="h-5 w-5" />
                                          <span className="absolute bottom-full left-[-20px] transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {invoice.priceId
                                              ? "Iniciar suscripción"
                                              : "Pagar factura"}
                                          </span>
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

export default ClientInvoicesTable;
