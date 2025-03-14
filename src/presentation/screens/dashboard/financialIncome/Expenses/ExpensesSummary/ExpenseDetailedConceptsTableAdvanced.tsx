// src/components/ExpensesSummary/ExpenseDetailedConceptsTableAdvanced.tsx
import React, { useState, useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import { EyeIcon, EyeSlashIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { EXPENSE_CONCEPTS } from "../../../../../../utils/expensesList";

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

const monthNames: Record<string, string> = {
  "todos": "Todos los meses",
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

const ITEMS_PER_PAGE = 20;

const ExpenseDetailedConceptsTableAdvanced: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [selectedConcept, setSelectedConcept] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Lista fija de años del 2022 al 2030
  const years = useMemo(() => {
    const yearsList = [];
    for (let year = 2022; year <= 2030; year++) {
      yearsList.push(year.toString());
    }
    return yearsList;
  }, []);

  // Lista ordenada de meses
  const orderedMonths = useMemo(() => {
    return [
      ["todos", "Todos los meses"],
      ...Object.entries(monthNames)
        .filter(([key]) => key !== "todos")
        .sort((a, b) => a[0].localeCompare(b[0]))
    ];
  }, []);

  // Filtrar egresos según los criterios seleccionados
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expYear = exp.expenseDate.substring(0, 4);
      const expMonth = exp.expenseDate.substring(5, 7);
      
      const yearMatch = selectedYear ? expYear === selectedYear : true;
      const monthMatch = selectedMonth === "todos" ? true : expMonth === selectedMonth;
      const conceptMatch = selectedConcept ? exp.concept === selectedConcept : true;

      return yearMatch && monthMatch && conceptMatch;
    });
  }, [expenses, selectedYear, selectedMonth, selectedConcept]);

  // Calcular el total de los egresos filtrados
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  // Paginación
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  // Resetear la página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, selectedConcept]);

  return (
    <div className="mb-8 w-full">
      <div className="flex flex-col space-y-4 mb-6">
        <h3 className="text-xl font-bold">Detalle de Egresos</h3>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Año */}
          <div className="shadow-lg rounded p-4">
            <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Año
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
            >
              <option value="">Todos los años</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Mes */}
          <div className="shadow-lg rounded p-4">
            <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Mes
            </label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
            >
              {orderedMonths.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Concepto */}
          <div className="shadow-lg rounded p-4">
            <label htmlFor="concept-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Concepto
            </label>
            <select
              id="concept-filter"
              value={selectedConcept}
              onChange={(e) => setSelectedConcept(e.target.value)}
              className="block w-full rounded-md border-gray-300  focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
            >
              <option value="">Todos los conceptos</option>
              {EXPENSE_CONCEPTS.map(concept => (
                <option key={concept} value={concept}>{concept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Total de egresos filtrados y contador de resultados */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {paginatedExpenses.length} de {filteredExpenses.length} resultados
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Total de egresos filtrados: {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No hay egresos para mostrar.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Folio</th>
                  <th className="py-2 px-4 border-b text-left">Concepto</th>
                  <th className="py-2 px-4 border-b text-right">Monto</th>
                  <th className="py-2 px-4 border-b text-left">Descripción</th>
                  <th className="py-2 px-4 border-b text-left">Fecha</th>
                  <th className="py-2 px-4 border-b text-center">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer">
                    <td className="py-2 px-4 border-b">{exp.folio}</td>
                    <td className="py-2 px-4 border-b">{exp.concept}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(exp.amount)}</td>
                    <td className="py-2 px-4 border-b">
                      {exp.description ? truncate(exp.description, 120) : ""}
                    </td>
                    <td className="py-2 px-4 border-b">{formatDate(exp.expenseDate)}</td>
                    <td className="py-2 px-4 border-b text-center">
                      <div className="flex justify-center items-center w-full">
                      {exp.invoiceUrl ? (
                        <a
                          href={exp.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white px-2 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                          <EyeIcon className="h-4 w-4 mr-1 bg-indigo-500 hover:bg-indigo-600 rounded-full" />
                          Ver
                        </a>
                      ) : (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:bg-gray-800 dark:border-gray-700 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)}
                    </span>{' '}
                    de <span className="font-medium">{filteredExpenses.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-600 dark:hover:bg-gray-700"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Números de página */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
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
        </>
      )}
    </div>
  );
};

export default ExpenseDetailedConceptsTableAdvanced;
