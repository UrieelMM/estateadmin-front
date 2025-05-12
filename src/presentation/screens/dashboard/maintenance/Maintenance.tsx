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
} from "@heroicons/react/24/solid";
import MaintenanceDashboard from "./MaintenanceDashboard";
import MaintenanceAppointments from "./MaintenanceAppointments";
import MaintenanceContracts from "./MaintenanceContracts";
import MaintenanceCosts from "./MaintenanceCosts";
import { useTicketsStore } from "./tickets/ticketsStore";

const Maintenance = () => {
  // Estado para controlar la apertura del formulario
  const [open, setOpen] = useState(false);
  // Estado para almacenar el reporte seleccionado en modo edición (null para modo creación)
  const [reportToEdit, setReportToEdit] = useState<MaintenanceReport | null>(
    null
  );
  const { fetchReports } = useMaintenanceReportStore();
  const { fetchTickets } = useTicketsStore();

  useEffect(() => {
    // Cargar datos al iniciar el componente
    fetchReports();
    fetchTickets();
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
    "dashboard" | "reportes" | "tickets" | "citas" | "contratos" | "costos"
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
      <div className="flex border-b text-sm border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto py-1 custom-scrollbar">
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "dashboard"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("dashboard")}
        >
          <DocumentChartBarIcon className="h-4 w-4 mr-2" />
          Panel de Control
        </button>
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "reportes"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("reportes")}
        >
          <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
          Reportes
        </button>
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "tickets"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("tickets")}
        >
          <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
          Tickets
        </button>
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "citas"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("citas")}
        >
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          Agenda de Visitas
        </button>
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "contratos"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("contratos")}
        >
          <UserGroupIcon className="h-4 w-4 mr-2" />
          Proveedores y Contratos
        </button>
        <button
          className={`py-2 px-4 flex items-center whitespace-nowrap transition-all ${
            tab === "costos"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white font-medium"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => setTab("costos")}
        >
          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
          Control de Costos
        </button>
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
    </div>
  );
};

export default Maintenance;
