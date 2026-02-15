import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useExpenseReconciliationStore } from "../../../../../store/useExpenseReconciliationStore";

const statusStyles: Record<string, string> = {
  matched: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  manual_match:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ignored: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function money(value: number): string {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function shortDate(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleDateString("es-MX");
}

function monthBounds(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const asInput = (value: Date) => value.toISOString().slice(0, 10);
  return { from: asInput(start), to: asInput(end) };
}

type ExpenseReconciliationProps = {
  resumeDraftId?: string | null;
  onResumeHandled?: () => void;
};

const ExpenseReconciliation = ({
  resumeDraftId = null,
  onResumeHandled,
}: ExpenseReconciliationProps) => {
  const {
    loading,
    error,
    bankMovements,
    internalExpenses,
    loadInternalExpenses,
    importBankCsv,
    runAutoMatch,
    setManualMatch,
    clearMatch,
    ignoreMovement,
    saveProgressSession,
    resumeLatestDraft,
    resumeDraftById,
    saveSession,
    reset,
  } = useExpenseReconciliationStore();
  const [sessionName, setSessionName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const isWithinRange = (date: Date | null) => {
    if (!dateFrom && !dateTo) return true;
    if (!date) return false;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const filteredBankMovements = useMemo(
    () => bankMovements.filter((item) => isWithinRange(item.date)),
    [bankMovements, dateFrom, dateTo]
  );

  const filteredInternalExpenses = useMemo(
    () => internalExpenses.filter((item) => isWithinRange(item.expenseDate)),
    [internalExpenses, dateFrom, dateTo]
  );

  const summaryView = useMemo(() => {
    const bankDebits = filteredBankMovements.reduce((acc, item) => acc + item.amount, 0);
    const bankDebitsMatched = filteredBankMovements
      .filter((item) => item.status === "matched" || item.status === "manual_match")
      .reduce((acc, item) => acc + item.amount, 0);
    const bankDebitsPending = filteredBankMovements
      .filter((item) => item.status === "pending")
      .reduce((acc, item) => acc + item.amount, 0);
    const matchedIds = new Set(
      filteredBankMovements
        .filter((item) => item.matchedExpenseId)
        .map((item) => item.matchedExpenseId as string)
    );
    const internalExpensesTotal = filteredInternalExpenses.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    const internalMatched = filteredInternalExpenses
      .filter((item) => matchedIds.has(item.id))
      .reduce((acc, item) => acc + item.amount, 0);
    return {
      bankDebits,
      bankDebitsMatched,
      bankDebitsPending,
      internalExpenses: internalExpensesTotal,
      internalMatched,
      unmatchedDifference: bankDebits - internalMatched,
    };
  }, [filteredBankMovements, filteredInternalExpenses]);

  const internalById = useMemo(
    () =>
      filteredInternalExpenses.reduce<Record<string, (typeof filteredInternalExpenses)[number]>>(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {}
      ),
    [filteredInternalExpenses]
  );

  const usedInternalIds = useMemo(
    () =>
      new Set(
        bankMovements
          .filter((item) => isWithinRange(item.date))
          .filter((item) => item.matchedExpenseId)
          .map((item) => item.matchedExpenseId as string)
      ),
    [bankMovements, dateFrom, dateTo]
  );

  const availableInternalExpenses = useMemo(
    () => filteredInternalExpenses.filter((item) => !usedInternalIds.has(item.id)),
    [filteredInternalExpenses, usedInternalIds]
  );

  const handleCsvImport = async (file: File) => {
    try {
      const text = await file.text();
      importBankCsv(text);
      setCsvFile(file);
      toast.success("CSV de egresos importado");
    } catch (importError) {
      console.error(importError);
      toast.error("No se pudo leer el CSV");
    }
  };

  const handleSaveSession = async () => {
    await saveSession(sessionName);
    toast.success("Conciliación de egresos guardada");
    setSessionName("");
    setCsvFile(null);
    reset();
  };

  const handleSaveProgress = async () => {
    await saveProgressSession(sessionName, { dateFrom, dateTo, csvFile });
    toast.success("Progreso guardado");
  };

  const handleResumeDraft = async () => {
    const draft = await resumeLatestDraft();
    if (!draft) {
      toast("No hay borradores disponibles");
      return;
    }
    setSessionName(draft.name || "");
    setDateFrom(draft.dateFrom || "");
    setDateTo(draft.dateTo || "");
    toast.success("Borrador cargado");
  };

  const setCurrentMonthRange = () => {
    const { from, to } = monthBounds(new Date());
    setDateFrom(from);
    setDateTo(to);
  };

  const setPreviousMonthRange = () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { from, to } = monthBounds(previousMonth);
    setDateFrom(from);
    setDateTo(to);
  };

  const clearRange = () => {
    setDateFrom("");
    setDateTo("");
  };

  useEffect(() => {
    if (!resumeDraftId) return;
    const run = async () => {
      const draft = await resumeDraftById(resumeDraftId);
      if (!draft) {
        toast.error("No fue posible reanudar el borrador seleccionado");
        onResumeHandled?.();
        return;
      }
      setSessionName(draft.name || "");
      setDateFrom(draft.dateFrom || "");
      setDateTo(draft.dateTo || "");
      toast.success("Borrador de egresos cargado desde historial");
      onResumeHandled?.();
    };
    run();
  }, [onResumeHandled, resumeDraftById, resumeDraftId]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Flujo de conciliación de egresos
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ordena el proceso por pasos para reducir conciliaciones incompletas.
            </p>
          </div>
          <button
            onClick={handleResumeDraft}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-60"
            disabled={loading}
          >
            Continuar borrador
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              1. Cargar información
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => loadInternalExpenses()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={loading}
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                Cargar egresos internos
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                <ArrowUpTrayIcon className="h-4 w-4" />
                Importar CSV banco
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvImport(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              2. Definir rango
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={setCurrentMonthRange}
                type="button"
                className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
              >
                Mes actual
              </button>
              <button
                onClick={setPreviousMonthRange}
                type="button"
                className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
              >
                Mes anterior
              </button>
              <button
                onClick={clearRange}
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Limpiar rango
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              El rango controla auto-match, KPIs y listado visible.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            3. Conciliar y guardar
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => runAutoMatch(3, 0.01, dateFrom, dateTo)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 disabled:opacity-60"
              disabled={loading || filteredBankMovements.length === 0 || filteredInternalExpenses.length === 0}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Auto-conciliar egresos
            </button>
            <button
              onClick={handleSaveProgress}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20 disabled:opacity-60"
              disabled={loading || filteredBankMovements.length === 0}
            >
              Guardar progreso
            </button>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Nombre de sesión (ej. Egresos febrero 2026)"
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={handleSaveSession}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-60"
              disabled={loading || bankMovements.length === 0}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Guardar sesión final
            </button>
          </div>
        </div>

        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/30 dark:text-gray-300">
          Recomendación: guarda progreso antes de cambiar de módulo o cerrar sesión.
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco egresos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{money(summaryView.bankDebits)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco conciliado</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{money(summaryView.bankDebitsMatched)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco pendiente</p>
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{money(summaryView.bankDebitsPending)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Egresos internos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{money(summaryView.internalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Interno conciliado</p>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{money(summaryView.internalMatched)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Diferencia</p>
          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">{money(summaryView.unmatchedDifference)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
                <th className="w-[200px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Referencia</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="w-[260px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Match</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBankMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Importa un CSV bancario de egresos para iniciar.
                  </td>
                </tr>
              )}
              {filteredBankMovements.map((movement) => {
                const matched = movement.matchedExpenseId
                  ? internalById[movement.matchedExpenseId]
                  : null;

                return (
                  <tr key={movement.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/20">
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">{shortDate(movement.date)}</td>
                    <td className="w-[200px] px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                      <p className="whitespace-normal break-words leading-5">
                        {movement.description || "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">{movement.reference || "-"}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{money(movement.amount)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[movement.status]}`}>
                        {movement.status === "matched"
                          ? "Conciliado auto"
                          : movement.status === "manual_match"
                          ? "Conciliado manual"
                          : movement.status === "ignored"
                          ? "Ignorado"
                          : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {matched ? (
                        <div>
                          <p className="font-semibold">{matched.folio || "Sin folio"}</p>
                          <p>{money(matched.amount)}</p>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setManualMatch(movement.id, e.target.value);
                            e.currentTarget.value = "";
                          }}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="">Match manual</option>
                          {availableInternalExpenses.map((expense) => (
                            <option key={expense.id} value={expense.id}>
                              {expense.folio || "Sin folio"} - {money(expense.amount)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => clearMatch(movement.id)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => ignoreMovement(movement.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                        >
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          Ignorar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReconciliation;
