// src/components/BalanceGeneral/BalanceGeneralCards.tsx
import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";

interface BalanceGeneralCardsProps {
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
  creditUsed?: number;
  availableCredit?: number;
}

const BalanceGeneralCards: React.FC<BalanceGeneralCardsProps> = ({
  totalIncome,
  totalSpent,
  netBalance,
  creditUsed = 0,
  availableCredit = 0,
}) => {
  const { isDarkMode } = useTheme();

  // Función para formatear números como moneda
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Calculamos el total de ingresos incluyendo el saldo a favor y restando el crédito usado
  const totalIncomeWithCredit =
    totalIncome + (availableCredit > 0 ? availableCredit : 0) - creditUsed;

  // Datos de ejemplo para las tendencias
  const incomeTrend = [
    { value: totalIncomeWithCredit * 0.8 },
    { value: totalIncomeWithCredit * 0.9 },
    { value: totalIncomeWithCredit },
  ];

  const spentTrend = [
    { value: totalSpent * 0.8 },
    { value: totalSpent * 0.9 },
    { value: totalSpent },
  ];

  const balanceTrend = [
    { value: netBalance * 0.8 },
    { value: netBalance * 0.9 },
    { value: netBalance },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Total Ingresos
        </h3>
        <p className="text-xl">{formatCurrency(totalIncomeWithCredit)}</p>
        {(availableCredit > 0 || creditUsed > 0) && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {availableCredit > 0 &&
              `Saldo a favor: ${formatCurrency(availableCredit)}`}
            {creditUsed > 0 &&
              ` | Crédito usado: ${formatCurrency(creditUsed)}`}
          </p>
        )}
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={incomeTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#8093E8" : "#4F46E5"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Total Egresos
        </h3>
        <p className="text-xl">{formatCurrency(totalSpent)}</p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spentTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#74B9E7" : "#3B82F6"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded p-4 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
        <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400">
          Balance Neto
        </h3>
        <p className="text-xl">{formatCurrency(netBalance)}</p>
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceTrend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isDarkMode ? "#A7CFE6" : "#0EA5E9"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BalanceGeneralCards;
