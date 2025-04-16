import { useState } from "react";
import MaintenanceReportsForm from "../../../components/shared/forms/MaintenanceReportsForm";
import MaintenanceReportsTable from "./MaintenanceReportsTable";
import { MaintenanceReport } from "../../../../store/useMaintenanceStore";
import TicketsMain from "./tickets/TicketsMain";

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
        <p className="text-md">Control de mantenimiento</p>
      </header>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-semibold focus:outline-none transition-colors rounded-t-md ${
            tab === "reportes"
              ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-gray-100 dark:bg-gray-900"
              : "text-gray-500 dark:text-gray-300"
          }`}
          onClick={() => setTab("reportes")}
        >
          Reportes
        </button>
        <button
          className={`ml-2 py-2 px-4 font-semibold focus:outline-none transition-colors rounded-t-md ${
            tab === "tickets"
              ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-gray-100 dark:bg-gray-900"
              : "text-gray-500 dark:text-gray-300"
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
