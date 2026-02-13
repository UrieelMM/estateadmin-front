// src/components/paymentSummary/GrowthSection.tsx
import React, { useMemo } from "react";
import GrowthCard from "./GrowthCard";
import {
  usePaymentSummaryStore,
  MonthlyStat,
} from "../../../../../store/paymentSummaryStore";

const GrowthSection: React.FC = React.memo(() => {
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);
  const selectedYear = usePaymentSummaryStore((state) => state.selectedYear);

  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort(
      (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
    );
  }, [monthlyStats]);

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = now.getMonth() + 1;

  const filteredMonthlyStats = useMemo(() => {
    if (selectedYear === currentYear) {
      return sortedMonthlyStats.filter(
        (stat) => parseInt(stat.month, 10) <= currentMonth
      );
    }
    return sortedMonthlyStats;
  }, [sortedMonthlyStats, selectedYear, currentYear, currentMonth]);

  const overallGrowthMetrics = useMemo(() => {
    if (filteredMonthlyStats.length < 2) return [];

    // Seleccionar meses con actividad para evitar comparar meses vacíos (ej. nov/dic en curso).
    const statsWithActivity = filteredMonthlyStats.filter((stat) => {
      return (
        stat.paid !== 0 ||
        stat.charges !== 0 ||
        stat.pending !== 0 ||
        stat.saldo !== 0 ||
        stat.unidentifiedPayments !== 0 ||
        stat.creditUsed !== 0
      );
    });

    const sourceStats =
      statsWithActivity.length >= 2 ? statsWithActivity : filteredMonthlyStats;
    const previousMonthStats = sourceStats[sourceStats.length - 2];
    const currentMonthStats = sourceStats[sourceStats.length - 1];

    if (!previousMonthStats || !currentMonthStats) return [];

    return [
      {
        title: "Monto Abonado",
        current:
          currentMonthStats.paid +
          (currentMonthStats.saldo > 0 ? currentMonthStats.saldo : 0) -
          currentMonthStats.creditUsed,
        previous:
          previousMonthStats.paid +
          (previousMonthStats.saldo > 0 ? previousMonthStats.saldo : 0) -
          previousMonthStats.creditUsed,
      },
      {
        title: "Cargos",
        current: currentMonthStats.charges,
        previous: previousMonthStats.charges,
      },
      {
        title: "Saldo",
        current:
          currentMonthStats.charges -
          (currentMonthStats.paid +
            (currentMonthStats.saldo > 0 ? currentMonthStats.saldo : 0) -
            currentMonthStats.creditUsed),
        previous:
          previousMonthStats.charges -
          (previousMonthStats.paid +
            (previousMonthStats.saldo > 0 ? previousMonthStats.saldo : 0) -
            previousMonthStats.creditUsed),
      },
    ];
  }, [filteredMonthlyStats]);

  if (overallGrowthMetrics.length < 1) return null;

  return (
    <>
      <h3 className="text-xl font-bold mb-4">
        Comparación con el mes anterior
      </h3>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0 mb-8 dark:bg-gray-800 dark:divide-gray-700">
        {overallGrowthMetrics.map((metric) => (
          <GrowthCard
            key={metric.title}
            title={metric.title}
            current={metric.current}
            previous={metric.previous}
          />
        ))}
      </dl>
    </>
  );
});

export default GrowthSection;
