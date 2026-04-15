import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
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
  onSubmit: ( data: any ) => Promise<{
    success: boolean;
    credentials?: { email: string; password: string; };
  }>;
}

// Tipo de frecuencia de facturación
type BillingFrequency = "monthly" | "quarterly" | "biannual" | "annual";

// Constantes de precios por unidad
const PLAN_BASE = 499;
const COST_PER_UNIT = 4.0;
const MIN_UNITS = 30;
const MAX_UNITS = 500;
const IVA_RATE = 0.16;

const NewClientForm: React.FC<NewClientFormProps> = ( {
  isOpen,
  onClose,
  onSubmit,
} ) => {
  const { creatingClient } = useSuperAdminStore();

  const [ formData, setFormData ] = useState( {
    // Campos obligatorios
    name: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    companyName: "",
    fullFiscalAddress: "",
    CP: "",
    RFC: "",
    country: "",
    businessName: "",
    taxRegime: "",
    businessActivity: "",
    responsiblePersonName: "",
    responsiblePersonPosition: "",

    currency: "MXN",
    language: "es-MX",
    condominiumInfo: {
      name: "",
      address: "",
      status: CondominiumStatus.Pending,
      hasMaintenanceApp: false,
      maintenanceAppContractedAt: null as string | null,
    },
    condominiumManager: "",

    // Campos opcionales con valores predeterminados
    photoURL: "",
    plan: "50", // Número de unidades contratadas
    pricing: Math.round( ( PLAN_BASE + 50 * COST_PER_UNIT ) * ( 1 + IVA_RATE ) * 100 ) / 100,
    proFunctions: [] as string[],
    cfdiUse: "G03",
    serviceStartDate: new Date(),
    billingFrequency: "monthly" as BillingFrequency,
    termsAccepted: true,
    address: "", // Mantenido por compatibilidad
    condominiumLimit: 50,
  } );

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
    [ CondominiumStatus.Pending ]: "Pendiente",
    [ CondominiumStatus.Active ]: "Activo",
    [ CondominiumStatus.Inactive ]: "Inactivo",
    [ CondominiumStatus.Blocked ]: "Bloqueado",
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

  const [ selectAll, setSelectAll ] = useState( false );
  const [ showCredentials, setShowCredentials ] = useState( false );
  const [ credentials, setCredentials ] = useState( {
    email: "",
    password: "",
  } );
  const [ formError, setFormError ] = useState( "" );

  useEffect( () => {
    if ( selectAll ) {
      setFormData( ( prev ) => ( {
        ...prev,
        proFunctions: [ ...proFunctionOptions ],
      } ) );
    } else if ( formData.proFunctions.length === proFunctionOptions.length ) {
      setFormData( ( prev ) => ( {
        ...prev,
        proFunctions: [],
      } ) );
    }
  }, [ selectAll ] );

  useEffect( () => {
    if ( formData.proFunctions.length === proFunctionOptions.length ) {
      setSelectAll( true );
    } else if (
      selectAll &&
      formData.proFunctions.length < proFunctionOptions.length
    ) {
      setSelectAll( false );
    }
  }, [ formData.proFunctions ] );

  // Sincronizar condominiumLimit y pricing con el número de unidades (plan)
  useEffect( () => {
    const units = parseInt( formData.plan );
    if ( !isNaN( units ) ) {
      const sub = PLAN_BASE + units * COST_PER_UNIT;
      const total = Math.round( sub * ( 1 + IVA_RATE ) * 100 ) / 100;
      setFormData( ( prev ) => ( {
        ...prev,
        condominiumLimit: units,
        pricing: total,
      } ) );
    }
  }, [ formData.plan ] );

  // Sincronizar moneda e idioma cuando se cambie el país
  useEffect( () => {
    const selectedCountryOption = countryOptions.find(
      ( option ) => option.country === formData.country
    );
    if ( selectedCountryOption ) {
      setFormData( ( prev ) => ( {
        ...prev,
        currency: selectedCountryOption.currency,
        language: selectedCountryOption.language,
      } ) );
    }
  }, [ formData.country ] );

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for ( let i = 0; i < 8; i++ ) {
      password += chars.charAt( Math.floor( Math.random() * chars.length ) );
    }
    return password;
  };

  const copyToClipboard = async ( text: string, label: string ) => {
    try {
      await navigator.clipboard.writeText( text );
      toast.success( `${ label } copiado` );
    } catch ( _error ) {
      toast.error( `No se pudo copiar ${ label.toLowerCase() }` );
    }
  };

  const handleSubmit = async ( e: React.FormEvent ) => {
    e.preventDefault();
    setFormError( "" );

    // Validar que todos los campos obligatorios estén llenos
    const requiredFields = [
      "email",
      "name",
      "lastName",
      "phoneNumber",
      "companyName",
      "fullFiscalAddress",
      "CP",
      "RFC",
      "country",
      "businessName",
      "taxRegime",
      "businessActivity",
      "responsiblePersonName",
      "responsiblePersonPosition",
      "currency",
      "language",
      "condominiumManager",
    ];

    const missingFields = requiredFields.filter(
      ( field ) => !formData[ field as keyof typeof formData ]
    );

    if ( missingFields.length > 0 ) {
      setFormError(
        "Completa todos los campos obligatorios antes de crear el cliente."
      );
      return;
    }

    // Validar número de unidades
    const units = parseInt( formData.plan );
    if ( isNaN( units ) || units < MIN_UNITS || units > MAX_UNITS ) {
      setFormError(
        `El número de unidades debe estar entre ${ MIN_UNITS } y ${ MAX_UNITS }.`
      );
      return;
    }

    // Validar información del condominio
    if ( !formData.condominiumInfo.name || !formData.condominiumInfo.address ) {
      setFormError( "Completa la información del primer condominio." );
      return;
    }

    // Validar currency y language del cliente
    if ( !formData.currency || !formData.language ) {
      setFormError( "Selecciona país, idioma y moneda válidos." );
      return;
    }

    if ( !formData.termsAccepted ) {
      setFormError( "Debes aceptar los términos y condiciones para continuar." );
      return;
    }

    const password = generatePassword();
    const submitData = {
      ...formData,
      password,
    };

    try {
      const result = await onSubmit( submitData );

      if ( result.success ) {
        // Si la API devuelve las credenciales, usarlas
        if ( result.credentials ) {
          setCredentials( result.credentials );
        } else {
          // Si no, usar las generadas localmente
          setCredentials( {
            email: formData.email,
            password,
          } );
        }
        setShowCredentials( true );
        setFormError( "" );
      }
    } catch ( error ) {
      console.error( "Error al crear cliente:", error );
      setFormError( "No se pudo crear el cliente. Intenta nuevamente." );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if ( formError ) setFormError( "" );
    const { name, value } = e.target;
    if ( name.startsWith( "condominiumInfo." ) ) {
      const field = name.split( "." )[ 1 ];
      setFormData( ( prev ) => ( {
        ...prev,
        condominiumInfo: {
          ...prev.condominiumInfo,
          [ field ]: value,
        },
      } ) );
    } else if ( name === "condominiumLimit" ) {
      // Convertir a número
      const numValue = parseInt( value );
      if ( !isNaN( numValue ) ) {
        setFormData( ( prev ) => ( {
          ...prev,
          [ name ]: numValue,
        } ) );
      }
    } else {
      setFormData( ( prev ) => ( {
        ...prev,
        [ name ]: value,
      } ) );
    }
  };

  const handleCheckboxChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    if ( formError ) setFormError( "" );
    const { name, checked } = e.target;

    if ( name === "selectAll" ) {
      setSelectAll( checked );
      return;
    }

    if ( name === "termsAccepted" ) {
      setFormData( ( prev ) => ( {
        ...prev,
        termsAccepted: checked,
      } ) );
      return;
    }

    if ( name === "hasMaintenanceApp" ) {
      setFormData( ( prev ) => ( {
        ...prev,
        condominiumInfo: {
          ...prev.condominiumInfo,
          hasMaintenanceApp: checked,
          maintenanceAppContractedAt: checked
            ? prev.condominiumInfo.maintenanceAppContractedAt ||
            new Date().toISOString()
            : null,
        },
      } ) );
      return;
    }

    setFormData( ( prev ) => {
      if ( checked ) {
        return {
          ...prev,
          proFunctions: [ ...prev.proFunctions, name ],
        };
      } else {
        return {
          ...prev,
          proFunctions: prev.proFunctions.filter( ( fn ) => fn !== name ),
        };
      }
    } );
  };

  if ( !isOpen ) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 m-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl mx-4 max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Nuevo Cliente
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Registra datos administrativos, fiscales y operativos del cliente.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Onboarding comercial
                </span>
                <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-900/40 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Campos con * obligatorios
                </span>
              </div>
            </div>
            <button
              onClick={ onClose }
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg p-1"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={ handleSubmit } className="px-6 py-5 space-y-5">
          { formError && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{ formError }</p>
            </div>
          ) }

          {/* Sección de datos del administrador */ }
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Datos del Administradoor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre*
                </label>
                <input
                  type="text"
                  name="name"
                  value={ formData.name }
                  onChange={ handleInputChange }
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
                  value={ formData.lastName }
                  onChange={ handleInputChange }
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
                  value={ formData.email }
                  onChange={ handleInputChange }
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
                  value={ formData.phoneNumber }
                  onChange={ handleInputChange }
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
                  value={ formData.photoURL }
                  onChange={ handleInputChange }
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Sección de datos de la empresa */ }
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
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
                  value={ formData.companyName }
                  onChange={ handleInputChange }
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
                  value={ formData.businessName }
                  onChange={ handleInputChange }
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
                  value={ formData.RFC }
                  onChange={ handleInputChange }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código Postal (CP)*
                </label>
                <input
                  type="text"
                  name="CP"
                  value={ formData.CP }
                  onChange={ handleInputChange }
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
                  value={ formData.fullFiscalAddress }
                  onChange={ handleInputChange }
                  rows={ 2 }
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
                  value={ formData.country }
                  onChange={ handleInputChange }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  <option value="">Seleccione un país</option>
                  { countryOptions.map( ( option ) => (
                    <option key={ option.country } value={ option.country }>
                      { option.country }
                    </option>
                  ) ) }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Régimen Fiscal*
                </label>
                <input
                  type="text"
                  name="taxRegime"
                  value={ formData.taxRegime }
                  onChange={ handleInputChange }
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
                  value={ formData.businessActivity }
                  onChange={ handleInputChange }
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
                  value={ formData.cfdiUse }
                  onChange={ handleInputChange }
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
                  value={ formData.responsiblePersonName }
                  onChange={ handleInputChange }
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
                  value={ formData.responsiblePersonPosition }
                  onChange={ handleInputChange }
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
                  value={ formData.language }
                  onChange={ handleInputChange }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  { countryOptions.map( ( option ) => (
                    <option
                      key={ `${ option.country }-${ option.language }` }
                      value={ option.language }
                    >
                      { option.country } ({ option.language })
                    </option>
                  ) ) }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Moneda*
                </label>
                <select
                  name="currency"
                  value={ formData.currency }
                  onChange={ handleInputChange }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  { countryOptions.map( ( option ) => (
                    <option
                      key={ `${ option.country }-${ option.currency }` }
                      value={ option.currency }
                    >
                      { option.currency } - { option.currencyName }
                    </option>
                  ) ) }
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Facturación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Frecuencia de Facturación
                </label>
                <select
                  name="billingFrequency"
                  value={ formData.billingFrequency }
                  onChange={ handleInputChange }
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
                    checked={ formData.termsAccepted }
                    onChange={ handleCheckboxChange }
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

          {/* Pro Functions */ }
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              Funciones Pro (IA)
            </h4>
            <div className="pl-2">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  name="selectAll"
                  checked={ selectAll }
                  onChange={ handleCheckboxChange }
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
                { proFunctionOptions.map( ( option ) => (
                  <div key={ option } className="flex items-center">
                    <input
                      type="checkbox"
                      id={ option }
                      name={ option }
                      checked={ formData.proFunctions.includes( option ) }
                      onChange={ handleCheckboxChange }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={ option }
                      className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                    >
                      { proFunctionLabels[ option ] }
                    </label>
                  </div>
                ) ) }
              </div>
            </div>
          </div>

          {/* App de Mantenimiento */ }
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              App de Mantenimiento
            </h4>
            <div className="pl-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasMaintenanceApp"
                  name="hasMaintenanceApp"
                  checked={ formData.condominiumInfo.hasMaintenanceApp }
                  onChange={ handleCheckboxChange }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="hasMaintenanceApp"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                >
                  El primer condominio contrató la App de Mantenimiento
                </label>
              </div>
              { formData.condominiumInfo.hasMaintenanceApp &&
                formData.condominiumInfo.maintenanceAppContractedAt && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Fecha de contratación registrada: { " " }
                    { new Date(
                      formData.condominiumInfo.maintenanceAppContractedAt
                    ).toLocaleString( "es-MX" ) }
                  </p>
                ) }
            </div>
          </div>

          {/* Sección de información del primer condominio */ }
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
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
                  value={ formData.condominiumInfo.name }
                  onChange={ handleInputChange }
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
                  value={ formData.condominiumInfo.address }
                  onChange={ handleInputChange }
                  required
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Administrador del Condominio*
                </label>
                <input
                  type="text"
                  name="condominiumManager"
                  value={ formData.condominiumManager }
                  onChange={ handleInputChange }
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
                  value={ formData.condominiumInfo.status }
                  onChange={ handleInputChange }
                  className="w-full px-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                >
                  { Object.entries( CondominiumStatus ).map( ( [ _key, value ] ) => (
                    <option key={ value } value={ value }>
                      { statusLabels[ value as CondominiumStatus ] }
                    </option>
                  ) ) }
                </select>
              </div>

              { /* Calculadora de precio por unidades */ }
              <div className="md:col-span-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Calculadora de precio</h4>
                </div>

                { /* Número de unidades */ }
                <div className="text-center mb-4">
                  <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    { formData.plan }
                  </span>
                  <span className="ml-2 text-sm font-semibold text-gray-500 dark:text-gray-400">unidades</span>
                </div>

                { /* Slider */ }
                <div className="mb-4">
                  <input
                    type="range"
                    min={ MIN_UNITS }
                    max={ MAX_UNITS }
                    value={ parseInt( formData.plan ) || MIN_UNITS }
                    onChange={ ( e ) => setFormData( ( prev ) => ( { ...prev, plan: e.target.value } ) ) }
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={ {
                      background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${ ( ( ( parseInt( formData.plan ) || MIN_UNITS ) - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100 }%, #e5e7eb ${ ( ( ( parseInt( formData.plan ) || MIN_UNITS ) - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100 }%, #e5e7eb 100%)`,
                    } }
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{ MIN_UNITS } unidades</span>
                    <span>{ MAX_UNITS } unidades</span>
                  </div>
                </div>

                { /* Input manual */ }
                <div className="flex items-center gap-2 mb-5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">O ingresa el número:</label>
                  <input
                    type="number"
                    min={ MIN_UNITS }
                    max={ MAX_UNITS }
                    value={ formData.plan }
                    onChange={ ( e ) => {
                      const v = Math.min( MAX_UNITS, Math.max( MIN_UNITS, parseInt( e.target.value ) || MIN_UNITS ) );
                      setFormData( ( prev ) => ( { ...prev, plan: String( v ) } ) );
                    } }
                    className="w-20 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-500">unidades</span>
                </div>

                { /* Desglose de precios */ }
                { ( () => {
                  const units = parseInt( formData.plan ) || MIN_UNITS;
                  const subtotal = PLAN_BASE + units * COST_PER_UNIT;
                  const iva = subtotal * IVA_RATE;
                  const total = subtotal + iva;
                  const fmt = ( v: number ) => v.toLocaleString( "es-MX", { style: "currency", currency: "MXN" } );
                  return (
                    <div className="rounded-xl bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Acceso total a la plataforma</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ fmt( PLAN_BASE ) }</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{ units } unidades × { fmt( COST_PER_UNIT ) }</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ fmt( units * COST_PER_UNIT ) }</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
                        <span>Subtotal</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ fmt( subtotal ) }</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>IVA (16%)</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ fmt( iva ) }</span>
                      </div>
                      <div className="flex justify-between border-t-2 border-indigo-200 dark:border-indigo-700 pt-2">
                        <span className="font-bold text-gray-900 dark:text-white">Total mensual</span>
                        <span className="font-black text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{ fmt( total ) }</span>
                      </div>
                      <p className="text-center text-xs text-gray-400 pt-1">
                        ≈ { fmt( total / units ) } por unidad / mes
                      </p>
                    </div>
                  );
                } )() }
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={ onClose }
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={ creatingClient }
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-75 flex items-center"
            >
              { creatingClient ? (
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
              ) }
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Credenciales */ }
      { showCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[60] m-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Credenciales del Cliente
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Entrega estas credenciales de acceso al administrador principal.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={ credentials.email }
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={ () => copyToClipboard( credentials.email, "Email" ) }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
                    value={ credentials.password }
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={ () =>
                      copyToClipboard( credentials.password, "Contraseña" )
                    }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={ () => {
                  setShowCredentials( false );
                  onClose();
                } }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
};

export default NewClientForm;
