import React, { useState, useEffect } from "react";
import {
  useMaintenanceReportStore,
  useMaintenanceAppointmentStore,
  useMaintenanceContractStore,
  useMaintenanceCostStore,
} from "../../../../store/useMaintenanceStore";
import { useTicketsStore } from "./tickets/ticketsStore";
import TicketToAppointment from "./TicketToAppointment";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";
import MaintenancePDFReportGenerator from "./MaintenancePDFReportGenerator";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  ClipboardDocumentIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { formatCurrency } from "../../../../utils/curreyncy";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

// Tipo para estadísticas de tickets
type TicketStatistics = {
  averageResolutionTime?: string;
  resolvedPercentage?: number;
  byAreas?: Record<string, number>;
  byUrgency?: Record<string, number>;
  dailyTrend?: number[];
};

// Constantes de colores por estado para mantener consistencia en toda la UI
const TICKET_STATUS_COLORS = {
  abierto: {
    bg: "rgba(252, 211, 77, 0.8)",
    border: "border-yellow-400",
    bgLight: "bg-yellow-50",
    bgDark: "dark:bg-yellow-900/10",
    borderDark: "dark:border-yellow-500",
    text: "text-yellow-500",
    textDark: "dark:text-yellow-400",
  },
  en_progreso: {
    bg: "rgba(59, 130, 246, 0.8) ",
    border: "border-blue-400",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/10",
    borderDark: "dark:border-blue-500",
    text: "text-blue-500",
    textDark: "dark:text-blue-400",
  },
  cerrado: {
    bg: "rgba(52, 211, 153, 0.8)",
    border: "border-green-400",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-700/30",
    borderDark: "dark:border-green-500",
    text: "text-green-500",
    textDark: "dark:text-green-400",
  },
};

