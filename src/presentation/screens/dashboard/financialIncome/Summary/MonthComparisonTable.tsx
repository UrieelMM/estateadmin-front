// src/components/paymentSummary/MonthComparisonTable.tsx
import React, { useMemo } from "react";
import { usePaymentSummaryStore, MonthlyStat } from "../../../../../store/paymentSummaryStore";

const monthNames: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

const MonthComparisonTable: React.FC = React.memo(() => {
  // Consumimos monthlyStats del nuevo store
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);

  // Ordenamos usando parseInt con base 10
  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort(
      (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
    );
  }, [monthlyStats]);

  // Función de formateo de moneda (con dos decimales)
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="mb-8 flex flex-col lg:flex-row gap-4">
      <div className="mb-8 w-full">
        <h3 className="text-xl font-bold mb-2">Comparativa mes a mes (totales)</h3>
        <table className="min-w-full border-collapse border border-indigo-200 dark:border-gray-800">
          <thead>
            <tr className="bg-indigo-500 dark:bg-gray-900">
              <th className="border p-2 text-white dark:text-gray-100">Mes</th>
              <th className="border p-2 text-white dark:text-gray-100">Monto abonado</th>
              <th className="border p-2 text-white dark:text-gray-100">Monto pendiente</th>
              <th className="border p-2 text-white dark:text-gray-100">Saldo a favor</th>
              <th className="border p-2 text-white dark:text-gray-100">Pagos no identificados</th>
              <th className="border p-2 text-white dark:text-gray-100">% Cumplimiento</th>
              <th className="border p-2 text-white dark:text-gray-100">% Morosidad</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyStats.map((row) => (
              <tr key={row.month} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer">
                <td className="border p-2">{monthNames[row.month] || row.month}</td>
                <td className="border p-2">{formatCurrency(row.paid + row.saldo)}</td>
                <td className="border p-2">{formatCurrency(row.pending)}</td>
                <td className="border p-2">{formatCurrency(row.saldo)}</td>
                <td className="border p-2">{formatCurrency(row.unidentifiedPayments || 0)}</td>
                <td className="border p-2">{row.complianceRate.toFixed(2)}%</td>
                <td className="border p-2">{row.delinquencyRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MonthComparisonTable;
