import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";
import { CondominiumStatus } from "./NewClientForm";

interface CondominiumEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLAN_LIMITS = {
  Basic: { min: 1, max: 50 },
  Essential: { min: 51, max: 100 },
  Professional: { min: 101, max: 250 },
  Premium: { min: 251, max: 500 },
};

const CondominiumEditModal: React.FC<CondominiumEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    currentCondominium,
    currentClient,
    updatingCondominium,
    updateCondominiumForm,
    updateCondominium,
    resetCondominiumForm,
  } = useClientsConfig();

  if (!isOpen || !currentCondominium || !currentClient) return null;

  if (!currentCondominium.id) {
    console.error("Error: Attempting to edit a condominium without an ID");
    onClose();
    return null;
  }

  // Opciones de funciones pro y sus etiquetas en español
  const proFunctionOptions = [
    "chatbot",
    "proReports",
    "smartAnalytics",
    "predictiveMaintenanceAlerts",
    "documentAI",
    "voiceAssistant",
    "energyOptimization",
  ];

  const proFunctionLabels: Record<string, string> = {
    chatbot: "ChatBot IA",
    proReports: "Reportes Avanzados",
    smartAnalytics: "Análisis Inteligente",
    predictiveMaintenanceAlerts: "Alertas de Mantenimiento Predictivo",
    documentAI: "IA para Documentos",
    voiceAssistant: "Asistente de Voz",
    energyOptimization: "Optimización Energética",
  };

  // Labels para los status de condominio
  const statusLabels: Record<CondominiumStatus, string> = {
    [CondominiumStatus.Pending]: "Pendiente",
    [CondominiumStatus.Active]: "Activo",
    [CondominiumStatus.Inactive]: "Inactivo",
    [CondominiumStatus.Blocked]: "Bloqueado",
  };

  const selectedPlanKey = (currentCondominium.plan ||
    "Basic") as keyof typeof PLAN_LIMITS;
  const selectedPlanLimits =
    PLAN_LIMITS[selectedPlanKey] || PLAN_LIMITS.Basic;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    updateCondominiumForm(e.target.name, e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const currentProFunctions = currentCondominium.proFunctions || [];

    if (checked) {
      // Añadir la función al array si no está ya
      if (!currentProFunctions.includes(name)) {
        updateCondominiumForm("proFunctions", [...currentProFunctions, name]);
      }
    } else {
      // Eliminar la función del array
      updateCondominiumForm(
        "proFunctions",
        currentProFunctions.filter((fn) => fn !== name)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await updateCondominium();
      if (success) {
        onClose();
        onSuccess(); // Recargar datos desde el componente padre
      }
    } catch (error) {
      console.error("Error al actualizar condominio:", error);
    }
  };

  // Limpiar formulario al cerrar
  const handleClose = () => {
    resetCondominiumForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Editar Condominio
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nombre del Condominio
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={currentCondominium.name}
              onChange={handleInputChange}
              required
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Dirección
            </label>
            <textarea
              name="address"
              id="address"
              rows={3}
              value={currentCondominium.address}
              onChange={handleInputChange}
              required
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Estado del Condominio
            </label>
            <select
              name="status"
              id="status"
              value={currentCondominium.status}
              onChange={handleInputChange}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            >
              {Object.values(CondominiumStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="plan"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Plan
            </label>
            <select
              name="plan"
              id="plan"
              value={currentCondominium.plan || "Basic"}
              onChange={handleInputChange}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            >
              <option value="Basic">Basic</option>
              <option value="Essential">Essential</option>
              <option value="Professional">Professional</option>
              <option value="Premium">Premium</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Límite del plan {selectedPlanKey}: {selectedPlanLimits.min} a{" "}
              {selectedPlanLimits.max} condominios.
            </p>
          </div>

          <div>
            <label
              htmlFor="condominiumLimit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Límite de Condominios
            </label>
            <input
              type="number"
              name="condominiumLimit"
              id="condominiumLimit"
              value={currentCondominium.condominiumLimit || 1}
              onChange={handleInputChange}
              min={selectedPlanLimits.min}
              max={selectedPlanLimits.max}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Rango permitido para este plan: {selectedPlanLimits.min} -{" "}
              {selectedPlanLimits.max}
            </p>
          </div>

          <div>
            <label
              htmlFor="proFunctions"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Funciones Pro
            </label>
            <div className="mt-2 space-y-2">
              {proFunctionOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={option}
                    name={option}
                    checked={
                      currentCondominium.proFunctions?.includes(option) || false
                    }
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={option}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {proFunctionLabels[option]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Este condominio pertenece al cliente:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {currentClient.companyName}
              </span>
            </p>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updatingCondominium}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {updatingCondominium ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CondominiumEditModal;
