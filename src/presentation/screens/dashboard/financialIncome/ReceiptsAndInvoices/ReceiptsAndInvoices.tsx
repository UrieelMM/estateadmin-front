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

        {/* Tab Layout */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav
              className="-mb-px flex space-x-8 dark:border-gray-800 overflow-x-auto custom-scrollbar"
              aria-label="Tabs"
            >
              {/* 1. Tab Comprobantes*/}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "invoicesByCondominiums"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("invoicesByCondominiums")}
              >
                Comprobantes
              </button>

              {/* 2. Tab Resumen por Download Receipts and Invoices */}
              <button
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "downloadReceiptsAndInvoices"
                    ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
                }`}
                onClick={() => handleTabChange("downloadReceiptsAndInvoices")}
              >
                Descargar Recibos y Comprobantes
              </button>
            </nav>
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
