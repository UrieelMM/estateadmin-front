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
  const detailed = usePaymentSummaryStore((state) => state.detailed);
  const payments = usePaymentSummaryStore((state) => state.payments);

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
        creditUsed: acc.creditUsed + curr.creditUsed,
        charges: acc.charges + curr.charges,
        creditBalance: acc.creditBalance + (curr.saldo > 0 ? curr.saldo : 0),
      }),
      {
        paid: 0,
        pending: 0,
        saldo: 0,
        unidentifiedPayments: 0,
        creditUsed: 0,
        charges: 0,
        creditBalance: 0,
      }
    );
  }, [sortedMonthlyStats]);

  // Calcular el saldo a favor global (igual que en SummaryCards)
  const totalCreditBalance = useMemo(
    () => payments.reduce((acc, payment) => acc + payment.creditBalance, 0),
    [payments]
  );

  // Calcular el total pagado con crédito (igual que en SummaryCards)
  const totalPaidWithCredit = useMemo(() => {
    return (
      totals.paid +
      (totalCreditBalance > 0 ? totalCreditBalance : 0) -
      totals.creditUsed
    );
  }, [totals, totalCreditBalance]);

  // Calcular el saldo total
  const totalBalance = useMemo(() => {
    return totals.charges - totalPaidWithCredit;
  }, [totals.charges, totalPaidWithCredit]);

  // Calcular porcentajes globales
  const allRecords = useMemo(() => {
    return Object.values(detailed).flat();
  }, [detailed]);

  // Calcular totales de cargos y pagos completos
  const totalCharges = allRecords.reduce(
    (sum, rec) => sum + rec.referenceAmount,
    0
  );
  const totalPaidInFull = allRecords
    .filter((rec) => rec.amountPending === 0)
    .reduce((sum, rec) => sum + rec.referenceAmount, 0);
  const totalCompliance =
    totalCharges > 0 ? (totalPaidInFull / totalCharges) * 100 : 0;
  const totalDelinquency = 100 - totalCompliance;

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
        <table className="min-w-full border-collapse">
          <thead className="text-md">
            <tr className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <th className="p-2 text-gray-800 dark:text-gray-100">Mes</th>
              <th className="p-2 text-gray-800 dark:text-gray-100">
                Monto Abonado
              </th>
              <th className="p-2 text-gray-800 dark:text-gray-100">Cargos</th>
              <th className="p-2 text-gray-800 dark:text-gray-100">Saldo</th>
              <th className="p-2 text-gray-800 dark:text-gray-100">
                Pagos no identificados
              </th>
              <th className="p-2 text-gray-800 dark:text-gray-100">
                % Cumplimiento
              </th>
              <th className="p-2 text-gray-800 dark:text-gray-100">
                % Morosidad
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyStats.map((row) => {
              // Calcular porcentajes mensuales
              const monthRecords = Object.values(detailed)
                .flat()
                .filter((rec) => rec.month === row.month);

              // Calcular total de cargos del mes
              const monthCharges = monthRecords.reduce(
                (sum, rec) => sum + rec.referenceAmount,
                0
              );
              // Calcular total de cargos pagados en su totalidad
              const monthPaidInFull = monthRecords
                .filter((rec) => rec.amountPending === 0)
                .reduce((sum, rec) => sum + rec.referenceAmount, 0);

              const monthComplianceRate =
                monthCharges > 0 ? (monthPaidInFull / monthCharges) * 100 : 0;
              const monthDelinquencyRate = 100 - monthComplianceRate;

              // Calcular el saldo a favor generado en este mes
              const monthCreditBalance = monthRecords.reduce(
                (sum, rec) => sum + rec.creditBalance,
                0
              );

              return (
                <tr
                  key={row.month}
                  className="hover:bg-gray-50 transition-colors text-md dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-800"
                >
                  <td className="p-2">{monthNames[row.month] || row.month}</td>
                  <td className="p-2">
                    {formatCurrency(
                      row.paid +
                        (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                        row.creditUsed
                    )}
                  </td>
                  <td className="p-2">{formatCurrency(row.charges)}</td>
                  <td
                    className={`p-2 ${
                      row.charges -
                        (row.paid +
                          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                          row.creditUsed) <
                      0
                        ? "text-green-500 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(
                      row.charges -
                        (row.paid +
                          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                          row.creditUsed)
                    )}
                  </td>
                  <td className="p-2">
                    {formatCurrency(row.unidentifiedPayments || 0)}
                  </td>
                  <td className="p-2">{monthComplianceRate.toFixed(2)}%</td>
                  <td className="p-2">{monthDelinquencyRate.toFixed(2)}%</td>
                </tr>
              );
            })}
            {/* Fila de totales */}
            <tr className="border-b border-gray-200 text-md dark:border-gray-800">
              <td className="p-2 font-semibold">Totales</td>
              <td className="p-2 font-semibold">
                {formatCurrency(totalPaidWithCredit)}
              </td>
              <td className="p-2 font-semibold">
                {formatCurrency(totals.charges)}
              </td>
              <td
                className={`p-2 font-semibold ${
                  totalBalance < 0
                    ? "text-green-500 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(totalBalance)}
              </td>
              <td className="p-2 font-semibold">
                {formatCurrency(totals.unidentifiedPayments)}
              </td>
              <td className="p-2 font-semibold">
                {totalCompliance.toFixed(2)}%
              </td>
              <td className="p-2 font-semibold">
                {totalDelinquency.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MonthComparisonTable;
