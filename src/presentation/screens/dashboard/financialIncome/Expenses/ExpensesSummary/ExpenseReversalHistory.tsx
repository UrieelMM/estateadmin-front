import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import LoadingApp from "../../../../../components/shared/loaders/LoadingApp";
import useExpenseReversalStore from "../../../../../../store/useExpenseReversalStore";
import type { ExpenseReversalHistoryItem } from "../../../../../../services/expenseReversalService";

type Filters = { from: string; to: string; folio: string };

const EMPTY_FILTERS: Filters = { from: "", to: "", folio: "" };
const PAGE_SIZE = 10;

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ExpenseReversalHistory: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [rows, setRows] = useState<ExpenseReversalHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { historyLoading, fetchExpenseReversalHistory } = useExpenseReversalStore(
    (state) => ({
      historyLoading: state.historyLoading,
      fetchExpenseReversalHistory: state.fetchExpenseReversalHistory,
    })
  );

  const load = useCallback(
    async (targetPage: number, values: Filters, append: boolean) => {
      try {
        const response = await fetchExpenseReversalHistory({
          page: targetPage,
          limit: PAGE_SIZE,
          from: values.from || undefined,
          to: values.to || undefined,
          folio: values.folio.trim() || undefined,
        });
        setRows((prev) => (append ? [...prev, ...response.items] : response.items));
        setTotal(response.total);
        setPage(response.page);
      } catch (error: any) {
        toast.error(error?.message || "No fue posible cargar el historial de reversas.");
      }
    },
    [fetchExpenseReversalHistory]
  );

  useEffect(() => {
    load(1, EMPTY_FILTERS, false);
  }, [load]);

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
  const thClass =
    "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300";
  const tdClass = "px-3 py-3 text-sm text-gray-800 dark:text-gray-100";

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Revertido desde
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Revertido hasta
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Folio
          </label>
          <input
            type="text"
            value={filters.folio}
            onChange={(e) => setFilters((prev) => ({ ...prev, folio: e.target.value }))}
            placeholder="Opcional"
            className={inputClass}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => load(1, filters, false)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              load(1, EMPTY_FILTERS, false);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Limpiar
          </button>
        </div>
      </div>

      {historyLoading && rows.length === 0 ? (
        <div className="flex justify-center py-6">
          <LoadingApp />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          No hay egresos revertidos con los filtros actuales.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className={thClass}>Folio</th>
                <th className={thClass}>Concepto</th>
                <th className={`${thClass} text-right`}>Monto</th>
                <th className={thClass}>Fecha del egreso</th>
                <th className={thClass}>Motivo</th>
                <th className={thClass}>Revertido por</th>
                <th className={thClass}>Fecha de reversa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={tdClass}>{row.expenseFolio || row.expenseId}</td>
                  <td className={tdClass}>{row.concept || "N/A"}</td>
                  <td className={`${tdClass} text-right`}>{formatCurrency(row.amount)}</td>
                  <td className={tdClass}>
                    {row.expenseDate ? dayjs(row.expenseDate).format("DD/MM/YYYY") : "N/A"}
                  </td>
                  <td className={tdClass}>
                    {row.reason}
                    {row.notes && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {row.notes}
                      </p>
                    )}
                  </td>
                  <td className={tdClass}>{row.performedByName || "N/A"}</td>
                  <td className={tdClass}>
                    {row.performedAt
                      ? dayjs(row.performedAt).format("DD/MM/YYYY HH:mm")
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Registros cargados: {rows.length}
          {total > 0 ? ` de ${total}` : ""}
        </p>
        {rows.length < total && (
          <button
            type="button"
            onClick={() => load(page + 1, filters, true)}
            disabled={historyLoading}
            className="rounded-md border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
          >
            {historyLoading ? "Cargando..." : "Cargar más"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseReversalHistory;
