import { useState, useEffect } from "react";
import PaymentForm from "../../../../components/shared/forms/PaymentForm";
import PaymentHistory from "./PaymentHistory";
import PaymentSummary from "./PaymentSummary";
import MorosidadView from "../Summary/MorosidadView";
import PaymentSummaryByAccount from "./PaymentSummaryByAccount";
import UnidentifiedPaymentsTable from "./UnidentifiedPaymentsTable";
import HistoryPaymentsTable from "./HistoryPaymentsTable";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import IASearch from "../../../IA/IASearch";

const Income = () => {
  const [open, setOpen] = useState(false);
  // Ahora el estado puede ser: "summary", "accountSummary", "history" o "morosidad"
  const [activeTab, setActiveTab] = useState("summary");
  const { fetchSummary, cleanupListeners } = usePaymentSummaryStore(
    (state) => ({
      fetchSummary: state.fetchSummary,
      cleanupListeners: state.cleanupListeners,
    })
  );

  useEffect(() => {
    let isMounted = true;
    const currentYear = new Date().getFullYear().toString();

    const loadData = async () => {
      try {
        if (isMounted) {
          await fetchSummary(currentYear, true);
        }
      } catch (error) {
        console.error("Error loading summary:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      cleanupListeners(currentYear);
    };
  }, [fetchSummary, cleanupListeners]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (["summary", "accountSummary"].includes(tab)) {
      const currentYear = new Date().getFullYear().toString();
      fetchSummary(currentYear).catch((error) => {
        console.error("Error refreshing summary:", error);
      });
    }
  };

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Ingresos y Pagos</p>
          <div className="flex gap-4 items-center justify-end">
            <div className="w-20 flex justify-end">
              <IASearch context="income" />
            </div>
            <button
              className="btn-primary h-10 mb-3"
              onClick={() => setOpen(!open)}
            >
              Registrar Pago
            </button>
          </div>
        </header>

        {/* Tab Layout */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav
              className="-mb-px flex space-x-8 dark:border-gray-800 overflow-x-auto custom-scrollbar"
              aria-label="Tabs"
            >
              {/* 1. Tab Resumen General */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "summary"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("summary")}
              >
                Resumen General
              </button>

              {/* 2. Tab Resumen por Cuenta */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "accountSummary"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("accountSummary")}
              >
                Resumen por Cuenta
              </button>

              {/* 3. Tab Historial y Recibos */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history-by-condominium"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("history-by-condominium")}
              >
                Historial por condómino
              </button>

              {/* 4. Tab Morosidad */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "morosidad"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("morosidad")}
              >
                Morosidad
              </button>
              {/* 4. Tab Pagos no identificados*/}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "unidentified"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("unidentified")}
              >
                Pagos no identificados
              </button>
              {/* 5. Tab Historial*/}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("history")}
              >
                Historial
              </button>
            </nav>
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
