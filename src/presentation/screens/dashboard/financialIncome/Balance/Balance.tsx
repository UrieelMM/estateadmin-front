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

        {/* Tab Layout */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {/* 1. Tab Resumen General */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "summary"
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("summary")}
              >
                Resumen General
              </button>

              {/* 3. Tab Morosidad */}
              {/* <button
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "morosidad"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                onClick={() => setActiveTab("morosidad")}
                            >
                                Morosidad
                            </button> */}
            </nav>
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
