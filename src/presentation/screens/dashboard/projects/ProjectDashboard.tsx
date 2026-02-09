import React, { useState } from "react";
import {
  Project,
  ProjectStatus,
  QUOTE_CATEGORIES,
  useProjectStore,
} from "../../../../store/projectStore";
import { toast } from "react-hot-toast";
import {
  PencilIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  FlagIcon,
} from "@heroicons/react/24/solid";
import EditProjectModal from "./components/EditProjectModal";
import NewExpenseModal from "./components/NewExpenseModal";
import ProjectBudgetChart from "./components/ProjectBudgetChart";
import ProjectExpensesTable from "./components/ProjectExpensesTable";
import ProjectExpenseTagsChart from "./components/ProjectExpenseTagsChart";
import ProjectStatusBadge from "./components/ProjectStatusBadge";
import ProjectSummaryCard from "./components/ProjectSummaryCard";
import KanbanBoardModal from "./components/KanbanBoardModal";
import ProjectExportMenu from "./components/ProjectExportMenu";
import ProjectTimelineProgress from "./components/ProjectTimelineProgress";
import ProjectTimelineStats from "./components/ProjectTimelineStats";
import ProjectQuotesSection from "./components/ProjectQuotesSection";
import NewQuoteModal from "./components/NewQuoteModal";
import MilestonesList from "./components/MilestonesList";
import NewMilestoneModal from "./components/NewMilestoneModal";

