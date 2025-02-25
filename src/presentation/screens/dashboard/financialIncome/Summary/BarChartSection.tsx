// src/components/paymentSummary/BarChartSection.tsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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

const BarChartSection: React.FC = React.memo(() => {
  // Se suscribe directamente a monthlyStats del store
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);

  // Se calcula sortedMonthlyStats con la anotación explícita para usar MonthlyStat
  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort((a, b) => parseInt(a.month) - parseInt(b.month));
  }, [monthlyStats]);

  return (
    <div className="mb-8" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={sortedMonthlyStats.map((stat) => ({
            month: monthNames[stat.month] || stat.month,
            paid: stat.paid,
            pending: stat.pending,
            saldo: stat.saldo,
          }))}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="paid" fill="#4D44E0" name="Monto Abonado" />
          <Bar dataKey="pending" fill="#819CFB" name="Monto Pendiente" />
          <Bar dataKey="saldo" fill="#9dcdfa" name="Saldo a favor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default BarChartSection;
