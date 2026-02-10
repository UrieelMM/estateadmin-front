// src/components/PaymentSummary.tsx
import React, { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

import PDFReportGenerator from "./PDFReportGenerator";
import ExcelReportGenerator from "./ExcelReportGenerator";
import PDFReportMaintenance from "./PDFReportMaintenance";
import SummaryCards from "../Summary/SummaryCards";
import AnnualGeneralStats from "../Summary/AnnualGeneralStats";
import GrowthSection from "../Summary/GrowthSection";
import MonthComparisonTable from "../Summary/MonthComparisonTable";
import DetailedConceptsTable from "../Summary/DetailedConceptsTable";
import ConceptGrowthSection from "../Summary/ConceptGrowthSection.";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";

const PaymentSummary: React.FC = () => {
  const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );

  const {
    loading,
    error,
    selectedYear,
    fetchSummary,
    setSelectedYear,
    monthlyStats,
  } = usePaymentSummaryStore(
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

  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );

  useEffect( () => {
    fetchCondominiumsUsers();
  }, [ fetchCondominiumsUsers ] );

  useEffect( () => {
    fetchSummary( selectedYear, true );
  }, [ selectedYear, fetchSummary ] );

  const handleYearChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    setSelectedYear( e.target.value );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen( !isDropdownOpen );
  };

  // Cerrar el dropdown al hacer clic fuera de él
  useEffect( () => {
    const handleClickOutside = ( event: MouseEvent ) => {
      const dropdownElement = document.getElementById( "export-dropdown" );
      if (
        dropdownElement &&
        !dropdownElement.contains( event.target as Node ) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen( false );
      }
    };

    document.addEventListener( "mousedown", handleClickOutside );
    return () => {
      document.removeEventListener( "mousedown", handleClickOutside );
    };
  }, [ isDropdownOpen ] );

  const showSpinner = loading && ( !monthlyStats || monthlyStats.length === 0 );

  return (
    <div className="p-4 w-full">
      <div className="flex justify-end w-full items-center mb-4">
        <div className="relative" id="export-dropdown">
          <button
            onClick={ toggleDropdown }
            className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded font-medium hover:bg-indigo-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Exportar
          </button>

          { isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <PDFReportGenerator
                  year={ selectedYear }
                  renderButton={ ( onClick ) => (
                    <button
                      onClick={ onClick }
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      Reporte General PDF
                    </button>
                  ) }
                />

                <ExcelReportGenerator
                  year={ selectedYear }
                  renderButton={ ( onClick ) => (
                    <button
                      onClick={ onClick }
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <TableCellsIcon className="h-5 w-5 text-green-600" />
                      Reporte General Excel
                    </button>
                  ) }
                />

                <PDFReportMaintenance
                  year={ selectedYear }
                  renderButton={ ( onClick ) => (
                    <button
                      onClick={ onClick }
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-600" />
                      Cuotas de Mantenimiento
                    </button>
                  ) }
                />
              </div>
            </div>
          ) }
        </div>
      </div>

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

      { showSpinner && <SkeletonLoading /> }
      { error && <p className="text-red-500">{ error }</p> }

      { !showSpinner && (
        <>
          <SummaryCards />
          <AnnualGeneralStats />
          <GrowthSection />
          <MonthComparisonTable />
          <ConceptGrowthSection />
          <DetailedConceptsTable />
        </>
      ) }
    </div>
  );
};

export default React.memo( PaymentSummary );
