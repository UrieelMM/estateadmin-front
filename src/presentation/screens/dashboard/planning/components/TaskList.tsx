import React, { useState, useEffect } from "react";
import {
  PlanningTask,
  TaskStatus,
  TaskPriority,
  usePlanningStore,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";
import moment from "moment";
import "moment/locale/es";
import {
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import ConfirmModal from "./ConfirmModal";

interface TaskListProps {
  tasks: PlanningTask[];
  onEditTask: (taskId: string) => void;
  isReadOnly?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEditTask,
  isReadOnly = false,
}) => {
  const { getUserById } = useUserDataStore();
  const { updateTaskStatus, deleteTask } = usePlanningStore();
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {}
  );
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  useEffect(() => {
    // Cargar datos de usuarios para las tareas
    const loadUserData = async () => {
      // Recopilar todos los IDs de usuarios de todas las tareas
      const userIds: string[] = [];
      tasks.forEach((task) => {
        task.assignedTo.forEach((userId) => {
          if (!userIds.includes(userId)) {
            userIds.push(userId);
          }
        });
      });

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
  }, [tasks, getUserById, userCache]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case TaskStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case TaskStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return "Pendiente";
      case TaskStatus.IN_PROGRESS:
        return "En Progreso";
      case TaskStatus.COMPLETED:
        return "Completado";
      case TaskStatus.CANCELLED:
        return "Cancelado";
      default:
        return "Desconocido";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case TaskPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case TaskPriority.HIGH:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case TaskPriority.URGENT:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "Baja";
      case TaskPriority.MEDIUM:
        return "Media";
      case TaskPriority.HIGH:
        return "Alta";
      case TaskPriority.URGENT:
        return "Urgente";
      default:
        return "Desconocido";
    }
  };

  const handleDeleteTask = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Organizar tareas en árbol
  const rootTasks = tasks.filter((task) => !task.parentTaskId);

  const getChildTasks = (parentId: string) => {
    return tasks
      .filter((task) => task.parentTaskId === parentId)
      .sort((a, b) => a.order - b.order);
  };

  const renderTask = (task: PlanningTask, level = 0) => {
    const childTasks = getChildTasks(task.id);
    const hasChildren = childTasks.length > 0;
    const isExpanded = expandedTasks[task.id] || false;

    const getUserName = (userId: string) => {
      const user = userCache[userId];
      return user ? `${user.name} ${user.lastName}` : "Usuario Desconocido";
    };

    return (
      <React.Fragment key={task.id}>
        <div
          className={`relative flex items-start px-4 py-4 ${
            level > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""
          }`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {hasChildren && (
            <button
              className="absolute left-2 top-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => toggleExpand(task.id)}
              style={{ left: `${4 + level * 24}px` }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {task.title}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {task.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {getStatusText(task.status)}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                  task.priority
                )}`}
              >
                {getPriorityText(task.priority)}
              </span>
              {task.progress > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  {task.progress}% completado
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0 mr-1.5">
                <ClockIcon
                  className="h-5 w-5 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
              </div>
              <span>
                {moment(task.startDate).format("D MMM YYYY")} -{" "}
                {moment(task.dueDate).format("D MMM YYYY")}
              </span>
            </div>
            {task.assignedTo.length > 0 && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-600 dark:text-gray-300 mr-1">
                  Asignado a:
                </span>
                {task.assignedTo
                  .map((userId) => getUserName(userId))
                  .join(", ")}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
            {!isReadOnly && (
              <>
                {task.status !== TaskStatus.COMPLETED && (
                  <button
                    className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                    onClick={() =>
                      handleStatusChange(task.id, TaskStatus.COMPLETED)
                    }
                    title="Marcar como completada"
                  >
                    <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                {task.status !== TaskStatus.IN_PROGRESS &&
                  task.status !== TaskStatus.COMPLETED && (
                    <button
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      onClick={() =>
                        handleStatusChange(task.id, TaskStatus.IN_PROGRESS)
                      }
                      title="Marcar en progreso"
                    >
                      <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                {task.status !== TaskStatus.CANCELLED && (
                  <button
                    className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() =>
                      handleStatusChange(task.id, TaskStatus.CANCELLED)
                    }
                    title="Cancelar tarea"
                  >
                    <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <button
                  className="p-1 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  onClick={() => onEditTask(task.id)}
                  title="Editar tarea"
                >
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                  onClick={() => setDeleteTaskId(task.id)}
                  title="Eliminar tarea"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {childTasks.map((childTask) => renderTask(childTask, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (!tasks.length) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay tareas
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea una nueva tarea para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow rounded-md">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {rootTasks
          .sort((a, b) => a.order - b.order)
          .map((task) => renderTask(task))}
      </ul>

      <ConfirmModal
        isOpen={!!deleteTaskId}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer y se eliminarán todas las subtareas asociadas."
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default TaskList;
