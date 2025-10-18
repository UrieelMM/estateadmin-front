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
} from "@heroicons/react/24/solid";
import MaintenanceDashboard from "./MaintenanceDashboard";
import MaintenanceAppointments from "./MaintenanceAppointments";
import MaintenanceContracts from "./MaintenanceContracts";
import MaintenanceCosts from "./MaintenanceCosts";
import MaintenanceAppReports from "./MaintenanceAppReports";
import { useTicketsStore } from "./tickets/ticketsStore";
import { useConfigStore } from "../../../../store/useConfigStore";

const Maintenance = () => {
  // Estado para controlar la apertura del formulario
  const [open, setOpen] = useState(false);
  // Estado para almacenar el reporte seleccionado en modo edición (null para modo creación)
  const [reportToEdit, setReportToEdit] = useState<MaintenanceReport | null>(
    null
  );
  const { fetchReports } = useMaintenanceReportStore();
  const { fetchTickets } = useTicketsStore();
  const { hasMaintenanceApp, checkMaintenanceAppAccess } = useConfigStore();

  useEffect(() => {
    // Cargar datos al iniciar el componente
    fetchReports();
    fetchTickets();
    checkMaintenanceAppAccess();
  }, []);

  // Función para manejar la edición: guarda el reporte seleccionado y abre el formulario
  const handleEdit = (report: MaintenanceReport) => {
    setReportToEdit(report);
    setOpen(true);
  };

  // Al cerrar el formulario se reinicia el estado del reporte seleccionado
  const handleClose = () => {
    setOpen(false);
    setReportToEdit(null);
  };

  const [tab, setTab] = useState<
    | "dashboard"
    | "reportes"
    | "tickets"
    | "citas"
    | "contratos"
    | "costos"
    | "app"
  >("dashboard");
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

      {/* Navegación de pestañas moderna */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "dashboard"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("dashboard")}
          >
            <DocumentChartBarIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "dashboard" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Panel de Control</span>
            {tab === "dashboard" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "reportes"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("reportes")}
          >
            <ClipboardDocumentCheckIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "reportes" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Reportes</span>
            {tab === "reportes" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "tickets"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("tickets")}
          >
            <WrenchScrewdriverIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "tickets" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Tickets</span>
            {tab === "tickets" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "citas"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("citas")}
          >
            <CalendarDaysIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "citas" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Agenda de Visitas</span>
            {tab === "citas" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "contratos"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("contratos")}
          >
            <UserGroupIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "contratos" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Contratos</span>
            {tab === "contratos" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          <button
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              ${
                tab === "costos"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }
            `}
            onClick={() => setTab("costos")}
          >
            <CurrencyDollarIcon
              className={`h-5 w-5 transition-transform duration-300 ${
                tab === "costos" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="whitespace-nowrap">Costos</span>
            {tab === "costos" && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
            )}
          </button>

          {hasMaintenanceApp && (
            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  tab === "app"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => setTab("app")}
            >
              <DevicePhoneMobileIcon
                className={`h-5 w-5 transition-transform duration-300 ${
                  tab === "app" ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="whitespace-nowrap">App Mantenimiento</span>
              {tab === "app" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {tab === "dashboard" && (
        <div className="mt-4">
          <MaintenanceDashboard />
        </div>
      )}

      {tab === "reportes" && (
        <>
          <div className="-mx-4 mt-6 sm:-mx-0 py-4">
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
          </div>
          <MaintenanceReportsForm
            isOpen={open}
            onClose={handleClose}
            initialData={reportToEdit || undefined}
          />
        </>
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

      {tab === "app" && hasMaintenanceApp && (
        <div className="mt-6">
          <MaintenanceAppReports />
        </div>
      )}
    </div>
  );
};

export default Maintenance;
