import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  IdentificationIcon,
  HomeModernIcon,
  SparklesIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  MapPinIcon,
  HashtagIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import useNewCustomerFormStore, {
  NewCustomerInfo,
} from "../../../store/superAdmin/useNewCustomerFormStore";

// Tipos y Interfaces
interface FormErrors {
  [key: string]: string;
}

interface StepProps {
  currentData: Partial<NewCustomerInfo>;
  updateField: (field: string, value: any) => void;
  errors: FormErrors;
  touched: Record<string, boolean>;
  setTouched: (field: string, value: boolean) => void;
}

// Constantes
const FORM_STEPS = [
  "Información Personal",
  "Información de la Empresa",
  "Datos Fiscales",
  "Información de Responsable",
  "Información del Condominio",
  "Selección de Plan",
];

const STEP_ICONS = [
  UserCircleIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  IdentificationIcon,
  HomeModernIcon,
  SparklesIcon,
];

const getFieldClass = (hasError: boolean) =>
  `mt-1 block w-full px-3 py-2.5 border rounded-lg transition-colors duration-200 shadow-sm text-sm bg-white/95 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 ${
    hasError
      ? "border-red-300 dark:border-red-500"
      : "border-gray-300 dark:border-gray-700"
  }`;

const PLANS = [
  {
    value: "Basic",
    label: "Básico",
    price: "$750.00 MXN",
    tax: "+ IVA",
    range: "1 - 50",
    highlighted: false,
    description:
      "Ideal para condominios pequeños que buscan optimizar su administración.",
  },
  {
    value: "Essential",
    label: "Esencial",
    price: "$1,200.00 MXN",
    tax: "+ IVA",
    range: "51 - 100",
    highlighted: true,
    description:
      "Perfecto para condominios medianos con necesidades específicas de gestión.",
  },
  {
    value: "Professional",
    label: "Profesional",
    price: "$1,850.00 MXN",
    tax: "+ IVA",
    range: "101 - 250",
    highlighted: false,
    description:
      "Solución robusta para condominios grandes con múltiples necesidades.",
  },
  {
    value: "Premium",
    label: "Premium",
    price: "$1,950.00 MXN",
    tax: "+ IVA",
    range: "251 - 500",
    highlighted: false,
    description: "Capacidad completa para grandes desarrollos residenciales.",
  },
];

