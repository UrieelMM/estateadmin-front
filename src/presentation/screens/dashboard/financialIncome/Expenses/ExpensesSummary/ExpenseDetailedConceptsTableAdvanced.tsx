// src/components/ExpensesSummary/ExpenseDetailedConceptsTableAdvanced.tsx
import React, { useState, useEffect } from "react";
import {
  useExpenseSummaryStore,
  ExpenseRecord,
} from "../../../../../../store/expenseSummaryStore";
import {
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import { FunnelIcon } from "@heroicons/react/24/solid";
import LoadingApp from "../../../../../../presentation/components/shared/loaders/LoadingApp";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";

// Función para truncar la descripción a 120 caracteres
const truncate = (text: string, maxLength = 120): string =>
  text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

// Formatear moneda: $2,500.00
const formatCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Formatear fecha para mostrar solo día, mes y año (DD/MM/YYYY)
const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatPaymentType = (value: string): string => {
  const normalized = (value || "").toLowerCase().trim();
  const labels: Record<string, string> = {
    transfer: "Transferencia",
    transferencia: "Transferencia",
    cash: "Efectivo",
    efectivo: "Efectivo",
    check: "Cheque",
    cheque: "Cheque",
    credit_card: "Tarjeta de Crédito",
    tarjeta: "Tarjeta",
    tarjeta_credito: "Tarjeta de Crédito",
    debit_card: "Tarjeta de Débito",
    tarjeta_debito: "Tarjeta de Débito",
    deposito: "Depósito",
    depósito: "Depósito",
  };
  return labels[normalized] || value || "N/A";
};

const ITEMS_PER_PAGE = 50;

interface FilterState {
  month: string;
  year: string;
  folio: string;
}

interface InternalTransferRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
  sourceAccountName: string;
  destinationAccountName: string;
}

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