interface ProjectDashboardProps {
  project: Project;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project }) => {
  const { projectExpenses, projectQuotes, updateProject } = useProjectStore();

  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false);
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [isQuotesSectionExpanded, setIsQuotesSectionExpanded] = useState(false);
  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Calcular días transcurridos y restantes
  const today = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  const daysElapsed = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.floor(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const safeDaysElapsed = Math.max(daysElapsed, 0);
  const daysRemainingLabel =
    daysRemaining >= 0
      ? `${daysRemaining} días`
      : `${Math.abs(daysRemaining)} días de retraso`;
  const projectDescription =
    project.description?.trim() ||
    "Este proyecto no tiene descripción capturada aún.";

  // Calcular porcentaje de presupuesto utilizado
  const budgetUsedPercent =
    project.initialBudget > 0
      ? 100 - ((project.currentBudget || 0) / project.initialBudget) * 100
      : 0;

  // Manejar cambio de estado del proyecto
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (newStatus === project.status) {
      return;
    }

    setIsStatusUpdating(true);
    try {
      await updateProject(project.id, { status: newStatus });
      const updateError = useProjectStore.getState().error;
      if (updateError) {
        toast.error(updateError);
        return;
      }

      toast.success(
        `Estado actualizado: ${getStatusLabel(newStatus)}`
      );
    } catch {
      toast.error("No se pudo actualizar el estado del proyecto.");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Obtener etiqueta de estado en español
  const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return "En Progreso";
      case ProjectStatus.CANCELLED:
        return "Cancelado";
      case ProjectStatus.COMPLETED:
        return "Finalizado";
      default:
        return "";
    }
  };

  // Filtrar cotizaciones para este proyecto
  const quotes = projectQuotes.filter(
    (quote) => quote.projectId === project.id
  );
  const quotesByCategory = QUOTE_CATEGORIES.reduce<Record<string, number>>(
    (acc, category) => {
      acc[category] = quotes.filter((quote) => quote.category === category).length;
      return acc;
    },
    {}
  );
  const canAddMoreQuotes = QUOTE_CATEGORIES.some(
    (category) => (quotesByCategory[category] || 0) < 5
  );

  return (
    <div className="space-y-6 p-4">
      {/* Encabezado del proyecto */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 dark:bg-gray-800 dark:text-gray-100 dark:shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
            {project.name}
            <ProjectStatusBadge status={project.status} />
          </h2>
          <p className="text-gray-600 text-sm mt-1 max-w-xl dark:text-gray-400">
            {projectDescription}
          </p>
          {isStatusUpdating && (
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-2">
              Actualizando estado del proyecto...
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            {project.status === ProjectStatus.IN_PROGRESS && (
              <>
                <button
                  onClick={() => handleStatusChange(ProjectStatus.COMPLETED)}
                  disabled={isStatusUpdating}
                  className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#38b000] hover:bg-[#5ab630] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Marcar como Finalizado
                </button>

                <button
                  onClick={() => handleStatusChange(ProjectStatus.CANCELLED)}
                  disabled={isStatusUpdating}
                  className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#ea282b] hover:bg-[#ed5154] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Cancelar Proyecto
                </button>
              </>
            )}

            <button
              onClick={() => setIsEditProjectModalOpen(true)}
              className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#4361ee] hover:bg-[#5b76f1]"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Editar Proyecto
            </button>

            <button
              onClick={() => setIsNewExpenseModalOpen(true)}
              className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#f7b801] hover:bg-[#edc54f]"
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Registrar Gasto
            </button>

            <button
              onClick={() => setIsKanbanModalOpen(true)}
              className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
              Gestionar Tareas
            </button>
          </div>

          <ProjectExportMenu project={project} />
        </div>
      </div>

      {/* Dashboard principal */}
      <div className="grid grid-cols-1 gap-6">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProjectSummaryCard
            title="Presupuesto Inicial"
            value={`$${project.initialBudget.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}`}
            subtitle={`Asignado: ${new Date(
              project.createdAt
            ).toLocaleDateString("es-MX")}`}
            icon="budget"
            color="blue"
          />

          <ProjectSummaryCard
            title="Presupuesto Restante"
            value={`$${(project.currentBudget || 0).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}`}
            subtitle={`${budgetUsedPercent.toFixed(1)}% utilizado`}
            icon="money"
            color={
              budgetUsedPercent > 90
                ? "red"
                : budgetUsedPercent > 70
                ? "yellow"
                : "green"
            }
          />

          <ProjectSummaryCard
            title="Tiempo Transcurrido"
            value={`${safeDaysElapsed} días`}
            subtitle={`Desde: ${new Date(project.startDate).toLocaleDateString(
              "es-MX"
            )}`}
            icon="calendar"
            color="indigo"
          />

          <ProjectSummaryCard
            title="Tiempo Restante"
            value={daysRemaining >= 0 ? daysRemainingLabel : "Vencido"}
            subtitle={`Hasta: ${new Date(project.endDate).toLocaleDateString(
              "es-MX"
            )}`}
            icon="clock"
            color={
              daysRemaining < 0 ? "red" : daysRemaining < 7 ? "yellow" : "green"
            }
          />
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Presupuesto Utilizado
            </h3>
            <div className="h-64">
              <ProjectBudgetChart
                initialBudget={project.initialBudget}
                currentBudget={project.currentBudget || 0}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Distribución de Gastos por Categoría
            </h3>
            <div className="h-64">
              <ProjectExpenseTagsChart expenses={projectExpenses} />
            </div>
          </div>
        </div>

        {/* Tabla de gastos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden dark:shadow-lg">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Registro de Gastos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Total de registros: {projectExpenses.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Haz clic en un gasto para ver sus detalles completos.
            </p>
          </div>
          <ProjectExpensesTable expenses={projectExpenses} />
        </div>

        {/* Sección de Cotizaciones (Ahora en su propia fila) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Cotizaciones
              </h3>
            </div>
            {quotes.length > 0 && (
              <button
                onClick={() =>
                  setIsQuotesSectionExpanded(!isQuotesSectionExpanded)
                }
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="p-6">
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No hay cotizaciones
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza agregando cotizaciones para este proyecto.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsNewQuoteModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Nueva Cotización
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {quotes.length} cotizaciones totales
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Límite: hasta 5 por categoría
                  </p>
                  {quotes.length >= 2 && (
                    <button
                      onClick={() => setIsQuotesSectionExpanded(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
                    >
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded-md inline-flex items-center mr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 mr-1"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Comparar cotizaciones
                      </span>
                    </button>
                  )}
                </div>

                {/* Vista resumida de cotizaciones - Grid con más columnas para aprovechar el espacio horizontal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {quotes.slice(0, 8).map((quote) => (
                    <div
                      key={quote.id}
                      className={`p-3 rounded-lg border ${
                        quote.isSelected
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30"
                      }`}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {quote.providerName}
                        </h4>
                        {quote.isSelected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Seleccionada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {quote.concept}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          $
                          {quote.amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {quotes.length > 8 && (
                  <button
                    onClick={() => setIsQuotesSectionExpanded(true)}
                    className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Ver todas las cotizaciones ({quotes.length})
                  </button>
                )}

                {/* Botón para agregar nueva cotización si hay espacio */}
                {canAddMoreQuotes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setIsNewQuoteModalOpen(true)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Nueva Cotización
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Sección de Progreso del Proyecto */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Progreso del Proyecto
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Timeline automático de eventos y milestones del proyecto
              </p>
            </div>
          </div>
          <ProjectTimelineStats
            project={project}
            expenses={projectExpenses}
            quotes={projectQuotes}
          />
          <ProjectTimelineProgress
            project={project}
            expenses={projectExpenses}
            quotes={projectQuotes}
          />
        </div>

        {/* Sección de Hitos del Proyecto */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FlagIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Hitos del Proyecto
              </h3>
            </div>
            <button
              onClick={() => setIsNewMilestoneModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Nuevo Hito
            </button>
          </div>
          <MilestonesList projectId={project.id} />
        </div>
      </div>

      {/* Modales */}
      <NewExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
      />
      <KanbanBoardModal
        isOpen={isKanbanModalOpen}
        onClose={() => setIsKanbanModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
      <NewQuoteModal
        isOpen={isNewQuoteModalOpen}
        onClose={() => setIsNewQuoteModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
      <NewMilestoneModal
        isOpen={isNewMilestoneModalOpen}
        onClose={() => setIsNewMilestoneModalOpen(false)}
        projectId={project.id}
      />

      {/* Vista expandida de cotizaciones */}
      {isQuotesSectionExpanded && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Cotizaciones de {project.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsQuotesSectionExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6" id="quotes-section">
              <ProjectQuotesSection
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
