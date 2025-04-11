import React, { useState } from "react";
import {
  Project,
  ProjectStatus,
  useProjectStore,
} from "../../../../store/projectStore";
import { toast } from "react-hot-toast";
import {
  PencilIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import EditProjectModal from "./components/EditProjectModal";
import NewExpenseModal from "./components/NewExpenseModal";
import ProjectBudgetChart from "./components/ProjectBudgetChart";
import ProjectExpensesTable from "./components/ProjectExpensesTable";
import ProjectExpenseTagsChart from "./components/ProjectExpenseTagsChart";
import ProjectStatusBadge from "./components/ProjectStatusBadge";
import ProjectSummaryCard from "./components/ProjectSummaryCard";
import KanbanBoardModal from "./components/KanbanBoardModal";

interface ProjectDashboardProps {
  project: Project;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project }) => {
  const { projectExpenses, updateProject } = useProjectStore();

  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false);

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

  // Calcular porcentaje de presupuesto utilizado
  const budgetUsedPercent =
    project.initialBudget > 0
      ? 100 - ((project.currentBudget || 0) / project.initialBudget) * 100
      : 0;

  // Manejar cambio de estado del proyecto
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProject(project.id, { status: newStatus });
      toast.success(
        `Estado del proyecto actualizado a: ${getStatusLabel(newStatus)}`
      );
    } catch (error) {
      toast.error("Error al actualizar el estado del proyecto");
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
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.status === ProjectStatus.IN_PROGRESS && (
            <>
              <button
                onClick={() => handleStatusChange(ProjectStatus.COMPLETED)}
                className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#38b000] hover:bg-[#5ab630]"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Marcar como Finalizado
              </button>

              <button
                onClick={() => handleStatusChange(ProjectStatus.CANCELLED)}
                className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-md text-white bg-[#ea282b] hover:bg-[#ed5154]"
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
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProjectSummaryCard
          title="Presupuesto Inicial"
          value={`$${project.initialBudget.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`Asignado: ${new Date(project.createdAt).toLocaleDateString(
            "es-MX"
          )}`}
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
          value={`${daysElapsed} días`}
          subtitle={`Desde: ${new Date(project.startDate).toLocaleDateString(
            "es-MX"
          )}`}
          icon="calendar"
          color="indigo"
        />

        <ProjectSummaryCard
          title="Tiempo Restante"
          value={daysRemaining > 0 ? `${daysRemaining} días` : "Vencido"}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
        <ProjectExpensesTable expenses={projectExpenses} />
      </div>

      {/* Modal para registrar nuevo gasto */}
      <NewExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Modal para editar proyecto */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
      />

      {/* Modal Kanban para gestionar tareas */}
      <KanbanBoardModal
        isOpen={isKanbanModalOpen}
        onClose={() => setIsKanbanModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
};

export default ProjectDashboard;
