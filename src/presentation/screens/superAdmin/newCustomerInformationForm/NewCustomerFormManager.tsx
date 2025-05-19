import React, { useState } from "react";
import NewCustomerFormGenerator from "./NewCustomerFormGenerator";
import CustomerInformationTable from "./CustomerInformationTable";
import FormUrlsTable from "./FormUrlsTable";

const NewCustomerFormManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "generator" | "customers" | "urls"
  >("generator");

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("generator")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "generator"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
              }
            `}
          >
            Generar Formularios
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "customers"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
              }
            `}
          >
            Clientes Registrados
          </button>
          <button
            onClick={() => setActiveTab("urls")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "urls"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
              }
            `}
          >
            URLs Generadas
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "generator" && <NewCustomerFormGenerator />}
        {activeTab === "customers" && <CustomerInformationTable />}
        {activeTab === "urls" && <FormUrlsTable />}
      </div>
    </div>
  );
};

export default NewCustomerFormManager;
