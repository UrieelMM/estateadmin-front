import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUturnLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";
import { formatCurrency } from "../../../../../utils/curreyncy";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import useUserStore from "../../../../../store/UserDataStore";
import usePaymentReversalStore from "../../../../../store/usePaymentReversalStore";
import { writeAuditLog } from "../../../../../services/auditService";

interface FilterState {
  month: string;
  year: string;
  folio?: string;
}

interface ReversalFilterState {
  from: string;
  to: string;
  paymentId: string;
}

type HistoryViewMode = "payments" | "reversals";

const ITEMS_PER_PAGE = 50;
const MONTHS = [
  { value: "", label: "Todos los meses" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const REVERSAL_REASON_OPTIONS = [
  "Pago aplicado al condómino incorrecto",
  "Monto de pago incorrecto",
  "Fecha de pago incorrecta",
  "Registro duplicado",
  "Otro",
];

const normalizeTowerValue = ( value: unknown ): string =>
  String( value ?? "" )
    .replace( /^torre\s*/i, "" )
    .trim();

const formatMonthLabel = ( monthValue?: string ): string => {
  const raw = String( monthValue || "" ).trim();
  if ( !raw ) return "N/A";

  let normalizedMonth = raw;
  if ( /^\d{4}-\d{2}$/.test( raw ) ) {
    normalizedMonth = raw.slice( 5, 7 );
  } else if ( /^\d{1}$/.test( raw ) ) {
    normalizedMonth = raw.padStart( 2, "0" );
  }

  const foundMonth = MONTHS.find( ( month ) => month.value === normalizedMonth );
  return foundMonth ? foundMonth.label : raw;
};

const parseDateValue = ( value: any ): Date | null => {
  if ( !value ) return null;
  if ( value instanceof Date ) return value;
  if ( typeof value?.toDate === "function" ) return value.toDate();

  const parsed = new Date( value );
  return Number.isNaN( parsed.getTime() ) ? null : parsed;
};

const formatDateTimeValue = ( value: any ): string => {
  const parsed = parseDateValue( value );
  if ( !parsed ) return "N/A";

  return parsed.toLocaleString( "es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  } );
};

const normalizeReversalItems = (
  rawItems: Record<string, any>[] | undefined
): Record<string, any>[] => {
  if ( !Array.isArray( rawItems ) ) return [];

  return rawItems.map( ( item, index ) => ( {
    id:
      item.id ||
      item.operationId ||
      item.reversalId ||
      `${ item.paymentId || "payment" }-${ index }`,
    operationId: item.operationId || item.id || item.reversalId || "N/A",
    paymentId: item.paymentId || item.payment?.paymentId || item.entityId || "N/A",
    paymentFolio:
      item.paymentFolio ||
      item.payment?.folio ||
      item.folio ||
      item.payment?.paymentGroupId ||
      "N/A",
    reason: item.reason || item.metadata?.reason || "Sin especificar",
    status: item.status || item.result || "aplicada",
    performedBy:
      item.performedByName ||
      item.performedBy?.displayName ||
      item.performedBy?.email ||
      item.performedBy ||
      "N/A",
    performedAt:
      item.performedAt ||
      item.createdAt ||
      item.updatedAt ||
      item.timestamp ||
      null,
    notes: item.notes || item.metadata?.notes || "",
  } ) );
};

const HistoryPaymentsTable: React.FC = () => {
  // currentPage es 1-indexado.
  const [ currentPage, setCurrentPage ] = useState( 1 );
  // pageCursors: en cada posición se guarda el "lastDocument" correspondiente a la página anterior.
  // Para la página 1, startAfter es siempre null.
  const [ pageCursors, setPageCursors ] = useState<any[]>( [ null ] );
  const [ filters, setFilters ] = useState<FilterState>( {
    month: "",
    year: new Date().getFullYear().toString(),
    folio: "",
  } );
  const [ showFilters, setShowFilters ] = useState( false );
  const [ loadingPayments, setLoadingPayments ] = useState( false );
  // "hasMore" indica si es posible avanzar a una siguiente página
  const [ hasMore, setHasMore ] = useState( true );
  const [ noResults, _setNoResults ] = useState( false );
  const [ showSearchModal, setShowSearchModal ] = useState( false );
  const [ searchResults, setSearchResults ] = useState<PaymentRecord[]>( [] );
  const [ isSearching, setIsSearching ] = useState( false );
  const [ folioQuery, setFolioQuery ] = useState( "" );
  const [ historyViewMode, setHistoryViewMode ] =
    useState<HistoryViewMode>( "payments" );
  const [ selectedPayment, setSelectedPayment ] = useState<PaymentRecord | null>(
    null
  );
  const [ isAdminUser, setIsAdminUser ] = useState( false );
  const [ reversalTargetPayment, setReversalTargetPayment ] =
    useState<PaymentRecord | null>( null );
  const [ reversalReason, setReversalReason ] = useState( "" );
  const [ reversalNotes, setReversalNotes ] = useState( "" );
  const [ reversalConfirmText, setReversalConfirmText ] = useState( "" );
  const [ reversalFilters, setReversalFilters ] = useState<ReversalFilterState>( {
    from: "",
    to: "",
    paymentId: "",
  } );
  const [ reversalPage, setReversalPage ] = useState( 1 );
  const [ reversalRows, setReversalRows ] = useState<Record<string, any>[]>( [] );
  const [ reversalTotal, setReversalTotal ] = useState( 0 );

  const {
    preview: reversalPreview,
    previewLoading: reversalPreviewLoading,
    commitLoading: reversalCommitLoading,
    historyLoading: reversalHistoryLoading,
    error: reversalError,
    previewPaymentReversal,
    commitPaymentReversal,
    fetchReversalHistory,
    reset: resetReversalState,
  } = usePaymentReversalStore( ( state ) => ( {
    preview: state.preview,
    previewLoading: state.previewLoading,
    commitLoading: state.commitLoading,
    historyLoading: state.historyLoading,
    error: state.error,
    previewPaymentReversal: state.previewPaymentReversal,
    commitPaymentReversal: state.commitPaymentReversal,
    fetchReversalHistory: state.fetchReversalHistory,
    reset: state.reset,
  } ) );

  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore( ( state ) => state.condominiumsUsers );

  const {
    completedPayments,
    financialAccountsMap,
    fetchPaymentHistory,
    fetchSummary,
    resetPaymentsState,
    searchPaymentByFolio,
    loadingPayments: _storeLoadingPayments,
  } = usePaymentSummaryStore( ( state ) => ( {
    completedPayments: state.completedPayments,
    financialAccountsMap: state.financialAccountsMap,
    lastPaymentDoc: state.lastPaymentDoc,
    fetchPaymentHistory: state.fetchPaymentHistory,
    fetchSummary: state.fetchSummary,
    resetPaymentsState: state.resetPaymentsState,
    searchPaymentByFolio: state.searchPaymentByFolio,
    loadingPayments: state.loadingPayments,
  } ) );

  useEffect( () => {
    fetchCondominiumsUsers();
  }, [ fetchCondominiumsUsers ] );

  useEffect( () => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged( auth, async ( user ) => {
      if ( !user ) {
        setIsAdminUser( false );
        return;
      }

      try {
        const tokenResult = await getIdTokenResult( user );
        setIsAdminUser( String( tokenResult.claims[ "role" ] || "" ) === "admin" );
      } catch ( error ) {
        console.error( "Error validando rol de usuario:", error );
        setIsAdminUser( false );
      }
    } );

    return () => unsubscribe();
  }, [] );

  const loadReversalHistory = async ( options?: {
    reset?: boolean;
    customPage?: number;
    customFilters?: ReversalFilterState;
  } ) => {
    if ( !isAdminUser ) return;

    const targetPage = options?.customPage || ( options?.reset ? 1 : reversalPage );
    const filterValues = options?.customFilters || reversalFilters;
    try {
      const response = await fetchReversalHistory( {
        page: targetPage,
        limit: 10,
        from: filterValues.from || undefined,
        to: filterValues.to || undefined,
        paymentId: filterValues.paymentId || undefined,
      } );

      const normalized = normalizeReversalItems( response.items );
      setReversalRows( ( prev ) =>
        options?.reset ? normalized : [ ...prev, ...normalized ]
      );
      setReversalTotal( Number( response.total || 0 ) );
      setReversalPage( Number( response.page || targetPage ) );
    } catch ( error: any ) {
      toast.error(
        error?.message || "No fue posible cargar el historial de reversas."
      );
    }
  };

  useEffect( () => {
    if ( historyViewMode !== "reversals" || !isAdminUser ) return;
    loadReversalHistory( { reset: true, customPage: 1 } );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ historyViewMode, isAdminUser ] );

  const resolveCondominoMeta = ( payment: PaymentRecord ) => {
    const byUserId = condominiumsUsers.find(
      ( user ) => user.uid && user.uid === payment.userId
    );
    if ( byUserId ) {
      return {
        name: `${ byUserId.name || "" } ${ byUserId.lastName || "" }`.trim(),
        tower: normalizeTowerValue( byUserId.tower ),
      };
    }

    const number = String( payment.numberCondominium || "" ).trim();
    if ( !number ) return { name: "", tower: "" };

    const candidates = condominiumsUsers.filter(
      ( user ) => String( user.number || "" ).trim() === number
    );

    const towerSnapshot = normalizeTowerValue( payment.towerSnapshot );
    if ( towerSnapshot ) {
      const byTower = candidates.find(
        ( user ) => normalizeTowerValue( user.tower ) === towerSnapshot
      );
      if ( byTower ) {
        return {
          name: `${ byTower.name || "" } ${ byTower.lastName || "" }`.trim(),
          tower: towerSnapshot,
        };
      }
    }

    if ( candidates.length === 1 ) {
      return {
        name: `${ candidates[ 0 ].name || "" } ${ candidates[ 0 ].lastName || "" }`.trim(),
        tower: normalizeTowerValue( candidates[ 0 ].tower ),
      };
    }

    return { name: "", tower: towerSnapshot };
  };

  const getTowerLabel = ( payment: PaymentRecord ) => {
    const towerSnapshot = normalizeTowerValue( payment.towerSnapshot );
    if ( towerSnapshot ) return `Torre ${ towerSnapshot }`;
    const fallbackTower = resolveCondominoMeta( payment ).tower;
    return fallbackTower ? `Torre ${ fallbackTower }` : "-";
  };

  const getCondominoName = ( payment: PaymentRecord ) =>
    resolveCondominoMeta( payment ).name || "No identificado";

  // Cargar la primera página al montar
  useEffect( () => {
    const loadInitialPayments = async () => {
      setLoadingPayments( true );
      try {
        const count = await fetchPaymentHistory( ITEMS_PER_PAGE, null, filters );
        setHasMore( count === ITEMS_PER_PAGE );
        // Capturamos el lastPaymentDoc actualizado usando getState()
        const updatedLastDoc = usePaymentSummaryStore.getState().lastPaymentDoc;
        if ( updatedLastDoc ) {
          // La posición 0 es null para la página 1, la 1 corresponderá al cursor de la página 1
          setPageCursors( [ null, updatedLastDoc ] );
        } else {
          setPageCursors( [ null ] );
        }
        setCurrentPage( 1 );
      } catch ( error ) {
        console.error( "Error al cargar pagos iniciales:", error );
      } finally {
        setLoadingPayments( false );
      }
    };
    loadInitialPayments();
    return () => {
      resetPaymentsState();
    };
  }, [ fetchPaymentHistory, resetPaymentsState, filters ] );

  // Si se cambian los filtros, se reinicia la paginación
  const handleFilterChange = async ( key: keyof FilterState, value: string ) => {
    if ( loadingPayments ) return;

    const newFilters = { ...filters, [ key ]: value };
    setFilters( newFilters );

    setCurrentPage( 1 );
    setPageCursors( [ null ] );
    setHasMore( true );
    setLoadingPayments( true );
    resetPaymentsState();
    const count = await fetchPaymentHistory( ITEMS_PER_PAGE, null, {
      month: newFilters.month,
      year: newFilters.year,
    } );
    setHasMore( count === ITEMS_PER_PAGE );
    setLoadingPayments( false );
  };

  const handleSearchByFolio = async () => {
    if ( isSearching ) return;

    const folio = folioQuery.trim();
    if ( !folio ) {
      setShowSearchModal( false );
      setSearchResults( [] );
      return;
    }

    setIsSearching( true );
    setShowSearchModal( true );
    try {
      const results = await searchPaymentByFolio( folio );
      setSearchResults( results );
    } catch ( error ) {
      console.error( "Error al buscar por folio:", error );
      setSearchResults( [] );
    } finally {
      setIsSearching( false );
    }
  };

  const closeReversalModal = () => {
    if ( reversalCommitLoading ) return;

    setReversalTargetPayment( null );
    setReversalReason( "" );
    setReversalNotes( "" );
    setReversalConfirmText( "" );
    resetReversalState();
  };

  const handleOpenReversalModal = async ( payment: PaymentRecord ) => {
    if ( !isAdminUser ) {
      toast.error( "Solo los administradores pueden revertir pagos." );
      return;
    }

    setReversalTargetPayment( payment );
    setReversalReason( "" );
    setReversalNotes( "" );
    setReversalConfirmText( "" );
    resetReversalState();

    try {
      await previewPaymentReversal( { paymentId: payment.id } );
    } catch ( error: any ) {
      toast.error(
        error?.message || "No se pudo validar el pago para reversa."
      );
    }
  };

  const handleConfirmReversal = async () => {
    if ( !reversalTargetPayment ) return;

    const normalizedConfirmText = reversalConfirmText.trim().toUpperCase();
    if ( !reversalReason.trim() ) {
      toast.error( "Selecciona un motivo de eliminación." );
      return;
    }
    if ( normalizedConfirmText !== "ELIMINAR" ) {
      toast.error( "Escribe ELIMINAR para confirmar la operación." );
      return;
    }

    try {
      const result = await commitPaymentReversal( {
        paymentId: reversalTargetPayment.id,
        reason: reversalReason.trim(),
        notes: reversalNotes.trim(),
        operationId: reversalPreview?.operationId,
      } );

      await writeAuditLog( {
        module: "Ingresos",
        entityType: "payment_reversal",
        entityId: reversalTargetPayment.id,
        action: "other",
        summary: `Reversa de pago solicitada. Operación: ${ result?.operationId || reversalPreview?.operationId || "N/A"
          }`,
        metadata: {
          operationId: result?.operationId || reversalPreview?.operationId || "",
          paymentId: reversalTargetPayment.id,
          reason: reversalReason.trim(),
          notes: reversalNotes.trim(),
          source: "history_payments_table",
        },
        before: {
          amountPaid: reversalTargetPayment.amountPaid,
          paymentDate: reversalTargetPayment.paymentDate,
          numberCondominium: reversalTargetPayment.numberCondominium,
          userId: reversalTargetPayment.userId,
          paymentGroupId: reversalTargetPayment.paymentGroupId || "",
        },
        after: {
          status: "reversed",
        },
      } );

      toast.success(
        `Pago revertido correctamente${ result?.operationId ? ` (Operación ${ result.operationId })` : ""
        }`
      );

      closeReversalModal();
      setSelectedPayment( null );
      setShowSearchModal( false );
      setFilters( ( prev ) => ( { ...prev } ) );
      await fetchSummary( filters.year, true );
      if ( historyViewMode === "reversals" ) {
        await loadReversalHistory( { reset: true, customPage: 1 } );
      }
    } catch ( error: any ) {
      toast.error( error?.message || "No se pudo completar la reversa." );
    }
  };

  // Manejo de cambio de página (anterior/siguiente o salto directo)
  const handlePageChange = async ( newPage: number ) => {
    if ( loadingPayments ) return;
    if ( newPage === currentPage ) return;
    setLoadingPayments( true );
    try {
      let startAfter: any = null;
      if ( newPage === 1 ) {
        startAfter = null;
      } else {
        startAfter = pageCursors[ newPage - 1 ];
      }
      const count = await fetchPaymentHistory(
        ITEMS_PER_PAGE,
        startAfter,
        filters
      );
      // Si se intenta avanzar y no se obtienen registros nuevos, se evita actualizar la página
      if ( newPage > currentPage && count === 0 ) {
        setHasMore( false );
        return;
      }
      setHasMore( count === ITEMS_PER_PAGE );
      // Si se avanzó a una nueva página y aún no se tiene su cursor, se agrega
      if (
        newPage > pageCursors.length - 1 &&
        usePaymentSummaryStore.getState().lastPaymentDoc &&
        count > 0
      ) {
        setPageCursors( ( prev ) => [
          ...prev,
          usePaymentSummaryStore.getState().lastPaymentDoc,
        ] );
      }
      setCurrentPage( newPage );
    } catch ( error ) {
      console.error( "Error al cambiar de página:", error );
    } finally {
      setLoadingPayments( false );
    }
  };

  // Si existen más registros, asumimos que hay al menos una página extra.
  const totalPages = hasMore ? currentPage + 1 : currentPage;
  const canSubmitReversal =
    Boolean( reversalPreview ) &&
    reversalReason.trim().length > 0 &&
    reversalConfirmText.trim().toUpperCase() === "ELIMINAR" &&
    !reversalPreviewLoading &&
    !reversalCommitLoading &&
    reversalPreview?.reversible !== false;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg ">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Historial de Pagos
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Lista de todos los pagos registrados en el sistema
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-4">
          { historyViewMode === "payments" ? (
            <>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={ folioQuery }
                  onChange={ ( e ) => setFolioQuery( e.target.value ) }
                  onKeyDown={ ( e ) => {
                    if ( e.key === "Enter" ) {
                      e.preventDefault();
                      handleSearchByFolio();
                    }
                  } }
                  placeholder="Buscar por folio..."
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                />
              </div>
              <button
                type="button"
                onClick={ handleSearchByFolio }
                disabled={ isSearching }
                className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={ () => setShowFilters( !showFilters ) }
                className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtros
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Las eliminaciones exitosas y su operación quedan auditadas en Audit
              Trail.
            </p>
          ) }
        </div>
      </div>

      { isAdminUser && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={ () => setHistoryViewMode( "payments" ) }
            className={ `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${ historyViewMode === "payments"
              ? "bg-indigo-600 text-white"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }` }
          >
            Historial de pagos
          </button>
          <button
            type="button"
            onClick={ () => setHistoryViewMode( "reversals" ) }
            className={ `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${ historyViewMode === "reversals"
              ? "bg-indigo-600 text-white"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }` }
          >
            Historial de eliminaciones
          </button>
        </div>
      ) }

      { historyViewMode === "payments" ? (
        <>
          {/* Filtros */ }
          { showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="shadow-lg rounded p-4">
                <label
                  htmlFor="year-filter"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Año
                </label>
                <select
                  value={ filters.year }
                  onChange={ ( e ) => handleFilterChange( "year", e.target.value ) }
                  className="block w-full rounded-md bg-gray-50 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
                >
                  { [ 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030 ].map(
                    ( year ) => (
                      <option key={ year } value={ year }>
                        { year }
                      </option>
                    )
                  ) }
                </select>
              </div>
              <div className="shadow-lg rounded p-4">
                <label
                  htmlFor="month-filter"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Mes
                </label>
                <select
                  value={ filters.month }
                  onChange={ ( e ) => handleFilterChange( "month", e.target.value ) }
                  className="block w-full rounded-md bg-gray-50 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-900 cursor-pointer"
                >
                  { MONTHS.map( ( month ) => (
                    <option key={ month.value } value={ month.value }>
                      { month.label }
                    </option>
                  ) ) }
                </select>
              </div>
            </div>
          ) }

          {/* Mensaje de no resultados */ }
          { noResults && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No se encontraron pagos con el folio especificado
            </div>
          ) }

          {/* Tabla */ }
          { !noResults && completedPayments.length > 0 && (
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                          >
                            <div className="flex items-center gap-1">
                              Fecha
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-20 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Fecha en que se realizó el pago
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Monto
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Monto abonado + Saldo a favor utilizado (en caso
                                  de que aplique)
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Saldo a favor
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Saldo a favor generado o utilizado en este pago.
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Número de Condómino
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Identificador único del condómino
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            Torre
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Concepto
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Descripción del pago realizado
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Comprobante
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-[-36px] transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Documento que respalda el pago realizado
                                </div>
                              </div>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            <div className="flex items-center gap-1">
                              Recibo
                              <div className="group relative cursor-pointer">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                                <div className="absolute top-full left-[-36px] transform -translate-x-1/2 mt-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  Recibo generado automáticamente por el sistema
                                </div>
                              </div>
                            </div>
                          </th>
                          { isAdminUser && (
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              Acciones
                            </th>
                          ) }
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        { completedPayments.map( ( payment ) => (
                          <tr
                            key={ payment.id }
                            className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                            onClick={ () => setSelectedPayment( payment ) }
                          >
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                              { payment.paymentDate || "No identificado" }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { formatCurrency(
                                payment.amountPaid + ( payment.creditBalance || 0 )
                              ) }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <div className="flex flex-col gap-1">
                                { payment.creditBalance > 0 && (
                                  <span className="text-green-600 dark:text-green-400">
                                    +{ formatCurrency( payment.creditBalance ) }
                                  </span>
                                ) }
                                { ( payment.creditUsed || 0 ) > 0 && (
                                  <span className="text-red-600 dark:text-red-400">
                                    -{ formatCurrency( payment.creditUsed || 0 ) }
                                  </span>
                                ) }
                                { payment.creditBalance === 0 &&
                                  ( payment.creditUsed || 0 ) === 0 && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      { formatCurrency( 0 ) }
                                    </span>
                                  ) }
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { payment.numberCondominium || "No identificado" }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { getTowerLabel( payment ) }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { payment.concept || "No identificado" }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { payment.attachmentPayment ? (
                                <a
                                  href={ payment.attachmentPayment }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={ ( e ) => e.stopPropagation() }
                                  className="inline-flex w-fit items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Ver
                                </a>
                              ) : (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              ) }
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              { payment.receiptUrl ? (
                                <a
                                  href={ payment.receiptUrl }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={ ( e ) => e.stopPropagation() }
                                  className="inline-flex w-fit items-center border border-indigo-300 bg-indigo-50 px-3 py-1 rounded-md text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Ver
                                </a>
                              ) : (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              ) }
                            </td>
                            { isAdminUser && (
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                <button
                                  type="button"
                                  onClick={ ( e ) => {
                                    e.stopPropagation();
                                    handleOpenReversalModal( payment );
                                  } }
                                  className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                                >
                                  <ArrowUturnLeftIcon className="mr-1 h-4 w-4" />
                                  Revertir
                                </button>
                              </td>
                            ) }
                          </tr>
                        ) ) }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) }

          { loadingPayments && completedPayments.length > 0 && (
            <div className="flex justify-center items-center py-2">
              <LoadingApp />
            </div>
          ) }

          {/* Paginación */ }
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={ () => handlePageChange( currentPage - 1 ) }
                disabled={ currentPage === 1 || loadingPayments }
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={ () => handlePageChange( currentPage + 1 ) }
                disabled={ loadingPayments || !hasMore }
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Página <span className="font-medium">{ currentPage }</span> de{ " " }
                  <span className="font-medium">{ totalPages }</span>
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex  rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={ () => handlePageChange( currentPage - 1 ) }
                    disabled={ currentPage === 1 || loadingPayments }
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2 cursor-pointer"
                  >
                    Anterior
                  </button>
                  { Array.from( { length: totalPages }, ( _, i ) => i + 1 ).map(
                    ( page ) => (
                      <button
                        key={ page }
                        onClick={ () => handlePageChange( page ) }
                        className={ `relative inline-flex items-center px-4 py-2 text-sm font-semibold ${ page === currentPage
                          ? "z-10 bg-indigo-700 border-2 text-white border-indigo-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                          : "z-10  border-2 border-indigo-700  rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                          }` }
                      >
                        { page }
                      </button>
                    )
                  ) }
                  <button
                    onClick={ () => handlePageChange( currentPage + 1 ) }
                    disabled={ loadingPayments || !hasMore }
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2 cursor-pointer"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-4">
          { !isAdminUser ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Solo el rol administrador puede consultar el historial de
              reversas.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={ reversalFilters.from }
                    onChange={ ( e ) =>
                      setReversalFilters( ( prev ) => ( {
                        ...prev,
                        from: e.target.value,
                      } ) )
                    }
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={ reversalFilters.to }
                    onChange={ ( e ) =>
                      setReversalFilters( ( prev ) => ( {
                        ...prev,
                        to: e.target.value,
                      } ) )
                    }
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Payment ID
                  </label>
                  <input
                    type="text"
                    value={ reversalFilters.paymentId }
                    onChange={ ( e ) =>
                      setReversalFilters( ( prev ) => ( {
                        ...prev,
                        paymentId: e.target.value,
                      } ) )
                    }
                    placeholder="Opcional"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={ () =>
                      loadReversalHistory( {
                        reset: true,
                        customPage: 1,
                      } )
                    }
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={ () => {
                      const clearedFilters: ReversalFilterState = {
                        from: "",
                        to: "",
                        paymentId: "",
                      };
                      setReversalFilters( clearedFilters );
                      loadReversalHistory( {
                        reset: true,
                        customPage: 1,
                        customFilters: clearedFilters,
                      } );
                    } }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Audit Trail: cada eliminación confirmada se registra como evento en
                auditoría y se puede rastrear por `operationId`.
              </div>

              { reversalHistoryLoading && reversalRows.length === 0 ? (
                <div className="flex justify-center py-6">
                  <LoadingApp />
                </div>
              ) : reversalRows.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  No hay eliminaciones registradas con los filtros actuales.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Operación
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Payment ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Motivo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Estado
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Usuario
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      { reversalRows.map( ( row ) => (
                        <tr key={ row.id }>
                          <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-100">
                            { row.operationId }
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                            { row.paymentId }
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-100">
                            { row.reason }
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-100">
                            { row.status }
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-100">
                            { row.performedBy }
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-100">
                            { formatDateTimeValue( row.performedAt ) }
                          </td>
                        </tr>
                      ) ) }
                    </tbody>
                  </table>
                </div>
              ) }

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Registros cargados: { reversalRows.length }
                  { reversalTotal > 0 ? ` de ${ reversalTotal }` : "" }
                </p>
                { reversalRows.length < reversalTotal && (
                  <button
                    type="button"
                    onClick={ () =>
                      loadReversalHistory( {
                        customPage: reversalPage + 1,
                      } )
                    }
                    disabled={ reversalHistoryLoading }
                    className="rounded-md border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                  >
                    { reversalHistoryLoading ? "Cargando..." : "Cargar más" }
                  </button>
                ) }
              </div>
            </>
          ) }
        </div>
      ) }

      {/* Modal de detalle de pago */ }
      { selectedPayment &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1200] bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={ () => setSelectedPayment( null ) }
          >
            <div className="flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
              <div
                className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:p-6"
                onClick={ ( e ) => e.stopPropagation() }
              >
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={ () => setSelectedPayment( null ) }
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  Detalle de pago
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de pago</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { selectedPayment.paymentDate || "No identificada" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cuenta destino</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { financialAccountsMap[ selectedPayment.financialAccountId ]?.name ||
                        selectedPayment.financialAccountId ||
                        "No identificada" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto pagado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatCurrency( selectedPayment.amountPaid ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crédito generado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatCurrency( selectedPayment.creditBalance || 0 ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crédito usado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatCurrency( selectedPayment.creditUsed || 0 ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monto pendiente</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatCurrency( selectedPayment.amountPending || 0 ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cargos de referencia</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatCurrency( selectedPayment.referenceAmount || 0 ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { selectedPayment.paid ? "Pagado" : "Pendiente" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Número de condómino</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { selectedPayment.numberCondominium || "No identificado" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nombre del condómino</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { getCondominoName( selectedPayment ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Torre</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { getTowerLabel( selectedPayment ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Concepto</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { selectedPayment.concept || "No identificado" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mes</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { formatMonthLabel( selectedPayment.month ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de pago</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      { selectedPayment.paymentType || "No especificado" }
                    </p>
                  </div>
                </div>

                { ( selectedPayment.attachmentPayment || selectedPayment.receiptUrl ) && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      { selectedPayment.attachmentPayment && (
                        <a
                          href={ selectedPayment.attachmentPayment }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Ver comprobante
                        </a>
                      ) }
                      { selectedPayment.receiptUrl && (
                        <a
                          href={ selectedPayment.receiptUrl }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                        >
                          Ver recibo
                        </a>
                      ) }
                    </div>
                  </div>
                ) }

                { isAdminUser && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Acción sensible: solo se
                      permite para rol administrador.
                    </p>
                    <button
                      type="button"
                      onClick={ () => handleOpenReversalModal( selectedPayment ) }
                      className="mt-2 inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/40"
                    >
                      <ArrowUturnLeftIcon className="mr-1 h-4 w-4" />
                      Revertir este pago
                    </button>
                  </div>
                ) }
              </div>
            </div>
          </div>,
          document.body
        ) }

      {/* Modal de reversa de pago */ }
      { reversalTargetPayment &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1300] bg-gray-900/60"
            onClick={ closeReversalModal }
          >
            <div className="flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
              <div
                className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
                onClick={ ( e ) => e.stopPropagation() }
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Confirmar eliminación de pago
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Esta acción es sensible, solo se permite para rol administrador.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={ closeReversalModal }
                    disabled={ reversalCommitLoading }
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Condómino
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      { reversalTargetPayment.numberCondominium || "-" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Torre
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      { getTowerLabel( reversalTargetPayment ) }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fecha de pago
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      { reversalTargetPayment.paymentDate || "No identificada" }
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Monto
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      { formatCurrency( reversalTargetPayment.amountPaid || 0 ) }
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-700 dark:bg-indigo-900/20">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                    Validación previa
                  </p>
                  { reversalPreviewLoading ? (
                    <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">
                      Validando impacto de eliminación...
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">
                        Estado:{ " " }
                        { reversalPreview?.reversible === false
                          ? "No reversible"
                          : "Listo para confirmar" }
                      </p>
                      { reversalPreview?.operationId && (
                        <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">
                          Operación: { reversalPreview.operationId }
                        </p>
                      ) }
                      { reversalPreview?.message && (
                        <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">
                          { reversalPreview.message }
                        </p>
                      ) }
                    </>
                  ) }
                </div>

                { reversalError && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    { reversalError }
                  </div>
                ) }

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Motivo de eliminación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ reversalReason }
                    onChange={ ( e ) => setReversalReason( e.target.value ) }
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    disabled={ reversalCommitLoading }
                  >
                    <option value="">Selecciona un motivo</option>
                    { REVERSAL_REASON_OPTIONS.map( ( reason ) => (
                      <option key={ reason } value={ reason }>
                        { reason }
                      </option>
                    ) ) }
                  </select>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={ reversalNotes }
                    onChange={ ( e ) => setReversalNotes( e.target.value ) }
                    rows={ 3 }
                    maxLength={ 500 }
                    disabled={ reversalCommitLoading }
                    placeholder="Explica brevemente por qué se necesita la eliminación."
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirmación de seguridad
                  </label>
                  <input
                    type="text"
                    value={ reversalConfirmText }
                    onChange={ ( e ) => setReversalConfirmText( e.target.value ) }
                    disabled={ reversalCommitLoading }
                    placeholder='Escribe "ELIMINAR" para confirmar'
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={ closeReversalModal }
                    disabled={ reversalCommitLoading }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={ handleConfirmReversal }
                    disabled={ !canSubmitReversal }
                    className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    { reversalCommitLoading ? "Eliminando..." : "Confirmar eliminación" }
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        ) }

      {/* Modal de búsqueda por folio */ }
      { showSearchModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1200] bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={ () => {
              setShowSearchModal( false );
              setFolioQuery( "" );
            } }
          >
            <div className="flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
              <div
                className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:p-6"
                onClick={ ( e ) => e.stopPropagation() }
              >
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={ () => {
                      setShowSearchModal( false );
                      setFolioQuery( "" );
                    } }
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Resultados de búsqueda por folio
                  </h3>

                  { isSearching ? (
                    <div className="flex justify-center items-center py-8">
                      <LoadingApp />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron pagos con el folio especificado
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Fecha
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Monto
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Saldo a favor
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Número de Condómino
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Torre
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Concepto
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Comprobante
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    Recibo
                                  </th>
                                  { isAdminUser && (
                                    <th
                                      scope="col"
                                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                    >
                                      Acciones
                                    </th>
                                  ) }
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                { searchResults.map( ( payment ) => (
                                  <tr
                                    key={ payment.id }
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    onClick={ () => setSelectedPayment( payment ) }
                                  >
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200">
                                      { payment.paymentDate || "No identificado" }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { formatCurrency(
                                        payment.amountPaid +
                                        ( payment.creditBalance || 0 )
                                      ) }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <div className="flex flex-col gap-1">
                                        { payment.creditBalance > 0 && (
                                          <span className="text-green-600 dark:text-green-400">
                                            +
                                            { formatCurrency(
                                              payment.creditBalance
                                            ) }
                                          </span>
                                        ) }
                                        { ( payment.creditUsed || 0 ) > 0 && (
                                          <span className="text-red-600 dark:text-red-400">
                                            -
                                            { formatCurrency(
                                              payment.creditUsed || 0
                                            ) }
                                          </span>
                                        ) }
                                        { payment.creditBalance === 0 &&
                                          ( payment.creditUsed || 0 ) === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                              { formatCurrency( 0 ) }
                                            </span>
                                          ) }
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { payment.numberCondominium ||
                                        "No identificado" }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { getTowerLabel( payment ) }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { payment.concept || "No identificado" }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { payment.attachmentPayment ? (
                                        <a
                                          href={ payment.attachmentPayment }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={ ( e ) => e.stopPropagation() }
                                          className="inline-flex w-fit items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                          <EyeIcon className="h-4 w-4 mr-1" />
                                          Ver
                                        </a>
                                      ) : (
                                        <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                      ) }
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                      { payment.receiptUrl ? (
                                        <a
                                          href={ payment.receiptUrl }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={ ( e ) => e.stopPropagation() }
                                          className="inline-flex w-fit items-center border border-indigo-300 bg-indigo-50 px-3 py-1 rounded-md text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                                        >
                                          <EyeIcon className="h-4 w-4 mr-1" />
                                          Ver
                                        </a>
                                      ) : (
                                        <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                      ) }
                                    </td>
                                    { isAdminUser && (
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                        <button
                                          type="button"
                                          onClick={ ( e ) => {
                                            e.stopPropagation();
                                            handleOpenReversalModal( payment );
                                          } }
                                          className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                                        >
                                          <ArrowUturnLeftIcon className="mr-1 h-4 w-4" />
                                          Revertir
                                        </button>
                                      </td>
                                    ) }
                                  </tr>
                                ) ) }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) }
                </div>
              </div>
            </div>
          </div>,
          document.body
        ) }
    </div>
  );
};

export default HistoryPaymentsTable;
