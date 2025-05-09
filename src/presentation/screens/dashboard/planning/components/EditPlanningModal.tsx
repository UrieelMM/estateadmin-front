import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  TagIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  usePlanningStore,
  Planning,
  PlanningType,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";

interface EditPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  planning: Planning;
  onSuccess?: () => void;
}

const EditPlanningModal: React.FC<EditPlanningModalProps> = ({
  isOpen,
  onClose,
  planning,
  onSuccess,
}) => {
  const { updatePlanning } = usePlanningStore();
  const { condominiumsUsers, fetchCondominiumsUsers, getUserById } =
    useUserDataStore();
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  const [title, setTitle] = useState(planning.title);
  const [description, setDescription] = useState(planning.description);
  const [type, setType] = useState<PlanningType>(planning.type);
  const [startDate, setStartDate] = useState<Date | null>(
    planning.startDate ? new Date(planning.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    planning.endDate ? new Date(planning.endDate) : null
  );
  const [assignedTo, setAssignedTo] = useState<string[]>(planning.assignedTo);
  const [tags, setTags] = useState<string[]>(planning.tags);
  const [tag, setTag] = useState("");
  const [budget, setBudget] = useState<string>(
    planning.budget ? planning.budget.toString() : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    dates?: string;
    budget?: string;
    description?: string;
    type?: string;
    assignedTo?: string;
    tags?: string;
  }>({});

  useEffect(() => {
    fetchCondominiumsUsers();

    // Actualizar el estado local cuando cambie la planificación
    setTitle(planning.title);
    setDescription(planning.description);
    setType(planning.type);
    setStartDate(planning.startDate ? new Date(planning.startDate) : null);
    setEndDate(planning.endDate ? new Date(planning.endDate) : null);
    setAssignedTo(planning.assignedTo);
    setTags(planning.tags);
    setBudget(planning.budget ? planning.budget.toString() : "");
  }, [planning, fetchCondominiumsUsers]);

  useEffect(() => {
    // Cargar datos de usuarios asignados
    const loadUserData = async () => {
      const newCache: Record<string, any> = {};

      for (const userId of planning.assignedTo || []) {
        if (!userCache[userId]) {
          const userData = await getUserById(userId);
          if (userData) {
            newCache[userId] = userData;
          }
        }
      }

      setUserCache((prev) => ({ ...prev, ...newCache }));
    };

    if (isOpen) {
      loadUserData();
    }
  }, [planning.assignedTo, getUserById, isOpen, userCache]);

  const validateForm = () => {
    const errors: {
      title?: string;
      dates?: string;
      budget?: string;
      description?: string;
      type?: string;
      assignedTo?: string;
      tags?: string;
    } = {};
    let isValid = true;

    if (!title.trim()) {
      errors.title = "El título es obligatorio";
      isValid = false;
    }

    if (startDate && endDate && startDate > endDate) {
      errors.dates =
        "La fecha de inicio no puede ser posterior a la fecha de fin";
      isValid = false;
    }

    if (budget && isNaN(Number(budget))) {
      errors.budget = "El presupuesto debe ser un número";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const planningData = {
      title,
      description,
      type,
      startDate: startDate ? startDate.toISOString().split("T")[0] : "",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      assignedTo,
      tags,
      budget: budget ? Number(budget) : undefined,
    };

    try {
      await updatePlanning(planning.id, planningData);
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError("Error al actualizar la planificación. Inténtalo de nuevo.");
      setLoading(false);
      console.error("Error updating planning:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-800 sm:p-8">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
            Editar Planificación
          </h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.title ? "border-red-500 dark:border-red-500" : ""
                }`}
                placeholder="Título de la planificación"
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.description
                    ? "border-red-500 dark:border-red-500"
                    : ""
                }`}
                placeholder="Descripción detallada de la planificación"
              ></textarea>
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.description}
                </p>
              )}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
                >
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate ? startDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                  className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                    formErrors.dates ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
                >
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate ? endDate.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setEndDate(e.target.value ? new Date(e.target.value) : null)
                  }
                  className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                    formErrors.dates ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  required
                />
              </div>
            </div>
            {formErrors.dates && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {formErrors.dates}
              </p>
            )}

            <div className="mb-4">
              <label
                htmlFor="type"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Tipo
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as PlanningType)}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.type ? "border-red-500 dark:border-red-500" : ""
                }`}
              >
                <option value={PlanningType.MONTHLY}>Mensual</option>
                <option value={PlanningType.QUARTERLY}>Trimestral</option>
                <option value={PlanningType.BIANNUAL}>Semestral</option>
                <option value={PlanningType.ANNUAL}>Anual</option>
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="assignedTo"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Asignado a
              </label>
              <select
                id="assignedTo"
                multiple
                value={assignedTo}
                onChange={(e) => {
                  const selectedOptions = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setAssignedTo(selectedOptions);
                }}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.assignedTo
                    ? "border-red-500 dark:border-red-500"
                    : ""
                }`}
              >
                {condominiumsUsers.map((user: any) => (
                  <option key={user.uid} value={user.uid}>
                    {`${user.name} ${user.lastName}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples
                usuarios
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="tags"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Etiquetas
              </label>
              <div className="flex">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="tags"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className={`w-full rounded-l-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      formErrors.tags
                        ? "border-red-500 dark:border-red-500"
                        : ""
                    }`}
                    placeholder="Añadir etiqueta"
                  />
                  <TagIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:hover:bg-gray-500 dark:text-white"
                >
                  Añadir
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-800 hover:bg-blue-200 hover:text-blue-900 focus:outline-none dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="budget"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Presupuesto
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={`w-full pl-8 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.budget
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">$</span>
                </div>
                <CurrencyDollarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {formErrors.budget && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.budget}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlanningModal;
