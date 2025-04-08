import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  Project,
  ProjectCreateInput,
  ProjectStatus,
  useProjectStore,
} from "../../../../../store/projectStore";
import { toast } from "react-hot-toast";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { updateProject, loading } = useProjectStore();

  const [formData, setFormData] = useState<ProjectCreateInput>({
    name: "",
    description: "",
    initialBudget: 0,
    startDate: "",
    endDate: "",
    status: ProjectStatus.IN_PROGRESS,
  });

  // Cargar datos del proyecto al abrir el modal
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name,
        description: project.description,
        initialBudget: project.initialBudget,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
      });
    }
  }, [isOpen, project]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "initialBudget") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.name.trim()) {
      toast.error("El nombre del proyecto es obligatorio");
      return;
    }

    if (formData.initialBudget <= 0) {
      toast.error("El presupuesto inicial debe ser mayor a 0");
      return;
    }

    if (!formData.startDate) {
      toast.error("La fecha de inicio es obligatoria");
      return;
    }

    if (!formData.endDate) {
      toast.error("La fecha de entrega es obligatoria");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      toast.error(
        "La fecha de entrega no puede ser anterior a la fecha de inicio"
      );
      return;
    }

    try {
      await updateProject(project.id, formData);
      toast.success("Proyecto actualizado exitosamente");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar el proyecto");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => !loading && onClose()}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex justify-between items-center border-b border-gray-200 p-4">
            <Dialog.Title className="text-lg font-medium">
              Editar Proyecto
            </Dialog.Title>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
              disabled={loading}
            >
              <span className="sr-only">Cerrar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Descripción *
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="initialBudget"
                className="block text-sm font-medium text-gray-700"
              >
                Presupuesto Inicial (MXN) *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="initialBudget"
                  id="initialBudget"
                  value={formData.initialBudget}
                  onChange={handleChange}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-yellow-600">
                Advertencia: Cambiar el presupuesto inicial afectará a todos los
                cálculos del proyecto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de Entrega *
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Estado
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={ProjectStatus.IN_PROGRESS}>En Progreso</option>
                <option value={ProjectStatus.CANCELLED}>Cancelado</option>
                <option value={ProjectStatus.COMPLETED}>Finalizado</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditProjectModal;
