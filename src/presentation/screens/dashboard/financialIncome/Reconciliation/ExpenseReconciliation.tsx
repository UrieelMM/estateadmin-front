import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useExpenseReconciliationStore } from "../../../../../store/useExpenseReconciliationStore";
import BankFileDropzone from "../../../../components/shared/reconciliation/BankFileDropzone";
import { ParseResult } from "../../../../../services/reconciliation/bankFileParser";

const statusStyles: Record<string, string> = {
  matched:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  manual_match:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ignored: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const sourceBadge: Record<string, string> = {
  csv: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  xlsx: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  xls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
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
    saving,
    saveProgressLabel,
    error,
    lastImport,
    bankMovements,
    internalExpenses,
    loadInternalExpenses,
    applyParseResult,
    runAutoMatch,
    setManualMatch,
    clearMatch,
    ignoreMovement,
    bulkUpdateStatus,
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
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateToleranceDays, setDateToleranceDays] = useState(5);
  const [amountTolerance, setAmountTolerance] = useState(0.01);
  const [requireReference, setRequireReference] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [manualSearch, setManualSearch] = useState<Record<string, string>>({});

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
    () =>
      bankMovements
        .filter((item) => isWithinRange(item.date))
        .filter((item) =>
          statusFilter === "all" ? true : item.status === statusFilter
        )
        .filter((item) => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return (
            item.description.toLowerCase().includes(term) ||
            item.reference.toLowerCase().includes(term) ||
            String(item.amount).includes(term)
          );
        }),
    [bankMovements, dateFrom, dateTo, statusFilter, searchTerm]
  );

  const filteredInternalExpenses = useMemo(
    () => internalExpenses.filter((item) => isWithinRange(item.expenseDate)),
    [internalExpenses, dateFrom, dateTo]
  );

  const summaryView = useMemo(() => {
    const rangeBankMovements = bankMovements.filter((item) =>
      isWithinRange(item.date)
    );
    const bankDebits = rangeBankMovements.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    const bankDebitsMatched = rangeBankMovements
      .filter(
        (item) => item.status === "matched" || item.status === "manual_match"
      )
      .reduce((acc, item) => acc + item.amount, 0);
    const bankDebitsPending = rangeBankMovements
      .filter((item) => item.status === "pending")
      .reduce((acc, item) => acc + item.amount, 0);
    const matchedIds = new Set(
      rangeBankMovements
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
  }, [bankMovements, filteredInternalExpenses, dateFrom, dateTo]);

  const internalById = useMemo(
    () =>
      filteredInternalExpenses.reduce<
        Record<string, (typeof filteredInternalExpenses)[number]>
      >((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
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

  const handleDropzoneConfirm = (parseResult: ParseResult, file: File) => {
    applyParseResult(parseResult, file);
    setCsvFile(file);
    const importedCount = parseResult.rows.length;
    toast.success(
      `Importados ${importedCount} movimiento${
        importedCount === 1 ? "" : "s"
      } desde ${parseResult.fileKind.toUpperCase()}`
    );
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

  const handleAutoMatch = () => {
    runAutoMatch({
      dateToleranceDays,
      amountTolerance,
      requireReferenceMatch: requireReference,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    toast.success("Auto-conciliación ejecutada");
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

  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearBulkSelection = () => setBulkSelected(new Set());

  const handleBulkIgnore = () => {
    if (bulkSelected.size === 0) return;
    bulkUpdateStatus(Array.from(bulkSelected), "ignored");
    clearBulkSelection();
    toast.success("Movimientos marcados como ignorados");
  };

  const handleBulkReset = () => {
    if (bulkSelected.size === 0) return;
    bulkUpdateStatus(Array.from(bulkSelected), "pending");
    clearBulkSelection();
    toast.success("Movimientos reabiertos");
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
            disabled={loading || saving}
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
            </div>
            <div className="mt-3">
              <BankFileDropzone
                direction="expenses"
                onConfirm={handleDropzoneConfirm}
                disabled={loading || saving}
                compact
              />
            </div>
            {lastImport ? (
              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <p className="font-medium flex items-center gap-1">
                  <InformationCircleIcon className="h-4 w-4" />
                  Última importación: {lastImport.fileName} ·{" "}
                  {lastImport.fileKind.toUpperCase()} ·{" "}
                  {lastImport.stats.validRows} filas válidas
                  {lastImport.stats.skippedRows > 0
                    ? ` · ${lastImport.stats.skippedRows} omitidas`
                    : ""}
                </p>
                {lastImport.warnings.length > 0 ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    {lastImport.warnings.length} advertencia
                    {lastImport.warnings.length === 1 ? "" : "s"} detectada
                    {lastImport.warnings.length === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </div>
            ) : null}
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
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
              Tolerancia fecha (días)
              <input
                type="number"
                min={0}
                max={30}
                value={dateToleranceDays}
                onChange={(e) =>
                  setDateToleranceDays(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
              Tolerancia monto
              <input
                type="number"
                min={0}
                step={0.01}
                value={amountTolerance}
                onChange={(e) =>
                  setAmountTolerance(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={requireReference}
                onChange={(e) => setRequireReference(e.target.checked)}
                className="rounded border-gray-300"
              />
              Requerir coincidencia de referencia
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoMatch}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 disabled:opacity-60"
              disabled={
                loading ||
                saving ||
                filteredBankMovements.length === 0 ||
                filteredInternalExpenses.length === 0
              }
            >
              <ArrowPathIcon className="h-4 w-4" />
              Auto-conciliar egresos
            </button>
            <button
              onClick={handleSaveProgress}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20 disabled:opacity-60"
              disabled={loading || saving || bankMovements.length === 0}
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
              disabled={loading || saving || bankMovements.length === 0}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Guardar sesión final
            </button>
          </div>
          {saving ? (
            <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">
              {saveProgressLabel || "Guardando..."}
            </p>
          ) : null}
        </div>

        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/30 dark:text-gray-300">
          Recomendación: guarda progreso antes de cambiar de módulo o cerrar sesión.
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco egresos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {money(summaryView.bankDebits)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco conciliado</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {money(summaryView.bankDebitsMatched)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Banco pendiente</p>
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
            {money(summaryView.bankDebitsPending)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Egresos internos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {money(summaryView.internalExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Interno conciliado</p>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {money(summaryView.internalMatched)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Diferencia</p>
          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
            {money(summaryView.unmatchedDifference)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar descripción, referencia, monto"
            className="pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-72"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="matched">Conciliados auto</option>
          <option value="manual_match">Conciliados manual</option>
          <option value="ignored">Ignorados</option>
        </select>

        {bulkSelected.size > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs dark:border-indigo-800 dark:bg-indigo-900/30">
            <span>{bulkSelected.size} seleccionados</span>
            <button
              type="button"
              onClick={handleBulkIgnore}
              className="rounded-md border border-amber-300 px-2 py-0.5 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
            >
              Ignorar
            </button>
            <button
              type="button"
              onClick={handleBulkReset}
              className="rounded-md border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200"
            >
              Reabrir
            </button>
            <button
              type="button"
              onClick={clearBulkSelection}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ×
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="w-10 px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredBankMovements.length > 0 &&
                      filteredBankMovements.every((m) => bulkSelected.has(m.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelected(
                          new Set(filteredBankMovements.map((m) => m.id))
                        );
                      } else {
                        clearBulkSelection();
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th className="w-[200px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Descripción
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Referencia
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Monto
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th className="w-[280px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Match
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBankMovements.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Arrastra un archivo CSV/XLSX de egresos bancarios para iniciar.
                  </td>
                </tr>
              )}
              {filteredBankMovements.map((movement) => {
                const matched = movement.matchedExpenseId
                  ? internalById[movement.matchedExpenseId]
                  : null;
                const search = (manualSearch[movement.id] || "").toLowerCase();
                const filteredOptions = availableInternalExpenses.filter(
                  (expense) => {
                    if (!search) return true;
                    return (
                      (expense.folio || "").toLowerCase().includes(search) ||
                      (expense.concept || "").toLowerCase().includes(search) ||
                      (expense.paymentType || "")
                        .toLowerCase()
                        .includes(search) ||
                      String(expense.amount).includes(search)
                    );
                  }
                );

                return (
                  <tr
                    key={movement.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-700/20"
                  >
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(movement.id)}
                        onChange={() => toggleBulkSelect(movement.id)}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                      <div>
                        {shortDate(movement.date)}
                        <span
                          className={`block mt-0.5 text-[10px] uppercase font-semibold rounded px-1 py-0.5 inline-block ${
                            sourceBadge[movement.source] || sourceBadge.csv
                          }`}
                        >
                          {movement.source}
                        </span>
                      </div>
                    </td>
                    <td className="w-[200px] px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                      <p className="whitespace-normal break-words leading-5">
                        {movement.description || "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {movement.reference || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {money(movement.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          statusStyles[movement.status]
                        }`}
                      >
                        {movement.status === "matched"
                          ? `Auto · ${(movement.confidence || 0).toFixed(2)}`
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
                          <p className="font-semibold">
                            {matched.folio || "Sin folio"}
                          </p>
                          <p>{money(matched.amount)}</p>
                          {matched.concept ? (
                            <p className="text-[11px] text-gray-500">
                              {matched.concept}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={manualSearch[movement.id] || ""}
                            onChange={(e) =>
                              setManualSearch((prev) => ({
                                ...prev,
                                [movement.id]: e.target.value,
                              }))
                            }
                            placeholder="Buscar folio/concepto..."
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          />
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              setManualMatch(movement.id, e.target.value);
                              e.currentTarget.value = "";
                              setManualSearch((prev) => ({
                                ...prev,
                                [movement.id]: "",
                              }));
                            }}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="">Match manual</option>
                            {filteredOptions.slice(0, 100).map((expense) => (
                              <option key={expense.id} value={expense.id}>
                                {expense.folio || "Sin folio"} -{" "}
                                {money(expense.amount)}
                                {expense.concept ? ` - ${expense.concept}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
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
