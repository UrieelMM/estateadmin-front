// src/components/paymentSummary/MonthCards.tsx
import React, { useMemo } from "react";
import { Card } from "@heroui/react";
import { usePaymentSummaryStore, MonthlyStat } from "../../../../../store/paymentSummaryStore";

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

const MonthCards: React.FC = () => {
  const { monthlyStats, selectedYear } = usePaymentSummaryStore((state) => ({
    monthlyStats: state.monthlyStats,
    selectedYear: state.selectedYear,
  }));

  // Datos actuales
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthNumber = now.getMonth() + 1;

  // Si el año seleccionado es el actual, se consideran solo los meses hasta el mes actual
  const statsToConsider = useMemo(() => {
    if (selectedYear === currentYear) {
      return monthlyStats.filter((stat: MonthlyStat) => parseInt(stat.month) <= currentMonthNumber);
    }
    return monthlyStats;
  }, [monthlyStats, selectedYear, currentYear, currentMonthNumber]);

  // Calcular el mínimo y máximo monto abonado
  const minPaid = useMemo(() => {
    if (statsToConsider.length === 0) return Infinity;
    return Math.min(...statsToConsider.map(stat => stat.paid));
  }, [statsToConsider]);

  const maxPaid = useMemo(() => {
    if (statsToConsider.length === 0) return -Infinity;
    return Math.max(...statsToConsider.map(stat => stat.paid));
  }, [statsToConsider]);

  const minStat = useMemo(() => {
    return statsToConsider.find(stat => stat.paid === minPaid);
  }, [statsToConsider, minPaid]);

  const maxStat = useMemo(() => {
    return statsToConsider.find(stat => stat.paid === maxPaid);
  }, [statsToConsider, maxPaid]);

  const minMonth = minStat ? monthNames[minStat.month] || minStat.month : "N/D";
  const maxMonth = maxStat ? monthNames[maxStat.month] || maxStat.month : "N/D";

  return (
    <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
      <Card className="p-4 shadow-md rounded-md">
        <div className="flex flex-col gap-y-2">
          <span className="text-sm font-medium text-default-500">
            Mes con mayor ingresos:
          </span>
          <span className="text-2xl font-semibold text-default-700">{maxMonth}</span>
        </div>
      </Card>
      <Card className="p-4 shadow-md rounded-md">
        <div className="flex flex-col gap-y-2">
          <span className="text-sm font-medium text-default-500">
            Mes con menor ingresos:
          </span>
          <span className="text-2xl font-semibold text-default-700">{minMonth}</span>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(MonthCards);