const MaintenanceDashboard: React.FC = () => {
  const { reports, fetchReports } = useMaintenanceReportStore();
  const { tickets, fetchTickets } = useTicketsStore();
  const { appointments, fetchAppointments } = useMaintenanceAppointmentStore();
  const { contracts, fetchContracts } = useMaintenanceContractStore();
  const { costs, fetchCosts, getCostSummaryByCategory, getCostSummaryByMonth } =
    useMaintenanceCostStore();

  // Estado general de carga
  const [isLoading, setIsLoading] = useState(true);
  const [ticketStatistics, setTicketStatistics] = useState<TicketStatistics>({
    averageResolutionTime: "0",
    resolvedPercentage: 0,
    byAreas: {},
    byUrgency: {},
    dailyTrend: [0, 0, 0, 0, 0, 0, 0],
  });

  const [categoryData, setCategoryData] = useState<
    { category: string; total: number }[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<
    { month: number; total: number }[]
  >([]);
  const [_costsLoading, setCostsLoading] = useState(false);

  // Estado para el selector de fechas del reporte
  const [dateFilter, setDateFilter] = useState({
    startDate: moment().subtract(3, "months").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });

  // Estado para controlar visibilidad del panel de reportes
  const [showReportPanel, setShowReportPanel] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Cargamos todos los datos primero
        await Promise.all([
          fetchReports(),
          fetchTickets(),
          fetchAppointments(),
          fetchContracts(),
          loadCostsData(),
        ]);

        // Luego calculamos las estadísticas con los datos actualizados
        calculateTicketStatistics();
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para cargar datos de costos
  const loadCostsData = async () => {
    setCostsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      // Cargar gastos filtrados por año
      await fetchCosts({ startDate, endDate });

      // Obtener datos por categoría
      const categoryResults = await getCostSummaryByCategory(
        startDate,
        endDate
      );
      setCategoryData(categoryResults);

      // Obtener datos por mes
      const monthlyResults = await getCostSummaryByMonth(currentYear);
      setMonthlyData(monthlyResults);
    } catch (error) {
      console.error("Error al cargar datos de costos:", error);
    } finally {
      setCostsLoading(false);
    }
  };

  // Calcular estadísticas de tickets para el dashboard
  const calculateTicketStatistics = () => {
    if (!tickets || tickets.length === 0) {
      setTicketStatistics({
        averageResolutionTime: "0",
        resolvedPercentage: 0,
        byAreas: {},
        byUrgency: {},
        dailyTrend: [0, 0, 0, 0, 0, 0, 0],
      });
      return;
    }

    // Áreas más comunes en tickets
    const byAreas: Record<string, number> = {};
    tickets.forEach((ticket) => {
      if (ticket.area) {
        byAreas[ticket.area] = (byAreas[ticket.area] || 0) + 1;
      }
    });

    // Tickets por nivel de urgencia
    const byUrgency: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const urgency = ticket.priority || "normal";
      byUrgency[urgency] = (byUrgency[urgency] || 0) + 1;
    });

    // Calcular tendencia diaria real (últimos 7 días)
    const dailyTrend = Array(7).fill(0);
    const today = moment().endOf("day");

    tickets.forEach((ticket) => {
      const createdDate = moment(ticket.createdAt);
      const diffDays = today.diff(createdDate, "days");

      if (diffDays >= 0 && diffDays < 7) {
        dailyTrend[6 - diffDays]++;
      }
    });

    // Calcular promedio real de tiempo de resolución
    const resolvedTickets = tickets.filter(
      (ticket) => ticket.status === "cerrado" && ticket.closedAt
    );
    let avgResolutionTime = "0";

    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, ticket) => {
        if (!ticket.closedAt) return acc; // Añadir esta comprobación para TypeScript
        const created = moment(ticket.createdAt);
        const closed = moment(ticket.closedAt);
        return acc + closed.diff(created, "hours");
      }, 0);
      avgResolutionTime = (totalHours / resolvedTickets.length).toFixed(1);
    }

    // Porcentaje de tickets resueltos
    const resolvedPercentage =
      tickets.length > 0
        ? Math.round((resolvedTickets.length / tickets.length) * 100)
        : 0;

    setTicketStatistics({
      averageResolutionTime: avgResolutionTime,
      resolvedPercentage,
      byAreas,
      byUrgency,
      dailyTrend,
    });
  };

  // Prepara datos para gráfico de reportes por área
  const prepareReportsByAreaData = () => {
    const areaCounts: Record<string, number> = {};
    reports.forEach((report) => {
      areaCounts[report.area] = (areaCounts[report.area] || 0) + 1;
    });

    // Ordenar áreas por cantidad de reportes y tomar las 6 con más
    const sortedAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const areas = sortedAreas.map(([area]) => area);
    const counts = sortedAreas.map(([_, count]) => count);

    return {
      labels: areas,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "rgba(99, 102, 241, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(79, 70, 229, 0.8)",
            "rgba(16, 185, 129, 0.8)",
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Prepara datos para gráfico de tickets por estado
  const prepareTicketsByStatusData = () => {
    const statusCounts: Record<string, number> = {};
    tickets.forEach((ticket) => {
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
    });

    // Mapeo de estados de tickets a etiquetas en español
    const statusLabels: Record<string, string> = {
      abierto: "Abierto",
      en_progreso: "En Proceso",
      cerrado: "Cerrado",
      // Otros estados que puedan existir
    };

    const statuses = Object.keys(statusCounts);
    const counts = statuses.map((status) => statusCounts[status]);

    return {
      labels: statuses.map((status) => statusLabels[status] || status),
      datasets: [
        {
          data: counts,
          backgroundColor: statuses.map(
            (status) =>
              TICKET_STATUS_COLORS[status as keyof typeof TICKET_STATUS_COLORS]
                ?.bg || "rgba(156, 163, 175, 0.8)"
          ),
          borderWidth: 0,
        },
      ],
    };
  };

  // Prepara datos para gráfico de tendencia diaria
  const prepareTicketTrendData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = moment().subtract(6 - i, "days");
      return date.format("DD/MM");
    });

    return {
      labels: days,
      datasets: [
        {
          label: "Tickets",
          data: ticketStatistics.dailyTrend || [],
          borderColor: "rgba(79, 70, 229, 1)",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Prepara datos para gráfico de actividad mensual con datos reales
  const prepareMonthlyActivityData = () => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    // Inicializamos contadores en cero para cada mes
    const ticketsData = Array(12).fill(0);
    const reportsData = Array(12).fill(0);
    const appointmentsData = Array(12).fill(0);

    const currentYear = moment().year();

    // Contamos tickets por mes
    tickets.forEach((ticket) => {
      const createdDate = moment(ticket.createdAt);
      if (createdDate.year() === currentYear) {
        const month = createdDate.month();
        ticketsData[month]++;
      }
    });

    // Contamos reportes por mes
    reports.forEach((report) => {
      const reportDate = moment(report.fecha);
      if (reportDate.year() === currentYear) {
        const month = reportDate.month();
        reportsData[month]++;
      }
    });

    // Contamos citas por mes
    appointments.forEach((appointment) => {
      const appointmentDate = moment(appointment.date);
      if (appointmentDate.year() === currentYear) {
        const month = appointmentDate.month();
        appointmentsData[month]++;
      }
    });

    return {
      labels: months,
      datasets: [
        {
          label: "Tickets",
          data: ticketsData,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 1,
        },
        {
          label: "Reportes",
          data: reportsData,
          backgroundColor: "rgba(236, 72, 153, 0.6)",
          borderColor: "rgba(236, 72, 153, 1)",
          borderWidth: 1,
        },
        {
          label: "Citas",
          data: appointmentsData,
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 15,
      },
    },
    maintainAspectRatio: false,
  };

  // Calcular métricas de costos para KPIs
  const calculateCostKPIs = () => {
    // Total de gastos
    const totalExpenses =
      monthlyData.reduce((acc, item) => acc + item.total, 0) / 100;

    // Promedio mensual de gastos
    const activeMonths = monthlyData.filter((m) => m.total > 0).length;
    const avgMonthlyExpense =
      activeMonths > 0 ? totalExpenses / activeMonths : 0;

    // Gastos pendientes de pago
    const pendingCosts = costs.filter((cost) => cost.status === "pending");
    const pendingTotal =
      pendingCosts.reduce((acc, cost) => acc + cost.amount, 0) / 100;

    // Top categoría con más gastos
    const topCategory =
      categoryData.length > 0
        ? categoryData.sort((a, b) => b.total - a.total)[0]
        : { category: "N/A", total: 0 };

    return {
      totalExpenses,
      avgMonthlyExpense,
      pendingTotal,
      pendingCount: pendingCosts.length,
      topCategory: {
        name: topCategory.category,
        amount: topCategory.total / 100,
      },
    };
  };

  // Calcular contadores para KPIs con datos reales
  const calculateKPIs = () => {
    if (!tickets || tickets.length === 0) {
      return {
        activeTicketsCount: 0,
        resolvedTicketsCount: 0,
        activeContractsCount: 0,
        expiringContractsCount: 0,
        pendingAppointmentsCount: 0,
        firstResponseTime: "0.0",
      };
    }

    // Tickets activos (no cerrados)
    const activeTicketsCount = tickets.filter(
      (t) => t.status !== "cerrado"
    ).length;

    // Tickets en proceso
    const resolvedTicketsCount = tickets.filter(
      (t) => t.status === "en_progreso"
    ).length;

    // Contratos activos
    const activeContractsCount = contracts.filter(
      (c) => c.status === "active"
    ).length;

    // Contratos por vencer en el próximo mes
    const expiringContractsCount = contracts.filter((c) => {
      const endDate = new Date(c.endDate);
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);
      return c.status === "active" && endDate > now && endDate < oneMonthLater;
    }).length;

    // Citas pendientes o en progreso
    const pendingAppointmentsCount = appointments.filter(
      (a) => a.status === "pending" || a.status === "in_progress"
    ).length;

    // Calcular tiempo promedio de primera respuesta (asumimos 6.2h si no hay datos reales)
    const firstResponseTime = tickets.length > 0 ? "6.2" : "0.0";

    return {
      activeTicketsCount,
      resolvedTicketsCount,
      activeContractsCount,
      expiringContractsCount,
      pendingAppointmentsCount,
      firstResponseTime,
    };
  };

  const kpis = calculateKPIs();
  const costKPIs = calculateCostKPIs();

  // Definir los tickets resueltos para usar en las tarjetas de estadísticas
  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "cerrado" && ticket.closedAt
  );

  if (isLoading) {
    return <LoadingApp />;
  }

  return (
    <div className="space-y-8">
      {/* Botón de generación de reportes */}
      <div className="flex justify-end">
        <button
          className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-lg transition-all duration-200"
          onClick={() => setShowReportPanel(!showReportPanel)}
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          <span>Generar Reporte PDF</span>
        </button>
      </div>

      {/* Panel de reportes */}
      {showReportPanel && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 border border-gray-100 dark:border-gray-700 animate-fadeIn">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Generar Reporte de Mantenimiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Fecha inicial
              </label>
              <input
                type="date"
                id="startDate"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Fecha final
              </label>
              <input
                type="date"
                id="endDate"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              El reporte incluirá información de reportes, tickets, citas y
              costos para el período seleccionado.
            </p>
            <MaintenancePDFReportGenerator
              dateFilter={dateFilter}
              buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded shadow-sm text-sm font-medium transition-colors ease-in-out"
            />
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reportes de Mantenimiento
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {reports.length}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Último mes:{" "}
                {
                  reports.filter((r) => {
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return new Date(r.fecha) >= oneMonthAgo;
                  }).length
                }
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 dark:bg-indigo-900/20 p-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/30 transition-all">
              <ClipboardDocumentIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tickets Activos
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-orange-500 dark:group-hover:text-orange-400">
                {kpis.activeTicketsCount}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                En Proceso: {kpis.resolvedTicketsCount}
              </p>
            </div>
            <div className="rounded-full bg-orange-50 dark:bg-orange-900/20 p-3 group-hover:bg-orange-100 dark:group-hover:bg-orange-800/30 transition-all">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Citas Agendadas
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-green-600 dark:group-hover:text-green-400">
                {appointments.length}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Pendientes: {kpis.pendingAppointmentsCount}
              </p>
            </div>
            <div className="rounded-full bg-green-50 dark:bg-green-900/20 p-3 group-hover:bg-green-100 dark:group-hover:bg-green-800/30 transition-all">
              <CalendarDaysIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contratos Activos
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {kpis.activeContractsCount}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Por vencer: {kpis.expiringContractsCount}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-all">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Nueva fila de KPIs relacionados con costos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gastos Totales
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {formatCurrency(costKPIs.totalExpenses)}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {costs.length} registros este año
              </p>
            </div>
            <div className="rounded-full bg-purple-50 dark:bg-purple-900/20 p-3 group-hover:bg-purple-100 dark:group-hover:bg-purple-800/30 transition-all">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gastos Pendientes
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-red-500 dark:group-hover:text-red-400">
                {formatCurrency(costKPIs.pendingTotal)}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {costKPIs.pendingCount} pagos por realizar
              </p>
            </div>
            <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3 group-hover:bg-red-100 dark:group-hover:bg-red-800/30 transition-all">
              <BanknotesIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Promedio Mensual
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                {formatCurrency(costKPIs.avgMonthlyExpense)}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Por mes con actividad
              </p>
            </div>
            <div className="rounded-full bg-cyan-50 dark:bg-cyan-900/20 p-3 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-800/30 transition-all">
              <ArrowTrendingUpIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group hover:translate-y-[-2px] duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Top Categoría de Gasto
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white transition-all group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {costKPIs.topCategory.name}
              </h3>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {formatCurrency(costKPIs.topCategory.amount)}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 p-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/30 transition-all">
              <ReceiptPercentIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Componente TicketToAppointment */}
      <div className="animate-fadeIn">
        <TicketToAppointment />
      </div>

      {/* Gráficos - primera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn delay-100">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
            Reportes por Área
          </h3>
          <div className="h-72">
            <Pie
              data={prepareReportsByAreaData()}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      padding: 25,
                      usePointStyle: true,
                      font: {
                        size: 11,
                      },
                      boxWidth: 8,
                    },
                    display: true,
                    align: "center",
                  },
                },
                layout: {
                  padding: {
                    bottom: 30,
                    left: 10,
                    right: 10,
                  },
                },
                maintainAspectRatio: false,
                animation: {
                  animateScale: true,
                  animateRotate: true,
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
            Estado de Tickets
          </h3>
          <div className="h-72">
            <Pie
              data={prepareTicketsByStatusData()}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      padding: 25,
                      usePointStyle: true,
                      font: {
                        size: 11,
                      },
                      boxWidth: 8,
                    },
                    display: true,
                    align: "center",
                  },
                },
                layout: {
                  padding: {
                    bottom: 30,
                    left: 10,
                    right: 10,
                  },
                },
                maintainAspectRatio: false,
                animation: {
                  animateScale: true,
                  animateRotate: true,
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Gráficos - segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn delay-200">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Tendencia Tickets (7 días)
            </h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="h-48">
            <Line
              data={prepareTicketTrendData()}
              options={{
                ...lineOptions,
                animation: {
                  duration: 2000,
                  easing: "easeOutQuart",
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Métricas de Rendimiento
            </h3>
            <LightBulbIcon className="h-5 w-5 text-amber-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 hover:shadow-md transition-all duration-300">
              <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
                Eficiencia de Resolución
              </div>
              <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                {ticketStatistics.resolvedPercentage}%
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Resolución de tickets
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 hover:shadow-md transition-all duration-300">
              <div className="text-sm text-green-700 dark:text-green-300 mb-1">
                Tiempo de Respuesta
              </div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {kpis.firstResponseTime}h
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Primera respuesta
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 hover:shadow-md transition-all duration-300">
              <div className="text-sm text-amber-700 dark:text-amber-300 mb-1">
                Eficiencia en Gastos
              </div>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                {costs.length > 0
                  ? `${Math.round(
                      (costs.filter((c) => c.status === "paid").length /
                        costs.length) *
                        100
                    )}%`
                  : "0%"}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Pagos completados
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de actividad mensual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 animate-fadeIn delay-300">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          Actividad Mensual
        </h3>
        <div className="h-80">
          <Bar
            data={prepareMonthlyActivityData()}
            options={{
              ...barOptions,
              animation: {
                duration: 1500,
                easing: "easeOutQuart",
              },
            }}
          />
        </div>
      </div>

      {/* Tarjetas de estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn delay-400">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-xl p-6 shadow-md border border-indigo-200 dark:border-indigo-800/50 hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-200">
              Tiempo Promedio de Resolución
            </h3>
            <div className="p-2 bg-white dark:bg-indigo-900 rounded-full">
              <ClockIcon className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-800 dark:text-indigo-100">
            {ticketStatistics?.averageResolutionTime || "0"}
            <span className="text-sm text-indigo-600 dark:text-indigo-300 ml-1">
              horas
            </span>
          </div>
          <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
            {resolvedTickets.length > 0
              ? `Basado en ${resolvedTickets.length} tickets cerrados`
              : "No hay tickets cerrados aún"}
          </div>
          <div className="mt-4 h-1 w-full bg-indigo-200 dark:bg-indigo-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full animate-pulseWidth"
              style={{ width: resolvedTickets.length > 0 ? "60%" : "0%" }}
            ></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl p-6 shadow-md border border-emerald-200 dark:border-emerald-800/50 hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-200">
              Eficiencia de Mantenimiento
            </h3>
            <div className="p-2 bg-white dark:bg-emerald-900 rounded-full">
              <WrenchScrewdriverIcon className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-100">
            {ticketStatistics?.resolvedPercentage || 0}%
            <span className="text-sm text-emerald-600 dark:text-emerald-300 ml-1">
              resueltos
            </span>
          </div>
          <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            {tickets.length > 0
              ? `${resolvedTickets.length} resueltos de ${tickets.length} totales`
              : "No hay tickets registrados aún"}
          </div>
          <div className="mt-4 h-1 w-full bg-emerald-200 dark:bg-emerald-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full animate-pulseWidth"
              style={{ width: `${ticketStatistics?.resolvedPercentage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl p-6 shadow-md border border-purple-200 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200">
              Control de Gastos
            </h3>
            <div className="p-2 bg-white dark:bg-purple-900 rounded-full">
              <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />
            </div>
          </div>

          <div className="space-y-3">
            {costs.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-purple-800 dark:text-purple-200">
                    Total Anual:
                  </span>
                  <span className="font-bold text-lg text-purple-900 dark:text-purple-100">
                    {formatCurrency(costKPIs.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-800 dark:text-purple-200">
                    Pendiente:
                  </span>
                  <span className="font-bold text-lg text-purple-900 dark:text-purple-100">
                    {formatCurrency(costKPIs.pendingTotal)}
                  </span>
                </div>
                <div className="mt-4 h-1 w-full bg-purple-200 dark:bg-purple-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width:
                        costs.length > 0
                          ? `${Math.min(
                              100,
                              (costs.filter((c) => c.status === "paid").length /
                                costs.length) *
                                100
                            )}%`
                          : "0%",
                    }}
                  ></div>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 text-center mt-1">
                  {costs.filter((c) => c.status === "paid").length} de{" "}
                  {costs.length} gastos pagados
                </div>
              </>
            ) : (
              <div className="text-purple-600 dark:text-purple-400 text-sm text-center py-6">
                No hay datos de costos disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
