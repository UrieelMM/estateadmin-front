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

// Constantes de precios por unidad
const PLAN_BASE = 499;
const COST_PER_UNIT = 4.0;
const MIN_UNITS = 20;
const MAX_UNITS = 500;
const IVA_RATE = 0.16;

const ClientEditModal: React.FC<ClientEditModalProps> = ( {
  isOpen,
  onClose,
  onSuccess,
} ) => {
  const {
    currentClient,
    condominiumForm,
    loading,
    addingCondominium,
    updateClientForm,
    updateCondominiumForm,
    submitClientEdit,
    createCondominium,
    assignRescueCoupon,
    syncAdminCondominiums,
  } = useClientsConfig();

  const [ activeTab, setActiveTab ] = useState<"edit" | "addCondominium">( "edit" );
  // State local del input de "cupón de rescate" en la pestaña Editar Cliente.
  const [ rescueCouponInput, setRescueCouponInput ] = useState<string>( "" );
  const [ assigningRescueCoupon, setAssigningRescueCoupon ] = useState<boolean>(
    false,
  );
  const [ syncingAdmins, setSyncingAdmins ] = useState<boolean>( false );

  const handleSyncAdminCondominiums = async () => {
    setSyncingAdmins( true );
    try {
      await syncAdminCondominiums();
    } finally {
      setSyncingAdmins( false );
    }
  };

  const generateCoupon = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let coupon = "GIFT";
    for ( let i = 0; i < 8; i++ ) {
      coupon += chars.charAt( Math.floor( Math.random() * chars.length ) );
    }
    updateCondominiumForm( "coupon", coupon );
  };

  // Genera un cupón aleatorio en el input de rescate (no se guarda hasta
  // que el super admin lo confirma con el botón "Asignar cupón").
  const generateRescueCoupon = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let coupon = "RESC";
    for ( let i = 0; i < 8; i++ ) {
      coupon += chars.charAt( Math.floor( Math.random() * chars.length ) );
    }
    setRescueCouponInput( coupon );
  };

  const handleAssignRescueCoupon = async () => {
    const normalized = rescueCouponInput.trim().toUpperCase();
    if ( normalized.length < 8 ) {
      return; // El backend y el store también validan.
    }
    setAssigningRescueCoupon( true );
    try {
      const success = await assignRescueCoupon( { coupon: normalized } );
      if ( success ) {
        setRescueCouponInput( "" );
      }
    } finally {
      setAssigningRescueCoupon( false );
    }
  };

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
    [ CondominiumStatus.Pending ]: "Pendiente",
    [ CondominiumStatus.Active ]: "Activo",
    [ CondominiumStatus.Inactive ]: "Inactivo",
    [ CondominiumStatus.Blocked ]: "Bloqueado",
  };

  if ( !isOpen || !currentClient ) return null;

  // Ensure we have an ID to edit
  if ( !currentClient.id ) {
    console.error( "Error: Attempting to edit a client without an ID" );
    onClose();
    return null;
  }

  const editUnits = parseInt( String( currentClient.plan ) ) || MIN_UNITS;
  const editSubtotal = PLAN_BASE + editUnits * COST_PER_UNIT;
  const editIva = editSubtotal * IVA_RATE;
  const editTotal = editSubtotal + editIva;
  const editSliderPct = ( ( editUnits - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100;

  const condoUnits = parseInt( String( condominiumForm.plan ) ) || MIN_UNITS;
  const condoSubtotal = PLAN_BASE + condoUnits * COST_PER_UNIT;
  const condoIva = condoSubtotal * IVA_RATE;
  const condoTotal = condoSubtotal + condoIva;
  const condoSliderPct = ( ( condoUnits - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100;

  const fmt = ( v: number ) => v.toLocaleString( "es-MX", { style: "currency", currency: "MXN" } );
  const maintenanceDateLabel = condominiumForm.maintenanceAppContractedAt
    ? new Date( condominiumForm.maintenanceAppContractedAt ).toLocaleString( "es-MX" )
    : null;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    updateClientForm( e.target.name, e.target.value );
  };

  const handleCondominiumInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    updateCondominiumForm( e.target.name, e.target.value );
  };

  const handleCheckboxChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    const { name, checked } = e.target;
    const currentProFunctions = condominiumForm.proFunctions || [];

    if ( name === "hasMaintenanceApp" ) {
      updateCondominiumForm( "hasMaintenanceApp", checked );
      updateCondominiumForm(
        "maintenanceAppContractedAt",
        checked
          ? condominiumForm.maintenanceAppContractedAt || new Date().toISOString()
          : null
      );
      return;
    }

    if ( checked ) {
      // Añadir la función al array si no está ya
      if ( !currentProFunctions.includes( name ) ) {
        updateCondominiumForm( "proFunctions", [ ...currentProFunctions, name ] );
      }
    } else {
      // Eliminar la función del array
      updateCondominiumForm(
        "proFunctions",
        currentProFunctions.filter( ( fn ) => fn !== name )
      );
    }
  };

  const handleSubmitClientEdit = async ( e: React.FormEvent ) => {
    e.preventDefault();
    try {
      const success = await submitClientEdit();
      if ( success ) {
        onClose();
        onSuccess();
      }
    } catch ( error ) {
      console.error( "Error al actualizar cliente:", error );
    }
  };

  const handleSubmitNewCondominium = async ( e: React.FormEvent ) => {
    e.preventDefault();

    try {
      const success = await createCondominium();
      if ( success ) {
        onSuccess(); // Recargar datos desde el componente padre
      }
    } catch ( error ) {
      console.error( "Error al crear condominio:", error );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            { activeTab === "edit" ? "Editar Cliente" : "Agregar Condominio" }
          </h3>
          <button
            onClick={ onClose }
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs de navegación */ }
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={ () => setActiveTab( "edit" ) }
            className={ `px-4 py-2 text-sm font-medium ${ activeTab === "edit"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }` }
          >
            Editar Cliente
          </button>
          <button
            onClick={ () => setActiveTab( "addCondominium" ) }
            className={ `px-4 py-2 text-sm font-medium ${ activeTab === "addCondominium"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }` }
          >
            Agregar Condominio
          </button>
        </div>

        {/* Contenido de las pestañas */ }
        { activeTab === "edit" ? (
          <form onSubmit={ handleSubmitClientEdit } className="px-6 py-4">
            <div className="space-y-4">
              {/* Datos de la empresa */ }
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
                  value={ currentClient.companyName }
                  onChange={ handleInputChange }
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
                  value={ currentClient.businessName || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.email }
                  onChange={ handleInputChange }
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
                  value={ currentClient.phoneNumber || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.RFC }
                  onChange={ handleInputChange }
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
                  value={ currentClient.fullFiscalAddress || "" }
                  onChange={ handleInputChange }
                  rows={ 2 }
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="CP"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Código Postal (CP)
                </label>
                <input
                  type="text"
                  name="CP"
                  id="CP"
                  value={ currentClient.CP || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.address || "" }
                  onChange={ handleInputChange }
                  rows={ 2 }
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
                  value={ currentClient.country }
                  onChange={ handleInputChange }
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="">Seleccione un país</option>
                  { countriesList.map( ( country: string ) => (
                    <option key={ country } value={ country }>
                      { country }
                    </option>
                  ) ) }
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
                  value={ currentClient.taxRegime || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.businessActivity || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.cfdiUse || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.responsiblePersonName || "" }
                  onChange={ handleInputChange }
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
                  value={ currentClient.responsiblePersonPosition || "" }
                  onChange={ handleInputChange }
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="condominiumManager"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre del Administrador del Condominio*
                </label>
                <input
                  type="text"
                  name="condominiumManager"
                  id="condominiumManager"
                  value={ currentClient.condominiumManager || "" }
                  onChange={ handleInputChange }
                  required
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              {/* Sección de unidades contratadas */ }
              <h4 className="text-md font-medium mb-3 mt-4 text-gray-800 dark:text-gray-200 border-b pb-1">
                Unidades Contratadas
              </h4>

              {/* Calculadora compacta */ }
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4">
                <div className="text-center mb-3">
                  <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    { editUnits }
                  </span>
                  <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">unidades</span>
                </div>
                <input
                  type="range"
                  min={ MIN_UNITS }
                  max={ MAX_UNITS }
                  value={ editUnits }
                  onChange={ ( e ) => {
                    const v = Number( e.target.value );
                    const sub = PLAN_BASE + v * COST_PER_UNIT;
                    const tot = Math.round( sub * ( 1 + IVA_RATE ) * 100 ) / 100;
                    updateClientForm( "plan", String( v ) );
                    updateClientForm( "pricing", tot );
                    updateClientForm( "condominiumLimit", v );
                  } }
                  className="w-full h-2 rounded-full appearance-none cursor-pointer mb-1"
                  style={ { background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${ editSliderPct }%, #e5e7eb ${ editSliderPct }%, #e5e7eb 100%)` } }
                />
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>{ MIN_UNITS }</span><span>{ MAX_UNITS }</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">O ingresa:</label>
                  <input
                    type="number"
                    min={ MIN_UNITS }
                    max={ MAX_UNITS }
                    value={ editUnits }
                    onChange={ ( e ) => {
                      const v = Math.min( MAX_UNITS, Math.max( MIN_UNITS, parseInt( e.target.value ) || MIN_UNITS ) );
                      const sub = PLAN_BASE + v * COST_PER_UNIT;
                      const tot = Math.round( sub * ( 1 + IVA_RATE ) * 100 ) / 100;
                      updateClientForm( "plan", String( v ) );
                      updateClientForm( "pricing", tot );
                      updateClientForm( "condominiumLimit", v );
                    } }
                    className="w-16 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-700 text-center font-bold text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">unidades</span>
                </div>
                {/* Precio */ }
                <div className="rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Plataforma base</span>
                    <span className="font-medium">{ fmt( PLAN_BASE ) }</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{ editUnits } uds. × { fmt( COST_PER_UNIT ) }</span>
                    <span className="font-medium">{ fmt( editUnits * COST_PER_UNIT ) }</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                    <span>IVA (16%)</span>
                    <span className="font-medium">{ fmt( editIva ) }</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-indigo-200 dark:border-indigo-700 pt-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">Total / mes</span>
                    <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{ fmt( editTotal ) }</span>
                  </div>
                </div>
              </div>

              {/* Frecuencia de facturación — va DESPUÉS del bloque de unidades */ }
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
                  value={ currentClient.billingFrequency || "monthly" }
                  onChange={ handleInputChange }
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="biannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>

              {/* === Cupón de rescate ====================================
                  Solo aplica para clientes que NO han pagado su primera
                  factura y NO tienen ya un bypass o cupón redimido. Se usa
                  para "rescatar" cuentas creadas antes de la implementación
                  de cupones o cuando el admin nunca completó el pago inicial.
                  ========================================================== */ }
              { ( () => {
                const existingCoupon = String(
                  currentClient.coupon || "",
                ).toUpperCase();
                const existingStatus = String(
                  currentClient.couponStatus || "",
                ).toLowerCase();
                const isRedeemed = existingStatus === "redeemed";
                const isAlreadyBypassed = Boolean(
                  currentClient.initialSetupPaymentBypassed,
                );

                return (
                  <div className="mt-6 rounded-xl border border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                        Caso de rescate
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                      Cupón de rescate (pago inicial no realizado)
                    </h4>
                    <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                      Úsalo solo cuando el cliente <strong>se quedó atorado en el
                      paso de pago inicial</strong> (no pagó su primera factura) o
                      fue creado antes de que existiera el flujo de cupones. El
                      administrador del condominio podrá redimirlo desde su
                      dashboard para condonar la factura de suscripción inicial.
                    </p>

                    {/* Estado actual del cupón a nivel cliente */ }
                    { isAlreadyBypassed ? (
                      <div className="mt-3 rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 px-3 py-2 text-xs text-green-900 dark:text-green-100">
                        Este cliente ya tiene el pago inicial condonado. No es
                        necesario asignar un cupón de rescate.
                      </div>
                    ) : isRedeemed && existingCoupon ? (
                      <div className="mt-3 rounded-md bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 px-3 py-2 text-xs text-blue-900 dark:text-blue-100">
                        Este cliente ya redimió un cupón anteriormente
                        (<span className="font-mono font-semibold">{ existingCoupon }</span>).
                        Si necesitas asignar uno nuevo, revisa el caso manualmente.
                      </div>
                    ) : existingCoupon ? (
                      <div className="mt-3 rounded-md bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-gray-800 dark:text-gray-200">
                        Cupón activo actual:{ " " }
                        <span className="font-mono font-semibold text-amber-800 dark:text-amber-200">
                          { existingCoupon }
                        </span>
                        . Puedes reemplazarlo asignando uno nuevo abajo.
                      </div>
                    ) : null }

                    {/* Input + acciones — se ocultan si ya hay bypass */ }
                    { !isAlreadyBypassed && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={ rescueCouponInput }
                          onChange={ ( e ) =>
                            setRescueCouponInput(
                              e.target.value.toUpperCase().trim(),
                            )
                          }
                          minLength={ 8 }
                          placeholder="Mínimo 8 caracteres"
                          className="min-w-0 flex-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <button
                          type="button"
                          onClick={ generateRescueCoupon }
                          className="px-3 h-[38px] rounded-lg border border-amber-300 bg-amber-50 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
                        >
                          Generar
                        </button>
                        <button
                          type="button"
                          onClick={ handleAssignRescueCoupon }
                          disabled={
                            assigningRescueCoupon ||
                            rescueCouponInput.trim().length < 8
                          }
                          className="px-3 h-[38px] rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                        >
                          { assigningRescueCoupon
                            ? "Asignando..."
                            : "Asignar cupón" }
                        </button>
                      </div>
                    ) }
                  </div>
                );
              } )() }

              {/* === Sincronización de permisos de administradores ============
                  Se usa para regularizar clientes creados antes del fix de
                  propagación automática. Cuando se agrega un condominio nuevo
                  a un cliente existente, el doc del administrador no recibía
                  el nuevo UID en `condominiumUids`, por lo que el ComboBox
                  del navbar mostraba solo el primer condominio.
                  ============================================================ */ }
              <div className="mt-6 rounded-xl border border-sky-300 dark:border-sky-700 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100">
                    Mantenimiento
                  </span>
                </div>
                <h4 className="text-sm font-bold text-sky-900 dark:text-sky-100">
                  Sincronizar permisos de administradores
                </h4>
                <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-100/80">
                  Úsalo si el administrador de este cliente <strong>no ve todos
                  sus condominios</strong> en el selector del navbar. Recorre
                  todos los condominios del cliente y se asegura de que los
                  usuarios con rol <em>admin</em> tengan acceso a cada uno. Es
                  seguro re-ejecutarlo (es idempotente).
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={ handleSyncAdminCondominiums }
                    disabled={ syncingAdmins }
                    className="px-3 h-[38px] rounded-lg bg-sky-600 hover:bg-sky-700 text-sm font-semibold text-white disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
                  >
                    { syncingAdmins
                      ? "Sincronizando..."
                      : "Sincronizar ahora" }
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={ onClose }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ loading }
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                { loading ? (
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
                ) }
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={ handleSubmitNewCondominium } className="px-6 py-4">
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
                  value={ condominiumForm.name }
                  onChange={ handleCondominiumInputChange }
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
                  rows={ 3 }
                  value={ condominiumForm.address }
                  onChange={ handleCondominiumInputChange }
                  required
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="condominiumManager"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre del Administrador del Condominio*
                </label>
                <input
                  type="text"
                  name="condominiumManager"
                  id="condominiumManager"
                  value={ condominiumForm.condominiumManager || "" }
                  onChange={ handleCondominiumInputChange }
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
                  value={ condominiumForm.status || CondominiumStatus.Pending }
                  onChange={ handleCondominiumInputChange }
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  { Object.values( CondominiumStatus ).map( ( status ) => (
                    <option key={ status } value={ status }>
                      { statusLabels[ status ] }
                    </option>
                  ) ) }
                </select>
              </div>

              {/* Calculadora de unidades para nuevo condominio */ }
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Unidades contratadas</p>
                <div className="text-center mb-3">
                  <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{ condoUnits }</span>
                  <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">unidades</span>
                </div>
                <input
                  type="range"
                  min={ MIN_UNITS }
                  max={ MAX_UNITS }
                  value={ condoUnits }
                  onChange={ ( e ) => {
                    updateCondominiumForm( "plan", e.target.value );
                    updateCondominiumForm( "condominiumLimit", Number( e.target.value ) );
                  } }
                  className="w-full h-2 rounded-full appearance-none cursor-pointer mb-1"
                  style={ { background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${ condoSliderPct }%, #e5e7eb ${ condoSliderPct }%, #e5e7eb 100%)` } }
                />
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>{ MIN_UNITS }</span><span>{ MAX_UNITS }</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">O ingresa:</label>
                  <input
                    type="number"
                    min={ MIN_UNITS }
                    max={ MAX_UNITS }
                    value={ condoUnits }
                    onChange={ ( e ) => {
                      const v = Math.min( MAX_UNITS, Math.max( MIN_UNITS, parseInt( e.target.value ) || MIN_UNITS ) );
                      updateCondominiumForm( "plan", String( v ) );
                      updateCondominiumForm( "condominiumLimit", v );
                    } }
                    className="w-16 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-700 text-center font-bold text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">unidades</span>
                </div>
                {/* Precio */ }
                <div className="rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Plataforma base</span>
                    <span className="font-medium">{ fmt( PLAN_BASE ) }</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{ condoUnits } uds. × { fmt( COST_PER_UNIT ) }</span>
                    <span className="font-medium">{ fmt( condoUnits * COST_PER_UNIT ) }</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                    <span>IVA (16%)</span>
                    <span className="font-medium">{ fmt( condoIva ) }</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-indigo-200 dark:border-indigo-700 pt-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">Total / mes</span>
                    <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{ fmt( condoTotal ) }</span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="proFunctions"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Funciones Pro
                </label>
                <div className="mt-2 space-y-2">
                  { proFunctionOptions.map( ( option ) => (
                    <div key={ option } className="flex items-center">
                      <input
                        type="checkbox"
                        id={ option }
                        name={ option }
                        checked={
                          condominiumForm.proFunctions?.includes( option ) ||
                          false
                        }
                        onChange={ handleCheckboxChange }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={ option }
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        { proFunctionLabels[ option ] }
                      </label>
                    </div>
                  ) ) }
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
                  App de Mantenimiento
                </h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasMaintenanceApp"
                    name="hasMaintenanceApp"
                    checked={ condominiumForm.hasMaintenanceApp || false }
                    onChange={ handleCheckboxChange }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="hasMaintenanceApp"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Este condominio contrató la App de Mantenimiento
                  </label>
                </div>
                { maintenanceDateLabel && ( condominiumForm.hasMaintenanceApp || false ) && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Fecha de contratación registrada: { maintenanceDateLabel }
                  </p>
                ) }
              </div>

              <div>
                <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 border-b pb-1">
                  Cupón de regalo
                </h4>
                <label
                  htmlFor="coupon"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cupón (opcional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <input
                    type="text"
                    name="coupon"
                    id="coupon"
                    value={ condominiumForm.coupon || "" }
                    onChange={ ( e ) =>
                      updateCondominiumForm(
                        "coupon",
                        e.target.value.toUpperCase().trim()
                      )
                    }
                    minLength={ 8 }
                    placeholder="Opcional, mínimo 8 caracteres"
                    className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={ generateCoupon }
                    className="px-3 h-[38px] rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    Generar
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Si se asigna un cupón, el administrador del condominio podrá
                  redimirlo desde su dashboard para condonar la primera factura
                  de suscripción.
                </p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  El condominio será creado para el cliente:{ " " }
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    { currentClient.companyName }
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={ onClose }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ addingCondominium }
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                { addingCondominium ? (
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
                ) }
              </button>
            </div>
          </form>
        ) }
      </div>
    </div>
  );
};

export default ClientEditModal;
