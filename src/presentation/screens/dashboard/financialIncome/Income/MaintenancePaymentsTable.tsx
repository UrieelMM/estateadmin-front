import React, { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ReceiptRefundIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import { formatCurrency } from "../../../../../utils/curreyncy";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 50;
const MAINTENANCE_CONCEPT = "mantenimiento";

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

const YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(
  ( y ) => ( { value: String( y ), label: String( y ) } )
);

// Badge color map for payment type
const PAYMENT_TYPE_STYLES: Record<string, string> = {
  transferencia:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300",
  depósito:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/25 dark:text-violet-300",
  deposito:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/25 dark:text-violet-300",
  efectivo:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300",
  cheque:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300",
};

const getPaymentTypeBadgeClass = ( type: string ) => {
  const key = type.toLowerCase().normalize( "NFD" ).replace( /[\u0300-\u036f]/g, "" );
  for ( const [ k, cls ] of Object.entries( PAYMENT_TYPE_STYLES ) ) {
    if ( key.includes( k ) ) return cls;
  }
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
type SortField = "paymentDate" | "amount" | "condominiumNumber" | "tower" | "month" | "paymentType";
type SortDir   = "asc" | "desc";

const normalizeTower = ( val: unknown ): string =>
  String( val ?? "" )
    .replace( /^torre\s*/i, "" )
    .trim();

const normalizeSearch = ( val: string ) =>
  val
    .normalize( "NFD" )
    .replace( /[\u0300-\u036f]/g, "" )
    .toLowerCase()
    .trim();

const parseDateDMY = ( dateStr: string ): Date | null => {
  if ( !dateStr ) return null;
  const parts = dateStr.split( "/" );
  if ( parts.length === 3 ) {
    const [ d, m, y ] = parts;
    const parsed = new Date( `${ y }-${ m }-${ d }` );
    if ( !isNaN( parsed.getTime() ) ) return parsed;
  }
  const parsed = new Date( dateStr );
  return isNaN( parsed.getTime() ) ? null : parsed;
};

const formatMonthLabel = ( monthValue: string ): string => {
  const raw = String( monthValue || "" ).trim();
  if ( !raw ) return "N/A";
  let normalized = raw;
  if ( /^\d{4}-\d{2}$/.test( raw ) ) normalized = raw.slice( 5, 7 );
  else if ( /^\d{1}$/.test( raw ) ) normalized = raw.padStart( 2, "0" );
  const found = MONTHS.find( ( m ) => m.value === normalized );
  return found ? found.label : raw;
};

// ────────────────────────────────────────────────────────────
// Row type
// ────────────────────────────────────────────────────────────
interface MaintenanceRow {
  id: string;
  condominiumNumber: string;
  condominiumName: string;
  tower: string;
  paymentDate: string;
  parsedDate: Date | null;
  amount: number;
  reference: string;
  month: string;
  paymentType: string;
  concept: string;
}

// ────────────────────────────────────────────────────────────
// Derive a row from a PaymentRecord (from fetchPaymentHistory)
// ────────────────────────────────────────────────────────────
const buildRow = (
  rec: PaymentRecord,
  userByNumber: Map<string, { name: string; lastName: string; tower: string; }>
): MaintenanceRow => {
  const condoNumber = String( rec.numberCondominium || "" ).trim();
  const towerSnap   = normalizeTower( rec.towerSnapshot );
  const userInfo    = userByNumber.get( condoNumber );
  const name = userInfo
    ? `${ userInfo.name } ${ userInfo.lastName }`.trim()
    : "";
  const tower = towerSnap || normalizeTower( userInfo?.tower );
  const parsedDate  = rec.paymentDate ? parseDateDMY( rec.paymentDate ) : null;
  const month = String( rec.month || "" ).padStart( 2, "0" );

  return {
    id: rec.id,
    condominiumNumber: condoNumber,
    condominiumName: name,
    tower,
    paymentDate: rec.paymentDate || "",
    parsedDate,
    amount: rec.amountPaid,
    reference: rec.paymentGroupId || rec.chargeId || rec.id,
    month,
    paymentType: rec.paymentType || "",
    concept: rec.concept || "",
  };
};

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
const MaintenancePaymentsTable: React.FC = () => {
  // ── Store ────────────────────────────────────────────────
  const {
    completedPayments,
    fetchPaymentHistory,
    resetPaymentsState,
    lastPaymentDoc,
  } = usePaymentSummaryStore( ( s ) => ( {
    completedPayments:  s.completedPayments,
    fetchPaymentHistory: s.fetchPaymentHistory,
    resetPaymentsState: s.resetPaymentsState,
    lastPaymentDoc:     s.lastPaymentDoc,
  } ) );
  const condominiumsUsers = useUserStore( ( s ) => s.condominiumsUsers );

  // ── Local loading / pagination cursors  ─────────────────
  const [ loadingPayments, setLoadingPayments ] = useState( false );
  // We load ALL pages upfront (filtered server-side by date; concept filtered client-side)
  // because the concept filter is client-side. We fetch in batches of 300.
  const [ allFetched, setAllFetched ] = useState<PaymentRecord[]>( [] );
  const [ fetchDone,  setFetchDone   ] = useState( false );

  // ── UI states ────────────────────────────────────────────
  const [ search,      setSearch      ] = useState( "" );
  const [ showFilters, setShowFilters ] = useState( false );
  const [ filterMonth, setFilterMonth ] = useState( "" );
  const [ filterYear,  setFilterYear  ] = useState( "" );
  const [ filterTower, setFilterTower ] = useState( "" );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ sortField, setSortField ] = useState<SortField>( "paymentDate" );
  const [ sortDir,   setSortDir   ] = useState<SortDir>( "desc" );

  // ── Fetch ALL payments and keep only maintenance ones ────
  useEffect( () => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoadingPayments( true );
      setFetchDone( false );
      resetPaymentsState();

      const batchSize = 300;
      let cursor: any = null;
      const accumulated: PaymentRecord[] = [];

      try {
        while ( true ) {
          const count = await fetchPaymentHistory( batchSize, cursor, {} );
          const page  = usePaymentSummaryStore.getState().completedPayments;

          // Filter maintenance records from this batch
          page.forEach( ( rec ) => {
            const conceptNorm = String( rec.concept ?? "" ).toLowerCase();
            if ( conceptNorm.includes( MAINTENANCE_CONCEPT ) && rec.amountPaid > 0 ) {
              accumulated.push( rec );
            }
          } );

          const newLastDoc = usePaymentSummaryStore.getState().lastPaymentDoc;
          if ( count < batchSize || !newLastDoc ) break;
          cursor = newLastDoc;
        }
      } catch ( err ) {
        console.error( "Error fetching maintenance payments:", err );
      } finally {
        if ( !cancelled ) {
          setAllFetched( accumulated );
          setFetchDone( true );
          setLoadingPayments( false );
          resetPaymentsState();
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
      resetPaymentsState();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] );

  // ── Build user-lookup map ────────────────────────────────
  const userByNumber = useMemo( () => {
    const map = new Map<string, { name: string; lastName: string; tower: string; }>();
    condominiumsUsers.forEach( ( u ) => {
      if ( u.number ) {
        map.set( String( u.number ).trim(), {
          name: u.name || "",
          lastName: u.lastName || "",
          tower: u.tower || "",
        } );
      }
    } );
    return map;
  }, [ condominiumsUsers ] );

  // ── Build rows from all fetched maintenance payments ─────
  const allRows = useMemo( () =>
    allFetched.map( ( rec ) => buildRow( rec, userByNumber ) ),
    [ allFetched, userByNumber ]
  );

  // ── Unique towers ────────────────────────────────────────
  const availableTowers = useMemo( () => {
    const set = new Set<string>();
    allRows.forEach( ( r ) => { if ( r.tower ) set.add( r.tower ); } );
    return Array.from( set ).sort( ( a, b ) =>
      a.localeCompare( b, "es", { numeric: true } )
    );
  }, [ allRows ] );

  // ── Unique payment types ──────────────────────────────────
  const availablePaymentTypes = useMemo( () => {
    const set = new Set<string>();
    allRows.forEach( ( r ) => { if ( r.paymentType ) set.add( r.paymentType ); } );
    return Array.from( set ).sort();
  }, [ allRows ] );

  // ── Filter & search ──────────────────────────────────────
  const [ filterPaymentType, setFilterPaymentType ] = useState( "" );

  const filtered = useMemo( () => {
    const q  = normalizeSearch( search );
    const tw = normalizeSearch( filterTower );

    return allRows.filter( ( row ) => {
      // Text search: name, number, tower
      if ( q ) {
        const numMatch   = row.condominiumNumber.toLowerCase().includes( q );
        const nameMatch  = normalizeSearch( row.condominiumName ).includes( q );
        const towerMatch = normalizeSearch( row.tower ).includes( q );
        if ( !numMatch && !nameMatch && !towerMatch ) return false;
      }
      // Tower dropdown
      if ( tw && normalizeSearch( row.tower ) !== tw ) return false;
      // Month
      if ( filterMonth && row.month !== filterMonth ) return false;
      // Year
      if ( filterYear ) {
        if ( row.parsedDate ) {
          if ( String( row.parsedDate.getFullYear() ) !== filterYear ) return false;
        } else {
          return false;
        }
      }
      // Payment type
      if ( filterPaymentType ) {
        if ( row.paymentType.toLowerCase() !== filterPaymentType.toLowerCase() ) return false;
      }
      return true;
    } );
  }, [ allRows, search, filterTower, filterMonth, filterYear, filterPaymentType ] );

  // ── Sort ─────────────────────────────────────────────────
  const sorted = useMemo( () => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [ ...filtered ].sort( ( a, b ) => {
      switch ( sortField ) {
        case "paymentDate": {
          const ta = a.parsedDate?.getTime() ?? 0;
          const tb = b.parsedDate?.getTime() ?? 0;
          return dir * ( ta - tb );
        }
        case "amount":
          return dir * ( a.amount - b.amount );
        case "condominiumNumber":
          return dir * a.condominiumNumber.localeCompare( b.condominiumNumber, "es", { numeric: true } );
        case "tower":
          return dir * a.tower.localeCompare( b.tower, "es", { numeric: true } );
        case "month":
          return dir * a.month.localeCompare( b.month );
        case "paymentType":
          return dir * a.paymentType.localeCompare( b.paymentType, "es" );
        default:
          return 0;
      }
    } );
  }, [ filtered, sortField, sortDir ] );

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max( 1, Math.ceil( sorted.length / ITEMS_PER_PAGE ) );
  const safePage   = Math.min( currentPage, totalPages );
  const pageRows   = sorted.slice(
    ( safePage - 1 ) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const goToPage = ( p: number ) =>
    setCurrentPage( Math.max( 1, Math.min( totalPages, p ) ) );

  const handleSearch       = ( v: string ) => { setSearch( v );            setCurrentPage( 1 ); };
  const handleMonth        = ( v: string ) => { setFilterMonth( v );       setCurrentPage( 1 ); };
  const handleYear         = ( v: string ) => { setFilterYear( v );        setCurrentPage( 1 ); };
  const handleTower        = ( v: string ) => { setFilterTower( v );       setCurrentPage( 1 ); };
  const handlePaymentType  = ( v: string ) => { setFilterPaymentType( v ); setCurrentPage( 1 ); };

  const toggleSort = ( field: SortField ) => {
    if ( sortField === field ) {
      setSortDir( ( d ) => ( d === "asc" ? "desc" : "asc" ) );
    } else {
      setSortField( field );
      setSortDir( "desc" );
    }
    setCurrentPage( 1 );
  };

  const clearFilters = () => {
    setSearch( "" );
    setFilterMonth( "" );
    setFilterYear( "" );
    setFilterTower( "" );
    setFilterPaymentType( "" );
    setCurrentPage( 1 );
  };

  const hasActiveFilters =
    !!search || !!filterMonth || !!filterYear || !!filterTower || !!filterPaymentType;

  // ── Sort icon helper ─────────────────────────────────────
  const SortIcon = ( { field }: { field: SortField; } ) => {
    if ( sortField !== field )
      return <ArrowsUpDownIcon className="h-3.5 w-3.5 ml-1 text-gray-400 opacity-60" />;
    return sortDir === "asc"
      ? <ArrowUpIcon   className="h-3.5 w-3.5 ml-1 text-indigo-400" />
      : <ArrowDownIcon className="h-3.5 w-3.5 ml-1 text-indigo-400" />;
  };

  // ── Column header ─────────────────────────────────────────
  const Th = ( {
    label,
    field,
    icon: Icon,
  }: {
    label: string;
    field?: SortField;
    icon?: React.FC<{ className?: string; }>;
  } ) => (
    <th
      scope="col"
      className={
        `px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap select-none
         text-gray-500 dark:text-gray-400
         ${ field ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150" : "" }`
      }
      onClick={ field ? () => toggleSort( field ) : undefined }
    >
      <span className="inline-flex items-center gap-1.5">
        { Icon && <Icon className="h-3.5 w-3.5" /> }
        { label }
        { field && <SortIcon field={ field } /> }
      </span>
    </th>
  );

  // ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Cuotas de Mantenimiento
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            { fetchDone
              ? <>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{ sorted.length }</span>
                  { " " }registro{ sorted.length !== 1 ? "s" : "" } encontrado{ sorted.length !== 1 ? "s" : "" }
                  { " de " }
                  <span className="font-medium text-gray-700 dark:text-gray-300">{ allRows.length }</span>
                  { " total" }
                </>
              : "Cargando registros…"
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={ search }
              onChange={ ( e ) => handleSearch( e.target.value ) }
              placeholder="Buscar por nombre, número o torre…"
              className="
                block w-64 rounded-xl border border-gray-200 bg-white/80 py-2 pl-9 pr-8 text-sm
                placeholder-gray-400 shadow-sm backdrop-blur-sm
                focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30
                dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:placeholder-gray-500
                transition-all duration-200
              "
            />
            { search && (
              <button
                onClick={ () => handleSearch( "" ) }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            ) }
          </div>

          {/* Filters toggle */}
          <button
            type="button"
            onClick={ () => setShowFilters( ( v ) => !v ) }
            className={
              `inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition-all duration-200
               ${ showFilters
                 ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                 : "border-gray-200 bg-white/80 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
               }`
            }
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            { hasActiveFilters && (
              <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                { [ search, filterMonth, filterYear, filterTower, filterPaymentType ].filter( Boolean ).length }
              </span>
            ) }
          </button>

          { hasActiveFilters && (
            <button
              type="button"
              onClick={ clearFilters }
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-400"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Limpiar
            </button>
          ) }
        </div>
      </div>

      {/* ── Filter panel ───────────────────────────────── */}
      { showFilters && (
        <div
          className="
            grid grid-cols-2 gap-3 rounded-2xl border border-gray-200/60 bg-white/60 p-4
            backdrop-blur-md shadow-sm dark:border-gray-700/60 dark:bg-gray-800/60
            sm:grid-cols-4
          "
          style={ { animation: "fadeSlideDown 180ms cubic-bezier(0.23,1,0.32,1) both" } }
        >
          {/* Tower */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Torre
            </label>
            <select
              value={ filterTower }
              onChange={ ( e ) => handleTower( e.target.value ) }
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
            >
              <option value="">Todas las torres</option>
              { availableTowers.map( ( t ) => (
                <option key={ t } value={ t.toLowerCase() }>Torre { t }</option>
              ) ) }
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mes
            </label>
            <select
              value={ filterMonth }
              onChange={ ( e ) => handleMonth( e.target.value ) }
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
            >
              { MONTHS.map( ( m ) => (
                <option key={ m.value } value={ m.value }>{ m.label }</option>
              ) ) }
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Año
            </label>
            <select
              value={ filterYear }
              onChange={ ( e ) => handleYear( e.target.value ) }
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
            >
              <option value="">Todos los años</option>
              { YEARS.map( ( y ) => (
                <option key={ y.value } value={ y.value }>{ y.label }</option>
              ) ) }
            </select>
          </div>

          {/* Payment type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tipo de pago
            </label>
            <select
              value={ filterPaymentType }
              onChange={ ( e ) => handlePaymentType( e.target.value ) }
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
            >
              <option value="">Todos los tipos</option>
              { availablePaymentTypes.map( ( t ) => (
                <option key={ t } value={ t }>{ t }</option>
              ) ) }
            </select>
          </div>
        </div>
      ) }

      {/* ── Loading ────────────────────────────────────── */}
      { loadingPayments && (
        <div className="flex flex-col items-center gap-3 py-12">
          <LoadingApp />
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Cargando pagos de mantenimiento…
          </p>
        </div>
      ) }

      {/* ── Table ──────────────────────────────────────── */}
      { !loadingPayments && (
        <>
          { sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
              <ReceiptRefundIcon className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="font-medium text-gray-600 dark:text-gray-400">
                Sin registros de mantenimiento
              </p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                { hasActiveFilters
                  ? "Ajusta los filtros para ver más resultados."
                  : "No se encontraron cuotas de mantenimiento pagadas." }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 shadow-sm dark:border-gray-700/60">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  {/* ── thead ─────────────────────────── */}
                  <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <tr>
                      <Th label="Condómino"    field="condominiumNumber" icon={ UserIcon } />
                      <Th label="Torre"         field="tower"             icon={ BuildingOffice2Icon } />
                      <Th label="Fecha de pago" field="paymentDate"       icon={ CalendarDaysIcon } />
                      <Th label="Monto"         field="amount"            icon={ CurrencyDollarIcon } />
                      <Th label="Referencia"                               icon={ ReceiptRefundIcon } />
                      <Th label="Mes"           field="month"             icon={ TagIcon } />
                      <Th label="Tipo de pago"  field="paymentType"       icon={ CreditCardIcon } />
                    </tr>
                  </thead>

                  {/* ── tbody ─────────────────────────── */}
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    { pageRows.map( ( row, idx ) => (
                      <tr
                        key={ `${ row.id }-${ idx }` }
                        className="group transition-colors duration-150 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10"
                        style={ {
                          animation: `fadeSlideDown ${ 100 + idx * 15 }ms cubic-bezier(0.23,1,0.32,1) both`,
                        } }
                      >
                        {/* Condómino */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                              { row.condominiumNumber }
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                                { row.condominiumName || "Sin nombre" }
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                #{ row.condominiumNumber }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Torre */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          { row.tower ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              <BuildingOffice2Icon className="h-3 w-3" />
                              Torre { row.tower }
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          ) }
                        </td>

                        {/* Fecha de pago */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          { row.paymentDate ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              <CalendarDaysIcon className="h-3 w-3" />
                              { row.paymentDate }
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          ) }
                        </td>

                        {/* Monto */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            { formatCurrency( row.amount ) }
                          </span>
                        </td>

                        {/* Referencia */}
                        <td className="px-4 py-3.5 max-w-[180px]">
                          { row.reference ? (
                            <span
                              title={ row.reference }
                              className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1"
                            >
                              { row.reference }
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          ) }
                        </td>

                        {/* Mes */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            { formatMonthLabel( row.month ) }
                          </span>
                        </td>

                        {/* Tipo de pago */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          { row.paymentType ? (
                            <span className={ `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${ getPaymentTypeBadgeClass( row.paymentType ) }` }>
                              <CreditCardIcon className="h-3 w-3 flex-shrink-0" />
                              { row.paymentType }
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          ) }
                        </td>
                      </tr>
                    ) ) }
                  </tbody>
                </table>
              </div>
            </div>
          ) }

          {/* ── Pagination ─────────────────────────────── */}
          { totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página <span className="font-semibold text-gray-900 dark:text-white">{ safePage }</span> de{ " " }
                <span className="font-semibold text-gray-900 dark:text-white">{ totalPages }</span>{ " " }
                —{ " " }
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{ sorted.length }</span> registros
              </p>
              <nav className="inline-flex items-center gap-1.5" aria-label="Paginación">
                <button
                  onClick={ () => goToPage( safePage - 1 ) }
                  disabled={ safePage === 1 }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                  aria-label="Página anterior"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                { Array.from( { length: totalPages }, ( _, i ) => i + 1 )
                  .filter( ( p ) => {
                    if ( totalPages <= 7 ) return true;
                    if ( p === 1 || p === totalPages ) return true;
                    if ( Math.abs( p - safePage ) <= 2 ) return true;
                    return false;
                  } )
                  .reduce<( number | "…" )[]>( ( acc, p, i, arr ) => {
                    if ( i > 0 ) {
                      const prev = arr[ i - 1 ] as number;
                      if ( p - prev > 1 ) acc.push( "…" );
                    }
                    acc.push( p );
                    return acc;
                  }, [] )
                  .map( ( item, i ) =>
                    item === "…" ? (
                      <span key={ `dots-${ i }` } className="px-1 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={ item }
                        onClick={ () => goToPage( item as number ) }
                        className={
                          `inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors
                           ${ item === safePage
                             ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                             : "border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                           }`
                        }
                      >
                        { item }
                      </button>
                    )
                  ) }

                <button
                  onClick={ () => goToPage( safePage + 1 ) }
                  disabled={ safePage === totalPages }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                  aria-label="Página siguiente"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </nav>
            </div>
          ) }
        </>
      ) }

      {/* Animation keyframes */}
      <style>{ `
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      ` }</style>
    </div>
  );
};

export default MaintenancePaymentsTable;
