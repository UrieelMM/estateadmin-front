import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentForm from "../../../../components/shared/forms/PaymentForm";
import PaymentHistory from "./PaymentHistory";
import PaymentSummary from "./PaymentSummary";
import MorosidadView from "../Summary/MorosidadView";
import PaymentSummaryByAccount from "./PaymentSummaryByAccount";
import UnidentifiedPaymentsTable from "./UnidentifiedPaymentsTable";
import HistoryPaymentsTable from "./HistoryPaymentsTable";
import MaintenancePaymentsTable from "./MaintenancePaymentsTable";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import TowerIncomeSummary from "./TowerIncomeSummary";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

type IncomeTabId =
  | "summary"
  | "accountSummary"
  | "maintenance"
  | "towers"
  | "history-by-condominium"
  | "morosidad"
  | "unidentified"
  | "history";

const INCOME_TAB_PATHS: Record<IncomeTabId, string> = {
  summary: "/dashboard/income/summary",
  accountSummary: "/dashboard/income/account-summary",
  maintenance: "/dashboard/income/maintenance",
  towers: "/dashboard/income/towers",
  "history-by-condominium": "/dashboard/income/by-condominium",
  morosidad: "/dashboard/income/delinquency",
  unidentified: "/dashboard/income/unidentified",
  history: "/dashboard/income/history",
};

const INCOME_PATH_TO_TAB: Record<string, IncomeTabId> = {
  summary: "summary",
  "account-summary": "accountSummary",
  maintenance: "maintenance",
  towers: "towers",
  "by-condominium": "history-by-condominium",
  delinquency: "morosidad",
  unidentified: "unidentified",
  history: "history",
  // Compatibilidad con enlaces previos
  "accountSummary": "accountSummary",
  "history-by-condominium": "history-by-condominium",
  morosidad: "morosidad",
};

