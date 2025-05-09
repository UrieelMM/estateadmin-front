import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  PlanningType,
  usePlanningStore,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";
import moment from "moment";
import "moment/locale/es";

interface NewPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planningId: string) => void;
}

const NewPlanningModal: React.FC<NewPlanningModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addPlanning, loading, error } = usePlanningStore();
  const { condominiumsUsers, fetchCondominiumsUsers } = useUserDataStore();

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PlanningType>(PlanningType.MONTHLY);
  const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(
    moment().add(1, "month").format("YYYY-MM-DD")
  );
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Actualizar fechas de fin según el tipo de planificación seleccionado
  useEffect(() => {
    const start = moment(startDate);
    let end;

    switch (type) {
      case PlanningType.MONTHLY:
        end = start.clone().add(1, "month");
        break;
      case PlanningType.QUARTERLY:
        end = start.clone().add(3, "months");
        break;
      case PlanningType.BIANNUAL:
        end = start.clone().add(6, "months");
        break;
      case PlanningType.ANNUAL:
        end = start.clone().add(1, "year");
        break;
      default:
        end = start.clone().add(1, "month");
    }

    setEndDate(end.format("YYYY-MM-DD"));
  }, [type, startDate]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType(PlanningType.MONTHLY);
    setStartDate(moment().format("YYYY-MM-DD"));
    setEndDate(moment().add(1, "month").format("YYYY-MM-DD"));
    setAssignedTo([]);
    setTagInput("");
    setTags([]);
    setBudget("");
    setFormErrors({});
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "El título es obligatorio";
    }

    if (!description.trim()) {
      errors.description = "La descripción es obligatoria";
    }

    if (!moment(startDate).isValid()) {
      errors.startDate = "La fecha de inicio no es válida";
    }

    if (!moment(endDate).isValid()) {
      errors.endDate = "La fecha de fin no es válida";
    }

    if (moment(endDate).isBefore(moment(startDate))) {
      errors.endDate =
        "La fecha de fin no puede ser anterior a la fecha de inicio";
    }

    if (budget && isNaN(parseFloat(budget))) {
      errors.budget = "El presupuesto debe ser un número válido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const planningData = {
      title,
      description,
      type,
      startDate,
      endDate,
      assignedTo,
      tags,
      budget: budget ? parseFloat(budget) : undefined,
    };

    const planningId = await addPlanning(planningData);

    if (planningId) {
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess(planningId);
      }
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* Centra el contenido del modal */}
          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Nueva Planificación
                  </Dialog.Title>

                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      {error && (
                        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Error
                              </h3>
                              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>{error}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Título *
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="title"
                              name="title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className={`block w-full rounded-md border ${
                                formErrors.title
                                  ? "border-red-300 dark:border-red-700"
                                  : "border-gray-300 dark:border-gray-600"
                              } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              required
                            />
                            {formErrors.title && (
                              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {formErrors.title}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Descripción *
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="description"
                              name="description"
                              rows={3}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className={`block w-full rounded-md border ${
                                formErrors.description
                                  ? "border-red-300 dark:border-red-700"
                                  : "border-gray-300 dark:border-gray-600"
                              } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              required
                            />
                            {formErrors.description && (
                              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {formErrors.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="type"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Tipo *
                          </label>
                          <div className="mt-1">
                            <select
                              id="type"
                              name="type"
                              value={type}
                              onChange={(e) =>
                                setType(e.target.value as PlanningType)
                              }
                              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm text-gray-900 dark:text-white"
                              required
                            >
                              <option value={PlanningType.MONTHLY}>
                                Mensual
                              </option>
                              <option value={PlanningType.QUARTERLY}>
                                Trimestral
                              </option>
                              <option value={PlanningType.BIANNUAL}>
                                Semestral
                              </option>
                              <option value={PlanningType.ANNUAL}>Anual</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="budget"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Presupuesto (opcional)
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                                $
                              </span>
                            </div>
                            <input
                              type="text"
                              id="budget"
                              name="budget"
                              value={budget}
                              onChange={(e) => setBudget(e.target.value)}
                              className={`block w-full rounded-md border ${
                                formErrors.budget
                                  ? "border-red-300 dark:border-red-700"
                                  : "border-gray-300 dark:border-gray-600"
                              } pl-7 pr-12 focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                                MXN
                              </span>
                            </div>
                          </div>
                          {formErrors.budget && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {formErrors.budget}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Fecha de inicio *
                          </label>
                          <div className="mt-1">
                            <input
                              type="date"
                              id="startDate"
                              name="startDate"
                              value={startDate}
                              onChange={handleStartDateChange}
                              className={`block w-full rounded-md border ${
                                formErrors.startDate
                                  ? "border-red-300 dark:border-red-700"
                                  : "border-gray-300 dark:border-gray-600"
                              } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              required
                            />
                            {formErrors.startDate && (
                              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {formErrors.startDate}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Fecha de fin *
                          </label>
                          <div className="mt-1">
                            <input
                              type="date"
                              id="endDate"
                              name="endDate"
                              value={endDate}
                              onChange={handleEndDateChange}
                              className={`block w-full rounded-md border ${
                                formErrors.endDate
                                  ? "border-red-300 dark:border-red-700"
                                  : "border-gray-300 dark:border-gray-600"
                              } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                              required
                            />
                            {formErrors.endDate && (
                              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {formErrors.endDate}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="assignedTo"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Asignar a
                          </label>
                          <div className="mt-1">
                            <select
                              id="assignedTo"
                              name="assignedTo"
                              multiple
                              value={assignedTo}
                              onChange={(e) => {
                                const selectedOptions = Array.from(
                                  e.target.selectedOptions,
                                  (option) => option.value
                                );
                                setAssignedTo(selectedOptions);
                              }}
                              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm text-gray-900 dark:text-white"
                            >
                              {condominiumsUsers.map((user) => (
                                <option key={user.uid} value={user.uid}>
                                  {user.name} {user.lastName}
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Mantenga presionada la tecla Ctrl (Windows) o
                              Command (Mac) para seleccionar múltiples usuarios.
                            </p>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="tags"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Etiquetas
                          </label>
                          <div className="mt-1">
                            <div className="flex rounded-md shadow-sm">
                              <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm text-gray-900 dark:text-white"
                                placeholder="Agregar etiqueta"
                              />
                              <button
                                type="button"
                                onClick={addTag}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                              >
                                Agregar
                              </button>
                            </div>

                            {tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => removeTag(tag)}
                                      className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                                    >
                                      <span className="sr-only">
                                        Eliminar etiqueta {tag}
                                      </span>
                                      <svg
                                        className="h-2 w-2"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 8 8"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeWidth="1.5"
                                          d="M1 1l6 6m0-6L1 7"
                                        />
                                      </svg>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
                        >
                          {loading ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default NewPlanningModal;
