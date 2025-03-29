import { useState } from "react";
import ExpenseForm from "../../../../components/shared/forms/ExpensesForm";
import ExpensesSummary from "./ExpensesSummary";
import ExpenseDetailedConceptsTableAdvanced from "./ExpensesSummary/ExpenseDetailedConceptsTableAdvanced";
import ExpensesByProvider from "./ExpensesByProvider";

const Expenses = () => {
  const [open, setOpen] = useState(false);
  // Ahora el estado puede ser: "summary", "history" o "morosidad"
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Egresos</p>
          <button
            className="btn-primary h-10 mb-3"
            onClick={() => setOpen(!open)}
          >
            Registrar Gasto
          </button>
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

              {/* 2. Tab Historial y Recibos */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("history")}
              >
                Historial
              </button>

              {/* 3. Tab Egresos por Proveedor */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "providers"
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("providers")}
              >
                Egresos por Proveedor
              </button>
            </nav>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          {activeTab === "summary" && (
            <>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                Resumen General de Egresos
              </h2>
              <ExpensesSummary />
            </>
          )}
          {activeTab === "history" && (
            <div className="w-full flex justify-start mt-8">
              <div className="w-[100%]">
                <ExpenseDetailedConceptsTableAdvanced />
              </div>
            </div>
          )}
          {activeTab === "providers" && (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-indigo-600 mb-4 dark:text-indigo-500">
                Egresos por Proveedor
              </h2>
              <ExpensesByProvider />
            </div>
          )}
        </div>
      </div>
      <ExpenseForm open={open} setOpen={setOpen} />
    </>
  );
};

export default Expenses;
