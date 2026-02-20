// src/components/paymentSummary/AccountSummaryCards.tsx
import React from "react";
import {
  PaymentRecord,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";

const AccountSummaryCards: React.FC<{
  payments: PaymentRecord[];
  accountId: string;
  pettyCashAccountId?: string;
  pettyCashCurrentBalance?: number;
  periodExpenseTotal?: number;
  periodInternalInflow?: number;
  periodInternalOutflow?: number;
}> = ( {
  payments,
  accountId,
  pettyCashAccountId,
  pettyCashCurrentBalance,
  periodExpenseTotal = 0,
  periodInternalInflow = 0,
  periodInternalOutflow = 0,
} ) => {
  const { financialAccountsMap } = usePaymentSummaryStore();

  // Obtenemos el initialBalance de la cuenta usando el accountId proporcionado
  const accountInfo = financialAccountsMap[accountId] || null;
  const initialBalance = accountInfo?.initialBalance || 0;
  const isPettyCashAccount = Boolean(
    pettyCashAccountId && pettyCashAccountId === accountId
  );
  const currentAccountBalance = isPettyCashAccount
    ? pettyCashCurrentBalance ?? initialBalance
    : initialBalance;

  // Suma total de los pagos regulares
  const totalPayments = payments.reduce((acc, pr) => acc + pr.amountPaid, 0);

  // Calcular el total de crédito usado
  const totalCreditUsed = payments.reduce(
    (acc, pr) => acc + (pr.creditUsed || 0),
    0
  );

  // Calcular saldo a favor disponible (creditBalance)
  const totalCreditBalance = payments.reduce(
    (acc, pr) => acc + pr.creditBalance,
    0
  );

  // Total de ingresos con la misma lógica que SummaryCards.tsx, adaptado para la cuenta
  const totalIncomeForPeriod =
    totalPayments +
    initialBalance +
    (totalCreditBalance > 0 ? totalCreditBalance : 0) -
    totalCreditUsed;

  const periodNetIncome =
    totalPayments +
    (totalCreditBalance > 0 ? totalCreditBalance : 0) -
    totalCreditUsed;

  const netPeriodFlow =
    periodNetIncome +
    periodInternalInflow -
    periodExpenseTotal -
    periodInternalOutflow;

  const formatCurrency = (value: number): string =>
    `${value < 0 ? "-$" : "$"}${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-3">
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Saldo actual de la cuenta:
          </span>
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {formatCurrency(currentAccountBalance)}
          </span>
          {isPettyCashAccount && (
            <span className="text-xs text-indigo-600 dark:text-indigo-300">
              Sincronizado con el módulo de Caja Chica.
            </span>
          )}
        </div>
      </div>

      {/* Card: Total de ingresos analíticos (con lógica existente) */}
      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Total analítico de ingresos:
          </span>
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {formatCurrency(totalIncomeForPeriod)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Incluye saldo inicial de la cuenta y movimientos de ingresos registrados en el periodo.
          </span>
        </div>
      </div>

      <div className="p-4 shadow-xl rounded-md bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
            Flujo neto del período:
          </span>
          <span
            className={ `text-2xl font-semibold ${netPeriodFlow >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
              }` }
          >
            {formatCurrency(netPeriodFlow)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Ingresos del período {formatCurrency(periodNetIncome)} · Egresos{" "}
            {formatCurrency(periodExpenseTotal)}
          </span>
          {(periodInternalInflow > 0 || periodInternalOutflow > 0) && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Movimientos internos +{formatCurrency(periodInternalInflow)} / -
              {formatCurrency(periodInternalOutflow)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCards;
