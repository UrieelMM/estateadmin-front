// src/components/Summary/AnnualGeneralStats.tsx
import React, { useMemo } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import ReactECharts from "echarts-for-react";

// Función para ajustar la opacidad de un color
const adjustColor = (colorHex: string, opacity: number): string => {
  // Si el color es un hexadecimal, convertirlo a RGB
  let r, g, b;
  if (colorHex.startsWith("#")) {
    const hex = colorHex.substring(1);
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    // Si ya es otro formato, devolver con la opacidad
    return colorHex.replace(/[^,]+(?=\))/, String(opacity));
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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

const AnnualGeneralStats: React.FC = () => {
  const { isDarkMode } = useTheme();
  const conceptRecords = usePaymentSummaryStore(
    (state) => state.conceptRecords
  );

  const formatCurrency = (value: number): string => {
    return (
      "$" +
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const formatLargeValues = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`;
    } else {
      return `$${value}`;
    }
  };

  // Forzar 'val' a string
  const formatMonthLabel = (m: string | number): string =>
    MONTH_NAMES[String(m)] || String(m);
  const getMonthName = (m: string | number): string =>
    MONTH_NAMES[String(m)] || "N/A";

  const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

  const {
    conceptTotals,
    bestConcept,
    worstConcept,
    bestMonth,
    worstMonth,
    hasData,
  } = useMemo(() => {
    if (!conceptRecords || Object.keys(conceptRecords).length < 1) {
      return {
        conceptTotals: {},
        bestConcept: ["N/A", 0] as [string, number],
        worstConcept: ["N/A", 0] as [string, number],
        bestMonth: ["N/A", 0] as [string, number],
        worstMonth: ["N/A", 0] as [string, number],
        hasData: false,
      };
    }

    const conceptTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {
      "01": 0,
      "02": 0,
      "03": 0,
      "04": 0,
      "05": 0,
      "06": 0,
      "07": 0,
      "08": 0,
      "09": 0,
      "10": 0,
      "11": 0,
      "12": 0,
    };

    Object.entries(conceptRecords).forEach(([concept, records]) => {
      let sumConcept = 0;
      records.forEach((rec) => {
        // Monto abonado = pagos + crédito usado + saldo disponible
        const amountPaidWithCredit =
          rec.amountPaid +
          (rec.creditBalance > 0 ? rec.creditBalance : 0) -
          (rec.creditUsed || 0);
        sumConcept += amountPaidWithCredit;
        if (monthlyTotals[rec.month] !== undefined) {
          monthlyTotals[rec.month] += amountPaidWithCredit;
        }
      });
      conceptTotals[concept] = sumConcept;
    });

    // Lista completa de conceptos (incluye Pago no identificado)
    const conceptList = Object.entries(conceptTotals).sort(
      (a, b) => b[1] - a[1]
    );

    // --- FILTRO SOLO PARA LAS CARDS DE MEJOR/PEOR CONCEPTO ---
    const conceptListForCards = conceptList.filter(
      ([c]) => c !== "Pago no identificado"
    );

    // Mejor concepto
    const bestConcept: [string, number] = conceptListForCards[0] || ["N/A", 0];

    // Peor concepto
    const worstConceptIdx = conceptListForCards
      .slice()
      .reverse()
      .findIndex(([_, total]) => total > 0);
    let worstConcept: [string, number] = ["N/A", 0];
    if (worstConceptIdx !== -1) {
      const realIdx = conceptListForCards.length - 1 - worstConceptIdx;
      worstConcept = conceptListForCards[realIdx];
    }

    // Mejor/peor mes
    const monthList = Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1]);
    const bestMonth: [string, number] = monthList[0] || ["N/A", 0];

    const worstMonthIdx = monthList
      .slice()
      .reverse()
      .findIndex(([_, val]) => val > 0);
    let worstMonth: [string, number] = ["N/A", 0];
    if (worstMonthIdx !== -1) {
      const realIdx = monthList.length - 1 - worstMonthIdx;
      worstMonth = monthList[realIdx];
    }

    return {
      conceptTotals,
      bestConcept,
      worstConcept,
      bestMonth,
      worstMonth,
      hasData: true,
    };
  }, [conceptRecords]);

  // Gráfica pastel
  const pieData = useMemo(() => {
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topFive = sorted.slice(0, 5);
    const sumOthers = sorted.slice(5).reduce((acc, [, val]) => acc + val, 0);
    const pieArr = topFive.map(([concept, val]) => ({
      name: concept,
      value: val,
    }));
    if (sumOthers > 0) {
      pieArr.push({ name: "Otros", value: sumOthers });
    }
    return pieArr;
  }, [conceptTotals]);

  // Gráfica de áreas apiladas
  const areaStackData = useMemo(() => {
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topConcepts = sorted.slice(0, 5).map(([c]) => c);
    const otherConcepts = sorted.slice(5).map(([c]) => c);
    const months = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];
    const data = months.map((m) => {
      const row: any = { month: m };
      topConcepts.forEach((concept) => {
        const recs = conceptRecords[concept] || [];
        const sumThisMonth = recs
          .filter((r) => r.month === m)
          .reduce((acc, r) => {
            // Monto abonado = pagos + crédito usado + saldo disponible
            const amountPaidWithCredit =
              r.amountPaid +
              (r.creditBalance > 0 ? r.creditBalance : 0) -
              (r.creditUsed || 0);
            return acc + amountPaidWithCredit;
          }, 0);
        row[concept] = sumThisMonth;
      });
      if (otherConcepts.length > 0) {
        let sumOthers = 0;
        otherConcepts.forEach((concept) => {
          const recs = conceptRecords[concept] || [];
          const sumThisMonth = recs
            .filter((r) => r.month === m)
            .reduce((acc, r) => {
              // Monto abonado = pagos + crédito usado + saldo disponible
              const amountPaidWithCredit =
                r.amountPaid +
                (r.creditBalance > 0 ? r.creditBalance : 0) -
                (r.creditUsed || 0);
              return acc + amountPaidWithCredit;
            }, 0);
          sumOthers += sumThisMonth;
        });
        row["Otros"] = sumOthers;
      }
      return row;
    });
    const areaKeys = [...topConcepts];
    if (otherConcepts.length > 0) {
      areaKeys.push("Otros");
    }
    return { data, areaKeys };
  }, [conceptTotals, conceptRecords]);

  // Datos para las tendencias de las cards
  const cardTrends = useMemo(() => {
    if (!conceptRecords || Object.keys(conceptRecords).length < 1) {
      return {
        bestConceptTrend: [],
        worstConceptTrend: [],
        bestMonthTrend: [],
        worstMonthTrend: [],
      };
    }

    // Función auxiliar para calcular la tendencia de un concepto
    const getConceptTrend = (concept: string) => {
      const months = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];
      return months.map((month) => {
        const records = conceptRecords[concept] || [];
        const sumThisMonth = records
          .filter((r) => r.month === month)
          .reduce((acc, r) => {
            const amountPaidWithCredit =
              r.amountPaid +
              (r.creditBalance > 0 ? r.creditBalance : 0) -
              (r.creditUsed || 0);
            return acc + amountPaidWithCredit;
          }, 0);
        return { month, value: sumThisMonth };
      });
    };

    // Función auxiliar para calcular la tendencia de un mes
    const getMonthTrend = (month: string) => {
      return Object.entries(conceptRecords).map(([concept, records]) => {
        const sumThisMonth = records
          .filter((r) => r.month === month)
          .reduce((acc, r) => {
            const amountPaidWithCredit =
              r.amountPaid +
              (r.creditBalance > 0 ? r.creditBalance : 0) -
              (r.creditUsed || 0);
            return acc + amountPaidWithCredit;
          }, 0);
        return { concept, value: sumThisMonth };
      });
    };

    return {
      bestConceptTrend: getConceptTrend(bestConcept[0]),
      worstConceptTrend: getConceptTrend(worstConcept[0]),
      bestMonthTrend: getMonthTrend(bestMonth[0]),
      worstMonthTrend: getMonthTrend(worstMonth[0]),
    };
  }, [conceptRecords, bestConcept, worstConcept, bestMonth, worstMonth]);

  if (!hasData) return null;

  return (
    <div className="mb-8 w-full mt-12">
      {/* Contenedor superior: Cards + Gráfica de pastel */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
        {/* Gráfica de barras horizontales - 40% del espacio */}
        <div className="lg:col-span-3 shadow-md rounded-md p-2">
          <h3 className="text-lg font-bold mb-2 text-center">
            Distribución de recaudación anual por concepto
          </h3>
          <div style={{ width: "100%", height: 400 }}>
            <ReactECharts
              option={{
                backgroundColor: isDarkMode ? "#1f2937" : "transparent",
                tooltip: {
                  trigger: "item",
                  formatter: function (params: any) {
                    if (!params || !params.data) return "";
                    return `${params.data.name}: ${formatCurrency(
                      Number(params.data.value)
                    )}`;
                  },
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderColor: isDarkMode ? "#414141" : "#d9d9d9",
                  textStyle: {
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 14,
                  },
                },
                grid: {
                  left: "10%",
                  right: "5%",
                  bottom: "12%",
                  top: "5%",
                  containLabel: true,
                },
                xAxis: {
                  type: "category",
                  data: pieData.map((item) => item.name),
                  axisLabel: {
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 13,
                    rotate: 45,
                    interval: 0,
                    margin: 14,
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
                  axisLabel: {
                    formatter: (value: number) => formatCurrency(value),
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 13,
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
                      color: isDarkMode
                        ? "rgba(255, 255, 255, 0.15)"
                        : "#e5e7eb",
                    },
                  },
                },
                series: [
                  {
                    type: "bar",
                    data: pieData.map((item) => ({
                      name: item.name,
                      value: item.value,
                      itemStyle: {
                        color:
                          chartColors[
                            pieData.findIndex((d) => d.name === item.name) %
                              chartColors.length
                          ],
                      },
                    })),
                    itemStyle: {
                      borderRadius: [4, 4, 0, 0],
                    },
                    label: {
                      show: true,
                      position: "top",
                      formatter: function (params: any) {
                        if (!params || !params.data) return "";
                        return formatLargeValues(Number(params.data.value));
                      },
                      color: isDarkMode ? "#ffffff" : "#1f2937",
                      fontSize: 13,
                      distance: 5,
                      textBorderColor: isDarkMode ? "#1f2937" : "transparent",
                      textBorderWidth: isDarkMode ? 3 : 0,
                      textShadowBlur: isDarkMode ? 5 : 0,
                      textShadowColor: isDarkMode ? "#000000" : "transparent",
                      backgroundColor: isDarkMode
                        ? "rgba(0, 0, 0, 0.3)"
                        : "transparent",
                      padding: isDarkMode ? 2 : 0,
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)",
                      },
                    },
                    barWidth: "60%",
                    barGap: "10%",
                    barCategoryGap: "20%",
                  },
                ],
                animation: true,
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
        {/* Cards - 60% del espacio */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 shadow-md rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Concepto con más ingresos{" "}
            </p>
            <p className="text-base font-semibold text-indigo-500">
              {bestConcept[0]}
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(Number(bestConcept[1]))}
            </p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cardTrends.bestConceptTrend}>
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
          <div className="p-4 shadow-md rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Concepto rezagado{" "}
            </p>
            <p className="text-base font-semibold text-indigo-500">
              {worstConcept[0]}
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(Number(worstConcept[1]))}
            </p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cardTrends.worstConceptTrend}>
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
          <div className="p-4 shadow-md rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Mes con mayor recaudación
            </p>
            <p className="text-base font-semibold text-indigo-500">
              {getMonthName(bestMonth[0])}
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(Number(bestMonth[1]))}
            </p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cardTrends.bestMonthTrend}>
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
          <div className="p-4 shadow-md rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Mes con menor recaudación
            </p>
            <p className="text-base font-semibold text-indigo-500">
              {getMonthName(worstMonth[0])}
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(Number(worstMonth[1]))}
            </p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cardTrends.worstMonthTrend}>
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
      </div>

      {/* Gráfica de áreas apiladas */}
      <h3 className="text-lg font-bold mb-3">
        Evolución mensual{" "}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-100">
          (5 principales conceptos + otros)
        </span>
      </h3>
      <div
        style={{ width: "100%", height: 400 }}
        className="shadow-md rounded-md p-2"
      >
        <ReactECharts
          option={{
            backgroundColor: isDarkMode ? "#1f2937" : "transparent",
            // No usamos el array color global para evitar que ECharts asigne colores automáticamente
            tooltip: {
              trigger: "axis",
              formatter: function (params: any) {
                if (!params || params.length === 0) return "";

                const month = params[0].name;
                let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px;">${formatMonthLabel(
                  month
                )}</div>`;

                let total = 0;
                params.forEach((param: any) => {
                  const value = param.value || 0;
                  total += value;

                  if (typeof value === "number" && !isNaN(value) && value > 0) {
                    // Obtener el índice correcto del concepto para usar el color adecuado
                    const conceptIndex = areaStackData.areaKeys.findIndex(
                      (key) => key === param.seriesName
                    );
                    const conceptColor =
                      chartColors[conceptIndex % chartColors.length];

                    tooltipContent += `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin: 2px 0;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; background-color: ${conceptColor};"></span>
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
              padding: [8, 12],
            },
            grid: {
              left: "3%",
              right: "4%",
              bottom: "8%",
              top: "15%",
              containLabel: true,
            },
            legend: {
              data: areaStackData.areaKeys.map((concept, idx) => ({
                name: concept,
                itemStyle: {
                  color: chartColors[idx % chartColors.length],
                },
              })),
              textStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
              },
              top: 0,
              icon: "roundRect",
            },
            xAxis: [
              {
                type: "category",
                boundaryGap: false,
                data: areaStackData.data.map((item) => item.month),
                axisLabel: {
                  formatter: (value: string) => formatMonthLabel(value),
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  fontSize: 13,
                  interval: 0,
                  rotate: 30,
                },
                axisLine: {
                  lineStyle: {
                    color: isDarkMode ? "#ffffff" : "#d9d9d9",
                    opacity: isDarkMode ? 0.5 : 1,
                  },
                },
                axisTick: {
                  alignWithLabel: true,
                },
              },
            ],
            yAxis: [
              {
                type: "value",
                name: "Ingresos",
                nameTextStyle: {
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  padding: [0, 0, 8, 0],
                },
                axisLabel: {
                  formatter: (value: number) => formatLargeValues(value),
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  fontSize: 13,
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
                scale: true,
                min: 0,
                minInterval: 1000,
                splitNumber: 5,
              },
            ],
            series: areaStackData.areaKeys.map((concept, idx) => ({
              name: concept,
              type: "line",
              stack: "Total",
              smooth: true,
              lineStyle: {
                width: 0, // Quitar el borde estableciendo el ancho a 0
              },
              itemStyle: {},
              showSymbol: false,
              symbolSize: 4,
              symbol: "circle",
              showAllSymbol: false,
              areaStyle: {
                opacity: 0.85, // Aumentar la opacidad para un difuminado más suave
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: chartColors[idx % chartColors.length],
                    },
                    {
                      offset: 0.7,
                      color: isDarkMode
                        ? adjustColor(
                            chartColors[idx % chartColors.length],
                            0.35 // Aumentar ligeramente el difuminado en modo oscuro
                          )
                        : adjustColor(
                            chartColors[idx % chartColors.length],
                            0.45 // Aumentar ligeramente el difuminado en modo claro
                          ),
                    },
                  ],
                  global: false,
                },
                shadowColor: "rgba(0, 0, 0, 0.25)", // Aumentar ligeramente la intensidad de la sombra
                shadowBlur: 6, // Aumentar ligeramente el desenfoque de la sombra
              },
              emphasis: {
                focus: "series",
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: "rgba(0, 0, 0, 0.3)",
                },
              },
              data: areaStackData.data.map((item) => item[concept] || 0),
            })),
            animation: true,
            textStyle: {
              color: isDarkMode ? "#ffffff" : "#1f2937",
            },
            hoverLayerThreshold: 3000,
            progressive: 500,
            progressiveThreshold: 3000,
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

export default AnnualGeneralStats;
