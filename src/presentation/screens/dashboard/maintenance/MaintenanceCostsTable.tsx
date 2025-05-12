import { useState } from "react";
import {
  MaintenanceCost,
  useMaintenanceCostStore,
} from "../../../../store/useMaintenanceStore";
import moment from "moment";
import { formatCurrency } from "../../../../utils/curreyncy";
import {
  PencilIcon,
  TrashIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface MaintenanceCostsTableProps {
  onEdit: (cost: MaintenanceCost) => void;
}

const MaintenanceCostsTable = ({ onEdit }: MaintenanceCostsTableProps) => {
  const { costs, loading, deleteCost } = useMaintenanceCostStore();
  const [page, setPage] = useState(1);
  const [pageSize, _setPageSize] = useState(10);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(
    null
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);

  // Función para manejar la eliminación
  const handleDelete = (costId: string) => {
    setCostToDelete(costId);
    setShowConfirmDelete(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (costToDelete) {
      try {
        await deleteCost(costToDelete);
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
      setShowConfirmDelete(false);
      setCostToDelete(null);
    }
  };

  // Función para mostrar la vista previa de la factura
  const handleInvoicePreview = (url: string) => {
    setInvoicePreviewUrl(url);
  };

  // Paginación
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  const paginatedCosts = costs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(costs.length / pageSize);

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Descripción
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Categoría
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Monto
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCosts.length > 0 ? (
                  paginatedCosts.map((cost) => (
                    <tr
                      key={cost.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-normal max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {cost.description}
                        </div>
                        {cost.provider && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Proveedor: {cost.provider}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {moment(cost.date).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {cost.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(cost.amount / 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cost.status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : cost.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {cost.status === "paid"
                            ? "Pagado"
                            : cost.status === "pending"
                            ? "Pendiente"
                            : "Cancelado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit(cost)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cost.id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          {cost.invoiceFile && (
                            <button
                              onClick={() =>
                                handleInvoicePreview(cost.invoiceFile!)
                              }
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Ver factura"
                            >
                              <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {costs.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={page === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando{" "}
                    <span className="font-medium">{startIndex + 1}</span> a{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, costs.length)}
                    </span>{" "}
                    de <span className="font-medium">{costs.length}</span>{" "}
                    resultados
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={goToPrevPage}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                        page === 1
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      } border-gray-300 text-sm font-medium dark:bg-gray-700 dark:border-gray-600`}
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeftIcon
                        className={`h-5 w-5 ${
                          page === 1
                            ? "text-gray-400"
                            : "text-gray-500 dark:text-gray-300"
                        }`}
                      />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      {page}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                        page === totalPages
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      } border-gray-300 text-sm font-medium dark:bg-gray-700 dark:border-gray-600`}
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRightIcon
                        className={`h-5 w-5 ${
                          page === totalPages
                            ? "text-gray-400"
                            : "text-gray-500 dark:text-gray-300"
                        }`}
                      />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal para previsualizar facturas */}
      {invoicePreviewUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setInvoicePreviewUrl(null)}
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              ​
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                      id="modal-title"
                    >
                      Vista previa de factura
                    </h3>
                    <div className="mt-2 h-[70vh]">
                      <iframe
                        src={invoicePreviewUrl}
                        className="w-full h-full"
                        title="Vista previa de factura"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => setInvoicePreviewUrl(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              ​
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationCircleIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                      id="modal-title"
                    >
                      ¿Eliminar gasto de mantenimiento?
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Esta acción no se puede deshacer. ¿Estás seguro de que
                        deseas eliminar este registro?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceCostsTable;
