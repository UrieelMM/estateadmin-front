// src/components/Summary/MorosidadView.tsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  usePaymentSummaryStore,
  PaymentRecord,
} from "../../../../../store/paymentSummaryStore";
import { useMorosityStore } from "../../../../../store/morosityStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import MorosidadPDFReport from "../Income/PDFMorosidadReport";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

// Interfaces para tipado
interface DebtorInfo {
  user: string;
  amount: number;
  userUID: string;
  numberCondominium: string;
}

interface ChartDataPoint {
  name: string;
  pending: number;
}

interface MorosityData {
  allDebtors: DebtorInfo[];
  topDebtors: DebtorInfo[];
  totalPending: number;
  debtorsCount: number;
  maxDebtor: DebtorInfo;
  averageDebt: number;
  lineChartData: ChartDataPoint[];
}

type DebtPriority = "all" | "critical" | "high" | "medium" | "low";

const PAGE_SIZE = 20;

// Caché global para almacenar los datos procesados entre renderizados
const globalMorosityCache: Record<
  string,
  {
    allPayments: PaymentRecord[];
    lastFetchTimestamp: number;
    processedData: MorosityData | null;
  }
> = {};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

const MorosidadView: React.FC = () => {
  const payments = usePaymentSummaryStore( ( state ) => state.payments );
  const fetchSummary = usePaymentSummaryStore( ( state ) => state.fetchSummary );
  const {
    notifyDebtor,
    initialize,
    clientId: morosityClientId,
    condominiumId: morosityCondominiumId,
  } = useMorosityStore();
  const [ loadingStates, setLoadingStates ] = useState<Record<string, boolean>>(
    {}
  );
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ priorityFilter, setPriorityFilter ] = useState<DebtPriority>( "all" );
  const [ minimumAmountFilter, setMinimumAmountFilter ] = useState<
    "all" | "500" | "1000" | "2000"
  >( "all" );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const activeCondominiumId =
    morosityCondominiumId || localStorage.getItem( "condominiumId" ) || "unknown";
  const activeClientId = morosityClientId || "unknown";
  const cacheKey = `${ activeClientId }::${ activeCondominiumId }`;

  const getCacheEntry = useCallback( ( key: string ) => {
    if ( !globalMorosityCache[ key ] ) {
      globalMorosityCache[ key ] = {
        allPayments: [],
        lastFetchTimestamp: 0,
        processedData: null,
      };
    }
    return globalMorosityCache[ key ];
  }, [] );

  const getDebtPriority = useCallback( ( amount: number ) => {
    if ( amount >= 5000 ) {
      return {
        level: "critical" as const,
        label: "Crítico",
        className:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
      };
    }
    if ( amount >= 2000 ) {
      return {
        level: "high" as const,
        label: "Alto",
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
      };
    }
    if ( amount >= 500 ) {
      return {
        level: "medium" as const,
        label: "Medio",
        className:
          "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
      };
    }
    return {
      level: "low" as const,
      label: "Bajo",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200",
    };
  }, [] );

  // Estado de loading local para controlar mejor el spinner
  const [ isInitialLoading, setIsInitialLoading ] = useState( true );
  // Estado para controlar si ya se han cargado datos históricos
  const [ historicalDataLoaded, setHistoricalDataLoaded ] = useState( false );
  // Almacenar pagos históricos combinados
  const [ allPayments, setAllPayments ] = useState<PaymentRecord[]>( [] );

  useEffect( () => {
    const cacheEntry = getCacheEntry( cacheKey );
    const isFresh =
      cacheEntry.allPayments.length > 0 &&
      Date.now() - cacheEntry.lastFetchTimestamp < CACHE_DURATION;
    setAllPayments( isFresh ? cacheEntry.allPayments : [] );
    setHistoricalDataLoaded( isFresh );
    setIsInitialLoading( !isFresh );
  }, [ cacheKey, getCacheEntry ] );

  // Función memoizada para formatear moneda
  const formatCurrency = useCallback(
    ( value: number ) =>
      "$" +
      value.toLocaleString( "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      } ),
    []
  );

  // Función memoizada para cargar datos históricos
  const loadAllPaymentData = useCallback( async () => {
    const cacheEntry = getCacheEntry( cacheKey );

    // Si ya están cargados los datos históricos en estado local, no hacer nada
    if ( historicalDataLoaded && allPayments.length > 0 ) {
      setIsInitialLoading( false );
      return;
    }

    // Verificar si la caché para este condominio/cliente es válida
    if (
      cacheEntry.lastFetchTimestamp > 0 &&
      Date.now() - cacheEntry.lastFetchTimestamp < CACHE_DURATION &&
      cacheEntry.allPayments.length > 0
    ) {
      setAllPayments( cacheEntry.allPayments );
      setHistoricalDataLoaded( true );
      setIsInitialLoading( false );
      return;
    }

    try {
      // Obtenemos el año actual
      const currentYear = new Date().getFullYear();

      // Cargamos datos de los últimos 3 años
      const yearsToLoad = [
        currentYear.toString(),
        ( currentYear - 1 ).toString(),
        ( currentYear - 2 ).toString(),
      ];

      for ( const year of yearsToLoad ) {
        await fetchSummary( year, true );
      }

      // Actualizamos el timestamp de la última carga
      cacheEntry.lastFetchTimestamp = Date.now();
      setHistoricalDataLoaded( true );
    } catch ( error ) {
      console.error( "Error cargando datos históricos:", error );
    } finally {
      setIsInitialLoading( false );
    }
  }, [
    allPayments.length,
    cacheKey,
    fetchSummary,
    getCacheEntry,
    historicalDataLoaded,
  ] );

  // Inicializar contexto de morosidad
  useEffect( () => {
    initialize();
  }, [ initialize ] );

  // Cargar datos históricos cuando el contexto esté listo
  useEffect( () => {
    if ( !activeCondominiumId ) return;
    if ( !historicalDataLoaded ) {
      loadAllPaymentData();
    } else {
      setIsInitialLoading( false );
    }
  }, [ activeCondominiumId, historicalDataLoaded, loadAllPaymentData ] );

  // Efecto para actualizar allPayments cuando cambien los payments del store
  useEffect( () => {
    if ( payments.length > 0 ) {
      setAllPayments( ( prev ) => {
        // Combinamos los pagos existentes con los nuevos, evitando duplicados por ID
        const paymentMap = new Map<string, PaymentRecord>();

        // Primero añadimos los pagos previos
        prev.forEach( ( payment ) => {
          const key = `${ payment.id }__${ payment.userId || "" }__${ payment.month || "" }`;
          paymentMap.set( key, payment );
        } );

        // Luego añadimos o actualizamos con los nuevos pagos
        payments.forEach( ( payment ) => {
          const key = `${ payment.id }__${ payment.userId || "" }__${ payment.month || "" }`;
          paymentMap.set( key, payment );
        } );

        // Convertimos el mapa de vuelta a array
        const updatedPayments = Array.from( paymentMap.values() );

        // Actualizamos la caché global
        const cacheEntry = getCacheEntry( cacheKey );
        cacheEntry.allPayments = updatedPayments;
        cacheEntry.lastFetchTimestamp = Date.now();

        return updatedPayments;
      } );

      // Si recibimos nuevos pagos y aún estamos en loading inicial, lo terminamos
      if ( isInitialLoading ) {
        setIsInitialLoading( false );
      }
    }
  }, [ cacheKey, getCacheEntry, isInitialLoading, payments ] );

  // Cálculos de morosidad altamente optimizados con useMemo profundo
  const morosityStats = useMemo( (): MorosityData => {
    // Si no hay pagos, devolver valores por defecto
    if ( allPayments.length === 0 ) {
      return {
        allDebtors: [],
        topDebtors: [],
        totalPending: 0,
        debtorsCount: 0,
        maxDebtor: {
          user: "N/A",
          amount: 0,
          userUID: "",
          numberCondominium: "",
        },
        averageDebt: 0,
        lineChartData: [],
      };
    }

    // Agrupamos por condómino y sumamos la morosidad
    const pendingByUser: Record<
      string,
      { amount: number; userUID: string; numberCondominium: string; }
    > = {};

    // Usamos allPayments e incluimos la historia completa
    allPayments.forEach( ( p ) => {
      const userKey = p.numberCondominium || "Desconocido";
      if ( !pendingByUser[ userKey ] ) {
        pendingByUser[ userKey ] = {
          amount: 0,
          userUID: p.userId || "",
          numberCondominium: userKey,
        };
      }
      // Si el pago no está marcado como pagado, sumamos el monto pendiente
      if ( !p.paid ) {
        pendingByUser[ userKey ].amount += p.amountPending;
      }
    } );

    // Convertir en array para poder ordenar
    const pendingArray = Object.entries( pendingByUser ).map( ( [ user, data ] ) => ( {
      user,
      ...data,
    } ) );

    // Ordenar desc para encontrar los top 20
    const debtorsWithDebt = pendingArray.filter( ( item ) => item.amount > 0 );
    debtorsWithDebt.sort( ( a, b ) => b.amount - a.amount );
    const topDebtors = debtorsWithDebt.slice( 0, 20 );

    // Estadísticas
    const totalPending = pendingArray.reduce(
      ( acc, item ) => acc + item.amount,
      0
    );
    const debtorsCount = debtorsWithDebt.length;
    const maxDebtor =
      topDebtors.length > 0
        ? topDebtors[ 0 ]
        : { user: "N/A", amount: 0, userUID: "", numberCondominium: "" };
    const averageDebt = debtorsCount > 0 ? totalPending / debtorsCount : 0;

    // Datos para la gráfica de líneas (solo los top 10 para la gráfica)
    const lineChartData = topDebtors.slice( 0, 10 ).map( ( debtor ) => ( {
      name: `#${ debtor.user }`,
      pending: debtor.amount,
    } ) );

    // Guardar resultados procesados en la caché global
    const result: MorosityData = {
      allDebtors: debtorsWithDebt,
      topDebtors,
      totalPending,
      debtorsCount,
      maxDebtor,
      averageDebt,
      lineChartData,
    };

    getCacheEntry( cacheKey ).processedData = result;

    return result;
  }, [ allPayments, cacheKey, getCacheEntry ] );

  // Extraemos valores del resultado memoizado
  const {
    allDebtors,
    totalPending,
    debtorsCount,
    maxDebtor,
    averageDebt,
    lineChartData,
  } = morosityStats;

  const filteredDebtors = useMemo( () => {
    const search = searchTerm.trim().toLowerCase();
    const minAmount =
      minimumAmountFilter === "all" ? 0 : Number( minimumAmountFilter );

    return allDebtors.filter( ( debtor ) => {
      const matchesSearch =
        !search ||
        debtor.numberCondominium?.toLowerCase().includes( search ) ||
        debtor.user?.toLowerCase().includes( search );
      const matchesPriority =
        priorityFilter === "all" ||
        getDebtPriority( debtor.amount ).level === priorityFilter;
      const matchesMinAmount = debtor.amount >= minAmount;

      return matchesSearch && matchesPriority && matchesMinAmount;
    } );
  }, [ allDebtors, getDebtPriority, minimumAmountFilter, priorityFilter, searchTerm ] );

  useEffect( () => {
    setCurrentPage( 1 );
  }, [ searchTerm, priorityFilter, minimumAmountFilter ] );

  const totalPages = Math.max( 1, Math.ceil( filteredDebtors.length / PAGE_SIZE ) );
  const safeCurrentPage = Math.min( currentPage, totalPages );
  const pageStartIndex = ( safeCurrentPage - 1 ) * PAGE_SIZE;
  const visibleDebtors = filteredDebtors.slice(
    pageStartIndex,
    pageStartIndex + PAGE_SIZE
  );

  // Función memoizada para enviar notificación a deudor
  const handleNotifyDebtor = useCallback(
    async ( item: DebtorInfo ) => {
      if ( !item.userUID ) {
        toast.error( "No se puede notificar: falta el identificador del condómino." );
        return;
      }
      setLoadingStates( ( prev ) => ( {
        ...prev,
        [ item.userUID ]: true,
      } ) );
      try {
        await notifyDebtor( {
          userUID: item.userUID,
          amount: item.amount,
          concept: "Adeudo pendiente",
          numberCondominium: item.numberCondominium,
        } );
        toast.success(
          `Recordatorio enviado al condominio ${ item.numberCondominium }`
        );
      } catch ( error: any ) {
        toast.error( error.message || "Error al enviar la notificación" );
      } finally {
        setLoadingStates( ( prev ) => ( {
          ...prev,
          [ item.userUID ]: false,
        } ) );
      }
    },
    [ notifyDebtor ]
  );

  return (
    <div className="mt-4">
      <div className="w-full flex justify-between">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 mb-4">
          Vista de Morosidad
        </h2>

        {/* Botón para generar el reporte PDF de morosidad */ }
        <div className="text-left">
          <MorosidadPDFReport />
        </div>
      </div>

      { isInitialLoading ? (
        <div className="flex justify-center items-center h-40">
          <LoadingApp />
        </div>
      ) : (
        <>
          {/* Tarjetas (cards) con detalles generales */ }
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Total Pendiente
              </p>
              <p className="text-xl font-semibold">
                { formatCurrency( totalPending ) }
              </p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Condominos con deuda &gt; 0
              </p>
              <p className="text-xl font-semibold">{ debtorsCount }</p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Deudor Máximo
              </p>
              <p className="text-base font-semibold">#{ maxDebtor.user }</p>
              <p className="text-xl font-semibold">
                { formatCurrency( maxDebtor.amount ) }
              </p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Promedio de Deuda
              </p>
              <p className="text-xl font-semibold">
                { formatCurrency( averageDebt ) }
              </p>
            </div>
          </div>

          {/* Nota sobre datos históricos */ }
          <div className="mb-4 bg-indigo-50 dark:bg-indigo-900 p-3 rounded-md">
            <p className="text-sm text-indigo-700 dark:text-blue-200">
              Nota: Esta vista incluye deudas de todos los años para mostrar la
              morosidad total acumulada.
            </p>
          </div>

          {/* Tabla operativa de morosidad */ }
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">
              Condominos con mayor monto pendiente{ " " }
              <span className="text-gray-600 text-xs dark:text-gray-400">
                (prioriza seguimiento uno a uno)
              </span>
            </h3>
            <div className="mb-4 rounded-md border border-gray-200 dark:border-gray-700 p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={ searchTerm }
                  onChange={ ( event ) => setSearchTerm( event.target.value ) }
                  placeholder="Buscar por # condómino"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                />
                <select
                  value={ priorityFilter }
                  onChange={ ( event ) =>
                    setPriorityFilter( event.target.value as DebtPriority )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="critical">Crítico</option>
                  <option value="high">Alto</option>
                  <option value="medium">Medio</option>
                  <option value="low">Bajo</option>
                </select>
                <select
                  value={ minimumAmountFilter }
                  onChange={ ( event ) =>
                    setMinimumAmountFilter(
                      event.target.value as "all" | "500" | "1000" | "2000"
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="all">Sin monto mínimo</option>
                  <option value="500">Desde $500</option>
                  <option value="1000">Desde $1,000</option>
                  <option value="2000">Desde $2,000</option>
                </select>
                <button
                  type="button"
                  onClick={ () => {
                    setSearchTerm( "" );
                    setPriorityFilter( "all" );
                    setMinimumAmountFilter( "all" );
                  } }
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                >
                  Limpiar filtros
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Mostrando { visibleDebtors.length } de { filteredDebtors.length }{ " " }
                condóminos con deuda.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                      # Condómino
                    </th>
                    <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                      Prioridad
                    </th>
                    <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                      Monto Pendiente
                    </th>
                    <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  { visibleDebtors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ 4 }
                        className="py-6 px-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No se encontraron condóminos con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    visibleDebtors.map( ( item ) => {
                      const debtPriority = getDebtPriority( item.amount );
                      return (
                        <tr
                          key={ `${ item.userUID || "no-user" }-${ item.numberCondominium }` }
                          className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                        >
                          <td className="py-2 px-4 border-b">{ item.user }</td>
                          <td className="py-2 px-4 border-b">
                            <span
                              className={ `inline-flex rounded-full px-2 py-1 text-xs font-semibold ${ debtPriority.className }` }
                            >
                              { debtPriority.label }
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">
                            { formatCurrency( item.amount ) }
                          </td>
                          <td className="py-2 px-4 border-b">
                            <button
                              onClick={ () => handleNotifyDebtor( item ) }
                              disabled={ loadingStates[ item.userUID ] }
                              className="bg-indigo-600 w-content justify-center text-white px-4 text-xs py-1 rounded hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <BellAlertIcon className="h-4 w-4" />
                              { loadingStates[ item.userUID ]
                                ? "Enviando..."
                                : "Enviar recordatorio" }
                            </button>
                          </td>
                        </tr>
                      );
                    } )
                  ) }
                </tbody>
              </table>
            </div>

            { filteredDebtors.length > PAGE_SIZE ? (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Página { safeCurrentPage } de { totalPages }
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={ () => setCurrentPage( ( prev ) => Math.max( 1, prev - 1 ) ) }
                    disabled={ safeCurrentPage === 1 }
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-50 dark:border-gray-600"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={ () =>
                      setCurrentPage( ( prev ) => Math.min( totalPages, prev + 1 ) )
                    }
                    disabled={ safeCurrentPage === totalPages }
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-50 dark:border-gray-600"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null }
          </div>

          {/* Gráfica de líneas - Top 10 Morosos (se mantiene con los 10 principales) */ }
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Condominos con morosidad</h3>
            <div style={ { width: "100%", height: 300 } }>
              <ResponsiveContainer>
                <LineChart
                  data={ lineChartData }
                  margin={ { top: 20, right: 20, left: 0, bottom: 0 } }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={ ( val: number ) => formatCurrency( val ) }
                    width={ 80 }
                  />
                  <Tooltip formatter={ ( val: number ) => formatCurrency( val ) } />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pendiente"
                    stroke="#4f46e5"
                    strokeWidth={ 2 }
                    dot={ { r: 4 } } // Pequeño círculo en cada punto
                    activeDot={ { r: 6 } }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) }
    </div>
  );
};

export default React.memo( MorosidadView );
