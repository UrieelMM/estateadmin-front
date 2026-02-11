// src/components/BalanceGeneral/BalanceGeneral.tsx
import React, { useEffect, useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useExpenseSummaryStore } from "../../../../../store/expenseSummaryStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";

import BalanceGeneralCards from "./BalanceSummary/BalanceGeneralCards";
import BalanceGeneralDetailTable from "./BalanceSummary/BalanceGeneralDetailTable";
import BalanceGeneralGraph from "./BalanceSummary/BalanceGeneralGraph";
import PDFBalanceGeneralReport from "./BalanceSummary/PDFBalanceGeneralReport";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";
import { motion } from "framer-motion";

const BalanceGeneral: React.FC = () => {
  // Datos de ingresos
  const {
    loading: loadingIncomes,
    error: errorIncomes,
    selectedYear: selectedYearIncomes,
    fetchSummary: fetchIncomes,
    setSelectedYear: setSelectedYearIncomes,
    // totalIncome,
    monthlyStats: monthlyStatsIncomes,
    shouldFetchData: shouldFetchDataIncomes,
    setupRealtimeListeners: setupRealtimeListenersIncomes,
    cleanupListeners: cleanupListenersIncomes,
    payments,
  } = usePaymentSummaryStore(
    ( state ) => ( {
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      totalIncome: state.totalIncome,
      monthlyStats: state.monthlyStats,
      shouldFetchData: state.shouldFetchData,
      setupRealtimeListeners: state.setupRealtimeListeners,
      cleanupListeners: state.cleanupListeners,
      payments: state.payments,
    } ),
    shallow
  );

  // Calcular el saldo a favor global a partir de monthlyStats
  // const totalCreditGlobal = useMemo(
  //   () => monthlyStatsIncomes.reduce((acc, stat) => acc + stat.saldo, 0),
  //   [monthlyStatsIncomes]
  // );

  // Calcular el total de ingresos incluyendo el saldo a favor y créditos utilizados
  const totalIncomeWithCredit = useMemo( () => {
    const totalPaid = payments.reduce(
      ( acc, payment ) => acc + payment.amountPaid,
      0
    );
    const totalCreditUsed = payments.reduce(
      ( acc, payment ) => acc + ( payment.creditUsed || 0 ),
      0
    );
    const totalCreditBalance = payments.reduce(
      ( acc, payment ) => acc + payment.creditBalance,
      0
    );
    return (
      totalPaid +
      ( totalCreditBalance > 0 ? totalCreditBalance : 0 ) -
      totalCreditUsed
    );
  }, [ payments ] );

  // Datos de egresos
  const {
    loading: loadingExpenses,
    error: errorExpenses,
    fetchSummary: fetchExpenses,
    setSelectedYear: setSelectedYearExpenses,
    totalSpent,
    monthlyStats: monthlyStatsExpenses,
    shouldFetchData: shouldFetchDataExpenses,
    setupRealtimeListeners: setupRealtimeListenersExpenses,
    cleanupListeners: cleanupListenersExpenses,
  } = useExpenseSummaryStore(
    ( state ) => ( {
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      totalSpent: state.totalSpent,
      monthlyStats: state.monthlyStats,
      shouldFetchData: state.shouldFetchData,
      setupRealtimeListeners: state.setupRealtimeListeners,
      cleanupListeners: state.cleanupListeners,
    } ),
    shallow
  );

  // Se asume que el año seleccionado es el mismo para ambos stores
  const selectedYear = selectedYearIncomes;

  useEffect( () => {
    const shouldFetchIncomes = shouldFetchDataIncomes( selectedYear );
    const shouldFetchExpenses = shouldFetchDataExpenses( selectedYear );

    if ( shouldFetchIncomes ) {
      fetchIncomes( selectedYear );
    }
    if ( shouldFetchExpenses ) {
      fetchExpenses( selectedYear );
    }

    // Configurar listeners cuando el componente se monta
    setupRealtimeListenersIncomes( selectedYear );
    setupRealtimeListenersExpenses( selectedYear );

    // Cleanup cuando el componente se desmonta o cambia el año
    return () => {
      cleanupListenersIncomes( selectedYear );
      cleanupListenersExpenses( selectedYear );
    };
  }, [ selectedYear ] );

  // Manejo del cambio de año
  const handleYearChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    const year = e.target.value;
    setSelectedYearIncomes( year );
    setSelectedYearExpenses( year );
  };

  // Consideramos que si alguno está en loading o da error, se muestra el estado
  const loading = loadingIncomes || loadingExpenses;
  const error = errorIncomes || errorExpenses;

  // Cálculo del balance neto (usando el total que incluye saldo a favor)
  const netBalance = totalIncomeWithCredit - totalSpent;

  return (
    <div className="p-4 space-y-4">
      <motion.section
        initial={ { opacity: 0, y: 10 } }
        animate={ { opacity: 1, y: 0 } }
        transition={ { duration: 0.25 } }
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Balance General
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Contrasta ingresos y egresos para validar salud financiera del condominio.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Periodo de análisis
            </label>
            <select
              value={ selectedYear }
              onChange={ handleYearChange }
              className="min-w-44 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 bg-white dark:bg-gray-900 cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
      </motion.section>

      {/* Loading / Error */ }
      { loading && <SkeletonLoading /> }
      { error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3">
          <p className="text-red-700 dark:text-red-300 text-sm">{ error }</p>
        </div>
      ) }

      {/* Se muestran las secciones cuando ya no se está cargando */ }
      { !loading && (
        <div className="space-y-4">
          {/* Cards con indicadores clave */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.03 } }
          >
            <BalanceGeneralCards
              totalIncome={ totalIncomeWithCredit }
              totalSpent={ totalSpent }
              netBalance={ netBalance }
            />
          </motion.div>

          {/* Gráfica comparativa de ingresos vs egresos */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.06 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <BalanceGeneralGraph
              incomesMonthlyStats={ monthlyStatsIncomes }
              expensesMonthlyStats={ monthlyStatsExpenses }
            />
          </motion.div>

          {/* Tabla detallada con el desglose mensual */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.09 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <BalanceGeneralDetailTable
              incomesMonthlyStats={ monthlyStatsIncomes }
              expensesMonthlyStats={ monthlyStatsExpenses }
            />
          </motion.div>

          {/* Reporte PDF del Balance General */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.12 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <PDFBalanceGeneralReport year={ selectedYear } />
          </motion.div>
        </div>
      ) }
    </div>
  );
};

export default React.memo( BalanceGeneral );
