// src/components/PaymentSummary.tsx
import React, { useEffect, useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { useExpenseSummaryStore } from "../../../../../store/expenseSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  SparklesIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import SkeletonLoading from "../../../../components/shared/loaders/SkeletonLoading";
import {
  INCOME_AI_REPORT_TEMPLATES,
} from "./aiReportTemplates";
import { useIncomeAIReportStore } from "../../../../../store/useIncomeAIReportStore";
import { downloadIncomeAIReportPdf } from "./IncomeAIReportPDF";

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
    payments,
    totalIncome,
    totalInitialBalance,
    totalPending,
    detailed,
    conceptRecords,
    comparativePercentages,
    byFinancialAccount,
    financialAccountsMap,
    totalCondominiums,
    logoBase64,
    adminCompany,
    adminPhone,
    adminEmail,
  } = usePaymentSummaryStore(
    ( state ) => ( {
      loading: state.loading,
      error: state.error,
      selectedYear: state.selectedYear,
      fetchSummary: state.fetchSummary,
      setSelectedYear: state.setSelectedYear,
      monthlyStats: state.monthlyStats,
      payments: state.payments,
      totalIncome: state.totalIncome,
      totalInitialBalance: state.totalInitialBalance,
      totalPending: state.totalPending,
      detailed: state.detailed,
      conceptRecords: state.conceptRecords,
      comparativePercentages: state.comparativePercentages,
      byFinancialAccount: state.byFinancialAccount,
      financialAccountsMap: state.financialAccountsMap,
      totalCondominiums: state.totalCondominiums,
      logoBase64: state.logoBase64,
      adminCompany: state.adminCompany,
      adminPhone: state.adminPhone,
      adminEmail: state.adminEmail,
    } ),
    shallow
  );

  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );
  const {
    totalSpent: totalSpentExpenses,
    fetchSummary: fetchExpenseSummary,
  } = useExpenseSummaryStore(
    ( state ) => ( {
      totalSpent: state.totalSpent,
      fetchSummary: state.fetchSummary,
    } ),
    shallow
  );

  const {
    open: isAIReportModalOpen,
    selectedTemplateId,
    customInstruction,
    report: aiReport,
    isGenerating: isGeneratingAIReport,
    error: aiReportError,
    quotaRemaining,
    quotaLimit,
    quotaResetAt,
    openModal: openAIReportModal,
    closeModal: closeAIReportModal,
    setTemplate: setAIReportTemplate,
    setCustomInstruction,
    clearReport: clearAIReport,
    generateReport: generateAIReport,
  } = useIncomeAIReportStore(
    ( state ) => ( {
      open: state.open,
      selectedTemplateId: state.selectedTemplateId,
      customInstruction: state.customInstruction,
      report: state.report,
      isGenerating: state.isGenerating,
      error: state.error,
      quotaRemaining: state.quotaRemaining,
      quotaLimit: state.quotaLimit,
      quotaResetAt: state.quotaResetAt,
      openModal: state.openModal,
      closeModal: state.closeModal,
      setTemplate: state.setTemplate,
      setCustomInstruction: state.setCustomInstruction,
      clearReport: state.clearReport,
      generateReport: state.generateReport,
    } ),
    shallow
  );

  useEffect( () => {
    fetchCondominiumsUsers();
  }, [ fetchCondominiumsUsers ] );

  useEffect( () => {
    const loadSummary = async () => {
      await Promise.all( [
        fetchSummary( selectedYear, true ),
        fetchExpenseSummary( selectedYear, true ),
      ] );
      setLastUpdatedAt( new Date() );
    };

    loadSummary();
  }, [ selectedYear, fetchSummary, fetchExpenseSummary ] );

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
  const showKpiSkeleton = loading;

  const toAIPayment = ( payment: any ) => ( {
    numberCondominium: payment.numberCondominium,
    month: payment.month,
    amountPaid: payment.amountPaid,
    amountPending: payment.amountPending,
    concept: payment.concept,
    paymentType: payment.paymentType,
    creditBalance: payment.creditBalance,
    creditUsed: payment.creditUsed,
    paid: payment.paid,
    paymentDate: payment.paymentDate,
    referenceAmount: payment.referenceAmount,
  } );

  const aiSnapshot = useMemo(
    () => ( {
      selectedYear,
      totalIncome,
      totalInitialBalance,
      totalSpentExpenses,
      flujoNetoPeriodo: totalIncome - totalSpentExpenses,
      saldoActualConsolidado:
        totalInitialBalance + ( totalIncome - totalSpentExpenses ),
      totalPending,
      totalCondominios: totalCondominiums,
      monthlyStats,
      payments: payments.map( toAIPayment ),
      detailed: Object.fromEntries(
        Object.entries( detailed ).map( ( [ condominium, records ] ) => [
          condominium,
          records.map( toAIPayment ),
        ] )
      ),
      conceptRecords: Object.fromEntries(
        Object.entries( conceptRecords ).map( ( [ concept, records ] ) => [
          concept,
          records.map( toAIPayment ),
        ] )
      ),
      comparativePercentages,
      byFinancialAccount: Object.fromEntries(
        Object.entries( byFinancialAccount ).map( ( [ accountId, records ] ) => [
          financialAccountsMap[ accountId ]?.name || "Cuenta no identificada",
          records.map( toAIPayment ),
        ] )
      ),
      financialAccounts: Object.values( financialAccountsMap ).map( ( account ) => ( {
        name: account.name,
        initialBalance: account.initialBalance,
        creationMonth: account.creationMonth,
      } ) ),
      generatedAt: new Date().toISOString(),
    } ),
    [
      selectedYear,
      totalIncome,
      totalInitialBalance,
      totalSpentExpenses,
      totalPending,
      totalCondominiums,
      monthlyStats,
      payments,
      detailed,
      conceptRecords,
      comparativePercentages,
      byFinancialAccount,
      financialAccountsMap,
    ]
  );

  const canonicalMetrics = useMemo( () => {
    const totalCargos = payments.reduce(
      ( acc, payment ) => acc + payment.referenceAmount,
      0
    );
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
    const montoAbonado =
      totalPaid +
      ( totalCreditBalance > 0 ? totalCreditBalance : 0 ) -
      totalCreditUsed;
    const saldo = totalCargos - montoAbonado;
    const saldoInicialHistorico = totalInitialBalance;
    const ingresosPeriodo = montoAbonado;
    const totalEgresosPeriodo = totalSpentExpenses;
    const flujoNetoPeriodo = ingresosPeriodo - totalEgresosPeriodo;
    const saldoActualConsolidado = saldoInicialHistorico + flujoNetoPeriodo;

    return {
      montoAbonado,
      totalCargos,
      saldo,
      saldoInicialHistorico,
      ingresosPeriodo,
      totalEgresosPeriodo,
      flujoNetoPeriodo,
      saldoActualConsolidado,
      totalCondominios: totalCondominiums,
      selectedYear,
    };
  }, [ payments, totalCondominiums, selectedYear, totalInitialBalance, totalSpentExpenses ] );

  const handleOpenAIReportModal = () => {
    openAIReportModal();
  };

  const handleGenerateAIReport = async () => {
    await generateAIReport( {
      snapshot: aiSnapshot,
      canonical: canonicalMetrics,
    } );
    if ( !useIncomeAIReportStore.getState().error ) {
      toast.success( "Reporte IA generado." );
    }
  };

  const handleCopyAIReport = async () => {
    if ( !aiReport ) return;
    try {
      await navigator.clipboard.writeText( aiReport );
      toast.success( "Reporte IA copiado al portapapeles." );
    } catch ( _error ) {
      toast.error( "No se pudo copiar el reporte IA." );
    }
  };

  const handleDownloadAIReportPdf = () => {
    if ( !aiReport ) return;

    downloadIncomeAIReportPdf( {
      report: aiReport,
      templateLabel: activeTemplate?.label || "Reporte IA",
      selectedYear,
      generatedAt: new Date(),
      logoBase64,
      adminCompany,
      adminPhone,
      adminEmail,
      canonical: {
        saldoInicialHistorico: canonicalMetrics.saldoInicialHistorico,
        ingresosPeriodo: canonicalMetrics.ingresosPeriodo,
        totalEgresosPeriodo: canonicalMetrics.totalEgresosPeriodo,
        flujoNetoPeriodo: canonicalMetrics.flujoNetoPeriodo,
        saldoActualConsolidado: canonicalMetrics.saldoActualConsolidado,
        totalCargos: canonicalMetrics.totalCargos,
        saldo: canonicalMetrics.saldo,
      },
    } );
  };

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
  const activeTemplate = INCOME_AI_REPORT_TEMPLATES.find(
    ( item ) => item.id === selectedTemplateId
  );
  const formatMoney = ( value: number ) =>
    value.toLocaleString( "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    } );

  const canonicalSummaryLabel = useMemo(
    () => ( {
      montoAbonado: formatMoney( canonicalMetrics.montoAbonado ),
      totalCargos: formatMoney( canonicalMetrics.totalCargos ),
      saldo: formatMoney( canonicalMetrics.saldo ),
      saldoInicialHistorico: formatMoney( canonicalMetrics.saldoInicialHistorico ),
      totalEgresosPeriodo: formatMoney( canonicalMetrics.totalEgresosPeriodo ),
      flujoNetoPeriodo: formatMoney( canonicalMetrics.flujoNetoPeriodo ),
      saldoActualConsolidado: formatMoney( canonicalMetrics.saldoActualConsolidado ),
    } ),
    [ canonicalMetrics ]
  );
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

      <div className="sticky top-2 z-2 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 py-3 shadow-sm">
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
              onClick={ handleOpenAIReportModal }
              className="relative overflow-hidden inline-flex items-center gap-2 rounded-lg border border-cyan-300/80 dark:border-cyan-700/70 bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.28)_50%,transparent_80%)]"
                initial={ { x: "-140%" } }
                animate={ { x: "140%" } }
                transition={ { duration: 1.6, repeat: Infinity, ease: "linear" } }
              />
              <SparklesIcon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Reporte IA</span>
            </button>

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-900/50 bg-white dark:bg-gray-900 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saldo inicial histórico
          </p>
          { showKpiSkeleton ? (
            <>
              <div className="mt-1 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                { canonicalSummaryLabel.saldoInicialHistorico }
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Base de arranque de cuentas activas.
              </p>
            </>
          ) }
        </div>
        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white dark:bg-gray-900 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ingresos del período
          </p>
          { showKpiSkeleton ? (
            <>
              <div className="mt-1 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                { canonicalSummaryLabel.montoAbonado }
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Monto neto abonado del periodo seleccionado.
              </p>
            </>
          ) }
        </div>
        <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-white dark:bg-gray-900 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Egresos del período
          </p>
          { showKpiSkeleton ? (
            <>
              <div className="mt-1 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                { canonicalSummaryLabel.totalEgresosPeriodo }
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Salidas registradas en el mismo periodo.
              </p>
            </>
          ) }
        </div>
        <div className="rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 bg-white dark:bg-gray-900 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Flujo neto del período
          </p>
          { showKpiSkeleton ? (
            <>
              <div className="mt-1 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                { canonicalSummaryLabel.flujoNetoPeriodo }
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Ingresos del período menos egresos del período.
              </p>
            </>
          ) }
        </div>
        <div className="rounded-xl border border-rose-200/70 dark:border-rose-900/50 bg-white dark:bg-gray-900 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saldo actual consolidado
          </p>
          { showKpiSkeleton ? (
            <>
              <div className="mt-1 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                { canonicalSummaryLabel.saldoActualConsolidado }
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Saldo inicial histórico + flujo neto del período.
              </p>
            </>
          ) }
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

      <AnimatePresence>
        { isAIReportModalOpen && (
          <motion.div
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            exit={ { opacity: 0 } }
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] p-4 md:p-8 overflow-y-auto"
            style={ { margin: "0 !important" } }
          >
            <motion.div
              initial={ { opacity: 0, y: 20, scale: 0.98 } }
              animate={ { opacity: 1, y: 0, scale: 1 } }
              exit={ { opacity: 0, y: 10, scale: 0.98 } }
              transition={ { duration: 0.22 } }
              className="mx-auto max-w-5xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
            >
              <div className="top-0 z-10 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-600 px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-white/90">
                      Inteligencia Financiera
                    </p>
                    <h3 className="text-xl font-bold">Generador de Reporte IA</h3>
                    <p className="text-sm text-white/85 mt-1">
                      Plantillas profesionales con datos en tiempo real. <br />
                      <span className="text-xs font-semibold text-white/85 mt-1">Powered by EstateAdmin IA</span>
                    </p>
                  </div>
                  <button
                    onClick={ closeAIReportModal }
                    className="rounded-lg bg-white/10 hover:bg-white/20 p-2 transition-colors"
                    aria-label="Cerrar modal IA"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  { INCOME_AI_REPORT_TEMPLATES.map( ( template ) => (
                    <button
                      key={ template.id }
                      onClick={ () => setAIReportTemplate( template.id ) }
                      className={ `text-left rounded-xl border p-3 transition-colors ${ selectedTemplateId === template.id
                        ? "border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }` }
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        { template.shortLabel }
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        { template.description }
                      </p>
                    </button>
                  ) ) }
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    Plantilla activa: { activeTemplate?.label || "N/A" }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    { activeTemplate?.objective }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Límite temporal: { Math.max( 0, quotaLimit - quotaRemaining ) }/{ quotaLimit } usados · { quotaRemaining }/{ quotaLimit } disponibles.
                    { quotaResetAt
                      ? ` Reinicio: ${ new Date( quotaResetAt ).toLocaleString( "es-MX" ) }.`
                      : "" }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Saldo inicial histórico
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.saldoInicialHistorico }
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ingresos del período
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.montoAbonado }
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Egresos del período
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.totalEgresosPeriodo }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Flujo neto del período
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.flujoNetoPeriodo }
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Saldo actual consolidado
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.saldoActualConsolidado }
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cargos del período (canónico)
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      { canonicalSummaryLabel.totalCargos }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Instrucción adicional (opcional)
                  </label>
                  <textarea
                    rows={ 3 }
                    value={ customInstruction }
                    onChange={ ( e ) => setCustomInstruction( e.target.value ) }
                    placeholder="Ejemplo: Enfoca recomendaciones en recuperación de cartera vencida y quick wins de 30 días."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={ handleGenerateAIReport }
                    disabled={ isGeneratingAIReport }
                    className="relative overflow-hidden inline-flex items-center gap-2 rounded-lg border border-cyan-300/80 dark:border-cyan-700/70 bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.28)_50%,transparent_80%)]"
                      initial={ { x: "-140%" } }
                      animate={ { x: "140%" } }
                      transition={ {
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "linear",
                      } }
                    />
                    { isGeneratingAIReport ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin relative z-10" />
                        <span className="relative z-10">Generando...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">Generar con IA</span>
                      </>
                    ) }
                  </button>

                  <button
                    onClick={ handleCopyAIReport }
                    disabled={ !aiReport }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copiar
                  </button>

                  <button
                    onClick={ clearAIReport }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Limpiar
                  </button>

                  <button
                    onClick={ handleDownloadAIReportPdf }
                    disabled={ !aiReport }
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 dark:border-cyan-700 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Descargar PDF
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 min-h-[240px]">
                  { isGeneratingAIReport && !aiReport && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Procesando datos y redactando el reporte...
                    </div>
                  ) }

                  { aiReportError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      { aiReportError }
                    </p>
                  ) }

                  { aiReport && (
                    <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                      <ReactMarkdown
                        remarkPlugins={ [ remarkGfm ] }
                        components={ {
                          h1: ( props ) => (
                            <h1
                              className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2"
                              { ...props }
                            />
                          ),
                          h2: ( props ) => (
                            <h2
                              className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 mt-4"
                              { ...props }
                            />
                          ),
                          h3: ( props ) => (
                            <h3
                              className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3"
                              { ...props }
                            />
                          ),
                          p: ( props ) => (
                            <p className="mb-2 text-gray-700 dark:text-gray-200" { ...props } />
                          ),
                          ul: ( props ) => (
                            <ul className="list-disc pl-5 mb-3 space-y-1" { ...props } />
                          ),
                          ol: ( props ) => (
                            <ol className="list-decimal pl-5 mb-3 space-y-1" { ...props } />
                          ),
                          li: ( props ) => <li className="text-gray-700 dark:text-gray-200" { ...props } />,
                          table: ( props ) => (
                            <div className="overflow-x-auto my-3">
                              <table
                                className="min-w-full border border-gray-200 dark:border-gray-700 text-xs"
                                { ...props }
                              />
                            </div>
                          ),
                          thead: ( props ) => (
                            <thead className="bg-gray-100 dark:bg-gray-800" { ...props } />
                          ),
                          th: ( props ) => (
                            <th
                              className="px-2 py-2 text-left font-semibold border border-gray-200 dark:border-gray-700"
                              { ...props }
                            />
                          ),
                          td: ( props ) => (
                            <td
                              className="px-2 py-2 border border-gray-200 dark:border-gray-700"
                              { ...props }
                            />
                          ),
                          strong: ( props ) => (
                            <strong className="font-semibold text-gray-900 dark:text-gray-100" { ...props } />
                          ),
                          hr: ( props ) => (
                            <hr className="my-3 border-gray-200 dark:border-gray-700" { ...props } />
                          ),
                          blockquote: ( props ) => (
                            <blockquote
                              className="border-l-4 border-cyan-500/70 pl-3 italic text-gray-700 dark:text-gray-300 my-3"
                              { ...props }
                            />
                          ),
                        } }
                      >
                        { aiReport }
                      </ReactMarkdown>
                    </div>
                  ) }
                </div>

                <p className="text-[11px] text-right text-gray-500 dark:text-gray-400">
                  Powered by EstateAdmin IA
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) }
      </AnimatePresence>

    </div>
  );
};

export default React.memo( PaymentSummary );
