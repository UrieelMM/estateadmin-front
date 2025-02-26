// src/components/paymentSummary/GrowthSection.tsx
import React, { useMemo } from "react";
import GrowthCard from "./GrowthCard";
import { usePaymentSummaryStore, MonthlyStat } from "../../../../../store/paymentSummaryStore";

const GrowthSection: React.FC = React.memo(() => {
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);
  const selectedYear = usePaymentSummaryStore((state) => state.selectedYear);

  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort((a, b) => parseInt(a.month) - parseInt(b.month));
  }, [monthlyStats]);

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = now.getMonth() + 1;

  const filteredMonthlyStats = useMemo(() => {
    if (selectedYear === currentYear) {
      return sortedMonthlyStats.filter(stat => parseInt(stat.month) <= currentMonth);
    }
    return sortedMonthlyStats;
  }, [sortedMonthlyStats, selectedYear, currentYear, currentMonth]);

  const overallGrowthMetrics = useMemo(() => {
    if (filteredMonthlyStats.length < 2) return [];
    const previousMonthStats = filteredMonthlyStats[filteredMonthlyStats.length - 2];
    const currentMonthStats = filteredMonthlyStats[filteredMonthlyStats.length - 1];
    return [
      {
        title: "Monto abonado",
        current: currentMonthStats.paid,
        previous: previousMonthStats.paid,
      },
      {
        title: "Monto pendiente",
        current: currentMonthStats.pending,
        previous: previousMonthStats.pending,
      },
      {
        title: "Saldo a favor",
        current: currentMonthStats.saldo,
        previous: previousMonthStats.saldo,
      },
    ];
  }, [filteredMonthlyStats]);

  if (overallGrowthMetrics.length < 1) return null;

  return (
    <>
      <h3 className="text-xl font-bold mb-4">
        Recaudación respecto al mes anterior
      </h3>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0 mb-8">
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
