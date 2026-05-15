import { useState, useEffect } from "react";
import MaintenanceReportsForm from "../../../components/shared/forms/MaintenanceReportsForm";
import MaintenanceReportsTable from "./MaintenanceReportsTable";
import {
  MaintenanceReport,
  useMaintenanceReportStore,
} from "../../../../store/useMaintenanceStore";
import TicketsMain from "./tickets/TicketsMain";
import {
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import MaintenanceDashboard from "./MaintenanceDashboard";
import MaintenanceAppointments from "./MaintenanceAppointments";
import MaintenanceContracts from "./MaintenanceContracts";
import MaintenanceCosts from "./MaintenanceCosts";
import MaintenanceAppReports from "./MaintenanceAppReports";
import MaintenanceScheduledTasks from "./MaintenanceScheduledTasks";
import { useTicketsStore } from "./tickets/ticketsStore";
import { useConfigStore } from "../../../../store/useConfigStore";
import { useLocation, useNavigate } from "react-router-dom";

type MaintenanceTabId =
  | "dashboard"
  | "reportes"
  | "tickets"
  | "citas"
  | "contratos"
  | "costos"
  | "app";

const MAINTENANCE_TAB_PATHS: Record<MaintenanceTabId, string> = {
  dashboard: "/dashboard/maintenance-reports/dashboard",
  reportes: "/dashboard/maintenance-reports/reports",
  tickets: "/dashboard/maintenance-reports/tickets",
  citas: "/dashboard/maintenance-reports/appointments",
  contratos: "/dashboard/maintenance-reports/contracts",
  costos: "/dashboard/maintenance-reports/costs",
  app: "/dashboard/maintenance-reports/app",
};

const MAINTENANCE_PATH_TO_TAB: Record<string, MaintenanceTabId> = {
  dashboard: "dashboard",
  reports: "reportes",
  tickets: "tickets",
  appointments: "citas",
  contracts: "contratos",
  costs: "costos",
  app: "app",
  reportes: "reportes",
  citas: "citas",
  contratos: "contratos",
  costos: "costos",
};

type AppSubTab = "reportes" | "programado";

const Maintenance = () => {
  const [open, setOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<MaintenanceReport | null>(null);
  const [appSubTab, setAppSubTab] = useState<AppSubTab>("reportes");

  const { fetchReports } = useMaintenanceReportStore();
  const { fetchTickets } = useTicketsStore();
  const { hasMaintenanceApp, checkMaintenanceAppAccess } = useConfigStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
    fetchTickets();
    checkMaintenanceAppAccess();
  }, []);

  const handleEdit = (report: MaintenanceReport) => {
    setReportToEdit(report);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setReportToEdit(null);
  };

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const tabSlug = pathSegments[2] || "";
  const tabFromPath = MAINTENANCE_PATH_TO_TAB[tabSlug];
  const allowedTabs = new Set<MaintenanceTabId>([
    "dashboard",
    "reportes",
    "tickets",
    "citas",
    "contratos",
    "costos",
    ...(hasMaintenanceApp ? (["app"] as MaintenanceTabId[]) : []),
  ]);
  const tab: MaintenanceTabId =
    (tabFromPath && allowedTabs.has(tabFromPath) && tabFromPath) || "dashboard";

  useEffect(() => {
    const targetPath = MAINTENANCE_TAB_PATHS[tab];
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true, state: null });
    }
  }, [tab, location.pathname, navigate]);

  return (
    <div className="px-4 rounded-md sm:px-6 lg:px-8">
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <div className="flex items-center space-x-2">
          <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Control de mantenimiento
          </h1>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">

          {/* Panel de Control */}
          <NavTab
            active={tab === "dashboard"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.dashboard)}
            icon={<DocumentChartBarIcon className="h-5 w-5" />}
            label="Panel de Control"
          />

          {/* Reportes */}
          <NavTab
            active={tab === "reportes"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.reportes)}
            icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
            label="Reportes"
          />

          {/* Tickets */}
          <NavTab
            active={tab === "tickets"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.tickets)}
            icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
            label="Tickets"
          />

          {/* Agenda de Visitas */}
          <NavTab
            active={tab === "citas"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.citas)}
            icon={<CalendarDaysIcon className="h-5 w-5" />}
            label="Agenda de Visitas"
          />

          {/* Contratos */}
          <NavTab
            active={tab === "contratos"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.contratos)}
            icon={<UserGroupIcon className="h-5 w-5" />}
            label="Contratos"
          />

          {/* Costos */}
          <NavTab
            active={tab === "costos"}
            onClick={() => navigate(MAINTENANCE_TAB_PATHS.costos)}
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
            label="Costos"
          />

          {/* App Mantenimiento — solo si tiene la app contratada */}
          {hasMaintenanceApp && (
            <NavTab
              active={tab === "app"}
              onClick={() => navigate(MAINTENANCE_TAB_PATHS.app)}
              icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
              label="App Mantenimiento"
            />
          )}
        </div>
      </div>

      {/* ── Tab Contents ── */}

      {tab === "dashboard" && (
        <div className="mt-4">
          <MaintenanceDashboard />
        </div>
      )}

      {tab === "reportes" && (
        <div className="-mx-4 sm:-mx-0 py-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Reportes de Mantenimiento
            </h2>
            <button
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors duration-150 ease-in-out"
              onClick={() => {
                setReportToEdit(null);
                setOpen(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Registrar Reporte
            </button>
          </div>
          <MaintenanceReportsTable onEdit={handleEdit} />
          <MaintenanceReportsForm
            isOpen={open}
            onClose={handleClose}
            initialData={reportToEdit || undefined}
          />
        </div>
      )}

      {tab === "tickets" && (
        <div className="mt-6">
          <TicketsMain />
        </div>
      )}

      {tab === "citas" && (
        <div className="mt-6">
          <MaintenanceAppointments />
        </div>
      )}

      {tab === "contratos" && (
        <div className="mt-6">
          <MaintenanceContracts />
        </div>
      )}

      {tab === "costos" && (
        <div className="mt-6">
          <MaintenanceCosts />
        </div>
      )}

      {/* ── App Mantenimiento tab ── */}
      {tab === "app" && hasMaintenanceApp && (
        <div className="mt-4">
          {/* Sub-tabs: Reportes | Mantenimiento Programado */}
          <div className="mb-6">
            <div className="flex items-center gap-2 p-1.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-md w-fit">
              <button
                onClick={() => setAppSubTab("reportes")}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${
                    appSubTab === "reportes"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }
                `}
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Reportes de la App
              </button>

              <button
                onClick={() => setAppSubTab("programado")}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${
                    appSubTab === "programado"
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }
                `}
              >
                <CalendarDaysIcon className="h-4 w-4" />
                Mantenimiento Programado
              </button>
            </div>
          </div>

          {/* Sub-tab content */}
          {appSubTab === "reportes" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Reportes generados desde la App
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  <DevicePhoneMobileIcon className="h-3.5 w-3.5" />
                  App Mantenimiento
                </span>
              </div>
              <MaintenanceAppReports />
            </div>
          )}

          {appSubTab === "programado" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Mantenimiento Programado
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                  <DevicePhoneMobileIcon className="h-3.5 w-3.5" />
                  Desde la App
                </span>
              </div>
              <MaintenanceScheduledTasks />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── NavTab sub-component ─────────────────────────────────────────────────────

const NavTab = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    className={`
      group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
      transition-all duration-300 ease-out
      ${
        active
          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
      }
    `}
    onClick={onClick}
  >
    <span className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"}`}>
      {icon}
    </span>
    <span className="whitespace-nowrap">{label}</span>
    {active && <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />}
  </button>
);

export default Maintenance;
