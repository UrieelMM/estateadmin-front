// src/components/paymentSummary/AccountSummaryCards.tsx
import React from "react";
import {
  PaymentRecord,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";

const AccountSummaryCards: React.FC<{
  payments: PaymentRecord[];
  accountId: string;
}> = ({ payments, accountId }) => {
  const { financialAccountsMap, monthlyStats } = usePaymentSummaryStore();

  // Obtenemos el initialBalance de la cuenta usando el accountId proporcionado
  const accountInfo = financialAccountsMap[accountId] || null;
  const initialBalance = accountInfo?.initialBalance || 0;

  // Suma total de los pagos regulares
  const totalPayments = payments.reduce((acc, pr) => acc + pr.amountPaid, 0);

  // Calcular el total de crédito usado
  const totalCreditUsed = payments.reduce(
    (acc, pr) => acc + (pr.creditUsed || 0),
    0
  );

  // Calcular saldo a favor disponible
  const accountMonthlyStats = monthlyStats.filter((stat) =>
    payments.some((p) => p.month === stat.month)
  );
  const totalSaldo = accountMonthlyStats.reduce(
    (acc, stat) => acc + stat.saldo,
    0
  );

  // Total de ingresos = pagos regulares + saldo inicial + crédito usado + saldo disponible
  const realTotalIncome =
    totalPayments + initialBalance + totalCreditUsed + totalSaldo;

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
      {/* Card: Total de ingresos (incluye pagos + initialBalance + saldo a favor) */}
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Total ingresos:
          </span>
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {formatCurrency(realTotalIncome)}
          </span>
        </div>
      </div>

      {/* Card: Saldo a favor */}
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Saldo
          </span>
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {formatCurrency(totalSaldo)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCards;
