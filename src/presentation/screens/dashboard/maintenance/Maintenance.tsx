import { useState } from "react";
import MaintenanceReportsForm from "../../../components/shared/forms/MaintenanceReportsForm";
import MaintenanceReportsTable from "./MaintenanceReportsTable";
import { MaintenanceReport } from "../../../../store/useMaintenanceStore";
import TicketsMain from "./tickets/TicketsMain";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid";

const Maintenance = () => {
  // Estado para controlar la apertura del formulario
  const [open, setOpen] = useState(false);
  // Estado para almacenar el reporte seleccionado en modo edición (null para modo creación)
  const [reportToEdit, setReportToEdit] = useState<MaintenanceReport | null>(
    null
  );

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

  const [tab, setTab] = useState<"reportes" | "tickets">("reportes");
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
      <div className="flex border-b text-sm border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 ${
            tab === "reportes"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setTab("reportes")}
        >
          Reportes
        </button>
        <button
          className={`py-2 px-4 text-sm ${
            tab === "tickets"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setTab("tickets")}
        >
          Tickets de Mantenimiento
        </button>
      </div>
      {tab === "reportes" && (
        <>
          <div className="-mx-4 mt-8 sm:-mx-0 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">
                Reportes de Mantenimiento
              </h2>
              <button
                className="btn-primary h-10"
                onClick={() => {
                  setReportToEdit(null);
                  setOpen(true);
                }}
              >
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
        <div className="mt-8">
          {/* Nuevo sistema de gestión de tickets */}
          <TicketsMain />
        </div>
      )}
    </div>
  );
};

export default Maintenance;
