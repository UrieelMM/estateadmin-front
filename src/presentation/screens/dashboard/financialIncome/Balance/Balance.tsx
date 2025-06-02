import { useState } from "react";
import ExpenseForm from "../../../../components/shared/forms/ExpensesForm";
import BalanceSummary from "./BalanceSummary";

const Balance = () => {
  const [open, setOpen] = useState(false);
  // Ahora el estado puede ser: "summary", "history" o "morosidad"
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Balance General</p>
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
              onClick={() => setActiveTab("summary")}
            >
              <span className="whitespace-nowrap">Resumen General</span>
              {activeTab === "summary" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          {activeTab === "summary" && (
            <>
              <h2 className="text-2xl font-bold text-indigo-600 mb- dark:text-indigo-500">
                Balance General de Ingresos y Egresos
              </h2>
              <BalanceSummary />
            </>
          )}
          {/* {activeTab === "morosidad" && (
                        <div>

                        </div>
                    )} */}
        </div>
      </div>
      <ExpenseForm open={open} setOpen={setOpen} />
    </>
  );
};

export default Balance;
