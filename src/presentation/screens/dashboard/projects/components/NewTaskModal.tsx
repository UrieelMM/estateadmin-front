import React, { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PaperClipIcon, DocumentIcon, XCircleIcon } from "@heroicons/react/24/solid";
import {
  ProjectTaskCreateInput,
  TaskPriority,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { toast } from "react-hot-toast";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
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



const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { addProjectTask, uploadAttachments, loading } = useProjectTaskStore();

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
    notes: "",
    attachments: [],
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...fileList]);
    }
  };
  
  // Process file removal from selection
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      // First create the task without attachments
      const taskData: ProjectTaskCreateInput = {
        ...formData,
        projectId,
      };
      
      // Create task and get its ID
      const taskId = await addProjectTask(taskData);
      
      // If files selected, upload them
      if (selectedFiles.length > 0 && taskId) {
        setIsUploading(true);
        try {
          await uploadAttachments(projectId, taskId, selectedFiles);
        } catch (uploadError) {
          console.error("Error al subir archivos:", uploadError);
          toast.error("La tarea se creó pero hubo un error al subir los archivos");
        } finally {
          setIsUploading(false);
        }
      }
      
      toast.success("Tarea creada exitosamente");
      onClose();

      // Reset form
      setFormData({
        title: "",
        description: "",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: "",
        tags: [],
        assignedTo: "",
        notes: "",
        attachments: [],
      });
      setSelectedFiles([]);
    } catch (error) {
      toast.error("Error al crear la tarea");
      setIsUploading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !loading && onClose()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 overflow-hidden">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      Nueva Tarea
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Crea una nueva tarea para este proyecto
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <option value={TaskStatus.PENDING}>Pendientes</option>
                        <option value={TaskStatus.IN_PROGRESS}>
                          En progreso
                        </option>
                        <option value={TaskStatus.REVIEW}>Revisión</option>
                        <option value={TaskStatus.COMPLETED}>Completado</option>
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
                        <option value={TaskPriority.URGENT}>Urgente</option>
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
                      value={formData.assignedTo || ''}
                      onChange={handleChange}
                      placeholder="Nombre del responsable"
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
                    
                    {/* File Selection */}
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
                        <PaperClipIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        Agregar archivos
                      </button>
                    </div>

                    {/* Preview of Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Archivos seleccionados:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedFiles.map((file, idx) => {
                            const isImage = file.type.startsWith('image/');
                            
                            return (
                              <div key={idx} className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                                {isImage ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <div className="w-full h-16 relative rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                                      <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={file.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full">{file.name}</p>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <DocumentIcon className="h-6 w-6 text-gray-400 mr-2" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
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

                  <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={loading || isUploading}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed sm:col-start-2"
                    >
                      {loading || isUploading ? "Guardando..." : "Guardar Tarea"}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:col-start-1 sm:mt-0"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default NewTaskModal;
