import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { countriesList } from "../../../../utils/countriesList";

interface NewClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const NewClientForm: React.FC<NewClientFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    lastName: "",
    phoneNumber: "",
    plan: "Basic",
    proFunctions: [] as string[],
    companyName: "",
    address: "",
    RFC: "",
    country: "",
    businessName: "",
    taxResidence: "",
    taxRegime: "",
    condominiumName: "",
    condominiumInfo: {
      name: "",
      address: "",
    },
  });

  const proFunctionOptions = [
    "chatbot",
    "proReports",
    "smartAnalytics",
    "predictiveMaintenanceAlerts",
    "documentAI",
    "voiceAssistant",
    "energyOptimization",
  ];

  // Nombres en español para mostrar en la UI
  const proFunctionLabels: Record<string, string> = {
    chatbot: "ChatBot IA",
    proReports: "Reportes Avanzados",
    smartAnalytics: "Análisis Inteligente",
    predictiveMaintenanceAlerts: "Alertas de Mantenimiento Predictivo",
    documentAI: "IA para Documentos",
    voiceAssistant: "Asistente de Voz",
    energyOptimization: "Optimización Energética",
  };

  const [selectAll, setSelectAll] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (selectAll) {
      setFormData((prev) => ({
        ...prev,
        proFunctions: [...proFunctionOptions],
      }));
    } else if (formData.proFunctions.length === proFunctionOptions.length) {
      setFormData((prev) => ({
        ...prev,
        proFunctions: [],
      }));
    }
  }, [selectAll]);

  useEffect(() => {
    if (formData.proFunctions.length === proFunctionOptions.length) {
      setSelectAll(true);
    } else if (
      selectAll &&
      formData.proFunctions.length < proFunctionOptions.length
    ) {
      setSelectAll(false);
    }
  }, [formData.proFunctions]);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los campos estén llenos
    const requiredFields = [
      "email",
      "name",
      "lastName",
      "phoneNumber",
      "companyName",
      "address",
      "RFC",
      "country",
      "businessName",
      "taxResidence",
      "taxRegime",
      "condominiumName",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    // Validar que se seleccione al menos una función Pro si el plan es Pro
    if (formData.plan === "Pro" && formData.proFunctions.length === 0) {
      toast.error("Debe seleccionar al menos una función Pro");
      return;
    }

    const password = generatePassword();
    const submitData = {
      ...formData,
      password,
    };

    try {
      await onSubmit(submitData);
      setCredentials({
        email: formData.email,
        password,
      });
      setShowCredentials(true);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear el cliente");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("condominiumInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        condominiumInfo: {
          ...prev.condominiumInfo,
          [field]: value,
        },
      }));
    } else if (name === "plan" && value !== "Pro") {
      // Si cambia de plan y no es Pro, resetear proFunctions
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        proFunctions: [],
      }));
      setSelectAll(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === "selectAll") {
      setSelectAll(checked);
      return;
    }

    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          proFunctions: [...prev.proFunctions, name],
        };
      } else {
        return {
          ...prev,
          proFunctions: prev.proFunctions.filter((fn) => fn !== name),
        };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 m-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Nuevo Cliente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              >
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            {/* Pro Functions */}
            {formData.plan === "Pro" && (
              <div className="col-span-2 mt-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funciones Pro (IA)
                </label>
                <div className="pl-2">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="selectAll"
                      name="selectAll"
                      checked={selectAll}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="selectAll"
                      className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                    >
                      Seleccionar todos
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {proFunctionOptions.map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={option}
                          name={option}
                          checked={formData.proFunctions.includes(option)}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={option}
                          className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                        >
                          {proFunctionLabels[option]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                RFC
              </label>
              <input
                type="text"
                name="RFC"
                value={formData.RFC}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                País
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre Comercial
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Residencia Fiscal
              </label>
              <input
                type="text"
                name="taxResidence"
                value={formData.taxResidence}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Régimen Fiscal
              </label>
              <input
                type="text"
                name="taxRegime"
                value={formData.taxRegime}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Condominio
              </label>
              <input
                type="text"
                name="condominiumName"
                value={formData.condominiumName}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Condominio (Info)
              </label>
              <input
                type="text"
                name="condominiumInfo.name"
                value={formData.condominiumInfo.name}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección del Condominio
              </label>
              <input
                type="text"
                name="condominiumInfo.address"
                value={formData.condominiumInfo.address}
                onChange={handleInputChange}
                required
                className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Crear Cliente
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Credenciales */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 m-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Credenciales del Cliente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentials.email}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(credentials.email)
                    }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentials.password}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(credentials.password)
                    }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCredentials(false);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewClientForm;
