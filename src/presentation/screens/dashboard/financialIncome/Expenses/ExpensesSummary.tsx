// src/components/ExpensesSummary/ExpenseSummary.tsx

import React, { useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useExpenseSummaryStore } from "../../../../../store/expenseSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

import ExpenseAnnualGeneralStats from "./ExpensesSummary/ExpenseAnnualGeneralStats";
import ExpenseConceptGrowthSection from "./ExpensesSummary/ExpenseConceptGrowthSection";
import ExpenseConceptAnalyticsAdvanced from "./ExpensesSummary/ExpenseConceptAnalyticsAdvanced";
import ExpenseMonthComparisonTable from "./ExpensesSummary/ExpenseMonthComparisonTable";
import ExpenseSummaryCards from "./ExpensesSummary/ExpenseSummaryCards";
import PDFExpenseReportGenerator from "./ExpensesSummary/PDFExpenseReportGenerator";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";
import { motion } from "framer-motion";

// import ExpensePDFReportGenerator from "./ExpensePDFReportGenerator"; // Si deseas PDF

/**
 * Componente principal que muestra el resumen de egresos.
 * Similar a tu "PaymentSummary" para ingresos, pero orientado a egresos.
 */
const ExpenseSummary: React.FC = () => {
  // Extrae del store la información y métodos necesarios.
  const {
    loading,
    error,
    selectedYear,
    fetchSummary,
    setSelectedYear,
    monthlyStats, // si lo usas
  } = useExpenseSummaryStore(
    ( state ) => ( {
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      monthlyStats: state.monthlyStats,
    } ),
    shallow
  );

  // Opcional: si requieres cargar usuarios/condominios, como en PaymentSummary
  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );

  useEffect( () => {
    fetchCondominiumsUsers();
  }, [ fetchCondominiumsUsers ] );

  // Cada vez que cambia el año seleccionado, invocamos fetchSummary
  useEffect( () => {
    fetchSummary( selectedYear, true );
  }, [ selectedYear, fetchSummary ] );

  // Manejar el cambio de año
  const handleYearChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    setSelectedYear( e.target.value );
  };

  // Mostrar spinner solo si no tenemos datos y está en loading
  const showSpinner = loading && ( !monthlyStats || monthlyStats.length === 0 );

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
              Resumen de Egresos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitorea gasto acumulado, conceptos dominantes y variación mensual.
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
      { showSpinner && <SkeletonLoading /> }
      { error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-3">
          <p className="text-red-700 dark:text-red-300 text-sm">{ error }</p>
        </div>
      ) }

      {/* Si ya no está loading o sí hay data, mostramos secciones */ }
      { !showSpinner && (
        <div className="space-y-4">
          {/* Tarjetas con totales, mes con mayor/menor gasto, etc. */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.03 } }
          >
            <ExpenseSummaryCards />
          </motion.div>

          {/* Tabla detallada con truncado de descripción */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.06 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="mb-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Análisis por Concepto
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Detecta qué rubros presionan más el gasto operativo.
              </p>
            </div>
            <ExpenseConceptAnalyticsAdvanced />
          </motion.div>

          {/* Gráfica(s) anual(es) y estadísticas (distribución por concepto, etc.) */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.09 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <ExpenseAnnualGeneralStats />
          </motion.div>

          {/* Comparativa de egresos por concepto en el tiempo (tipo Growth) */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.12 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <ExpenseConceptGrowthSection />
          </motion.div>

          {/* Tabla comparativa mensual */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.15 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <ExpenseMonthComparisonTable />
          </motion.div>

          {/* Opcional: Generar PDF con toda la info */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.2, delay: 0.18 } }
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <PDFExpenseReportGenerator year={ selectedYear } />
          </motion.div>
        </div>
      ) }
    </div>
  );
};

export default React.memo( ExpenseSummary );
