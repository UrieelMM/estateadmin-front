/**
 * useAssemblyStore
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestiona presentaciones de asamblea: CRUD en Firestore + snapshot publisher.
 *
 * Firestore path (write/list):
 *   clients/{clientId}/condominiums/{condominiumId}/assemblyPresentations/{id}
 *
 * Public read path (viewer sin auth):
 *   assemblyPresentations/{id}   ← colección top-level con Firestore rules:
 *     allow read: if true;
 *     allow write: if request.auth != null;
 *
 * NOTA: Cuando se publica, se escribe en AMBAS rutas:
 *  1. La ruta privada (para la lista del dashboard)
 *  2. La ruta pública top-level (para el viewer)
 */
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  AssemblyPresentation,
  AssemblyPeriod,
  SlideConfigDraft,
  AssemblySlideData,
  CoverSlideData,
  ExecutiveSummarySlideData,
  FinancialSlideData,
  FinancialBreakdownSlideData,
  CollectionsSlideData,
  CollectionsTopSlideData,
  MaintenanceSlideData,
  ProjectsSlideData,
  ComparisonSlideData,
  AgendaSlideData,
  AgreementsSlideData,
} from "../interfaces/assembly";

// ── Lazy store imports (avoid circular deps) ─────────────────────────────────
import { usePaymentSummaryStore } from "./paymentSummaryStore";
import { useExpenseSummaryStore } from "./expenseSummaryStore";
import { useTicketsStore } from "../presentation/screens/dashboard/maintenance/tickets/ticketsStore";
import { useProjectStore, ProjectStatus } from "./projectStore";

// ── Helpers ──────────────────────────────────────────────────────────────────
const db = getFirestore();

/** Elimina valores undefined para que Firestore no los rechace */
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

async function getAuthInfo() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  const token = await getIdTokenResult(user);
  const clientId = token.claims["clientId"] as string;
  const condominiumId = localStorage.getItem("condominiumId") ?? "";
  return { user, clientId, condominiumId };
}

