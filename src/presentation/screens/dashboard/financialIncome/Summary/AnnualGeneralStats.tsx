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

// Interfaz de referencia (simplificada):
// interface PaymentRecord {
//   id: string;
//   clientId: string;
//   numberCondominium: string;
//   month: string;     // "01", "02", ...
//   amountPaid: number;
//   amountPending: number;
//   concept: string;
//   ...
// }

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
   * Pequeño formateador opcional para grandes montos en el eje Y
   * (k, M, etc.). Úsalo si lo consideras necesario.
   */
  const formatLargeValues = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`; // 1,000,000 → $1.0M
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`; // 1,000 → $1.0k
    } else {
      return `$${value}`;
    }
  };

  /**
   * Cálculos principales (anuales) por concepto y por mes
   */
  const {
    conceptTotals, // { concepto: totalRecaudadoAnual }
    bestConcept,
    worstConcept,
    bestMonth,
    worstMonth,
    monthlyAverage,
  } = useMemo(() => {
    // 1. Sumar recaudación anual por cada concepto
    const conceptTotals: Record<string, number> = {};
    // 2. Sumar recaudación total por cada mes (1..12)
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
        sumConcept += rec.amountPaid;
        if (monthlyTotals[rec.month] !== undefined) {
          monthlyTotals[rec.month] += rec.amountPaid;
        }
      });
      conceptTotals[concept] = sumConcept;
    });

    // 3. Identificar el concepto con mayor y menor recaudación (anual)
    const conceptList = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const bestConcept = conceptList[0] || ["N/A", 0];

    // "worstConcept" = aquel de menor recaudación pero mayor a 0
    const worstConceptIdx = conceptList
      .slice()
      .reverse()
      .findIndex(([_, total]) => total > 0);
    let worstConcept: [string, number] = ["N/A", 0];
    if (worstConceptIdx !== -1) {
      const realIdx = conceptList.length - 1 - worstConceptIdx;
      worstConcept = conceptList[realIdx];
    }

    // 4. Mes con mayor y menor recaudación
    const monthList = Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1]);
    const bestMonth = monthList[0] || ["N/A", 0];

    const worstMonthIdx = monthList.slice().reverse().findIndex(([_, val]) => val > 0);
    let worstMonth: [string, number] = ["N/A", 0];
    if (worstMonthIdx !== -1) {
      const realIdx = monthList.length - 1 - worstMonthIdx;
      worstMonth = monthList[realIdx];
    }

    // 5. Calcular ingreso total anual y promedio mensual
    const annualGrandTotal = conceptList.reduce((acc, [, total]) => acc + total, 0);
    const monthlyAverage = annualGrandTotal / 12;

    return {
      conceptTotals,
      bestConcept,
      worstConcept,
      bestMonth,
      worstMonth,
      monthlyAverage,
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
   * Datos para la gráfica de ÁREAS APILADAS (StackedAreaChart)
   * con top 5 conceptos + "Otros".
   */
  const areaStackData = useMemo(() => {
    // 1. Determinar top 5
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topConcepts = sorted.slice(0, 5).map(([c]) => c);
    const otherConcepts = sorted.slice(5).map(([c]) => c);

    // 2. Crear un array para los 12 meses
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const data = months.map((m) => {
      const row: any = { month: m };
      // Llenar para cada uno de los topConcepts
      topConcepts.forEach((concept) => {
        const recs = conceptRecords[concept] || [];
        const sumThisMonth = recs
          .filter((r) => r.month === m)
          .reduce((acc, r) => acc + r.amountPaid, 0);
        row[concept] = sumThisMonth;
      });
      // Agrupamos el resto en "Otros"
      if (otherConcepts.length > 0) {
        let sumOthers = 0;
        otherConcepts.forEach((concept) => {
          const recs = conceptRecords[concept] || [];
          const sumThisMonth = recs
            .filter((r) => r.month === m)
            .reduce((acc, r) => acc + r.amountPaid, 0);
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

  /**
   * Paleta de colores
   */
  const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

  // Mapea "01" → "Enero", etc.
  const formatMonthLabel = (m: string) => MONTH_NAMES[m] || m;
  // En las tarjetas
  const getMonthName = (m: string) => MONTH_NAMES[m] || "N/A";

  return (
    <div className="mb-8 w-full">
      {/* Tarjetas con métricas nuevas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Concepto estrella (Año)</p>
          <p className="text-base font-semibold">{bestConcept[0]}</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(bestConcept[1])}
          </p>
        </div>

        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Concepto rezagado (Año)</p>
          <p className="text-base font-semibold">{worstConcept[0]}</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(worstConcept[1])}
          </p>
        </div>

        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Mes con mayor recaudación</p>
          <p className="text-base font-semibold">
            {getMonthName(bestMonth[0])}
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(bestMonth[1])}
          </p>
        </div>

        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Mes con menor recaudación</p>
          <p className="text-base font-semibold">
            {getMonthName(worstMonth[0])}
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(worstMonth[1])}
          </p>
        </div>

        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Ingreso promedio mensual</p>
          <p className="text-2xl font-semibold">{formatCurrency(monthlyAverage)}</p>
        </div>
      </div>

      {/* Gráfica de pastel: Distribución anual por concepto (Top 5 + Otros) */}
      <h3 className="text-lg font-bold mb-2">Distribución de Recaudación Anual por Concepto</h3>
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

      {/* Gráfica de ÁREAS APILADAS: Evolución mensual de los top 5 conceptos (y "Otros") */}
      <h3 className="text-lg font-bold mt-8 mb-2">
        Evolución Mensual (Top 5 Conceptos + Otros)
      </h3>
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <AreaChart
            data={areaStackData.data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(val: string) => formatMonthLabel(val)}
            />
            <YAxis
              tickFormatter={(val: number) => formatLargeValues(val)}
              width={80}
            />
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
