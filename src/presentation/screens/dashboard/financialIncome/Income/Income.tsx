import { useState, useEffect, useLayoutEffect } from "react";
import PaymentForm from "../../../../components/shared/forms/PaymentForm";
import PaymentHistory from "./PaymentHistory";
import PaymentSummary from "./PaymentSummary";
import MorosidadView from "../Summary/MorosidadView";
import PaymentSummaryByAccount from "./PaymentSummaryByAccount";
import UnidentifiedPaymentsTable from "./UnidentifiedPaymentsTable";
import HistoryPaymentsTable from "./HistoryPaymentsTable";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";

const Income = () => {
  const [open, setOpen] = useState(false);
  // Ahora el estado puede ser: "summary", "accountSummary", "history" o "morosidad"
  const [activeTab, setActiveTab] = useState("summary");
  const { fetchSummary, cleanupListeners, selectedYear, setSelectedYear } =
    usePaymentSummaryStore(
    (state) => ({
      fetchSummary: state.fetchSummary,
      cleanupListeners: state.cleanupListeners,
      selectedYear: state.selectedYear,
      setSelectedYear: state.setSelectedYear,
    })
    );

  useLayoutEffect(() => {
    // Income debe abrir por defecto en vista global ("Todos los años").
    setSelectedYear("");
  }, [setSelectedYear]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (isMounted) {
          await fetchSummary(selectedYear, true);
        }
      } catch (error) {
        console.error("Error loading summary:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      cleanupListeners(selectedYear);
    };
  }, [fetchSummary, cleanupListeners, selectedYear]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (["summary", "accountSummary"].includes(tab)) {
      fetchSummary(selectedYear).catch((error) => {
        console.error("Error refreshing summary:", error);
      });
    }
  };

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Ingresos y Pagos</p>
          <button
            className="btn-primary h-10 mb-3"
            onClick={() => setOpen(!open)}
          >
            Registrar Pago
          </button>
        </header>

        {/* Navegación de pestañas moderna */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "summary"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("summary")}
            >
              <span className="whitespace-nowrap">Resumen General</span>
              {activeTab === "summary" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "accountSummary"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("accountSummary")}
            >
              <span className="whitespace-nowrap">Resumen por Cuenta</span>
              {activeTab === "accountSummary" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "history-by-condominium"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("history-by-condominium")}
            >
              <span className="whitespace-nowrap">Historial por condómino</span>
              {activeTab === "history-by-condominium" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "morosidad"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("morosidad")}
            >
              <span className="whitespace-nowrap">Morosidad</span>
              {activeTab === "morosidad" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "unidentified"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("unidentified")}
            >
              <span className="whitespace-nowrap">Pagos no identificados</span>
              {activeTab === "unidentified" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("history")}
            >
              <span className="whitespace-nowrap">Historial</span>
              {activeTab === "history" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          {activeTab === "summary" && (
            <>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                Resumen General de Ingresos
              </h2>
              <PaymentSummary />
            </>
          )}
          {activeTab === "accountSummary" && (
            <>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                Resumen por Cuenta
              </h2>
              <PaymentSummaryByAccount />
            </>
          )}
          {activeTab === "history-by-condominium" && (
            <div className="lg:px-4 flex mt-0 flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-[100%]">
                <PaymentHistory />
              </div>
            </div>
          )}
          {activeTab === "morosidad" && <MorosidadView />}
          {activeTab === "unidentified" && <UnidentifiedPaymentsTable />}
          {activeTab === "history" && <HistoryPaymentsTable />}
        </div>
      </div>

      <PaymentForm open={open} setOpen={setOpen} />
    </>
  );
};

export default Income;
