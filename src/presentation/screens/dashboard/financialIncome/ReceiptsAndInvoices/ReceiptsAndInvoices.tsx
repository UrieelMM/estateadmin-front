import { useState } from "react";
import InvoicesByCondominiums from "./InvoicesByCondominiums";
import DownloadReceiptsAndInvoices from "./DownloadReceiptsAndInvoices";

const ReceiptsAndInvoices = () => {
  const [activeTab, setActiveTab] = useState("invoicesByCondominiums");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Recibos y Comprobantes</p>
        </header>

        {/* Navegación de pestañas moderna */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "invoicesByCondominiums"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("invoicesByCondominiums")}
            >
              <span className="whitespace-nowrap">Comprobantes</span>
              {activeTab === "invoicesByCondominiums" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>

            <button
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 ease-out
                ${
                  activeTab === "downloadReceiptsAndInvoices"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-800 dark:via-purple-700 dark:to-indigo-800 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
              `}
              onClick={() => handleTabChange("downloadReceiptsAndInvoices")}
            >
              <span className="whitespace-nowrap">
                Descargar Recibos y Comprobantes
              </span>
              {activeTab === "downloadReceiptsAndInvoices" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-0 py-4">
          {activeTab === "invoicesByCondominiums" && <InvoicesByCondominiums />}
          {activeTab === "downloadReceiptsAndInvoices" && (
            <DownloadReceiptsAndInvoices />
          )}
        </div>
      </div>
    </>
  );
};
export default ReceiptsAndInvoices;
