// src/components/paymentSummary/AccountSummaryCards.tsx
import React from "react";
import { PaymentRecord, usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";

const AccountSummaryCards: React.FC<{ payments: PaymentRecord[] }> = ({ payments }) => {
  const { financialAccountsMap } = usePaymentSummaryStore();

  // Obtenemos el initialBalance de la cuenta correspondiente.
  // Asumimos que todos los payments corresponden a la misma cuenta,
  // por lo que tomamos el id del primer registro.
  const accountId = payments.length > 0 ? payments[0].financialAccountId : "";
  const initialBalance = accountId && financialAccountsMap[accountId]
    ? financialAccountsMap[accountId].initialBalance
    : 0;

  // Suma total de los pagos de la cuenta
  const totalPayments = payments.reduce((acc, pr) => acc + pr.amountPaid, 0);
  // Suma total del saldo a favor (creditBalance)
  const totalSaldo = payments.reduce((acc, pr) => acc + pr.creditBalance, 0);
  // Total de ingresos = pagos + initialBalance
  const totalIncome = totalPayments + initialBalance;

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
      {/* Card: Total de ingresos (incluye pagos + initialBalance y suma el saldo a favor) */}
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Total ingresos:
          </span>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-gray-100">
            {formatCurrency(totalIncome + totalSaldo)}
          </span>
        </div>
      </div>

      {/* Card: Saldo a favor */}
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Saldo a favor:
          </span>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-gray-100">
            {formatCurrency(totalSaldo)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCards;
