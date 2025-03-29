// src/components/ExpensesSummary/ExpenseSummaryCards.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";

// Mapeo de mes: "01" -> "Enero", "02" -> "Febrero", etc.
const MONTH_NAMES: Record<string, string> = {
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

/**
 * Tarjetas con datos globales:
 * - Total Egresos
 * - Concepto con más ingresos
 * - Mes con mayor gasto
 * - Mes con menor gasto
 */
const ExpenseSummaryCards: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);
  const { isDarkMode } = useTheme();

  // Calcular "Concepto con más ingresos", "mes con mayor gasto" y "mes con menor gasto"
  const { bestConcept, bestMonth, worstMonth } = useMemo(() => {
    // Agrupar por concepto
    const conceptMap: Record<string, number> = {};
    // Agrupar por mes
    const monthMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      conceptMap[exp.concept] = (conceptMap[exp.concept] || 0) + exp.amount;
      // Asumimos expenseDate = "YYYY-MM-DD HH:mm"
      const mm = exp.expenseDate.substring(5, 7);
      monthMap[mm] = (monthMap[mm] || 0) + exp.amount;
    });

    // Ordenar conceptos por gasto descendente
    const conceptList = Object.entries(conceptMap).sort((a, b) => b[1] - a[1]);
    const bestConcept = conceptList[0] || ["N/A", 0];

    // Ordenar meses por gasto descendente
    const monthList = Object.entries(monthMap).sort((a, b) => b[1] - a[1]);
    const bestMonth = monthList[0] || ["N/A", 0];

    // Mes con menor gasto (mayor a 0)
    const worstMonthIdx = monthList
      .slice()
      .reverse()
      .findIndex(([_, val]) => val > 0);
    let worstMonth: [string, number] = ["N/A", 0];
    if (worstMonthIdx !== -1) {
      worstMonth = monthList[monthList.length - 1 - worstMonthIdx];
    }

    return {
      bestConcept,
      bestMonth,
      worstMonth,
    };
  }, [expenses]);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Datos de ejemplo para las tendencias
  const totalSpentTrend = [
    { value: totalSpent * 0.8 },
    { value: totalSpent * 0.9 },
    { value: totalSpent },
  ];

  const bestConceptTrend = [
    { value: bestConcept[1] * 0.8 },
    { value: bestConcept[1] * 0.9 },
    { value: bestConcept[1] },
  ];

  const bestMonthTrend = [
    { value: bestMonth[1] * 0.8 },
    { value: bestMonth[1] * 0.9 },
    { value: bestMonth[1] },
  ];

  const worstMonthTrend = [
    { value: worstMonth[1] * 0.8 },
    { value: worstMonth[1] * 0.9 },
    { value: worstMonth[1] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Tarjeta 1: Total Egresos */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-100">
          Total Egresos
        </p>
        <p className="text-xl font-semibold">{formatCurrency(totalSpent)}</p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={totalSpentTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#8093E8" : "#4F46E5"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjeta 2: Concepto con más ingresos */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-100">
          Concepto con más ingresos
        </p>
        <p className="text-base font-semibold text-indigo-500 dark:text-indigo-400">
          {bestConcept[0]}
        </p>
        <p className="text-xl font-semibold">
          {formatCurrency(bestConcept[1])}
        </p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bestConceptTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#74B9E7" : "#3B82F6"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjeta 3: Mes con mayor gasto */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-100">
          Mes con mayor gasto
        </p>
        <p className="text-base font-semibold text-indigo-500 dark:text-indigo-400">
          {MONTH_NAMES[bestMonth[0]] || bestMonth[0]}
        </p>
        <p className="text-xl font-semibold">{formatCurrency(bestMonth[1])}</p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bestMonthTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#A7CFE6" : "#0EA5E9"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjeta 4: Mes con menor gasto */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-100">
          Mes con menor gasto
        </p>
        <p className="text-base font-semibold text-indigo-500 dark:text-indigo-400">
          {MONTH_NAMES[worstMonth[0]] || worstMonth[0]}
        </p>
        <p className="text-xl font-semibold">{formatCurrency(worstMonth[1])}</p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={worstMonthTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#B79FE6" : "#8B5CF6"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSummaryCards;
