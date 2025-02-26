// src/components/Summary/ConceptGrowthSection.tsx
import React, { useState, useMemo } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ConceptGrowthSection: React.FC = React.memo(() => {
  const conceptRecords = usePaymentSummaryStore(
    (state) => state.conceptRecords
  );
  const [showDetails, setShowDetails] = useState(false);
  const currentMonthNumber = new Date().getMonth() + 1;
  const currentMonthString = currentMonthNumber.toString().padStart(2, "0");
  const previousMonthString =
    currentMonthNumber > 1
      ? (currentMonthNumber - 1).toString().padStart(2, "0")
      : null;

  if (!conceptRecords || Object.keys(conceptRecords).length < 1) return null;

  // Función para formatear moneda: $2,500.00
  const formatCurrency = (value: number): string => {
    return "$" + value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cálculos por concepto (para el mes actual y anterior)
  const { totalCurrent, dataArr, growthArr } =
    useMemo(() => {
      let totalCurrent = 0;
      let totalPrevious = 0;
      const dataArr: { concept: string; currentValue: number }[] = [];
      const growthArr: {
        concept: string;
        growth: number;
        currentValue: number;
        previousValue: number;
      }[] = [];

      Object.entries(conceptRecords).forEach(([concept, records]) => {
        // Sumar los ingresos (amountPaid) del mes actual y anterior
        const currentValue = records
          .filter((record) => record.month === currentMonthString)
          .reduce((sum, record) => sum + record.amountPaid, 0);
        const previousValue = previousMonthString
          ? records
              .filter((record) => record.month === previousMonthString)
              .reduce((sum, record) => sum + record.amountPaid, 0)
          : 0;

        totalCurrent += currentValue;
        totalPrevious += previousValue;
        const growth =
          previousValue !== 0
            ? ((currentValue - previousValue) / previousValue) * 100
            : 0;

        dataArr.push({ concept, currentValue });
        growthArr.push({ concept, growth, currentValue, previousValue });
      });

      const overallGrowth =
        totalPrevious !== 0
          ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
          : 0;
      return { totalCurrent, totalPrevious, overallGrowth, dataArr, growthArr };
    }, [conceptRecords, currentMonthString, previousMonthString]);

  // Estadísticas adicionales basadas en los datos del mes actual
  const additionalMetrics = useMemo(() => {
    // Filtrar solo conceptos con ingreso > 0 (activos)
    const activeConcepts = dataArr.filter((item) => item.currentValue > 0);
    const activeCount = activeConcepts.length;
    const avgIncome =
      activeCount > 0 ? totalCurrent / activeCount : 0;

    // Ordenar para obtener el concepto estrella y el rezagado (entre los activos)
    const sortedDesc = [...activeConcepts].sort(
      (a, b) => b.currentValue - a.currentValue
    );
    const sortedAsc = [...activeConcepts].sort(
      (a, b) => a.currentValue - b.currentValue
    );
    const starConcept = sortedDesc[0] || { concept: "N/A", currentValue: 0 };
    const worstConcept = sortedAsc[0] || { concept: "N/A", currentValue: 0 };

    // Ingreso anual total (sumando todos los registros del año)
    const annualTotal = Object.values(conceptRecords).reduce(
      (acc, records) => acc + records.reduce((sum, rec) => sum + rec.amountPaid, 0),
      0
    );

    return {
      activeCount,
      avgIncome,
      starConcept,
      worstConcept,
      annualTotal,
    };
  }, [dataArr, totalCurrent, conceptRecords]);

  // Datos para la gráfica de pastel: Top 5 conceptos por recaudación en el mes actual
  const pieData = useMemo(() => {
    const sorted = [...dataArr].sort((a, b) => b.currentValue - a.currentValue);
    const topFive = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((sum, item) => sum + item.currentValue, 0);
    if (others > 0) {
      topFive.push({ concept: "Otros", currentValue: others });
    }
    return topFive.map((item) => ({
      name: item.concept,
      value: item.currentValue,
    }));
  }, [dataArr]);

  // Ranking de crecimiento (comparación mes actual vs mes anterior)
  const topGrowth = useMemo(() => {
    const sorted = [...growthArr].sort((a, b) => b.growth - a.growth);
    return sorted.slice(0, 5);
  }, [growthArr]);

  const bottomGrowth = useMemo(() => {
    const sorted = [...growthArr].sort((a, b) => a.growth - b.growth);
    return sorted.slice(0, 5);
  }, [growthArr]);

  // Colores pastel (más vivos) para la gráfica
  const pastelColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">
        Recaudación por concepto - (Mes Actual)
      </h3>

      {/* Bloque de estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Ingreso promedio por concepto activo</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(additionalMetrics.avgIncome)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Concepto con más ingresos</p>
          <p className="text-lg font-semibold">
            {additionalMetrics.starConcept.concept}{" "}
            <span className="text-sm text-gray-600">
              ({formatCurrency(additionalMetrics.starConcept.currentValue)})
            </span>
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600">Concepto rezagado</p>
          <p className="text-lg font-semibold">
            {additionalMetrics.worstConcept.concept}{" "}
            <span className="text-sm text-gray-600">
              ({formatCurrency(additionalMetrics.worstConcept.currentValue)})
            </span>
          </p>
        </div>
      </div>

      {/* Gráfica de pastel para distribución de recaudación (mes actual) */}
      <h4 className="text-lg font-bold mb-2">
        Distribución de recaudación
      </h4>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) =>
                `${name}: ${formatCurrency(value)}`
              }
            >
              {pieData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={pastelColors[index % pastelColors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detalles opcionales: ranking de crecimiento */}
      {showDetails && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold mb-2">Top Crecimiento</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Concepto</th>
                  <th className="text-right p-2">Crecimiento (%)</th>
                </tr>
              </thead>
              <tbody>
                {topGrowth.map((item) => (
                  <tr key={item.concept}>
                    <td className="p-2">{item.concept}</td>
                    <td className="p-2 text-right">
                      {`${item.growth.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Bajo Crecimiento</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Concepto</th>
                  <th className="text-right p-2">Crecimiento (%)</th>
                </tr>
              </thead>
              <tbody>
                {bottomGrowth.map((item) => (
                  <tr key={item.concept}>
                    <td className="p-2">{item.concept}</td>
                    <td className="p-2 text-right">
                      {`${item.growth.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botón para mostrar/ocultar detalles */}
      <div className="mt-4 flex justify-center">
        <button
          className="px-4 py-2 border-b border-indigo-500 text-indigo-500 bg-transparent hover:border-indigo-700 hover:text-indigo-700"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
        </button>
      </div>
    </div>
  );
});

export default ConceptGrowthSection;
