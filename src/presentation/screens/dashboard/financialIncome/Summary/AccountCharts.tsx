// src/components/paymentSummary/AccountCharts.tsx
import React, { useMemo } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";

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

const AccountCharts: React.FC<{ payments: PaymentRecord[] }> = ({ payments }) => {
  /**
   * Formateador de moneda
   */
  const formatCurrency = (value: number): string => {
    return (
      "$" +
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

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
   * 1. Agrupar por concepto: sumamos (amountPaid + creditBalance)
   */
  const conceptTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    payments.forEach((p) => {
      const concept = p.concept || "Desconocido";
      const totalPaid = p.amountPaid + p.creditBalance;
      totals[concept] = (totals[concept] || 0) + totalPaid;
    });
    return totals;
  }, [payments]);

  /**
   * 2. Crear datos para el gráfico de pastel
   * Se ordena por valor descendente, se toman los 5 primeros, y se suma "Otros".
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
   * 3. Crear datos para la gráfica de áreas apiladas
   *    - Se toma el top 5 de conceptos
   *    - El resto de conceptos se suma en "Otros"
   *    - Se agrupa por meses ("01" a "12") y se calcula la suma (amountPaid + creditBalance)
   */
  const areaStackData = useMemo(() => {
    // Ordenar según el total
    const sorted = Object.entries(conceptTotals).sort((a, b) => b[1] - a[1]);
    const topConcepts = sorted.slice(0, 5).map(([c]) => c);
    const otherConcepts = sorted.slice(5).map(([c]) => c);

    // Preparamos los meses
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    // Contruimos la data para cada mes
    const data = months.map((m) => {
      const row: Record<string, number | string> = { month: m };

      // Sumar para cada concepto top
      topConcepts.forEach((concept) => {
        const sumThisMonth = payments
          .filter((p) => p.concept === concept && p.month === m)
          .reduce((acc, p) => acc + p.amountPaid + p.creditBalance, 0);
        row[concept] = sumThisMonth;
      });

      // Sumar "Otros" si aplica
      if (otherConcepts.length > 0) {
        let sumOthers = 0;
        otherConcepts.forEach((concept) => {
          const sumThisMonth = payments
            .filter((p) => p.concept === concept && p.month === m)
            .reduce((acc, p) => acc + p.amountPaid + p.creditBalance, 0);
          sumOthers += sumThisMonth;
        });
        row["Otros"] = sumOthers;
      }

      return row;
    });

    // Claves para las áreas (los conceptos top y "Otros")
    const areaKeys = [...topConcepts];
    if (otherConcepts.length > 0) {
      areaKeys.push("Otros");
    }

    return { data, areaKeys };
  }, [conceptTotals, payments]);

  /**
   * Paleta de colores para las áreas/pastel
   * (puedes personalizar o usar un hook para modo oscuro, etc.)
   */
  const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6", "#98D7A5"];

  /**
   * Formateador para el eje X (mes)
   */
  const formatMonthLabel = (m: string) => MONTH_NAMES[m] || m;

  return (
    <div className="space-y-8 mt-4">
      {/* Gráfico de pastel */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-lg font-bold mb-2 text-indigo-600 dark:text-indigo-400">
          Distribución por Concepto
        </h3>
        <div style={{ width: "100%", height: 300 }}>
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
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de áreas apiladas */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-lg font-bold mb-2 text-indigo-600 dark:text-indigo-400">
          Evolución Mensual
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
          (Incluye los 5 principales conceptos + Otros)
        </p>
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <AreaChart
              data={areaStackData.data}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(val: string) => formatMonthLabel(val)} />
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
    </div>
  );
};

export default AccountCharts;
