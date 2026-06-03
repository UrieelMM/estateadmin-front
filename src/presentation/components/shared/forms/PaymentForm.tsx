import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition, Dialog, Combobox } from "@headlessui/react";
import {
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClipboardIcon,
  CalendarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  TicketIcon,
  IdentificationIcon,
  HashtagIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import {
  CheckIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { usePaymentStore } from "../../../../store/usePaymentStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { usePaymentSummaryStore } from "../../../../store/paymentSummaryStore";
import { useUnidentifiedPaymentsStore } from "../../../../store/useUnidentifiedPaymentsStore";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";

// ─── Helpers visuales (sin lógica de negocio) ────────────────────────────────
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const inputBase =
  "block w-full rounded-lg border-0 bg-white py-2 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500";

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  muted?: boolean;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  description,
  icon,
  muted,
  children,
}: SectionCardProps) => (
  <section
    className={cn(
      "rounded-2xl border bg-white shadow-sm transition dark:bg-gray-900",
      muted
        ? "border-gray-200/70 opacity-70 dark:border-gray-800"
        : "border-gray-200 dark:border-gray-800",
    )}
  >
    <header className="flex items-start gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </header>
    <div className="space-y-4 px-4 py-4">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
  right?: React.ReactNode;
}

const Field = ({
  label,
  htmlFor,
  hint,
  optional,
  children,
  right,
}: FieldProps) => (
  <div>
    <div className="flex items-end justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
      >
        {label}
        {optional && (
          <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-gray-400">
            (opcional)
          </span>
        )}
      </label>
      {right}
    </div>
    <div className="mt-1.5">{children}</div>
    {hint && (
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    )}
  </div>
);

interface PaymentTypeCardProps {
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const PaymentTypeCard = ({
  active,
  title,
  description,
  icon,
  onClick,
}: PaymentTypeCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
      active
        ? "border-white/40 bg-white/20 text-white shadow-inner backdrop-blur"
        : "border-white/20 bg-white/[0.07] text-white/80 hover:bg-white/15 hover:text-white",
    )}
  >
    <span
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition",
        active ? "bg-white text-indigo-600" : "bg-white/15 text-white",
      )}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-white/70">
        {description}
      </p>
    </div>
    {active && (
      <CheckCircleIcon className="h-4 w-4 shrink-0 text-white" />
    )}
  </button>
);

interface FormParcelReceptionProps {
  open: boolean;
  setOpen: ( open: boolean ) => void;
}

interface SelectedCharge {
  chargeId: string;
  amount: number;
}

