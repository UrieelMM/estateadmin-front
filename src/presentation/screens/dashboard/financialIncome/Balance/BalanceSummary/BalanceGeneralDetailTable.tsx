// src/components/BalanceGeneral/BalanceGeneralDetailTable.tsx
import React from "react";

interface IncomeMonthlyStat {
  month: string;
  paid: number;
  saldo: number;  // Saldo a favor
}

interface ExpenseMonthlyStat {
  month: string;
  spent: number;
}

interface BalanceGeneralDetailTableProps {
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

const BalanceGeneralDetailTable: React.FC<BalanceGeneralDetailTableProps> = ({
  incomesMonthlyStats,
  expensesMonthlyStats,
}) => {
  // Suponemos que se requiere mostrar los 12 meses
  const data = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    const monthLabel = monthNames[m] || m;
    const incomeStat = incomesMonthlyStats.find((stat) => stat.month === m);
    const expenseStat = expensesMonthlyStats.find((stat) => stat.month === m);
    const ingresos = incomeStat ? (incomeStat.paid + incomeStat.saldo) : 0;
    const egresos = expenseStat ? expenseStat.spent : 0;
    const balance = ingresos - egresos;
    return { month: monthLabel, ingresos, egresos, balance };
  });

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <div className="bg-white shadow rounded p-4 mb-4 overflow-x-auto dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-2">Detalle Mensual</h3>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2 dark:bg-gray-900 dark:text-gray-100">Mes</th>
            <th className="border px-4 py-2 dark:bg-gray-900 dark:text-gray-100">Ingresos</th>
            <th className="border px-4 py-2 dark:bg-gray-900 dark:text-gray-100">Egresos</th>
            <th className="border px-4 py-2 dark:bg-gray-900 dark:text-gray-100">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="border px-4 py-2 dark:bg-gray-800 dark:text-gray-100">{row.month}</td>
              <td className="border px-4 py-2 dark:bg-gray-800 dark:text-gray-100">{formatCurrency(row.ingresos)}</td>
              <td className="border px-4 py-2 dark:bg-gray-800 dark:text-gray-100">{formatCurrency(row.egresos)}</td>
              <td className="border px-4 py-2 dark:bg-gray-800 dark:text-gray-100">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BalanceGeneralDetailTable;
