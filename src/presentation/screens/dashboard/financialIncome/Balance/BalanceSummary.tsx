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

const BalanceGeneral: React.FC = () => {
  // Datos de ingresos
  const {
    loading: loadingIncomes,
    error: errorIncomes,
    selectedYear: selectedYearIncomes,
    fetchSummary: fetchIncomes,
    setSelectedYear: setSelectedYearIncomes,
    totalIncome,
    monthlyStats: monthlyStatsIncomes,
    shouldFetchData: shouldFetchDataIncomes,
    setupRealtimeListeners: setupRealtimeListenersIncomes,
    cleanupListeners: cleanupListenersIncomes
  } = usePaymentSummaryStore(
    (state) => ({
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      totalIncome: state.totalIncome,
      monthlyStats: state.monthlyStats,
      shouldFetchData: state.shouldFetchData,
      setupRealtimeListeners: state.setupRealtimeListeners,
      cleanupListeners: state.cleanupListeners
    }),
    shallow
  );

  // Calcular el saldo a favor global a partir de monthlyStats
  const totalCreditGlobal = useMemo(() => 
    monthlyStatsIncomes.reduce((acc, stat) => acc + stat.saldo, 0)
  , [monthlyStatsIncomes]);

  // Calcular el total de ingresos incluyendo el saldo a favor
  const totalIncomeWithCredit = useMemo(() => 
    totalIncome + totalCreditGlobal
  , [totalIncome, totalCreditGlobal]);

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
    cleanupListeners: cleanupListenersExpenses
  } = useExpenseSummaryStore(
    (state) => ({
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      totalSpent: state.totalSpent,
      monthlyStats: state.monthlyStats,
      shouldFetchData: state.shouldFetchData,
      setupRealtimeListeners: state.setupRealtimeListeners,
      cleanupListeners: state.cleanupListeners
    }),
    shallow
  );

  // Se asume que el año seleccionado es el mismo para ambos stores
  const selectedYear = selectedYearIncomes;

  useEffect(() => {
    const shouldFetchIncomes = shouldFetchDataIncomes(selectedYear);
    const shouldFetchExpenses = shouldFetchDataExpenses(selectedYear);

    if (shouldFetchIncomes) {
      fetchIncomes(selectedYear);
    }
    if (shouldFetchExpenses) {
      fetchExpenses(selectedYear);
    }

    // Configurar listeners cuando el componente se monta
    setupRealtimeListenersIncomes(selectedYear);
    setupRealtimeListenersExpenses(selectedYear);

    // Cleanup cuando el componente se desmonta o cambia el año
    return () => {
      cleanupListenersIncomes(selectedYear);
      cleanupListenersExpenses(selectedYear);
    };
  }, [selectedYear]);

  // Manejo del cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    setSelectedYearIncomes(year);
    setSelectedYearExpenses(year);
  };

  // Consideramos que si alguno está en loading o da error, se muestra el estado
  const loading = loadingIncomes || loadingExpenses;
  const error = errorIncomes || errorExpenses;

  // Cálculo del balance neto (usando el total que incluye saldo a favor)
  const netBalance = totalIncomeWithCredit - totalSpent;

  return (
    <div className="p-4">
      {/* Selector de Año */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Año:</label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded py-2 px-8 dark:bg-gray-900 cursor-pointer"
          >
            {["2022", "2023", "2024", "2025"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <SkeletonLoading />}
      {error && <p className="text-red-500">{error}</p>}

      {/* Se muestran las secciones cuando ya no se está cargando */}
      {!loading && (
        <>
          {/* Cards con indicadores clave */}
          <BalanceGeneralCards
            totalIncome={totalIncomeWithCredit}
            totalSpent={totalSpent}
            netBalance={netBalance}
          />

          {/* Gráfica comparativa de ingresos vs egresos */}
          <BalanceGeneralGraph
            incomesMonthlyStats={monthlyStatsIncomes}
            expensesMonthlyStats={monthlyStatsExpenses}
          />

          {/* Tabla detallada con el desglose mensual */}
          <BalanceGeneralDetailTable
            incomesMonthlyStats={monthlyStatsIncomes}
            expensesMonthlyStats={monthlyStatsExpenses}
          />

          {/* Reporte PDF del Balance General */}
          <PDFBalanceGeneralReport year={selectedYear} />
        </>
      )}
    </div>
  );
};

export default React.memo(BalanceGeneral);
