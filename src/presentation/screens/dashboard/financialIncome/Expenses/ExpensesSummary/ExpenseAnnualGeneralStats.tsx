// src/components/ExpensesSummary/ExpenseAnnualGeneralStats.tsx

import React, { useMemo } from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import ReactECharts from "echarts-for-react";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";

const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

// Definir un tipo para nuestros datos mensuales
type ChartDataItem = {
  month: string;
  [key: string]: string | number;
};

const ExpenseAnnualGeneralStats: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);
  const { isDarkMode } = useTheme();

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Obtener los 5 conceptos con mayor gasto total
  const topConcepts = useMemo(() => {
    const conceptMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      conceptMap[exp.concept] = (conceptMap[exp.concept] || 0) + exp.amount;
    });
    const sorted = Object.entries(conceptMap).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5).map(([concept]) => concept);
  }, [expenses]);

  // Preparar datos para la gráfica de área apilada:
  // Por cada mes, sumar el monto gastado de cada uno de los topConcepts.
  const chartData = useMemo(() => {
    // Inicializamos 12 meses (en formato "01" a "12") y agregamos los topConcepts a cada registro.
    const months: ChartDataItem[] = Array.from({ length: 12 }, (_, i) => {
      const mm = (i + 1).toString().padStart(2, "0");
      const record: ChartDataItem = { month: mm };

      // Inicializar todos los conceptos con valor 0
      topConcepts.forEach((concept) => {
        record[concept] = 0;
      });

      return record;
    });

    // Acumular gasto para cada concepto por mes
    expenses.forEach((exp) => {
      if (topConcepts.includes(exp.concept)) {
        const mm = exp.expenseDate.substring(5, 7);
        const monthRecord = months.find((r) => r.month === mm);
        if (monthRecord) {
          const currentValue = Number(monthRecord[exp.concept]) || 0;
          monthRecord[exp.concept] = currentValue + exp.amount;
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

    return months.map((record) => ({
      ...record,
      month: monthNames[record.month] || record.month,
    }));
  }, [expenses, topConcepts]);

  // Calcular el valor máximo para el eje Y para ajustar la escala
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach((monthData) => {
      let monthSum = 0;
      topConcepts.forEach((concept) => {
        const value = Number((monthData as any)[concept]) || 0;
        monthSum += value;
      });
      max = Math.max(max, monthSum);
    });
    return max;
  }, [chartData, topConcepts]);

  return (
    <div className="mb-8 w-full">
      {/* Gráfica de área apilada: Evolución mensual de los 5 conceptos que más gastan */}
      <h4 className="text-lg font-bold mt-8 mb-2">Evolución mensual</h4>
      <div style={{ width: "100%", height: 320 }}>
        <ReactECharts
          option={{
            backgroundColor: isDarkMode ? "#1f2937" : "transparent",
            color: chartColors,
            tooltip: {
              trigger: "axis",
              formatter: function (params: any) {
                if (!params || params.length === 0) return "";

                const month = params[0].name;
                let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px;">${month}</div>`;

                let total = 0;
                params.forEach((param: any) => {
                  const value = param.value || 0;
                  total += value;

                  if (typeof value === "number" && !isNaN(value) && value > 0) {
                    tooltipContent += `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin: 2px 0;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; background-color: ${
                          param.color
                        };"></span>
                        <span style="flex-grow: 1; margin-right: 12px;">${
                          param.seriesName
                        }</span>
                        <span>${formatCurrency(value)}</span>
                      </div>
                    `;
                  }
                });

                // Agregar la suma total
                tooltipContent += `
                  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${
                    isDarkMode ? "#555" : "#eee"
                  };">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                      <span>Total:</span>
                      <span>${formatCurrency(total)}</span>
                    </div>
                  </div>
                `;

                return tooltipContent;
              },
              backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
              borderColor: isDarkMode ? "#414141" : "#d9d9d9",
              textStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 12,
              },
            },
            grid: {
              left: "3%",
              right: "4%",
              bottom: "12%",
              top: "8%",
              containLabel: true,
            },
            xAxis: {
              type: "category",
              boundaryGap: false,
              data: chartData.map((item) => item.month),
              axisLabel: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 12,
              },
              axisLine: {
                lineStyle: {
                  color: isDarkMode ? "#ffffff" : "#d9d9d9",
                  opacity: isDarkMode ? 0.5 : 1,
                },
              },
            },
            yAxis: {
              type: "value",
              name: "Monto",
              nameLocation: "middle",
              nameGap: 65,
              max: maxValue * 1.1, // 10% extra para mejor visualización
              nameTextStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                padding: [0, 0, 8, 0],
              },
              axisLabel: {
                formatter: (value: number) => formatCurrency(value),
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 12,
              },
              axisLine: {
                lineStyle: {
                  color: isDarkMode ? "#ffffff" : "#d9d9d9",
                  opacity: isDarkMode ? 0.5 : 1,
                },
              },
              splitLine: {
                lineStyle: {
                  type: "dashed",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb",
                },
              },
            },
            series: topConcepts.map((concept, index) => ({
              name: concept,
              type: "line",
              stack: "Total",
              smooth: true,
              lineStyle: {
                width: 0,
              },
              showSymbol: false,
              areaStyle: {
                opacity: 0.8,
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: chartColors[index % chartColors.length],
                    },
                    {
                      offset: 1,
                      color: `${chartColors[index % chartColors.length]}60`, // Versión transparente del color
                    },
                  ],
                },
              },
              emphasis: {
                focus: "series",
              },
              data: chartData.map(
                (item) => Number((item as any)[concept]) || 0
              ),
            })),
            legend: {
              data: topConcepts,
              textStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 12,
              },
              icon: "roundRect",
              itemWidth: 14,
              itemHeight: 8,
              itemGap: 20,
              bottom: 0,
              color: chartColors,
            },
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
            renderer: "svg",
            devicePixelRatio: window.devicePixelRatio || 2,
          }}
        />
      </div>
    </div>
  );
};

export default ExpenseAnnualGeneralStats;
