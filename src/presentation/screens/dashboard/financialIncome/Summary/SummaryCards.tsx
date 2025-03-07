// src/components/paymentSummary/SummaryCards.tsx
import React from "react";
import { Card } from "@heroui/react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { shallow } from "zustand/shallow";

const SummaryCards: React.FC = React.memo(() => {
  const { totalIncome, totalPending, monthlyStats } = usePaymentSummaryStore(
    (state) => ({
      totalIncome: state.totalIncome,
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
    }),
    shallow
  );

  // Calcular el saldo a favor global a partir de monthlyStats
  const totalCreditGlobal = monthlyStats.reduce((acc, stat) => acc + stat.saldo, 0);

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Estadísticas anuales generales</h2>
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        <Card className="p-4 shadow-md rounded-md">
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total ingresos:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </Card>

        <Card className="p-4 shadow-md rounded-md">
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total pendiente:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalPending)}
            </span>
          </div>
        </Card>

        <Card className="p-4 shadow-md rounded-md">
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total saldo a favor:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalCreditGlobal)}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
});

export default SummaryCards;
