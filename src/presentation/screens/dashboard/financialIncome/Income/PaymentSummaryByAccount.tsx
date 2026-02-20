// src/components/paymentSummary/PaymentSummaryByAccount.tsx
import React, { useCallback, useEffect, useState } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { useFinancialAccountsStore } from "../../../../../store/useAccountsStore";
import { usePettyCashStore } from "../../../../../store/pettyCashStore";
import useUserStore from "../../../../../store/UserDataStore";
import AccountSummaryCards from "../Summary/AccountSummaryCards";
import AccountCharts from "../Summary/AccountCharts";
import AccountLatestMovementsTable from "../Summary/AccountLatestMovementsTable";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";

type AccountOperationalTotals = {
  expenses: number;
  internalInflow: number;
  internalOutflow: number;
};

const centsToPesos = (value: any): number => {
  const parsed = parseInt(String(value ?? 0), 10);
  if (Number.isNaN(parsed)) return 0;
  return parsed / 100;
};

const PaymentSummaryByAccount: React.FC = () => {
  // Estados locales para controlar la carga independiente
  const [ isInitialLoading, setIsInitialLoading ] = useState( true );
  const [ hasInitialized, setHasInitialized ] = useState( false );
  const [ operationalLoading, setOperationalLoading ] = useState( false );
  const [ operationalTotalsByAccount, setOperationalTotalsByAccount ] =
    useState<Record<string, AccountOperationalTotals>>( {} );

  // Extrae datos del store de pagos
  const {
    byFinancialAccount,
    selectedYear,
    setSelectedYear,
    fetchSummary,
    loading: storeLoading,
  } = usePaymentSummaryStore( ( state ) => ( {
    byFinancialAccount: state.byFinancialAccount,
    financialAccountsMap: state.financialAccountsMap,
    selectedYear: state.selectedYear,
    setSelectedYear: state.setSelectedYear,
    fetchSummary: state.fetchSummary,
    loading: state.loading,
  } ) );

  // Extrae funciones necesarias de otros stores
  const fetchAccounts = useFinancialAccountsStore(
    ( state ) => state.fetchAccounts
  );
  const { accounts } = useFinancialAccountsStore( ( state ) => ( {
    accounts: state.accounts,
  } ) );
  const {
    config: pettyCashConfig,
    currentBalance: pettyCashCurrentBalance,
    fetchConfig: fetchPettyCashConfig,
  } = usePettyCashStore( ( state ) => ( {
    config: state.config,
    currentBalance: state.currentBalance,
    fetchConfig: state.fetchConfig,
  } ) );
  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );

  const fetchOperationalTotalsByAccount = useCallback(
    async (year: string, pettyCashAccountId?: string) => {
      try {
        setOperationalLoading( true );

        const auth = getAuth();
        const user = auth.currentUser;
        if ( !user ) throw new Error( "Usuario no autenticado" );

        const tokenResult = await getIdTokenResult( user );
        const clientId = tokenResult.claims[ "clientId" ] as string;
        const condominiumId = localStorage.getItem( "condominiumId" );

        if ( !clientId || !condominiumId ) {
          throw new Error( "Contexto de cliente/condominio inválido" );
        }

        const db = getFirestore();
        const nextTotals: Record<string, AccountOperationalTotals> = {};

        const ensureAccount = (accountId: string) => {
          if ( !nextTotals[ accountId ] ) {
            nextTotals[ accountId ] = {
              expenses: 0,
              internalInflow: 0,
              internalOutflow: 0,
            };
          }
          return nextTotals[ accountId ];
        };

        const expensesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/expenses`
        );
        const expensesSnap = await getDocs( expensesRef );
        expensesSnap.forEach( (docSnap) => {
          const data = docSnap.data();
          const accountId = data.financialAccountId as string | undefined;
          const expenseDate = data.expenseDate as string | undefined;
          if ( !accountId ) return;
          if ( year && ( !expenseDate || !expenseDate.startsWith( year ) ) ) {
            return;
          }

          ensureAccount( accountId ).expenses += centsToPesos( data.amount );
        } );

        const pettyTransactionsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
        );
        const pettyTransactionsSnap = await getDocs( pettyTransactionsRef );

        pettyTransactionsSnap.forEach( (docSnap) => {
          const data = docSnap.data();
          const txType = data.type as string | undefined;
          const expenseDate = data.expenseDate as string | undefined;
          if ( year && ( !expenseDate || !expenseDate.startsWith( year ) ) ) {
            return;
          }

          const amount = centsToPesos( data.amount );
          const normalizedAmount = Math.abs( amount );

          if ( txType === "replenishment" && normalizedAmount > 0 ) {
            if ( data.sourceAccountId ) {
              ensureAccount( data.sourceAccountId ).internalOutflow +=
                normalizedAmount;
            }
            if ( pettyCashAccountId ) {
              ensureAccount( pettyCashAccountId ).internalInflow +=
                normalizedAmount;
            }
            return;
          }

          if ( txType === "adjustment" && pettyCashAccountId && amount !== 0 ) {
            if ( amount > 0 ) {
              ensureAccount( pettyCashAccountId ).internalInflow +=
                normalizedAmount;
            } else {
              ensureAccount( pettyCashAccountId ).internalOutflow +=
                normalizedAmount;
            }
          }
        } );

        setOperationalTotalsByAccount( nextTotals );
      } catch ( error ) {
        console.error( "Error cargando totales operativos por cuenta:", error );
      } finally {
        setOperationalLoading( false );
      }
    },
    []
  );

  // Handler para cambio de año
  const handleYearChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    setSelectedYear( e.target.value );
  };

  // Efecto para cargar datos independientemente
  useEffect( () => {
    const loadIndependentData = async () => {
      if ( hasInitialized ) return;

      try {
        setIsInitialLoading( true );

        // Cargar usuarios del condominio
        await fetchCondominiumsUsers();

        // Cargar cuentas financieras
        await fetchAccounts();

        // Cargar resumen de pagos para el año seleccionado
        await fetchSummary( selectedYear, true );

        // Cargar configuración de caja chica para sincronizar saldo de su cuenta
        await fetchPettyCashConfig();

        // Cargar totales operativos para conciliación visual por cuenta
        await fetchOperationalTotalsByAccount(
          selectedYear,
          usePettyCashStore.getState().config?.accountId
        );

        setHasInitialized( true );
      } catch ( error ) {
        console.error( "Error cargando datos independientes:", error );
      } finally {
        setIsInitialLoading( false );
      }
    };

    loadIndependentData();
  }, [
    hasInitialized,
    fetchCondominiumsUsers,
    fetchAccounts,
    fetchOperationalTotalsByAccount,
    fetchPettyCashConfig,
    fetchSummary,
    selectedYear,
  ] );

  // Efecto para recargar cuando cambie el año seleccionado
  useEffect( () => {
    if ( hasInitialized ) {
      const reloadForNewYear = async () => {
        try {
          await fetchSummary( selectedYear, true );
          await fetchOperationalTotalsByAccount(
            selectedYear,
            pettyCashConfig?.accountId
          );
        } catch ( error ) {
          console.error( "Error recargando datos para nuevo año:", error );
        }
      };

      reloadForNewYear();
    }
  }, [
    selectedYear,
    hasInitialized,
    fetchSummary,
    fetchOperationalTotalsByAccount,
    pettyCashConfig?.accountId,
  ] );

  // Mostrar loading mientras se cargan los datos iniciales
  if ( isInitialLoading ) {
    return (
      <div className="space-y-4">
        <SkeletonLoading />
      </div>
    );
  }

  // Mostrar mensaje si no hay cuentas financieras configuradas
  if ( !accounts || accounts.length === 0 ) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-100 py-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">
            No hay cuentas financieras configuradas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para visualizar los datos por cuenta, primero debe configurar las
            cuentas financieras.
          </p>
        </div>
      </div>
    );
  }

  // Usar todas las cuentas disponibles, no solo las que tienen transacciones en el año
  const accountsToShow = accounts
    .filter( ( account ) => account.id ) // Filtrar cuentas que tengan ID válido
    .map( ( account ) => ( {
      accountId: account.id!,
      payments: byFinancialAccount[ account.id! ] || [],
      name: account.name || "Cuenta sin nombre",
    } ) );

  return (
    <div className="space-y-8">
      {/* Filtro de año */ }
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Año:</label>
          <select
            value={ selectedYear }
            onChange={ handleYearChange }
            className="border border-gray-300 rounded py-2 px-4 dark:bg-gray-900 dark:ring-0 dark:border-none"
          >
            <option value="">Todos los años</option>
            { [ "2022", "2023", "2024", "2025", "2026" ].map( ( y ) => (
              <option key={ y } value={ y }>
                { y }
              </option>
            ) ) }
          </select>
        </div>
      </div>

      {/* Indicador de carga si el store está cargando nuevos datos */ }
      { ( storeLoading || operationalLoading ) && (
        <div className="bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-indigo-700 dark:text-indigo-200 flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-indigo-600"
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
            Actualizando datos de ingresos y movimientos operativos...
          </p>
        </div>
      ) }

      { accountsToShow.map( ( { accountId, payments, name } ) => (
        <div
          key={ accountId }
          className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-md p-4"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Cuenta Financiera: { name }
          </h2>

          {/* Cards de resumen para esta cuenta */ }
          <AccountSummaryCards
            payments={ payments }
            accountId={ accountId }
            pettyCashAccountId={ pettyCashConfig?.accountId }
            pettyCashCurrentBalance={ pettyCashCurrentBalance }
            periodExpenseTotal={
              operationalTotalsByAccount[ accountId ]?.expenses ?? 0
            }
            periodInternalInflow={
              operationalTotalsByAccount[ accountId ]?.internalInflow ?? 0
            }
            periodInternalOutflow={
              operationalTotalsByAccount[ accountId ]?.internalOutflow ?? 0
            }
          />

          <AccountLatestMovementsTable
            payments={ payments }
            selectedYear={ selectedYear }
            limit={ 8 }
          />

          {/* Gráficas para esta cuenta */ }
          <AccountCharts payments={ payments } />
        </div>
      ) ) }
    </div>
  );
};

export default PaymentSummaryByAccount;
