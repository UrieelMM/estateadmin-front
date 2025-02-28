// src/components/ExpensesSummary/ExpenseAnnualGeneralStats.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

const ExpenseAnnualGeneralStats: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  // const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Obtener los 5 conceptos con mayor gasto total
  const topConcepts = useMemo(() => {
    const conceptMap: Record<string, number> = {};
    expenses.forEach(exp => {
      conceptMap[exp.concept] = (conceptMap[exp.concept] || 0) + exp.amount;
    });
    const sorted = Object.entries(conceptMap).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5).map(([concept]) => concept);
  }, [expenses]);

  // Preparar datos para la gráfica de líneas:
  // Por cada mes, sumar el monto gastado de cada uno de los topConcepts.
  const lineData = useMemo(() => {
    // Inicializamos 12 meses (en formato "01" a "12") y agregamos los topConcepts a cada registro.
    const months = Array.from({ length: 12 }, (_, i) => {
      const mm = (i + 1).toString().padStart(2, "0");
      const record: Record<string, any> = { month: mm };
      topConcepts.forEach((concept) => {
        record[concept] = 0;
      });
      return record;
    });
    // Acumular gasto para cada concepto por mes
    expenses.forEach(exp => {
      if (topConcepts.includes(exp.concept)) {
        const mm = exp.expenseDate.substring(5, 7);
        const monthRecord = months.find(r => r.month === mm);
        if (monthRecord) {
          monthRecord[exp.concept] += exp.amount;
        }
      }
    });
    // Mapear el mes numérico a nombre
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
    return months.map(record => ({
      month: monthNames[record.month] || record.month,
      ...record,
    }));
  }, [expenses, topConcepts]);

  return (
    <div className="mb-8 w-full">
      {/* Gráfica de líneas: Evolución mensual de los 5 conceptos que más gastan */}
      <h4 className="text-lg font-bold mt-8 mb-2">
        Evolución mensual
      </h4>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={lineData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(val: number) => formatCurrency(val)} width={80} />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
            {topConcepts.map((concept, idx) => (
              <Line
                key={concept}
                type="monotone"
                dataKey={concept}
                name={concept}
                stroke={chartColors[idx % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseAnnualGeneralStats;
