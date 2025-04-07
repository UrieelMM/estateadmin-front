// src/components/ExpensesSummary/ExpenseConceptAnalyticsAdvanced.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import ReactECharts from "echarts-for-react";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";

const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

// Formateo de porcentaje, ej: "23.45%"
// const formatPercentage = (value: number): string => `${value.toFixed(2)}%`;

const ExpenseConceptAnalyticsAdvanced: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const totalSpent = useExpenseSummaryStore((state) => state.totalSpent);
  const { isDarkMode } = useTheme();

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

  // Para la gráfica, tomar los 5 conceptos con mayor gasto
  const pieData = useMemo(() => {
    const sorted = [...aggregatedData].sort((a, b) => b.total - a.total);
    return sorted.slice(0, 5);
  }, [aggregatedData]);

  // Para la tabla, tomar los 10 conceptos con mayor cantidad de transacciones
  const tableData = useMemo(() => {
    const sorted = [...aggregatedData].sort((a, b) => b.count - a.count);
    return sorted.slice(0, 10);
  }, [aggregatedData]);

  // Formateador para moneda
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

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
        {/* Columna 1: Gráfica de Nightingale Chart (65%) */}
        <div className="md:col-span-7">
          <h4 className="text-lg font-semibold mb-2">
            Distribución (%) de los 5 principales
          </h4>
          <div style={{ width: "100%", height: 340 }}>
            <ReactECharts
              option={{
                backgroundColor: isDarkMode ? "#1f2937" : "transparent",
                tooltip: {
                  trigger: "item",
                  formatter: function (params: any) {
                    if (!params || !params.data) return "";

                    const { concept, total, percentage } = params.data;

                    // Verificar que los valores sean números válidos
                    const formattedTotal =
                      typeof total === "number" && !isNaN(total)
                        ? formatCurrency(total)
                        : "$0.00";

                    const formattedPercentage =
                      typeof percentage === "number" && !isNaN(percentage)
                        ? `${percentage.toFixed(1)}%`
                        : "0.0%";

                    return `
                      <div>
                        <div style="font-weight: bold; margin-bottom: 4px;">${
                          concept || "Sin concepto"
                        }</div>
                        <div>Monto: ${formattedTotal}</div>
                        <div>Porcentaje: ${formattedPercentage}</div>
                      </div>
                    `;
                  },
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderColor: isDarkMode ? "#414141" : "#d9d9d9",
                  textStyle: {
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 12,
                  },
                },
                legend: {
                  type: "scroll",
                  orient: "horizontal",
                  bottom: 0,
                  data: pieData.map((item) => {
                    const shortenedName =
                      item.concept.length > 26
                        ? `${item.concept.substring(0, 18)}...`
                        : item.concept;
                    return shortenedName;
                  }),
                  textStyle: {
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 12,
                  },
                  formatter: function (name: string) {
                    return name.length > 26
                      ? `${name.substring(0, 18)}...`
                      : name;
                  },
                  icon: "circle",
                  itemWidth: 10,
                  itemHeight: 10,
                  itemGap: 15,
                },
                color: chartColors,
                series: [
                  {
                    name: "Gastos por concepto",
                    type: "pie",
                    radius: ["10%", "70%"],
                    center: ["50%", "45%"],
                    roseType: "area",
                    itemStyle: {
                      borderRadius: 4,
                      borderColor: isDarkMode ? "#1f2937" : "#ffffff",
                      borderWidth: 2,
                      shadowBlur: 10,
                      shadowColor: "rgba(0, 0, 0, 0.2)",
                    },
                    label: {
                      show: true,
                      position: "outside",
                      formatter: function (params: any) {
                        const shortenedName =
                          params.data.concept.length > 15
                            ? `${params.data.concept.substring(0, 12)}...`
                            : params.data.concept;
                        return `${shortenedName}: ${params.data.percentage.toFixed(
                          1
                        )}%`;
                      },
                      color: isDarkMode ? "#ffffff" : "#1f2937",
                      fontSize: 12,
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 20,
                        shadowColor: "rgba(0, 0, 0, 0.5)",
                      },
                      label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: "bold",
                      },
                      scale: true,
                    },
                    data: pieData.map((item, index) => ({
                      value: item.total || 0,
                      concept: item.concept || "Sin concepto",
                      total: item.total || 0,
                      percentage: item.percentage || 0,
                      itemStyle: {
                        color: chartColors[index % chartColors.length],
                      },
                    })),
                  },
                ],
                animation: true,
                animationDuration: 1000,
                animationEasing: "cubicOut",
                hoverLayerThreshold: 3000,
                progressive: 500,
                progressiveThreshold: 3000,
                textStyle: {
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                },
              }}
              style={{ height: "100%", width: "100%" }}
              opts={{
                renderer: "canvas",
                devicePixelRatio: window.devicePixelRatio || 2,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseConceptAnalyticsAdvanced;
