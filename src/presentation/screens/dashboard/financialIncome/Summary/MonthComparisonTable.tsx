// src/components/paymentSummary/MonthComparisonTable.tsx
import React, { useMemo } from "react";
import {
  usePaymentSummaryStore,
  MonthlyStat,
} from "../../../../../store/paymentSummaryStore";

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

const MonthComparisonTable: React.FC = React.memo(() => {
  // Consumimos monthlyStats del nuevo store
  const monthlyStats = usePaymentSummaryStore((state) => state.monthlyStats);

  // Ordenamos usando parseInt con base 10
  const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
    return [...monthlyStats].sort(
      (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
    );
  }, [monthlyStats]);

  // Calcular totales
  const totals = useMemo(() => {
    return sortedMonthlyStats.reduce(
      (acc, curr) => ({
        paid: acc.paid + curr.paid,
        pending: acc.pending + curr.pending,
        saldo: acc.saldo + curr.saldo,
        unidentifiedPayments:
          acc.unidentifiedPayments + curr.unidentifiedPayments,
        complianceRate: acc.complianceRate + curr.complianceRate,
        delinquencyRate: acc.delinquencyRate + curr.delinquencyRate,
        creditUsed: acc.creditUsed + curr.creditUsed,
        charges: acc.charges + curr.charges,
      }),
      {
        paid: 0,
        pending: 0,
        saldo: 0,
        unidentifiedPayments: 0,
        complianceRate: 0,
        delinquencyRate: 0,
        creditUsed: 0,
        charges: 0,
      }
    );
  }, [sortedMonthlyStats]);

  // Calcular promedios
  const averages = useMemo(
    () => ({
      complianceRate: totals.complianceRate / sortedMonthlyStats.length,
      delinquencyRate: totals.delinquencyRate / sortedMonthlyStats.length,
    }),
    [totals, sortedMonthlyStats.length]
  );

  // Función de formateo de moneda (con dos decimales)
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="mb-8 flex flex-col lg:flex-row gap-4">
      <div className="mb-8 w-full">
        <h3 className="text-xl font-bold mb-2">
          Comparativa mes a mes (totales)
        </h3>
        <table className="min-w-full border-collapse border border-indigo-200 dark:border-gray-800">
          <thead>
            <tr className="bg-indigo-500 dark:bg-gray-900">
              <th className="border p-2 text-white dark:text-gray-100">Mes</th>
              <th className="border p-2 text-white dark:text-gray-100">
                Monto Abonado
              </th>
              <th className="border p-2 text-white dark:text-gray-100">
                Cargos
              </th>
              <th className="border p-2 text-white dark:text-gray-100">
                Saldo
              </th>
              <th className="border p-2 text-white dark:text-gray-100">
                Pagos no identificados
              </th>
              <th className="border p-2 text-white dark:text-gray-100">
                % Cumplimiento
              </th>
              <th className="border p-2 text-white dark:text-gray-100">
                % Morosidad
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyStats.map((row) => (
              <tr
                key={row.month}
                className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
              >
                <td className="border p-2">
                  {monthNames[row.month] || row.month}
                </td>
                <td className="border p-2">
                  {formatCurrency(
                    row.paid + row.creditUsed + (row.saldo > 0 ? row.saldo : 0)
                  )}
                </td>
                <td className="border p-2">{formatCurrency(row.charges)}</td>
                <td
                  className={`border p-2 ${
                    row.charges -
                      (row.paid +
                        row.creditUsed +
                        (row.saldo > 0 ? row.saldo : 0)) <
                    0
                      ? "text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(
                    row.charges -
                      (row.paid +
                        row.creditUsed +
                        (row.saldo > 0 ? row.saldo : 0))
                  )}
                </td>
                <td className="border p-2">
                  {formatCurrency(row.unidentifiedPayments || 0)}
                </td>
                <td className="border p-2">{row.complianceRate.toFixed(2)}%</td>
                <td className="border p-2">
                  {row.delinquencyRate.toFixed(2)}%
                </td>
              </tr>
            ))}
            {/* Fila de totales */}
            <tr className="bg-indigo-100 dark:bg-gray-800">
              <td className="border p-2 font-semibold">Totales</td>
              <td className="border p-2 font-semibold">
                {formatCurrency(totals.paid)}
              </td>
              <td className="border p-2 font-semibold">
                {formatCurrency(totals.charges)}
              </td>
              <td
                className={`border p-2 font-semibold ${
                  totals.saldo < 0
                    ? "text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {totals.saldo < 0 ? "+" : ""}
                {formatCurrency(Math.abs(totals.saldo))}
              </td>
              <td className="border p-2 font-semibold">
                {formatCurrency(totals.unidentifiedPayments)}
              </td>
              <td className="border p-2 font-semibold">
                {averages.complianceRate.toFixed(2)}%
              </td>
              <td className="border p-2 font-semibold">
                {averages.delinquencyRate.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MonthComparisonTable;
