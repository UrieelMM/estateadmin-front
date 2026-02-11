import { useEffect, useMemo, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Card } from "@heroui/react";
import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  TicketIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../store/paymentSummaryStore";
import { useExpenseSummaryStore } from "../../../../store/expenseSummaryStore";
import { usePettyCashStore } from "../../../../store/pettyCashStore";
import { useUnidentifiedPaymentsStore } from "../../../../store/useUnidentifiedPaymentsStore";
import { useMaintenanceContractStore } from "../../../../store/useMaintenanceStore";
import { useTicketsStore } from "../maintenance/tickets/ticketsStore";

const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const formatCurrency = (value: number): string =>
  "$" +
  value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Sparkline = ({ values }: { values: number[] }) => {
  const { points, min, max } = useMemo(() => {
    if (!values.length) return { points: "", min: 0, max: 0 };
    const localMin = Math.min(...values);
    const localMax = Math.max(...values);
    const range = localMax - localMin || 1;

    const serialized = values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const normalized = (value - localMin) / range;
        const y = 100 - normalized * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return { points: serialized, min: localMin, max: localMax };
  }, [values]);

  const isPositiveEnd =
    values.length > 1 ? values[values.length - 1] >= values[0] : true;

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 30" className="h-10 w-full overflow-visible">
        <polyline
          fill="none"
          stroke={isPositiveEnd ? "#0f766e" : "#b91c1c"}
          strokeWidth="2.25"
          points={points
            .split(" ")
            .map((pair) => {
              const [x, y] = pair.split(",");
              return `${x},${Number(y) * 0.3}`;
            })
            .join(" ")}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  extra,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "neutral" | "danger" | "success" | "warning";
  extra?: ReactNode;
}) => {
  const toneMap: Record<string, string> = {
    neutral:
      "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200",
    danger:
      "border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    success:
      "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    warning:
      "border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
  };

  return (
    <Card
      className={`rounded-2xl border p-4 shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${toneMap[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-1.5 opacity-80">{hint}</p>
        </div>
        <div className="rounded-lg bg-black/5 dark:bg-white/10 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {extra ? <div className="mt-3">{extra}</div> : null}
    </Card>
  );
};

const DashboardOperationalHealth = () => {
  const { monthlyStats, selectedYear, fetchSummary, shouldFetchData } =
    usePaymentSummaryStore(
      (state) => ({
        monthlyStats: state.monthlyStats,
        selectedYear: state.selectedYear,
        fetchSummary: state.fetchSummary,
        shouldFetchData: state.shouldFetchData,
      }),
      shallow
    );

  const {
    monthlyStats: expenseMonthlyStats,
    conceptRecords,
    fetchSummary: fetchExpenseSummary,
    shouldFetchData: shouldFetchExpenseData,
  } = useExpenseSummaryStore(
    (state) => ({
      monthlyStats: state.monthlyStats,
      conceptRecords: state.conceptRecords,
      fetchSummary: state.fetchSummary,
      shouldFetchData: state.shouldFetchData,
    }),
    shallow
  );

  const { config, currentBalance, fetchConfig } = usePettyCashStore(
    (state) => ({
      config: state.config,
      currentBalance: state.currentBalance,
      fetchConfig: state.fetchConfig,
    }),
    shallow
  );

  const { payments: unidentifiedPayments, fetchPayments } =
    useUnidentifiedPaymentsStore(
      (state) => ({
        payments: state.payments,
        fetchPayments: state.fetchPayments,
      }),
      shallow
    );

  const { contracts, fetchContracts, getExpiringContracts } =
    useMaintenanceContractStore(
      (state) => ({
        contracts: state.contracts,
        fetchContracts: state.fetchContracts,
        getExpiringContracts: state.getExpiringContracts,
      }),
      shallow
    );

  const { tickets, fetchTickets } = useTicketsStore(
    (state) => ({
      tickets: state.tickets,
      fetchTickets: state.fetchTickets,
    }),
    shallow
  );

  useEffect(() => {
    if (shouldFetchData(selectedYear)) {
      fetchSummary(selectedYear);
    }
    if (shouldFetchExpenseData(selectedYear)) {
      fetchExpenseSummary(selectedYear);
    }
    fetchConfig();
    fetchPayments(50);
    fetchContracts();
    fetchTickets(undefined, 100, false);
  }, [
    fetchConfig,
    fetchContracts,
    fetchExpenseSummary,
    fetchPayments,
    fetchSummary,
    fetchTickets,
    selectedYear,
    shouldFetchData,
    shouldFetchExpenseData,
  ]);

  const currentMonth = dayjs().format("MM");
  const currentMonthName = MONTHS_ES[dayjs().month()];

  const currentPaymentStats = monthlyStats.find((stat) => stat.month === currentMonth);
  const paidMonth = currentPaymentStats?.paid ?? 0;
  const pendingMonth = currentPaymentStats?.pending ?? 0;
  const expectedMonth = paidMonth + pendingMonth;
  const complianceRate =
    currentPaymentStats?.complianceRate ??
    (expectedMonth > 0 ? (paidMonth / expectedMonth) * 100 : 0);
  const delinquencyRate =
    currentPaymentStats?.delinquencyRate ??
    (expectedMonth > 0 ? (pendingMonth / expectedMonth) * 100 : 0);

  const topExpenseConcepts = useMemo(() => {
    const list = Object.entries(conceptRecords).map(([concept, records]) => {
      const total = records
        .filter((record) => record.expenseDate.substring(5, 7) === currentMonth)
        .reduce((sum, record) => sum + record.amount, 0);
      return { concept, total };
    });

    return list.filter((row) => row.total > 0).sort((a, b) => b.total - a.total).slice(0, 3);
  }, [conceptRecords, currentMonth]);

  const expiringContracts = getExpiringContracts();
  const closestContract = useMemo(() => {
    if (!expiringContracts.length) return null;
    return [...expiringContracts].sort((a, b) => {
      return dayjs(a.endDate).diff(dayjs(b.endDate));
    })[0];
  }, [expiringContracts]);

  const openTickets = tickets.filter((ticket) => ticket.status !== "cerrado");
  const highPriorityOpenTickets = openTickets.filter(
    (ticket) => ticket.priority === "alta"
  );

  const pendingUnidentified = unidentifiedPayments.filter(
    (payment) => !payment.appliedToUser
  );
  const pendingUnidentifiedTotal = pendingUnidentified.reduce(
    (sum, payment) => sum + (payment.amountPaid || 0),
    0
  );

  const threshold = (config?.thresholdAmount ?? 0) / 100;
  const pettyStatus =
    threshold <= 0
      ? "neutral"
      : currentBalance < threshold
      ? "danger"
      : currentBalance < threshold * 1.25
      ? "warning"
      : "success";

  const trendData = useMemo(() => {
    const currentMonthIndex = dayjs().month() + 1;
    const baseMonths = [currentMonthIndex - 2, currentMonthIndex - 1, currentMonthIndex];
    const monthsNormalized = baseMonths.map((month) => {
      if (month <= 0) return month + 12;
      return month;
    });

    const values = monthsNormalized.map((monthNumber) => {
      const key = monthNumber.toString().padStart(2, "0");
      const paid = monthlyStats.find((stat) => stat.month === key)?.paid ?? 0;
      const spent = expenseMonthlyStats.find((stat) => stat.month === key)?.spent ?? 0;
      return paid - spent;
    });

    const labels = monthsNormalized.map((monthNumber) => MONTHS_ES[monthNumber - 1]);
    return { values, labels };
  }, [expenseMonthlyStats, monthlyStats]);

  const alerts = [
    pendingMonth > 0
      ? `Cobranza pendiente en ${currentMonthName}: ${formatCurrency(pendingMonth)}.`
      : null,
    highPriorityOpenTickets.length > 0
      ? `${highPriorityOpenTickets.length} ticket(s) abiertos en prioridad alta.`
      : null,
    expiringContracts.length > 0 && closestContract
      ? `Contrato próximo a vencer: ${closestContract.providerName} (${dayjs(
          closestContract.endDate
        ).format("DD/MM/YYYY")}).`
      : null,
    threshold > 0 && currentBalance < threshold
      ? "Caja chica por debajo del umbral configurado."
      : null,
    pendingUnidentified.length > 0
      ? `${pendingUnidentified.length} pago(s) sin conciliación de condómino.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section>
      <div className="mb-3">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
          Alertas y Salud Operativa
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Señales accionables para control financiero, mantenimiento y operación diaria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StatCard
            title="Morosidad Activa"
            value={`${delinquencyRate.toFixed(1)}%`}
            hint={`${currentMonthName}: ${formatCurrency(pendingMonth)} pendiente`}
            icon={ExclamationTriangleIcon}
            tone={delinquencyRate >= 25 ? "danger" : delinquencyRate >= 12 ? "warning" : "success"}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <StatCard
            title="Cobranza Del Mes"
            value={`${complianceRate.toFixed(1)}%`}
            hint={`${formatCurrency(paidMonth)} de ${formatCurrency(expectedMonth)} esperado`}
            icon={ClipboardDocumentCheckIcon}
            tone={complianceRate >= 85 ? "success" : complianceRate >= 65 ? "warning" : "danger"}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <StatCard
            title="Tickets Mantenimiento"
            value={`${openTickets.length}`}
            hint={`${highPriorityOpenTickets.length} en prioridad alta`}
            icon={TicketIcon}
            tone={highPriorityOpenTickets.length > 0 ? "danger" : openTickets.length > 5 ? "warning" : "neutral"}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <StatCard
            title="Caja Chica"
            value={formatCurrency(currentBalance)}
            hint={
              threshold > 0
                ? `Umbral ${formatCurrency(threshold)}`
                : "Configura un umbral para alertas automáticas"
            }
            icon={BanknotesIcon}
            tone={pettyStatus}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="xl:col-span-5"
        >
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Tendencia de Ingreso Neto
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resultado de ingresos menos egresos en los últimos 3 meses.
                </p>
              </div>
              <ChartBarIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-3">
              <Sparkline values={trendData.values} />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                {trendData.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-4"
        >
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Top Egresos del Mes
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Conceptos con mayor impacto en {currentMonthName}.
                </p>
              </div>
              <CurrencyDollarIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2 mt-3">
              {topExpenseConcepts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sin egresos registrados para este mes.
                </p>
              ) : (
                topExpenseConcepts.map((item) => (
                  <div
                    key={item.concept}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate pr-3">
                      {item.concept}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="xl:col-span-3"
        >
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm h-full">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Alertas Prioritarias
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Riesgos detectados para seguimiento inmediato.
                </p>
              </div>
              <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-3 space-y-2">
              {alerts.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Sin alertas críticas por ahora. Operación estable.
                  </p>
                </div>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert}
                    className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-2.5"
                  >
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {alert}
                    </p>
                  </div>
                ))
              )}

              <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contratos activos: {contracts.filter((c) => c.status === "active").length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vencen en 30 días: {expiringContracts.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pagos sin conciliar: {pendingUnidentified.length} ({formatCurrency(pendingUnidentifiedTotal)})
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardOperationalHealth;
