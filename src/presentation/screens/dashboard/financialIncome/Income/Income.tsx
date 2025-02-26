import { useState } from "react";
import PaymentForm from "../../../../components/shared/forms/PaymentForm";
import DownloadReceipts from "./DownloadReceipts";
import PaymentHistory from "./PaymentHistory";
import PaymentSummary from "./PaymentSummary";
import MorosidadView from "../Summary/MorosidadView";


const Maintenance = () => {
  const [open, setOpen] = useState(false);
  // Ahora el estado puede ser: "summary", "history" o "morosidad"
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
          <p className="text-md">Ingresos y Pagos</p>
          <button
            className="btn-primary h-10 mb-3"
            onClick={() => setOpen(!open)}
          >
            Registrar Pago
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
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("summary")}
              >
                Resumen General
              </button>

              {/* 2. Tab Historial y Recibos */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("history")}
              >
                Historial y Recibos
              </button>

              {/* 3. Tab Morosidad */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "morosidad"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("morosidad")}
              >
                Morosidad
              </button>
            </nav>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          {activeTab === "summary" && (
            <>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                Resumen General de Ingresos
              </h2>
              <PaymentSummary />
            </>
          )}
          {activeTab === "history" && (
            <div className="w-full flex justify-start mt-8">
              <div className="w-[70%]">
                <PaymentHistory />
              </div>
              <div className="w-[30%] ml-2">
                <DownloadReceipts />
              </div>
            </div>
          )}
          {activeTab === "morosidad" && (
            <MorosidadView />
          )}
        </div>
      </div>

      <PaymentForm open={open} setOpen={setOpen} />
    </>
  );
};

export default Maintenance;
