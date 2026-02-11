import React, { useState, useEffect } from "react";
import {
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";
import { formatCurrency } from "../../../../../utils/curreyncy";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

interface FilterState {
  month: string;
  year: string;
  folio?: string;
}

const ITEMS_PER_PAGE = 50;
const MONTHS = [
  { value: "", label: "Todos los meses" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const HistoryPaymentsTable: React.FC = () => {
  // currentPage es 1-indexado.
  const [currentPage, setCurrentPage] = useState(1);
  // pageCursors: en cada posición se guarda el "lastDocument" correspondiente a la página anterior.
  // Para la página 1, startAfter es siempre null.
  const [pageCursors, setPageCursors] = useState<any[]>([null]);
  const [filters, setFilters] = useState<FilterState>({
    month: "",
    year: new Date().getFullYear().toString(),
    folio: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  // "hasMore" indica si es posible avanzar a una siguiente página
  const [hasMore, setHasMore] = useState(true);
  const [noResults, _setNoResults] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<PaymentRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [folioQuery, setFolioQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );

  const {
    completedPayments,
    financialAccountsMap,
    fetchPaymentHistory,
    resetPaymentsState,
    searchPaymentByFolio,
    loadingPayments: _storeLoadingPayments,
  } = usePaymentSummaryStore((state) => ({
    completedPayments: state.completedPayments,
    financialAccountsMap: state.financialAccountsMap,
    lastPaymentDoc: state.lastPaymentDoc,
    fetchPaymentHistory: state.fetchPaymentHistory,
    resetPaymentsState: state.resetPaymentsState,
    searchPaymentByFolio: state.searchPaymentByFolio,
    loadingPayments: state.loadingPayments,
  }));

  // Cargar la primera página al montar
  useEffect(() => {
    const loadInitialPayments = async () => {
      setLoadingPayments(true);
      try {
        const count = await fetchPaymentHistory(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        // Capturamos el lastPaymentDoc actualizado usando getState()
        const updatedLastDoc = usePaymentSummaryStore.getState().lastPaymentDoc;
        if (updatedLastDoc) {
          // La posición 0 es null para la página 1, la 1 corresponderá al cursor de la página 1
          setPageCursors([null, updatedLastDoc]);
        } else {
          setPageCursors([null]);
        }
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar pagos iniciales:", error);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadInitialPayments();
    return () => {
      resetPaymentsState();
    };
  }, [fetchPaymentHistory, resetPaymentsState, filters]);

  // Si se cambian los filtros, se reinicia la paginación
  const handleFilterChange = async (key: keyof FilterState, value: string) => {
    if (loadingPayments) return;

    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    setCurrentPage(1);
    setPageCursors([null]);
    setHasMore(true);
    setLoadingPayments(true);
    resetPaymentsState();
    const count = await fetchPaymentHistory(ITEMS_PER_PAGE, null, {
      month: newFilters.month,
      year: newFilters.year,
    });
    setHasMore(count === ITEMS_PER_PAGE);
    setLoadingPayments(false);
  };

  const handleSearchByFolio = async () => {
    if (isSearching) return;

    const folio = folioQuery.trim();
    if (!folio) {
      setShowSearchModal(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setShowSearchModal(true);
    try {
      const results = await searchPaymentByFolio(folio);
      setSearchResults(results);
    } catch (error) {
      console.error("Error al buscar por folio:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejo de cambio de página (anterior/siguiente o salto directo)
  const handlePageChange = async (newPage: number) => {
    if (loadingPayments) return;
    if (newPage === currentPage) return;
    setLoadingPayments(true);
    try {
      let startAfter: any = null;
      if (newPage === 1) {
        startAfter = null;
      } else {
        startAfter = pageCursors[newPage - 1];
      }
      const count = await fetchPaymentHistory(
        ITEMS_PER_PAGE,
        startAfter,
        filters
      );
      // Si se intenta avanzar y no se obtienen registros nuevos, se evita actualizar la página
      if (newPage > currentPage && count === 0) {
        setHasMore(false);
        return;
      }
      setHasMore(count === ITEMS_PER_PAGE);
      // Si se avanzó a una nueva página y aún no se tiene su cursor, se agrega
      if (
        newPage > pageCursors.length - 1 &&
        usePaymentSummaryStore.getState().lastPaymentDoc &&
        count > 0
      ) {
        setPageCursors((prev) => [
          ...prev,
          usePaymentSummaryStore.getState().lastPaymentDoc,
        ]);
      }
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Si existen más registros, asumimos que hay al menos una página extra.
  const totalPages = hasMore ? currentPage + 1 : currentPage;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg ">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Historial de Pagos
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Lista de todos los pagos registrados en el sistema
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
              value={folioQuery}
              onChange={(e) => setFolioQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchByFolio();
                }
              }}
              placeholder="Buscar por folio..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchByFolio}
            disabled={isSearching}
            className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Buscar
          </button>
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
              htmlFor="year-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Año
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="block w-full rounded-md bg-gray-50 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
            >
              {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="shadow-lg rounded p-4">
            <label
              htmlFor="month-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Mes
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              className="block w-full rounded-md bg-gray-50 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Mensaje de no resultados */}
      {noResults && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No se encontraron pagos con el folio especificado
        </div>
      )}

      {/* Tabla */}
      {!noResults && completedPayments.length > 0 && (
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
                          Fecha
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-20 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Fecha en que se realizó el pago
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-1">
                          Monto
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Monto abonado + Saldo a favor utilizado (en caso
                              de que aplique)
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-1">
                          Saldo a favor
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Saldo a favor generado o utilizado en este pago.
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-1">
                          Número de Condomino
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Identificador único del condomino
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-1">
                          Concepto
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Descripción del pago realizado
                            </div>
                          </div>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-1">
                          Comprobante
                          <div className="group relative cursor-pointer">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                            <div className="absolute top-full left-[-36px] transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                              Documento que respalda el pago realizado
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {completedPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                          {payment.paymentDate || "No identificado"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatCurrency(
                            payment.amountPaid + (payment.creditBalance || 0)
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="flex flex-col gap-1">
                            {payment.creditBalance > 0 && (
                              <span className="text-green-600 dark:text-green-400">
                                +{formatCurrency(payment.creditBalance)}
                              </span>
                            )}
                            {(payment.creditUsed || 0) > 0 && (
                              <span className="text-red-600 dark:text-red-400">
                                -{formatCurrency(payment.creditUsed || 0)}
                              </span>
                            )}
                            {payment.creditBalance === 0 &&
                              (payment.creditUsed || 0) === 0 && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  {formatCurrency(0)}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {payment.numberCondominium || "No identificado"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {payment.concept || "No identificado"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {payment.attachmentPayment ? (
                            <a
                              href={payment.attachmentPayment}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-16 items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                            >
                              <EyeIcon className="h-5 w-5 mr-1 bg-indigo-500 hover:bg-indigo-600 rounded-full" />
                              Ver
                            </a>
                          ) : (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingPayments && completedPayments.length > 0 && (
        <div className="flex justify-center items-center py-2">
          <LoadingApp />
        </div>
      )}

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loadingPayments}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={loadingPayments || !hasMore}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-medium">{currentPage}</span> de{" "}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex  rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loadingPayments}
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
                        : "z-10  border-2 border-indigo-700  rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loadingPayments || !hasMore}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2 cursor-pointer"
              >
                Siguiente
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Modal de detalle de pago */ }
      {selectedPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setSelectedPayment(null)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  Detalle de pago
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de pago</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.paymentDate || "No identificada"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cuenta destino</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {financialAccountsMap[selectedPayment.financialAccountId]?.name ||
                        selectedPayment.financialAccountId ||
                        "No identificada"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto pagado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedPayment.amountPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crédito generado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedPayment.creditBalance || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crédito usado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedPayment.creditUsed || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto pendiente</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedPayment.amountPending || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cargos de referencia</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedPayment.referenceAmount || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.paid ? "Pagado" : "Pendiente"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Condomino</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.numberCondominium || "No identificado"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Concepto</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.concept || "No identificado"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mes</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.month || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de pago</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPayment.paymentType || "No especificado"}
                    </p>
                  </div>
                </div>

                {selectedPayment.attachmentPayment && (
                  <div className="mt-4">
                    <a
                      href={selectedPayment.attachmentPayment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Ver comprobante
                    </a>
                  </div>
                )}
              </div>
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
                      setFolioQuery("");
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
                      No se encontraron pagos con el folio especificado
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Fecha
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
                                    Saldo a favor
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Número de Condomino
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Concepto
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Comprobante
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {searchResults.map((payment) => (
                                  <tr
                                    key={payment.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200">
                                      {payment.paymentDate || "No identificado"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {formatCurrency(
                                        payment.amountPaid +
                                          (payment.creditBalance || 0)
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <div className="flex flex-col gap-1">
                                        {payment.creditBalance > 0 && (
                                          <span className="text-green-600 dark:text-green-400">
                                            +
                                            {formatCurrency(
                                              payment.creditBalance
                                            )}
                                          </span>
                                        )}
                                        {(payment.creditUsed || 0) > 0 && (
                                          <span className="text-red-600 dark:text-red-400">
                                            -
                                            {formatCurrency(
                                              payment.creditUsed || 0
                                            )}
                                          </span>
                                        )}
                                        {payment.creditBalance === 0 &&
                                          (payment.creditUsed || 0) === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                              {formatCurrency(0)}
                                            </span>
                                          )}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {payment.numberCondominium ||
                                        "No identificado"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {payment.concept || "No identificado"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {payment.attachmentPayment ? (
                                        <a
                                          href={payment.attachmentPayment}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex w-16 items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                          <EyeIcon className="h-5 w-5 mr-1" />
                                          Ver
                                        </a>
                                      ) : (
                                        <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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

export default HistoryPaymentsTable;
