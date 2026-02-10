// src/components/paymentSummary/PaymentSummaryByAccount.tsx
import React, { useEffect, useState } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { useFinancialAccountsStore } from "../../../../../store/useAccountsStore";
import useUserStore from "../../../../../store/UserDataStore";
import AccountSummaryCards from "../Summary/AccountSummaryCards";
import AccountCharts from "../Summary/AccountCharts";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";

const PaymentSummaryByAccount: React.FC = () => {
  // Estados locales para controlar la carga independiente
  const [ isInitialLoading, setIsInitialLoading ] = useState( true );
  const [ hasInitialized, setHasInitialized ] = useState( false );

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
  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
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
    fetchSummary,
    selectedYear,
  ] );

  // Efecto para recargar cuando cambie el año seleccionado
  useEffect( () => {
    if ( hasInitialized ) {
      const reloadForNewYear = async () => {
        try {
          await fetchSummary( selectedYear, true );
        } catch ( error ) {
          console.error( "Error recargando datos para nuevo año:", error );
        }
      };

      reloadForNewYear();
    }
  }, [ selectedYear, hasInitialized, fetchSummary ] );

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
      { storeLoading && (
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
            Actualizando datos...
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
          <AccountSummaryCards payments={ payments } accountId={ accountId } />

          {/* Gráficas para esta cuenta */ }
          <AccountCharts payments={ payments } />
        </div>
      ) ) }
    </div>
  );
};

export default PaymentSummaryByAccount;
