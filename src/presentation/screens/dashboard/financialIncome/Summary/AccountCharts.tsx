// src/components/paymentSummary/AccountCharts.tsx
import React, { useMemo } from "react";
import {
  PaymentRecord,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import ReactECharts from "echarts-for-react";

// Diccionario para mostrar nombres de mes
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

const AccountCharts: React.FC<{ payments: PaymentRecord[] }> = ({
  payments,
}) => {
  const { financialAccountsMap, monthlyStats } = usePaymentSummaryStore();
  const { isDarkMode } = useTheme();

  // Obtenemos la información de la cuenta correspondiente.
  const accountId = payments.length > 0 ? payments[0].financialAccountId : "";
  const accountInfo =
    accountId && financialAccountsMap[accountId]
      ? financialAccountsMap[accountId]
      : null;
  const initialBalance = accountInfo ? accountInfo.initialBalance : 0;
  const creationMonth = accountInfo ? accountInfo.creationMonth : "01";

  // Calculamos el saldo a favor de la misma manera que en SummaryCards
  const accountMonthlyStats = monthlyStats.filter((stat) =>
    payments.some((p) => p.month === stat.month)
  );

  /**
   * Formateador de moneda
   */
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /**
   * Formateador para valores grandes (opcional, para eje Y)
   */
  const formatLargeValues = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`;
    } else {
      return `$${value}`;
    }
  };

  /**
   * 1. Agrupar por concepto: sumamos amountPaid de cada pago,
   * y luego agregamos "Saldo inicial" y "Saldo a favor" con sus valores.
   */
  const conceptTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    // Sumar pagos regulares y crédito usado
    payments.forEach((p) => {
      const concept = p.concept || "Desconocido";
      totals[concept] =
        (totals[concept] || 0) + p.amountPaid + (p.creditUsed || 0);
    });

    // Agregar Saldo inicial como categoría
    totals["Saldo inicial"] = initialBalance;

    // Agregar Saldo a favor disponible como categoría
    const totalSaldo = accountMonthlyStats.reduce(
      (acc, stat) => acc + stat.saldo,
      0
    );
    if (totalSaldo > 0) {
      totals["Saldo a favor"] = totalSaldo;
    }

    return totals;
  }, [payments, initialBalance, accountMonthlyStats]);

  /**
   * 2. Datos para el gráfico de pastel.
   * Se ordena por valor descendente, se toman los 5 primeros y se suma "Otros".
   */
  const pieData = useMemo(() => {
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topFive = sorted.slice(0, 5);
    const sumOthers = sorted.slice(5).reduce((acc, [, val]) => acc + val, 0);
    const data = topFive.map(([concept, val]) => ({
      name: concept,
      value: val,
    }));
    if (sumOthers > 0) {
      data.push({ name: "Otros", value: sumOthers });
    }
    return data;
  }, [conceptTotals]);

  /**
   * 3. Datos para la gráfica de áreas apiladas (evolución mensual).
   * Para la serie "Saldo inicial", se asigna el valor únicamente en el mes
   * correspondiente al mes de creación de la cuenta (creationMonth).
   */
  const areaStackData = useMemo(() => {
    // Excluir "Saldo inicial" para ordenar los conceptos según los pagos
    const sortedEntries = Object.entries(conceptTotals).filter(
      ([concept]) => concept !== "Saldo inicial"
    );
    sortedEntries.sort((a, b) => b[1] - a[1]);
    const topConcepts = sortedEntries.slice(0, 5).map(([c]) => c);
    const otherConcepts = sortedEntries.slice(5).map(([c]) => c);

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
      const row: Record<string, number | string> = { month: m };

      // Sumar para cada concepto top
      topConcepts.forEach((concept) => {
        const sumThisMonth = payments
          .filter((p) => p.concept === concept && p.month === m)
          .reduce((acc, p) => acc + p.amountPaid, 0);
        row[concept] = sumThisMonth;
      });

      // Sumar "Otros" si aplica
      if (otherConcepts.length > 0) {
        let sumOthers = 0;
        otherConcepts.forEach((concept) => {
          const sumThisMonth = payments
            .filter((p) => p.concept === concept && p.month === m)
            .reduce((acc, p) => acc + p.amountPaid, 0);
          sumOthers += sumThisMonth;
        });
        row["Otros"] = sumOthers;
      }

      // Agregar "Saldo inicial": solo en el mes correspondiente al creationMonth se asigna el valor, en los demás es 0.
      row["Saldo inicial"] = m === creationMonth ? initialBalance : 0;
      return row;
    });

    // Claves para las áreas (los conceptos top, "Otros" y "Saldo inicial")
    const areaKeys = [...topConcepts];
    if (otherConcepts.length > 0) {
      areaKeys.push("Otros");
    }
    areaKeys.push("Saldo inicial");

    return { data, areaKeys };
  }, [conceptTotals, payments, initialBalance, creationMonth]);

  /**
   * Paleta de colores para las áreas/pastel.
   */
  const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

  /**
   * Formateador para el eje X (mes)
   */
  const formatMonthLabel = (m: string) => MONTH_NAMES[m] || m;

  return (
    <div className="space-y-8 mt-4">
      {/* Gráfico Nightingale */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-lg font-bold mb-2 text-indigo-600 dark:text-indigo-400">
          Distribución por Concepto
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ReactECharts
            option={{
              backgroundColor: isDarkMode ? "#1f2937" : "transparent",
              tooltip: {
                trigger: "item",
                formatter: (params: any) => {
                  return `${params.name}: ${formatCurrency(params.value)}`;
                },
                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                borderColor: isDarkMode ? "#414141" : "#d9d9d9",
                textStyle: {
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                  fontSize: 14,
                },
              },
              legend: {
                top: "bottom",
                bottom: 10,
                data: pieData.map((item) => item.name),
                textStyle: {
                  color: isDarkMode ? "#ffffff" : "#1f2937",
                },
                icon: "roundRect",
              },
              series: [
                {
                  name: "Distribución por Concepto",
                  type: "pie",
                  radius: ["30%", "80%"],
                  center: ["50%", "40%"],
                  roseType: "area",
                  itemStyle: {
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    shadowBlur: 5,
                    shadowColor: "rgba(0, 0, 0, 0.2)",
                  },
                  label: {
                    show: true,
                    formatter: (params: any) => {
                      return params.name;
                    },
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    fontSize: 13,
                    distance: 5,
                    textBorderColor: isDarkMode ? "#1f2937" : "transparent",
                    textBorderWidth: isDarkMode ? 2 : 0,
                    textShadowBlur: isDarkMode ? 4 : 0,
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
                  data: pieData.map((item, index) => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: {
                      color: chartColors[index % chartColors.length],
                    },
                  })),
                },
              ],
              animation: true,
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

      {/* Gráfico de áreas apiladas con gradiente */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-lg font-bold mb-2 text-indigo-600 dark:text-indigo-400">
          Evolución Mensual
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
          (Incluye los 5 principales conceptos, Otros y Saldo inicial)
        </p>
        <div style={{ width: "100%", height: 350 }}>
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

                    if (
                      typeof value === "number" &&
                      !isNaN(value) &&
                      value > 0
                    ) {
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
                top: "20%",
                containLabel: true,
              },
              legend: {
                data: areaStackData.areaKeys.map(
                  (key: string, idx: number) => ({
                    name: key,
                    itemStyle: {
                      color: chartColors[idx % chartColors.length],
                    },
                  })
                ),
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
                  name: "Monto",
                  nameLocation: "middle",
                  nameGap: 55, // Aumentado de 40 a 55 para separar más la etiqueta hacia la izquierda
                  nameTextStyle: {
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    padding: [0, 0, 8, 0],
                    align: "center",
                    verticalAlign: "middle",
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
                      color: isDarkMode
                        ? "rgba(255, 255, 255, 0.15)"
                        : "#e5e7eb",
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
    </div>
  );
};

export default AccountCharts;
