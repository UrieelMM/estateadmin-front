import { useState, useEffect } from "react";
import {
  MaintenanceCost,
  useMaintenanceCostStore,
} from "../../../../store/useMaintenanceStore";

import { Tab } from "@headlessui/react";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import MaintenanceCostForm from "../../../components/shared/forms/MaintenanceCostForm";
import MaintenanceCostsTable from "./MaintenanceCostsTable";
import MaintenanceCostSummary from "./MaintenanceCostSummary";

const MaintenanceCosts = () => {
  // Estado para controlar la apertura del formulario
  const [open, setOpen] = useState(false);
  // Estado para almacenar el costo seleccionado en modo edición (null para modo creación)
  const [costToEdit, setCostToEdit] = useState<MaintenanceCost | null>(null);
  // Estado para los filtros
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
  });
  const { fetchCosts, loading } = useMaintenanceCostStore();

  // Cargar costos al iniciar el componente
  useEffect(() => {
    fetchCosts();
  }, []);

  // Función para manejar la edición
  const handleEdit = (cost: MaintenanceCost) => {
    setCostToEdit(cost);
    setOpen(true);
  };

  // Al cerrar el formulario se reinicia el estado
  const handleClose = () => {
    setOpen(false);
    setCostToEdit(null);
  };

  // Función para aplicar filtros
  const handleApplyFilters = () => {
    // Crear un objeto de filtros con solo los valores no vacíos
    const activeFilters: {
      startDate?: string;
      endDate?: string;
      category?: string;
    } = {};

    if (filters.startDate) {
      activeFilters.startDate = filters.startDate;
    }

    if (filters.endDate) {
      activeFilters.endDate = filters.endDate;
    }

    if (filters.category) {
      activeFilters.category = filters.category;
    }

    // Si no hay filtros activos, cargar todos los datos
    if (Object.keys(activeFilters).length === 0) {
      fetchCosts();
    } else {
      fetchCosts(activeFilters);
    }
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
    });

    // Recargar todos los datos sin filtros
    fetchCosts();
  };

  // Validar si hay filtros activos
  const hasActiveFilters =
    filters.startDate || filters.endDate || filters.category;

  return (
    <div className="px-4 py-2 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Control de Costos de Mantenimiento
        </h2>
        <button
          type="button"
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors duration-150 ease-in-out"
          onClick={() => {
            setCostToEdit(null);
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
          Registrar Gasto
        </button>
      </div>

      <Tab.Group>
        <Tab.List className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium flex items-center transition-all ${
                selected
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`
            }
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            Registro de Gastos
          </Tab>
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium flex items-center transition-all ${
                selected
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`
            }
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Resumen y Reportes
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Filtros de búsqueda
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Categoría
                  </label>
                  <select
                    id="category"
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md"
                  >
                    <option value="">Todas las categorías</option>
                    <option value="Materiales">Materiales</option>
                    <option value="Mano de obra">Mano de obra</option>
                    <option value="Repuestos">Repuestos</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Aplicando...
                    </>
                  ) : (
                    "Aplicar Filtros"
                  )}
                </button>
              </div>
            </div>

            <MaintenanceCostsTable onEdit={handleEdit} />
          </Tab.Panel>

          <Tab.Panel>
            <MaintenanceCostSummary />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <MaintenanceCostForm
        isOpen={open}
        onClose={handleClose}
        initialData={costToEdit || undefined}
      />
    </div>
  );
};

export default MaintenanceCosts;
