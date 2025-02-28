// src/components/ExpensesSummary/ExpenseConceptGrowthSection.tsx

import React, { useMemo, useState } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import dayjs from "dayjs";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

/**
 * Similar a GrowthSection: muestra la variación mes contra mes por concepto.
 * Compara el mes actual vs. el mes anterior.
 */
const ExpenseConceptGrowthSection: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const [showAllConcepts, setShowAllConcepts] = useState(false);

  // Calculamos el mes actual y el mes anterior utilizando dayjs
  const now = dayjs();
  const currentMonthString = now.format("MM");
  const previousMonthString = now.subtract(1, "month").format("MM");

  // Agrupamos por concepto y por mes
  const conceptMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    expenses.forEach((exp) => {
      const mm = exp.expenseDate.substring(5, 7);
      if (!map[exp.concept]) {
        map[exp.concept] = {};
      }
      map[exp.concept][mm] = (map[exp.concept][mm] || 0) + exp.amount;
    });
    return map;
  }, [expenses]);

  // Convertir a array para mostrar el crecimiento
  const conceptGrowth = useMemo(() => {
    return Object.entries(conceptMap).map(([concept, monthlyObj]) => {
      const currentValue = monthlyObj[currentMonthString] || 0;
      const previousValue = monthlyObj[previousMonthString] || 0;
      const growthPct =
        previousValue === 0 ? (currentValue > 0 ? 100 : 0) : ((currentValue - previousValue) / previousValue) * 100;
      return {
        concept,
        currentValue,
        previousValue,
        growthPct,
      };
    });
  }, [conceptMap, currentMonthString, previousMonthString]);

  // Ordenar descendentemente por crecimiento y mostrar máximo 4 conceptos (si no se activa "mostrar más")
  const sortedByGrowth = [...conceptGrowth].sort((a, b) => b.growthPct - a.growthPct);
  const visibleConcepts = showAllConcepts ? sortedByGrowth : sortedByGrowth.slice(0, 4);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">
        Crecimiento de gastos por concepto{" "}
        <span className="text-xs font-medium text-gray-500">(Respecto al mes anterior)</span>
      </h3>
      <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap">
        {visibleConcepts.map((item) => (
          <div
            key={item.concept}
            className="flex items-center gap-4 p-4 shadow-md rounded-md w-full lg:w-[24%]"
          >
            <div className="flex-1">
              <p className="text-sm lg:text-base">{item.concept}</p>
              <p className="text-sm text-gray-500">
                <span className="text-md lg:text-md font-semibold text-indigo-600">
                  {formatCurrency(item.currentValue)}
                </span>{" "}
                - {formatCurrency(item.previousValue)}
              </p>
            </div>
            <div className="flex items-center">
              {item.growthPct >= 0 ? (
                <div className="flex items-center text-green-800 bg-green-100 rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                  <ArrowUpIcon className="h-5 w-5" />
                  <span className="ml-1">+{item.growthPct.toFixed(2)}%</span>
                </div>
              ) : (
                <div className="flex items-center text-red-800 bg-red-100 rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                  <ArrowDownIcon className="h-5 w-5" />
                  <span className="ml-1">{item.growthPct.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedByGrowth.length > 4 && (
        <div className="mt-4 flex justify-center">
          <button
            className="px-4 py-2 border-b border-indigo-500 text-indigo-500 bg-transparent hover:border-indigo-700 hover:text-indigo-700"
            onClick={() => setShowAllConcepts(!showAllConcepts)}
          >
            {showAllConcepts ? "Mostrar menos" : "Mostrar más"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseConceptGrowthSection;
