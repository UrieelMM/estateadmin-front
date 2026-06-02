import React, { useEffect, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";
import { CondominiumStatus } from "./NewClientForm";

interface CondominiumEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Constantes alineadas con el flujo de creación (NewClientForm y
// pestaña Agregar Condominio del ClientEditModal).
const PLAN_BASE = 499;
const COST_PER_UNIT = 4.0;
const MIN_UNITS = 20;
const MAX_UNITS = 500;
const IVA_RATE = 0.16;

const LEGACY_PLAN_NAMES = new Set( [
  "Basic",
  "Essential",
  "Professional",
  "Premium",
  "Free",
] );

// Convierte el plan legacy o el plan nuevo (string numérico) al número de
// unidades a mostrar en la calculadora. Para condominios viejos cuyo plan
// era "Basic"/"Professional"/etc., usamos su condominiumLimit como cantidad
// inicial de unidades, ajustando al rango permitido [MIN_UNITS, MAX_UNITS].
const resolveInitialUnits = ( plan?: string | number, condominiumLimit?: number | string ): number => {
  const rawPlan = String( plan ?? "" ).trim();
  const parsedFromPlan = parseInt( rawPlan, 10 );
  if ( !isNaN( parsedFromPlan ) && parsedFromPlan > 0 ) {
    return Math.min( MAX_UNITS, Math.max( MIN_UNITS, parsedFromPlan ) );
  }
  const parsedLimit = parseInt( String( condominiumLimit ?? "" ), 10 );
  if ( !isNaN( parsedLimit ) && parsedLimit > 0 ) {
    return Math.min( MAX_UNITS, Math.max( MIN_UNITS, parsedLimit ) );
  }
  return MIN_UNITS;
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

  // Cantidad de unidades a mostrar en la calculadora.
  // - Si el plan es un string numérico nuevo (e.g. "50"), úsalo.
  // - Si es legacy (Basic/Professional/...), cae a condominiumLimit.
  // Estos hooks deben llamarse incondicionalmente (rules of hooks), por lo que
  // se evalúan aunque currentCondominium aún no esté disponible.
  const units = useMemo(
    () =>
      resolveInitialUnits(
        currentCondominium?.plan,
        currentCondominium?.condominiumLimit
      ),
    [ currentCondominium?.plan, currentCondominium?.condominiumLimit ]
  );

  // Si el documento todavía tiene un plan legacy ("Basic", "Essential", etc.)
  // o un plan inválido, normalizamos a string numérico (units) en el state
  // local apenas se monta el modal, para evitar enviar "Basic" al guardar.
  useEffect( () => {
    if ( !currentCondominium ) return;
    const rawPlan = String( currentCondominium.plan ?? "" ).trim();
    const parsedFromPlan = parseInt( rawPlan, 10 );
    const isNumericPlan = !isNaN( parsedFromPlan ) && parsedFromPlan > 0;
    const isLegacyPlan = LEGACY_PLAN_NAMES.has( rawPlan );

    if ( !isNumericPlan || isLegacyPlan ) {
      const normalizedPlan = String( units );
      if ( rawPlan !== normalizedPlan ) {
        updateCondominiumForm( "plan", normalizedPlan );
      }
      if ( Number( currentCondominium.condominiumLimit ) !== units ) {
        updateCondominiumForm( "condominiumLimit", units );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ currentCondominium?.id ] );

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

  const subtotal = PLAN_BASE + units * COST_PER_UNIT;
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;
  const sliderPct = ( ( units - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100;
  const fmt = ( v: number ) =>
    v.toLocaleString( "es-MX", { style: "currency", currency: "MXN" } );

  const handleUnitsChange = ( rawValue: string | number ) => {
    const parsed =
      typeof rawValue === "number" ? rawValue : parseInt( rawValue, 10 );
    const safe = isNaN( parsed ) ? MIN_UNITS : parsed;
    const clamped = Math.min( MAX_UNITS, Math.max( MIN_UNITS, safe ) );
    updateCondominiumForm( "plan", String( clamped ) );
    updateCondominiumForm( "condominiumLimit", clamped );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    updateCondominiumForm(e.target.name, e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === "hasMaintenanceApp") {
      updateCondominiumForm("hasMaintenanceApp", checked);
      updateCondominiumForm(
        "maintenanceAppContractedAt",
        checked
          ? currentCondominium.maintenanceAppContractedAt ||
              new Date().toISOString()
          : null
      );
      return;
    }

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

          {/* Calculadora de unidades contratadas (alineada con creación de
              condominios y registro de cliente nuevo) */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
              Unidades contratadas
            </p>
            <div className="text-center mb-3">
              <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                { units }
              </span>
              <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                unidades
              </span>
            </div>
            <input
              type="range"
              min={ MIN_UNITS }
              max={ MAX_UNITS }
              value={ units }
              onChange={ ( e ) => handleUnitsChange( e.target.value ) }
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-1"
              style={ {
                background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${ sliderPct }%, #e5e7eb ${ sliderPct }%, #e5e7eb 100%)`,
              } }
            />
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>{ MIN_UNITS }</span>
              <span>{ MAX_UNITS }</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                O ingresa:
              </label>
              <input
                type="number"
                min={ MIN_UNITS }
                max={ MAX_UNITS }
                value={ units }
                onChange={ ( e ) => handleUnitsChange( e.target.value ) }
                className="w-16 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-700 text-center font-bold text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <span className="text-xs text-gray-500">unidades</span>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Plataforma base</span>
                <span className="font-medium">{ fmt( PLAN_BASE ) }</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{ units } uds. × { fmt( COST_PER_UNIT ) }</span>
                <span className="font-medium">
                  { fmt( units * COST_PER_UNIT ) }
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                <span>IVA (16%)</span>
                <span className="font-medium">{ fmt( iva ) }</span>
              </div>
              <div className="flex justify-between border-t-2 border-indigo-200 dark:border-indigo-700 pt-1.5">
                <span className="font-bold text-gray-900 dark:text-white">
                  Total / mes
                </span>
                <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  { fmt( total ) }
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              App de Mantenimiento
            </h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasMaintenanceApp"
                name="hasMaintenanceApp"
                checked={currentCondominium.hasMaintenanceApp || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hasMaintenanceApp"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Este condominio contrató la App de Mantenimiento
              </label>
            </div>
            {currentCondominium.hasMaintenanceApp &&
              currentCondominium.maintenanceAppContractedAt && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Fecha de contratación registrada:{" "}
                  {new Date(
                    currentCondominium.maintenanceAppContractedAt
                  ).toLocaleString("es-MX")}
                </p>
              )}
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