const parseCurrencyInput = ( value: string ): number => {
  const raw = String( value || "" )
    .replace( /[^0-9,.-]/g, "" )
    .trim();
  if ( !raw ) return NaN;

  const hasDot = raw.includes( "." );
  const hasComma = raw.includes( "," );
  let normalized = raw;

  if ( hasDot && hasComma ) {
    normalized = raw.replace( /,/g, "" );
  } else if ( hasComma && !hasDot ) {
    normalized = raw.replace( /,/g, "." );
  }

  const parsed = Number( normalized );
  return Number.isFinite( parsed ) ? parsed : NaN;
};

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
    const isTowerQuery = term.startsWith( "torre" ) && towerTerm.length > 0;

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
        const towerMatches = isTowerQuery
          ? normalizedTower === towerTerm ||
            compactNormalizedTower === compactTowerTerm
          : tower.includes( term ) ||
            normalizedTower.includes( towerTerm ) ||
            compactTower.includes( compactTerm ) ||
            compactNormalizedTower.includes( compactTowerTerm );
        return (
          number.includes( term ) ||
          compactNumber.includes( compactTerm ) ||
          name.includes( term ) ||
          fullName.includes( term ) ||
          compactName.includes( compactTerm ) ||
          compactFullName.includes( compactTerm ) ||
          towerMatches
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
            fetchUserCharges( user.number, user.uid ),
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

  const selectedRecipientUid = selectedUser?.uid || "";

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
  const amountPaidValue = parseCurrencyInput( amountPaid );
  const safeAmountPaidValue = Number.isFinite( amountPaidValue )
    ? amountPaidValue
    : 0;

  // Si se usa crédito, sumar el saldo convertido
  const effectiveTotal = useCreditBalance
    ? safeAmountPaidValue + userCreditInPesos
    : safeAmountPaidValue;

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
      if (
        !useCreditBalance &&
        ( !Number.isFinite( amountPaidValue ) || amountPaidValue <= 0 )
      ) {
        throw new Error( "El monto abonado no es válido." );
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
            safeAmountPaidValue.toFixed( 2 ) !==
            Number( totalAssigned ).toFixed( 2 )
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
        userId: selectedUser?.uid || selectedRecipientUid || "",
        email,
        numberCondominium,
        amountPaid: safeAmountPaidValue,
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
          fetchUserCharges( numberCondominium, selectedUser?.uid || selectedRecipientUid || undefined ),
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
        <Transition.Child
          as={ Fragment }
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity" />
        </Transition.Child>
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
                    className="flex h-full flex-col bg-gray-50 shadow-2xl dark:bg-gray-950"
                  >
                    {/* ── Hero header ────────────────────────────────────── */ }
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-5 sm:px-6 dark:from-indigo-700 dark:via-indigo-800 dark:to-violet-900">
                      <button
                        type="button"
                        className="absolute right-4 top-4 inline-flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        onClick={ () => setOpen( false ) }
                        aria-label="Cerrar"
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>

                      <div className="flex items-center gap-3 pr-10">
                        <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur">
                          <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <Dialog.Title className="text-lg font-bold leading-tight text-white">
                            Registrar pago
                          </Dialog.Title>
                          <p className="mt-0.5 text-xs text-indigo-100">
                            Captura un pago de mantenimiento aplicado a un condómino o
                            como pago no identificado.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100/80">
                          Tipo de registro
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <PaymentTypeCard
                            active={ !isUnidentifiedPayment }
                            title="Pago identificado"
                            description="Aplícalo a los cargos de un condómino específico."
                            icon={ <IdentificationIcon className="h-4 w-4" /> }
                            onClick={ () => handlePaymentTypeChange( false ) }
                          />
                          <PaymentTypeCard
                            active={ isUnidentifiedPayment }
                            title="Pago no identificado"
                            description="Regístralo y asígnalo más tarde a un condómino."
                            icon={ <BanknotesIcon className="h-4 w-4" /> }
                            onClick={ () => handlePaymentTypeChange( true ) }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-0 flex-1 overflow-y-auto">
                      <div className="space-y-4 px-4 py-5 sm:px-6">
                        {/* ── Sección: Condómino ───────────────────────── */ }
                        <SectionCard
                          title="Condómino"
                          description={
                            isUnidentifiedPayment
                              ? "Pago no identificado: no requiere un condómino en este momento."
                              : "Selecciona al residente que realizó el pago."
                          }
                          icon={ <UserIcon className="h-4 w-4" /> }
                          muted={ isUnidentifiedPayment }
                        >
                          <Field
                            label="Buscar condómino"
                            htmlFor="nameRecipient"
                            hint="Puedes buscar por nombre, número de unidad o torre."
                            right={
                              <div className="flex items-center gap-1.5">
                                <label
                                  htmlFor="recipientSortOrder"
                                  className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                                >
                                  Orden
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
                                  className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:disabled:bg-gray-700"
                                >
                                  <option value="">Sin orden</option>
                                  <option value="asc">Asc</option>
                                  <option value="desc">Desc</option>
                                </select>
                              </div>
                            }
                          >
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
                                <UserIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Combobox.Input
                                  ref={ recipientComboboxInputRef }
                                  id="nameRecipient"
                                  name="nameRecipient"
                                  className={ `${ inputBase } pl-9 pr-10` }
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

                              <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/[0.08]">
                                <Combobox.Option
                                  value=""
                                  className={ ( { active } ) =>
                                    `relative cursor-default select-none px-3 py-1.5 text-[11px] italic ${ active
                                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                      : "text-gray-500 dark:text-gray-400"
                                    }`
                                  }
                                >
                                  Sin selección
                                </Combobox.Option>

                                { filteredUsers.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    Sin resultados
                                  </div>
                                ) : (
                                  filteredUsers.map( ( user ) => (
                                    <Combobox.Option
                                      key={ user.uid }
                                      value={ user.uid }
                                      className={ ( { active } ) =>
                                        `relative cursor-default select-none px-2 py-1.5 ${ active
                                          ? "bg-indigo-50 dark:bg-indigo-500/10"
                                          : ""
                                        }`
                                      }
                                    >
                                      { ( { active } ) => (
                                        <div className="flex items-start gap-2.5">
                                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                                            { String( user.number || "?" ).slice( 0, 3 ) }
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={ cn(
                                                "truncate text-sm font-semibold",
                                                selectedRecipientUid === user.uid
                                                  ? "text-indigo-700 dark:text-indigo-300"
                                                  : "text-gray-900 dark:text-gray-100"
                                              ) }
                                            >
                                              { user.name } { user.lastName || "" }
                                            </p>
                                            <p
                                              className={ cn(
                                                "text-[11px]",
                                                active
                                                  ? "text-indigo-700/80 dark:text-indigo-200/70"
                                                  : "text-gray-500 dark:text-gray-400"
                                              ) }
                                            >
                                              { String( user.tower || "" ).trim().length > 0
                                                ? `Torre ${ String( user.tower || "" )
                                                  .replace( /^torre\s*/i, "" )
                                                  .trim() }`
                                                : "Sin torre" }
                                            </p>
                                          </div>
                                          { selectedRecipientUid === user.uid && (
                                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                          ) }
                                        </div>
                                      ) }
                                    </Combobox.Option>
                                  ) )
                                ) }
                              </Combobox.Options>
                            </Combobox>
                          </Field>

                          { /* Resumen del condómino seleccionado */ }
                          { selectedUser && !isUnidentifiedPayment && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs dark:border-indigo-900/40 dark:bg-indigo-500/10">
                              <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
                                <HashtagIcon className="h-3.5 w-3.5" />
                                Unidad
                                <strong className="font-semibold">
                                  { numberCondominium || "-" }
                                </strong>
                              </span>
                              { String( selectedUser.tower || "" ).trim() && (
                                <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
                                  <BuildingLibraryIcon className="h-3.5 w-3.5" />
                                  Torre
                                  { " " }
                                  { String( selectedUser.tower )
                                    .replace( /^torre\s*/i, "" )
                                    .trim() }
                                </span>
                              ) }
                              { email && (
                                <span className="inline-flex min-w-0 items-center gap-1 text-indigo-700 dark:text-indigo-300">
                                  <InformationCircleIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{ email }</span>
                                </span>
                              ) }
                            </div>
                          ) }
                        </SectionCard>

                        {/* ── Sección: Detalle del pago ────────────────── */ }
                        <SectionCard
                          title="Detalle del pago"
                          description="Información básica del movimiento."
                          icon={ <CreditCardIcon className="h-4 w-4" /> }
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Fecha de pago" htmlFor="paymentDate">
                              <div className="relative">
                                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                                  className={ `${ inputBase } pl-9` }
                                  value={
                                    paymentDate && !isNaN( paymentDate.getTime() )
                                      ? paymentDate.toISOString().split( "T" )[ 0 ]
                                      : ""
                                  }
                                />
                              </div>
                            </Field>

                            <Field label="Monto abonado" htmlFor="amountPaid">
                              <div className="relative">
                                <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  name="amountPaid"
                                  id="amountPaid"
                                  placeholder="$100.00"
                                  className={ `${ inputBase } pl-9` }
                                  value={ amountPaidDisplay }
                                  onChange={ ( e ) => {
                                    setAmountPaid( e.target.value );
                                    setAmountPaidDisplay( e.target.value );
                                  } }
                                  onFocus={ () => setAmountPaidDisplay( amountPaid ) }
                                  onBlur={ () => {
                                    const num = parseCurrencyInput( amountPaid );
                                    if ( Number.isFinite( num ) ) {
                                      setAmountPaidDisplay( formatCurrency( num ) );
                                    } else {
                                      setAmountPaidDisplay( amountPaid );
                                    }
                                  } }
                                />
                              </div>
                            </Field>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Tipo de pago" htmlFor="paymentType">
                              <div className="relative">
                                <CreditCardIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <select
                                  onChange={ ( e ) => setPaymentType( e.target.value ) }
                                  name="paymentType"
                                  id="paymentType"
                                  className={ `${ inputBase } pl-9` }
                                  value={ paymentType }
                                >
                                  <option value="">Selecciona…</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Depósito">Depósito</option>
                                </select>
                              </div>
                            </Field>

                            <Field label="Cuenta destino" htmlFor="financialAccountId">
                              <select
                                onChange={ ( e ) =>
                                  setFinancialAccountId( e.target.value )
                                }
                                name="financialAccountId"
                                id="financialAccountId"
                                className={ `${ inputBase } pl-3` }
                                value={ financialAccountId }
                              >
                                <option value="">Selecciona una cuenta</option>
                                { selectableFinancialAccounts.map( ( acc ) => (
                                  <option key={ acc.id } value={ acc.id }>
                                    { acc.name }
                                  </option>
                                ) ) }
                              </select>
                            </Field>
                          </div>

                          <Field
                            label="Referencia de pago"
                            htmlFor="paymentReference"
                            hint="Obligatoria para Transferencia y Depósito."
                          >
                            <div className="relative">
                              <ClipboardIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                id="paymentReference"
                                name="paymentReference"
                                value={ paymentReference }
                                onChange={ ( e ) =>
                                  setPaymentReference( e.target.value )
                                }
                                placeholder="Ej. SPEI1234567890"
                                className={ `${ inputBase } pl-9` }
                              />
                            </div>
                          </Field>
                        </SectionCard>

                        {/* ── Sección: Aplicación a cargos ─────────────── */ }
                        { !isUnidentifiedPayment && (
                          <SectionCard
                            title="Aplicación a cargos pendientes"
                            description={
                              selectedUser
                                ? "Marca los cargos a cubrir y asigna el monto correspondiente."
                                : "Selecciona primero al condómino para ver sus cargos."
                            }
                            icon={ <TicketIcon className="h-4 w-4" /> }
                          >
                            { /* Saldo a favor */ }
                            { userCreditBalance !== null && userCreditBalance > 0 && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                                <div className="flex items-start gap-2.5">
                                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    <BanknotesIcon className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                      Saldo a favor disponible
                                    </p>
                                    <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                                      Este condómino tiene{ " " }
                                      <strong className="font-semibold">
                                        { formatCurrency( userCreditInPesos ) }
                                      </strong>{ " " }
                                      acumulados de pagos anteriores.
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      <button
                                        type="button"
                                        onClick={ () => setUseCreditBalance( false ) }
                                        className={ cn(
                                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                                          !useCreditBalance
                                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                                        ) }
                                      >
                                        No utilizar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={ () => setUseCreditBalance( true ) }
                                        className={ cn(
                                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                                          useCreditBalance
                                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                                        ) }
                                      >
                                        Utilizar saldo
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) }

                            { /* Lista de cargos */ }
                            { numberCondominium && charges.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                  Cargos pendientes ({ charges.length })
                                </p>
                                <div className="grid gap-2">
                                  { charges.map( ( charge ) => {
                                    const isChecked = selectedCharges.some(
                                      ( sc ) => sc.chargeId === charge.id
                                    );
                                    return (
                                      <label
                                        key={ charge.id }
                                        className={ cn(
                                          "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                                          isChecked
                                            ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-500/10"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                                        ) }
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
                                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            { charge.concept }
                                          </p>
                                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                            Mes:{ " " }
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                              { charge.month || "Sin mes" }
                                            </span>
                                            { " · " }
                                            Monto original:{ " " }
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                              { formatCurrency( charge.amount / 100 ) }
                                            </span>
                                          </p>
                                        </div>
                                        { isChecked && (
                                          <div className="relative w-32 shrink-0">
                                            <CurrencyDollarIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                                            <input
                                              type="text"
                                              min="0"
                                              step="0.01"
                                              onClick={ ( e ) => e.preventDefault() }
                                              className="block w-full rounded-md border-0 bg-white py-1.5 pl-7 pr-2 text-xs text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-indigo-700"
                                              placeholder="$100.00"
                                              value={
                                                chargeDisplayValues[ charge.id ] || ""
                                              }
                                              onChange={ ( e ) => {
                                                const rawValue = e.target.value;
                                                const newNumber =
                                                  parseFloat(
                                                    rawValue.replace( /[^0-9.]/g, "" )
                                                  ) || 0;
                                                handleAmountChange(
                                                  charge.id,
                                                  newNumber
                                                );
                                                setChargeDisplayValues( ( prev ) => ( {
                                                  ...prev,
                                                  [ charge.id ]: rawValue,
                                                } ) );
                                              } }
                                              onFocus={ ( e ) => {
                                                e.stopPropagation();
                                                setChargeDisplayValues( ( prev ) => ( {
                                                  ...prev,
                                                  [ charge.id ]: "",
                                                } ) );
                                              } }
                                              onBlur={ ( e ) => {
                                                e.stopPropagation();
                                                const selected = selectedCharges.find(
                                                  ( sc ) => sc.chargeId === charge.id
                                                );
                                                if ( selected && selected.amount > 0 ) {
                                                  setChargeDisplayValues( ( prev ) => ( {
                                                    ...prev,
                                                    [ charge.id ]: formatCurrency(
                                                      selected.amount
                                                    ),
                                                  } ) );
                                                } else {
                                                  setChargeDisplayValues( ( prev ) => ( {
                                                    ...prev,
                                                    [ charge.id ]: "",
                                                  } ) );
                                                }
                                              } }
                                            />
                                          </div>
                                        ) }
                                      </label>
                                    );
                                  } ) }
                                </div>

                                {/* Chips de resumen */ }
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Asignado
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      { formatCurrency( totalAssigned ) }
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Por aplicar
                                    </p>
                                    <p
                                      className={ cn(
                                        "mt-0.5 text-sm font-semibold",
                                        remainingEffective < 0
                                          ? "text-rose-600 dark:text-rose-400"
                                          : "text-indigo-600 dark:text-indigo-400"
                                      ) }
                                    >
                                      { formatCurrency( remainingEffective ) }
                                    </p>
                                  </div>
                                  <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60 sm:col-span-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Pendiente de cargos
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      { amountPendingDisplay || formatCurrency( 0 ) }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : numberCondominium ? (
                              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                                Este condómino no tiene cargos pendientes registrados.
                              </p>
                            ) : (
                              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-400">
                                Selecciona un condómino para listar sus cargos pendientes.
                              </p>
                            ) }
                          </SectionCard>
                        ) }

                        {/* ── Sección: Comprobante y notas ─────────────── */ }
                        <SectionCard
                          title="Comprobante y notas"
                          description="Adjunta el recibo y captura información adicional si aplica."
                          icon={ <DocumentTextIcon className="h-4 w-4" /> }
                        >
                          <Field
                            label="Comprobante"
                            optional
                            hint="PDF, imagen o XLSX. Se procesa automáticamente. Hasta 10 MB."
                          >
                            <div
                              { ...getRootProps() }
                              className={ cn(
                                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition",
                                isDragActive
                                  ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
                                  : fileName
                                    ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/10"
                                    : "border-gray-300 bg-gray-50/60 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10"
                              ) }
                            >
                              <input { ...getInputProps() } />
                              <div
                                className={ cn(
                                  "mb-2 rounded-full p-2.5",
                                  fileName
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                                ) }
                              >
                                { fileName ? (
                                  <CheckCircleIcon className="h-6 w-6" />
                                ) : (
                                  <CloudArrowUpIcon className="h-6 w-6" />
                                ) }
                              </div>
                              { fileName ? (
                                <>
                                  <p className="max-w-full truncate px-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    { fileName }
                                  </p>
                                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    Haz click o arrastra otro archivo para reemplazarlo.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    { isDragActive
                                      ? "Suelta el archivo aquí…"
                                      : isCompressing
                                        ? "Procesando archivo…"
                                        : "Arrastra y suelta o haz click" }
                                  </p>
                                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    PDF, JPG, PNG o XLSX
                                  </p>
                                </>
                              ) }
                            </div>
                          </Field>

                          <Field label="Comentarios" htmlFor="comments" optional>
                            <textarea
                              onChange={ ( e ) => setComments( e.target.value ) }
                              id="comments"
                              name="comments"
                              rows={ 3 }
                              value={ comments }
                              placeholder="Agrega cualquier información relevante para este pago…"
                              className={ `${ inputBase } resize-none px-3 py-2` }
                            />
                          </Field>
                        </SectionCard>
                      </div>
                    </div>

                    {/* ── Sticky footer ──────────────────────────────── */ }
                    <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
                      <div className="hidden min-w-0 sm:block">
                        { !isUnidentifiedPayment && selectedCharges.length > 0 ? (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Aplicando{ " " }
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              { formatCurrency( totalAssigned ) }
                            </span>
                            <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                              ·
                            </span>
                            Restante{ " " }
                            <span
                              className={ cn(
                                "font-semibold",
                                remainingEffective < 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-indigo-600 dark:text-indigo-400"
                              ) }
                            >
                              { formatCurrency( remainingEffective ) }
                            </span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Revisa los datos antes de guardar.
                          </p>
                        ) }
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                        <button
                          type="button"
                          className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700"
                          onClick={ () => setOpen( false ) }
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={ loading || isCompressing }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          { loading ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                  stroke="currentColor"
                                  strokeOpacity="0.25"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M21 12a9 9 0 0 1-9 9"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Guardando…
                            </>
                          ) : isCompressing ? (
                            "Procesando archivo…"
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Guardar pago
                            </>
                          ) }
                        </button>
                      </div>
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
