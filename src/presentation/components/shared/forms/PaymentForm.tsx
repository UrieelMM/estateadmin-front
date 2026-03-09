import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition, Dialog, Combobox } from "@headlessui/react";
import {
  PhotoIcon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClipboardIcon,
  CalendarIcon,
} from "@heroicons/react/16/solid";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { usePaymentStore } from "../../../../store/usePaymentStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { usePaymentSummaryStore } from "../../../../store/paymentSummaryStore";
import { useUnidentifiedPaymentsStore } from "../../../../store/useUnidentifiedPaymentsStore";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";

interface FormParcelReceptionProps {
  open: boolean;
  setOpen: ( open: boolean ) => void;
}

interface SelectedCharge {
  chargeId: string;
  amount: number;
}

const PaymentForm = ( { open, setOpen }: FormParcelReceptionProps ) => {
  const RECIPIENT_LOCALSTORAGE_PREFIX = "paymentForm:selectedRecipientUid";
  const RECIPIENT_SORT_LOCALSTORAGE_PREFIX = "paymentForm:recipientSortOrder";
  // Estados generales
  const [ users, setUsers ] = useState<UserData[]>( [] );
  const [ loading, setLoading ] = useState<boolean>( false );
  const currentCondominiumId = useCondominiumStore(
    ( state ) => state.selectedCondominium?.id
  );

  // Campos del formulario
  const [ email, setEmail ] = useState<string>( "" );
  const [ numberCondominium, setNumberCondominium ] = useState<string>( "" );
  const [ recipientSearch, setRecipientSearch ] = useState<string>( "" );
  const [ pendingRecipientRestoreUid, setPendingRecipientRestoreUid ] =
    useState<string>( "" );
  const [ recipientSortOrder, setRecipientSortOrder ] = useState<"" | "asc" | "desc">( "" );
  const recipientComboboxInputRef = useRef<HTMLInputElement | null>( null );
  const recipientComboboxButtonRef = useRef<HTMLButtonElement | null>( null );

  // Monto abonado: valor raw y su versión visual formateada
  const [ amountPaid, setAmountPaid ] = useState<string>( "" );
  const [ amountPaidDisplay, setAmountPaidDisplay ] = useState<string>( "" );

  // Monto pendiente: ahora se calcula automáticamente basado en los cargos seleccionados
  const [ amountPending, setAmountPending ] = useState<string>( "" );
  const [ amountPendingDisplay, setAmountPendingDisplay ] = useState<string>( "" );

  const [ comments, setComments ] = useState<string>( "" );
  const [ paymentType, setPaymentType ] = useState<string>( "" );
  const [ paymentReference, setPaymentReference ] = useState<string>( "" );
  // const [ autoDownloadReceipt, setAutoDownloadReceipt ] = useState<boolean>( false );

  // Fecha y hora de pago (se almacena como Date)
  const [ paymentDate, setPaymentDate ] = useState<Date | null>( null );

  // ID de la cuenta financiera
  const [ financialAccountId, setFinancialAccountId ] = useState<string>( "" );

  // Estado para pago NO identificado
  const [ isUnidentifiedPayment, setIsUnidentifiedPayment ] =
    useState<boolean>( false );

  // Archivo adjunto
  const [ file, setFile ] = useState<File | File[] | null>( null );
  const [ fileName, setFileName ] = useState( "" );

  // Usuario seleccionado y uso de saldo a favor
  const [ selectedUser, setSelectedUser ] = useState<UserData | null>( null );
  const [ useCreditBalance, setUseCreditBalance ] = useState<boolean>( false );

  // Estado para cargos seleccionados
  const [ selectedCharges, setSelectedCharges ] = useState<SelectedCharge[]>( [] );
  // Estado para almacenar los valores visuales de cada cargo (por su id)
  const [ chargeDisplayValues, setChargeDisplayValues ] = useState<{
    [ key: string ]: string;
  }>( {} );

  // Stores
  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore( ( state ) => state.condominiumsUsers );

  const {
    charges,
    addMaintenancePayment,
    fetchUserCharges,
    financialAccounts,
    fetchFinancialAccounts,
    userCreditBalance,
  } = usePaymentStore( ( state ) => ( {
    charges: state.charges,
    addMaintenancePayment: state.addMaintenancePayment,
    fetchUserCharges: state.fetchUserCharges,
    financialAccounts: state.financialAccounts,
    fetchFinancialAccounts: state.fetchFinancialAccounts,
    userCreditBalance: state.userCreditBalance,
  } ) );

  const { fetchSummary, selectedYear, setupRealtimeListeners } =
    usePaymentSummaryStore( ( state ) => ( {
      fetchSummary: state.fetchSummary,
      selectedYear: state.selectedYear,
      setupRealtimeListeners: state.setupRealtimeListeners,
    } ) );

  const { fetchPayments } = useUnidentifiedPaymentsStore();

  const { compressFile, isCompressing } = useFileCompression();
  const recipientStorageKey = useMemo(
    () =>
      `${ RECIPIENT_LOCALSTORAGE_PREFIX }:${ currentCondominiumId || "default" }`,
    [ RECIPIENT_LOCALSTORAGE_PREFIX, currentCondominiumId ]
  );
  const recipientSortStorageKey = useMemo(
    () =>
      `${ RECIPIENT_SORT_LOCALSTORAGE_PREFIX }:${ currentCondominiumId || "default" }`,
    [ RECIPIENT_SORT_LOCALSTORAGE_PREFIX, currentCondominiumId ]
  );

  useEffect( () => {
    if ( open ) {
      fetchCondominiumsUsers();
      fetchFinancialAccounts();
      setRecipientSearch( "" );
      const savedRecipientUid = localStorage.getItem( recipientStorageKey );
      setPendingRecipientRestoreUid( savedRecipientUid || "" );
      const savedSortOrder = localStorage.getItem( recipientSortStorageKey );
      if ( savedSortOrder === "asc" || savedSortOrder === "desc" ) {
        setRecipientSortOrder( savedSortOrder );
      } else {
        setRecipientSortOrder( "" );
      }
    }
  }, [
    fetchCondominiumsUsers,
    fetchFinancialAccounts,
    open,
    currentCondominiumId,
    recipientStorageKey,
    recipientSortStorageKey,
  ] );

  // Efecto para mantener actualizado el selectedUser
  useEffect( () => {
    if ( selectedUser ) {
      const updatedUser = condominiumsUsers.find(
        ( u ) => u.uid === selectedUser.uid
      );
      if ( updatedUser ) {
        setSelectedUser( updatedUser );
      } else {
        // Resetear el usuario seleccionado si ya no está disponible en el nuevo condominio
        setSelectedUser( null );
        setEmail( "" );
        setNumberCondominium( "" );
      }
    }

    // Actualizar la lista de usuarios cuando cambie condominiumsUsers
    setUsers( condominiumsUsers );
  }, [ condominiumsUsers, selectedUser?.uid ] );

  // Helper para formatear a pesos mexicanos
  const formatCurrency = ( value: number ) =>
    new Intl.NumberFormat( "es-MX", {
      style: "currency",
      currency: "MXN",
    } ).format( value );


  // Descarga automática de recibo deshabilitada temporalmente en PaymentForm.
  // Se conserva como referencia para reactivación futura cuando se habilite UX.
  // const PAYMENT_RECEIPT_ENDPOINT = "https://us-central1-administracioncondominio-93419.cloudfunctions.net/getPaymentReceipt";
  // const wait = ( ms: number ) => new Promise( ( resolve ) => window.setTimeout( resolve, ms ) );
  // const resolveReceiptUrlFromBackend = async (paymentGroupId: string, attempts = 4): Promise<string | null> => { ... };
  // const downloadReceiptByUrl = async (url: string) => { ... };

  const availableUsers = useMemo(
    () =>
      users.filter(
        ( user ) =>
          user.role !== "admin" &&
          user.role !== "super-admin" &&
          user.role !== "security"
      ),
    [ users ]
  );

  useEffect( () => {
    if ( !open || !pendingRecipientRestoreUid ) return;

    const userExists = availableUsers.some(
      ( user ) => user.uid === pendingRecipientRestoreUid
    );

    if ( !userExists ) {
      localStorage.removeItem( recipientStorageKey );
      setPendingRecipientRestoreUid( "" );
      return;
    }

    setPendingRecipientRestoreUid( "" );
    handleRecipientSelection( pendingRecipientRestoreUid );
  }, [ open, pendingRecipientRestoreUid, availableUsers, recipientStorageKey ] );

  useEffect( () => {
    if ( !open ) return;
    if ( selectedUser?.uid ) {
      localStorage.setItem( recipientStorageKey, selectedUser.uid );
    }
  }, [ open, recipientStorageKey, selectedUser?.uid ] );

  useEffect( () => {
    if ( !open ) return;
    if ( recipientSortOrder ) {
      localStorage.setItem( recipientSortStorageKey, recipientSortOrder );
      return;
    }
    localStorage.removeItem( recipientSortStorageKey );
  }, [ open, recipientSortOrder, recipientSortStorageKey ] );

  const filteredUsers = useMemo( () => {
    const normalizeSearchText = ( value: string ) =>
      String( value || "" )
        .normalize( "NFD" )
        .replace( /[\u0300-\u036f]/g, "" )
        .toLowerCase()
        .trim();
    const compactSearchText = ( value: string ) =>
      normalizeSearchText( value ).replace( /[^a-z0-9]/g, "" );
    const normalizeTowerValue = ( value: string ) => {
      const normalized = normalizeSearchText( value );
      return normalized.replace( /^torre\s*/g, "" ).trim();
    };
    const term = normalizeSearchText( recipientSearch );
    const compactTerm = compactSearchText( recipientSearch );
    const towerTerm = normalizeTowerValue( recipientSearch );
    const compactTowerTerm = compactSearchText( towerTerm );

    const usersFiltered = !term
      ? availableUsers
      : availableUsers.filter( ( user ) => {
        const number = normalizeSearchText( user.number || "" );
        const compactNumber = compactSearchText( user.number || "" );
        const name = normalizeSearchText( user.name || "" );
        const lastName = normalizeSearchText( user.lastName || "" );
        const fullName = `${ name } ${ lastName }`.trim();
        const compactName = compactSearchText( user.name || "" );
        const compactLastName = compactSearchText( user.lastName || "" );
        const compactFullName = `${ compactName }${ compactLastName }`;
        const rawTower = String( user.tower || "" );
        const tower = normalizeSearchText( rawTower );
        const normalizedTower = normalizeTowerValue( rawTower );
        const compactTower = compactSearchText( rawTower );
        const compactNormalizedTower = compactSearchText( normalizedTower );
        return (
          number.includes( term ) ||
          compactNumber.includes( compactTerm ) ||
          name.includes( term ) ||
          fullName.includes( term ) ||
          compactName.includes( compactTerm ) ||
          compactFullName.includes( compactTerm ) ||
          tower.includes( term ) ||
          normalizedTower.includes( towerTerm ) ||
          compactTower.includes( compactTerm ) ||
          compactNormalizedTower.includes( compactTowerTerm )
        );
      } );

    if ( recipientSortOrder === "" ) return usersFiltered;

    const sortedUsers = [ ...usersFiltered ].sort( ( a, b ) => {
      const numberA = String( a.number || "" );
      const numberB = String( b.number || "" );
      const comparison = numberA.localeCompare( numberB, "es", {
        numeric: true,
        sensitivity: "base",
      } );
      return recipientSortOrder === "asc" ? comparison : -comparison;
    } );

    return sortedUsers;
  }, [ availableUsers, recipientSearch, recipientSortOrder ] );

  const selectableFinancialAccounts = useMemo( () => {
    const normalize = ( value: string ) =>
      value
        .normalize( "NFD" )
        .replace( /[\u0300-\u036f]/g, "" )
        .toLowerCase()
        .replace( /[^a-z0-9]/g, "" )
        .trim();
    return financialAccounts.filter( ( acc ) => {
      const accountName = normalize( acc.name || "" );
      return accountName !== "cajachica";
    } );
  }, [ financialAccounts ] );

  const handleRecipientSelection = async ( uid: string ) => {
    const user = users.find( ( u ) => u.uid === uid );
    if ( user ) {
      setEmail( user.email );
      setNumberCondominium( user.number || "" );
      setSelectedUser( user );
      if ( user.number ) {
        try {
          // Actualizar cargos y datos del usuario en paralelo
          await Promise.all( [
            fetchUserCharges( user.number ),
            fetchCondominiumsUsers(),
          ] );
          // Obtener el usuario actualizado del store
          const updatedUser = condominiumsUsers.find( ( u ) => u.uid === uid );
          if ( updatedUser ) {
            setSelectedUser( updatedUser );
          }
        } catch ( err ) {
          console.error( "Error actualizando datos del usuario:", err );
          toast.error( "Error al cargar los datos del usuario" );
        }
      }
      setSelectedCharges( [] );
    }
  };

  const selectedRecipientUid =
    selectedUser?.uid ||
    users.find( ( u ) => u.number === numberCondominium )?.uid ||
    "";

  const handleRecipientSortOrderChange = ( value: "" | "asc" | "desc" ) => {
    setRecipientSortOrder( value );
    if ( isUnidentifiedPayment ) return;
    requestAnimationFrame( () => {
      recipientComboboxInputRef.current?.focus();
    } );
  };

  const getRecipientLabel = ( uid: string ) => {
    const user = availableUsers.find( ( u ) => u.uid === uid );
    if ( !user ) return "";
    const towerValue = String( user.tower || "" ).trim();
    const normalizedTowerLabel = towerValue
      ? towerValue.replace( /^torre\s*/i, "" ).trim()
      : "";
    const towerLabel = normalizedTowerLabel
      ? ` · Torre ${ normalizedTowerLabel }`
      : "";
    return `${ user.number || "-" } ${ user.name || "" }${ towerLabel }`.trim();
  };

  const handleToggleCharge = ( chargeId: string, checked: boolean ) => {
    if ( checked ) {
      setSelectedCharges( ( prev ) => [ ...prev, { chargeId, amount: 0 } ] );
    } else {
      setSelectedCharges( ( prev ) =>
        prev.filter( ( sc ) => sc.chargeId !== chargeId )
      );
    }
  };

  const handleAmountChange = ( chargeId: string, newAmount: number ) => {
    setSelectedCharges( ( prev ) =>
      prev.map( ( sc ) =>
        sc.chargeId === chargeId ? { ...sc, amount: newAmount } : sc
      )
    );
  };

  // Sumar montos asignados
  const totalAssigned = selectedCharges.reduce( ( sum, sc ) => sum + sc.amount, 0 );

  // Calcular el total pendiente sumando todos los cargos seleccionados
  // Este es el monto total original de los cargos seleccionados
  // Los montos en charges están en centavos, debemos convertirlos a pesos
  const totalPendingOriginal = selectedCharges.reduce( ( sum, sc ) => {
    const charge = charges.find( ( c ) => c.id === sc.chargeId );
    // Convertir de centavos a pesos (dividir por 100)
    return sum + ( charge ? charge.amount / 100 : 0 );
  }, 0 );

  // Actualizar el monto pendiente cuando cambian los cargos seleccionados
  useEffect( () => {
    // Solo actualizar si hay cargos seleccionados y no es un pago no identificado
    if ( selectedCharges.length > 0 && !isUnidentifiedPayment ) {
      // El monto pendiente es la suma de los montos originales de los cargos menos lo que pagamos ahora
      const pending = totalPendingOriginal - totalAssigned;
      setAmountPending( pending.toString() );
      setAmountPendingDisplay( formatCurrency( pending ) );
    } else if ( selectedCharges.length === 0 ) {
      setAmountPending( "" );
      setAmountPendingDisplay( "" );
    }
  }, [
    selectedCharges,
    totalAssigned,
    totalPendingOriginal,
    isUnidentifiedPayment,
    charges,
  ] );

  // Convertir el saldo a favor del usuario (que viene en centavos) a pesos
  const userCreditInPesos = userCreditBalance
    ? Number( userCreditBalance ) / 100
    : 0;

  // Si se usa crédito, sumar el saldo convertido
  const effectiveTotal = useCreditBalance
    ? Number( amountPaid ) + userCreditInPesos
    : Number( amountPaid );

  // Calcular el crédito usado
  const creditUsed = useCreditBalance ? userCreditInPesos : 0;

  const remainingEffective = effectiveTotal - totalAssigned;

  const handleSubmit = async ( event: React.FormEvent<HTMLFormElement> ) => {
    event.preventDefault();
    setLoading( true );

    try {
      // Validaciones iniciales
      if ( !paymentDate ) {
        throw new Error( "La fecha de pago es obligatoria." );
      }
      if ( !financialAccountId ) {
        throw new Error( "La cuenta es obligatoria." );
      }
      if ( !amountPaid && !useCreditBalance ) {
        throw new Error( "El campo 'monto abonado' es obligatorio." );
      }
      if ( !paymentType ) {
        throw new Error( "El campo 'tipo de pago' es obligatorio." );
      }
      const normalizedPaymentReference = paymentReference
        .trim()
        .toUpperCase();
      if (
        [ "Transferencia", "Depósito" ].includes( paymentType ) &&
        !normalizedPaymentReference
      ) {
        throw new Error(
          "La referencia es obligatoria para pagos por transferencia o depósito."
        );
      }

      // Validaciones para pago identificado
      if ( !isUnidentifiedPayment ) {
        if ( selectedCharges.length === 0 ) {
          throw new Error(
            "Debes seleccionar al menos un cargo para aplicar el pago."
          );
        }
        if ( useCreditBalance ) {
          if (
            Number( effectiveTotal ).toFixed( 2 ) !==
            Number( totalAssigned ).toFixed( 2 )
          ) {
            throw new Error(
              "En pago con saldo a favor, la suma de montos asignados debe ser igual a (monto abonado + crédito disponible)."
            );
          }
        } else {
          if (
            Number( amountPaid ).toFixed( 2 ) !== Number( totalAssigned ).toFixed( 2 )
          ) {
            throw new Error(
              "El monto abonado debe coincidir exactamente con la suma de los cargos asignados."
            );
          }
        }
        if (
          useCreditBalance &&
          ( !userCreditBalance || Number( userCreditBalance ) / 100 <= 0 )
        ) {
          throw new Error( "No tienes saldo a favor disponible." );
        }
      }

      // Extraer los conceptos y el campo startAt de los cargos seleccionados
      const concepts = selectedCharges.map( ( sc ) => {
        const foundCharge = charges.find( ( c ) => c.id === sc.chargeId );
        return foundCharge ? foundCharge.concept : "";
      } );
      const startAts = selectedCharges
        .map( ( sc ) => {
          const foundCharge = charges.find( ( c ) => c.id === sc.chargeId );
          return foundCharge ? foundCharge.startAt : "";
        } )
        .filter( ( startAt ): startAt is string => startAt !== undefined );
      const paymentGroupId = `${ Date.now() }-${ Math.random()
        .toString( 36 )
        .substring( 2, 15 ) }`;

      const paymentObj = {
        email,
        numberCondominium,
        amountPaid: Number( amountPaid ),
        amountPending: Number( amountPending ),
        comments,
        file,
        selectedCharges,
        useCreditBalance,
        paymentType,
        paymentDate: paymentDate.toISOString(),
        financialAccountId,
        creditUsed,
        isUnidentifiedPayment,
        paymentReference: normalizedPaymentReference,
        concepts, // Se envía el concepto del cargo
        startAts, // Ahora es string[]
        paymentGroupId,
        ...( !isUnidentifiedPayment &&
          String( selectedUser?.tower || "" ).trim().length > 0 && {
          towerSnapshot: String( selectedUser?.tower || "" ).trim(),
        } ),
        ...( isUnidentifiedPayment && { appliedToUser: false } ),
      };

      // Intentar registrar el pago
      await addMaintenancePayment( paymentObj );

      // Actualizar datos en paralelo
      await Promise.all(
        [
          setupRealtimeListeners( selectedYear ),
          fetchSummary( selectedYear ),
          fetchUserCharges( numberCondominium ),
          fetchCondominiumsUsers(),
          isUnidentifiedPayment && fetchPayments(),
        ].filter( Boolean )
      );

      // Descarga automática de recibo deshabilitada temporalmente.

      // Resetear el formulario y notificar
      resetForm();
      toast.success( "Pago registrado correctamente" );
      setOpen( false );
    } catch ( error: any ) {
      console.error( "Error en el proceso de pago:", error );
      toast.error(
        error.message ||
        "Error al procesar el pago. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading( false );
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setEmail( "" );
    setNumberCondominium( "" );
    setAmountPaid( "" );
    setAmountPaidDisplay( "" );
    // El saldo pendiente ahora se calcula automáticamente basado en los cargos seleccionados
    setComments( "" );
    setPaymentType( "" );
    setPaymentReference( "" );
    setFile( null );
    setFileName( "" );
    setSelectedCharges( [] );
    setChargeDisplayValues( {} );
    setSelectedUser( null );
    setUseCreditBalance( false );
    setPaymentDate( null );
    setFinancialAccountId( "" );
    setIsUnidentifiedPayment( false );
    setRecipientSearch( "" );
    // setAutoDownloadReceipt( false );
  };

  const dropzoneOptions = {
    accept: {
      "application/vnd.ms-excel": [ ".xls" ],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "image/*": [ ".png", ".jpg", ".jpeg" ],
      "application/pdf": [ ".pdf" ],
    },
    onDrop: async ( acceptedFiles: File[] ) => {
      const originalFile = acceptedFiles[ 0 ];
      if ( originalFile ) {
        try {
          const processedFile = await compressFile( originalFile );
          setFile( processedFile );
          setFileName( processedFile.name );
          toast.success( "Archivo procesado correctamente" );
        } catch ( error ) {
          console.error( "Error processing file:", error );
          setFile( originalFile );
          setFileName( originalFile.name );
          toast.error( "Error al procesar el archivo, se usará el original" );
        }
      }
    },
  };
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone( dropzoneOptions );

  const handlePaymentTypeChange = ( isUnidentified: boolean ) => {
    setIsUnidentifiedPayment( isUnidentified );

    if ( isUnidentified ) {
      // Resetear campos cuando se cambia a pago no identificado
      setEmail( "" );
      setNumberCondominium( "" );
      setSelectedUser( null );
      setSelectedCharges( [] );
      setAmountPending( "" );
      setAmountPendingDisplay( "" );
      setUseCreditBalance( false );
    }
  };

  return (
    <Transition.Root show={ open } as={ Fragment }>
      <Dialog as="div" className="relative z-10" onClose={ setOpen }>
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={ Fragment }
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form
                    onSubmit={ handleSubmit }
                    className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  >
                    <div className="h-0 flex-1 overflow-y-auto dark:bg-gray-900">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Registrar pago
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={ () => setOpen( false ) }
                            >
                              <span className="absolute -inset-2.5" />
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            Registra un nuevo pago para un condómino.
                          </p>
                        </div>
                        <div className="mt-4">
                          <span className="block text-sm font-medium leading-6 text-white">
                            Tipo de registro
                          </span>
                          <div className="mt-2 flex items-center space-x-4">
                            <label className="flex items-center text-white">
                              <input
                                type="radio"
                                name="paymentIdentification"
                                value="identified"
                                checked={ !isUnidentifiedPayment }
                                onChange={ () => handlePaymentTypeChange( false ) }
                                className="mr-2"
                              />
                              Pago identificado
                            </label>
                            <label className="flex items-center text-white">
                              <input
                                type="radio"
                                name="paymentIdentification"
                                value="unidentified"
                                checked={ isUnidentifiedPayment }
                                onChange={ () => handlePaymentTypeChange( true ) }
                                className="mr-2"
                              />
                              Pago no identificado
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            {/* Seleccionar condómino */ }
                            <div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label
                                  htmlFor="nameRecipient"
                                  className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                                >
                                  Condómino
                                </label>
                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor="recipientSortOrder"
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                  >
                                    Orden por
                                  </label>
                                  <select
                                    id="recipientSortOrder"
                                    value={ recipientSortOrder }
                                    onChange={ ( e ) =>
                                      handleRecipientSortOrderChange(
                                        e.target.value as "" | "asc" | "desc"
                                      )
                                    }
                                    disabled={ isUnidentifiedPayment }
                                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:disabled:bg-gray-700"
                                  >
                                    <option value="">Sin orden</option>
                                    <option value="asc">Ascendente</option>
                                    <option value="desc">Descendente</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2 relative">
                                <Combobox
                                  value={ selectedRecipientUid }
                                  onChange={ ( uid: string ) => {
                                    if ( !uid ) {
                                      localStorage.removeItem( recipientStorageKey );
                                      setSelectedUser( null );
                                      setEmail( "" );
                                      setNumberCondominium( "" );
                                      setSelectedCharges( [] );
                                      return;
                                    }
                                    setRecipientSearch( "" );
                                    handleRecipientSelection( uid );
                                  } }
                                  disabled={ isUnidentifiedPayment }
                                >
                                  <div className="relative">
                                    <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2 z-10">
                                      <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Combobox.Input
                                      ref={ recipientComboboxInputRef }
                                      id="nameRecipient"
                                      name="nameRecipient"
                                      className="px-8 pr-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                      displayValue={ ( uid: string ) =>
                                        getRecipientLabel( uid )
                                      }
                                      onChange={ ( event ) =>
                                        setRecipientSearch( event.target.value )
                                      }
                                      onFocus={ () =>
                                        recipientComboboxButtonRef.current?.click()
                                      }
                                      placeholder="Buscar por nombre, número o torre"
                                    />
                                    <Combobox.Button
                                      ref={ recipientComboboxButtonRef }
                                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                                    >
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                    </Combobox.Button>
                                  </div>

                                  <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    <Combobox.Option
                                      value=""
                                      className={ ( { active } ) =>
                                        `relative cursor-default select-none py-2 pl-8 pr-4 ${ active
                                          ? "bg-indigo-600 text-white"
                                          : "text-gray-900 dark:text-gray-100"
                                        }`
                                      }
                                    >
                                      -- Selecciona un condómino --
                                    </Combobox.Option>

                                    { filteredUsers.length === 0 ? (
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                        Sin resultados
                                      </div>
                                    ) : (
                                      filteredUsers.map( ( user ) => (
                                        <Combobox.Option
                                          key={ user.uid }
                                          value={ user.uid }
                                          className={ ( { active } ) =>
                                            `relative cursor-default select-none py-2 pl-8 pr-4 ${ active
                                              ? "bg-indigo-600 text-white"
                                              : "text-gray-900 dark:text-gray-100"
                                            }`
                                          }
                                        >
                                          { ( { active } ) => (
                                            <>
                                              <span
                                                className={ `block truncate ${ selectedRecipientUid ===
                                                  user.uid
                                                  ? "font-medium"
                                                  : "font-normal"
                                                  }` }
                                              >
                                                { user.number || "-" } { user.name }
                                              </span>
                                              <span
                                                className={ `block truncate text-xs ${ active
                                                  ? "text-indigo-100"
                                                  : "text-gray-500 dark:text-gray-400"
                                                  }` }
                                              >
                                                { String( user.tower || "" ).trim().length > 0
                                                  ? `Torre ${ String( user.tower || "" )
                                                    .replace( /^torre\s*/i, "" )
                                                    .trim() }`
                                                  : "Sin torre" }
                                              </span>
                                              { selectedRecipientUid ===
                                                user.uid && (
                                                  <span
                                                    className={ `absolute inset-y-0 left-0 flex items-center pl-2 ${ active
                                                      ? "text-white"
                                                      : "text-indigo-600"
                                                      }` }
                                                  >
                                                    <CheckIcon className="h-4 w-4" />
                                                  </span>
                                                ) }
                                            </>
                                          ) }
                                        </Combobox.Option>
                                      ) )
                                    ) }
                                  </Combobox.Options>
                                </Combobox>
                              </div>
                            </div>
                            {/* Fecha y hora de pago */ }
                            <div>
                              <label
                                htmlFor="paymentDate"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Fecha y hora de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  onChange={ ( e ) => {
                                    const selectedDate = new Date(
                                      e.target.value + "T00:00:00"
                                    );
                                    setPaymentDate( selectedDate );
                                  } }
                                  type="date"
                                  name="paymentDate"
                                  id="paymentDate"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={
                                    paymentDate && !isNaN( paymentDate.getTime() )
                                      ? paymentDate.toISOString().split( "T" )[ 0 ]
                                      : ""
                                  }
                                />
                              </div>
                            </div>
                            {/* Monto abonado */ }
                            <div>
                              <label
                                htmlFor="amountPaid"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto abonado
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="amountPaid"
                                  id="amountPaid"
                                  placeholder="$100.00"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={ amountPaidDisplay }
                                  onChange={ ( e ) => {
                                    setAmountPaid( e.target.value );
                                    setAmountPaidDisplay( e.target.value );
                                  } }
                                  onFocus={ () =>
                                    setAmountPaidDisplay( amountPaid )
                                  }
                                  onBlur={ () => {
                                    const num = parseFloat( amountPaid );
                                    if ( !isNaN( num ) ) {
                                      setAmountPaidDisplay( formatCurrency( num ) );
                                    }
                                  } }
                                />
                              </div>
                            </div>
                            {/* Tipo de pago */ }
                            <div>
                              <label
                                htmlFor="paymentType"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Tipo de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  onChange={ ( e ) =>
                                    setPaymentType( e.target.value )
                                  }
                                  name="paymentType"
                                  id="paymentType"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={ paymentType }
                                >
                                  <option value="">
                                    Selecciona un tipo de pago
                                  </option>
                                  <option value="Transferencia">
                                    Transferencia
                                  </option>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Depósito">Depósito</option>
                                </select>
                              </div>
                            </div>
                            {/* Referencia de pago */ }
                            <div>
                              <label
                                htmlFor="paymentReference"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Referencia de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  id="paymentReference"
                                  name="paymentReference"
                                  value={ paymentReference }
                                  onChange={ ( e ) =>
                                    setPaymentReference( e.target.value )
                                  }
                                  placeholder="Ej. SPEI1234567890"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Obligatoria para Transferencia y Depósito.
                              </p>
                            </div>
                            {/* Selección de la cuenta */ }
                            <div>
                              <label
                                htmlFor="financialAccountId"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Cuenta
                              </label>
                              <div className="mt-2 relative">
                                <select
                                  onChange={ ( e ) =>
                                    setFinancialAccountId( e.target.value )
                                  }
                                  name="financialAccountId"
                                  id="financialAccountId"
                                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={ financialAccountId }
                                >
                                  <option value="">
                                    Selecciona una cuenta
                                  </option>
                                  { selectableFinancialAccounts.map( ( acc ) => (
                                    <option key={ acc.id } value={ acc.id }>
                                      { acc.name }
                                    </option>
                                  ) ) }
                                </select>
                              </div>
                            </div>
                            {/* Monto pendiente - Ahora calculado automáticamente */ }
                            <div>
                              <label
                                htmlFor="amountPending"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto pendiente (calculado automáticamente)
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="amountPending"
                                  id="amountPending"
                                  readOnly
                                  disabled={ isUnidentifiedPayment }
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 bg-gray-50 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                                  value={ amountPendingDisplay }
                                />
                              </div>
                            </div>
                            {/* Saldo a favor */ }
                            { !isUnidentifiedPayment &&
                              userCreditBalance !== null &&
                              userCreditBalance > 0 && (
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                    Saldo a favor disponible:{ " " }
                                    { formatCurrency( userCreditInPesos ) }
                                  </label>
                                  <div className="mt-2 flex items-center space-x-4">
                                    <label className="flex items-center dark:text-gray-100">
                                      <input
                                        type="radio"
                                        name="useCreditBalance"
                                        value="false"
                                        checked={ !useCreditBalance }
                                        onChange={ () =>
                                          setUseCreditBalance( false )
                                        }
                                        className="mr-2"
                                      />
                                      No utilizar saldo a favor
                                    </label>
                                    <label className="flex items-center dark:text-gray-100">
                                      <input
                                        type="radio"
                                        name="useCreditBalance"
                                        value="true"
                                        checked={ useCreditBalance }
                                        onChange={ () =>
                                          setUseCreditBalance( true )
                                        }
                                        className="mr-2"
                                      />
                                      Utilizar saldo a favor
                                    </label>
                                  </div>
                                </div>
                              ) }
                            {/* Lista de cargos pendientes */ }
                            { numberCondominium &&
                              charges.length > 0 &&
                              !isUnidentifiedPayment && (
                                <div>
                                  <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                    Selecciona cargos a pagar
                                  </label>
                                  <div className="mt-2 space-y-2">
                                    { charges.map( ( charge ) => {
                                      const isChecked = selectedCharges.some(
                                        ( sc ) => sc.chargeId === charge.id
                                      );
                                      return (
                                        <div
                                          key={ charge.id }
                                          className="flex items-center space-x-2"
                                        >
                                          <input
                                            type="checkbox"
                                            disabled={ isUnidentifiedPayment }
                                            checked={ isChecked }
                                            onChange={ ( e ) =>
                                              handleToggleCharge(
                                                charge.id,
                                                e.target.checked
                                              )
                                            }
                                          />
                                          <span className="flex-1 dark:text-gray-100">
                                            { `${ charge.concept } | Mes: ${ charge.month || "Sin mes"
                                              } | Monto: ${ formatCurrency(
                                                charge.amount / 100
                                              ) }` }
                                          </span>
                                          { isChecked && (
                                            <div className="relative">
                                              <input
                                                type="text"
                                                min="0"
                                                step="0.01"
                                                className="w-18 rounded-md ring-0 focus:ring-0 outline-none border border-solid border-indigo-300 pl-5 h-8 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                                placeholder="$100.00"
                                                value={
                                                  chargeDisplayValues[
                                                  charge.id
                                                  ] || ""
                                                }
                                                onChange={ ( e ) => {
                                                  const rawValue =
                                                    e.target.value;
                                                  const newNumber =
                                                    parseFloat(
                                                      rawValue.replace(
                                                        /[^0-9.]/g,
                                                        ""
                                                      )
                                                    ) || 0;
                                                  handleAmountChange(
                                                    charge.id,
                                                    newNumber
                                                  );
                                                  setChargeDisplayValues(
                                                    ( prev ) => ( {
                                                      ...prev,
                                                      [ charge.id ]: rawValue,
                                                    } )
                                                  );
                                                } }
                                                onFocus={ () => {
                                                  setChargeDisplayValues(
                                                    ( prev ) => ( {
                                                      ...prev,
                                                      [ charge.id ]: "",
                                                    } )
                                                  );
                                                } }
                                                onBlur={ () => {
                                                  const selected =
                                                    selectedCharges.find(
                                                      ( sc ) =>
                                                        sc.chargeId ===
                                                        charge.id
                                                    );
                                                  if (
                                                    selected &&
                                                    selected.amount > 0
                                                  ) {
                                                    setChargeDisplayValues(
                                                      ( prev ) => ( {
                                                        ...prev,
                                                        [ charge.id ]:
                                                          formatCurrency(
                                                            selected.amount
                                                          ),
                                                      } )
                                                    );
                                                  } else {
                                                    setChargeDisplayValues(
                                                      ( prev ) => ( {
                                                        ...prev,
                                                        [ charge.id ]: "",
                                                      } )
                                                    );
                                                  }
                                                } }
                                              />
                                            </div>
                                          ) }
                                        </div>
                                      );
                                    } ) }
                                  </div>
                                  <div className="mt-2">
                                    <span className="text-sm font-bold dark:text-gray-100">
                                      Saldo restante a aplicar:{ " " }
                                      { formatCurrency( remainingEffective ) }
                                    </span>
                                  </div>
                                </div>
                              ) }
                            {/* Dropzone */ }
                            <div
                              { ...getRootProps() }
                              className="mt-12 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-900"
                            >
                              <input { ...getInputProps() } />
                              <div className="text-center">
                                <PhotoIcon
                                  className="mx-auto h-12 w-12 text-gray-300"
                                  aria-hidden="true"
                                />
                                { fileName ? (
                                  <p className="mt-4 text-sm leading-6 text-gray-600">
                                    { fileName }
                                  </p>
                                ) : (
                                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                    { isDragActive
                                      ? "Suelta el archivo aquí..."
                                      : isCompressing
                                        ? "Procesando archivo..."
                                        : "Arrastra y suelta el comprobante (PDF o Imagen) aquí o haz click" }
                                  </p>
                                ) }
                                <p className="text-xs leading-5 text-gray-600">
                                  Hasta 10MB
                                </p>
                              </div>
                            </div>
                            {/* Descarga automática de recibo deshabilitada temporalmente en PaymentForm. */ }
                            {/* Comentarios */ }
                            <div>
                              <label
                                htmlFor="comments"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  onChange={ ( e ) => setComments( e.target.value ) }
                                  id="comments"
                                  name="comments"
                                  rows={ 4 }
                                  className="block w-full rounded-md py-1.5 border border-gray-300 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={ comments }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Botones de acción */ }
                    <div className="flex flex-shrink-0 justify-end px-4 py-4 dark:bg-gray-900">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={ () => setOpen( false ) }
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        { loading ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
                            viewBox="0 0 24 24"
                          ></svg>
                        ) : isCompressing ? (
                          "Procesando..."
                        ) : (
                          "Guardar"
                        ) }
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default PaymentForm;
