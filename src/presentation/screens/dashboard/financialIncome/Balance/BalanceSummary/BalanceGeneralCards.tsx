// src/components/BalanceGeneral/BalanceGeneralCards.tsx
import React from "react";

interface BalanceGeneralCardsProps {
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
  creditUsed?: number;
}

const BalanceGeneralCards: React.FC<BalanceGeneralCardsProps> = ({
  totalIncome,
  totalSpent,
  netBalance,
}) => {
  // Función para formatear números como moneda
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Total Ingresos
        </h3>
        <p className="text-xl">{formatCurrency(totalIncome)}</p>
      </div>

      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Total Egresos
        </h3>
        <p className="text-xl">{formatCurrency(totalSpent)}</p>
      </div>
      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Balance Neto
        </h3>
        <p className="text-xl">{formatCurrency(netBalance)}</p>
      </div>
    </div>
  );
};

export default BalanceGeneralCards;
