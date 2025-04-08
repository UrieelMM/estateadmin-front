import React, { useEffect, useState } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ProjectTask,
  TaskPriority,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { toast } from "react-hot-toast";
import NewTaskModal from "./NewTaskModal";
import EditTaskModal from "./EditTaskModal";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

interface KanbanBoardProps {
  projectId: string;
  projectName?: string; // Añadido para mostrar en el título del tablero
}

// Map of status to readable Spanish names
const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "Pendientes",
  [TaskStatus.TODO]: "Por hacer",
  [TaskStatus.IN_PROGRESS]: "En progreso",
  [TaskStatus.REVIEW]: "Revisión",
  [TaskStatus.DONE]: "Completado",
};

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

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  projectName = "Proyecto",
}) => {
  const {
    tasks,
    loading,
    error,
    fetchProjectTasks,
    updateProjectTask,
    deleteProjectTask,
  } = useProjectTaskStore();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [_projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [tasksByPriorities, setTasksByPriorities] = useState<
    Record<TaskStatus, ProjectTask[]>
  >({} as Record<TaskStatus, ProjectTask[]>);
  // Estado para filtro de prioridad
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );

  // Load tasks when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      await fetchProjectTasks(projectId);
    };
    loadTasks();
  }, [projectId, fetchProjectTasks]);

  // Organiza tareas por estado
  useEffect(() => {
    if (tasks) {
      const filteredTasks = tasks.filter(
        (task) => task.projectId === projectId
      );
      setProjectTasks(filteredTasks);

      // Organizamos las tareas por estado (columnas)
      const tasksByStatus: Record<TaskStatus, ProjectTask[]> = {} as Record<
        TaskStatus,
        ProjectTask[]
      >;

      // Inicializa la estructura para todos los estados
      Object.values(TaskStatus).forEach((status) => {
        tasksByStatus[status] = [];
      });

      // Asigna cada tarea a su columna correspondiente
      filteredTasks.forEach((task) => {
        if (tasksByStatus[task.status]) {
          // Ordenamos las tareas por prioridad (de más alta a más baja)
          tasksByStatus[task.status].push(task);
        }
      });

      // Ordenamos las tareas por prioridad dentro de cada estado
      Object.keys(tasksByStatus).forEach((status) => {
        tasksByStatus[status as TaskStatus].sort((a, b) => {
          // Las prioridades más altas (URGENT, HIGH) deben aparecer primero
          const priorities = [
            TaskPriority.URGENT,
            TaskPriority.HIGH,
            TaskPriority.MEDIUM,
            TaskPriority.LOW,
          ];
          return (
            priorities.indexOf(a.priority) - priorities.indexOf(b.priority)
          );
        });
      });

      // Actualizamos el estado con las tareas organizadas
      setTasksByPriorities({ ...tasksByStatus } as any);
    }
  }, [tasks, projectId]);

  // Maneja el cambio de estado cuando se arrastra una tarea
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Si no hay destino o es el mismo, no hacemos nada
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    try {
      const taskId = draggableId;
      const newStatus = destination.droppableId as TaskStatus;

      // Actualiza la tarea en el servidor
      await updateProjectTask(taskId, {
        status: newStatus,
        projectId: projectId,
      });

      toast.success("Tarea actualizada con éxito");
    } catch (error) {
      toast.error("Error al actualizar el estado de la tarea");
    }
  };

  // Maneja el cambio de filtro de prioridad
  const handlePriorityFilterChange = (priority: TaskPriority | "all") => {
    setPriorityFilter(priority);
  };

  // Manejador para editar una tarea
  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
  };

  // Renderiza la tarjeta de tarea
  const renderTaskCard = (task: ProjectTask, index: number) => {
    const priority = task.priority;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    return (
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
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
                      if (confirm("¿Estás seguro de eliminar esta tarea?")) {
                        deleteProjectTask(task.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
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
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

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
        <p>{error}</p>
        <button
          onClick={() => fetchProjectTasks(projectId)}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Tareas - {projectName}
        </h2>
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Filtro de prioridad */}
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtrar por prioridad:
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePriorityFilterChange("all")}
            className={`px-3 py-1 text-sm rounded-full ${
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
              className={`px-3 py-1 text-sm rounded-full flex items-center ${
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

      {/* React Beautiful DnD Kanban Board */}
      <div className="kanban-wrapper">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-5 gap-4">
            {/* Para cada estado (columna) */}
            {Object.entries(tasksByPriorities).map(([status, tasks]) => {
              // Filtrar tareas según el filtro de prioridad seleccionado
              const filteredTasks =
                priorityFilter === "all"
                  ? tasks
                  : tasks.filter((task) => task.priority === priorityFilter);

              return (
                <div
                  key={status}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  {/* Encabezado de la columna */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-200">
                    {statusLabels[status as TaskStatus]}
                  </div>

                  {/* Lista de tareas (droppable) */}
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[400px] p-2"
                      >
                        {filteredTasks.map((task, index) =>
                          renderTaskCard(task, index)
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

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
