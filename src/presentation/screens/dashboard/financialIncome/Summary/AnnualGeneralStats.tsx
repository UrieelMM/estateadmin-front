// src/components/Summary/AnnualGeneralStats.tsx
import React, { useMemo } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/**
 * Mapeo numérico de mes a nombre (en español).
 * "01" -> "Enero",
 * "02" -> "Febrero",
 * etc.
 */
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
  const conceptRecords = usePaymentSummaryStore((state) => state.conceptRecords);

  if (!conceptRecords || Object.keys(conceptRecords).length < 1) return null;

  /**
   * Formato de moneda (por ejemplo: $2,500.00)
   */
  const formatCurrency = (value: number): string => {
    return "$" + value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Pequeño formateador opcional para grandes montos en el eje Y (k, M, etc.)
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
   * Cálculos principales (anuales) basados en conceptRecords.
   * Se actualizó para que en los totales se considere amountPaid + creditBalance
   */
  const {
    conceptTotals,
    bestConcept,
    worstConcept,
    bestMonth,
    worstMonth,
    monthlyAverage,
  } = useMemo(() => {
    const conceptTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {
      "01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0,
      "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0,
    };
    let globalSaldo = 0;

    Object.entries(conceptRecords).forEach(([concept, records]) => {
      let sumConcept = 0;
      records.forEach((rec) => {
        // Ajuste: sumar amountPaid + creditBalance para reflejar el total pagado
        sumConcept += rec.amountPaid + rec.creditBalance;
        if (monthlyTotals[rec.month] !== undefined) {
          monthlyTotals[rec.month] += rec.amountPaid + rec.creditBalance;
        }
        // Sumar la diferencia entre creditBalance y creditUsed (saldo a favor)
        globalSaldo += rec.creditBalance - (rec.creditUsed || 0);
      });
      conceptTotals[concept] = sumConcept;
    });

    const conceptList = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const bestConcept = conceptList[0] || ["N/A", 0];

    const worstConceptIdx = conceptList.slice().reverse().findIndex(([_, total]) => total > 0);
    let worstConcept: [string, number] = ["N/A", 0];
    if (worstConceptIdx !== -1) {
      const realIdx = conceptList.length - 1 - worstConceptIdx;
      worstConcept = conceptList[realIdx];
    }

    const monthList = Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1]);
    const bestMonth = monthList[0] || ["N/A", 0];

    const worstMonthIdx = monthList.slice().reverse().findIndex(([_, val]) => val > 0);
    let worstMonth: [string, number] = ["N/A", 0];
    if (worstMonthIdx !== -1) {
      const realIdx = monthList.length - 1 - worstMonthIdx;
      worstMonth = monthList[realIdx];
    }

    const annualGrandTotal = conceptList.reduce((acc, [, total]) => acc + total, 0);
    const monthlyAverage = annualGrandTotal / 12;

    return {
      conceptTotals,
      bestConcept,
      worstConcept,
      bestMonth,
      worstMonth,
      monthlyAverage,
      globalSaldo,
    };
  }, [conceptRecords]);

  /**
   * Datos para la gráfica de pastel: Top 5 + "Otros"
   */
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

  /**
   * Datos para la gráfica de áreas apiladas (Top 5 + "Otros")
   * Se actualizó la suma mensual para incluir rec.amountPaid + rec.creditBalance.
   */
  const areaStackData = useMemo(() => {
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topConcepts = sorted.slice(0, 5).map(([c]) => c);
    const otherConcepts = sorted.slice(5).map(([c]) => c);
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const data = months.map((m) => {
      const row: any = { month: m };
      topConcepts.forEach((concept) => {
        const recs = conceptRecords[concept] || [];
        const sumThisMonth = recs
          .filter((r) => r.month === m)
          .reduce((acc, r) => acc + r.amountPaid + r.creditBalance, 0);
        row[concept] = sumThisMonth;
      });
      if (otherConcepts.length > 0) {
        let sumOthers = 0;
        otherConcepts.forEach((concept) => {
          const recs = conceptRecords[concept] || [];
          const sumThisMonth = recs
            .filter((r) => r.month === m)
            .reduce((acc, r) => acc + r.amountPaid + r.creditBalance, 0);
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

  const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];
  const formatMonthLabel = (m: string) => MONTH_NAMES[m] || m;
  const getMonthName = (m: string) => MONTH_NAMES[m] || "N/A";

  return (
    <div className="mb-8 w-full">
      {/* Las cards se mantienen iguales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Concepto estrella (Año)</p>
          <p className="text-base font-semibold text-indigo-500">{bestConcept[0]}</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(bestConcept[1])}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Concepto rezagado (Año)</p>
          <p className="text-base font-semibold text-indigo-500">{worstConcept[0]}</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(worstConcept[1])}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Mes con mayor recaudación</p>
          <p className="text-base font-semibold text-indigo-500">
            {getMonthName(bestMonth[0])}
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(bestMonth[1])}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Mes con menor recaudación</p>
          <p className="text-base font-semibold text-indigo-500">
            {getMonthName(worstMonth[0])}
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(worstMonth[1])}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Ingreso promedio mensual</p>
          <p className="text-2xl font-semibold">{formatCurrency(monthlyAverage)}</p>
        </div>
      </div>

      {/* Gráfica de pastel */}
      <h3 className="text-lg font-bold mb-2">Distribución de recaudación anual por concepto</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            >
              {pieData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de áreas apiladas */}
      <h3 className="text-lg font-bold mt-8 mb-2">
        Evolución mensual <span className="text-xs font-medium text-gray-500 dark:text-gray-100">(5 principales conceptos + otros)</span>
      </h3>
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <AreaChart
            data={areaStackData.data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(val: string) => formatMonthLabel(val)} />
            <YAxis tickFormatter={(val: number) => formatLargeValues(val)} width={80} />
            <Tooltip
              formatter={(val: number) => formatCurrency(val)}
              labelFormatter={(label) => `Mes: ${formatMonthLabel(label as string)}`}
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
