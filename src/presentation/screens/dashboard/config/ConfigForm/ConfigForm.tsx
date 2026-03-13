import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useFileCompression } from "../../../../../hooks/useFileCompression";
import { useConfigStore } from "../../../../../store/useConfigStore";
import { countriesList } from "../../../../../utils/countriesList";
// import { useDropzone } from "react-dropzone";
import {
  CheckIcon,
  PhotoIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  CogIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import FinancialAccounts from "../FinancialAccounts";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import AdminUsers from "../AdminUsers/AdminUsers";
import MaintenanceAppUsers from "../MaintenanceAppUsers/MaintenanceAppUsers";
import { getAuth } from "firebase/auth";
import { ClientInvoice } from "../../../../../store/useClientInvoicesStore";
import useClientInvoicesStore from "../../../../../store/useClientInvoicesStore";
import PaymentMessageEditor from "../PaymentMessageEditor/PaymentMessageEditor";
import CommitteeManagement from "../committee/CommitteeManagement";
import ClientInvoicesTable from "../../client/invoices/ClientInvoicesTable";
import AuditTrail from "../../audit/AuditTrail";
import { useLocation, useNavigate } from "react-router-dom";
import { useCondominiumStore } from "../../../../../store/useCondominiumStore";

type ConfigTabId =
  | "config"
  | "payments"
  | "cuentas"
  | "mensaje-pago"
  | "users"
  | "audit"
  | "committee";

type ConfigSectionTabId = "company" | "condominium";

const CONFIG_TAB_PATHS: Record<ConfigTabId, string> = {
  config: "/dashboard/client-config/general",
  payments: "/dashboard/client-config/payments-invoices",
  cuentas: "/dashboard/client-config/bank-accounts",
  "mensaje-pago": "/dashboard/client-config/messages-documents",
  users: "/dashboard/client-config/administrators",
  audit: "/dashboard/client-config/audit-log",
  committee: "/dashboard/client-config/committee-reports",
};

const CONFIG_PATH_TO_TAB: Record<string, ConfigTabId> = {
  general: "config",
  "payments-invoices": "payments",
  "bank-accounts": "cuentas",
  "messages-documents": "mensaje-pago",
  administrators: "users",
  "audit-log": "audit",
  "committee-reports": "committee",
  // Compatibilidad con enlaces previos
  "pagos-facturas": "payments",
  "cuentas-bancarias": "cuentas",
  "mensajes-documentos": "mensaje-pago",
  administradores: "users",
  auditoria: "audit",
  "comite-reportes": "committee",
};

const ConfigForm = () => {
  const {
    config,
    condominiumConfig,
    loading,
    error,
    fetchConfig,
    fetchCondominiumConfig,
    updateConfig,
    updateCondominiumConfig,
    hasMaintenanceApp,
    checkMaintenanceAppAccess,
  } = useConfigStore();
  const { compressFile, isCompressing: isCompressingFile } = useFileCompression();
  const { isDarkMode, toggleDarkMode } = useTheme(); // <-- Valor del ThemeContext (debe ser boolean)
  const [ userRole, setUserRole ] = useState<string | null>( null );
  const location = useLocation();
  const navigate = useNavigate();
  const fetchCondominiums = useCondominiumStore(
    ( state ) => state.fetchCondominiums
  );

  // Estados de la pestaña de configuración
  const [ companyName, setCompanyName ] = useState( "" );
  const [ email, setEmail ] = useState( "" );
  const [ phoneNumber, setPhoneNumber ] = useState( "" );
  const [ address, setAddress ] = useState( "" );
  const [ RFC, setRFC ] = useState( "" );
  const [ country, setCountry ] = useState( "" );
  const [ logoFile, setLogoFile ] = useState<File | null>( null );
  const [ signatureFile, setSignatureFile ] = useState<File | null>( null );
  const [ logoReportsFile, setLogoReportsFile ] = useState<File | null>( null );
  const [ logoPreviewUrl, setLogoPreviewUrl ] = useState<string | null>( null );

  // Estados para archivos existentes
  const [ signaturePreviewUrl, setSignaturePreviewUrl ] = useState<string | null>(
    null
  );
  const [ logoReportsPreviewUrl, setLogoReportsPreviewUrl ] = useState<
    string | null
  >( null );
  const [ condominiumName, setCondominiumName ] = useState( "" );
  const [ condominiumAddress, setCondominiumAddress ] = useState( "" );
  const [ condominiumManager, setCondominiumManager ] = useState( "" );
  const [ condominiumUid, setCondominiumUid ] = useState( "" );
  const [ condominiumLimit, setCondominiumLimit ] = useState<number>( 0 );
  const [ condominiumCreatedDate, setCondominiumCreatedDate ] =
    useState<Date | null>( null );
  const [ isUpdatingCondominium, setIsUpdatingCondominium ] = useState( false );
  const [ configSectionTab, setConfigSectionTab ] =
    useState<ConfigSectionTabId>( "company" );

  // Estados para la pestaña de pagos y facturas
  // const [selectedInvoice, setSelectedInvoice] = useState("");
  // const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [ _viewInvoiceDetail, setViewInvoiceDetail ] =
    useState<ClientInvoice | null>( null );

  const { initiateStripePayment } = useClientInvoicesStore();

  useEffect( () => {
    fetchConfig();
    fetchCondominiumConfig().catch( () => undefined );
    checkMaintenanceAppAccess();
  }, [ fetchConfig, fetchCondominiumConfig, checkMaintenanceAppAccess ] );

  useEffect( () => {
    if ( config ) {
      setCompanyName( config.companyName || "" );
      setEmail( config.email || "" );
      setPhoneNumber( config.phoneNumber || "" );
      setAddress( config.address || "" );
      setRFC( config.RFC || "" );
      setCountry( config.country || "" );
      if ( config.logo ) {
        setLogoPreviewUrl( config.logo );
      }
      if ( config.signatureUrl ) {
        setSignaturePreviewUrl( config.signatureUrl );
      }
      if ( config.logoReports ) {
        setLogoReportsPreviewUrl( config.logoReports );
      }
    }
  }, [ config ] );

  useEffect( () => {
    if ( !condominiumConfig ) return;
    setCondominiumName( condominiumConfig.name || "" );
    setCondominiumAddress( condominiumConfig.address || "" );
    setCondominiumManager( condominiumConfig.condominiumManager || "" );
    setCondominiumUid( condominiumConfig.uid || "" );
    setCondominiumLimit( Number( condominiumConfig.condominiumLimit || 0 ) );
    setCondominiumCreatedDate( condominiumConfig.createdDate || null );
  }, [ condominiumConfig ] );

  useEffect( () => {
    if ( logoFile ) {
      const url = URL.createObjectURL( logoFile );
      setLogoPreviewUrl( url );
      return () => URL.revokeObjectURL( url );
    }
  }, [ logoFile ] );

  useEffect( () => {
    if ( signatureFile ) {
      const url = URL.createObjectURL( signatureFile );
      setSignaturePreviewUrl( url );
      return () => URL.revokeObjectURL( url );
    }
  }, [ signatureFile ] );

  useEffect( () => {
    if ( logoReportsFile ) {
      const url = URL.createObjectURL( logoReportsFile );
      setLogoReportsPreviewUrl( url );
      return () => URL.revokeObjectURL( url );
    }
  }, [ logoReportsFile ] );

  useEffect( () => {
    const getCurrentUserRole = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if ( user ) {
        const token = await user.getIdTokenResult();
        const role = token.claims.role as string;
        setUserRole( role || "" );
      }
    };
    getCurrentUserRole();
  }, [] );

  const handleSubmit = async ( e: React.FormEvent<HTMLFormElement> ) => {
    e.preventDefault();

    try {
      // Verifica qué valor es isDarkMode

      // Enviamos darkMode asegurándonos de que sea boolean (con !!)
      await updateConfig(
        {
          companyName,
          email,
          phoneNumber,
          address,
          RFC,
          country,
          darkMode: !!isDarkMode, // <-- Asegura que sea un boolean
        },
        logoFile || undefined,
        signatureFile || undefined,
        logoReportsFile || undefined
      );

      toast.success( "Configuración actualizada correctamente" );
    } catch ( error: any ) {
      toast.error( error.message || "Error al actualizar la configuración" );
    }
  };

  const handleCondominiumSubmit = async () => {
    if ( !condominiumName.trim() ) {
      toast.error( "El nombre del condominio es obligatorio." );
      return;
    }

    try {
      setIsUpdatingCondominium( true );
      await updateCondominiumConfig( {
        name: condominiumName.trim(),
        address: condominiumAddress.trim(),
        condominiumManager: condominiumManager.trim(),
      } );
      await fetchCondominiumConfig();
      await fetchCondominiums();
      toast.success( "Datos del condominio actualizados correctamente" );
    } catch ( updateCondominiumError: any ) {
      toast.error(
        updateCondominiumError.message ||
        "Error al actualizar los datos del condominio"
      );
    } finally {
      setIsUpdatingCondominium( false );
    }
  };

  // Configuración de pestañas con iconos y colores
  const tabs = [
    {
      id: "config",
      label: "Configuración",
      icon: CogIcon,
    },
    {
      id: "payments",
      label: "Pagos y Facturas",
      icon: CreditCardIcon,
    },
    ...( userRole === "admin"
      ? [
        {
          id: "cuentas",
          label: "Cuentas Bancarias",
          icon: BanknotesIcon,
        },
        {
          id: "mensaje-pago",
          label: "Mensajes y Documentos",
          icon: DocumentTextIcon,
        },
        /*   {
            id: "committee",
            label: "Comité y Reportes",
            icon: ChartBarIcon,
          },
        */
        {
          id: "users",
          label: "Administradores",
          icon: UsersIcon,
        },
        {
          id: "audit",
          label: "Auditoría",
          icon: ClipboardDocumentCheckIcon,
        },
      ]
      : [] ),
  ];

  const allowedTabIds = new Set<ConfigTabId>( [
    ...tabs.map( ( tab ) => tab.id as ConfigTabId ),
    ...( userRole === "admin" ? ( [ "committee" ] as ConfigTabId[] ) : [] ),
  ] );

  const pathSegments = location.pathname.split( "/" ).filter( Boolean );
  const tabSlug = pathSegments[ 2 ] || "";
  const tabFromPath = CONFIG_PATH_TO_TAB[ tabSlug ];
  const legacyState = ( location.state as { activeTab?: ConfigTabId; } | null )
    ?.activeTab;
  const fallbackTab: ConfigTabId = "config";
  const requestedTab =
    ( tabFromPath && allowedTabIds.has( tabFromPath ) && tabFromPath ) ||
    ( legacyState && allowedTabIds.has( legacyState ) && legacyState ) ||
    fallbackTab;
  const activeTab = requestedTab;

  useEffect( () => {
    if ( userRole === null ) return;
    const targetPath = CONFIG_TAB_PATHS[ activeTab ];
    if ( location.pathname !== targetPath ) {
      navigate( targetPath, { replace: true, state: null } );
    }
  }, [ activeTab, location.pathname, navigate, userRole ] );

  return (
    <div className="min-h-screen bg-white rounded-lg dark:bg-gray-900 p-4 md:px-2 md:py-4">
      { error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 font-medium">{ error }</p>
        </div>
      ) }

      {/* Header con título animado */ }
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Panel de Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-md">
          Gestiona la configuración de tu empresa y sistema
        </p>
      </div>

      {/* Navegación de pestañas moderna */ }
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          { tabs.map( ( tab ) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={ tab.id }
                onClick={ () =>
                  navigate( CONFIG_TAB_PATHS[ tab.id as ConfigTabId ] )
                }
                className={ `
                  group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                  transition-all duration-300 ease-out
                  ${ isActive
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }
                `}
              >
                <Icon
                  className={ `h-5 w-5 transition-transform duration-300 ${ isActive ? "scale-110" : "group-hover:scale-105"
                    }` }
                />
                <span className="whitespace-nowrap">{ tab.label }</span>
                { isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                ) }
              </button>
            );
          } ) }
        </div>
      </div>

      { activeTab === "config" && (
        <div className="space-y-8">
          {/* Card principal con glassmorphism */ }
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
            {/* Header del card con logo */ }
            <div className="relative p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800">
              <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center gap-6">
              <div className="group">
                <div className="h-24 w-24 bg-white rounded-2xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-105">
                    { logoPreviewUrl ? (
                      <img
                        src={ logoPreviewUrl }
                        alt="Logo de la empresa"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <BuildingOffice2Icon className="h-full w-full text-gray-400" />
                    ) }
                  </div>
                </div>
                <div className="text-white">
                  <h2 className="text-lg md:text-xl font-bold mb-2">
                    { companyName || "Nombre de la empresa" }
                  </h2>
                  <p className="text-white/80">
                    Configura los datos principales de tu organización
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 pt-6">
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={ () => setConfigSectionTab( "company" ) }
                  className={ `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${ configSectionTab === "company"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }` }
                >
                  Configuración de la empresa
                </button>
                <button
                  type="button"
                  onClick={ () => setConfigSectionTab( "condominium" ) }
                  className={ `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${ configSectionTab === "condominium"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }` }
                >
                  Información del condominio
                </button>
              </div>
            </div>

            <form onSubmit={ handleSubmit } className="p-8">
              { configSectionTab === "company" && (
                <>
                  {/* Datos de la empresa */ }
                  <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500 dark:bg-indigo-700 rounded-xl flex items-center justify-center">
                    <BuildingOffice2Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Información de la Empresa
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre de la empresa */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Nombre de la empresa
                    </label>
                    <div className="relative">
                      <BuildingOffice2Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <input
                        type="text"
                        value={ companyName }
                        onChange={ ( e ) => setCompanyName( e.target.value ) }
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Ingresa el nombre de tu empresa"
                      />
                    </div>
                  </div>

                  {/* Email */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <input
                        type="email"
                        value={ email }
                        readOnly
                        className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 cursor-not-allowed"
                        placeholder="empresa@ejemplo.com"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Por favor, si deseas cambiar el correo electrónico, contacta al soporte técnico.
                    </p>
                  </div>

                  {/* Teléfono */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Número de teléfono
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <input
                        type="text"
                        value={ phoneNumber }
                        onChange={ ( e ) => setPhoneNumber( e.target.value ) }
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="+52 55 1234 5678"
                      />
                    </div>
                  </div>

                  {/* Dirección */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <input
                        type="text"
                        value={ address }
                        onChange={ ( e ) => setAddress( e.target.value ) }
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Calle, número, colonia, ciudad"
                      />
                    </div>
                  </div>

                  {/* RFC */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      RFC
                    </label>
                    <div className="relative">
                      <IdentificationIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <input
                        type="text"
                        value={ RFC }
                        onChange={ ( e ) => setRFC( e.target.value ) }
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="ABC123456789"
                      />
                    </div>
                  </div>

                  {/* País */ }
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      País
                    </label>
                    <div className="relative">
                      <GlobeAltIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                      <select
                        value={ country }
                        onChange={ ( e ) => setCountry( e.target.value ) }
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona un país</option>
                        { countriesList.map( ( c ) => (
                          <option key={ c } value={ c }>
                            { c }
                          </option>
                        ) ) }
                      </select>
                    </div>
                  </div>
                </div>
                  </div>
                </>
              ) }

              {/* Datos del condominio actual */ }
              { configSectionTab === "condominium" && (
                <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500 dark:bg-indigo-700 rounded-xl flex items-center justify-center">
                    <BuildingOffice2Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Información del condominio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Esta sección administra únicamente datos del condominio seleccionado, no de la empresa administradora.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Nombre del condominio
                      </label>
                      <div className="relative">
                        <BuildingOffice2Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                        <input
                          type="text"
                          value={ condominiumName }
                          onChange={ ( e ) => setCondominiumName( e.target.value ) }
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100"
                          placeholder="Nombre del condominio"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Administrador del condominio
                      </label>
                      <div className="relative">
                        <UsersIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                        <input
                          type="text"
                          value={ condominiumManager }
                          onChange={ ( e ) => setCondominiumManager( e.target.value ) }
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100"
                          placeholder="Nombre del administrador del condominio"
                        />
                      </div>
                    </div>

                    <div className="group md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Dirección del condominio
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                        <input
                          type="text"
                          value={ condominiumAddress }
                          onChange={ ( e ) => setCondominiumAddress( e.target.value ) }
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100"
                          placeholder="Dirección del condominio"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        UID del condominio
                      </p>
                      <p className="mt-2 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                        { condominiumUid || "-" }
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Límite de condóminos
                      </p>
                      <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                        { Number.isFinite( condominiumLimit )
                          ? condominiumLimit
                          : "-" }
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Fecha de creación
                      </p>
                      <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                        { condominiumCreatedDate
                          ? condominiumCreatedDate.toLocaleString( "es-MX" )
                          : "-" }
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={ handleCondominiumSubmit }
                      disabled={ isUpdatingCondominium || loading }
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      { isUpdatingCondominium || loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Guardando condominio...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Guardar Datos Del Condominio
                        </>
                      ) }
                    </button>
                  </div>
                </div>
                </div>
              ) }

              {/* Archivos */ }
              { configSectionTab === "company" && (
                <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500 dark:bg-indigo-700 rounded-xl flex items-center justify-center">
                    <PhotoIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Archivos y Documentos
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Logo principal */ }
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Logo de la Empresa
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Logo principal que aparecerá en la interfaz del
                          sistema
                        </p>

                        <label
                          htmlFor="logo"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200"
                        >
                          { logoFile ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Nuevo archivo seleccionado
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4" />
                              Seleccionar archivo
                            </>
                          ) }
                        </label>
                        <input
                          type="file"
                          id="logo"
                          accept="image/png, image/jpeg"
                          onChange={ async ( e ) => {
                            if ( e.target.files && e.target.files[ 0 ] ) {
                              try {
                                const compressed = await compressFile( e.target.files[ 0 ] );
                                setLogoFile( compressed );
                                toast.success( "Logo procesado y listo" );
                              } catch ( error ) {
                                console.error( error );
                                setLogoFile( e.target.files[ 0 ] );
                              }
                            } else {
                              setLogoFile( null );
                            }
                          } }
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Formatos: PNG, JPG • Tamaño máximo: 10MB
                        </p>
                      </div>

                      { logoPreviewUrl && (
                        <div className="flex-shrink-0">
                          <div className="w-32 h-32 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-3 flex items-center justify-center">
                            <img
                              src={ logoPreviewUrl }
                              alt="Logo actual"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            { logoFile ? "Vista previa" : "Archivo actual" }
                          </p>
                        </div>
                      ) }
                    </div>
                  </div>

                  {/* Firma digital */ }
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Firma Digital
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Firma que aparecerá en reportes y documentos oficiales
                        </p>

                        <label
                          htmlFor="signature"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200"
                        >
                          { signatureFile ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Nuevo archivo seleccionado
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4" />
                              Seleccionar archivo
                            </>
                          ) }
                        </label>
                        <input
                          type="file"
                          id="signature"
                          accept="image/png, image/jpeg"
                          onChange={ async ( e ) => {
                            if ( e.target.files && e.target.files[ 0 ] ) {
                              try {
                                const compressed = await compressFile( e.target.files[ 0 ] );
                                setSignatureFile( compressed );
                                toast.success( "Firma procesada y lista" );
                              } catch ( error ) {
                                console.error( error );
                                setSignatureFile( e.target.files[ 0 ] );
                              }
                            } else {
                              setSignatureFile( null );
                            }
                          } }
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Formatos: PNG, JPG • Tamaño máximo: 10MB
                        </p>
                      </div>

                      { signaturePreviewUrl && (
                        <div className="flex-shrink-0">
                          <div className="w-32 h-32 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-3 flex items-center justify-center">
                            <img
                              src={ signaturePreviewUrl }
                              alt="Firma actual"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            { signatureFile ? "Vista previa" : "Archivo actual" }
                          </p>
                        </div>
                      ) }
                    </div>
                  </div>

                  {/* Logo para reportes */ }
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Logo para Reportes
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Versión del logo optimizada para documentos y reportes
                        </p>

                        <label
                          htmlFor="logoReports"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200"
                        >
                          { logoReportsFile ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Nuevo archivo seleccionado
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4" />
                              Seleccionar archivo
                            </>
                          ) }
                        </label>
                        <input
                          type="file"
                          id="logoReports"
                          accept="image/png, image/jpeg"
                          onChange={ async ( e ) => {
                            if ( e.target.files && e.target.files[ 0 ] ) {
                              try {
                                const compressed = await compressFile( e.target.files[ 0 ] );
                                setLogoReportsFile( compressed );
                                toast.success( "Logo para reportes procesado y listo" );
                              } catch ( error ) {
                                console.error( error );
                                setLogoReportsFile( e.target.files[ 0 ] );
                              }
                            } else {
                              setLogoReportsFile( null );
                            }
                          } }
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Formatos: PNG, JPG • Tamaño máximo: 10MB
                        </p>
                      </div>

                      { logoReportsPreviewUrl && (
                        <div className="flex-shrink-0">
                          <div className="w-32 h-32 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-3 flex items-center justify-center">
                            <img
                              src={ logoReportsPreviewUrl }
                              alt="Logo reportes actual"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            { logoReportsFile
                              ? "Vista previa"
                              : "Archivo actual" }
                          </p>
                        </div>
                      ) }
                    </div>
                  </div>
                </div>
                </div>
              ) }

              {/* Toggle de tema */ }
              { configSectionTab === "company" && (
                <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={ `h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${ isDarkMode ? "bg-indigo-700" : "bg-yellow-500"
                      }` }
                  >
                    { isDarkMode ? (
                      <MoonIcon className="h-5 w-5 text-white" />
                    ) : (
                      <SunIcon className="h-5 w-5 text-white" />
                    ) }
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Preferencias de Tema
                  </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={ `p-2 rounded-lg transition-all duration-300 ${ !isDarkMode
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-gray-100 dark:bg-gray-700"
                            }` }
                        >
                          <SunIcon
                            className={ `h-5 w-5 transition-all duration-300 ${ !isDarkMode
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-gray-400"
                              }` }
                          />
                        </div>
                        <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Modo { isDarkMode ? "Oscuro" : "Claro" }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={ isDarkMode }
                          onChange={ () => {
                            toggleDarkMode();
                          } }
                          className="sr-only peer"
                        />
                        <div
                          className={ `w-14 h-7 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 transition-transform duration-200 ${ isDarkMode
                            ? "bg-indigo-700 peer-focus:ring-indigo-800"
                            : "bg-indigo-500 peer-focus:ring-indigo-300"
                            } peer-focus:outline-none peer-focus:ring-4` }
                        ></div>
                      </label>

                      <div
                        className={ `p-2 rounded-lg transition-all duration-300 ${ isDarkMode
                          ? "bg-indigo-100 dark:bg-indigo-900/30"
                          : "bg-gray-100 dark:bg-gray-700"
                          }` }
                      >
                        <MoonIcon
                          className={ `h-5 w-5 transition-all duration-300 ${ isDarkMode
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400"
                            }` }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      { isDarkMode
                        ? "El modo oscuro reduce la fatiga visual y ahorra batería en pantallas OLED."
                        : "El modo claro ofrece mejor legibilidad en ambientes bien iluminados." }
                    </p>
                  </div>
                </div>
                </div>
              ) }

              {/* Botón de guardar */ }
              { configSectionTab === "company" && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={ loading }
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    { loading || isCompressingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Guardar Configuración
                      </>
                    ) }
                  </button>
                </div>
              ) }
            </form>
          </div>
        </div>
      ) }

      { activeTab === "payments" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header del card */ }
          <div className="relative p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center gap-6">
              <div className="group">
                <div className="h-8 w-8 rounded-2xl">
                  <CreditCardIcon className="h-full w-full text-white" />
                </div>
              </div>
              <div className="text-white">
                <h2 className="text-lg md:text-xl font-bold mb-2">
                  Pagos y Facturas
                </h2>
                <p className="text-white/80">
                  Gestiona tus pagos y consulta el historial de facturas
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="bg-gradient-to-r from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                Historial de Facturas
              </h3>
              <ClientInvoicesTable
                onViewInvoice={ ( invoice: ClientInvoice ) =>
                  setViewInvoiceDetail( invoice )
                }
                onPayInvoice={ async ( invoice: ClientInvoice ) => {
                  try {
                    const { url } = await initiateStripePayment( invoice );
                    if ( url ) {
                      window.location.href = url;
                    } else {
                      toast.error( "No se pudo iniciar el pago" );
                    }
                  } catch ( error ) {
                    console.error( "Error al iniciar el pago:", error );
                    toast.error( "Error al iniciar el pago" );
                  }
                } }
              />
            </div>
          </div>
        </div>
      ) }

      { userRole === "admin" && activeTab === "cuentas" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 p-4">
            <div className="flex items-center gap-3 text-white">
              <BanknotesIcon className="h-8 w-8" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">
                  Cuentas Bancarias
                </h2>
                <p className="text-white/80">
                  Administra las cuentas financieras
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <FinancialAccounts />
          </div>
        </div>
      ) }

      { userRole === "admin" && activeTab === "mensaje-pago" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 p-4">
            <div className="flex items-center gap-3 text-white">
              <DocumentTextIcon className="h-8 w-8" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">
                  Mensajes y Documentos
                </h2>
                <p className="text-white/80">
                  Configura mensajes de pago y documentos
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PaymentMessageEditor />
          </div>
        </div>
      ) }

      { userRole === "admin" && activeTab === "users" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 p-4">
            <div className="flex items-center gap-3 text-white">
              <UsersIcon className="h-8 w-8" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">
                  Administradores
                </h2>
                <p className="text-white/80">
                  Gestiona los usuarios del sistema
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-8">
            <AdminUsers />

            {/* Usuarios de App de Mantenimiento - Solo visible si hasMaintenanceApp es true */ }
            { hasMaintenanceApp && (
              <>
                {/* Separador */ }
                <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

                {/* Usuarios de App de Mantenimiento */ }
                <MaintenanceAppUsers />
              </>
            ) }
          </div>
        </div>
      ) }

      { userRole === "admin" && activeTab === "committee" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 p-4">
            <div className="flex items-center gap-3 text-white">
              <ChartBarIcon className="h-8 w-8" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">
                  Comité y Reportes
                </h2>
                <p className="text-white/80">
                  Administra el comité y genera reportes
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <CommitteeManagement />
          </div>
        </div>
      ) }

      { userRole === "admin" && activeTab === "audit" && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 p-4">
            <div className="flex items-center gap-3 text-white">
              <ClipboardDocumentCheckIcon className="h-8 w-8" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">Auditoría</h2>
                <p className="text-white/80">
                  Trazabilidad de acciones críticas del sistema
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <AuditTrail />
          </div>
        </div>
      ) }
    </div>
  );
};

export default ConfigForm;
