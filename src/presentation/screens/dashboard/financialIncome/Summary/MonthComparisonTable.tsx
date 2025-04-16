// src/components/paymentSummary/MonthComparisonTable.tsx
import React, { useMemo } from "react";
import "./DetailedConceptsTable.css";
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
    <div className="mb-8 grid grid-cols-1 gap-6">
      <div className="mb-8 w-full">
        <h3 className="title text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 relative z-10">
          Comparativa mes a mes (totales)
        </h3>
        <div className="overflow-x-auto scrollbar-thin rounded-lg mb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  Mes
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  Monto Abonado
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  Cargos
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  Saldo
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  Pagos no identificados
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                  % Cumplimiento
                </th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
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

                // Calcula el saldo para este mes
                const balance =
                  row.charges -
                  (row.paid +
                    (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                    row.creditUsed);

                return (
                  <tr
                    key={row.month}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors duration-150 table-row"
                  >
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">
                        {monthNames[row.month] || row.month}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 data-value">
                      <div className="flex items-center">
                        <span className="text-gray-400 text-xs mr-1">$</span>
                        {(
                          row.paid +
                          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                          row.creditUsed
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 data-value">
                      <div className="flex items-center">
                        <span className="text-gray-400 text-xs mr-1">$</span>
                        {row.charges.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm data-value">
                      <div
                        className={`
                      flex items-center gap-1 px-2 py-1 rounded-full 
                      ${
                        balance < 0
                          ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      }
                    `}
                      >
                        <span className="text-xs">
                          {balance < 0 ? "↓" : "↑"}
                        </span>
                        <span>
                          $
                          {Math.abs(balance).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 data-value">
                      <div className="flex items-center">
                        <span className="text-gray-400 text-xs mr-1">$</span>
                        {(row.unidentifiedPayments || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                            style={{ width: `${monthComplianceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm data-value">
                          {monthComplianceRate.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                            style={{ width: `${monthDelinquencyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm data-value">
                          {monthDelinquencyRate.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Fila de totales */}
              <tr className="bg-gray-100 dark:bg-indigo-900/30 font-medium text-gray-800 dark:text-white">
                <td className="py-3 px-4 text-sm font-bold">Totales</td>
                <td className="py-3 px-4 text-sm data-value font-bold">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">
                      $
                    </span>
                    {totalPaidWithCredit.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm data-value font-bold">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">
                      $
                    </span>
                    {totals.charges.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm data-value font-bold">
                  <div
                    className={`
                  flex items-center gap-1 px-2 py-1 rounded-full 
                  ${
                    totalBalance < 0
                      ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  }
                `}
                  >
                    <span className="text-xs">
                      {totalBalance < 0 ? "↓" : "↑"}
                    </span>
                    <span>
                      $
                      {Math.abs(totalBalance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm data-value font-bold">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">
                      $
                    </span>
                    {totals.unidentifiedPayments.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                        style={{ width: `${totalCompliance}%` }}
                      ></div>
                    </div>
                    <span className="text-sm data-value">
                      {totalCompliance.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                        style={{ width: `${totalDelinquency}%` }}
                      ></div>
                    </div>
                    <span className="text-sm data-value">
                      {totalDelinquency.toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default MonthComparisonTable;
