import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import {
  ProjectTask,
  TaskPriority,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { toast } from "react-hot-toast";
import NewTaskModal from "./NewTaskModal";
import EditTaskModal from "./EditTaskModal";
import ActionModal from "../../../../components/shared/modals/ActionModal";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
} from "react-beautiful-dnd";

interface KanbanBoardProps {
  projectId: string;
  projectName?: string; // Añadido para mostrar en el título del tablero
}

// Map of status to readable Spanish names
const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: "Pendientes",
  [TaskStatus.IN_PROGRESS]: "En progreso",
  [TaskStatus.REVIEW]: "Revisión",
  [TaskStatus.COMPLETED]: "Completado",
};

const TASK_STATUSES: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
];

// Map of priority to colors and names
const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: {
    label: "Baja",
    color: "#8897AA",
  },
  [TaskPriority.MEDIUM]: {
    label: "Media",
    color: "#3B82F6",
  },
  [TaskPriority.HIGH]: {
    label: "Alta",
    color: "#FBBF24",
  },
  [TaskPriority.URGENT]: {
    label: "Urgente",
    color: "#EF4444",
  },
};

const createEmptyTaskColumns = (): Record<TaskStatus, ProjectTask[]> => ({
  [TaskStatus.PENDING]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.REVIEW]: [],
  [TaskStatus.COMPLETED]: [],
});

interface StrictModeDroppableProps {
  droppableId: string;
  children: (
    provided: DroppableProvided,
    snapshot: DroppableStateSnapshot
  ) => React.ReactElement;
}

