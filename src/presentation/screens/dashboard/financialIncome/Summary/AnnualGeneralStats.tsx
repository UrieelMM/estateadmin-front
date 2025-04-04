// src/components/Summary/AnnualGeneralStats.tsx
import React, { useMemo } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import {
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { useTheme } from "../../../../../context/Theme/ThemeContext";

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
          <div style={{ width: "100%", height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pieData}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => formatCurrency(val)}
                  tick={{
                    fill: isDarkMode ? "#f3f4f6" : "#1f2937",
                    fontSize: 13,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{
                    fill: isDarkMode ? "#f3f4f6" : "#1f2937",
                    fontSize: 13,
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="value" fill="#8093E8">
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
        <ResponsiveContainer>
          <AreaChart
            data={areaStackData.data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => formatMonthLabel(String(val))}
            />
            <YAxis
              tickFormatter={(val) => formatLargeValues(val as number)}
              width={80}
            />
            <Tooltip
              formatter={(val: number) => formatCurrency(val)}
              labelFormatter={(label) =>
                `Mes: ${formatMonthLabel(String(label))}`
              }
            />
            <Legend />
            {areaStackData.areaKeys.map((concept, idx) => (
              <Area
                key={concept}
                type="monotone"
                dataKey={concept}
                stackId="1"
                stroke={chartColors[idx % chartColors.length]}
                fill={chartColors[idx % chartColors.length]}
                fillOpacity={0.75}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualGeneralStats;
