// src/components/Summary/ConceptGrowthSection.tsx
import React, { useState, useMemo } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import ReactECharts from "echarts-for-react";

const ConceptGrowthSection: React.FC = React.memo(() => {
  const conceptRecords = usePaymentSummaryStore(
    (state) => state.conceptRecords
  );
  const selectedYear = usePaymentSummaryStore((state) => state.selectedYear);
  const { isDarkMode } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const currentMonthNumber = new Date().getMonth() + 1;
  const currentMonthString = currentMonthNumber.toString().padStart(2, "0");

  // Mejorar la lógica para obtener el mes anterior
  const previousMonthString =
    currentMonthNumber > 1
      ? (currentMonthNumber - 1).toString().padStart(2, "0")
      : "12"; // Si es enero, comparamos con diciembre

  const formatCurrency = (value: number): string => {
    return (
      "$" +
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const pastelColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

  const { totalCurrent, dataArr, growthArr, hasData } = useMemo(() => {
    if (!conceptRecords || Object.keys(conceptRecords).length < 1) {
      return {
        totalCurrent: 0,
        dataArr: [],
        growthArr: [],
        hasData: false,
      };
    }

    let totalCurrent = 0;
    const dataArr: { concept: string; currentValue: number }[] = [];
    const growthArr: {
      concept: string;
      growth: number;
      currentValue: number;
      previousValue: number;
    }[] = [];

    Object.entries(conceptRecords).forEach(([concept, records]) => {
      // Filtrar registros por año - los datos ya deberían estar filtrados por el store,
      // pero es buena práctica asegurarse
      const currentYearRecords = records;

      // Calculamos el valor del mes actual
      const currentValue = currentYearRecords
        .filter((record) => record.month === currentMonthString)
        .reduce(
          (sum, record) =>
            sum +
            record.amountPaid +
            (record.creditBalance > 0 ? record.creditBalance : 0) -
            (record.creditUsed || 0),
          0
        );

      // Calculamos el valor del mes anterior
      // Nota: Si estamos en enero y comparamos con diciembre, los datos de diciembre
      // podrían ser del año anterior y no estar disponibles en conceptRecords del año actual
      const previousValue = currentYearRecords
        .filter((record) => record.month === previousMonthString)
        .reduce(
          (sum, record) =>
            sum +
            record.amountPaid +
            (record.creditBalance > 0 ? record.creditBalance : 0) -
            (record.creditUsed || 0),
          0
        );

      totalCurrent += currentValue;

      // Mejorar el cálculo de crecimiento
      let growth = 0;
      if (previousValue > 0) {
        // Cálculo normal de crecimiento porcentual
        growth = ((currentValue - previousValue) / previousValue) * 100;
      } else if (currentValue > 0 && previousValue === 0) {
        // Si no había valor anterior pero ahora sí hay, podría ser:
        // 1. Un concepto nuevo, o
        // 2. No hay datos del mes anterior (ej: comparando enero con dic del año anterior)
        // En ambos casos, mostramos como "Nuevo" en lugar de un porcentaje
        growth = currentMonthNumber === 1 ? 0 : 100; // Si es enero, no asumimos crecimiento
      } else if (currentValue === 0 && previousValue > 0) {
        // Si había valor anterior pero ahora no hay, es decrecimiento del -100%
        growth = -100;
      }
      // Si ambos valores son 0, el crecimiento es 0%

      dataArr.push({ concept, currentValue });
      growthArr.push({ concept, growth, currentValue, previousValue });
    });

    return { totalCurrent, dataArr, growthArr, hasData: true };
  }, [
    conceptRecords,
    currentMonthString,
    previousMonthString,
    selectedYear,
    currentMonthNumber,
  ]);

  const pieData = useMemo(() => {
    const sorted = [...dataArr].sort((a, b) => b.currentValue - a.currentValue);
    const topFive = sorted.slice(0, 5);
    const others = sorted
      .slice(5)
      .reduce((sum, item) => sum + item.currentValue, 0);
    if (others > 0) {
      topFive.push({ concept: "Otros", currentValue: others });
    }
    return topFive.map((item) => ({
      name: item.concept,
      value: item.currentValue,
    }));
  }, [dataArr]);

  const topGrowth = useMemo(() => {
    const sorted = [...growthArr].sort((a, b) => b.growth - a.growth);
    return sorted.slice(0, 5);
  }, [growthArr]);

  const bottomGrowth = useMemo(() => {
    const sorted = [...growthArr].sort((a, b) => a.growth - b.growth);
    return sorted.slice(0, 5);
  }, [growthArr]);

  if (!hasData) return null;

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">
        Recaudación por concepto - (Mes Actual)
        {currentMonthNumber === 1 && (
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
            (Comparación vs Diciembre del año anterior)
          </span>
        )}
      </h3>

      {/* Bloque de estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Monto Abonado promedio por concepto
          </p>
          <p className="text-xl font-semibold">
            {formatCurrency(totalCurrent / (dataArr.length || 1))}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Concepto con mayor recaudación
          </p>
          <p className="text-lg font-semibold">
            {dataArr.sort((a, b) => b.currentValue - a.currentValue)[0]
              ?.concept || "N/A"}{" "}
            <span className="text-sm text-gray-600 dark:text-gray-100">
              (
              {formatCurrency(
                dataArr.sort((a, b) => b.currentValue - a.currentValue)[0]
                  ?.currentValue || 0
              )}
              )
            </span>
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Concepto con menor recaudación
          </p>
          <p className="text-lg font-semibold">
            {dataArr.sort((a, b) => a.currentValue - b.currentValue)[0]
              ?.concept || "N/A"}{" "}
            <span className="text-sm text-gray-600 dark:text-gray-100">
              (
              {formatCurrency(
                dataArr.sort((a, b) => a.currentValue - b.currentValue)[0]
                  ?.currentValue || 0
              )}
              )
            </span>
          </p>
        </div>
      </div>

      {/* Gráfico Nightingale para distribución de recaudación (mes actual) */}
      <h4 className="text-lg font-bold mb-2">Distribución de Monto Abonado</h4>
      <div style={{ width: "100%", height: 300 }}>
        <ReactECharts
          option={{
            backgroundColor: isDarkMode ? "#1f2937" : "transparent",
            grid: {
              containLabel: true,
              bottom: "20%",
            },
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
                name: "Monto Abonado",
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
                data: pieData.map((item) => ({
                  value: item.value,
                  name: item.name,
                  itemStyle: {
                    color:
                      pastelColors[
                        pieData.findIndex((d) => d.name === item.name) %
                          pastelColors.length
                      ],
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

      {/* Detalles opcionales: ranking de crecimiento */}
      {showDetails && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold mb-2">Top Crecimiento</h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">
                      Concepto
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Crecimiento (%)
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Actual
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Anterior
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topGrowth.map((item) => (
                    <tr
                      key={item.concept}
                      className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 text-gray-900 dark:text-gray-100">
                        {item.concept}
                      </td>
                      <td
                        className={`p-3 text-right font-semibold ${
                          item.growth > 0
                            ? "text-green-600 dark:text-green-400"
                            : item.growth < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {item.previousValue === 0 &&
                        item.currentValue > 0 &&
                        currentMonthNumber === 1
                          ? "Nuevo/Sin datos previos"
                          : item.growth === 0 &&
                            item.previousValue === 0 &&
                            item.currentValue === 0
                          ? "Sin datos"
                          : `${item.growth > 0 ? "+" : ""}${item.growth.toFixed(
                              1
                            )}%`}
                      </td>
                      <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.currentValue)}
                      </td>
                      <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.previousValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Bajo Crecimiento</h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-200">
                      Concepto
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Crecimiento (%)
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Actual
                    </th>
                    <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-200">
                      Anterior
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bottomGrowth.map((item) => (
                    <tr
                      key={item.concept}
                      className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 text-gray-900 dark:text-gray-100">
                        {item.concept}
                      </td>
                      <td
                        className={`p-3 text-right font-semibold ${
                          item.growth > 0
                            ? "text-green-600 dark:text-green-400"
                            : item.growth < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {item.previousValue === 0 &&
                        item.currentValue > 0 &&
                        currentMonthNumber === 1
                          ? "Nuevo/Sin datos previos"
                          : item.growth === 0 &&
                            item.previousValue === 0 &&
                            item.currentValue === 0
                          ? "Sin datos"
                          : `${item.growth > 0 ? "+" : ""}${item.growth.toFixed(
                              1
                            )}%`}
                      </td>
                      <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.currentValue)}
                      </td>
                      <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.previousValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Botón para mostrar/ocultar detalles */}
      <div className="mt-4 flex justify-center">
        <button
          className="px-4 py-2 border-b border-indigo-500 text-indigo-500 bg-transparent hover:border-indigo-700 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-500"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
        </button>
      </div>
    </div>
  );
});

export default ConceptGrowthSection;
