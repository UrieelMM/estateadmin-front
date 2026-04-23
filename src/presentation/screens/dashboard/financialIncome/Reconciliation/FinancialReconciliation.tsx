import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import PaymentReconciliation from "../Income/PaymentReconciliation";
import ExpenseReconciliation from "./ExpenseReconciliation";
import ReconciliationHistory from "./ReconciliationHistory";

const TEMPLATE_ROWS: Array<Record<string, string | number>> = [
  { Fecha: "2026-02-01", Descripcion: "SALDO INICIAL", Referencia: "", Cargo: 0, Abono: 0, Saldo: 11200.1 },
  { Fecha: "2026-02-03", Descripcion: "DEP TRANSFERENCIA CUOTA MANTENIMIENTO DEPTO 101", Referencia: "EA-PAY-0001", Cargo: 0, Abono: 1450.1, Saldo: 12650.2 },
  { Fecha: "2026-02-04", Descripcion: "DEP SPEI CUOTA MANTENIMIENTO DEPTO 205", Referencia: "EA-PAY-0002", Cargo: 0, Abono: 1200, Saldo: 13850.2 },
  { Fecha: "2026-02-05", Descripcion: "DEP TRANSFERENCIA CUOTA EXTRAORDINARIA DEPTO 310", Referencia: "EA-PAY-0003", Cargo: 0, Abono: 2500, Saldo: 16350.2 },
  { Fecha: "2026-02-07", Descripcion: "PAGO PROVEEDOR LIMPIEZA FACTURA A-155", Referencia: "EA-EXP-1001", Cargo: 550, Abono: 0, Saldo: 15800.2 },
  { Fecha: "2026-02-09", Descripcion: "PAGO SERVICIO AGUA FEBRERO", Referencia: "EA-EXP-1002", Cargo: 1200, Abono: 0, Saldo: 14600.2 },
  { Fecha: "2026-02-10", Descripcion: "PAGO PROVEEDOR MANTENIMIENTO ELEVADOR", Referencia: "EA-EXP-1003", Cargo: 3500, Abono: 0, Saldo: 11100.2 },
  { Fecha: "2026-02-12", Descripcion: "DEP SPEI CUOTA MANTENIMIENTO DEPTO 404", Referencia: "EA-PAY-0004", Cargo: 0, Abono: 1450, Saldo: 12550.2 },
  { Fecha: "2026-02-14", Descripcion: "PAGO HONORARIOS ADMINISTRADOR", Referencia: "EA-EXP-1004", Cargo: 8500, Abono: 0, Saldo: 4050.2 },
  { Fecha: "2026-02-17", Descripcion: "DEP TRANSFERENCIA CUOTA MANTENIMIENTO DEPTO 512", Referencia: "EA-PAY-0005", Cargo: 0, Abono: 1450, Saldo: 5500.2 },
  { Fecha: "2026-02-20", Descripcion: "PAGO SEGURO INMUEBLE FEB", Referencia: "EA-EXP-1005", Cargo: 2200.5, Abono: 0, Saldo: 3299.7 },
  { Fecha: "2026-02-22", Descripcion: "DEP EXTRAORDINARIO OBRA FACHADA DEPTO 101", Referencia: "EA-PAY-0006", Cargo: 0, Abono: 5000, Saldo: 8299.7 },
  { Fecha: "2026-02-25", Descripcion: "COMISION BANCARIA MENSUAL", Referencia: "EA-EXP-1006", Cargo: 250, Abono: 0, Saldo: 8049.7 },
  { Fecha: "2026-02-27", Descripcion: "DEP TRANSFERENCIA CUOTA MANTENIMIENTO DEPTO 608", Referencia: "EA-PAY-0007", Cargo: 0, Abono: 1450, Saldo: 9499.7 },
  { Fecha: "2026-02-28", Descripcion: "PAGO SERVICIO LUZ AREAS COMUNES", Referencia: "EA-EXP-1007", Cargo: 1800, Abono: 0, Saldo: 7699.7 },
];

const downloadXlsxTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, {
    header: ["Fecha", "Descripcion", "Referencia", "Cargo", "Abono", "Saldo"],
  });
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 48 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
  XLSX.writeFile(workbook, "conciliacion_bancaria_plantilla.xlsx", {
    bookType: "xlsx",
  });
};

type ReconciliationTabId = "income" | "expenses" | "history";

const RECONCILIATION_TAB_PATHS: Record<ReconciliationTabId, string> = {
  income: "/dashboard/reconciliation/income",
  expenses: "/dashboard/reconciliation/expenses",
  history: "/dashboard/reconciliation/history",
};

const RECONCILIATION_PATH_TO_TAB: Record<string, ReconciliationTabId> = {
  income: "income",
  expenses: "expenses",
  history: "history",
};

const FinancialReconciliation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingResume, setPendingResume] = useState<{
    id: string;
    type: "income" | "expenses";
  } | null>(null);
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const tabSlug = pathSegments[2] || "";
  const activeTab: ReconciliationTabId =
    RECONCILIATION_PATH_TO_TAB[tabSlug] || "income";

  useEffect(() => {
    const targetPath = RECONCILIATION_TAB_PATHS[activeTab];
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true, state: null });
    }
  }, [activeTab, location.pathname, navigate]);

  return (
    <div className="px-4 shadow-lg rounded-md sm:px-6 pb-4 lg:px-8">
      <header className="bg-gray-50 font-medium shadow-lg flex w-full min-h-16 py-3 justify-between px-4 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100 gap-4 flex-wrap">
        <div>
          <p className="text-md">Conciliación Financiera</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Compara movimientos bancarios contra registros internos de ingresos y egresos.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Formatos soportados: CSV, XLSX, XLS y TXT (hasta 20&nbsp;MB).
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/templates/conciliacion_bancaria_plantilla.csv"
            download
            className="inline-flex items-center rounded-md border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
          >
            Plantilla CSV
          </a>
          <button
            type="button"
            onClick={downloadXlsxTemplate}
            className="inline-flex items-center rounded-md border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
          >
            Plantilla Excel (XLSX)
          </button>
        </div>
      </header>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "income"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => navigate(RECONCILIATION_TAB_PATHS.income) }
          >
            Conciliación de ingresos
          </button>
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "expenses"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => navigate(RECONCILIATION_TAB_PATHS.expenses) }
          >
            Conciliación de egresos
          </button>
          <button
            className={ `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${ activeTab === "history"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }` }
            onClick={ () => navigate(RECONCILIATION_TAB_PATHS.history) }
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
            navigate(RECONCILIATION_TAB_PATHS[session.type]);
          }}
        />
      )}
    </div>
  );
};

export default FinancialReconciliation;
