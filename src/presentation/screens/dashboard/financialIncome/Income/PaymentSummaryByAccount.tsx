// src/components/paymentSummary/PaymentSummaryByAccount.tsx
import React from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import AccountSummaryCards from "../Summary/AccountSummaryCards";
import AccountCharts from "../Summary/AccountCharts";

const PaymentSummaryByAccount: React.FC = () => {
  // Extrae tanto byFinancialAccount como financialAccountsMap
  const { byFinancialAccount, financialAccountsMap } = usePaymentSummaryStore(
    (state) => ({
      byFinancialAccount: state.byFinancialAccount,
      financialAccountsMap: state.financialAccountsMap,
    })
  );

  // Mostrar mensaje solo si no hay cuentas financieras configuradas
  if (!financialAccountsMap || Object.keys(financialAccountsMap).length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-100">
        No hay cuentas financieras configuradas.
      </div>
    );
  }

  // Asegurarnos de que se muestren todas las cuentas disponibles en financialAccountsMap
  const accountsToShow = Object.keys(financialAccountsMap).map(accountId => ({
    accountId,
    payments: byFinancialAccount[accountId] || [],
    name: financialAccountsMap[accountId]?.name || "Cuenta sin nombre"
  }));

  return (
    <div className="space-y-8">
      {accountsToShow.map(({ accountId, payments, name }) => (
        <div
          key={accountId}
          className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-md p-4"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Cuenta Financiera: {name}
          </h2>

          {/* Cards de resumen para esta cuenta */}
          <AccountSummaryCards payments={payments} accountId={accountId} />

          {/* Gráficas para esta cuenta */}
          <AccountCharts payments={payments} />
        </div>
      ))}
    </div>
  );
};

export default PaymentSummaryByAccount;
