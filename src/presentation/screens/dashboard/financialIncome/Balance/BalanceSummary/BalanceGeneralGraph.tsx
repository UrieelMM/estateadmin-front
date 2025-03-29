// src/components/BalanceGeneral/BalanceGeneralGraph.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface IncomeMonthlyStat {
  month: string;
  paid: number;
  saldo: number;
  creditUsed: number;
}

interface ExpenseMonthlyStat {
  month: string;
  spent: number;
}

interface BalanceGeneralGraphProps {
  incomesMonthlyStats: IncomeMonthlyStat[];
  expensesMonthlyStats: ExpenseMonthlyStat[];
}

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

const BalanceGeneralGraph: React.FC<BalanceGeneralGraphProps> = ({
  incomesMonthlyStats,
  expensesMonthlyStats,
}) => {
  // Combina la data por mes para formar la serie comparativa
  const data = incomesMonthlyStats.map((incomeStat) => {
    const expenseStat = expensesMonthlyStats.find(
      (exp) => exp.month === incomeStat.month
    ) || {
      spent: 0,
    };
    return {
      month: monthNames[incomeStat.month] || incomeStat.month,
      Ingresos: incomeStat.paid + incomeStat.saldo - incomeStat.creditUsed,
      Egresos: expenseStat.spent,
    };
  });

  return (
    <div className="bg-white shadow rounded p-4 mb-4 dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-2 dark:text-gray-100">
        Comparativa Mensual
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(value)
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Ingresos"
            stroke="#8093E8"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="Egresos" stroke="#74B9E7" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceGeneralGraph;
