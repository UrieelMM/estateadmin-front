// DownloadReceipts.tsx
import { useState } from "react";
import { useReceiptStore } from "../../../../../store/receiptsStore";


const DownloadReceipts = () => {
  const [year, setYear] = useState("2024");
  const [month, setMonth] = useState("01");
  const [docType, setDocType] = useState("comprobantes"); // Valor por defecto
  const { sendReceipts, loading } = useReceiptStore();

  const handleSendReceipts = async () => {
    if (!year || !month) {
      alert("Por favor selecciona un año y mes.");
      return;
    }
    await sendReceipts(year, month, docType);
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Descargar recibos y comprobantes</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Año:</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {Array.from({ length: 11 }, (_, i) => 2020 + i).map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Mes:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Tipo de documento:</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="comprobantes">Comprobantes</option>
          <option value="recibos">Recibos</option>
        </select>
      </div>
      
      <button
        onClick={handleSendReceipts}
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {loading ? "Enviando..." : "Enviar documentos por email"}
      </button>
    </div>
  );
};

export default DownloadReceipts;
