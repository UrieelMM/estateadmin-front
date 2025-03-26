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
    (state) => ({
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      monthlyStats: state.monthlyStats,
    }),
    shallow
  );

  // Opcional: si requieres cargar usuarios/condominios, como en PaymentSummary
  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  // Cada vez que cambia el año seleccionado, invocamos fetchSummary
  useEffect(() => {
    fetchSummary(selectedYear, true);
  }, [selectedYear, fetchSummary]);

  // Manejar el cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  // Mostrar spinner solo si no tenemos datos y está en loading
  const showSpinner = loading && (!monthlyStats || monthlyStats.length === 0);

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
            <option value="">Todos los años</option>
            {["2022", "2023", "2024", "2025"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {showSpinner && <SkeletonLoading />}
      {error && <p className="text-red-500">{error}</p>}

      {/* Si ya no está loading o sí hay data, mostramos secciones */}
      {!showSpinner && (
        <>
          {/* Tarjetas con totales, mes con mayor/menor gasto, etc. */}
          <ExpenseSummaryCards />

          {/* Tabla detallada con truncado de descripción */}
          <ExpenseConceptAnalyticsAdvanced />

          {/* Gráfica(s) anual(es) y estadísticas (distribución por concepto, etc.) */}
          <ExpenseAnnualGeneralStats />

          {/* Comparativa de egresos por concepto en el tiempo (tipo Growth) */}
          <ExpenseConceptGrowthSection />

          {/* Tabla comparativa mensual */}
          <ExpenseMonthComparisonTable />

          {/* Opcional: Generar PDF con toda la info */}
          <PDFExpenseReportGenerator year={selectedYear} />
        </>
      )}
    </div>
  );
};

export default React.memo(ExpenseSummary);
