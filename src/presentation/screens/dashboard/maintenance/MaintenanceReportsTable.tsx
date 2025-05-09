import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  MaintenanceReport,
  MaintenanceReportFilters,
  useMaintenanceReportStore,
} from "../../../../store/useMaintenanceStore";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentMagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

// Componente del modal de confirmación para eliminar
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reportName: string;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  reportName,
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationCircleIcon
              className="h-6 w-6 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Eliminar reporte
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ¿Estás seguro de eliminar este reporte del área{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {reportName}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

interface MaintenanceReportsTableProps {
  // Función para abrir el formulario de edición con los datos del reporte seleccionado.
  onEdit: (report: MaintenanceReport) => void;
}

const MaintenanceReportsTable: React.FC<MaintenanceReportsTableProps> = ({
  onEdit,
}) => {
  // Estados para filtros
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [area, _setArea] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estado para el modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [reportAreaToDelete, setReportAreaToDelete] = useState<string>("");

  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const reportsPerPage = 10;

  const { reports, fetchReports, deleteReport } = useMaintenanceReportStore();

  // Opciones de año y mes
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) =>
    (currentYear - i).toString()
  );

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

  // Si se selecciona un mes sin año, se asume el año actual
  useEffect(() => {
    const filters: MaintenanceReportFilters = {};
    const effectiveYear = year
      ? parseInt(year)
      : month
      ? currentYear
      : undefined;
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

  // Funciones para abrir y cerrar el modal de eliminación
  const handleOpenDeleteModal = (reportId: string, reportArea: string) => {
    setReportToDelete(reportId);
    setReportAreaToDelete(reportArea);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setReportToDelete(null);
    setReportAreaToDelete("");
  };

  // Función para eliminar un reporte
  const handleDelete = async () => {
    if (reportToDelete) {
      try {
        await deleteReport(reportToDelete);
        toast.success("Reporte eliminado correctamente");
        handleCloseDeleteModal();
      } catch (error) {
        toast.error("Error al eliminar el reporte");
        handleCloseDeleteModal();
      }
    }
  };

  // Formatea la fecha en formato dd/mm/aaaa
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return `${("0" + d.getDate()).slice(-2)}/${("0" + (d.getMonth() + 1)).slice(
      -2
    )}/${d.getFullYear()}`;
  };

  // Paginación
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const currentReports = reports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Estado para el modal de "Ver" reporte
  const [reportToView, setReportToView] = useState<MaintenanceReport | null>(
    null
  );

  const resetFilters = () => {
    setYear("");
    setMonth("");
    setIsFilterOpen(false);
  };

  const getMonthName = (monthNum: string) => {
    const month = monthOptions.find((m) => m.value === monthNum);
    return month ? month.label : "";
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">
            Filtros
          </h3>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center text-sm"
          >
            {isFilterOpen ? "Ocultar filtros" : "Mostrar filtros"}
            <ChevronDownIcon
              className={`ml-1 h-4 w-4 transition-transform ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isFilterOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Año
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                >
                  <option value="">Todos los años</option>
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mes
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Resumen de filtros aplicados */}
        {(year || month) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {year && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                Año: {year}
              </span>
            )}
            {month && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                Mes: {getMonthName(month)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla de reportes */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Encargado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {currentReports && currentReports.length > 0 ? (
                currentReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(report.fecha)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {report.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {report.encargado}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setReportToView(report)}
                          className="group relative rounded-full p-1.5 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          title="Ver detalles"
                        >
                          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                          <span className="sr-only">Ver</span>
                        </button>
                        <button
                          onClick={() => onEdit(report)}
                          className="group relative rounded-full p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          title="Editar reporte"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Editar</span>
                        </button>
                        <button
                          onClick={() =>
                            handleOpenDeleteModal(report.id!, report.area)
                          }
                          className="group relative rounded-full p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Eliminar reporte"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="sr-only">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p>
                        No se encontraron reportes para los filtros
                        seleccionados
                      </p>
                      {(year || month) && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * reportsPerPage + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * reportsPerPage, reports.length)}
                  </span>{" "}
                  de <span className="font-medium">{reports.length}</span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                      currentPage === 1
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                    } focus:z-20`}
                  >
                    <span className="sr-only">Anterior</span>
                    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            : "text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20"
                        }`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                      currentPage === totalPages
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                    } focus:z-20`}
                  >
                    <span className="sr-only">Siguiente</span>
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>

            <div className="flex sm:hidden justify-between w-full">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  currentPage === 1
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Anterior
              </button>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  currentPage === totalPages
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver reporte */}
      {reportToView && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Detalles del Reporte
              </h2>
              <button
                onClick={() => setReportToView(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Fecha
                    </div>
                    <p className="text-gray-900 dark:text-white text-lg">
                      {formatDate(reportToView.fecha)}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Área
                    </div>
                    <p className="text-gray-900 dark:text-white text-lg">
                      {reportToView.area}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Encargado
                    </div>
                    <p className="text-gray-900 dark:text-white text-lg">
                      {reportToView.encargado}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-sm">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Detalle
                  </div>
                  <div
                    className="prose dark:prose-invert max-w-none prose-sm sm:prose-base"
                    dangerouslySetInnerHTML={{ __html: reportToView.detalle }}
                  />
                </div>

                {reportToView.evidenciaUrl && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-sm">
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Evidencia
                    </div>
                    <a
                      href={reportToView.evidenciaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-gray-800"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Ver documento
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => {
                    setReportToView(null);
                    if (reportToView.id) onEdit(reportToView);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:ring-offset-gray-800"
                >
                  <PencilSquareIcon className="mr-2 h-4 w-4" />
                  Editar reporte
                </button>
                <button
                  onClick={() => setReportToView(null)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-gray-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        reportName={reportAreaToDelete}
      />
    </div>
  );
};

export default MaintenanceReportsTable;
