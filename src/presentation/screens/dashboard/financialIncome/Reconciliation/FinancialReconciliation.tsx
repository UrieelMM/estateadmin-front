import { useState } from "react";
import PaymentReconciliation from "../Income/PaymentReconciliation";
import ExpenseReconciliation from "./ExpenseReconciliation";
import ReconciliationHistory from "./ReconciliationHistory";

const FinancialReconciliation = () => {
  const [ activeTab, setActiveTab ] = useState<"income" | "expenses" | "history">( "income" );
  const [pendingResume, setPendingResume] = useState<{
    id: string;
    type: "income" | "expenses";
  } | null>(null);

  return (
    <div className="px-4 shadow-lg rounded-md sm:px-6 pb-4 lg:px-8">
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-4 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <div>
          <p className="text-md">Conciliación Financiera</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Compara movimientos bancarios contra registros internos de ingresos y egresos.
          </p>
        </div>
        <a
          href="/templates/conciliacion_bancaria_plantilla.csv"
          download
          className="inline-flex items-center rounded-md border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
        >
          Descargar plantilla CSV
        </a>
      </header>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "income"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => setActiveTab( "income" ) }
          >
            Conciliación de ingresos
          </button>
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "expenses"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => setActiveTab( "expenses" ) }
          >
            Conciliación de egresos
          </button>
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "history"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => setActiveTab( "history" ) }
          >
            Historial
          </button>
        </div>
      </div>

      { activeTab === "income" && (
        <PaymentReconciliation
          resumeDraftId={pendingResume?.type === "income" ? pendingResume.id : null}
          onResumeHandled={() =>
            setPendingResume((prev) => (prev?.type === "income" ? null : prev))
          }
        />
      )}
      { activeTab === "expenses" && (
        <ExpenseReconciliation
          resumeDraftId={pendingResume?.type === "expenses" ? pendingResume.id : null}
          onResumeHandled={() =>
            setPendingResume((prev) => (prev?.type === "expenses" ? null : prev))
          }
        />
      )}
      { activeTab === "history" && (
        <ReconciliationHistory
          onResumeDraft={(session) => {
            setPendingResume(session);
            setActiveTab(session.type);
          }}
        />
      )}
    </div>
  );
};

export default FinancialReconciliation;
