import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";
import { countriesList } from "../../../utils/countriesList";
import { CondominiumStatus } from "./NewClientForm";

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Límites de condominios por plan
const PLAN_LIMITS = {
  Basic: { min: 1, max: 50 },
  Essential: { min: 51, max: 100 },
  Professional: { min: 101, max: 250 },
  Premium: { min: 251, max: 500 },
};

const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    currentClient,
    condominiumForm,
    loading,
    addingCondominium,
    updateClientForm,
    updateCondominiumForm,
    submitClientEdit,
    createCondominium,
  } = useClientsConfig();

  const [activeTab, setActiveTab] = useState<"edit" | "addCondominium">("edit");

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

  if (!isOpen || !currentClient) return null;

  // Ensure we have an ID to edit
  if (!currentClient.id) {
    console.error("Error: Attempting to edit a client without an ID");
    onClose();
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    updateClientForm(e.target.name, e.target.value);
  };

  const handleCondominiumInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    updateCondominiumForm(e.target.name, e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const currentProFunctions = condominiumForm.proFunctions || [];

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

  const handleSubmitClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar plan y condominiumLimit si existe
    if (currentClient.plan && currentClient.condominiumLimit) {
      const planLimits =
        PLAN_LIMITS[currentClient.plan as keyof typeof PLAN_LIMITS];
      if (
        planLimits &&
        (currentClient.condominiumLimit < planLimits.min ||
          currentClient.condominiumLimit > planLimits.max)
      ) {
        return;
      }
    }

    try {
      const success = await submitClientEdit();
      if (success) {
        onClose();
        onSuccess(); // Recargar datos desde el componente padre
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
    }
  };

  const handleSubmitNewCondominium = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await createCondominium();
      if (success) {
        onSuccess(); // Recargar datos desde el componente padre
      }
    } catch (error) {
      console.error("Error al crear condominio:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {activeTab === "edit" ? "Editar Cliente" : "Agregar Condominio"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "edit"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Editar Cliente
          </button>
          <button
            onClick={() => setActiveTab("addCondominium")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "addCondominium"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Agregar Condominio
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === "edit" ? (
          <form onSubmit={handleSubmitClientEdit} className="px-6 py-4">
            <div className="space-y-4">
              {/* Datos de la empresa */}
              <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
                Datos de la Empresa
              </h4>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Razón Social (Nombre Legal)
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={currentClient.companyName}
                  onChange={handleInputChange}
                  required
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  value={currentClient.businessName || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={currentClient.email}
                  onChange={handleInputChange}
                  required
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={currentClient.phoneNumber || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="RFC"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  RFC
                </label>
                <input
                  type="text"
                  name="RFC"
                  id="RFC"
                  value={currentClient.RFC}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="fullFiscalAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Domicilio Fiscal Completo
                </label>
                <textarea
                  name="fullFiscalAddress"
                  id="fullFiscalAddress"
                  value={currentClient.fullFiscalAddress || ""}
                  onChange={handleInputChange}
                  rows={2}
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
                  value={currentClient.address || ""}
                  onChange={handleInputChange}
                  rows={2}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  País
                </label>
                <select
                  name="country"
                  id="country"
                  value={currentClient.country}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="">Seleccione un país</option>
                  {countriesList.map((country: string) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="taxRegime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Régimen Fiscal
                </label>
                <input
                  type="text"
                  name="taxRegime"
                  id="taxRegime"
                  value={currentClient.taxRegime || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="businessActivity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Giro o Actividad Económica
                </label>
                <input
                  type="text"
                  name="businessActivity"
                  id="businessActivity"
                  value={currentClient.businessActivity || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cfdiUse"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Uso de CFDI
                </label>
                <input
                  type="text"
                  name="cfdiUse"
                  id="cfdiUse"
                  value={currentClient.cfdiUse || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="responsiblePersonName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre del Responsable
                </label>
                <input
                  type="text"
                  name="responsiblePersonName"
                  id="responsiblePersonName"
                  value={currentClient.responsiblePersonName || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="responsiblePersonPosition"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cargo del Responsable
                </label>
                <input
                  type="text"
                  name="responsiblePersonPosition"
                  id="responsiblePersonPosition"
                  value={currentClient.responsiblePersonPosition || ""}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="billingFrequency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Frecuencia de Facturación
                </label>
                <select
                  name="billingFrequency"
                  id="billingFrequency"
                  value={currentClient.billingFrequency || "monthly"}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="biannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>

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
                  value={currentClient.status}
                  onChange={handleInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
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
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitNewCondominium} className="px-6 py-4">
            <div className="space-y-4">
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
                  value={condominiumForm.name}
                  onChange={handleCondominiumInputChange}
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
                  value={condominiumForm.address}
                  onChange={handleCondominiumInputChange}
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
                  value={condominiumForm.status || CondominiumStatus.Pending}
                  onChange={handleCondominiumInputChange}
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
                  value={condominiumForm.plan || "Basic"}
                  onChange={handleCondominiumInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Essential">Essential</option>
                  <option value="Professional">Professional</option>
                  <option value="Premium">Premium</option>
                </select>
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
                  value={condominiumForm.condominiumLimit || 1}
                  onChange={handleCondominiumInputChange}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
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
                          condominiumForm.proFunctions?.includes(option) ||
                          false
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
                  El condominio será creado para el cliente:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {currentClient.companyName}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingCondominium}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {addingCondominium ? (
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
                    Agregando...
                  </>
                ) : (
                  "Agregar Condominio"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClientEditModal;
