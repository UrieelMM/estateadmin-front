// src/components/ExpensesSummary/ExpenseMonthComparisonTable.tsx
import React from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";


const ExpenseMonthComparisonTable: React.FC = () => {
  // Obtenemos los stats mensuales { month: "01", spent: 1234 }
  const monthlyStats = useExpenseSummaryStore((state) => state.monthlyStats);

  // Función para formatear moneda
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Ordenamos por número de mes
  const sortedStats = [...monthlyStats].sort((a, b) => parseInt(a.month) - parseInt(b.month));

  // Mapear "01" -> "Enero", etc.
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

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">Comparativa mensual</h3>
      {sortedStats.length === 0 ? (
        <p className="text-gray-600">No hay datos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
              <tr>
                <th className="py-2 px-4 text-left border-b">Mes</th>
                <th className="py-2 px-4 text-right border-b">Gasto</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => (
                <tr key={stat.month}>
                  <td className="py-2 px-4 border-b">
                    {monthNames[stat.month] || stat.month}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {formatCurrency(stat.spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseMonthComparisonTable;
