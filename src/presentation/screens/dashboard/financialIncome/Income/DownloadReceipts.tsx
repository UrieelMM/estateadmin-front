// DownloadReceipts.tsx
import { useState } from "react";
import { useReceiptStore } from "../../../../../store/receiptsStore";
import toast from "react-hot-toast";

const DownloadReceipts = () => {
  const [year, setYear] = useState("2024");
  const [month, setMonth] = useState("01");
  const [docType, setDocType] = useState("comprobantes"); // Valor por defecto
  const { sendReceipts, loading } = useReceiptStore();

  const handleSendReceipts = async () => {
    if (!year || !month) {
      toast.error("Por favor selecciona un año y mes.");
      return;
    }
    try {
      await sendReceipts(year, month, docType);
    } catch (err) {
      console.error("Error sending receipts:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-6">
        Descargar recibos y comprobantes
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
          Año:
        </label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
        >
          {Array.from({ length: 11 }, (_, i) => 2020 + i).map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
          Mes:
        </label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
        >
          {[
            { value: "01", label: "Enero" },
            { value: "02", label: "Febrero" },
            { value: "03", label: "Marzo" },
            { value: "04", label: "Abril" },
            { value: "05", label: "Mayo" },
            { value: "06", label: "Junio" },
            { value: "07", label: "Julio" },
            { value: "08", label: "Agosto" },
            { value: "09", label: "Septiembre" },
            { value: "10", label: "Octubre" },
            { value: "11", label: "Noviembre" },
            { value: "12", label: "Diciembre" },
          ].map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
          Tipo de documento:
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="mt-1 w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
        >
          <option value="comprobantes">Comprobantes</option>
          <option value="recibos">Recibos</option>
        </select>
      </div>

      <button
        onClick={handleSendReceipts}
        disabled={loading}
        className="w-full flex justify-center items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 min-h-[42px]"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Enviando...
          </>
        ) : (
          "Enviar documentos por email"
        )}
      </button>
    </div>
  );
};

export default DownloadReceipts;
