import React, { useEffect, useState } from "react";
import {
  usePlanningStore,
  PlanningType,
  PlanningStatus,
  type Planning as PlanningInterface,
} from "../../../../store/planningStore";
import PlanningList from "./components/PlanningList";
import PlanningDashboard from "./components/PlanningDashboard";
import NewPlanningModal from "./components/NewPlanningModal";

import moment from "moment";
import "moment/locale/es";
import { Tab } from "@headlessui/react";
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Inicializar moment en español
moment.locale("es");

const Planning: React.FC = () => {
  const { plannings, loading, error, fetchPlannings } = usePlanningStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filteredPlannings, setFilteredPlannings] = useState<
    PlanningInterface[]
  >([]);
  const [filter, setFilter] = useState<{
    type?: PlanningType;
    status?: PlanningStatus;
  }>({});

  useEffect(() => {
    fetchPlannings();
  }, [fetchPlannings]);

  useEffect(() => {
    let filtered = [...plannings];

    if (filter.type) {
      filtered = filtered.filter((p) => p.type === filter.type);
    }

    if (filter.status) {
      filtered = filtered.filter((p) => p.status === filter.status);
    }

    setFilteredPlannings(filtered);
  }, [plannings, filter]);

  const handleFilterChange = (type?: PlanningType, status?: PlanningStatus) => {
    setFilter({ ...filter, type, status });
  };

  const openNewPlanningModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectPlanning = (planningId: string) => {
    setSelectedPlanning(planningId);
    setSelectedTab(1); // Cambiar a la pestaña de Dashboard
  };

  if (loading && !plannings.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 text-primary animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Planificación
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona las planificaciones de tu condominio
          </p>
        </div>
        <button
          onClick={openNewPlanningModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nueva Planificación
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-md
                ${
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-primary dark:text-primary"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-700 dark:hover:text-gray-300"
                }`
              }
            >
              <div className="flex items-center justify-center">
                <ClipboardDocumentCheckIcon className="mr-2 h-5 w-5" />
                Lista de Planificaciones
              </div>
            </Tab>
            {selectedPlanning && (
              <Tab
                className={({ selected }) =>
                  `w-full py-2.5 text-sm font-medium leading-5 rounded-md
                  ${
                    selected
                      ? "bg-white dark:bg-gray-800 shadow text-primary dark:text-primary"
                      : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-700 dark:hover:text-gray-300"
                  }`
                }
              >
                <div className="flex items-center justify-center">
                  <ChartBarIcon className="mr-2 h-5 w-5" />
                  Dashboard
                </div>
              </Tab>
            )}
          </Tab.List>
          <Tab.Panels className="p-4">
            <Tab.Panel>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Planificación
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={filter.type || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        e.target.value as PlanningType,
                        filter.status
                      )
                    }
                  >
                    <option value="">Todos</option>
                    <option value={PlanningType.MONTHLY}>Mensual</option>
                    <option value={PlanningType.QUARTERLY}>Trimestral</option>
                    <option value={PlanningType.BIANNUAL}>Semestral</option>
                    <option value={PlanningType.ANNUAL}>Anual</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={filter.status || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        filter.type,
                        e.target.value as PlanningStatus
                      )
                    }
                  >
                    <option value="">Todos</option>
                    <option value={PlanningStatus.DRAFT}>Borrador</option>
                    <option value={PlanningStatus.IN_PROGRESS}>
                      En Progreso
                    </option>
                    <option value={PlanningStatus.COMPLETED}>Completado</option>
                    <option value={PlanningStatus.CANCELLED}>Cancelado</option>
                  </select>
                </div>
              </div>
              <PlanningList
                plannings={filteredPlannings}
                onSelectPlanning={handleSelectPlanning}
              />
            </Tab.Panel>
            {selectedPlanning && (
              <Tab.Panel>
                <PlanningDashboard
                  planningId={selectedPlanning}
                  onBack={() => setSelectedTab(0)}
                />
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {isModalOpen && (
        <NewPlanningModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={(planningId: string) => {
            setSelectedPlanning(planningId);
            setSelectedTab(1);
          }}
        />
      )}
    </div>
  );
};

export default Planning;