const ExpenseDetailedConceptsTableAdvanced: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<any[]>([null]);
  const [filters, setFilters] = useState<FilterState>({
    month: "",
    year: new Date().getFullYear().toString(),
    folio: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<ExpenseRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [folioQuery, setFolioQuery] = useState("");
  const [internalTransfers, setInternalTransfers] = useState<
    InternalTransferRecord[]
  >([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null
  );
  const [financialAccountNames, setFinancialAccountNames] = useState<
    Record<string, string>
  >({});

  const {
    completedExpenses,
    fetchExpenseHistory,
    resetExpensesState,
    loadingExpenses: _storeLoadingExpenses,
    searchExpenseByFolio,
  } = useExpenseSummaryStore((state) => ({
    completedExpenses: state.completedExpenses,
    lastExpenseDoc: state.lastExpenseDoc,
    fetchExpenseHistory: state.fetchExpenseHistory,
    resetExpensesState: state.resetExpensesState,
    loadingExpenses: state.loadingExpenses,
    searchExpenseByFolio: state.searchExpenseByFolio,
  }));

  // Cargar la primera página al montar
  useEffect(() => {
    const loadInitialExpenses = async () => {
      setLoadingExpenses(true);
      try {
        const count = await fetchExpenseHistory(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        const updatedLastDoc = useExpenseSummaryStore.getState().lastExpenseDoc;
        if (updatedLastDoc) {
          setPageCursors([null, updatedLastDoc]);
        } else {
          setPageCursors([null]);
        }
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar egresos iniciales:", error);
      } finally {
        setLoadingExpenses(false);
      }
    };
    loadInitialExpenses();
    return () => {
      resetExpensesState();
    };
  }, [fetchExpenseHistory, resetExpensesState, filters]);

  useEffect(() => {
    const fetchInternalTransfers = async () => {
      setLoadingTransfers(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const db = getFirestore();

        const accountsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
        );
        const accountsSnap = await getDocs(accountsRef);
        const accountMap: Record<string, string> = {};
        accountsSnap.forEach((docSnap) => {
          accountMap[docSnap.id] = docSnap.data().name || "Cuenta sin nombre";
        });
        setFinancialAccountNames(accountMap);

        const activeCashConfigRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig`
        );
        const activeCashConfigQuery = query(
          activeCashConfigRef,
          where("active", "==", true)
        );
        const activeCashConfigSnap = await getDocs(activeCashConfigQuery);
        const destinationAccountName = activeCashConfigSnap.empty
          ? "Caja Chica"
          : activeCashConfigSnap.docs[0].data().accountName || "Caja Chica";

        const txRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
        );
        const txQuery = query(txRef, where("type", "==", "replenishment"));
        const txSnap = await getDocs(txQuery);

        const rows: InternalTransferRecord[] = txSnap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            if (!data.sourceAccountId) return null;
            const date = data.expenseDate || data.createdAt || "";
            const year = date ? date.substring(0, 4) : "";
            const month = date ? date.substring(5, 7) : "";

            if (filters.year && year !== filters.year) return null;
            if (filters.month && month !== filters.month) return null;

            const amount = Number(data.amount || 0) / 100;
            return {
              id: docSnap.id,
              date,
              amount,
              description: data.description || "Reposición de caja chica",
              sourceAccountName:
                accountMap[data.sourceAccountId] || "Cuenta origen",
              destinationAccountName,
            };
          })
          .filter((item): item is InternalTransferRecord => item !== null)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        setInternalTransfers(rows);
      } catch (error) {
        console.error("Error al cargar transferencias internas:", error);
        setInternalTransfers([]);
      } finally {
        setLoadingTransfers(false);
      }
    };

    fetchInternalTransfers();
  }, [filters.month, filters.year]);

  const handleFilterChange = async (key: keyof FilterState, value: string) => {
    if (loadingExpenses) return;

    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    setCurrentPage(1);
    setPageCursors([null]);
    setHasMore(true);
    setLoadingExpenses(true);
    resetExpensesState();
    const count = await fetchExpenseHistory(ITEMS_PER_PAGE, null, newFilters);
    setHasMore(count === ITEMS_PER_PAGE);
    setLoadingExpenses(false);
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
      const result = await searchExpenseByFolio(folio);
      setSearchResults(result ? [result] : []);
    } catch (error) {
      console.error("Error al buscar por folio:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejo de cambio de página
  const handlePageChange = async (newPage: number) => {
    if (loadingExpenses) return;
    if (newPage === currentPage) return;
    setLoadingExpenses(true);
    try {
      let startAfter: any = null;
      if (newPage === 1) {
        startAfter = null;
      } else {
        startAfter = pageCursors[newPage - 1];
      }
      const count = await fetchExpenseHistory(
        ITEMS_PER_PAGE,
        startAfter,
        filters
      );
      if (newPage > currentPage && count === 0) {
        setHasMore(false);
        return;
      }
      setHasMore(count === ITEMS_PER_PAGE);
      if (
        newPage > pageCursors.length - 1 &&
        useExpenseSummaryStore.getState().lastExpenseDoc &&
        count > 0
      ) {
        setPageCursors((prev) => [
          ...prev,
          useExpenseSummaryStore.getState().lastExpenseDoc,
        ]);
      }
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Si existen más registros, asumimos que hay al menos una página extra
  const totalPages = hasMore ? currentPage + 1 : currentPage;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Historial de Egresos
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Lista de todos los egresos registrados en el sistema
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
              placeholder="Buscar por folio"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por Año */}
          <div className="shadow-lg rounded p-4">
            <label
              htmlFor="year-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Año
            </label>
            <select
              id="year-filter"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
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

          {/* Filtro por Mes */}
          <div className="shadow-lg rounded p-4">
            <label
              htmlFor="month-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Mes
            </label>
            <select
              id="month-filter"
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
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

      {/* Tabla principal */}
      <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            Transferencias Internas (Caja Chica)
          </h2>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            Estas transacciones son movimientos entre cuentas del condominio y
            no afectan los egresos globales.
          </p>
        </div>
        {loadingTransfers ? (
          <div className="py-2">
            <LoadingApp />
          </div>
        ) : internalTransfers.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No hay transferencias internas para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-200 dark:divide-indigo-800">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Origen
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Destino
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Monto
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100 dark:divide-indigo-900">
                {internalTransfers.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 pr-3 text-xs text-gray-800 dark:text-gray-200">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200">
                      {tx.sourceAccountName}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200">
                      {tx.destinationAccountName}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-gray-800 dark:text-gray-200">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {completedExpenses.length > 0 && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                        Folio
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Concepto
                      </th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        Monto
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Descripción
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Fecha
                      </th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        Comprobante
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {completedExpenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => setSelectedExpense(exp)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                          {exp.folio}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {exp.concept}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200 text-right">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {exp.description
                            ? truncate(exp.description, 120)
                            : ""}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {exp.invoiceUrl ? (
                            <a
                              href={exp.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
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

      {loadingExpenses && completedExpenses.length > 0 && (
        <div className="flex justify-center items-center py-2">
          <LoadingApp />
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:bg-gray-800 dark:border-gray-700 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingExpenses}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loadingExpenses}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
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
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loadingExpenses}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-600 dark:hover:bg-gray-700"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? "z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loadingExpenses}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-600 dark:hover:bg-gray-700"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
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
                      No se encontraron egresos con el folio especificado
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Folio
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Concepto
                                  </th>
                                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                    Monto
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Descripción
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Fecha
                                  </th>
                                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                    Comprobante
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {searchResults.map((exp) => (
                                  <tr
                                    key={exp.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    onClick={() => setSelectedExpense(exp)}
                                  >
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200">
                                      {exp.folio}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {exp.concept}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200 text-right">
                                      {formatCurrency(exp.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {exp.description
                                        ? truncate(exp.description, 120)
                                        : ""}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {formatDate(exp.expenseDate)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      {exp.invoiceUrl ? (
                                        <a
                                          href={exp.invoiceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
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

      {selectedExpense && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setSelectedExpense(null)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  Detalle del egreso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Folio</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.folio || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Monto</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedExpense.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Concepto</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.concept || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Tipo de pago
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPaymentType(selectedExpense.paymentType || "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Cuenta financiera
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.financialAccountId
                        ? financialAccountNames[
                            selectedExpense.financialAccountId
                          ] ||
                          selectedExpense.financialAccountId
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Fecha de egreso
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.expenseDate
                        ? formatDate(selectedExpense.expenseDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Fecha de registro
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.registerDate
                        ? formatDate(selectedExpense.registerDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">
                      Descripción
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedExpense.description || "Sin descripción"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">
                      Comprobante
                    </p>
                    {selectedExpense.invoiceUrl ? (
                      <a
                        href={selectedExpense.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Ver comprobante
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">
                        No disponible
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailedConceptsTableAdvanced;
