import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ClosureDirection, ClosureRecord, FinancialPeriodOverview, financialClosureError, financialClosureService,
  LedgerMovement, LedgerSummary, MatchStatus,
} from "../../../../../services/financialClosureService";

const today = new Date();
const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const firstDay = (month: string) => `${month}-01`;
const lastDay = (month: string) => {
  const [year, part] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, part, 0).getDate()).padStart(2, "0")}`;
};
const money = (cents: number) => (Number(cents || 0) / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const dateLabel = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const emptySummary: LedgerSummary = { incomeCents: 0, expenseCents: 0, incomeCount: 0, expenseCount: 0, digest: "" };

const MonthlyFinancialClosure = () => {
  const [from, setFrom] = useState(firstDay(initialMonth));
  const [to, setTo] = useState(lastDay(initialMonth));
  const [direction, setDirection] = useState<ClosureDirection>("income");
  const [historyDirection, setHistoryDirection] = useState<ClosureDirection>("income");
  const [search, setSearch] = useState("");
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LedgerMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [matchSummary, setMatchSummary] = useState({ matched: 0, unmatched: 0 });
  const [pendingMatches, setPendingMatches] = useState<Set<string>>(() => new Set());
  const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [overview, setOverview] = useState<FinancialPeriodOverview | null>(null);
  const [currentClosure, setCurrentClosure] = useState<ClosureRecord | null>(null);
  const [history, setHistory] = useState<ClosureRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<{ month: string; direction: ClosureDirection } | null>(null);
  const [reopenCode, setReopenCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [activeView, setActiveView] = useState<"movements" | "history">("movements");
  const movementRequestId = useRef(0);
  const historyRequestId = useRef(0);

  const month = from.slice(0, 7);
  const fullMonth = from === firstDay(month) && to === lastDay(month);
  const periodClosure = currentClosure?.month === month
    && (currentClosure.direction === direction || currentClosure.direction === "all") ? currentClosure : null;
  const closedSnapshot = periodClosure?.status === "closed" && periodClosure.direction === direction && fullMonth ? periodClosure : null;
  const openingCents = closedSnapshot?.openingBalanceCents ?? overview?.balanceBeforePeriodCents ?? 0;
  const selectedCents = direction === "income" ? summary.incomeCents : direction === "expense" ? summary.expenseCents : summary.incomeCents - summary.expenseCents;
  const balanceCents = closedSnapshot?.closingBalanceCents ?? openingCents + selectedCents;
  const configuredInitialCents = overview?.configuredInitialBalanceCents ?? 0;
  const bankInitialCents = overview?.bankInitialBalanceCents ?? 0;
  const historicalIncomeCents = closedSnapshot?.historicalIncomeCents ?? overview?.historicalIncomeCents ?? 0;
  const historicalExpenseCents = closedSnapshot?.historicalExpenseCents ?? overview?.historicalExpenseCents ?? 0;
  const historicalDrift = !!closedSnapshot && !!overview && (
    summary.digest !== closedSnapshot.digest ||
    (direction === "all" && closedSnapshot.configuredInitialBalanceCents !== undefined
      && overview.configuredInitialBalanceCents !== closedSnapshot.configuredInitialBalanceCents)
  );
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const historyPages = Math.max(1, Math.ceil(historyTotal / 10));

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMovements = useCallback(async () => {
    if (!from || !to || from > to) {
      movementRequestId.current += 1;
      setRows([]);
      setTotal(0);
      setMatchSummary({ matched: 0, unmatched: 0 });
      setSummary(emptySummary);
      setOverview(null);
      setLoading(false);
      return;
    }
    const requestId = ++movementRequestId.current;
    setLoading(true);
    try {
      const result = await financialClosureService.movements({ from, to, direction, matchStatus, search: debouncedSearch, page, limit: 25 });
      if (requestId !== movementRequestId.current) return;
      setRows(result.items);
      setTotal(result.total);
      setMatchSummary(result.matchSummary);
      setSummary(result.summary);
      setOverview(result.overview);
    } catch (error) {
      if (requestId !== movementRequestId.current) return;
      setRows([]);
      setTotal(0);
      setMatchSummary({ matched: 0, unmatched: 0 });
      setSummary(emptySummary);
      setOverview(null);
      toast.error(financialClosureError(error));
    } finally { if (requestId === movementRequestId.current) setLoading(false); }
  }, [from, to, direction, matchStatus, debouncedSearch, page]);

  const loadHistory = useCallback(async () => {
    const requestId = ++historyRequestId.current;
    setHistoryLoading(true);
    try {
      const result = await financialClosureService.list(historyDirection, historyPage, 10);
      if (requestId !== historyRequestId.current) return;
      setHistory(result.items);
      setHistoryTotal(result.total);
    } catch (error) { if (requestId === historyRequestId.current) toast.error(financialClosureError(error)); }
    finally { if (requestId === historyRequestId.current) setHistoryLoading(false); }
  }, [historyDirection, historyPage]);

  useEffect(() => { void loadMovements(); }, [loadMovements]);
  useEffect(() => { void loadHistory(); }, [loadHistory]);
  useEffect(() => {
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    let cancelled = false;
    setCurrentClosure(null);
    financialClosureService.get(month, direction)
      .then((current) => {
        if (cancelled) return;
        setCurrentClosure(current);
      })
      .catch((error) => { if (!cancelled) toast.error(financialClosureError(error)); });
    return () => { cancelled = true; };
  }, [month, direction]);

  const onClose = async () => {
    if (direction === "all") return;
    if (!fullMonth) { toast.error("Selecciona el mes completo para cerrarlo."); return; }
    if (!overview || !Number.isSafeInteger(openingCents)) { toast.error("Espera a que se calculen los saldos del periodo."); return; }
    if (!window.confirm(`¿Cerrar ${direction === "income" ? "ingresos" : "egresos"} de ${month}? Solo se bloquearán los movimientos de ese tipo.`)) return;
    setClosing(true);
    try {
      await financialClosureService.close(month, direction, openingCents, summary.digest);
      toast.success(`${direction === "income" ? "Ingresos" : "Egresos"} de ${month} cerrados correctamente.`);
      const closure = await financialClosureService.get(month, direction);
      setCurrentClosure(closure);
      await loadMovements();
      await loadHistory();
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setClosing(false); }
  };

  const requestCode = async (target: ClosureRecord) => {
    setSendingCode(true);
    try {
      const result = await financialClosureService.requestReopen(target.month, target.direction || "all");
      setCodeSentTo(result.emailMasked);
      setReopenTarget({ month: target.month, direction: target.direction || "all" });
      setReopenCode("");
      toast.success("Código enviado por correo.");
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setSendingCode(false); }
  };

  const confirmReopen = async () => {
    if (!reopenTarget) return;
    setReopening(true);
    try {
      await financialClosureService.reopen(reopenTarget.month, reopenTarget.direction, reopenCode.trim());
      toast.success(`${reopenTarget.direction === "all" ? "Cierre conjunto" : reopenTarget.direction === "income" ? "Ingresos" : "Egresos"} de ${reopenTarget.month} reabiertos.`);
      if (month === reopenTarget.month && (direction === reopenTarget.direction || reopenTarget.direction === "all")) {
        setCurrentClosure(await financialClosureService.get(month, direction));
      }
      setReopenTarget(null);
      setReopenCode("");
      await loadMovements();
      await loadHistory();
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setReopening(false); }
  };

  const changeHistoryDirection = (next: ClosureDirection) => {
    if (next === historyDirection && historyPage === 1) return;
    historyRequestId.current += 1;
    setHistory([]);
    setHistoryTotal(0);
    setHistoryLoading(true);
    setHistoryDirection(next);
    setHistoryPage(1);
  };

  const selectClosure = (closure: ClosureRecord) => {
    setFrom(closure.from);
    setTo(closure.to);
    setDirection(closure.direction || "all");
    changeHistoryDirection(closure.direction || "all");
    setSearch("");
    setPage(1);
    setCurrentClosure(closure);
    setActiveView("movements");
  };

  const selectedLabel = direction === "income" ? "ingresos" : direction === "expense" ? "egresos" : "movimientos conjuntos";
  const unitLabel = direction === "expense" ? "Cuenta" : direction === "all" ? "Condómino / cuenta" : "Condómino";
  const movementParty = (row: LedgerMovement) => row.type === "expense"
    ? overview?.accounts.find((account) => account.id === row.accountId)?.name || row.accountId || "—"
    : row.condominiumUnit || "—";
  const toggleMatch = async (row: LedgerMovement) => {
    if (row.matchLocked || pendingMatches.size > 0 || direction === "all") return;
    const next = !row.matched;
    setPendingMatches((current) => new Set(current).add(row.id));
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, matched: next } : item));
    try {
      await financialClosureService.setMovementMatched(row.id, row.date, next);
      await loadMovements();
    } catch (error) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, matched: row.matched } : item));
      toast.error(financialClosureError(error));
    } finally {
      setPendingMatches((current) => { const updated = new Set(current); updated.delete(row.id); return updated; });
    }
  };
  const summaryCards = useMemo(() => direction === "all" ? [
    { label: "Saldo global antes del rango", value: money(openingCents), tone: "text-slate-800 dark:text-white" },
    { label: "Ingresos del rango", value: money(summary.incomeCents), tone: "text-emerald-700 dark:text-emerald-300" },
    { label: "Egresos del rango", value: money(summary.expenseCents), tone: "text-rose-700 dark:text-rose-300" },
    { label: "Saldo global al final", value: money(balanceCents), tone: "text-indigo-700 dark:text-indigo-300" },
  ] : [
    { label: `Acumulado de ${selectedLabel} anterior`, value: money(openingCents), tone: "text-slate-800 dark:text-white" },
    { label: `${selectedLabel} del rango`, value: money(selectedCents), tone: direction === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300" },
    { label: `Acumulado de ${selectedLabel} al final`, value: money(balanceCents), tone: "text-indigo-700 dark:text-indigo-300" },
  ], [direction, selectedLabel, openingCents, summary, selectedCents, balanceCents]);

  return <section className="mx-auto w-full max-w-7xl space-y-6 pb-10 text-slate-800 dark:text-slate-100">
    <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-6 text-slate-900 shadow-sm dark:border-indigo-900 dark:from-slate-900 dark:via-indigo-950 dark:to-indigo-900 dark:text-white dark:shadow-xl sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:border-white/25 dark:bg-white/10 dark:text-indigo-100">CIERRE MENSUAL</span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Movimientos y saldos del condominio</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-indigo-100">Concilia ingresos y egresos por separado. Cada cierre protege únicamente los movimientos de su tipo.</p>
        </div>
        <div className="flex rounded-xl bg-indigo-100/70 p-1 text-sm dark:bg-white/10" role="tablist" aria-label="Secciones de cierre mensual">
          <button type="button" onClick={() => setActiveView("movements")} className={`rounded-lg px-4 py-2 font-semibold ${activeView === "movements" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-700 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"}`}>Movimientos</button>
          <button type="button" onClick={() => setActiveView("history")} className={`rounded-lg px-4 py-2 font-semibold ${activeView === "history" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-700 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"}`}>Cierres</button>
        </div>
      </div>
    </div>

    {activeView === "movements" ? <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Periodo y tipo de conciliación</h2><p className="text-sm text-slate-500 dark:text-slate-400">Elige ingresos o egresos. El listado, las cifras y el cierre corresponden solo al tipo seleccionado.</p></div>
          {periodClosure?.status === "closed" && fullMonth && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">{periodClosure.direction === "all" ? "Cierre conjunto anterior" : `${selectedLabel} cerrados`}</span>}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium">Desde<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-sm font-medium">Hasta<input type="date" min={from} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-sm font-medium">Conciliar<select value={direction} onChange={(event) => { const next = event.target.value as ClosureDirection; setDirection(next); changeHistoryDirection(next); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="income">Ingresos</option><option value="expense">Egresos</option>{direction === "all" && <option value="all">Cierre conjunto anterior</option>}</select></label>
          <label className="text-sm font-medium">Buscar<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Concepto, condómino, referencia..." className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
          <h2 className="text-lg font-bold">Saldo global del condominio · referencia</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Calculado con la base de las cuentas y todos los movimientos registrados ahora: ingresos menos egresos. {direction === "all" ? "Este cierre histórico combina ambos tipos." : `Es una referencia; el cierre de ${selectedLabel} guarda su acumulado por separado.`}</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Base inicial de cuentas</p><strong className="mt-2 block text-xl">{overview ? money(configuredInitialCents) : "—"}</strong><p className="mt-1 text-xs text-slate-500">{money(bankInitialCents)} en cuentas bancarias.</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo global antes del rango</p><strong className="mt-2 block text-xl">{overview ? money(overview.globalBalanceBeforePeriodCents) : "—"}</strong></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Movimientos globales del rango</p><strong className="mt-2 block text-lg">{overview ? `+${money(overview.globalPeriodIncomeCents)} / −${money(overview.globalPeriodExpenseCents)}` : "—"}</strong><p className="mt-1 text-xs text-slate-500">Ingresos / egresos de todo el condominio.</p></div>
          <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Saldo global al {dateLabel(to)}</p><strong className="mt-2 block text-xl text-indigo-800 dark:text-indigo-100">{overview ? money(overview.globalBalanceAtEndCents) : "—"}</strong></div>
        </div>
        {closedSnapshot?.globalBalanceAtEndCents !== undefined && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:px-6">Al confirmar este cierre, el saldo global era <strong>{money(closedSnapshot.globalBalanceAtEndCents)}</strong>. Puede cambiar si el otro tipo sigue abierto.</p>}
        {!!overview?.accounts.length && <details className="border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-700 sm:px-6"><summary className="cursor-pointer font-semibold text-indigo-700 dark:text-indigo-300">Ver base inicial por cuenta</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{overview.accounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><span>{account.name}{account.type === "bank" ? " · Banco" : ""}</span><strong>{money(account.initialBalanceCents)}</strong></div>)}</div></details>}
      </div>

      <div className="space-y-5 rounded-3xl border-2 border-indigo-200 bg-indigo-50/40 p-4 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/20 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-4 dark:border-indigo-700">
        <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Cierre actual · {selectedLabel}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Del {dateLabel(from)} al {dateLabel(to)} · Cifras y movimientos de este periodo</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${periodClosure?.status === "closed" ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"}`}>{periodClosure?.status === "closed" ? "Periodo cerrado" : "En preparación"}</span>
      </div>
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-800 dark:bg-indigo-950/30 sm:p-6">
        <h2 className="text-lg font-bold">Conciliación de {selectedLabel}</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{direction === "all" ? "Este cierre histórico combina ingresos y egresos. Los nuevos cierres se hacen por separado." : `Las siguientes cifras contienen únicamente ${selectedLabel}. El cierre guarda este acumulado y los movimientos de este tipo. La búsqueda solo filtra la tabla.`}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-4 dark:bg-slate-900/70"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total histórico de {selectedLabel}</p><strong className="mt-2 block text-xl">{overview ? money(direction === "income" ? historicalIncomeCents : direction === "expense" ? historicalExpenseCents : historicalIncomeCents - historicalExpenseCents) : "—"}</strong></div>
          <div className="rounded-xl bg-white p-4 dark:bg-slate-900/70"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{overview?.previousMonthIsClosed ? "Cierre anterior" : "Mes anterior"} de {selectedLabel} · {overview?.previousMonth || "—"}</p><strong className="mt-2 block text-xl">{overview ? money(overview.previousMonthClosingBalanceCents) : "—"}</strong><p className="mt-1 text-xs text-slate-500">{overview?.previousMonthIsClosed ? "Acumulado confirmado" : "Acumulado calculado"}</p></div>
        </div>
      </div>

      {historicalDrift && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">Los movimientos actuales no coinciden con el cierre guardado. Se muestran los importes confirmados en el cierre.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaryCards.map((card) => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p><p className={`mt-3 text-lg font-bold sm:text-xl ${card.tone}`}>{card.value}</p></div>)}</div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6">
          <div><h2 className="font-semibold">Detalle de movimientos</h2><p className="text-xs text-slate-500 dark:text-slate-400">{direction === "all" ? `${summary.incomeCount} ingresos · ${summary.expenseCount} egresos` : `${direction === "income" ? summary.incomeCount : summary.expenseCount} ${selectedLabel}`} en el rango · {matchSummary.matched} de {matchSummary.matched + matchSummary.unmatched} cotejados con el estado de cuenta</p></div>
          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mostrar
            <select value={matchStatus} onChange={(event) => { setMatchStatus(event.target.value as MatchStatus); setPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="all">Todos</option><option value="matched">Conciliados</option><option value="unmatched">Pendientes</option></select>
          </label><span className="pb-2 text-xs text-slate-500">{loading ? "Cargando..." : `${total} resultados`}</span></div>
        </div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400"><tr><th className="px-5 py-3">Estado de cuenta</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Concepto</th><th className="px-5 py-3">{unitLabel}</th><th className="px-5 py-3">Referencia</th><th className="px-5 py-3 text-right">Monto</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40"><td className="px-5 py-4"><label className="flex cursor-pointer items-center gap-2 text-xs font-medium"><input type="checkbox" checked={row.matched} disabled={row.matchLocked || direction === "all" || closing || pendingMatches.size > 0} onChange={() => void toggleMatch(row)} aria-label={`Cotejar ${row.concept} del ${dateLabel(row.date)} con el estado de cuenta`} className="h-4 w-4 rounded border-slate-300 accent-indigo-700 disabled:cursor-not-allowed" /><span>{pendingMatches.has(row.id) ? "Guardando..." : row.matched ? "Conciliado" : "Pendiente"}</span></label></td><td className="whitespace-nowrap px-5 py-4">{dateLabel(row.date)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.type === "income" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"}`}>{row.type === "income" ? "Ingreso" : "Egreso"}</span></td><td className="max-w-64 px-5 py-4"><span className="font-medium">{row.concept}</span>{row.description && <span className="mt-1 block truncate text-xs text-slate-500" title={row.description}>{row.description}</span>}</td><td className="px-5 py-4">{movementParty(row)}</td><td className="max-w-40 truncate px-5 py-4" title={row.reference}>{row.reference || "—"}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${row.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{dateLabel(row.date)} · {row.type === "income" ? "Ingreso" : "Egreso"}</p><h3 className="mt-1 font-semibold">{row.concept}</h3></div><strong className={row.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</strong></div><p className="text-xs text-slate-500">{unitLabel}: {movementParty(row)} · Ref.: {row.reference || "—"}</p>{row.description && <p className="text-xs text-slate-500">{row.description}</p>}<label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={row.matched} disabled={row.matchLocked || direction === "all" || closing || pendingMatches.size > 0} onChange={() => void toggleMatch(row)} aria-label={`Cotejar ${row.concept} del ${dateLabel(row.date)} con el estado de cuenta`} className="h-4 w-4 rounded border-slate-300 accent-indigo-700 disabled:cursor-not-allowed" />{pendingMatches.has(row.id) ? "Guardando..." : row.matched ? "Conciliado con el estado de cuenta" : "Marcar como conciliado"}</label></article>)}</div>
        {!loading && rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No hay movimientos de este tipo para estos filtros.</p>}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700 sm:px-6"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cerrar {selectedLabel} de {month}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">Este cierre guarda solo {selectedLabel}. Los movimientos del otro tipo podrán seguir registrándose y conciliarse de forma independiente.</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3 dark:border-indigo-700 dark:bg-slate-900"><p className="text-xs text-slate-500">Acumulado anterior de {selectedLabel}</p><strong className="mt-1 block text-lg text-indigo-800 dark:text-indigo-200">{money(openingCents)}</strong></div>
        </div>
        {!fullMonth && <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">Para cerrar, selecciona desde {firstDay(month)} hasta {lastDay(month)}.</p>}
        {direction === "all" && <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">Este cierre conjunto es histórico. Elige ingresos o egresos para crear un nuevo cierre.</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-600 dark:text-slate-300">Acumulado final de {selectedLabel}: <strong>{money(balanceCents)}</strong></span><button type="button" onClick={onClose} disabled={closing || loading || pendingMatches.size > 0 || direction === "all" || !fullMonth || periodClosure?.status === "closed" || !summary.digest} className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{periodClosure?.status === "closed" ? "Periodo cerrado" : closing ? "Cerrando..." : `Cerrar ${selectedLabel}`}</button></div>
      </div>
      </div>
    </> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><h2 className="text-lg font-semibold">Historial de cierres</h2><p className="mt-1 text-sm text-slate-500">Cada tipo tiene su propio historial y código de reapertura.</p></div>
        <label className="text-xs font-semibold">Ver cierres de
          <select value={historyDirection} onChange={(event) => changeHistoryDirection(event.target.value as ClosureDirection)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
            <option value="income">Ingresos</option><option value="expense">Egresos</option><option value="all">Cierres conjuntos anteriores</option>
          </select>
        </label>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {history.map((closure) => <article key={closure.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{closure.month}</h3><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">{closure.direction === "income" ? "Ingresos" : closure.direction === "expense" ? "Egresos" : "Conjunto anterior"}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${closure.status === "closed" ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"}`}>{closure.status === "closed" ? "Cerrado" : "Reabierto"}</span></div>
            <p className="mt-2 text-xs text-slate-500">{dateLabel(closure.from)} – {dateLabel(closure.to)} · {closure.direction === "income" ? `${closure.incomeCount} ingresos` : closure.direction === "expense" ? `${closure.expenseCount} egresos` : `${closure.incomeCount} ingresos · ${closure.expenseCount} egresos`}</p>
            <p className="mt-2 text-sm">{closure.direction === "all" ? "Saldo global" : "Acumulado"} anterior {money(closure.openingBalanceCents)} · Del mes {money(closure.direction === "income" ? closure.incomeCents : closure.direction === "expense" ? closure.expenseCents : closure.incomeCents - closure.expenseCents)} · <strong>{closure.direction === "all" ? "Saldo global" : "Acumulado"} final {money(closure.closingBalanceCents)}</strong></p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => selectClosure(closure)} className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300">Ver detalle</button>{closure.status === "closed" && <button type="button" onClick={() => requestCode(closure)} disabled={sendingCode} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-700">Solicitar reapertura</button>}</div>
        </article>)}
        {!historyLoading && history.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Todavía no hay cierres de {historyDirection === "income" ? "ingresos" : historyDirection === "expense" ? "egresos" : "tipo conjunto"}.</p>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm dark:border-slate-700"><span>Página {historyPage} de {historyPages}</span><div className="flex gap-2"><button type="button" onClick={() => setHistoryPage(historyPage - 1)} disabled={historyPage <= 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" onClick={() => setHistoryPage(historyPage + 1)} disabled={historyPage >= historyPages} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>
    </div>}

    {reopenTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Autorizar reapertura"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800"><h2 className="text-xl font-bold">Reabrir {reopenTarget.direction === "income" ? "ingresos" : reopenTarget.direction === "expense" ? "egresos" : "cierre conjunto"} de {reopenTarget.month}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enviamos un código al correo {codeSentTo}. Vence en 10 minutos.</p><label className="mt-5 block text-sm font-medium">Código de autorización<input autoFocus inputMode="numeric" maxLength={6} value={reopenCode} onChange={(event) => setReopenCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.3em] text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setReopenTarget(null)} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button><button type="button" onClick={confirmReopen} disabled={reopening || reopenCode.length !== 6} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{reopening ? "Validando..." : "Reabrir mes"}</button></div></div></div>}
  </section>;
};

export default MonthlyFinancialClosure;
