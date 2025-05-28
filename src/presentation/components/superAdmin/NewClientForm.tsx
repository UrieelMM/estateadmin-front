import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
export enum CondominiumStatus {
  Pending = "pending",
  Active = "active",
  Inactive = "inactive",
  Blocked = "blocked",
}
import useSuperAdminStore from "../../../store/superAdmin/SuperAdminStore";

interface NewClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<{
    success: boolean;
    credentials?: { email: string; password: string };
  }>;
}

// Tipos de planes disponibles
type PlanType = "Basic" | "Essential" | "Professional" | "Premium";

// Tipo de frecuencia de facturación
type BillingFrequency = "monthly" | "quarterly" | "biannual" | "annual";

// Límites de condominios por plan
const PLAN_LIMITS = {
  Basic: { min: 1, max: 50 },
  Essential: { min: 51, max: 100 },
  Professional: { min: 101, max: 250 },
  Premium: { min: 251, max: 500 },
};

const NewClientForm: React.FC<NewClientFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { creatingClient } = useSuperAdminStore();

  const [formData, setFormData] = useState({
    // Campos obligatorios
    name: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    companyName: "",
    fullFiscalAddress: "",
    RFC: "",
    country: "",
    businessName: "",
    taxRegime: "",
    businessActivity: "",
    responsiblePersonName: "",
    responsiblePersonPosition: "",
    condominiumLimit: 1,
    currency: "MXN",
    language: "es-MX",
    condominiumInfo: {
      name: "",
      address: "",
      status: CondominiumStatus.Pending,
    },

    // Campos opcionales con valores predeterminados
    photoURL: "",
    plan: "Basic" as PlanType,
    proFunctions: [] as string[],
    cfdiUse: "G03",
    serviceStartDate: new Date(),
    billingFrequency: "monthly" as BillingFrequency,
    termsAccepted: true,
    address: "", // Mantenido por compatibilidad
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

  // Labels para los status de condominio
  const statusLabels: Record<CondominiumStatus, string> = {
    [CondominiumStatus.Pending]: "Pendiente",
    [CondominiumStatus.Active]: "Activo",
    [CondominiumStatus.Inactive]: "Inactivo",
    [CondominiumStatus.Blocked]: "Bloqueado",
  };

  // Opciones de moneda e idioma por país
  const countryOptions = [
    {
      country: "Ecuador",
      language: "es-EC",
      currency: "USD",
      currencyName: "Dólar estadounidense",
    },
    {
      country: "Colombia",
      language: "es-CO",
      currency: "COP",
      currencyName: "Peso colombiano",
    },
    {
      country: "Chile",
      language: "es-CL",
      currency: "CLP",
      currencyName: "Peso chileno",
    },
    {
      country: "Argentina",
      language: "es-AR",
      currency: "ARS",
      currencyName: "Peso argentino",
    },
    {
      country: "Guatemala",
      language: "es-GT",
      currency: "GTQ",
      currencyName: "Quetzal guatemalteco",
    },
    {
      country: "Costa Rica",
      language: "es-CR",
      currency: "CRC",
      currencyName: "Colón costarricense",
    },
    {
      country: "El Salvador",
      language: "es-SV",
      currency: "USD",
      currencyName: "Dólar estadounidense",
    },
    {
      country: "Bolivia",
      language: "es-BO",
      currency: "BOB",
      currencyName: "Boliviano",
    },
    {
      country: "México",
      language: "es-MX",
      currency: "MXN",
      currencyName: "Peso mexicano",
    },
  ];

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

  // Actualizar condominiumLimit basado en el plan seleccionado
  useEffect(() => {
    const plan = formData.plan as keyof typeof PLAN_LIMITS;
    if (PLAN_LIMITS[plan]) {
      // Establecer un valor dentro del rango válido para el plan
      const minValue = PLAN_LIMITS[plan].min;
      setFormData((prev) => ({
        ...prev,
        condominiumLimit: minValue,
      }));
    }
  }, [formData.plan]);

  // Sincronizar moneda e idioma cuando se cambie el país
  useEffect(() => {
    const selectedCountryOption = countryOptions.find(
      (option) => option.country === formData.country
    );
    if (selectedCountryOption) {
      setFormData((prev) => ({
        ...prev,
        currency: selectedCountryOption.currency,
        language: selectedCountryOption.language,
      }));
    }
  }, [formData.country]);

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

    // Validar que todos los campos obligatorios estén llenos
    const requiredFields = [
      "email",
      "name",
      "lastName",
      "phoneNumber",
      "companyName",
      "fullFiscalAddress",
      "RFC",
      "country",
      "businessName",
      "taxRegime",
      "businessActivity",
      "responsiblePersonName",
      "responsiblePersonPosition",
      "currency",
      "language",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      return;
    }

    // Validar condominium limit según el plan
    const planLimits = PLAN_LIMITS[formData.plan as keyof typeof PLAN_LIMITS];
    if (
      formData.condominiumLimit < planLimits.min ||
      formData.condominiumLimit > planLimits.max
    ) {
      return;
    }

    // Validar información del condominio
    if (!formData.condominiumInfo.name || !formData.condominiumInfo.address) {
      return;
    }

    // Validar currency y language del cliente
    if (!formData.currency || !formData.language) {
      return;
    }

    const password = generatePassword();
    const submitData = {
      ...formData,
      password,
    };

    try {
      const result = await onSubmit(submitData);

      if (result.success) {
        // Si la API devuelve las credenciales, usarlas
        if (result.credentials) {
          setCredentials(result.credentials);
        } else {
          // Si no, usar las generadas localmente
          setCredentials({
            email: formData.email,
            password,
          });
        }
        setShowCredentials(true);
      }
    } catch (error) {
      console.error("Error al crear cliente:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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
    } else if (name === "condominiumLimit") {
      // Convertir a número
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({
          ...prev,
          [name]: numValue,
        }));
      }
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

    if (name === "termsAccepted") {
      setFormData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }));
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Sección de datos del administrador */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
              Datos del Administrador
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre*
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
                  Apellido*
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
                  Email*
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
                  Teléfono*
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
                  Foto de Perfil (URL)
                </label>
                <input
                  type="url"
                  name="photoURL"
                  value={formData.photoURL}
                  onChange={handleInputChange}
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Sección de datos de la empresa */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
              Datos de la Empresa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Razón Social (Nombre Legal)*
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre Comercial*
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
                  RFC*
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

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Domicilio Fiscal Completo*
                </label>
                <textarea
                  name="fullFiscalAddress"
                  value={formData.fullFiscalAddress}
                  onChange={handleInputChange}
                  rows={2}
                  required
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  País*
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  <option value="">Seleccione un país</option>
                  {countryOptions.map((option) => (
                    <option key={option.country} value={option.country}>
                      {option.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Régimen Fiscal*
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
                  Giro o Actividad Económica*
                </label>
                <input
                  type="text"
                  name="businessActivity"
                  value={formData.businessActivity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Uso de CFDI
                </label>
                <input
                  type="text"
                  name="cfdiUse"
                  value={formData.cfdiUse}
                  onChange={handleInputChange}
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Responsable*
                </label>
                <input
                  type="text"
                  name="responsiblePersonName"
                  value={formData.responsiblePersonName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cargo del Responsable*
                </label>
                <input
                  type="text"
                  name="responsiblePersonPosition"
                  value={formData.responsiblePersonPosition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma*
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  {countryOptions.map((option) => (
                    <option key={option.language} value={option.language}>
                      {option.country} ({option.language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Moneda*
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  {countryOptions.map((option) => (
                    <option key={option.currency} value={option.currency}>
                      {option.currency} - {option.currencyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
              Facturación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Frecuencia de Facturación
                </label>
                <select
                  name="billingFrequency"
                  value={formData.billingFrequency}
                  onChange={handleInputChange}
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="biannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                  >
                    Acepta términos y condiciones
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Functions */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
              Funciones Pro (IA)
            </h4>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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

          {/* Sección de información del primer condominio */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
              Información del Primer Condominio
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Condominio*
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
                  Dirección del Condominio*
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado del Condominio
                </label>
                <select
                  name="condominiumInfo.status"
                  value={formData.condominiumInfo.status}
                  onChange={handleInputChange}
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  {Object.entries(CondominiumStatus).map(([_key, value]) => (
                    <option key={value} value={value}>
                      {statusLabels[value as CondominiumStatus]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plan*
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  <option value="Basic">Basic (1-50 condominios)</option>
                  <option value="Essential">
                    Essential (51-100 condominios)
                  </option>
                  <option value="Professional">
                    Professional (101-250 condominios)
                  </option>
                  <option value="Premium">Premium (251-500 condominios)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Límite de Condominios*
                </label>
                <input
                  type="number"
                  name="condominiumLimit"
                  value={formData.condominiumLimit}
                  onChange={handleInputChange}
                  min={
                    PLAN_LIMITS[formData.plan as keyof typeof PLAN_LIMITS].min
                  }
                  max={
                    PLAN_LIMITS[formData.plan as keyof typeof PLAN_LIMITS].max
                  }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para el plan {formData.plan}: mínimo{" "}
                  {PLAN_LIMITS[formData.plan as keyof typeof PLAN_LIMITS].min},
                  máximo{" "}
                  {PLAN_LIMITS[formData.plan as keyof typeof PLAN_LIMITS].max}
                </p>
              </div>
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
              disabled={creatingClient}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-75 flex items-center"
            >
              {creatingClient ? (
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
                  Creando...
                </>
              ) : (
                "Crear Cliente"
              )}
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
