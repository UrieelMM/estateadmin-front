import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MaintenanceReport, MaintenanceReportFilters, useMaintenanceReportStore } from "../../../../store/useMaintenanceStore";

interface MaintenanceReportsTableProps {
  // Función para abrir el formulario de edición con los datos del reporte seleccionado.
  onEdit: (report: MaintenanceReport) => void;
}

const MaintenanceReportsTable: React.FC<MaintenanceReportsTableProps> = ({ onEdit }) => {
  // Estados para filtros
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [area, _setArea] = useState<string>("");

  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const reportsPerPage = 10;

  const { reports, fetchReports, deleteReport } = useMaintenanceReportStore();

  // Opciones de año y mes
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => (currentYear - i).toString());

  const monthOptions = [
    { value: "", label: "Mes" },
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  // const areaOptions = [
  //   "Lobby",
  //   "Recepción",
  //   "Vestíbulo",
  //   "Pasillos",
  //   "Ascensores",
  //   "Escaleras",
  //   "Garaje",
  //   "Zonas Verdes",
  //   "Área de Juegos",
  //   "Piscina",
  //   "Gimnasio",
  //   "Sauna",
  //   "Terraza",
  //   "Azotea",
  //   "Baños Comunes",
  //   "Salón de Eventos",
  //   "Cocina Comunal",
  //   "Jardín",
  //   "Estacionamiento",
  //   "Área de Barbacoa",
  //   "Cuarto de Basura",
  //   "Mantenimiento General",
  //   "Sistemas Eléctricos",
  //   "Plomería",
  //   "Administración"
  // ];

  // Si se selecciona un mes sin año, se asume el año actual
  useEffect(() => {
    const filters: MaintenanceReportFilters = {};
    const effectiveYear = year ? parseInt(year) : (month ? currentYear : undefined);
    if (effectiveYear) {
      filters.year = effectiveYear;
      if (month) {
        filters.month = parseInt(month);
      }
    }
    if (area) {
      filters.area = area;
    }
    fetchReports(filters);
    setCurrentPage(1);
  }, [year, month, area, fetchReports, currentYear]);

  // Función para eliminar un reporte
  const handleDelete = async (reportId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este reporte?")) {
      try {
        await deleteReport(reportId);
        toast.success("Reporte eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el reporte");
      }
    }
  };

  // Formatea la fecha en formato dd/mm/aaaa
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return `${("0" + d.getDate()).slice(-2)}/${("0" + (d.getMonth() + 1)).slice(-2)}/${d.getFullYear()}`;
  };

  // Paginación
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const currentReports = reports.slice((currentPage - 1) * reportsPerPage, currentPage * reportsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Estado para el modal de "Ver" reporte
  const [reportToView, setReportToView] = useState<MaintenanceReport | null>(null);

  return (
    <div className="p-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-start mb-4 gap-4">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border-gray-300 p-2 w-20 dark:bg-gray-900"
        >
          <option value="">Año</option>
          {yearOptions.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border-gray-300 p-2 dark:bg-gray-900"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {/* Si se requiere, se puede agregar el filtro de área aquí */}
      </div>

      {/* Tabla de reportes */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-50">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">Área</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">Encargado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-500 dark:bg-gray-800 dark:shadow-xl">
            {currentReports && currentReports.length > 0 ? (
              currentReports.map((report) => (
                <tr key={report.id} className=" hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDate(report.fecha)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{report.area}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{report.encargado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => setReportToView(report)}
                      className="text-green-600 hover:text-green-900 mr-2"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onEdit(report)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(report.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron reportes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded ${
              currentPage === 1
                ? "text-gray-400 border-gray-300"
                : "text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white"
            }`}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages
                ? "text-gray-400 border-gray-300"
                : "text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white"
            }`}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal para ver reporte */}
      {reportToView && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Ver Reporte de Mantenimiento</h2>
              <button
                onClick={() => setReportToView(null)}
                className="text-black font-bold bg-gray-200 rounded-full py-1 px-3"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-bold">Fecha: </label>
                <span>{formatDate(reportToView.fecha)}</span>
              </div>
              <div>
                <label className="font-bold">Área: </label>
                <span>{reportToView.area}</span>
              </div>
              <div>
                <label className="font-bold">Encargado: </label>
                <span>{reportToView.encargado}</span>
              </div>
              <div>
                <label className="font-bold">Detalle: </label>
                <div className="prose" dangerouslySetInnerHTML={{ __html: reportToView.detalle }} />
              </div>
              {reportToView.evidenciaUrl && (
                <div>
                  <label className="font-bold">Evidencia: </label>
                  <a 
                    href={reportToView.evidenciaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Ver documento PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceReportsTable;
