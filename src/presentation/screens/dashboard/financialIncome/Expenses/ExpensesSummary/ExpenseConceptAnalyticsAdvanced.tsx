// src/components/ExpensesSummary/ExpenseConceptAnalyticsAdvanced.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

// Formateo de porcentaje, ej: "23.45%"
// const formatPercentage = (value: number): string => `${value.toFixed(2)}%`;

const ExpenseConceptAnalyticsAdvanced: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);

  // Agrupar los egresos por concepto, calculando total y cantidad de transacciones
  const aggregatedData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach((exp) => {
      if (!map[exp.concept]) {
        map[exp.concept] = { total: 0, count: 0 };
      }
      map[exp.concept].total += exp.amount;
      map[exp.concept].count += 1;
    });
    return Object.entries(map).map(([concept, data]) => ({
      concept,
      total: data.total,
      count: data.count,
      percentage: totalSpent ? (data.total / totalSpent) * 100 : 0,
    }));
  }, [expenses, totalSpent]);

  // Para la gráfica de pastel, tomar los 5 conceptos con mayor gasto
  const pieData = useMemo(() => {
    const sorted = [...aggregatedData].sort((a, b) => b.total - a.total);
    return sorted.slice(0, 5);
  }, [aggregatedData]);

  // Para la tabla, tomar los 10 conceptos con mayor cantidad de transacciones
  const tableData = useMemo(() => {
    const sorted = [...aggregatedData].sort((a, b) => b.count - a.count);
    return sorted.slice(0, 10);
  }, [aggregatedData]);

  return (
    <div className="mb-8 w-full">
      {/* <h3 className="text-xl font-bold mb-4">
        Análisis de gastos por concepto (Anual)
      </h3> */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-16">
        {/* Columna 2: Tabla de transacciones (35%) */}
        <div className="md:col-span-5">
          <h4 className="text-lg font-semibold mb-2">
            Transacciones por concepto{" "}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300">
              (10 principales conceptos)
            </span>
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Concepto</th>
                  <th className="py-2 px-4 border-b text-center">
                    Transacciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item) => (
                  <tr key={item.concept}>
                    <td className="py-2 px-4 border-b">{item.concept}</td>
                    <td className="py-2 px-4 border-b text-center">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Columna 1: Gráfica de pastel (65%) */}
        <div className="md:col-span-7">
          <h4 className="text-lg font-semibold mb-2">
            Distribución (%) de los 5 principales
          </h4>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="concept"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => {
                  // Acortar el texto si es demasiado largo
                  const shortenedName =
                    name.length > 15 ? `${name.substring(0, 12)}...` : name;
                  return `${shortenedName}: ${(percent * 100).toFixed(1)}%`;
                }}
                labelLine={false}
                fontSize={12} // Reducir tamaño de fuente
              >
                {pieData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(_value: number, _name: string, props: any) => {
                  // Mostrar el nombre completo en el tooltip
                  return [
                    `${props.payload.percentage.toFixed(1)}%`,
                    props.payload.concept,
                  ];
                }}
                contentStyle={{ fontSize: "12px" }}
              />
              <Legend
                formatter={(value) => {
                  // Acortar leyendas si son demasiado largas
                  return value.length > 26
                    ? `${value.substring(0, 18)}...`
                    : value;
                }}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExpenseConceptAnalyticsAdvanced;
