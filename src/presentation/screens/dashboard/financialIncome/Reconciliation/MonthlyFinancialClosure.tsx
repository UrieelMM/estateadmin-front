import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ClosureRecord, FinancialPeriodOverview, financialClosureError, financialClosureService,
  LedgerMovement, LedgerSummary,
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
  const [direction, setDirection] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LedgerMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [overview, setOverview] = useState<FinancialPeriodOverview | null>(null);
  const [currentClosure, setCurrentClosure] = useState<ClosureRecord | null>(null);
  const [history, setHistory] = useState<ClosureRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<string | null>(null);
  const [reopenCode, setReopenCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [activeView, setActiveView] = useState<"movements" | "history">("movements");
  const movementRequestId = useRef(0);

  const month = from.slice(0, 7);
  const fullMonth = from === firstDay(month) && to === lastDay(month);
  const closedSnapshot = currentClosure?.status === "closed" && currentClosure.month === month && fullMonth ? currentClosure : null;
  const openingCents = closedSnapshot?.openingBalanceCents ?? overview?.balanceBeforePeriodCents ?? 0;
  const balanceCents = closedSnapshot?.closingBalanceCents ?? openingCents + summary.incomeCents - summary.expenseCents;
  const configuredInitialCents = closedSnapshot?.configuredInitialBalanceCents ?? overview?.configuredInitialBalanceCents ?? 0;
  const bankInitialCents = closedSnapshot?.bankInitialBalanceCents ?? overview?.bankInitialBalanceCents ?? 0;
  const historicalIncomeCents = closedSnapshot?.historicalIncomeCents ?? overview?.historicalIncomeCents ?? 0;
  const historicalExpenseCents = closedSnapshot?.historicalExpenseCents ?? overview?.historicalExpenseCents ?? 0;
  const historicalDrift = !!closedSnapshot && !!overview && (
    summary.digest !== closedSnapshot.digest ||
    (closedSnapshot.configuredInitialBalanceCents !== undefined && overview.configuredInitialBalanceCents !== closedSnapshot.configuredInitialBalanceCents)
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
      setSummary(emptySummary);
      setOverview(null);
      setLoading(false);
      return;
    }
    const requestId = ++movementRequestId.current;
    setLoading(true);
    try {
      const result = await financialClosureService.movements({ from, to, direction, search: debouncedSearch, page, limit: 25 });
      if (requestId !== movementRequestId.current) return;
      setRows(result.items);
      setTotal(result.total);
      setSummary(result.summary);
      setOverview(result.overview);
    } catch (error) {
      if (requestId !== movementRequestId.current) return;
      setRows([]);
      setTotal(0);
      setSummary(emptySummary);
      setOverview(null);
      toast.error(financialClosureError(error));
    } finally { if (requestId === movementRequestId.current) setLoading(false); }
  }, [from, to, direction, debouncedSearch, page]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await financialClosureService.list(historyPage, 10);
      setHistory(result.items);
      setHistoryTotal(result.total);
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setHistoryLoading(false); }
  }, [historyPage]);

  useEffect(() => { void loadMovements(); }, [loadMovements]);
  useEffect(() => { void loadHistory(); }, [loadHistory]);
  useEffect(() => {
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    let cancelled = false;
    setCurrentClosure(null);
    financialClosureService.get(month)
      .then((current) => {
        if (cancelled) return;
        setCurrentClosure(current);
      })
      .catch((error) => { if (!cancelled) toast.error(financialClosureError(error)); });
    return () => { cancelled = true; };
  }, [month, from]);

  const onClose = async () => {
    if (!fullMonth) { toast.error("Selecciona el mes completo para cerrarlo."); return; }
    if (!overview || !Number.isSafeInteger(openingCents)) { toast.error("Espera a que se calculen los saldos del periodo."); return; }
    if (!window.confirm(`¿Cerrar ${month}? Se bloqueará el registro, edición y reversión de movimientos de ese mes.`)) return;
    setClosing(true);
    try {
      await financialClosureService.close(month, openingCents, summary.digest);
      toast.success(`Mes ${month} cerrado correctamente.`);
      const closure = await financialClosureService.get(month);
      setCurrentClosure(closure);
      await loadHistory();
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setClosing(false); }
  };

  const requestCode = async (target: string) => {
    setSendingCode(true);
    try {
      const result = await financialClosureService.requestReopen(target);
      setCodeSentTo(result.emailMasked);
      setReopenTarget(target);
      setReopenCode("");
      toast.success("Código enviado por correo.");
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setSendingCode(false); }
  };

  const confirmReopen = async () => {
    if (!reopenTarget) return;
    setReopening(true);
    try {
      await financialClosureService.reopen(reopenTarget, reopenCode.trim());
      toast.success(`Mes ${reopenTarget} reabierto.`);
      if (month === reopenTarget) setCurrentClosure(await financialClosureService.get(month));
      setReopenTarget(null);
      setReopenCode("");
      await loadHistory();
    } catch (error) { toast.error(financialClosureError(error)); }
    finally { setReopening(false); }
  };

  const selectClosure = (closure: ClosureRecord) => {
    setFrom(closure.from);
    setTo(closure.to);
    setDirection("all");
    setSearch("");
    setPage(1);
    setCurrentClosure(closure);
    setActiveView("movements");
  };

  const summaryCards = useMemo(() => [
    { label: "Saldo antes del rango", value: money(openingCents), tone: "text-slate-800 dark:text-white" },
    { label: "Ingresos del rango", value: money(summary.incomeCents), tone: "text-emerald-700 dark:text-emerald-300" },
    { label: "Egresos del rango", value: money(summary.expenseCents), tone: "text-rose-700 dark:text-rose-300" },
    { label: closedSnapshot ? "Saldo final confirmado" : "Saldo final calculado", value: money(balanceCents), tone: "text-indigo-700 dark:text-indigo-300" },
  ], [openingCents, summary, balanceCents, closedSnapshot]);

  return <section className="mx-auto w-full max-w-7xl space-y-6 pb-10 text-slate-800 dark:text-slate-100">
    <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-6 text-slate-900 shadow-sm dark:border-indigo-900 dark:from-slate-900 dark:via-indigo-950 dark:to-indigo-900 dark:text-white dark:shadow-xl sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:border-white/25 dark:bg-white/10 dark:text-indigo-100">CIERRE MENSUAL</span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Movimientos y saldos del condominio</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-indigo-100">Consulta ingresos y egresos por fecha, revisa el detalle y cierra el mes cuando los saldos estén correctos.</p>
        </div>
        <div className="flex rounded-xl bg-indigo-100/70 p-1 text-sm dark:bg-white/10" role="tablist" aria-label="Secciones de cierre mensual">
          <button type="button" onClick={() => setActiveView("movements")} className={`rounded-lg px-4 py-2 font-semibold ${activeView === "movements" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-700 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"}`}>Movimientos</button>
          <button type="button" onClick={() => setActiveView("history")} className={`rounded-lg px-4 py-2 font-semibold ${activeView === "history" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-700 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"}`}>Cierres</button>
        </div>
      </div>
    </div>

    {activeView === "movements" ? <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Periodo a revisar</h2><p className="text-sm text-slate-500 dark:text-slate-400">Selecciona fechas para cargar los movimientos registrados.</p></div>
          {currentClosure?.status === "closed" && fullMonth && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">Mes cerrado</span>}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium">Desde<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-sm font-medium">Hasta<input type="date" min={from} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-sm font-medium">Tipo de movimiento<select value={direction} onChange={(event) => { setDirection(event.target.value as typeof direction); setPage(1); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="all">Todos</option><option value="income">Ingresos</option><option value="expense">Egresos</option></select></label>
          <label className="text-sm font-medium">Buscar<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Concepto, condómino, referencia..." className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-slate-800">
        <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-4 text-white sm:px-6">
          <h2 className="text-lg font-bold">Panorama de saldos</h2>
          <p className="text-xs text-indigo-100">Base configurada, acumulado histórico y comparación con el mes anterior.</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo inicial de cuentas</p>
            <strong className="mt-2 block text-xl text-slate-900 dark:text-white">{overview ? money(configuredInitialCents) : "—"}</strong>
            <p className="mt-1 text-xs text-slate-500">De ese total, {money(bankInitialCents)} corresponde a cuentas bancarias.</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Saldo histórico al {dateLabel(to)}</p>
            <strong className="mt-2 block text-xl text-indigo-800 dark:text-indigo-100">{overview ? money(balanceCents) : "—"}</strong>
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">Incluye el saldo inicial y todos los movimientos registrados hasta la fecha final.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{overview?.previousMonthIsClosed ? "Conciliación anterior" : "Mes anterior"} · {overview?.previousMonth || "—"}</p>
            <strong className="mt-2 block text-xl text-emerald-800 dark:text-emerald-100">{overview ? money(overview.previousMonthClosingBalanceCents) : "—"}</strong>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{overview?.previousMonthIsClosed ? "Saldo confirmado en el cierre" : "Saldo calculado"} · +{money(overview?.previousMonthIncomeCents ?? 0)} / −{money(overview?.previousMonthExpenseCents ?? 0)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:px-6">
          <span>Ingresos históricos: <strong className="text-emerald-700 dark:text-emerald-300">{money(historicalIncomeCents)}</strong></span>
          <span>Egresos históricos: <strong className="text-rose-700 dark:text-rose-300">{money(historicalExpenseCents)}</strong></span>
          <span>Variación del rango: <strong>{money(summary.incomeCents - summary.expenseCents)}</strong></span>
        </div>
        {!!overview?.accounts.length && <details className="border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-700 sm:px-6"><summary className="cursor-pointer font-semibold text-indigo-700 dark:text-indigo-300">Ver saldos iniciales por cuenta (configuración actual)</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{overview.accounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><span>{account.name}{account.type === "bank" ? " · Banco" : ""}</span><strong>{money(account.initialBalanceCents)}</strong></div>)}</div></details>}
      </div>

      {historicalDrift && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">Los movimientos o saldos iniciales actuales no coinciden con el cierre guardado. Se muestran los importes confirmados en el cierre.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaryCards.map((card) => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p><p className={`mt-3 text-lg font-bold sm:text-xl ${card.tone}`}>{card.value}</p></div>)}</div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6"><div><h2 className="font-semibold">Detalle de movimientos</h2><p className="text-xs text-slate-500 dark:text-slate-400">{summary.incomeCount} ingresos · {summary.expenseCount} egresos en el rango</p></div><span className="text-xs text-slate-500">{loading ? "Cargando..." : `${total} resultados`}</span></div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Concepto</th><th className="px-5 py-3">Condómino</th><th className="px-5 py-3">Referencia</th><th className="px-5 py-3 text-right">Monto</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40"><td className="whitespace-nowrap px-5 py-4">{dateLabel(row.date)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.type === "income" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"}`}>{row.type === "income" ? "Ingreso" : "Egreso"}</span></td><td className="max-w-64 px-5 py-4"><span className="font-medium">{row.concept}</span>{row.description && <span className="mt-1 block truncate text-xs text-slate-500" title={row.description}>{row.description}</span>}</td><td className="px-5 py-4">{row.condominiumUnit || "—"}</td><td className="max-w-40 truncate px-5 py-4" title={row.reference}>{row.reference || "—"}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${row.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{dateLabel(row.date)} · {row.type === "income" ? "Ingreso" : "Egreso"}</p><h3 className="mt-1 font-semibold">{row.concept}</h3></div><strong className={row.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</strong></div><p className="text-xs text-slate-500">Condómino: {row.condominiumUnit || "—"} · Ref.: {row.reference || "—"}</p>{row.description && <p className="text-xs text-slate-500">{row.description}</p>}</article>)}</div>
        {!loading && rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No hay movimientos para estos filtros.</p>}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700 sm:px-6"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Cerrar el mes</h2><p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">Al cerrar, no se podrán registrar, editar ni revertir pagos y egresos de ese mes hasta autorizar su reapertura por correo.</p></div><div className="rounded-xl border border-indigo-200 bg-white px-4 py-3 dark:border-indigo-700 dark:bg-slate-900"><p className="text-xs text-slate-500">Saldo inicial calculado</p><strong className="mt-1 block text-lg text-indigo-800 dark:text-indigo-200">{money(openingCents)}</strong></div></div>
        {!fullMonth && <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">Para cerrar, selecciona desde {firstDay(month)} hasta {lastDay(month)}.</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-600 dark:text-slate-300">Saldo final: <strong>{money(balanceCents)}</strong></span><button type="button" onClick={onClose} disabled={closing || loading || !fullMonth || currentClosure?.status === "closed" || !summary.digest} className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{currentClosure?.status === "closed" ? "Mes cerrado" : closing ? "Cerrando..." : "Confirmar cierre"}</button></div>
      </div>
    </> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6"><h2 className="text-lg font-semibold">Historial de cierres</h2><p className="mt-1 text-sm text-slate-500">Consulta saldos y detalle de cada mes. La reapertura requiere un código enviado al correo configurado en el condominio.</p></div><div className="divide-y divide-slate-100 dark:divide-slate-700">{history.map((closure) => <article key={closure.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{closure.month}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${closure.status === "closed" ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"}`}>{closure.status === "closed" ? "Cerrado" : "Reabierto"}</span></div><p className="mt-2 text-xs text-slate-500">{dateLabel(closure.from)} – {dateLabel(closure.to)} · {closure.incomeCount} ingresos · {closure.expenseCount} egresos</p><p className="mt-2 text-sm">Inicial {money(closure.openingBalanceCents)} · Ingresos {money(closure.incomeCents)} · Egresos {money(closure.expenseCents)} · <strong>Final {money(closure.closingBalanceCents)}</strong></p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => selectClosure(closure)} className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300">Ver detalle</button>{closure.status === "closed" && <button type="button" onClick={() => requestCode(closure.month)} disabled={sendingCode} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-700">Solicitar reapertura</button>}</div></article>)}{!historyLoading && history.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Todavía no hay cierres registrados.</p>}</div><div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm dark:border-slate-700"><span>Página {historyPage} de {historyPages}</span><div className="flex gap-2"><button type="button" onClick={() => setHistoryPage(historyPage - 1)} disabled={historyPage <= 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" onClick={() => setHistoryPage(historyPage + 1)} disabled={historyPage >= historyPages} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div></div>}

    {reopenTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Autorizar reapertura"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800"><h2 className="text-xl font-bold">Reabrir {reopenTarget}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enviamos un código al correo {codeSentTo}. Vence en 10 minutos.</p><label className="mt-5 block text-sm font-medium">Código de autorización<input autoFocus inputMode="numeric" maxLength={6} value={reopenCode} onChange={(event) => setReopenCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.3em] text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setReopenTarget(null)} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button><button type="button" onClick={confirmReopen} disabled={reopening || reopenCode.length !== 6} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{reopening ? "Validando..." : "Reabrir mes"}</button></div></div></div>}
  </section>;
};

export default MonthlyFinancialClosure;
