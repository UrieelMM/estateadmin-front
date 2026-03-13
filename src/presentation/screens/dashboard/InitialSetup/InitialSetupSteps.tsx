import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../store/useConfigStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";
import { useFinancialAccountsStore } from "../../../../store/useAccountsStore";
import { useTheme } from "../../../../context/Theme/ThemeContext";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import useClientInvoicesStore from "../../../../store/useClientInvoicesStore";
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
  InformationCircleIcon,
  LockClosedIcon,
  XCircleIcon,
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
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

const InfoTooltip = ( { text }: { text: string; } ) => {
  const [ open, setOpen ] = useState( false );

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={ () => setOpen( true ) }
        onMouseLeave={ () => setOpen( false ) }
        onFocus={ () => setOpen( true ) }
        onBlur={ () => setOpen( false ) }
        onClick={ () => setOpen( ( prev ) => !prev ) }
        className="inline-flex cursor-help text-gray-400 hover:text-indigo-500"
        aria-label="Mostrar ayuda"
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>

      { open && (
        <div className="absolute left-0 top-full mt-2 z-40 w-64 max-w-[calc(100vw-4rem)] rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
          { text }
        </div>
      ) }
    </div>
  );
};

const InitialSetupSteps = () => {
  const TOTAL_STEPS = 7;
  const USERS_IMPORT_TEMPLATE_URL =
    "https://res.cloudinary.com/dz5tntwl1/raw/upload/v1772080563/OmniPixel/plantilla_ejemplo_g7mtmu.xlsx";
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

  // Estado para la factura pendiente del paso 7
  const [ paymentInvoice, setPaymentInvoice ] = useState<{
    id?: string;
    amount: number;
    concept: string;
    invoiceNumber: string;
    dueDate: any;
    nextBillingDate?: any;
    plan?: string;
    status: string;
    message?: string;
    invoiceURL?: string;
  } | null>( null );
  const [ loadingInvoice, setLoadingInvoice ] = useState( false );
  const [ savingBeforePayment, setSavingBeforePayment ] = useState( false );

  // Estado para controlar la UI tras redirección de Stripe
  const [ paymentState, setPaymentState ] = useState<"pending" | "cancel" | "error" | "success">( "pending" );

  const { config, fetchConfig, updateConfig } = useConfigStore();
  const { createAccount } = useFinancialAccountsStore();
  const { initiateStripePayment, checkPaymentStatus } = useClientInvoicesStore();

  const { compressFile, isCompressing } = useFileCompression();

  // Escuchar respuesta de Stripe (redirect de vuelta)
  useEffect( () => {
    const queryParams = new URLSearchParams( window.location.search );
    const status = queryParams.get( "payment" );
    const sessionId = queryParams.get( "session_id" );

    if ( status === "success" && sessionId ) {
      setCurrentStep( 7 ); // Ir directo al paso de pago
      setPaymentState( "success" );

      const verifyAndFinish = async () => {
        setIsSubmitting( true );
        try {
          const paymentInfo = await checkPaymentStatus( sessionId );
          if ( paymentInfo.status === "paid" ) {
            toast.success( "¡Pago procesado exitosamente!" );
            // Ejecutar finalización
            await handleFinish();
          } else {
            setPaymentState( "error" );
            toast.error( "El pago no ha sido completado correctamente" );
            setIsSubmitting( false );
          }
        } catch ( error ) {
          console.error( "Error al verificar el pago:", error );
          setPaymentState( "error" );
          toast.error( "Error al verificar el pago con Stripe." );
          setIsSubmitting( false );
        }
      };

      // Pequeño timeout (2.5s) para dar tiempo a que la config se cargue
      setTimeout( () => verifyAndFinish(), 2500 );
    } else if ( status === "cancel" ) {
      setCurrentStep( 7 ); // Ir directo al paso de pago
      setPaymentState( "cancel" );
      toast.error( "Has cancelado el proceso de pago." );
    }
  }, [] );

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
  // Función para cargar la factura pendiente del cliente
  const loadPaymentInvoice = async () => {
    setLoadingInvoice( true );
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if ( !user ) return;
      const tokenResult = await getIdTokenResult( user );
      const clientId = tokenResult.claims[ "clientId" ] as string;
      const condominiumId = localStorage.getItem( "condominiumId" );
      if ( !clientId || !condominiumId ) return;

      const db = getFirestore();
      const invoicesRef = collection(
        db,
        `clients/${ clientId }/condominiums/${ condominiumId }/invoicesGenerated`
      );
      const q = query(
        invoicesRef,
        where( "paymentStatus", "in", [ "pending", "overdue" ] ),
        orderBy( "createdAt", "desc" ),
        limit( 1 )
      );
      const snap = await getDocs( q );
      if ( !snap.empty ) {
        const data = snap.docs[ 0 ].data();
        setPaymentInvoice( {
          id: snap.docs[ 0 ].id,
          amount: data.amount ?? 0,
          concept: data.concept ?? "Suscripción EstateAdmin",
          invoiceNumber: data.invoiceNumber ?? "",
          dueDate: data.dueDate,
          nextBillingDate: data.nextBillingDate,
          plan: data.plan,
          status: data.paymentStatus ?? "pending",
          message: data.message,
          invoiceURL: data.invoiceURL,
        } );
        setPaymentState( "pending" ); // Ensure state is pending if invoice found
      } else {
        // No hay factura pendiente aún (posible si aún no se generó)
        setPaymentInvoice( null );
        setPaymentState( "pending" ); // No invoice, but still "pending" for the user to proceed
      }
    } catch ( err ) {
      console.error( "Error al cargar factura pendiente:", err );
      setPaymentState( "error" ); // Set error state if loading fails
    } finally {
      setLoadingInvoice( false );
    }
  };

  // Función para avanzar pasos con validaciones
  const nextStep = async () => {
    if ( savingBeforePayment ) return;

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
      if ( !signReportsFile ) {
        toast.error( "La firma para reportes es obligatoria." );
        return;
      }
    } else if ( currentStep === 4 ) {
      const hasName = !!accountData.name.trim();
      const hasType = !!accountData.type.trim();
      const hasDescription = !!accountData.description.trim();
      const hasInitialBalance = Number( accountData.initialBalance || 0 ) > 0;
      const hasAnyAccountInput =
        hasName || hasType || hasDescription || hasInitialBalance;

      if ( hasAnyAccountInput && !hasName ) {
        toast.error(
          "Si deseas registrar una cuenta bancaria, primero captura el nombre."
        );
        return;
      }
      if ( hasName && !hasType ) {
        toast.error( "El tipo de cuenta bancaria es obligatorio." );
        return;
      }
    } else if ( currentStep === 6 ) {
      // Al llegar al paso 7 (pago), guardar datos previos y luego cargar la factura
      const saved = await saveDataBeforePayment();
      if ( !saved ) {
        return;
      }
    }
    setCurrentStep( ( prev ) => prev + 1 );
  };

  // Guardar toda la información de los pasos anteriores antes de ir a pago
  const saveDataBeforePayment = async (): Promise<boolean> => {
    setSavingBeforePayment( true );
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

      // 1. Crear/actualizar documento del usuario
      const userEmail = user.email?.toLowerCase() || "";
      const userCollRef = collection(
        db,
        `clients/${ clientId }/condominiums/${ condominiumId }/users`
      );
      const q = query( userCollRef, where( "email", "==", userEmail ) );
      const snap = await getDocs( q );

      if ( snap.empty ) {
        await addDoc( userCollRef, {
          email: userEmail,
          role: "admin",
          darkMode: isDarkMode,
          createdAt: serverTimestamp(),
          userId: user.uid,
        } );
      } else {
        const userDoc = snap.docs[ 0 ];
        await updateDoc( userDoc.ref, {
          darkMode: isDarkMode,
          userId: user.uid,
        } );
      }

      // 2. Guardar configuración general + imágenes
      const resolvedCompanyAddress = (
        userData.address ||
        config?.address ||
        userData.fullFiscalAddress ||
        ""
      ).trim();

      await updateConfig(
        {
          ...userData,
          address: resolvedCompanyAddress,
          darkMode: isDarkMode,
        },
        logoFile || undefined,
        signReportsFile || undefined,
        logoReportsFile || undefined
      );

      // 3. Crear cuenta financiera solo si viene nombre + tipo y no existe duplicada
      if ( accountData.name.trim() && accountData.type.trim() ) {
        const accountsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "financialAccounts"
        );
        const accountsSnap = await getDocs( accountsRef );
        const normalizedName = accountData.name.trim().toLowerCase();
        const normalizedType = accountData.type.trim().toLowerCase();
        const duplicatedAccount = accountsSnap.docs.some( ( accountDoc ) => {
          const account = accountDoc.data() as Record<string, any>;
          return (
            String( account.name || "" ).trim().toLowerCase() === normalizedName &&
            String( account.type || "" ).trim().toLowerCase() === normalizedType
          );
        } );

        if ( !duplicatedAccount ) {
          await createAccount( {
            name: accountData.name.trim(),
            type: accountData.type.trim(),
            description: accountData.description.trim(),
            initialBalance: Number( accountData.initialBalance || 0 ),
            active: true,
          } );
        }
      }

      toast.success( "Datos guardados correctamente" );

      // 4. Cargar la factura pendiente
      await loadPaymentInvoice();
      return true;
    } catch ( error: any ) {
      console.error( "Error al guardar datos antes de pago:", error );
      toast.error( error.message || "Error al guardar los datos previos" );
      return false;
    } finally {
      setSavingBeforePayment( false );
    }
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

      // 2. No volvemos a escribir la configuración general aquí para evitar
      // sobrescribir accidentalmente los datos confirmados en pasos previos.
      // La info de empresa e imágenes ya se guarda en saveDataBeforePayment.

      // 3. Marcar configuración inicial como completada
      const configDocRef = doc( db, "clients", clientId );
      await setDoc(
        configDocRef,
        {
          initialSetupCompleted: true,
        },
        { merge: true }
      );

      toast.success( "¡Configuración inicial completada!" );

      // 4. Redirigir después de un breve delay
      setTimeout( () => {
        window.location.href = "/dashboard/home";
      }, 1500 );
    } catch ( error: any ) {
      console.error( "Error al finalizar configuración:", error );
      toast.error( error.message || "Error al completar la configuración" );
      setIsSubmitting( false );
    }
  };

  // Handler para pagar la factura con Stripe enviando URLs customizadas
  const handlePayInvoice = async () => {
    if ( !paymentInvoice ) return;

    try {
      setIsSubmitting( true );

      const currentDomain = window.location.origin || "http://localhost:3000";
      const customSuccessUrl = `${ currentDomain }${ window.location.pathname }?payment=success`;
      const customCancelUrl = `${ currentDomain }${ window.location.pathname }?payment=cancel`;

      // Necesitamos pasarle el ID real (document id de Firestore) a initiateStripePayment
      // Como paymentInvoice actualmente no tiene "id", usamos la búsqueda si es necesario o asumimos que lo tenemos.
      // OJO: Modifica loadPaymentInvoice arriba para que incluya `id: doc.id` al obj paymentInvoice
      if ( !paymentInvoice.id ) {
        toast.error( "Error: ID de factura no encontrado" );
        setIsSubmitting( false );
        return;
      }

      // Requerimos que paymentInvoice de InitialSetup cumpla con la interfaz ClientInvoice
      const invoiceDataToPay: any = {
        ...paymentInvoice,
        clientId: ( await getIdTokenResult( ( getAuth() ).currentUser! ) ).claims[ "clientId" ],
        condominiumId: localStorage.getItem( "condominiumId" ),
      };

      const { url } = await initiateStripePayment(
        invoiceDataToPay,
        customSuccessUrl,
        customCancelUrl
      );

      if ( url ) {
        window.location.href = url;
      } else {
        toast.error( "No se pudo iniciar el pago" );
        setIsSubmitting( false );
      }
    } catch ( error ) {
      console.error( "Error al iniciar pago:", error );
      toast.error( "Error al iniciar el proceso de pago." );
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
          title: "Cuenta financiera (opcional)",
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
      case 7:
        return {
          title: "Completa tu pago",
          icon: <CreditCardIcon className="h-8 w-8 text-indigo-400" />,
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
    { label: "Cuenta" },
    { label: "Tema" },
    { label: "Plantilla" },
    { label: "Pago" },
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
              <div className="mb-1 flex items-center gap-1">
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Logo Corporativo
                </label>
                <InfoTooltip text="Se muestra en el sistema (barra superior y elementos de identidad visual del condominio/cliente)." />
              </div>
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
              <div className="mb-1 flex items-center gap-1">
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Logo para Reportes <span className="text-xs text-gray-500">(Opcional)</span>
                </label>
                <InfoTooltip text="Se usa en encabezados de PDF/Excel. Si no se carga, se utiliza el estilo por defecto del sistema." />
              </div>
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
              <div className="mb-1 flex items-center gap-1">
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Firma para Reportes
                </label>
                <InfoTooltip text="Firma que se imprime en reportes del sistema para validar su emisión." />
              </div>
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
                  Tipo { accountData.name && <span className="text-red-500">*</span> }
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
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Puedes cambiarlo en cualquier momento en la sección de Configuración.
              </span>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Importante: para el registro masivo, únicamente la columna
                    <strong> name / nombre</strong> es obligatoria. El resto de
                    campos son opcionales.
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
      case 7: {
        const formatMXN = ( n: number ) =>
          n.toLocaleString( "es-MX", { style: "currency", currency: "MXN" } );
        const dueLabel = paymentInvoice?.dueDate
          ? ( paymentInvoice.dueDate.toDate
            ? paymentInvoice.dueDate.toDate()
            : new Date( paymentInvoice.dueDate )
          ).toLocaleDateString( "es-MX", { dateStyle: "long" } )
          : null;

        const nextBillingLabel = paymentInvoice?.nextBillingDate
          ? ( paymentInvoice.nextBillingDate.toDate
            ? paymentInvoice.nextBillingDate.toDate()
            : new Date( paymentInvoice.nextBillingDate )
          ).toLocaleDateString( "es-MX", { dateStyle: "long" } )
          : null;

        return (
          <div className="space-y-5 flex flex-col items-center max-w-lg mx-auto w-full">
            {/* Loading de guardado previo */ }
            { savingBeforePayment && (
              <div className="w-full rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center shadow-lg border border-indigo-100 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-800">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Guardando tu información...</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Estamos guardando los datos de los pasos anteriores antes de continuar al pago. Por favor, no cierres esta ventana.
                  </p>
                </div>
              </div>
            ) }

            {/* Si está en proceso exitoso */ }
            { !savingBeforePayment && paymentState === "success" && (
              <div className="w-full rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center shadow-lg border border-green-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
                <div className="bg-green-100 dark:bg-green-800/50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Pago en proceso!</h2>
                <p className="text-gray-600 dark:text-gray-300">Estamos verificando tu pago con Stripe. Por favor, no cierres esta ventana.</p>
                <div className="mt-6 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent align-[[-0.125em]]" />
                </div>
              </div>
            ) }

            {/* Si canceló o falló */ }
            { !savingBeforePayment && ( paymentState === "cancel" || paymentState === "error" ) && (
              <div className="w-full rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-8 text-center shadow-lg border border-red-100 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800">
                <div className="bg-red-100 dark:bg-red-800/50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  { paymentState === "cancel" ? "Pago Cancelado" : "Error en el Pago" }
                </h2>
                <div className="h-1 w-12 bg-red-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
                  { paymentState === "cancel"
                    ? "Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu tarjeta."
                    : "Hubo un problema procesando tu pago. Por favor, revisa tus datos o intenta más tarde." }
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={ handlePayInvoice }
                    disabled={ isSubmitting || loadingInvoice }
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 shadow-md"
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    Reintentar Pago
                  </button>
                  <a
                    href="mailto:soporte@estate-admin.com?subject=Problemas%20con%20el%20pago%20de%20InitialSetup"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    Contactar a Soporte
                  </a>
                </div>
              </div>
            ) }

            { !savingBeforePayment && paymentState === "pending" && (
              <>
                {/* Hero amigable */ }
                <div className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg">
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" /> ¡Ya casi terminas!
                  </p>
                  <p className="mt-2 text-sm leading-snug">
                    Solo falta un último paso: <span className="font-bold">completa tu pago</span> para comenzar a vivir la experiencia EstateAdmin.
                  </p>
                  <p className="mt-2 text-xs text-indigo-100">
                    Una vez confirmado tu pago, tendrás acceso completo a todas
                    las funciones de tu tablero de administración.
                  </p>
                </div>

                {/* Tarjeta de factura */ }
                { loadingInvoice ? (
                  <div className="animate-pulse space-y-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                ) : paymentInvoice ? (
                  <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-lg dark:border-indigo-900 dark:bg-gray-800">
                    {/* Header de la tarjeta */ }
                    <div className="flex items-center justify-between border-b border-indigo-50 bg-indigo-50/50 px-5 py-3 dark:border-indigo-900/50 dark:bg-indigo-900/20">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Factura { paymentInvoice.invoiceNumber }
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Pendiente de pago
                      </span>
                    </div>

                    {/* Monto prominente */ }
                    <div className="px-5 py-5">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total a pagar</p>
                      <p className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        { formatMXN( paymentInvoice.amount ) }
                        <span className="ml-2 text-base font-normal text-gray-400">MXN</span>
                      </p>

                      {/* Detalle del concepto */ }
                      <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Concepto</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            { paymentInvoice.concept }
                          </span>
                        </div>
                        { paymentInvoice.plan && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Plan / Unidades</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              { paymentInvoice.plan } uds.
                            </span>
                          </div>
                        ) }
                        { dueLabel && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Fecha límite</span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              { dueLabel }
                            </span>
                          </div>
                        ) }
                        { nextBillingLabel && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Próximo cobro</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              { nextBillingLabel }
                            </span>
                          </div>
                        ) }
                      </div>

                      { paymentInvoice.message && (
                        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <InformationCircleIcon className="mb-0.5 inline h-4 w-4 mr-1" />
                          { paymentInvoice.message }
                        </div>
                      ) }

                      {/* Botones */ }
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={ handlePayInvoice }
                          disabled={ isSubmitting }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                          Pagar factura
                        </button>
                        { paymentInvoice.invoiceURL && (
                          <a
                            href={ paymentInvoice.invoiceURL }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Descargar factura
                          </a>
                        ) }
                        <a
                          href="mailto:soporte@estate-admin.com?subject=Problemas%20con%20el%20pago%20de%20suscripción"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          Contactar para asistencia
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center shadow-lg border border-green-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
                    <div className="bg-green-100 dark:bg-green-800/50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Todo listo!</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Tu cuenta está al corriente. Puedes finalizar tu configuración.
                    </p>
                  </div>
                ) }

                {/* Sello de seguridad */ }
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <LockClosedIcon className="h-3.5 w-3.5" />
                  Tus datos de pago están protegidos con cifrado de extremo a extremo.
                </div>
              </>
            ) }
          </div>
        );
      }
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
                disabled={ savingBeforePayment || isSubmitting }
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            ) : ( !paymentInvoice || paymentState === "success" ) ? (
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
            ) : (
              <div />
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