const StrictModeDroppable: React.FC<StrictModeDroppableProps> = ({
  droppableId,
  children,
}) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable droppableId={droppableId}>{children}</Droppable>;
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  projectName = "Proyecto",
}) => {
  const {
    tasks,
    loading,
    error,
    fetchProjectTasks,
    deleteProjectTask,
    updateTaskStatus,
    reorderTasks,
  } = useProjectTaskStore();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [_projectTasks, _setProjectTasks] = useState<ProjectTask[]>([]);
  // Usamos useState con una función para inicializar solo una vez
  const [tasksByPriorities, setTasksByPriorities] = useState<
    Record<TaskStatus, ProjectTask[]>
  >(() => createEmptyTaskColumns());
  // Estado para filtro de prioridad
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  // Estados para controlar el drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardMounted, setBoardMounted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);

  // Load tasks when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      await fetchProjectTasks(projectId);
    };
    loadTasks();
  }, [projectId, fetchProjectTasks]);

  // Efecto para marcar cuando el componente está montado
  useEffect(() => {
    setBoardMounted(true);
  }, []);

  // Organiza tareas por estado
  useEffect(() => {
    if (!boardMounted) return;

    // Cada vez que cambian las tareas, reorganizamos por estado
    const tasksByStatus = createEmptyTaskColumns();

    // Organizar tareas por estado
    tasks.forEach((task) => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push({ ...task });
      }
    });

    // Ordenar tareas dentro de cada columna según su orden (determinado por la API) o fecha de creación
    Object.keys(tasksByStatus).forEach((status) => {
      const statusEnum = status as TaskStatus;
      tasksByStatus[statusEnum].sort((a, b) => {
        // Si ambas tareas tienen un orden definido, usamos ese orden
        if (typeof a.order === "number" && typeof b.order === "number") {
          return a.order - b.order;
        }
        // Si no, ordenamos por fecha de creación (más reciente primero)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    // Actualizamos el estado con las tareas organizadas
    setTasksByPriorities(tasksByStatus);
  }, [tasks, boardMounted]);

  // Maneja el inicio del arrastre
  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Maneja el cambio de estado cuando se arrastra una tarea
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      setIsDragging(false);
      const { source, destination, draggableId } = result;

      // Si no hay destino o es el mismo punto exacto, no hacemos nada
      if (
        !destination ||
        (source.droppableId === destination.droppableId &&
          source.index === destination.index)
      ) {
        return;
      }

      try {
        const sourceStatus = source.droppableId as TaskStatus;
        const destStatus = destination.droppableId as TaskStatus;
        const taskId = draggableId;
        const sourceTasks = [...(tasksByPriorities[sourceStatus] || [])];
        const destinationTasks =
          sourceStatus === destStatus
            ? sourceTasks
            : [...(tasksByPriorities[destStatus] || [])];

        const [movedTask] = sourceTasks.splice(source.index, 1);
        if (!movedTask) {
          await fetchProjectTasks(projectId);
          return;
        }

        const movedTaskWithUpdatedStatus =
          sourceStatus === destStatus
            ? movedTask
            : { ...movedTask, status: destStatus };

        destinationTasks.splice(destination.index, 0, movedTaskWithUpdatedStatus);

        // Actualización optimista local para mantener UX fluida
        if (sourceStatus === destStatus) {
          setTasksByPriorities((prev) => ({
            ...prev,
            [sourceStatus]: destinationTasks,
          }));
        } else {
          setTasksByPriorities((prev) => ({
            ...prev,
            [sourceStatus]: sourceTasks,
            [destStatus]: destinationTasks,
          }));
        }

        if (sourceStatus === destStatus) {
          await reorderTasks(
            projectId,
            sourceStatus,
            destinationTasks.map((task) => task.id)
          );
        } else {
          await updateTaskStatus(taskId, destStatus, destination.index);
          await reorderTasks(
            projectId,
            sourceStatus,
            sourceTasks.map((task) => task.id)
          );
          await reorderTasks(
            projectId,
            destStatus,
            destinationTasks.map((task) => task.id)
          );
        }

        const dragError = useProjectTaskStore.getState().error;
        if (dragError) {
          toast.error(dragError);
          await fetchProjectTasks(projectId);
          return;
        }

        if (sourceStatus !== destStatus) {
          toast.success("Estado de la tarea actualizado correctamente");
        }

        await fetchProjectTasks(projectId);
      } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        toast.error("Error al actualizar el estado de la tarea");
        // En caso de error, refrescamos las tareas para volver al estado correcto
        fetchProjectTasks(projectId);
      }
    },
    [
      fetchProjectTasks,
      projectId,
      reorderTasks,
      tasksByPriorities,
      updateTaskStatus,
    ]
  );

  // Maneja el cambio de filtro de prioridad
  const handlePriorityFilterChange = (priority: TaskPriority | "all") => {
    setPriorityFilter(priority);
  };

  // Manejador para editar una tarea
  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
  };

  const handleDeleteTaskClick = (task: ProjectTask) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) {
      return;
    }

    try {
      await deleteProjectTask(taskToDelete.id);
      const deleteError = useProjectTaskStore.getState().error;
      if (deleteError) {
        toast.error(deleteError);
        return;
      }
      toast.success("Tarea eliminada correctamente");
    } catch {
      toast.error("No se pudo eliminar la tarea.");
    } finally {
      setTaskToDelete(null);
    }
  };

  // Renderiza la tarjeta de tarea
  const renderTaskCard = useCallback(
    (task: ProjectTask, index: number) => {
      const priority = task.priority;
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const hasAttachments = task.attachments && task.attachments.length > 0;

      return (
        <Draggable key={task.id} draggableId={task.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-all duration-200 ${
                snapshot.isDragging
                  ? "shadow-md scale-105 rotate-1 cursor-grabbing"
                  : "hover:shadow-md hover:translate-y-[-2px]"
              }`}
              style={{
                // Es importante mantener el estilo proporcionado por react-beautiful-dnd
                ...provided.draggableProps.style,
              }}
            >
              {/* Drag handle indicator at the top of the card */}
              <div className="h-1 w-12 mx-auto mt-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-60"></div>
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => handleEditTask(task)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: `${priorityConfig[priority]?.color}20`,
                      color: priorityConfig[priority]?.color,
                    }}
                  >
                    {priorityConfig[priority]?.label}
                  </span>

                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }}
                      className="text-gray-400 hover:text-indigo-500 p-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTaskClick(task);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Eliminar tarea"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-medium mb-1 text-gray-900 dark:text-white truncate">
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Mostrar responsable asignado */}
                {task.assignedTo && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center"
                      title="Responsable"
                    >
                      <UserCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {task.assignedTo}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  {dueDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dueDate.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}

                  {hasAttachments && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      {task.attachments?.length}
                    </span>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Preview of first attachment if it's an image */}
                  {task.attachments &&
                    task.attachments.length > 0 &&
                    task.attachments.some((url) =>
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                    ) && (
                      <div className="w-full mt-2">
                        <div className="relative w-full h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          {task.attachments
                            .filter((url) =>
                              /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                            )
                            .slice(0, 1)
                            .map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ))}
                          {task.attachments.filter((url) =>
                            /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                          ).length > 1 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                +
                                {task.attachments.filter((url) =>
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                                ).length - 1}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </Draggable>
      );
    },
    [handleEditTask]
  );

  if (loading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-medium mb-2">No se pudieron cargar las tareas.</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchProjectTasks(projectId)}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Reintentar carga
        </button>
      </div>
    );
  }

  // Verificamos que tenemos datos válidos antes de renderizar el tablero
  const hasValidTasks = Object.values(tasksByPriorities).every((taskList) =>
    Array.isArray(taskList)
  );

  if (!hasValidTasks && tasks.length > 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const totalFilteredTasks = Object.values(tasksByPriorities).reduce(
    (acc, taskList) =>
      acc +
      (priorityFilter === "all"
        ? taskList.length
        : taskList.filter((task) => task.priority === priorityFilter).length),
    0
  );

  const activeFilterLabel =
    priorityFilter === "all" ? "todas las prioridades" : priorityConfig[priorityFilter].label;

  return (
    <div className="mt-4 dark:bg-gray-900" ref={boardRef}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Tareas - {projectName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length} tareas registradas
          </p>
          {loading && tasks.length > 0 && (
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
              Sincronizando cambios...
            </p>
          )}
        </div>
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Filtro de prioridad */}
      {tasks.length > 0 && (
        <div className="mb-4 flex items-center space-x-2 overflow-x-auto">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Filtrar por prioridad:
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePriorityFilterChange("all")}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                priorityFilter === "all"
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Todas
            </button>
            {Object.entries(priorityConfig).map(([priority, config]) => (
              <button
                key={priority}
                onClick={() =>
                  handlePriorityFilterChange(priority as TaskPriority)
                }
                className={`px-3 py-1 text-sm rounded-full flex items-center whitespace-nowrap ${
                  priorityFilter === priority
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{
                    backgroundColor: config.color,
                  }}
                />
                {config.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Este proyecto aun no tiene tareas.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crea la primera tarea para comenzar el seguimiento del tablero.
          </p>
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Crear primera tarea
          </button>
        </div>
      ) : (
        <>
          {priorityFilter !== "all" && totalFilteredTasks === 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No hay tareas con prioridad {activeFilterLabel.toLowerCase()}.
              </p>
              <button
                onClick={() => handlePriorityFilterChange("all")}
                className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100 underline"
              >
                Ver todas las tareas
              </button>
            </div>
          )}

          {/* React Beautiful DnD Kanban Board */}
          <div className="kanban-wrapper">
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Para cada estado (columna) */}
                {TASK_STATUSES.map((status) => {
                  // Filtrar tareas según el filtro de prioridad seleccionado
                  const taskList = tasksByPriorities[status] || [];
                  const filteredTasks =
                    priorityFilter === "all"
                      ? taskList
                      : taskList.filter((task) => task.priority === priorityFilter);
                  const emptyMessage =
                    priorityFilter === "all"
                      ? "Sin tareas en esta etapa."
                      : `Sin tareas de prioridad ${activeFilterLabel.toLowerCase()} en esta etapa.`;

                  return (
                    <div
                      key={status}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                    >
                      {/* Encabezado de la columna */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-200">
                        {statusLabels[status as TaskStatus]}
                      </div>

                      {/* Lista de tareas (droppable) - Evitamos scrolling en este contenedor */}
                      <StrictModeDroppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[300px] p-2 transition-all duration-200 ${
                              snapshot.isDraggingOver
                                ? "bg-indigo-50 dark:bg-indigo-900/30 scale-[1.01]"
                                : ""
                            }`}
                            style={{
                              // Mantenemos overflow-visible para evitar el problema de scroll anidados
                              overflow: isDragging ? "visible" : "visible",
                            }}
                          >
                            {filteredTasks.map((task, index) =>
                              renderTaskCard(task, index)
                            )}
                            {filteredTasks.length === 0 && (
                              <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-6">
                                {emptyMessage}
                              </p>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </StrictModeDroppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        </>
      )}

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          projectId={projectId}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}

      <ActionModal
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        title="Eliminar tarea"
        message={
          taskToDelete
            ? `Se eliminara la tarea "${taskToDelete.title}". Esta accion no se puede deshacer.`
            : "Esta accion no se puede deshacer."
        }
        onConfirm={handleConfirmDeleteTask}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        showCancel
        variant="danger"
      />
    </div>
  );
};

// Missing definition of CalendarIcon
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default KanbanBoard;
