// src/components/ExpensesSummary/ExpenseSummaryCards.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";


/**
 * Tarjetas con datos globales:
 * - Total Egresos
 * - Concepto Estrella
 * - Mes con mayor gasto
 * - Mes con menor gasto
 */
const ExpenseSummaryCards: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);

  // Calcular "concepto estrella", "peor concepto", y mes con mayor/menor gastos
  const {
    bestConcept,
    bestMonth,
    worstMonth,
  } = useMemo(() => {
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

    // Concepto con mayor gasto
    const conceptList = Object.entries(conceptMap).sort((a, b) => b[1] - a[1]);
    const bestConcept = conceptList[0] || ["N/A", 0];

    // Concepto con menor gasto (mayor a 0)
    const worstConceptIdx = conceptList
      .slice()
      .reverse()
      .findIndex(([_, val]) => val > 0);
    let worstConcept: [string, number] = ["N/A", 0];
    if (worstConceptIdx !== -1) {
      worstConcept = conceptList[conceptList.length - 1 - worstConceptIdx];
    }

    // Mes con mayor / menor gasto
    const monthList = Object.entries(monthMap).sort((a, b) => b[1] - a[1]);
    const bestMonth = monthList[0] || ["N/A", 0];

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
      worstConcept,
      bestMonth,
      worstMonth,
    };
  }, [expenses]);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Tarjeta 1: Total Egresos */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600">Total Egresos</p>
        <p className="text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
      </div>

      {/* Tarjeta 2: Concepto Estrella */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600">Concepto Estrella</p>
        <p className="text-base font-semibold">{bestConcept[0]}</p>
        <p className="text-2xl font-semibold">{formatCurrency(bestConcept[1])}</p>
      </div>

      {/* Tarjeta 3: Mes con mayor gasto */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600">Mes con mayor gasto</p>
        <p className="text-base font-semibold">{bestMonth[0]}</p>
        <p className="text-2xl font-semibold">{formatCurrency(bestMonth[1])}</p>
      </div>

      {/* Tarjeta 4: Mes con menor gasto */}
      <div className="p-4 shadow-md rounded-md">
        <p className="text-sm text-gray-600">Mes con menor gasto</p>
        <p className="text-base font-semibold">{worstMonth[0]}</p>
        <p className="text-2xl font-semibold">{formatCurrency(worstMonth[1])}</p>
      </div>
    </div>
  );
};

export default ExpenseSummaryCards;