const Income = () => {
  const [ open, setOpen ] = useState( false );
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchSummary, cleanupListeners, selectedYear, setSelectedYear, detailed } =
    usePaymentSummaryStore(
      ( state ) => ( {
        fetchSummary: state.fetchSummary,
        cleanupListeners: state.cleanupListeners,
        selectedYear: state.selectedYear,
        setSelectedYear: state.setSelectedYear,
        detailed: state.detailed,
      } )
    );

  // Local flag: true only while the FIRST fetchSummary of this component instance is in flight.
  // Using the store's `loading` flag causes a stuck spinner because:
  //   1. useLayoutEffect → setSelectedYear("") fires before the useEffect
  //   2. The useEffect has selectedYear as a dep, so it fires twice
  //   3. A shared `loading` flag is set by other components too
  // Instead we resolve immediately if the store already has fresh data (lastFetch),
  // and otherwise wait for fetchSummary to finish.
  const [ isInitializing, setIsInitializing ] = useState( () => {
    // Lazy initializer: reads the store state at mount time ONCE.
    // If data was already fetched (e.g. user navigated between tabs), skip the spinner.
    const { lastFetch: lf, detailed: det } = usePaymentSummaryStore.getState();
    return Object.keys( lf ).length === 0 && Object.keys( det ).length === 0;
  } );
  const { fetchCondominiumsUsers, condominiumsUsers } = useUserStore(
    ( state ) => ( {
      fetchCondominiumsUsers: state.fetchCondominiumsUsers,
      condominiumsUsers: state.condominiumsUsers,
    } )
  );
  const hasTowersByProfile = condominiumsUsers.some(
    ( user ) => String( user.tower || "" ).trim().length > 0
  );
  const hasTowersBySnapshot = useMemo(
    () =>
      Object.values( detailed ).some( ( records ) =>
        records.some(
          ( record ) => String( record.towerSnapshot || "" ).trim().length > 0
        )
      ),
    [ detailed ]
  );
  const hasTowers = hasTowersByProfile || hasTowersBySnapshot;
  const allowedTabs = new Set<IncomeTabId>( [
    "summary",
    "accountSummary",
    "maintenance",
    "history-by-condominium",
    "morosidad",
    "unidentified",
    "history",
    ...( hasTowers ? ( [ "towers" ] as IncomeTabId[] ) : [] ),
  ] );
  const pathSegments = location.pathname.split( "/" ).filter( Boolean );
  const tabSlug = pathSegments[ 2 ] || "";
  const tabFromPath = INCOME_PATH_TO_TAB[ tabSlug ];
  const activeTab: IncomeTabId =
    ( tabFromPath && allowedTabs.has( tabFromPath ) && tabFromPath ) || "summary";

  useEffect( () => {
    const targetPath = INCOME_TAB_PATHS[ activeTab ];
    if ( location.pathname !== targetPath ) {
      navigate( targetPath, { replace: true, state: null } );
    }
  }, [ activeTab, location.pathname, navigate ] );

  useLayoutEffect( () => {
    // Income debe abrir por defecto en vista global ("Todos los años").
    setSelectedYear( "" );
  }, [ setSelectedYear ] );

  useEffect( () => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if ( isMounted ) {
          await fetchSummary( selectedYear, true );
        }
      } catch ( error ) {
        console.error( "Error loading summary:", error );
      } finally {
        // Mark initialization done regardless of success/failure
        if ( isMounted ) setIsInitializing( false );
      }
    };

    loadData();

    return () => {
      isMounted = false;
      cleanupListeners( selectedYear );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] ); // Only run once on mount — selectedYear is set via useLayoutEffect before this fires

  useEffect( () => {
    fetchCondominiumsUsers().catch( ( error ) => {
      console.error( "Error loading condominium users for towers tab:", error );
    } );
  }, [ fetchCondominiumsUsers ] );

  const handleTabChange = ( tab: IncomeTabId ) => {
    navigate( INCOME_TAB_PATHS[ tab ] );
  };

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Ingresos y Pagos</p>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary h-10 mb-3"
              onClick={ () => setOpen( !open ) }
            >
              Registrar Pago
            </button>
          </div>
        </header>

        {/* Navegación de pestañas moderna */ }
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "summary"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "summary" ) }
            >
              <span className="whitespace-nowrap">Resumen</span>
              { activeTab === "summary" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "accountSummary"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "accountSummary" ) }
            >
              <span className="whitespace-nowrap">Resumen por cuenta</span>
              { activeTab === "accountSummary" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "maintenance"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "maintenance" ) }
            >
              <span className="whitespace-nowrap">Mantenimiento</span>
              { activeTab === "maintenance" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            { hasTowers && (
              <button
                className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "towers"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }
              `}
                onClick={ () => handleTabChange( "towers" ) }
              >
                <span className="whitespace-nowrap">Torres</span>
                { activeTab === "towers" && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                ) }
              </button>
            ) }

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "history-by-condominium"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "history-by-condominium" ) }
            >
              <span className="whitespace-nowrap">Historial por condómino</span>
              { activeTab === "history-by-condominium" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "morosidad"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "morosidad" ) }
            >
              <span className="whitespace-nowrap">Morosidad</span>
              { activeTab === "morosidad" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "unidentified"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "unidentified" ) }
            >
              <span className="whitespace-nowrap">Pagos no identificados</span>
              { activeTab === "unidentified" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

            <button
              className={ `
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${ activeTab === "history"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={ () => handleTabChange( "history" ) }
            >
              <span className="whitespace-nowrap">Historial</span>
              { activeTab === "history" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              ) }
            </button>

          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          { isInitializing ? (
            /* ── Loading guard: visible en cualquier tab mientras fetchSummary no termina ── */
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <LoadingApp />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Cargando datos financieros…
              </p>
            </div>
          ) : (
            <>
              { activeTab === "summary" && (
                <>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                    Resumen General de Ingresos
                  </h2>
                  <PaymentSummary />
                </>
              ) }
              { activeTab === "accountSummary" && (
                <>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                    Resumen por Cuenta
                  </h2>
                  <PaymentSummaryByAccount />
                </>
              ) }
              { activeTab === "maintenance" && (
                <div className="py-2">
                  <MaintenancePaymentsTable />
                </div>
              ) }
              { activeTab === "history-by-condominium" && (
                <div className="lg:px-4 flex mt-0 flex-col lg:flex-row gap-4">
                  <div className="w-full lg:w-[100%]">
                    <PaymentHistory />
                  </div>
                </div>
              ) }
              { activeTab === "morosidad" && <MorosidadView /> }
              { activeTab === "towers" && (
                <>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                    Torres
                  </h2>
                  <TowerIncomeSummary />
                </>
              ) }
              { activeTab === "unidentified" && <UnidentifiedPaymentsTable /> }
              { activeTab === "history" && <HistoryPaymentsTable /> }
            </>
          ) }
        </div>
      </div>

      <PaymentForm open={ open } setOpen={ setOpen } />
    </>
  );
};

export default Income;