// Componentes para cada paso del formulario
const PersonalInfoStep: React.FC<StepProps> = ({
  currentData,
  updateField,
  errors,
  touched,
  setTouched,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
      Información Personal
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Ingrese la información de contacto principal.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <UserCircleIcon className="h-4 w-4 text-indigo-500" />
            Nombre*
          </span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={currentData.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => setTouched("name", true)}
          placeholder="Ej. Alejandro"
          className={getFieldClass(!!(errors.name && touched.name))}
        />
        {errors.name && touched.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <UserCircleIcon className="h-4 w-4 text-indigo-500" />
            Apellido*
          </span>
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={currentData.lastName || ""}
          onChange={(e) => updateField("lastName", e.target.value)}
          onBlur={() => setTouched("lastName", true)}
          placeholder="Ej. Martínez"
          className={getFieldClass(!!(errors.lastName && touched.lastName))}
        />
        {errors.lastName && touched.lastName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.lastName}
          </p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <EnvelopeIcon className="h-4 w-4 text-indigo-500" />
            Correo Electrónico*
          </span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={currentData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => setTouched("email", true)}
          placeholder="correo@empresa.com"
          className={getFieldClass(!!(errors.email && touched.email))}
        />
        {!errors.email && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Usaremos este correo para seguimiento comercial.
          </p>
        )}
        {errors.email && touched.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <PhoneIcon className="h-4 w-4 text-indigo-500" />
            Teléfono*
          </span>
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={currentData.phoneNumber || ""}
          onChange={(e) => updateField("phoneNumber", e.target.value)}
          onBlur={() => setTouched("phoneNumber", true)}
          placeholder="+52 55 1234 5678"
          className={getFieldClass(!!(errors.phoneNumber && touched.phoneNumber))}
        />
        {errors.phoneNumber && touched.phoneNumber && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.phoneNumber}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Paso 2: Información de la Empresa
const CompanyInfoStep: React.FC<StepProps> = ({
  currentData,
  updateField,
  errors,
  touched,
  setTouched,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
      Información de la Empresa
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Ingrese la información general de su empresa.
    </p>

    <div className="grid grid-cols-1 gap-4">
      <div>
        <label
          htmlFor="companyName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <BuildingOfficeIcon className="h-4 w-4 text-indigo-500" />
            Nombre de la Compañía*
          </span>
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={currentData.companyName || ""}
          onChange={(e) => updateField("companyName", e.target.value)}
          onBlur={() => setTouched("companyName", true)}
          placeholder="Ej. Administración Central SA de CV"
          className={getFieldClass(!!(errors.companyName && touched.companyName))}
        />
        {errors.companyName && touched.companyName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.companyName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <BuildingOfficeIcon className="h-4 w-4 text-indigo-500" />
            Nombre Comercial*
          </span>
        </label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          value={currentData.businessName || ""}
          onChange={(e) => updateField("businessName", e.target.value)}
          onBlur={() => setTouched("businessName", true)}
          placeholder="Ej. EstateAdmin México"
          className={getFieldClass(!!(errors.businessName && touched.businessName))}
        />
        {errors.businessName && touched.businessName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.businessName}
          </p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <GlobeAltIcon className="h-4 w-4 text-indigo-500" />
            País*
          </span>
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={currentData.country || ""}
          onChange={(e) => updateField("country", e.target.value)}
          onBlur={() => setTouched("country", true)}
          placeholder="Ej. México"
          className={getFieldClass(!!(errors.country && touched.country))}
        />
        {errors.country && touched.country && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.country}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="businessActivity"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <BriefcaseIcon className="h-4 w-4 text-indigo-500" />
            Actividad Económica*
          </span>
        </label>
        <input
          type="text"
          id="businessActivity"
          name="businessActivity"
          value={currentData.businessActivity || ""}
          onChange={(e) => updateField("businessActivity", e.target.value)}
          onBlur={() => setTouched("businessActivity", true)}
          placeholder="Ej. Administración de condominios"
          className={getFieldClass(
            !!(errors.businessActivity && touched.businessActivity)
          )}
        />
        {errors.businessActivity && touched.businessActivity && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.businessActivity}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Paso 3: Datos Fiscales
const FiscalInfoStep: React.FC<StepProps> = ({
  currentData,
  updateField,
  errors,
  touched,
  setTouched,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
      Datos Fiscales
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Ingrese la información fiscal requerida para facturación.
    </p>

    <div className="grid grid-cols-1 gap-4">
      <div>
        <label
          htmlFor="fullFiscalAddress"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 text-indigo-500" />
            Domicilio Fiscal Completo*
          </span>
        </label>
        <textarea
          id="fullFiscalAddress"
          name="fullFiscalAddress"
          rows={3}
          value={currentData.fullFiscalAddress || ""}
          onChange={(e) => updateField("fullFiscalAddress", e.target.value)}
          onBlur={() => setTouched("fullFiscalAddress", true)}
          placeholder="Calle, número, colonia, municipio, estado, CP"
          className={getFieldClass(
            !!(errors.fullFiscalAddress && touched.fullFiscalAddress)
          )}
        />
        {errors.fullFiscalAddress && touched.fullFiscalAddress && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.fullFiscalAddress}
          </p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="RFC"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <HashtagIcon className="h-4 w-4 text-indigo-500" />
            RFC*
          </span>
        </label>
        <input
          type="text"
          id="RFC"
          name="RFC"
          value={currentData.RFC || ""}
          onChange={(e) => updateField("RFC", e.target.value)}
          onBlur={() => setTouched("RFC", true)}
          placeholder="Ej. XAXX010101000"
          className={getFieldClass(!!(errors.RFC && touched.RFC))}
        />
        {!errors.RFC && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Captúralo sin espacios y en mayúsculas.
          </p>
        )}
        {errors.RFC && touched.RFC && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.RFC}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="taxRegime"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <ShieldCheckIcon className="h-4 w-4 text-indigo-500" />
            Régimen Fiscal*
          </span>
        </label>
        <input
          type="text"
          id="taxRegime"
          name="taxRegime"
          value={currentData.taxRegime || ""}
          onChange={(e) => updateField("taxRegime", e.target.value)}
          onBlur={() => setTouched("taxRegime", true)}
          placeholder="Ej. General de Ley Personas Morales"
          className={getFieldClass(!!(errors.taxRegime && touched.taxRegime))}
        />
        {errors.taxRegime && touched.taxRegime && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.taxRegime}
          </p>
        )}
      </div>
    </div>

    <div>
      <label
        htmlFor="cfdiUse"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Uso de CFDI (Opcional)
      </label>
      <input
        type="text"
        id="cfdiUse"
        name="cfdiUse"
        value={currentData.cfdiUse || ""}
        onChange={(e) => updateField("cfdiUse", e.target.value)}
        placeholder="Ej. G03"
        className={getFieldClass(false)}
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Si no lo conoces, puedes dejar el valor por defecto.
      </p>
    </div>
  </div>
);

// Paso 4: Información de Responsable
const ResponsiblePersonStep: React.FC<StepProps> = ({
  currentData,
  updateField,
  errors,
  touched,
  setTouched,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
      Información de Responsable
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Ingrese la información de la persona responsable de la administración.
    </p>

    <div className="grid grid-cols-1 gap-4">
      <div>
        <label
          htmlFor="responsiblePersonName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <UserCircleIcon className="h-4 w-4 text-indigo-500" />
            Nombre de la Persona Responsable*
          </span>
        </label>
        <input
          type="text"
          id="responsiblePersonName"
          name="responsiblePersonName"
          value={currentData.responsiblePersonName || ""}
          onChange={(e) => updateField("responsiblePersonName", e.target.value)}
          onBlur={() => setTouched("responsiblePersonName", true)}
          placeholder="Ej. Laura Gómez"
          className={getFieldClass(
            !!(errors.responsiblePersonName && touched.responsiblePersonName)
          )}
        />
        {errors.responsiblePersonName && touched.responsiblePersonName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.responsiblePersonName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="responsiblePersonPosition"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <BriefcaseIcon className="h-4 w-4 text-indigo-500" />
            Cargo de la Persona Responsable*
          </span>
        </label>
        <input
          type="text"
          id="responsiblePersonPosition"
          name="responsiblePersonPosition"
          value={currentData.responsiblePersonPosition || ""}
          onChange={(e) =>
            updateField("responsiblePersonPosition", e.target.value)
          }
          onBlur={() => setTouched("responsiblePersonPosition", true)}
          placeholder="Ej. Administradora General"
          className={getFieldClass(
            !!(
              errors.responsiblePersonPosition &&
              touched.responsiblePersonPosition
            )
          )}
        />
        {errors.responsiblePersonPosition &&
          touched.responsiblePersonPosition && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.responsiblePersonPosition}
            </p>
          )}
      </div>
    </div>
  </div>
);

// Paso 5: Información del Condominio
const CondominiumInfoStep: React.FC<StepProps> = ({
  currentData,
  updateField,
  errors,
  touched,
  setTouched,
}) => (
  <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
      Información del Condominio
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Ingrese la información básica sobre el condominio a administrar.
    </p>

    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mb-4">
      <p className="text-blue-800 dark:text-blue-300 text-sm">
        Esta información es esencial para configurar correctamente su cuenta en
        EstateAdmin.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4">
      <div>
        <label
          htmlFor="condominiumInfo.name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <HomeModernIcon className="h-4 w-4 text-indigo-500" />
            Nombre del Condominio*
          </span>
        </label>
        <input
          type="text"
          id="condominiumInfo.name"
          name="condominiumInfo.name"
          value={currentData.condominiumInfo?.name || ""}
          onChange={(e) => updateField("condominiumInfo.name", e.target.value)}
          onBlur={() => setTouched("condominiumInfo.name", true)}
          placeholder="Ej. Residencial Los Encinos"
          className={getFieldClass(
            !!(errors["condominiumInfo.name"] && touched["condominiumInfo.name"])
          )}
        />
        {errors["condominiumInfo.name"] && touched["condominiumInfo.name"] && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors["condominiumInfo.name"]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="condominiumInfo.address"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 text-indigo-500" />
            Dirección del Condominio*
          </span>
        </label>
        <textarea
          id="condominiumInfo.address"
          name="condominiumInfo.address"
          rows={3}
          value={currentData.condominiumInfo?.address || ""}
          onChange={(e) =>
            updateField("condominiumInfo.address", e.target.value)
          }
          onBlur={() => setTouched("condominiumInfo.address", true)}
          placeholder="Ej. Av. Principal 123, Col. Centro, Monterrey, NL"
          className={getFieldClass(
            !!(
              errors["condominiumInfo.address"] &&
              touched["condominiumInfo.address"]
            )
          )}
        />
        {errors["condominiumInfo.address"] &&
          touched["condominiumInfo.address"] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors["condominiumInfo.address"]}
            </p>
          )}
      </div>

      {/* <div>
        <label
          htmlFor="photoURL"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          URL de la Foto del Condominio (Opcional)
        </label>
        <input
          type="url"
          id="photoURL"
          name="photoURL"
          value={currentData.photoURL || ""}
          onChange={(e) => updateField("photoURL", e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="https://ejemplo.com/imagen.jpg"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Puede proporcionar una URL de imagen que represente al condominio para
          personalizar su cuenta.
        </p>
      </div> */}
    </div>
  </div>
);

// Paso 6: Selección de Plan
const AdditionalConfigStep: React.FC<StepProps> = ({
  currentData,
  updateField,
}) => {
  // Establecer billingFrequency como monthly por defecto
  useEffect(() => {
    if (!currentData.billingFrequency) {
      updateField("billingFrequency", "monthly");
    }
  }, [currentData.billingFrequency, updateField]);

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 md:p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
        Selección de Plan{" "}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Elija el plan que mejor se adapte a las necesidades de su condominio.
      </p>

      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md mb-6">
        <p className="text-indigo-800 dark:text-indigo-300 text-sm">
          <strong>Nota:</strong> Todos los planes incluyen acceso a todas las
          funciones: proyectos, inventario, sistema de gestión de mantenimiento
          y más.
        </p>
      </div>

      {/* Cards de planes */}
      <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.value}
            className={`relative overflow-hidden border rounded-xl transition-all ${
              currentData.plan === plan.value
                ? "border-indigo-600 ring-2 ring-indigo-500 shadow-lg shadow-indigo-100/70 dark:shadow-none"
                : "border-gray-200 dark:border-gray-700"
            } ${
              plan.highlighted && currentData.plan !== plan.value
                ? "bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/40 dark:to-gray-800"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 right-0">
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-bl-lg rounded-tr-lg">
                  Recomendado
                </div>
              </div>
            )}

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.label}
              </h3>
              <p className="mt-1 text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                {plan.price} <span className="text-sm">{plan.tax}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                {plan.range} condóminos/residentes
              </p>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => updateField("plan", plan.value)}
                  className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition ${
                    currentData.plan === plan.value
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {currentData.plan === plan.value
                    ? "Seleccionado"
                    : "Seleccionar"}
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Incluye:
                </p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-indigo-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Acceso a todas las funciones
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-indigo-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sistema de gestión de proyectos
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-indigo-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Control de inventario
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-indigo-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Gestión de mantenimiento
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <span className="text-indigo-600 text-sm dark:text-indigo-400">
          (Precio facturado mensualmente)
        </span>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md mt-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          <strong>Nota:</strong> Revisar cuidadosamente toda la información
          antes de enviar. Una vez enviada, nuestro equipo se pondrá en contacto
          con usted para completar el proceso.
        </p>
      </div>
    </div>
  );
};

// Componente principal del formulario
const NewCustomerInformationForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { checkFormExpiration, submitCustomerInfo } = useNewCustomerFormStore();

  // Estados locales
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<NewCustomerInfo>>({
    condominiumInfo: { name: "", address: "" },
    plan: "Basic",
    billingFrequency: "monthly",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isFormExpired, setIsFormExpired] = useState(false);
  const [isCheckingExpiration, setIsCheckingExpiration] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Comprobar la expiración del formulario al cargar
  useEffect(() => {
    const checkExpiration = async () => {
      if (!formId) {
        setIsFormExpired(true);
        setIsCheckingExpiration(false);
        return;
      }

      setIsCheckingExpiration(true);
      try {
        const expirationData = await checkFormExpiration(formId);
        setIsFormExpired(expirationData.expired);

        if (expirationData.expired) {
          toast.error(
            "Este formulario ha expirado. Por favor, solicite un nuevo enlace."
          );
        }
      } catch (error) {
        console.error("Error al verificar expiración:", error);
        toast.error("Error al verificar el estado del formulario");
        setIsFormExpired(true);
      } finally {
        setIsCheckingExpiration(false);
      }
    };

    checkExpiration();
  }, [formId, checkFormExpiration]);

  // Manejar la actualización de campos del formulario
  const handleUpdateField = (field: string, value: any) => {
    // Para campos anidados como condominiumInfo
    if (field.includes(".")) {
      const [parent, child] = field.split(".");

      // Tratamiento específico para condominiumInfo
      if (parent === "condominiumInfo") {
        setFormData((prev) => ({
          ...prev,
          condominiumInfo: {
            ...(prev.condominiumInfo || { name: "", address: "" }),
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Limpiar error al editar el campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Marcar un campo como "tocado" para la validación
  const handleSetTouched = (field: string, isTouched: boolean) => {
    setTouched((prev) => ({
      ...prev,
      [field]: isTouched,
    }));
  };

  // Validar el paso actual
  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validaciones para cada paso
    switch (currentStep) {
      case 0: // Información personal
        if (!formData.name?.trim()) {
          newErrors.name = "El nombre es obligatorio";
          isValid = false;
        }
        if (!formData.lastName?.trim()) {
          newErrors.lastName = "El apellido es obligatorio";
          isValid = false;
        }
        if (!formData.email?.trim()) {
          newErrors.email = "El correo electrónico es obligatorio";
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email =
            "El correo electrónico debe tener un formato válido";
          isValid = false;
        }
        if (!formData.phoneNumber?.trim()) {
          newErrors.phoneNumber = "El número telefónico es obligatorio";
          isValid = false;
        }
        break;

      case 1: // Información de la empresa
        if (!formData.companyName?.trim()) {
          newErrors.companyName = "El nombre de la compañía es obligatorio";
          isValid = false;
        }
        if (!formData.businessName?.trim()) {
          newErrors.businessName = "El nombre comercial es obligatorio";
          isValid = false;
        }
        if (!formData.country?.trim()) {
          newErrors.country = "El país es obligatorio";
          isValid = false;
        }
        if (!formData.businessActivity?.trim()) {
          newErrors.businessActivity = "La actividad económica es obligatoria";
          isValid = false;
        }
        break;

      case 2: // Datos fiscales
        if (!formData.fullFiscalAddress?.trim()) {
          newErrors.fullFiscalAddress = "El domicilio fiscal es obligatorio";
          isValid = false;
        }
        if (!formData.RFC?.trim()) {
          newErrors.RFC = "El RFC es obligatorio";
          isValid = false;
        }
        if (!formData.taxRegime?.trim()) {
          newErrors.taxRegime = "El régimen fiscal es obligatorio";
          isValid = false;
        }
        break;

      case 3: // Información de responsable
        if (!formData.responsiblePersonName?.trim()) {
          newErrors.responsiblePersonName =
            "El nombre de la persona responsable es obligatorio";
          isValid = false;
        }
        if (!formData.responsiblePersonPosition?.trim()) {
          newErrors.responsiblePersonPosition =
            "El cargo de la persona responsable es obligatorio";
          isValid = false;
        }
        break;

      case 4: // Información del condominio
        if (!formData.condominiumInfo?.name?.trim()) {
          newErrors["condominiumInfo.name"] =
            "El nombre del condominio es obligatorio";
          isValid = false;
        }
        if (!formData.condominiumInfo?.address?.trim()) {
          newErrors["condominiumInfo.address"] =
            "La dirección del condominio es obligatoria";
          isValid = false;
        }
        break;

      case 5: // Selección de Plan
        // Todos los campos son opcionales o tienen valores predeterminados
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Obtener campos para el paso actual (para validación)
  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ["name", "lastName", "email", "phoneNumber"];
      case 1:
        return ["companyName", "businessName", "country", "businessActivity"];
      case 2:
        return ["fullFiscalAddress", "RFC", "taxRegime"];
      case 3:
        return ["responsiblePersonName", "responsiblePersonPosition"];
      case 4:
        return ["condominiumInfo.name", "condominiumInfo.address"];
      case 5:
        return ["plan", "billingFrequency", "photoURL"];
      default:
        return [];
    }
  };

  // Validar todos los campos (para envío final)
  const validateAllFields = (): boolean => {
    let allFieldsValid = true;
    const newErrors: FormErrors = {};

    // Validar campos obligatorios
    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "El apellido es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
      allFieldsValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico debe tener un formato válido";
      allFieldsValid = false;
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "El número telefónico es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.companyName?.trim()) {
      newErrors.companyName = "El nombre de la compañía es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.businessName?.trim()) {
      newErrors.businessName = "El nombre comercial es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.country?.trim()) {
      newErrors.country = "El país es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.businessActivity?.trim()) {
      newErrors.businessActivity = "La actividad económica es obligatoria";
      allFieldsValid = false;
    }

    if (!formData.fullFiscalAddress?.trim()) {
      newErrors.fullFiscalAddress = "El domicilio fiscal es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.RFC?.trim()) {
      newErrors.RFC = "El RFC es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.taxRegime?.trim()) {
      newErrors.taxRegime = "El régimen fiscal es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.responsiblePersonName?.trim()) {
      newErrors.responsiblePersonName =
        "El nombre de la persona responsable es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.responsiblePersonPosition?.trim()) {
      newErrors.responsiblePersonPosition =
        "El cargo de la persona responsable es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.condominiumInfo?.name?.trim()) {
      newErrors["condominiumInfo.name"] =
        "El nombre del condominio es obligatorio";
      allFieldsValid = false;
    }

    if (!formData.condominiumInfo?.address?.trim()) {
      newErrors["condominiumInfo.address"] =
        "La dirección del condominio es obligatoria";
      allFieldsValid = false;
    }

    setErrors(newErrors);

    // Marcar todos los campos como tocados para mostrar errores
    const newTouched: Record<string, boolean> = {};

    [
      "name",
      "lastName",
      "email",
      "phoneNumber",
      "companyName",
      "businessName",
      "country",
      "businessActivity",
      "fullFiscalAddress",
      "RFC",
      "taxRegime",
      "responsiblePersonName",
      "responsiblePersonPosition",
      "condominiumInfo.name",
      "condominiumInfo.address",
    ].forEach((field) => {
      newTouched[field] = true;
    });

    setTouched(newTouched);

    return allFieldsValid;
  };

  // Manejar navegación entre pasos
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    } else {
      // Marcar todos los campos del paso actual como tocados para mostrar errores
      const fieldsInCurrentStep = getFieldsForStep(currentStep);
      const newTouched = { ...touched };
      fieldsInCurrentStep.forEach((field) => {
        newTouched[field] = true;
      });
      setTouched(newTouched);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    // Validar todos los campos antes de enviar
    const allFieldsValid = validateAllFields();

    if (!allFieldsValid) {
      toast.error(
        "Por favor, complete todos los campos obligatorios antes de enviar"
      );
      return;
    }

    if (!formId) {
      toast.error("ID de formulario no válido");
      return;
    }

    setSubmitting(true);
    try {
      // Usar el formId de la URL directamente sin generar un nuevo recordId
      const dataToSubmit = {
        ...formData,
        recordId: formId, // Usar el formId de la URL como recordId
      } as NewCustomerInfo;

      const success = await submitCustomerInfo(formId, dataToSubmit);

      if (success) {
        navigate("/formulario-completado");
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      toast.error(
        "Error al enviar la información. Por favor, intente nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Renderizar contenido según el estado
  if (isCheckingExpiration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Verificando estado del formulario...
          </h2>
        </div>
      </div>
    );
  }

  if (isFormExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-amber-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Formulario Expirado
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Este enlace de formulario ha expirado o no es válido. Por favor,
            solicite un nuevo enlace a su representante de EstateAdmin.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Componente principal del formulario (cuando es válido)
  const progressPercentage = Math.round(
    ((currentStep + 1) / FORM_STEPS.length) * 100
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0e7ff_0%,_#ffffff_40%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#111827_60%,_#0b1220_100%)] py-10 px-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto ${currentStep === 5 ? "max-w-6xl" : "max-w-3xl"}`}
      >
        <div className="text-center mb-8">
          <h1 className="bg-gradient-to-r from-indigo-700 via-indigo-500 to-cyan-500 bg-clip-text text-transparent text-5xl font-extrabold mb-3">
            EstateAdmin
          </h1>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Información de Nuevo Cliente
          </h2>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Complete el formulario para iniciar su proceso de alta comercial
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-300">
                Progreso del Formulario
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paso {currentStep + 1} de {FORM_STEPS.length}:{" "}
                {FORM_STEPS[currentStep]}
              </p>
            </div>
            <div className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {progressPercentage}%
            </div>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>

          {/* Indicador de pasos */}
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
            {FORM_STEPS.map((step, index) => {
              const Icon = STEP_ICONS[index];
              const done = index < currentStep;
              const active = index === currentStep;
              return (
                <button
                  key={step}
                  onClick={() => done && setCurrentStep(index)}
                  disabled={!done}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${
                    active
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30"
                      : done
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 cursor-pointer"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 cursor-not-allowed"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      active
                        ? "text-indigo-600 dark:text-indigo-300"
                        : done
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium leading-tight ${
                      active
                        ? "text-indigo-700 dark:text-indigo-300"
                        : done
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenedor del formulario */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 shadow-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/80 to-cyan-50/60 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Información segura y confidencial
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4" />
                <span>Tiempo estimado: 6-8 minutos</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Renderizar el paso actual del formulario */}
                {currentStep === 0 && (
                  <PersonalInfoStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
                {currentStep === 1 && (
                  <CompanyInfoStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
                {currentStep === 2 && (
                  <FiscalInfoStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
                {currentStep === 3 && (
                  <ResponsiblePersonStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
                {currentStep === 4 && (
                  <CondominiumInfoStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
                {currentStep === 5 && (
                  <AdditionalConfigStep
                    currentData={formData}
                    updateField={handleUpdateField}
                    errors={errors}
                    touched={touched}
                    setTouched={handleSetTouched}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Botones de navegación */}
            <div className="mt-8 sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 ${
                  currentStep === 0
                    ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Anterior
              </button>

              {currentStep < FORM_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Siguiente
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="mr-2 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="mr-2 h-4 w-4" />
                      Enviar Información
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCustomerInformationForm;
