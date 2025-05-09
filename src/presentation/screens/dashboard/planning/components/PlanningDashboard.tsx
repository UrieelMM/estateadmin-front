import React, { useEffect, useState } from "react";
import {
  usePlanningStore,
  PlanningStatus,
  TaskStatus,
  TaskPriority,
  PlanningTask,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";
import moment from "moment";
import "moment/locale/es";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  PencilSquareIcon,
  TrashIcon,
  ChartBarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import CommentsList from "./CommentsList";
import ConfirmModal from "./ConfirmModal";
import DocumentsList from "./DocumentsList";
import TaskList from "./TaskList";
import TaskModal from "./TaskModal";
import UploadDocumentModal from "./UploadDocumentModal";
import EditPlanningModal from "./EditPlanningModal";

interface PlanningDashboardProps {
  planningId: string;
  onBack: () => void;
}

const PlanningDashboard: React.FC<PlanningDashboardProps> = ({
  planningId,
  onBack,
}) => {
  const {
    currentPlanning,
    tasks,
    documents,
    comments,
    loading,
    error,
    fetchPlanningById,
    updatePlanningStatus,
    deletePlanning,
  } = usePlanningStore();
  const { getUserById } = useUserDataStore();
  const [selectedTab, setSelectedTab] = useState("tasks");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<string | null>(
    null
  );
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null);

  useEffect(() => {
    fetchPlanningById(planningId);
  }, [planningId, fetchPlanningById]);

  useEffect(() => {
    // Cargar datos de usuarios asignados a la planificación actual
    const loadUserData = async () => {
      if (!currentPlanning) return;

      const userIds = currentPlanning.assignedTo;
      const newCache: Record<string, any> = {};

      for (const userId of userIds) {
        if (!userCache[userId]) {
          const userData = await getUserById(userId);
          if (userData) {
            newCache[userId] = userData;
          }
        }
      }

      setUserCache((prev) => ({ ...prev, ...newCache }));
    };

    loadUserData();
  }, [currentPlanning, getUserById, userCache]);

  // Función para buscar la tarea seleccionada cuando cambie el ID
  useEffect(() => {
    if (selectedTaskForEdit) {
      const task = tasks.find((t) => t.id === selectedTaskForEdit);
      setSelectedTask(task || null);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskForEdit, tasks]);

  const handleStatusChange = async (newStatus: PlanningStatus) => {
    if (currentPlanning) {
      await updatePlanningStatus(currentPlanning.id, newStatus);
    }
  };

  const handleDeletePlanning = async () => {
    if (currentPlanning) {
      await deletePlanning(currentPlanning.id);
      onBack();
    }
  };

  const openTaskModal = (taskId?: string) => {
    setSelectedTaskForEdit(taskId || null);
    setIsTaskModalOpen(true);
  };

  const getStatusColor = (status: PlanningStatus) => {
    switch (status) {
      case PlanningStatus.DRAFT:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case PlanningStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case PlanningStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case PlanningStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status: PlanningStatus) => {
    switch (status) {
      case PlanningStatus.DRAFT:
        return "Borrador";
      case PlanningStatus.IN_PROGRESS:
        return "En Progreso";
      case PlanningStatus.COMPLETED:
        return "Completado";
      case PlanningStatus.CANCELLED:
        return "Cancelado";
      default:
        return "Desconocido";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "monthly":
        return "Mensual";
      case "quarterly":
        return "Trimestral";
      case "biannual":
        return "Semestral";
      case "annual":
        return "Anual";
      default:
        return "Desconocido";
    }
  };

  // Calcular estadísticas
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
    cancelled: tasks.filter((t) => t.status === TaskStatus.CANCELLED).length,
    highPriority: tasks.filter(
      (t) =>
        t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT
    ).length,
  };

  // En la sección donde se muestra la información de los usuarios asignados
  const getAssignedUsersText = () => {
    if (!currentPlanning || !currentPlanning.assignedTo.length) {
      return "Sin asignaciones";
    }

    return currentPlanning.assignedTo
      .map((userId) => {
        const user = userCache[userId];
        return user
          ? `${user.firstName} ${user.lastName}`
          : "Usuario Desconocido";
      })
      .join(", ");
  };

  if (loading && !currentPlanning) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </button>
      </div>
    );
  }

  if (!currentPlanning) {
    return (
      <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
        <h3 className="text-lg font-semibold">Planificación no encontrada</h3>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </button>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PencilSquareIcon
              className="-ml-0.5 mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Editar
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {currentPlanning.title}
              </h3>
              <div className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                <p className="mt-1">{currentPlanning.description}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    currentPlanning.status
                  )}`}
                >
                  {getStatusText(currentPlanning.status)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  {getTypeText(currentPlanning.type)}
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {currentPlanning.progress}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Completado
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <CalendarIcon className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                Fechas
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {moment(currentPlanning.startDate).format("D MMM YYYY")} -{" "}
                {moment(currentPlanning.endDate).format("D MMM YYYY")}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <ClockIcon className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                Duración
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {moment(currentPlanning.endDate).diff(
                  moment(currentPlanning.startDate),
                  "days"
                )}{" "}
                días
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <UserGroupIcon className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                Asignados
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {getAssignedUsersText()}
              </dd>
            </div>

            {currentPlanning.budget && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <BanknotesIcon className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  Presupuesto
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  $
                  {currentPlanning.budget.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
            )}

            {currentPlanning.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <TagIcon className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  Etiquetas
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <div className="flex flex-wrap gap-1.5">
                    {currentPlanning.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {currentPlanning.status === PlanningStatus.DRAFT && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-4 border-t border-yellow-100 dark:border-yellow-900/50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Esta planificación está en borrador
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Para comenzar a trabajar en esta planificación, cambia su
                    estado a "En Progreso".
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(PlanningStatus.IN_PROGRESS)
                      }
                      className="bg-yellow-50 dark:bg-yellow-900/40 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                    >
                      Iniciar planificación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            Estadísticas
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Estadística 1: Total y completadas */}
            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Tareas totales
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {taskStats.total}
                  </dd>
                  <dd className="mt-2 text-sm text-green-600 dark:text-green-400">
                    {taskStats.completed} completadas
                  </dd>
                </dl>
              </div>
            </div>

            {/* Estadística 2: En progreso y pendiente */}
            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Tareas en progreso
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {taskStats.inProgress}
                  </dd>
                  <dd className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    {taskStats.pending} pendientes
                  </dd>
                </dl>
              </div>
            </div>

            {/* Estadística 3: Alta prioridad */}
            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Alta prioridad
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {taskStats.highPriority}
                  </dd>
                  <dd className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Requieren atención
                  </dd>
                </dl>
              </div>
            </div>

            {/* Estadística 4: Documentos */}
            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Documentos
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {documents.length}
                  </dd>
                  <dd className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    Archivos adjuntos
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex space-x-8">
              <button
                className={`pb-4 border-b-2 font-medium text-sm ${
                  selectedTab === "tasks"
                    ? "border-primary text-primary dark:text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => setSelectedTab("tasks")}
              >
                Tareas
              </button>
              <button
                className={`pb-4 border-b-2 font-medium text-sm ${
                  selectedTab === "documents"
                    ? "border-primary text-primary dark:text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => setSelectedTab("documents")}
              >
                Documentos
              </button>
              <button
                className={`pb-4 border-b-2 font-medium text-sm ${
                  selectedTab === "comments"
                    ? "border-primary text-primary dark:text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => setSelectedTab("comments")}
              >
                Comentarios
              </button>
            </div>
            <div className="mt-4 sm:mt-0">
              {selectedTab === "tasks" && (
                <button
                  onClick={() => openTaskModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={
                    currentPlanning.status === PlanningStatus.COMPLETED ||
                    currentPlanning.status === PlanningStatus.CANCELLED
                  }
                >
                  Nueva Tarea
                </button>
              )}
              {selectedTab === "documents" && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Subir Documento
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {selectedTab === "tasks" && (
            <TaskList
              tasks={tasks}
              onEditTask={openTaskModal}
              isReadOnly={
                currentPlanning.status === PlanningStatus.COMPLETED ||
                currentPlanning.status === PlanningStatus.CANCELLED
              }
            />
          )}
          {selectedTab === "documents" && (
            <DocumentsList documents={documents} planningId={planningId} />
          )}
          {selectedTab === "comments" && (
            <CommentsList comments={comments} planningId={planningId} />
          )}
        </div>
      </div>

      {/* Modales */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTaskForEdit(null);
          }}
          planningId={planningId}
          task={selectedTask}
        />
      )}

      {isUploadModalOpen && (
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          planningId={planningId}
        />
      )}

      {isEditModalOpen && currentPlanning && (
        <EditPlanningModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          planning={currentPlanning}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar planificación"
        message="¿Estás seguro de que deseas eliminar esta planificación? Esta acción no se puede deshacer y se eliminarán todas las tareas, documentos y comentarios asociados."
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
        onConfirm={handleDeletePlanning}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
    </div>
  );
};

export default PlanningDashboard;