function privatePath(clientId: string, condominiumId: string) {
  return `clients/${clientId}/condominiums/${condominiumId}/assemblyPresentations`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Construye un Date al inicio del día en hora local sin pegar al UTC */
function parseISODateLocal(iso: string): Date {
  if (!iso) return new Date(NaN);
  // ISO "YYYY-MM-DD" → forzar local
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(iso);
  return d;
}

/** Convierte "dd/mm/yyyy" a Date */
function parseDDMMYYYY(s: string): Date | null {
  if (!s) return null;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

/** Año-mes-día de un Date */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Formatea un periodo en español "01 ene – 31 ene 2026" */
function formatPeriodLabel(period: AssemblyPeriod): string {
  const s = parseISODateLocal(period.start);
  const e = parseISODateLocal(period.end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return `${period.start} – ${period.end}`;
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

/** Devuelve el periodo anterior equivalente (mismos días) */
function getPreviousPeriod(period: AssemblyPeriod): AssemblyPeriod {
  const start = parseISODateLocal(period.start);
  const end = parseISODateLocal(period.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return period;

  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return { start: ymd(prevStart), end: ymd(prevEnd) };
}

function getYearsForPeriod(period: AssemblyPeriod): string[] {
  const start = parseISODateLocal(period.start);
  const end = parseISODateLocal(period.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  const years: string[] = [];
  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    years.push(year.toString());
  }
  return years;
}

function uniquePaymentKey(payment: any): string {
  return [
    payment?.userId ?? "",
    payment?.chargeId ?? payment?.id ?? "",
    payment?.paymentGroupId ?? "",
    payment?.month ?? "",
    payment?.numberCondominium ?? "",
  ].join("|");
}

/** Detecta si un periodo abarca exactamente un mes calendario */
function isFullMonth(period: AssemblyPeriod): boolean {
  const s = parseISODateLocal(period.start);
  const e = parseISODateLocal(period.end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
  if (s.getFullYear() !== e.getFullYear()) return false;
  if (s.getMonth() !== e.getMonth()) return false;
  if (s.getDate() !== 1) return false;
  const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
  return e.getDate() === lastDay;
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function monthLabel(period: AssemblyPeriod): string {
  if (!isFullMonth(period)) return formatPeriodLabel(period);
  const s = parseISODateLocal(period.start);
  return `${MONTH_NAMES_ES[s.getMonth()]} ${s.getFullYear()}`;
}

function isWithinPeriod(date: Date | null | undefined, period: AssemblyPeriod | null | undefined): boolean {
  if (!period || !date || isNaN(date.getTime())) return true; // sin filtro
  const s = parseISODateLocal(period.start);
  const e = parseISODateLocal(period.end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return true;
  // Comparar día completo (incluir 23:59:59 del end)
  const startMs = s.getTime();
  const endMs = e.getTime() + 24 * 60 * 60 * 1000 - 1;
  return date.getTime() >= startMs && date.getTime() <= endMs;
}

function defaultPeriodFromAssemblyDate(assemblyDate: string): AssemblyPeriod {
  const d = parseISODateLocal(assemblyDate);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return { start: `${now.getFullYear()}-01-01`, end: ymd(now) };
  }
  // Por defecto: año en curso de la fecha de asamblea
  return { start: `${d.getFullYear()}-01-01`, end: ymd(d) };
}

function deltaPercent(current: number, previous: number): { delta: string; positive: boolean } | null {
  if (!isFinite(current) || !isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return { delta: "0%", positive: true };
    return { delta: current > 0 ? "+100%" : "-100%", positive: current > 0 };
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change >= 0 ? "+" : "";
  return { delta: `${sign}${change.toFixed(1)}%`, positive: change >= 0 };
}

// ── Snapshot builders ────────────────────────────────────────────────────────

interface BuildContext {
  clientId: string;
  condominiumId: string;
  condoName: string;
  logoUrl?: string;
  assemblyDate: string;
  period: AssemblyPeriod;
  // datos crudos cacheados para evitar recargas
  payments?: any[];
  monthlyStats?: any[];
  expenses?: any[];
  expenseMonthly?: any[];
  totalCondominiums?: number;
  tickets?: any[];
  projects?: any[];
}

async function ensurePaymentsLoaded(ctx: BuildContext) {
  if (ctx.payments) return;
  const payStore = usePaymentSummaryStore.getState();
  const years = Array.from(new Set([
    ...getYearsForPeriod(ctx.period),
    ...getYearsForPeriod(getPreviousPeriod(ctx.period)),
  ])).sort();

  const paymentsByKey = new Map<string, any>();
  const monthlyStats: any[] = [];

  for (const year of years) {
    await payStore.fetchSummary(year, true);
    const st = usePaymentSummaryStore.getState();
    (st.payments ?? []).forEach((payment) => {
      paymentsByKey.set(uniquePaymentKey(payment), payment);
    });
    monthlyStats.push(...(st.monthlyStats ?? []));
    ctx.totalCondominiums = st.totalCondominiums;
  }

  ctx.payments = Array.from(paymentsByKey.values());
  ctx.monthlyStats = monthlyStats;
}

async function ensureExpensesLoaded(ctx: BuildContext) {
  if (ctx.expenses) return;
  const expStore = useExpenseSummaryStore.getState();
  // Pasar string vacío para no filtrar por año (todos los gastos), luego filtramos por rango
  await expStore.fetchSummary("", true);
  const st = useExpenseSummaryStore.getState();
  ctx.expenses = (st.expenses ?? []).slice();
  ctx.expenseMonthly = (st.monthlyStats ?? []).slice();
}

async function ensureTicketsLoaded(ctx: BuildContext) {
  if (ctx.tickets) return;
  const ticketStore = useTicketsStore.getState();
  await ticketStore.fetchTickets(undefined, 1000);
  ctx.tickets = (useTicketsStore.getState().tickets ?? []).slice();
}

async function ensureProjectsLoaded(ctx: BuildContext) {
  if (ctx.projects) return;
  const projStore = useProjectStore.getState();
  await projStore.fetchProjects(ctx.condominiumId);
  ctx.projects = (useProjectStore.getState().projects ?? []).slice();
}

/** Convierte el campo paymentDate de un PaymentRecord a Date (acepta dd/mm/yyyy o vacío) */
function paymentRecordDate(p: any): Date | null {
  if (!p?.paymentDate) return null;
  if (typeof p.paymentDate === "string") {
    return parseDDMMYYYY(p.paymentDate);
  }
  return null;
}

/** Convierte expenseDate "YYYY-MM-DD HH:mm" a Date */
function expenseRecordDate(e: any): Date | null {
  if (!e?.expenseDate) return null;
  const isoLike = e.expenseDate.replace(" ", "T");
  const d = new Date(isoLike);
  if (isNaN(d.getTime())) return null;
  return d;
}

function ticketDate(t: any): Date | null {
  const v = t?.createdAt;
  if (!v) return null;
  if (v instanceof Date) return v;
  return new Date(v);
}

// ── Aggregations sobre rango de fechas ───────────────────────────────────────

interface FinancialAgg {
  totalIncome: number;
  totalExpenses: number;
  totalPending: number;
  monthlyStats: { month: string; income: number; expenses: number }[];
  conceptIncome: Record<string, number>;
  conceptExpense: Record<string, number>;
  paymentMethods: Record<string, number>;
  /** Cumplimiento estimado (paid / charges) en el rango */
  complianceRate: number;
  delinquencyRate: number;
  paidUnits: number;
  pendingUnits: number;
}

function aggregateFinancials(
  ctx: BuildContext,
  period: AssemblyPeriod
): FinancialAgg {
  const payments = ctx.payments ?? [];
  const expenses = ctx.expenses ?? [];

  // Mapa mensual: clave "YYYY-MM"
  const monthly: Record<string, { income: number; expenses: number }> = {};
  // Inicializar meses dentro del rango
  const start = parseISODateLocal(period.start);
  const end = parseISODateLocal(period.end);
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor.getTime() <= last.getTime()) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      monthly[key] = { income: 0, expenses: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  let totalIncome = 0;
  let totalPending = 0;
  let totalExpenses = 0;
  const conceptIncome: Record<string, number> = {};
  const conceptExpense: Record<string, number> = {};
  const paymentMethods: Record<string, number> = {};

  // Para tasa de cumplimiento dentro del rango
  let chargesInRange = 0;
  let chargesPaidInRange = 0;
  // Por unidad: si tiene algún cargo NO pagado dentro del rango, cuenta como pendiente
  const unitHasPending: Record<string, boolean> = {};
  const unitHasAny: Record<string, boolean> = {};

  payments.forEach((p) => {
    const pDate = paymentRecordDate(p);
    // Para totales de ingresos usamos fecha de pago real
    if (pDate && isWithinPeriod(pDate, period) && p.amountPaid > 0) {
      totalIncome += p.amountPaid;
      const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
      monthly[key].income += p.amountPaid;

      const concept = p.concept || "Sin concepto";
      conceptIncome[concept] = (conceptIncome[concept] || 0) + p.amountPaid;
      const method = p.paymentType || "Sin método";
      paymentMethods[method] = (paymentMethods[method] || 0) + p.amountPaid;
    }
    // Para morosidad usamos el mes del cargo (campo `month` "MM" + año)
    // Nota: payment.month viene del cargo (si no es unidentified)
    if (p.month && p.referenceAmount > 0) {
      // Construir fecha del cargo aproximada (1 del mes, año del periodo cercano)
      // Usamos selectedYear del store de pagos pero como puede abarcar 2 años, usamos paymentDate si existe
      let chargeDate: Date | null = null;
      if (pDate) chargeDate = pDate;
      else {
        // Aproximamos al año del periodo
        const yr = parseISODateLocal(period.start).getFullYear();
        chargeDate = new Date(yr, parseInt(p.month, 10) - 1, 15);
      }
      if (isWithinPeriod(chargeDate, period)) {
        chargesInRange++;
        if (p.paid) chargesPaidInRange++;
        const unit = p.numberCondominium || "?";
        unitHasAny[unit] = true;
        if (!p.paid) unitHasPending[unit] = true;
        if (!p.paid) totalPending += p.amountPending || 0;
      }
    }
  });

  expenses.forEach((e) => {
    const eDate = expenseRecordDate(e);
    if (eDate && isWithinPeriod(eDate, period)) {
      totalExpenses += e.amount;
      const key = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
      monthly[key].expenses += e.amount;
      const concept = e.concept || "Sin concepto";
      conceptExpense[concept] = (conceptExpense[concept] || 0) + e.amount;
    }
  });

  const monthlyStats = Object.entries(monthly)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, v]) => {
      const m = key.slice(5, 7);
      return { month: m, income: v.income, expenses: v.expenses };
    });

  const complianceRate = chargesInRange > 0 ? (chargesPaidInRange / chargesInRange) * 100 : 0;
  const delinquencyRate = 100 - complianceRate;

  const paidUnits = Object.keys(unitHasAny).filter((u) => !unitHasPending[u]).length;
  const pendingUnits = Object.keys(unitHasPending).length;

  return {
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    totalPending: round2(totalPending),
    monthlyStats: monthlyStats.map((m) => ({ ...m, income: round2(m.income), expenses: round2(m.expenses) })),
    conceptIncome,
    conceptExpense,
    paymentMethods,
    complianceRate: round2(complianceRate),
    delinquencyRate: round2(delinquencyRate),
    paidUnits,
    pendingUnits,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ── Builders por slide ───────────────────────────────────────────────────────

async function buildCoverSnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<CoverSlideData> {
  return {
    type: "cover",
    condoName: ctx.condoName,
    logoUrl: ctx.logoUrl,
    title: _draft.customTitle ?? `Asamblea Ordinaria`,
    subtitle: _draft.customBody ?? ctx.condoName,
    date: ctx.assemblyDate,
    periodLabel: formatPeriodLabel(ctx.period),
  };
}

async function buildExecutiveSummarySnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<ExecutiveSummarySlideData> {
  await Promise.all([
    ensurePaymentsLoaded(ctx),
    ensureExpensesLoaded(ctx),
    ensureTicketsLoaded(ctx),
    ensureProjectsLoaded(ctx),
  ]);

  const agg = aggregateFinancials(ctx, ctx.period);
  const prevPeriod = getPreviousPeriod(ctx.period);
  const aggPrev = aggregateFinancials(ctx, prevPeriod);

  const tickets = (ctx.tickets ?? []).filter((t) =>
    isWithinPeriod(ticketDate(t), ctx.period)
  );
  const ticketsPrev = (ctx.tickets ?? []).filter((t) =>
    isWithinPeriod(ticketDate(t), prevPeriod)
  );
  const activeProjects = (ctx.projects ?? []).filter(
    (p) => p.status !== ProjectStatus.CANCELLED
  );

  const balance = agg.totalIncome - agg.totalExpenses;
  const prevBalance = aggPrev.totalIncome - aggPrev.totalExpenses;

  const dIncome = deltaPercent(agg.totalIncome, aggPrev.totalIncome);
  const dExpense = deltaPercent(agg.totalExpenses, aggPrev.totalExpenses);
  const dBalance = deltaPercent(balance, prevBalance);
  const dCompliance = deltaPercent(agg.complianceRate, aggPrev.complianceRate);
  const dTickets = deltaPercent(tickets.length, ticketsPrev.length);

  const fmtMxn = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

  const kpis: ExecutiveSummarySlideData["kpis"] = [
    {
      label: "Ingresos",
      value: fmtMxn(agg.totalIncome),
      delta: dIncome?.delta,
      deltaPositive: dIncome?.positive,
      icon: "income",
    },
    {
      label: "Egresos",
      value: fmtMxn(agg.totalExpenses),
      delta: dExpense?.delta,
      // Para egresos: subir es malo, bajar es bueno
      deltaPositive: dExpense ? !dExpense.positive : undefined,
      icon: "expense",
    },
    {
      label: "Balance",
      value: fmtMxn(balance),
      delta: dBalance?.delta,
      deltaPositive: dBalance?.positive,
      icon: "balance",
    },
    {
      label: "Cumplimiento",
      value: `${agg.complianceRate.toFixed(1)}%`,
      delta: dCompliance?.delta,
      deltaPositive: dCompliance?.positive,
      icon: "compliance",
    },
    {
      label: "Tickets nuevos",
      value: tickets.length.toString(),
      sublabel: `${tickets.filter((t) => t.status === "cerrado").length} resueltos`,
      delta: dTickets?.delta,
      deltaPositive: dTickets ? !dTickets.positive : undefined,
      icon: "tickets",
    },
    {
      label: "Proyectos activos",
      value: activeProjects.length.toString(),
      icon: "projects",
    },
  ];

  const highlights: string[] = [];
  if (agg.totalIncome > aggPrev.totalIncome && aggPrev.totalIncome > 0) {
    highlights.push(`Los ingresos crecieron ${dIncome?.delta} respecto al periodo anterior.`);
  }
  if (agg.complianceRate >= 90) {
    highlights.push(`Excelente cumplimiento de pago: ${agg.complianceRate.toFixed(1)}%.`);
  } else if (agg.complianceRate < 70) {
    highlights.push(`Atención: cumplimiento por debajo del 70% (${agg.complianceRate.toFixed(1)}%).`);
  }
  if (tickets.length > 0) {
    const closed = tickets.filter((t) => t.status === "cerrado").length;
    const closeRate = (closed / tickets.length) * 100;
    highlights.push(`Se atendieron ${closed} de ${tickets.length} tickets (${closeRate.toFixed(0)}%).`);
  }

  return {
    type: "executive_summary",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    kpis,
    highlights,
  };
}

async function buildFinancialSnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<FinancialSlideData> {
  await Promise.all([ensurePaymentsLoaded(ctx), ensureExpensesLoaded(ctx)]);

  const agg = aggregateFinancials(ctx, ctx.period);
  const prevPeriod = getPreviousPeriod(ctx.period);
  const aggPrev = aggregateFinancials(ctx, prevPeriod);

  return {
    type: "financial",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    totalIncome: agg.totalIncome,
    totalExpenses: agg.totalExpenses,
    balance: round2(agg.totalIncome - agg.totalExpenses),
    totalPending: agg.totalPending,
    monthlyStats: agg.monthlyStats,
    previousPeriod: {
      label: formatPeriodLabel(prevPeriod),
      totalIncome: aggPrev.totalIncome,
      totalExpenses: aggPrev.totalExpenses,
      balance: round2(aggPrev.totalIncome - aggPrev.totalExpenses),
    },
  };
}

async function buildFinancialBreakdownSnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<FinancialBreakdownSlideData> {
  await Promise.all([ensurePaymentsLoaded(ctx), ensureExpensesLoaded(ctx)]);
  const agg = aggregateFinancials(ctx, ctx.period);

  const totalIncome = agg.totalIncome;
  const totalExpenses = agg.totalExpenses;

  const topIncomeConcepts = Object.entries(agg.conceptIncome)
    .map(([concept, amount]) => ({
      concept,
      amount: round2(amount),
      percentage: totalIncome > 0 ? round2((amount / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const topExpenseConcepts = Object.entries(agg.conceptExpense)
    .map(([concept, amount]) => ({
      concept,
      amount: round2(amount),
      percentage: totalExpenses > 0 ? round2((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const paymentMethods = Object.entries(agg.paymentMethods)
    .map(([method, amount]) => ({ method, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);

  return {
    type: "financial_breakdown",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    topIncomeConcepts,
    topExpenseConcepts,
    paymentMethods,
    totalIncome,
    totalExpenses,
  };
}

async function buildCollectionsSnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<CollectionsSlideData> {
  await ensurePaymentsLoaded(ctx);
  const agg = aggregateFinancials(ctx, ctx.period);
  const prevPeriod = getPreviousPeriod(ctx.period);
  const aggPrev = aggregateFinancials(ctx, prevPeriod);

  // Cumplimiento mensual dentro del rango
  const monthlyComp: { month: string; complianceRate: number }[] = [];
  const start = parseISODateLocal(ctx.period.start);
  const end = parseISODateLocal(ctx.period.end);
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor.getTime() <= last.getTime()) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEndDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth(), monthEndDay);
      const monthPeriod: AssemblyPeriod = { start: ymd(monthStart), end: ymd(monthEnd) };
      const a = aggregateFinancials(ctx, monthPeriod);
      monthlyComp.push({
        month: String(cursor.getMonth() + 1).padStart(2, "0"),
        complianceRate: a.complianceRate,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return {
    type: "collections",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    complianceRate: agg.complianceRate,
    delinquencyRate: agg.delinquencyRate,
    totalUnits: ctx.totalCondominiums ?? agg.paidUnits + agg.pendingUnits,
    paidUnits: agg.paidUnits,
    pendingUnits: agg.pendingUnits,
    pendingAmount: agg.totalPending,
    monthlyCompliance: monthlyComp,
    previousPeriod: {
      label: formatPeriodLabel(prevPeriod),
      complianceRate: aggPrev.complianceRate,
      pendingAmount: aggPrev.totalPending,
    },
  };
}

async function buildCollectionsTopSnapshot(
  draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<CollectionsTopSlideData> {
  await ensurePaymentsLoaded(ctx);
  const limit = draft.topDebtorsLimit ?? 10;
  const anonymized = draft.anonymized ?? true;

  // Acumular por unidad: monto pendiente y meses con adeudo
  const map: Record<string, { pendingAmount: number; months: Set<string> }> = {};
  (ctx.payments ?? []).forEach((p) => {
    if (p.paid || !p.amountPending || p.amountPending <= 0) return;
    const pDate = paymentRecordDate(p);
    let chargeDate: Date | null = pDate;
    if (!chargeDate && p.month) {
      const yr = parseISODateLocal(ctx.period.start).getFullYear();
      chargeDate = new Date(yr, parseInt(p.month, 10) - 1, 15);
    }
    if (!isWithinPeriod(chargeDate, ctx.period)) return;
    const unit = p.numberCondominium || "?";
    if (!map[unit]) map[unit] = { pendingAmount: 0, months: new Set() };
    map[unit].pendingAmount += p.amountPending;
    if (p.month) map[unit].months.add(p.month);
  });

  const arr = Object.entries(map)
    .map(([unit, v], idx) => ({
      label: anonymized ? `Unidad #${idx + 1}` : unit,
      pendingAmount: round2(v.pendingAmount),
      monthsBehind: v.months.size,
    }))
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
    .slice(0, limit);

  return {
    type: "collections_top",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    topDebtors: arr,
    anonymized,
  };
}

async function buildMaintenanceSnapshot(
  _draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<MaintenanceSlideData> {
  await ensureTicketsLoaded(ctx);
  const tickets = (ctx.tickets ?? []).filter((t) => isWithinPeriod(ticketDate(t), ctx.period));

  let resolutionTotal = 0;
  let resolutionCount = 0;
  tickets.forEach((t) => {
    if (t.status === "cerrado" && t.closedAt && t.createdAt) {
      const created = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      const closed = t.closedAt instanceof Date ? t.closedAt : new Date(t.closedAt);
      if (!isNaN(created.getTime()) && !isNaN(closed.getTime())) {
        const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (hours >= 0) {
          resolutionTotal += hours;
          resolutionCount++;
        }
      }
    }
  });

  const areas: Record<string, number> = {};
  tickets.forEach((t) => {
    const area = t.area || "Sin área";
    areas[area] = (areas[area] || 0) + 1;
  });
  const topAreas = Object.entries(areas)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const highlights = tickets
    .slice(0, 5)
    .map((t) => ({
      folio: t.folio || (t.id ? t.id.slice(0, 8) : "—"),
      title: t.title || "(sin título)",
      status: t.status,
      priority: t.priority,
    }));

  return {
    type: "maintenance",
    period: formatPeriodLabel(ctx.period),
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    openTickets: tickets.filter((t) => t.status === "abierto").length,
    inProgressTickets: tickets.filter((t) => t.status === "en_progreso").length,
    closedTickets: tickets.filter((t) => t.status === "cerrado").length,
    totalTickets: tickets.length,
    avgResolutionHours: resolutionCount > 0 ? round2(resolutionTotal / resolutionCount) : 0,
    highPriorityTickets: tickets.filter((t) => t.priority === "alta").length,
    topAreas,
    highlights,
  };
}

async function buildProjectsSnapshot(
  draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<ProjectsSlideData> {
  await ensureProjectsLoaded(ctx);
  const all = (ctx.projects ?? []).filter((p) => p.status !== ProjectStatus.CANCELLED);
  const selected = (draft.selectedProjectIds && draft.selectedProjectIds.length > 0)
    ? all.filter((p) => draft.selectedProjectIds!.includes(p.id))
    : all.slice(0, 8);

  // Cargar gastos de cada proyecto seleccionado para el historial
  const projStore = useProjectStore.getState();

  const projects = await Promise.all(selected.map(async (p) => {
    const budget = p.initialBudget ?? 0;
    const remaining = p.currentBudget ?? p.initialBudget ?? 0;
    const spent = Math.max(0, budget - remaining);
    const progress =
      p.status === ProjectStatus.COMPLETED
        ? 100
        : budget > 0
        ? Math.min(100, Math.round((spent / budget) * 100))
        : 0;

    let topExpenses: { concept: string; amount: number; date: string }[] = [];
    let expensesCount = 0;
    let quotesCount = 0;
    try {
      await projStore.fetchProjectExpenses(p.id, { silent: true });
      const expenses = useProjectStore.getState().projectExpenses ?? [];
      expensesCount = expenses.length;
      topExpenses = expenses
        .slice()
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .slice(0, 5)
        .map((e) => ({
          concept: e.concept || "—",
          amount: e.amount ?? 0,
          date: e.expenseDate || "",
        }));
      await projStore.fetchProjectQuotes(p.id, { silent: true });
      quotesCount = (useProjectStore.getState().projectQuotes ?? []).length;
    } catch {
      /* ignore */
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress,
      budget,
      spent,
      startDate: p.startDate,
      endDate: p.endDate,
      expensesCount,
      quotesCount,
      topExpenses,
    };
  }));

  return {
    type: "projects",
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    selectedProjectIds: draft.selectedProjectIds,
    projects,
  };
}

async function buildComparisonSnapshot(
  draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<ComparisonSlideData> {
  await Promise.all([ensurePaymentsLoaded(ctx), ensureExpensesLoaded(ctx), ensureTicketsLoaded(ctx)]);

  const isMonth = isFullMonth(ctx.period);
  const comparisonType: "monthly" | "period" =
    draft.comparisonType ?? (isMonth ? "monthly" : "period");

  const prevPeriod = getPreviousPeriod(ctx.period);

  const aggCurrent = aggregateFinancials(ctx, ctx.period);
  const aggPrev = aggregateFinancials(ctx, prevPeriod);

  const ticketsCurrent = (ctx.tickets ?? []).filter((t) =>
    isWithinPeriod(ticketDate(t), ctx.period)
  );
  const ticketsPrev = (ctx.tickets ?? []).filter((t) =>
    isWithinPeriod(ticketDate(t), prevPeriod)
  );

  const balanceCurrent = aggCurrent.totalIncome - aggCurrent.totalExpenses;
  const balancePrev = aggPrev.totalIncome - aggPrev.totalExpenses;

  return {
    type: "comparison",
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    currentLabel: monthLabel(ctx.period),
    previousLabel: monthLabel(prevPeriod),
    comparisonType,
    metrics: [
      {
        label: "Ingresos",
        current: aggCurrent.totalIncome,
        previous: aggPrev.totalIncome,
        format: "currency",
        higherIsBetter: true,
      },
      {
        label: "Egresos",
        current: aggCurrent.totalExpenses,
        previous: aggPrev.totalExpenses,
        format: "currency",
        higherIsBetter: false,
      },
      {
        label: "Balance",
        current: round2(balanceCurrent),
        previous: round2(balancePrev),
        format: "currency",
        higherIsBetter: true,
      },
      {
        label: "Cumplimiento",
        current: aggCurrent.complianceRate,
        previous: aggPrev.complianceRate,
        format: "percent",
        higherIsBetter: true,
      },
      {
        label: "Morosidad",
        current: aggCurrent.delinquencyRate,
        previous: aggPrev.delinquencyRate,
        format: "percent",
        higherIsBetter: false,
      },
      {
        label: "Tickets nuevos",
        current: ticketsCurrent.length,
        previous: ticketsPrev.length,
        format: "number",
        higherIsBetter: false,
      },
    ],
  };
}

async function buildAgendaSnapshot(
  draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<AgendaSlideData> {
  return {
    type: "agenda",
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    title: draft.agendaTitle ?? "Orden del Día",
    items: draft.agendaItems ?? [],
  };
}

async function buildAgreementsSnapshot(
  draft: SlideConfigDraft,
  ctx: BuildContext
): Promise<AgreementsSlideData> {
  return {
    type: "agreements",
    logoUrl: ctx.logoUrl,
    condoName: ctx.condoName,
    title: draft.agreementsTitle ?? "Acuerdos Anteriores",
    previousAgreements: draft.previousAgreements ?? [],
  };
}

// ── Store state ──────────────────────────────────────────────────────────────

interface AssemblyState {
  presentations: AssemblyPresentation[];
  loading: boolean;
  error: string | null;
  // dashboard actions (require auth)
  fetchPresentations: () => Promise<void>;
  createDraft: (
    title: string,
    assemblyDate: string,
    draftSlides: SlideConfigDraft[],
    extra?: { period?: AssemblyPeriod; logoUrl?: string }
  ) => Promise<string>;
  updateDraft: (
    id: string,
    title: string,
    assemblyDate: string,
    draftSlides: SlideConfigDraft[],
    extra?: { period?: AssemblyPeriod; logoUrl?: string }
  ) => Promise<void>;
  publishPresentation: (
    id: string,
    title: string,
    assemblyDate: string,
    draftSlides: SlideConfigDraft[],
    extra?: { period?: AssemblyPeriod; logoUrl?: string }
  ) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
  // public viewer action (no auth required)
  fetchById: (id: string) => Promise<AssemblyPresentation | null>;
  // logo upload
  uploadLogo: (file: File) => Promise<string>;
  removeLogo: (logoUrl: string) => Promise<void>;
}

export const useAssemblyStore = create<AssemblyState>()((set, _get) => ({
  presentations: [],
  loading: false,
  error: null,

  // ── List ──────────────────────────────────────────────────────────────────
  fetchPresentations: async () => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getAuthInfo();
      const ref = collection(db, privatePath(clientId, condominiumId));
      const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
      const presentations: AssemblyPresentation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AssemblyPresentation, "id">),
      }));
      set({ presentations, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  // ── Create draft ──────────────────────────────────────────────────────────
  createDraft: async (title, assemblyDate, draftSlides, extra) => {
    const { user, clientId, condominiumId } = await getAuthInfo();
    const now = new Date().toISOString();
    const condoName = localStorage.getItem("condominiumName") ?? "Condominio";
    const data: Omit<AssemblyPresentation, "id"> = {
      clientId,
      condominiumId,
      condominiumName: condoName,
      title,
      assemblyDate,
      period: extra?.period,
      logoUrl: extra?.logoUrl,
      status: "draft",
      createdBy: user.email ?? user.uid,
      createdAt: now,
      updatedAt: now,
      slides: [],
      draftSlides,
    };
    const ref = collection(db, privatePath(clientId, condominiumId));
    const docRef = await addDoc(ref, stripUndefined(data));
    set((s) => ({
      presentations: [{ id: docRef.id, ...data }, ...s.presentations],
    }));
    return docRef.id;
  },

  // ── Update draft ──────────────────────────────────────────────────────────
  updateDraft: async (id, title, assemblyDate, draftSlides, extra) => {
    const { clientId, condominiumId } = await getAuthInfo();
    const ref = doc(db, privatePath(clientId, condominiumId), id);
    const update = {
      title,
      assemblyDate,
      draftSlides,
      period: extra?.period,
      logoUrl: extra?.logoUrl,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, stripUndefined(update), { merge: true });
    set((s) => ({
      presentations: s.presentations.map((p) =>
        p.id === id ? { ...p, ...update } : p
      ),
    }));
  },

  // ── Publish (collect snapshots + write to both paths) ─────────────────────
  publishPresentation: async (id, title, assemblyDate, draftSlides, extra) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getAuthInfo();
      const condoName = localStorage.getItem("condominiumName") ?? "Condominio";
      const logoUrl = extra?.logoUrl ?? localStorage.getItem("logoUrl") ?? undefined;
      const period: AssemblyPeriod =
        extra?.period ?? defaultPeriodFromAssemblyDate(assemblyDate);

      const ctx: BuildContext = {
        clientId,
        condominiumId,
        condoName,
        logoUrl,
        assemblyDate,
        period,
      };

      // Build snapshot slides in order
      const slides: AssemblySlideData[] = [];
      for (const draft of draftSlides) {
        try {
          switch (draft.type) {
            case "cover":
              slides.push(await buildCoverSnapshot(draft, ctx));
              break;
            case "executive_summary":
              slides.push(await buildExecutiveSummarySnapshot(draft, ctx));
              break;
            case "financial":
              slides.push(await buildFinancialSnapshot(draft, ctx));
              break;
            case "financial_breakdown":
              slides.push(await buildFinancialBreakdownSnapshot(draft, ctx));
              break;
            case "collections":
              slides.push(await buildCollectionsSnapshot(draft, ctx));
              break;
            case "collections_top":
              slides.push(await buildCollectionsTopSnapshot(draft, ctx));
              break;
            case "maintenance":
              slides.push(await buildMaintenanceSnapshot(draft, ctx));
              break;
            case "projects":
              slides.push(await buildProjectsSnapshot(draft, ctx));
              break;
            case "comparison":
              slides.push(await buildComparisonSnapshot(draft, ctx));
              break;
            case "agenda":
              slides.push(await buildAgendaSnapshot(draft, ctx));
              break;
            case "agreements":
              slides.push(await buildAgreementsSnapshot(draft, ctx));
              break;
            case "custom_text":
              slides.push({
                type: "custom_text",
                logoUrl: ctx.logoUrl,
                condoName: ctx.condoName,
                title: draft.customTitle ?? "Comunicado",
                body: draft.customBody ?? "",
                tag: draft.customTag,
              });
              break;
          }
        } catch (err) {
          console.error("Error build slide", draft.type, err);
        }
      }

      const now = new Date().toISOString();
      const privateRef = doc(db, privatePath(clientId, condominiumId), id);
      const existingSnap = await getDoc(privateRef);
      const existing = existingSnap.exists()
        ? (existingSnap.data() as Partial<AssemblyPresentation>)
        : null;
      const payload: Omit<AssemblyPresentation, "id"> = {
        clientId,
        condominiumId,
        condominiumName: condoName,
        title,
        assemblyDate,
        period,
        logoUrl,
        status: "published",
        createdBy: existing?.createdBy ?? user.email ?? user.uid,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        slides,
        draftSlides,
      };

      // 1. Write/update private path
      await setDoc(privateRef, stripUndefined(payload), { merge: true });

      // 2. Write to top-level public collection (viewer uses this)
      const publicRef = doc(db, "assemblyPresentations", id);
      await setDoc(publicRef, stripUndefined(payload));

      set((s) => ({
        loading: false,
        presentations: s.presentations.map((p) =>
          p.id === id ? { ...p, ...payload, id } : p
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  // ── Delete ────────────────────────────────────────────────────────────────
  deletePresentation: async (id) => {
    const { clientId, condominiumId } = await getAuthInfo();
    await deleteDoc(doc(db, privatePath(clientId, condominiumId), id));
    // Also remove public copy if it exists
    try {
      await deleteDoc(doc(db, "assemblyPresentations", id));
    } catch {
      // public copy may not exist (draft never published)
    }
    set((s) => ({
      presentations: s.presentations.filter((p) => p.id !== id),
    }));
  },

  // ── Public fetch by ID (no auth) ──────────────────────────────────────────
  fetchById: async (id) => {
    try {
      const ref = doc(db, "assemblyPresentations", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<AssemblyPresentation, "id">) };
    } catch {
      return null;
    }
  },

  // ── Logo upload ───────────────────────────────────────────────────────────
  uploadLogo: async (file) => {
    const { clientId, condominiumId } = await getAuthInfo();
    const storage = getStorage();
    const ext = file.name.split(".").pop() || "png";
    const path = `clients/${clientId}/condominiums/${condominiumId}/assembly/logos/${Date.now()}.${ext}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  },

  removeLogo: async (logoUrl) => {
    if (!logoUrl) return;
    try {
      const storage = getStorage();
      // Extract path from url
      const url = new URL(logoUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)$/);
      if (!pathMatch) return;
      const path = decodeURIComponent(pathMatch[1]);
      const r = storageRef(storage, path);
      await deleteObject(r);
    } catch {
      /* ignore */
    }
  },
}));
