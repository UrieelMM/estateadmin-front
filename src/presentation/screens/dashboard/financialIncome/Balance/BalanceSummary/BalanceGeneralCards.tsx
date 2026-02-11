// src/components/BalanceGeneral/BalanceGeneralCards.tsx
import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";
import { motion } from "framer-motion";

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

  const healthLabel =
    netBalance >= 0 ? "Balance positivo" : "Balance en riesgo";

  const baseCardClass =
    "rounded-2xl border p-4 shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/70";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`${baseCardClass} bg-gradient-to-br from-indigo-50/70 to-white dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 border-indigo-200 dark:border-indigo-900/40`}
      >
        <h3 className="text-xs uppercase tracking-wide font-semibold text-indigo-700 dark:text-indigo-300">
          Total Ingresos
        </h3>
        <p className="text-xl font-semibold">{formatCurrency(totalIncomeWithCredit)}</p>
        {(availableCredit > 0 || creditUsed > 0) && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {availableCredit > 0 &&
              `Saldo a favor: ${formatCurrency(availableCredit)}`}
            {creditUsed > 0 &&
              ` | Crédito usado: ${formatCurrency(creditUsed)}`}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Flujo efectivo acumulado del periodo.
        </p>
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.04 }}
        className={`${baseCardClass} bg-gradient-to-br from-rose-50/70 to-white dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 border-rose-200 dark:border-rose-900/40`}
      >
        <h3 className="text-xs uppercase tracking-wide font-semibold text-rose-700 dark:text-rose-300">
          Total Egresos
        </h3>
        <p className="text-xl font-semibold">{formatCurrency(totalSpent)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Egresos comprometidos y ejecutados.
        </p>
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
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.08 }}
        className={`${baseCardClass} ${
          netBalance >= 0
            ? "bg-gradient-to-br from-emerald-50/70 to-white dark:from-gray-900 dark:to-gray-800 border-emerald-200 dark:border-emerald-900/40"
            : "bg-gradient-to-br from-amber-50/70 to-white dark:from-gray-900 dark:to-gray-800 border-amber-200 dark:border-amber-900/40"
        } dark:text-gray-100`}
      >
        <h3
          className={`text-xs uppercase tracking-wide font-semibold ${
            netBalance >= 0
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          Balance Neto
        </h3>
        <p className="text-xl font-semibold">{formatCurrency(netBalance)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {healthLabel}
        </p>
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
      </motion.div>
    </div>
  );
};

export default BalanceGeneralCards;
