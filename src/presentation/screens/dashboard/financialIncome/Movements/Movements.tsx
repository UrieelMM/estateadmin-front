import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ClosureDirection,
  FinancialPeriodOverview,
  LedgerMovement,
  financialClosureError,
  financialClosureService,
} from "../../../../../services/financialClosureService";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

type PeriodMode = "month" | "range";

const PAGE_SIZE = 50;
const MAX_RANGE_DAYS = 366;

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const firstDay = (month: string) => `${month}-01`;
const lastDay = (month: string) => {
  const [year, part] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, part, 0).getDate()).padStart(2, "0")}`;
};
const money = (cents: number) =>
  (Number(cents || 0) / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const dateLabel = (date: string) =>
  date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const rangeError = (from: string, to: string): string => {
  if (!from || !to) return "Selecciona la fecha inicial y final.";
  if (from > to) return "La fecha inicial no puede ser mayor que la final.";
  const days =
    (new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86400000;
  return days > MAX_RANGE_DAYS ? "Selecciona un rango de hasta 12 meses." : "";
};

const Movements = () => {
  const [mode, setMode] = useState<PeriodMode>("month");
  const [month, setMonth] = useState(currentMonth);
  const [rangeFrom, setRangeFrom] = useState(firstDay(currentMonth));
  const [rangeTo, setRangeTo] = useState(lastDay(currentMonth));
  const [direction, setDirection] = useState<ClosureDirection>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LedgerMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<FinancialPeriodOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const from = mode === "month" ? firstDay(month) : rangeFrom;
  const to = mode === "month" ? lastDay(month) : rangeTo;
  const invalidRange =
    mode === "month" && !month ? "Selecciona un mes." : rangeError(from, to);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const accountNames = useMemo(
    () => Object.fromEntries((overview?.accounts || []).map((account) => [account.id, account.name])),
    [overview]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMovements = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (invalidRange) {
      setRows([]);
      setTotal(0);
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await financialClosureService.movements({
        from,
        to,
        direction,
        matchStatus: "all",
        search: debouncedSearch,
        page,
        limit: PAGE_SIZE,
      });
      if (currentRequest !== requestId.current) return;
      setRows(result.items);
      setTotal(result.total);
      setOverview(result.overview);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setRows([]);
      setTotal(0);
      setOverview(null);
      toast.error(financialClosureError(error));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [from, to, direction, debouncedSearch, page, invalidRange]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const periodIncome = overview?.globalPeriodIncomeCents ?? 0;
  const periodExpense = overview?.globalPeriodExpenseCents ?? 0;
  const cards = [
    {
      label: "Saldo antes del periodo",
      value: overview?.globalBalanceBeforePeriodCents ?? 0,
      hint: "Saldo inicial de cuentas + movimientos previos",
      tone: "text-gray-900 dark:text-white",
    },
    {
      label: "Ingresos del periodo",
      value: periodIncome,
      hint: "Pagos registrados en el rango",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Egresos del periodo",
      value: periodExpense,
      hint: "Gastos registrados en el rango",
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Saldo al final del periodo",
      value: overview?.globalBalanceAtEndCents ?? 0,
      hint: `Neto del periodo: ${money(periodIncome - periodExpense)}`,
      tone: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
  const thClass =
    "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300";
  const tdClass = "px-3 py-3 text-sm text-gray-800 dark:text-gray-100";

  return (
    <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <p className="text-md">Movimientos</p>
      </header>

      <div className="pb-8">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">
          Ingresos y egresos del periodo
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Consulta todos los movimientos juntos por mes o por rango de fechas.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Consultar por
            </label>
            <div className="flex rounded-md border border-gray-300 p-0.5 dark:border-gray-700">
              {(
                [
                  ["month", "Mes"],
                  ["range", "Rango de fechas"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => resetPage(setMode)(value)}
                  className={`flex-1 rounded px-2 py-1.5 text-sm font-semibold transition-colors ${
                    mode === value
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "month" ? (
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Mes
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => resetPage(setMonth)(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : (
            <>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Desde
                </label>
                <input
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => resetPage(setRangeFrom)(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Hasta
                </label>
                <input
                  type="date"
                  value={rangeTo}
                  onChange={(e) => resetPage(setRangeTo)(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Tipo
            </label>
            <select
              value={direction}
              onChange={(e) => resetPage(setDirection)(e.target.value as ClosureDirection)}
              className={inputClass}
            >
              <option value="all">Ingresos y egresos</option>
              <option value="income">Solo ingresos</option>
              <option value="expense">Solo egresos</option>
            </select>
          </div>

          <div className={mode === "month" ? "md:col-span-4" : "md:col-span-3"}>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Buscar
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Concepto, condómino, folio o descripción"
              className={inputClass}
            />
          </div>
        </div>

        {invalidRange && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {invalidRange}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>
                {loading && !overview ? "…" : money(card.value)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Concepto</th>
                <th className={thClass}>Condómino / Detalle</th>
                <th className={thClass}>Folio / Referencia</th>
                <th className={thClass}>Cuenta</th>
                <th className={`${thClass} text-right`}>Ingreso</th>
                <th className={`${thClass} text-right`}>Egreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <div className="flex justify-center">
                      <LoadingApp />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay movimientos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isIncome = row.type === "income";
                  return (
                    <tr key={row.id} className={loading ? "opacity-60" : ""}>
                      <td className={`${tdClass} whitespace-nowrap`}>{dateLabel(row.date)}</td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isIncome
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                          }`}
                        >
                          {isIncome ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td className={tdClass}>{row.concept}</td>
                      <td className={tdClass}>
                        {row.condominiumUnit || row.description || "—"}
                        {row.condominiumUnit && row.description && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {row.description}
                          </p>
                        )}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>{row.reference || "—"}</td>
                      <td className={tdClass}>{accountNames[row.accountId] || "—"}</td>
                      <td className={`${tdClass} whitespace-nowrap text-right font-semibold text-emerald-600 dark:text-emerald-400`}>
                        {isIncome ? money(row.amount) : ""}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right font-semibold text-rose-600 dark:text-rose-400`}>
                        {isIncome ? "" : money(row.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {total} movimiento{total === 1 ? "" : "s"} · Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movements;
