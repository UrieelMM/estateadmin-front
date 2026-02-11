// src/components/PaymentSummary.tsx
import React, { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import { AnimatePresence, motion } from "framer-motion";

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
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  SparklesIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";

type SummaryView = "overview" | "monthly" | "concepts";

const PaymentSummary: React.FC = () => {
  const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
  const [ activeView, setActiveView ] = useState<SummaryView>( "overview" );
  const [ lastUpdatedAt, setLastUpdatedAt ] = useState<Date | null>( null );

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
    const loadSummary = async () => {
      await fetchSummary( selectedYear, true );
      setLastUpdatedAt( new Date() );
    };

    loadSummary();
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

  const handleRefresh = async () => {
    await fetchSummary( selectedYear, true );
    setLastUpdatedAt( new Date() );
  };

  const showSpinner = loading && ( !monthlyStats || monthlyStats.length === 0 );

  const views: {
    id: SummaryView;
    label: string;
    microcopy: string;
    icon: React.ComponentType<{ className?: string; }>;
  }[] = [
      {
        id: "overview",
        label: "Resumen Ejecutivo",
        microcopy: "Indicadores clave y de variación.",
        icon: PresentationChartLineIcon,
      },
      {
        id: "monthly",
        label: "Vista Mensual",
        microcopy: "Comparativa mes a mes para detectar desvíos operativos.",
        icon: CalendarDaysIcon,
      },
      {
        id: "concepts",
        label: "Vista por Conceptos",
        microcopy: "Distribución y desempeño por tipo de ingreso.",
        icon: QueueListIcon,
      },
    ];

  const activeViewData = views.find( ( view ) => view.id === activeView );
  const lastUpdatedLabel = lastUpdatedAt
    ? `${ lastUpdatedAt.toLocaleDateString( "es-MX" ) } ${ lastUpdatedAt.toLocaleTimeString(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ) }`
    : "Sin actualizaciones";

  return (
    <div className="p-4 w-full space-y-4">
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <SparklesIcon className="h-4 w-4" />
              Panel de Control de Ingresos
            </p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Dashboard Financiero
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Visualiza recaudación y saldos.
            </p>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">Última actualización:</span>{ " " }
            { lastUpdatedLabel }
          </div>
        </div>
      </div>

      <div className="sticky top-2 z-20 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Periodo de análisis
            </label>
            <div className="relative">
              <select
                value={ selectedYear }
                onChange={ handleYearChange }
                className="min-w-[220px] border border-gray-300 dark:border-gray-700 rounded-lg py-2 px-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Todos los años</option>
                { [ "2022", "2023", "2024", "2025", "2026" ].map( ( y ) => (
                  <option key={ y } value={ y }>
                    { y }
                  </option>
                ) ) }
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Consejo: usa "Todos los años" para visión histórica completa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={ handleRefresh }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowPathIcon
                className={ `h-4 w-4 ${ loading ? "animate-spin" : "" }` }
              />
              Actualizar
            </button>

            <div className="relative" id="export-dropdown">
              <button
                onClick={ toggleDropdown }
                className="inline-flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exportar
              </button>

              <AnimatePresence>
                { isDropdownOpen && (
                  <motion.div
                    initial={ { opacity: 0, y: -8 } }
                    animate={ { opacity: 1, y: 0 } }
                    exit={ { opacity: 0, y: -8 } }
                    transition={ { duration: 0.18 } }
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-30 border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="py-1">
                      <PDFReportGenerator
                        year={ selectedYear }
                        renderButton={ ( onClick ) => (
                          <button
                            onClick={ onClick }
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
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
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
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
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-600" />
                            Cuotas de Mantenimiento
                          </button>
                        ) }
                      />
                    </div>
                  </motion.div>
                ) }
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          { views.map( ( view ) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;

            return (
              <button
                key={ view.id }
                onClick={ () => setActiveView( view.id ) }
                className={ `text-left rounded-xl border px-3 py-3 transition-colors ${ isActive
                  ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }` }
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={ `h-4 w-4 ${ isActive
                      ? "text-indigo-600 dark:text-indigo-300"
                      : "text-gray-500 dark:text-gray-400"
                      }` }
                  />
                  <p
                    className={ `text-sm font-semibold ${ isActive
                      ? "text-indigo-700 dark:text-indigo-200"
                      : "text-gray-800 dark:text-gray-100"
                      }` }
                  >
                    { view.label }
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  { view.microcopy }
                </p>
              </button>
            );
          } ) }
        </div>
      </div>

      { showSpinner && <SkeletonLoading /> }
      { error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          { error }
        </div>
      ) }

      { !showSpinner && (
        <AnimatePresence mode="wait">
          <motion.div
            key={ activeView }
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            exit={ { opacity: 0, y: -6 } }
            transition={ { duration: 0.22 } }
            className="space-y-4"
          >
            { activeViewData && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  { activeViewData.label }
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  { activeViewData.microcopy }
                </p>
              </div>
            ) }

            { activeView === "overview" && (
              <>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <SummaryCards />
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <GrowthSection />
                </div>
              </>
            ) }

            { activeView === "monthly" && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <MonthComparisonTable />
              </div>
            ) }

            { activeView === "concepts" && (
              <>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <AnnualGeneralStats />
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <ConceptGrowthSection />
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <DetailedConceptsTable />
                </div>
              </>
            ) }
          </motion.div>
        </AnimatePresence>
      ) }

    </div>
  );
};

export default React.memo( PaymentSummary );
