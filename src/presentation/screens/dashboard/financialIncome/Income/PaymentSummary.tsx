// src/components/PaymentSummary.tsx
import React, { useEffect } from "react";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import PDFReportGenerator from "./PDFReportGenerator";
// import BarChartSection from "../Summary/BarChartSection";
import DetailedConceptsTable from "../Summary/DetailedConceptsTable";
import GrowthSection from "../Summary/GrowthSection";
import MonthComparisonTable from "../Summary/MonthComparisonTable";
import SummaryCards from "../Summary/SummaryCards";
import ConceptGrowthSection from "../Summary/ConceptGrowthSection.";
import AnnualGeneralStats from "../Summary/AnnualGeneralStats";

const PaymentSummary: React.FC = () => {
  // Suscribirse solo a lo estrictamente necesario del store, incluyendo monthlyStats
  const { loading, error, selectedYear, fetchSummary, setSelectedYear, monthlyStats } = usePaymentSummaryStore(
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

  // Función para cargar los condóminos
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);

  // Cargar condóminos al montar
  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  // Llamar a fetchSummary cada vez que cambia el año
  useEffect(() => {
    fetchSummary(selectedYear);
  }, [selectedYear, fetchSummary]);

  // Manejo del cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  // Mostrar el spinner solo si aún no se tiene data (por ejemplo, monthlyStats vacío)
  const showSpinner = loading && (!monthlyStats || monthlyStats.length === 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Reporte general</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Año:</label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded py-2 px-8"
          >
            {["2022", "2023", "2024", "2025"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSpinner && <LoadingApp />}
      {error && <p className="text-red-500">{error}</p>}

      {/* Aunque loading esté activo en una actualización, si ya hay datos se renderizan los componentes */}
      {!showSpinner && (
        <>
          <SummaryCards />
          <AnnualGeneralStats />
          {/* <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col gap-4 w-full md:w-[60%]">
              <BarChartSection />
            </div>
            <div>
              
            </div>
          </div> */}
          <GrowthSection />
          <MonthComparisonTable />
          <ConceptGrowthSection />
          <DetailedConceptsTable />
          <PDFReportGenerator year={selectedYear} />
        </>
      )}
    </div>
  );
};

export default React.memo(PaymentSummary);
