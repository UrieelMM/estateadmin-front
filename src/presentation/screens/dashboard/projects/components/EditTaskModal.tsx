import React, { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  PaperClipIcon,
  DocumentIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
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
  const { updateProjectTask, uploadAttachments, deleteAttachment, loading } =
    useProjectTaskStore();

  const [formData, setFormData] = useState<
    Omit<ProjectTaskCreateInput, "projectId">
  >({
    title: "",
    description: "",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: "",
    tags: [],
    assignedTo: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
        assignedTo: task.assignedTo || "",
        attachments: task.attachments || [],
        notes: task.notes || "",
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...fileList]);
    }
  };

  // Process file removal from selection
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing attachment
  const handleRemoveAttachment = async (url: string) => {
    try {
      await deleteAttachment(task.projectId, task.id, url);
      // Update local state without refetching
      setFormData((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter((item) => item !== url),
      }));
      toast.success("Archivo eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar el archivo");
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
      // First upload any new files if present
      let newAttachmentUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        newAttachmentUrls = await uploadAttachments(
          task.projectId,
          task.id,
          selectedFiles
        );
        setIsUploading(false);
      }

      // Combine existing attachments with new ones
      const updatedData = {
        ...formData,
        attachments: [...(formData.attachments || []), ...newAttachmentUrls],
      };

      await updateProjectTask(task.id, updatedData);
      toast.success("Tarea actualizada exitosamente");
      onClose();
    } catch (error) {
      setIsUploading(false);
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
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
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
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="assignedTo"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Responsable / Asignación
                          </label>
                          <input
                            type="text"
                            name="assignedTo"
                            id="assignedTo"
                            value={formData.assignedTo || ""}
                            onChange={handleChange}
                            placeholder="Nombre del responsable"
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
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
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                            >
                              <option value={TaskStatus.PENDING}>
                                Pendientes
                              </option>
                              <option value={TaskStatus.IN_PROGRESS}>
                                En progreso
                              </option>
                              <option value={TaskStatus.REVIEW}>
                                Revisión
                              </option>
                              <option value={TaskStatus.COMPLETED}>
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
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
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
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notas adicionales
                          </label>
                          <textarea
                            name="notes"
                            id="notes"
                            rows={2}
                            value={formData.notes || ""}
                            onChange={handleChange}
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                            placeholder="Notas o comentarios adicionales..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Archivos adjuntos
                          </label>

                          {/* Existing Attachments */}
                          {formData.attachments &&
                            formData.attachments.length > 0 && (
                              <div className="mb-4 space-y-2">
                                <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Archivos existentes:
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {formData.attachments.map((url, idx) => {
                                    const isImage =
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                    const fileName =
                                      url
                                        .split("/")
                                        .pop()
                                        ?.split("_")
                                        .slice(1)
                                        .join("_") || "archivo";

                                    return (
                                      <div key={idx} className="relative group">
                                        <div className="flex items-start p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                          {isImage ? (
                                            <div className="w-full">
                                              <div className="relative w-full h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                                                <img
                                                  src={url}
                                                  alt={fileName}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                                {fileName}
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="flex items-center w-full">
                                              <DocumentIcon className="h-8 w-8 text-indigo-500 mr-2" />
                                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                {fileName}
                                              </span>
                                            </div>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveAttachment(url)
                                            }
                                            className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 rounded-full bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <XCircleIcon className="h-5 w-5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* New File Selection */}
                          <div className="mt-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              multiple
                              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                            />

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <PaperClipIcon
                                className="-ml-0.5 mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              Agregar archivos
                            </button>
                          </div>

                          {/* Preview of Selected Files */}
                          {selectedFiles.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                                Nuevos archivos seleccionados:
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {selectedFiles.map((file, idx) => {
                                  const isImage =
                                    file.type.startsWith("image/");

                                  return (
                                    <div
                                      key={idx}
                                      className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                                    >
                                      {isImage ? (
                                        <div className="flex flex-col items-center space-y-1">
                                          <div className="w-full h-16 relative rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                                            <img
                                              src={URL.createObjectURL(file)}
                                              alt={file.name}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full">
                                            {file.name}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <DocumentIcon className="h-6 w-6 text-gray-400 mr-2" />
                                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                            {file.name}
                                          </span>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => removeSelectedFile(idx)}
                                        className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                      >
                                        <XCircleIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
                          disabled={loading || isUploading}
                        >
                          {loading || isUploading
                            ? "Guardando..."
                            : "Guardar Cambios"}
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
