// src/components/ExpensesSummary/ExpenseAnnualGeneralStats.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";


/**
 * Paleta de colores
 */
const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

const ExpenseAnnualGeneralStats: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);

  // Agrupar por concepto (para el PieChart)
  const pieData = useMemo(() => {
    const conceptMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      conceptMap[exp.concept] = (conceptMap[exp.concept] || 0) + exp.amount;
    });
    return Object.entries(conceptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Agrupar por mes (para el BarChart)
  // expenseDate = "YYYY-MM-DD HH:mm"
  const barData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      const mm = exp.expenseDate.substring(5, 7);
      monthlyMap[mm] = (monthlyMap[mm] || 0) + exp.amount;
    });
    // Convertir a array y ordenarlo
    return Object.entries(monthlyMap)
      .map(([month, spent]) => ({
        month,
        spent,
      }))
      .sort((a, b) => parseInt(a.month) - parseInt(b.month));
  }, [expenses]);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">Estadísticas Anuales de Egresos</h3>

      {/* Tarjeta (opcional) con totalSpent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Total de Egresos (Año)</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
        </div>
        {/* Puedes agregar más tarjetas si deseas */}
      </div>

      {/* Gráfica de pastel: distribución por concepto */}
      <h4 className="text-lg font-bold mb-2">Distribución por Concepto</h4>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            >
              {pieData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de barras: gasto mensual */}
      <h4 className="text-lg font-bold mt-8 mb-2">Gasto Mensual (Barras)</h4>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={barData}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(val: number) => formatCurrency(val)}
              width={80}
            />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
            <Bar
              dataKey="spent"
              fill={chartColors[0]}
              name="Gasto Mensual"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseAnnualGeneralStats;
