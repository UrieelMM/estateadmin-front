import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  usePlanningStore,
  TaskPriority,
  PlanningTask,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  planningId: string;
  task?: PlanningTask | null;
  parentTaskId?: string;
  onSuccess?: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  planningId,
  task,
  parentTaskId,
  onSuccess,
}) => {
  const { addTask, updateTask, loading, error } = usePlanningStore();
  const { condominiumsUsers, fetchCondominiumsUsers } = useUserDataStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  });
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    dates?: string;
  }>({});

  useEffect(() => {
    fetchCondominiumsUsers();

    // Si estamos editando, rellenar los campos
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStartDate(task.startDate);
      setDueDate(task.dueDate);
      setAssignedTo(task.assignedTo);
    } else {
      // Resetear los campos para una nueva tarea
      setTitle("");
      setDescription("");
      setPriority(TaskPriority.MEDIUM);
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split("T")[0]);
      setAssignedTo([]);
    }
  }, [task, fetchCondominiumsUsers]);

  const validateForm = () => {
    const errors: { title?: string; dates?: string } = {};
    let isValid = true;

    if (!title.trim()) {
      errors.title = "El título es obligatorio";
      isValid = false;
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      errors.dates =
        "La fecha de inicio no puede ser posterior a la fecha de vencimiento";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const taskData = {
      planningId,
      title,
      description,
      priority,
      startDate,
      dueDate,
      assignedTo,
      parentTaskId: parentTaskId || (task?.parentTaskId ?? undefined),
    };

    if (task) {
      // Actualizar tarea existente
      await updateTask(task.id, taskData);
      if (onSuccess) onSuccess(task.id);
    } else {
      // Crear nueva tarea
      const taskId = await addTask(taskData);
      if (taskId && onSuccess) onSuccess(taskId);
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {task ? "Editar Tarea" : "Nueva Tarea"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título*
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  formErrors.title
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Título de la tarea"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descripción detallada de la tarea"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={TaskPriority.LOW}>Baja</option>
                <option value={TaskPriority.MEDIUM}>Media</option>
                <option value={TaskPriority.HIGH}>Alta</option>
                <option value={TaskPriority.URGENT}>Urgente</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de inicio
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <CalendarDaysIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha límite
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <CalendarDaysIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            {formErrors.dates && (
              <p className="mt-1 mb-4 text-sm text-red-500 flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {formErrors.dates}
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asignado a
              </label>
              <div className="relative">
                <select
                  multiple
                  value={assignedTo}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setAssignedTo(selected);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  size={3}
                >
                  {condominiumsUsers.map((user) => (
                    <option key={user.uid} value={user.uid}>
                      {user.name} {user.lastName}
                    </option>
                  ))}
                </select>
                <UserGroupIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mantén Ctrl presionado para seleccionar múltiples usuarios
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed dark:disabled:bg-blue-800"
              >
                {loading
                  ? "Guardando..."
                  : task
                  ? "Actualizar Tarea"
                  : "Crear Tarea"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TaskModal;
