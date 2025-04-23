import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  ProjectTask,
  ProjectTaskCreateInput,
  TaskPriority,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { toast } from "react-hot-toast";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ProjectTask;
}

// Task tags
const TASK_TAGS = [
  "diseño",
  "construcción",
  "electricidad",
  "plomería",
  "compras",
  "documentación",
  "permisos",
  "legal",
  "financiero",
  "marketing",
];

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { updateProjectTask, loading } = useProjectTaskStore();

  const [formData, setFormData] = useState<
    Omit<ProjectTaskCreateInput, "projectId">
  >({
    title: "",
    description: "",
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.MEDIUM,
    dueDate: "",
    tags: [],
    assignedTo: [],
  });

  // Load task data when modal opens
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || "",
        tags: task.tags || [],
        assignedTo: task.assignedTo || [],
      });
    }
  }, [task]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle tag selection
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData({
        ...formData,
        tags: [...formData.tags, value],
      });
    } else {
      setFormData({
        ...formData,
        tags: formData.tags.filter((tag) => tag !== value),
      });
    }
  };

  // Process form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    try {
      await updateProjectTask(task.id, formData);
      toast.success("Tarea actualizada exitosamente");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la tarea");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !loading && onClose()}
      >
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                    <div className="bg-indigo-700 dark:bg-gray-800 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          Editar Tarea
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-indigo-700 dark:bg-gray-800 text-indigo-200 dark:text-gray-400 hover:text-white focus:outline-none"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Cerrar</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300 dark:text-gray-400">
                          Edita los detalles de la tarea
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="flex-1 overflow-y-auto p-6"
                    >
                      <div className="space-y-6">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Título *
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Descripción
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="status"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Estado
                            </label>
                            <select
                              name="status"
                              id="status"
                              value={formData.status}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value={TaskStatus.BACKLOG}>
                                Pendientes
                              </option>
                              <option value={TaskStatus.TODO}>Por hacer</option>
                              <option value={TaskStatus.IN_PROGRESS}>
                                En progreso
                              </option>
                              <option value={TaskStatus.REVIEW}>
                                Revisión
                              </option>
                              <option value={TaskStatus.DONE}>
                                Completado
                              </option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="priority"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Prioridad
                            </label>
                            <select
                              name="priority"
                              id="priority"
                              value={formData.priority}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value={TaskPriority.LOW}>Baja</option>
                              <option value={TaskPriority.MEDIUM}>Media</option>
                              <option value={TaskPriority.HIGH}>Alta</option>
                              <option value={TaskPriority.URGENT}>
                                Urgente
                              </option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="dueDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Fecha límite
                          </label>
                          <input
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Etiquetas
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {TASK_TAGS.map((tag) => (
                              <div key={tag} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`tag-${tag}`}
                                  name="tags"
                                  value={tag}
                                  checked={formData.tags.includes(tag)}
                                  onChange={handleTagChange}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`tag-${tag}`}
                                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                >
                                  {tag}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          disabled={loading}
                        >
                          {loading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditTaskModal;
