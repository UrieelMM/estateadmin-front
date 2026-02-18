import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../store/useConfigStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";
import { useFinancialAccountsStore } from "../../../../store/useAccountsStore";
import { useTheme } from "../../../../context/Theme/ThemeContext";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import {
  CheckIcon,
  CreditCardIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  BanknotesIcon,
  PencilSquareIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  GlobeAltIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../../../assets/logo.png";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

const InitialSetupSteps = () => {
  const TOTAL_STEPS = 6;
  const USERS_IMPORT_TEMPLATE_URL =
    "https://res.cloudinary.com/dz5tntwl1/raw/upload/v1710883105/template-registro-de-usuarios_yw3tih.xlsx";
  const [ currentStep, setCurrentStep ] = useState( 1 );
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { fetchCondominiums } = useCondominiumStore();
  const [ userData, setUserData ] = useState( {
    companyName: "",
    businessName: "",
    email: "",
    phoneNumber: "",
    address: "",
    fullFiscalAddress: "",
    RFC: "",
    country: "",
    businessActivity: "",
  } );
  const [ logoReportsFile, setLogoReportsFile ] = useState<File | null>( null );
  const [ signReportsFile, setSignReportsFile ] = useState<File | null>( null );
  const [ logoFile, setLogoFile ] = useState<File | null>( null );
  const [ logoReportsPreview, setLogoReportsPreview ] = useState<string | null>(
    null
  );
  const [ signReportsPreview, setSignReportsPreview ] = useState<string | null>(
    null
  );
  const [ logoPreview, setLogoPreview ] = useState<string | null>( null );
  const [ accountData, setAccountData ] = useState( {
    name: "",
    type: "",
    initialBalance: 0,
    description: "",
  } );
  const [ isSubmitting, setIsSubmitting ] = useState( false );

  const { config, fetchConfig, updateConfig } = useConfigStore();
  const { createAccount } = useFinancialAccountsStore();

  const { compressFile, isCompressing } = useFileCompression();

  // Cargar configuración inicial y condominios
  useEffect( () => {
    const initializeData = async () => {
      try {
        await fetchCondominiums();
        await fetchConfig();
      } catch ( error ) {
        console.error( "Error al cargar datos iniciales:", error );
        toast.error( "Error al cargar datos iniciales" );
      }
    };

    initializeData();
  }, [ fetchConfig, fetchCondominiums ] );

  // Actualizar userData cuando se cargue la config
  useEffect( () => {
    if ( config ) {
      setUserData( {
        companyName: config.companyName || "",
        businessName: config.businessName || "",
        email: config.email || "",
        phoneNumber: config.phoneNumber || "",
        address: config.address || "",
        fullFiscalAddress: config.fullFiscalAddress || "",
        RFC: config.RFC || "",
        country: config.country || "",
        businessActivity: config.businessActivity || "",
      } );
    }
  }, [ config ] );

  // Función para avanzar pasos con validaciones
  const nextStep = () => {
    if ( currentStep === 2 ) {
      const {
        businessName,
        email,
        phoneNumber,
        fullFiscalAddress,
        RFC,
        country,
        businessActivity,
      } = userData;
      if (
        !businessName ||
        !email ||
        !phoneNumber ||
        !fullFiscalAddress ||
        !RFC ||
        !country ||
        !businessActivity
      ) {
        toast.error( "Datos incompletos. Comunícate con soporte." );
        return;
      }
    } else if ( currentStep === 3 ) {
      if ( !logoReportsFile || !signReportsFile ) {
        toast.error( "Debes cargar tus imágenes." );
        return;
      }
    } else if ( currentStep === 4 ) {
      if ( !accountData.name ) {
        toast.error( "Debes crear al menos una cuenta financiera." );
        return;
      }
    }
    setCurrentStep( ( prev ) => prev + 1 );
  };

  const prevStep = () => setCurrentStep( ( prev ) => prev - 1 );

  // Handlers para archivos
  const handleLogoReportsChange = async ( e: React.ChangeEvent<HTMLInputElement> ) => {
    if ( e.target.files && e.target.files[ 0 ] ) {
      try {
        const compressed = await compressFile( e.target.files[ 0 ] );
        setLogoReportsFile( compressed );
        setLogoReportsPreview( URL.createObjectURL( compressed ) );
        toast.success( "Logo para reportes procesado" );
      } catch ( error ) {
        console.error( error );
        setLogoReportsFile( e.target.files[ 0 ] );
        setLogoReportsPreview( URL.createObjectURL( e.target.files[ 0 ] ) );
      }
    }
  };

  const handleSignReportsChange = async ( e: React.ChangeEvent<HTMLInputElement> ) => {
    if ( e.target.files && e.target.files[ 0 ] ) {
      try {
        const compressed = await compressFile( e.target.files[ 0 ] );
        setSignReportsFile( compressed );
        setSignReportsPreview( URL.createObjectURL( compressed ) );
        toast.success( "Firma procesada" );
      } catch ( error ) {
        console.error( error );
        setSignReportsFile( e.target.files[ 0 ] );
        setSignReportsPreview( URL.createObjectURL( e.target.files[ 0 ] ) );
      }
    }
  };

  const handleLogoChange = async ( e: React.ChangeEvent<HTMLInputElement> ) => {
    if ( e.target.files && e.target.files[ 0 ] ) {
      try {
        const compressed = await compressFile( e.target.files[ 0 ] );
        setLogoFile( compressed );
        setLogoPreview( URL.createObjectURL( compressed ) );
        toast.success( "Logo procesado" );
      } catch ( error ) {
        console.error( error );
        setLogoFile( e.target.files[ 0 ] );
        setLogoPreview( URL.createObjectURL( e.target.files[ 0 ] ) );
      }
    }
  };

  // Handler para el formulario del paso 4
  const handleAccountInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setAccountData( ( prev ) => ( {
      ...prev,
      [ name ]: name === "initialBalance" ? parseFloat( value ) : value,
    } ) );
  };

  // Función para finalizar el proceso
  const handleFinish = async () => {
    setIsSubmitting( true );
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if ( !user ) throw new Error( "Usuario no autenticado" );

      const tokenResult = await getIdTokenResult( user );
      const clientId = tokenResult.claims[ "clientId" ] as string;
      if ( !clientId ) throw new Error( "clientId no disponible en el token" );

      const condominiumId = localStorage.getItem( "condominiumId" );
      if ( !condominiumId ) throw new Error( "Condominio no seleccionado" );

      const db = getFirestore();

      // 1. Crear documento del usuario si no existe
      const userEmail = user.email?.toLowerCase() || "";
      const userCollRef = collection(
        db,
        `clients/${ clientId }/condominiums/${ condominiumId }/users`
      );
      const q = query( userCollRef, where( "email", "==", userEmail ) );
      const snap = await getDocs( q );

      if ( snap.empty ) {
        // Crear el documento del usuario
        await addDoc( userCollRef, {
          email: userEmail,
          role: "admin",
          darkMode: isDarkMode,
          createdAt: serverTimestamp(),
          userId: user.uid,
        } );
      } else {
        // Actualizar el tema en el documento existente
        const userDoc = snap.docs[ 0 ];
        await updateDoc( userDoc.ref, {
          darkMode: isDarkMode,
          userId: user.uid,
        } );
      }

      // 2. Actualizar configuración general y darkMode
      await updateConfig(
        {
          ...userData,
          darkMode: isDarkMode,
        },
        logoFile || undefined,
        signReportsFile || undefined,
        logoReportsFile || undefined
      );

      // 3. Crear cuenta financiera si se proporcionaron datos
      if ( accountData.name ) {
        await createAccount( {
          name: accountData.name,
          type: accountData.type,
          description: accountData.description,
          initialBalance: accountData.initialBalance,
          active: true,
        } );
      }

      // 4. Marcar configuración inicial como completada
      const configDocRef = doc( db, "clients", clientId );
      await setDoc(
        configDocRef,
        {
          initialSetupCompleted: true,
        },
        { merge: true }
      );

      toast.success( "¡Configuración inicial completada!" );

      // 5. Redirigir después de un breve delay
      setTimeout( () => {
        window.location.href = "/dashboard/home";
      }, 1500 );
    } catch ( error: any ) {
      console.error( "Error al finalizar configuración:", error );
      toast.error( error.message || "Error al completar la configuración" );
      setIsSubmitting( false );
    }
  };

  // Header (título e ícono) según el paso actual
  const getHeaderData = () => {
    switch ( currentStep ) {
      case 1:
        return {
          title: "Bienvenido a EstateAdmin",
          icon: <SparklesIcon className="h-8 w-8 text-indigo-400" />,
        };
      case 2:
        return {
          title: "Confirma tus datos",
          icon: <UserCircleIcon className="h-8 w-8 text-indigo-400" />,
        };
      case 3:
        return {
          title: "Carga tus imágenes",
          icon: <PhotoIcon className="h-8 w-8 text-indigo-400" />,
        };
      case 4:
        return {
          title: "Crea al menos una cuenta financiera",
          icon: <CurrencyDollarIcon className="h-8 w-8 text-indigo-400" />,
        };
      case 5:
        return {
          title: "Elige tu tema",
          icon: isDarkMode ? (
            <MoonIcon className="h-8 w-8 text-indigo-400" />
          ) : (
            <SunIcon className="h-8 w-8 text-indigo-400" />
          ),
        };
      case 6:
        return {
          title: "Plantilla de importación",
          icon: <TableCellsIcon className="h-8 w-8 text-indigo-400" />,
        };
      default:
        return { title: "", icon: null };
    }
  };

  const { title, icon } = getHeaderData();

  // Variantes para la animación de cada step
  const stepVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // Lista de pasos (5 pasos)
  const steps = [
    { label: "Bienvenido" },
    { label: "Datos" },
    { label: "Imágenes" },
    { label: "Cuenta Financiera" },
    { label: "Tema" },
    { label: "Plantilla" },
  ];

  // Renderizado de los pasos en formato vertical (desktop)
  const renderStepsVertical = () => (
    <div className="flex flex-col space-y-6">
      { steps.map( ( step, index ) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={ step.label } className="flex items-center space-x-4">
            <motion.div
              layout
              animate={ { scale: isActive ? 1.2 : 1 } }
              transition={ { type: "spring", stiffness: 300, damping: 20 } }
              className={ `flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-lg transition-colors duration-300 ${ isCompleted
                  ? "bg-indigo-400 text-white border-indigo-400"
                  : isActive
                    ? "bg-indigo-100 text-indigo-500 border-indigo-500"
                    : "bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                }` }
            >
              { isCompleted ? <CheckIcon className="h-5 w-5" /> : stepNumber }
            </motion.div>
            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
              { step.label }
            </div>
          </div>
        );
      } ) }
    </div>
  );

  // Renderizado de los pasos en formato horizontal (mobile)
  const renderStepsHorizontal = () => (
    <div className="flex justify-center space-x-4 overflow-x-auto">
      { steps.map( ( step, index ) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={ step.label } className="flex flex-col items-center">
            <motion.div
              layout
              animate={ { scale: isActive ? 1.2 : 1 } }
              transition={ { type: "spring", stiffness: 300, damping: 20 } }
              className={ `flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-lg transition-colors duration-300 ${ isCompleted
                  ? "bg-indigo-400 text-white border-indigo-400"
                  : isActive
                    ? "bg-indigo-100 text-indigo-500 border-indigo-500"
                    : "bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                }` }
            >
              { isCompleted ? <CheckIcon className="h-5 w-5" /> : stepNumber }
            </motion.div>
            <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
              { step.label }
            </div>
          </div>
        );
      } ) }
    </div>
  );

  // Cuerpo de cada paso (sin header ni botones)
  const renderStepBody = () => {
    switch ( currentStep ) {
      case 1:
        return (
          <div className="space-y-4 text-center md:text-left">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Tu herramienta integral para la administración de condominios.
              Nuestro sistema te permitirá gestionar cada aspecto de tu
              comunidad, desde la configuración inicial y el registro de
              residentes, hasta el control detallado de ingresos, egresos y
              cuentas financieras. Con una interfaz intuitiva y fácil de usar,{ " " }
              <span className="font-bold text-indigo-500">EstateAdmin</span>{ " " }
              facilita una gestión transparente y colaborativa.
            </p>
            <br />
            <span className="text-gray-700 dark:text-gray-100 mt-4">
              Antes de comenzar, necesitamos realizar algunas configuraciones
              iniciales.
            </span>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 mt-0"
              style={ { marginTop: "5px" } }
            >
              Haz clic en <strong>Siguiente</strong> para continuar.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 mt-2 text-center md:text-left">
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <BuildingOffice2Icon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>Nombre Comercial:</strong> { userData.businessName }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <EnvelopeIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>Email:</strong> { userData.email }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <PhoneIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>Teléfono:</strong> { userData.phoneNumber }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <PencilSquareIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>Actividad Económica:</strong>{ " " }
                  { userData.businessActivity }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <MapPinIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>Domicilio Fiscal:</strong>{ " " }
                  { userData.fullFiscalAddress }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <IdentificationIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>RFC:</strong> { userData.RFC }
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <GlobeAltIcon className="h-5 w-5 text-gray-300" />
                <span>
                  <strong>País:</strong> { userData.country }
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Si alguno de estos datos no es correcto, comunícate con{ " " }
              <a
                href="mailto:soporte@estate-admin.com"
                className="font-bold text-indigo-500 hover:text-indigo-600"
              >
                soporte
              </a>
              .
            </p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 text-center md:text-left">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
                Logo Corporativo
              </label>
              <label className="inline-flex items-center space-x-2 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                { logoFile ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <PhotoIcon className="h-5 w-5" />
                ) }
                <span>{ logoFile ? "Cambiar Logo" : "Seleccionar" }</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={ handleLogoChange }
                  className="hidden"
                />
              </label>
              { logoPreview && (
                <img
                  src={ logoPreview }
                  alt="Logo Preview"
                  className="mt-2 h-20 w-auto rounded"
                />
              ) }
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
                Logo para Reportes
              </label>
              <label className="inline-flex items-center space-x-2 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                { logoReportsFile ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <PhotoIcon className="h-5 w-5" />
                ) }
                <span>{ logoReportsFile ? "Cambiar Logo" : "Seleccionar" }</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={ handleLogoReportsChange }
                  className="hidden"
                />
              </label>
              { logoReportsPreview && (
                <img
                  src={ logoReportsPreview }
                  alt="Logo Reports Preview"
                  className="mt-2 h-20 w-auto rounded"
                />
              ) }
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">
                Firma para Reportes
              </label>
              <label className="inline-flex items-center space-x-2 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors">
                { signReportsFile ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <PhotoIcon className="h-5 w-5" />
                ) }
                <span>{ signReportsFile ? "Cambiar Firma" : "Seleccionar" }</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={ handleSignReportsChange }
                  className="hidden"
                />
              </label>
              { signReportsPreview && (
                <img
                  src={ signReportsPreview }
                  alt="Sign Reports Preview"
                  className="mt-2 h-20 w-auto rounded"
                />
              ) }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Se recomienda usar formato PNG con fondo transparente para mejor
              calidad.
            </p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 text-center md:text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la cuenta */ }
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Nombre de la cuenta
                </label>
                <div className="relative">
                  <CreditCardIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    value={ accountData.name }
                    onChange={ handleAccountInputChange }
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  />
                </div>
              </div>
              {/* Tipo */ }
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Tipo
                </label>
                <div className="relative">
                  <BanknotesIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <select
                    name="type"
                    value={ accountData.type }
                    onChange={ handleAccountInputChange }
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  >
                    <option value="">Seleccione</option>
                    <option value="bank">Banco</option>
                    <option value="cash">Efectivo</option>
                  </select>
                </div>
              </div>
              {/* Saldo Inicial */ }
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="initialBalance"
                    value={ accountData.initialBalance }
                    onChange={ handleAccountInputChange }
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200"
                    required
                  />
                </div>
              </div>
              {/* Descripción */ }
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Descripción (opcional)
                </label>
                <div className="relative">
                  <PencilSquareIcon className="h-5 w-5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                  <textarea
                    name="description"
                    value={ accountData.description }
                    onChange={ handleAccountInputChange }
                    className="w-full h-[42px] pl-9 pr-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-indigo-300 dark:bg-gray-700 dark:text-gray-200 resize-none"
                    rows={ 1 }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 text-start">
            <p className="text-gray-700 dark:text-gray-300">
              Elige si deseas Modo Día o Modo Noche
            </p>
            <div className="flex items-center justify-start space-x-4">
              <SunIcon
                className={ `h-6 w-6 ${ isDarkMode ? "text-gray-400" : "text-yellow-500"
                  }` }
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ isDarkMode }
                  onChange={ toggleDarkMode }
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full 
                  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
                ></div>
              </label>
              <MoonIcon
                className={ `h-6 w-6 ${ isDarkMode ? "text-indigo-400" : "text-gray-400"
                  }` }
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5 text-start">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Antes de finalizar, descarga la plantilla oficial para importar
                condóminos en el módulo de registro masivo.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <TableCellsIcon className="mt-0.5 h-6 w-6 text-indigo-500" />
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Plantilla Excel de condóminos
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Usa este archivo para cargar usuarios de forma masiva en
                    <strong> Registro de Condóminos</strong>.
                  </p>
                  <a
                    href={ USERS_IMPORT_TEMPLATE_URL }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Descargar plantilla
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // Animación inicial del contenedor
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 dark:from-gray-900 to-white dark:to-gray-800 flex items-center justify-center">
      {/* Contenedor principal con posición relativa para el logo */ }
      <div className="relative w-full max-w-5xl h-auto md:h-[500px] min-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-[0_0_10px_rgba(79,70,229,0.5),0_0_200px_#8093e8ac,0_0_100px_#c2abe6c1] p-8 flex flex-col md:flex-row">
        {/* Mobile: Steps en horizontal */ }
        <div className="md:hidden mb-4">{ renderStepsHorizontal() }</div>
        {/* Desktop: Steps en vertical */ }
        <div className="hidden md:block md:w-1/3 md:border-r md:pr-6">
          { renderStepsVertical() }
        </div>

        {/* Contenedor de contenido */ }
        <div className="flex-1 pl-0 md:pl-6 pr-6 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Header con título e ícono */ }
          <div className="mb-4 w-full flex justify-center md:justify-start">
            <div className="flex items-center space-x-2">
              { icon }
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                { title }
              </h3>
            </div>
          </div>

          {/* Contenido scrollable con animación de step */ }
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={ currentStep }
                variants={ stepVariants }
                initial="initial"
                animate="animate"
                exit="exit"
                transition={ { duration: 0.3 } }
              >
                { renderStepBody() }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navegación inferior: botones alineados */ }
          <div className="mt-4 flex items-center justify-between w-full px-4">
            { currentStep > 1 ? (
              <button
                onClick={ prevStep }
                className="flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Anterior
              </button>
            ) : (
              <div />
            ) }
            { currentStep < TOTAL_STEPS ? (
              <button
                onClick={ nextStep }
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Siguiente
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={ handleFinish }
                disabled={ isSubmitting }
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                { isSubmitting || isCompressing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Procesando...
                  </>
                ) : (
                  <>
                    Finalizar
                    <CheckIcon className="h-5 w-5 ml-1" />
                  </>
                ) }
              </button>
            ) }
          </div>
        </div>

        {/* Logo de la empresa en la esquina inferior izquierda */ }
        <img
          src={ logo }
          alt="Logo de la empresa"
          className="absolute bottom-4 left-8 h-[40px] w-[40px]"
        />
      </div>
    </div>
  );
};

export default InitialSetupSteps;
