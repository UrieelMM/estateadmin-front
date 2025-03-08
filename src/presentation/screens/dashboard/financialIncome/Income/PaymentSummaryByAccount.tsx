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

  if (!byFinancialAccount || Object.keys(byFinancialAccount).length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-100">
        No hay datos disponibles para resumen por cuenta.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(byFinancialAccount).map(([accountId, payments]) => {
        // Busca el nombre en financialAccountsMap
        const accountName =
          financialAccountsMap[accountId]?.name || "Cuenta sin nombre";

        return (
          <div
            key={accountId}
            className="bg-gray-50 dark:bg-gray-800 shadow-lg rounded-md p-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {/* Muestra el nombre en lugar del ID */}
              Cuenta Financiera: {accountName}
            </h2>

            {/* Cards de resumen para esta cuenta */}
            <AccountSummaryCards payments={payments} />

            {/* Gráficas para esta cuenta */}
            <AccountCharts payments={payments} />
          </div>
        );
      })}
    </div>
  );
};

export default PaymentSummaryByAccount;
