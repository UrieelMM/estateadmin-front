import { useState } from "react";
import MaintenanceReportsForm from "../../../components/shared/forms/MaintenanceReportsForm";
import MaintenanceReportsTable from "./MaintenanceReportsTable";
import { MaintenanceReport } from "../../../../store/useMaintenanceStore";

const Maintenance = () => {
  // Estado para controlar la apertura del formulario
  const [open, setOpen] = useState(false);
  // Estado para almacenar el reporte seleccionado en modo edición (null para modo creación)
  const [reportToEdit, setReportToEdit] = useState<MaintenanceReport | null>(null);

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

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
          <p className="text-md">Control de mantenimiento</p>
          <button
            className="btn-primary h-10 mb-3"
            onClick={() => {
              setReportToEdit(null); // Modo creación
              setOpen(true);
            }}
          >
            Registrar Reporte
          </button>
        </header>
        <div className="-mx-4 mt-8 sm:-mx-0 py-4">
          <h2 className="text-2xl font-bold text-indigo-600 mb-4">Reportes de Mantenimiento</h2>
          <MaintenanceReportsTable onEdit={handleEdit} />
        </div>
      </div>
      <MaintenanceReportsForm
        isOpen={open}
        onClose={handleClose}
        initialData={reportToEdit || undefined}
      />
    </>
  );
};

export default Maintenance;
