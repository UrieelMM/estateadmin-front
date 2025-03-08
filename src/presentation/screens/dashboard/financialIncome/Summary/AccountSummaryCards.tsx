// src/components/paymentSummary/AccountSummaryCards.tsx
import React from "react";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";

const AccountSummaryCards: React.FC<{ payments: PaymentRecord[] }> = ({ payments }) => {
  // Calcula los totales para esta cuenta
  const totalIncome = payments.reduce((acc, pr) => acc + pr.amountPaid, 0);
  // Ahora, según lo solicitado, el saldo a favor es la suma de creditBalance (sin restar creditUsed)
  const totalSaldo = payments.reduce((acc, pr) => acc + pr.creditBalance, 0);

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
      {/* Card: Total de ingresos (incluyendo saldo a favor) */}
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
