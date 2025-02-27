// src/components/ExpensesSummary/ExpenseConceptGrowthSection.tsx

import React, { useMemo, useState } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import dayjs from "dayjs";


/**
 * Similar a GrowthSection: muestra la variación mes contra mes por concepto.
 * Realizamos un cálculo sencillo: comparamos el mes actual vs. anterior.
 */
const ExpenseConceptGrowthSection: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const [showAllConcepts, setShowAllConcepts] = useState(false);

  // Calculamos el mes actual (ej: "08") y anterior
  const now = dayjs();
  const currentMonthString = now.format("MM");     // "08"
  const previousMonthString = now.subtract(1, "month").format("MM"); // "07"

  // Agrupamos por concepto y por mes (ej. { "Limpieza": { "07": total, "08": total }, ... })
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

  // Convertir a array para mostrar
  const conceptGrowth = useMemo(() => {
    return Object.entries(conceptMap).map(([concept, monthlyObj]) => {
      const currentValue = monthlyObj[currentMonthString] || 0;
      const previousValue = monthlyObj[previousMonthString] || 0;
      const growthPct = previousValue === 0
        ? (currentValue > 0 ? 100 : 0)
        : ((currentValue - previousValue) / previousValue) * 100;

      return {
        concept,
        currentValue,
        previousValue,
        growthPct,
      };
    });
  }, [conceptMap, currentMonthString, previousMonthString]);

  // Ordenar desc por growthPct (más grande primero)
  const sortedByGrowth = [...conceptGrowth].sort((a, b) => b.growthPct - a.growthPct);

  // Muestra top 5 a menos que el usuario quiera “ver todo”
  const visibleConcepts = showAllConcepts ? sortedByGrowth : sortedByGrowth.slice(0, 5);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">
        Crecimiento de Gastos por Concepto{" "}
        <span className="text-xs font-medium text-gray-500">
          (Comparación Mes Actual vs. Mes Anterior)
        </span>
      </h3>
      <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap">
        {visibleConcepts.map((item) => (
          <div key={item.concept} className="flex items-center gap-4 p-4 shadow-md rounded-md w-full lg:w-[24%]" >
            <div className="flex-1">
              <p className="text-base font-bold">{item.concept}</p>
              <p className="text-sm text-gray-500">
                Mes Actual: {formatCurrency(item.currentValue)}, Mes Anterior:{" "}
                {formatCurrency(item.previousValue)}
              </p>
            </div>
            <div>
              {item.growthPct >= 0 ? (
                <span className="text-green-600 font-semibold">
                  +{item.growthPct.toFixed(2)}%
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  {item.growthPct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedByGrowth.length > 5 && (
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
