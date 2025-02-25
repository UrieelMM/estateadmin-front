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
  // Nos suscribimos directamente a monthlyStats desde el store
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);

  // Ordenamos los datos usando useMemo para evitar recalcular si monthlyStats no cambia
  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort((a, b) => parseInt(a.month) - parseInt(b.month));
  }, [monthlyStats]);

  return (
    <div className="mb-8 flex flex-col lg:flex-row gap-4">
      <div className="mb-8 w-full">
        <h3 className="text-xl font-bold mb-2">Comparativa mes a mes (totales)</h3>
        <table className="min-w-full border-collapse border border-indigo-200">
          <thead>
            <tr className="bg-indigo-500">
              <th className="border p-2 text-white">Mes</th>
              <th className="border p-2 text-white">Monto abonado</th>
              <th className="border p-2 text-white">Monto pendiente</th>
              <th className="border p-2 text-white">Saldo a favor</th>
              <th className="border p-2 text-white">% Cumplimiento</th>
              <th className="border p-2 text-white">% Morosidad</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyStats.map((row) => (
              <tr key={row.month}>
                <td className="border p-2">{monthNames[row.month] || row.month}</td>
                <td className="border p-2">
                  {"$" +
                    row.paid.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
                <td className="border p-2">
                  {"$" +
                    row.pending.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
                <td className="border p-2">
                  {"$" +
                    row.saldo.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
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
