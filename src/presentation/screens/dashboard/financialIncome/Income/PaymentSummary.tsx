// src/components/PaymentSummary.tsx
import React, { useEffect } from "react";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

import PDFReportGenerator from "./PDFReportGenerator";
import PDFReportMaintenance from "./PDFReportMaintenance";
import SummaryCards from "../Summary/SummaryCards";
import AnnualGeneralStats from "../Summary/AnnualGeneralStats";
import GrowthSection from "../Summary/GrowthSection";
import MonthComparisonTable from "../Summary/MonthComparisonTable";
import DetailedConceptsTable from "../Summary/DetailedConceptsTable";
import ConceptGrowthSection from "../Summary/ConceptGrowthSection.";
import { DocumentTextIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/solid";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";

const PaymentSummary: React.FC = () => {
  const {
    loading,
    error,
    selectedYear,
    fetchSummary,
    setSelectedYear,
    monthlyStats,
  } = usePaymentSummaryStore(
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

  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  useEffect(() => {
    fetchSummary(selectedYear, true);
  }, [selectedYear, fetchSummary]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const showSpinner = loading && (!monthlyStats || monthlyStats.length === 0);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Año:</label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded py-2 px-4 dark:bg-gray-900 dark:ring-0 dark:border-none"
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

      {showSpinner && <SkeletonLoading />}
      {error && <p className="text-red-500">{error}</p>}

      {!showSpinner && (
        <>
          <SummaryCards />
          <AnnualGeneralStats />
          <GrowthSection />
          <MonthComparisonTable />
          <ConceptGrowthSection />
          <DetailedConceptsTable />

          <h2 className="text-xl font-bold mt-8 mb-4">Reportes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta para Reporte de Ingresos */}
            <div className="p-4 shadow-md rounded-md flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <DocumentTextIcon className="text-indigo-600 h-8 w-8" />
                <h3 className="font-bold text-lg">Reporte de Ingresos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-100">
                Genera el reporte de ingresos por concepto de cuota de mantenimiento.
              </p>
              <PDFReportGenerator year={selectedYear} />
            </div>
            {/* Tarjeta para Reporte de Mantenimiento */}
            <div className="p-4 shadow-md rounded-md flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <WrenchScrewdriverIcon className="text-indigo-600 h-8 w-8" />
                <h3 className="font-bold text-lg">Reporte de Mantenimiento</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-100">
                Reporte detallado de los egresos de mantenimiento.
              </p>
              <PDFReportMaintenance year={selectedYear} />
            </div>
            {/* Aquí podrías agregar más tarjetas conforme se añadan más reportes */}
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(PaymentSummary);
