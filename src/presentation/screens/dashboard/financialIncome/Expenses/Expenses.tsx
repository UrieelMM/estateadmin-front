import { useState } from "react";
import ExpenseForm from "../../../../components/shared/forms/ExpensesForm";
import ExpensesSummary from "./ExpensesSummary";
import ExpenseDetailedConceptsTableAdvanced from "./ExpensesSummary/ExpenseDetailedConceptsTableAdvanced";


const Expenses = () => {
    const [open, setOpen] = useState(false);
    // Ahora el estado puede ser: "summary", "history" o "morosidad"
    const [activeTab, setActiveTab] = useState("summary");

    return (
        <>
            <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
                <header className="bg-gray-50 font-medium shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
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
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "summary"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                onClick={() => setActiveTab("summary")}
                            >
                                Resumen General
                            </button>

                            {/* 2. Tab Historial y Recibos */}
                            <button
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                onClick={() => setActiveTab("history")}
                            >
                                Historial
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
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4">
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

export default Expenses;
