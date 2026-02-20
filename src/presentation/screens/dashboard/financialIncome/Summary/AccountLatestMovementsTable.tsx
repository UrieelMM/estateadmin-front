import React, { useMemo } from "react";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";

type MovementRow = {
  id: string;
  dateLabel: string;
  sortDate: number;
  movementType: "payment" | "credit_generated" | "credit_applied";
  concept: string;
  numberCondominium: string;
  paymentType?: string;
  amount: number;
};

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

const parseDateToTimestamp = (
  paymentDate?: string,
  month?: string,
  yearFilter?: string
): number => {
  if (paymentDate) {
    const parts = paymentDate.split("/");
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const monthIndex = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      const parsed = new Date(year, monthIndex, day).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }

    const parsed = new Date(paymentDate).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (month) {
    const fallbackYear = Number(yearFilter) || new Date().getFullYear();
    return new Date(fallbackYear, Number(month) - 1, 1).getTime();
  }

  return 0;
};

const resolveDateLabel = (
  paymentDate?: string,
  month?: string,
  yearFilter?: string
): string => {
  if (paymentDate) return paymentDate;
  if (!month) return "Sin fecha";

  const monthName = MONTH_NAMES[month] || month;
  if (yearFilter) return `${monthName} ${yearFilter}`;
  return monthName;
};

const formatCurrency = (value: number): string =>
  `${value < 0 ? "-$" : "$"}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const movementTypeLabel = (
  movementType: MovementRow["movementType"]
): string => {
  if (movementType === "payment") return "Pago";
  if (movementType === "credit_generated") return "Saldo a favor generado";
  return "Saldo a favor aplicado";
};

const movementTypeStyles = (
  movementType: MovementRow["movementType"]
): string => {
  if (movementType === "payment") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (movementType === "credit_generated") {
    return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
  }
  return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
};

const AccountLatestMovementsTable: React.FC<{
  payments: PaymentRecord[];
  selectedYear?: string;
  limit?: number;
}> = ({ payments, selectedYear, limit = 8 }) => {
  const movements = useMemo<MovementRow[]>(() => {
    const rows: MovementRow[] = [];

    payments.forEach((payment) => {
      const sortDate = parseDateToTimestamp(
        payment.paymentDate,
        payment.month,
        selectedYear
      );
      const dateLabel = resolveDateLabel(
        payment.paymentDate,
        payment.month,
        selectedYear
      );

      if (payment.amountPaid > 0) {
        rows.push({
          id: `${payment.id}-payment`,
          dateLabel,
          sortDate,
          movementType: "payment",
          concept: payment.concept || "Sin concepto",
          numberCondominium: payment.numberCondominium || "N/A",
          paymentType: payment.paymentType || "No especificado",
          amount: payment.amountPaid,
        });
      }

      if ((payment.creditBalance || 0) > 0) {
        rows.push({
          id: `${payment.id}-credit-generated`,
          dateLabel,
          sortDate,
          movementType: "credit_generated",
          concept: payment.concept || "Sin concepto",
          numberCondominium: payment.numberCondominium || "N/A",
          paymentType: payment.paymentType || "No especificado",
          amount: payment.creditBalance,
        });
      }

      if ((payment.creditUsed || 0) > 0) {
        rows.push({
          id: `${payment.id}-credit-used`,
          dateLabel,
          sortDate,
          movementType: "credit_applied",
          concept: payment.concept || "Sin concepto",
          numberCondominium: payment.numberCondominium || "N/A",
          paymentType: payment.paymentType || "No especificado",
          amount: -(payment.creditUsed || 0),
        });
      }
    });

    return rows
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, limit);
  }, [payments, selectedYear, limit]);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex flex-col gap-1 mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Últimos movimientos por cuenta
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Incluye pagos y operaciones de saldo a favor (generado/aplicado).
        </p>
      </div>

      {movements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
          No hay movimientos recientes para esta cuenta en el período
          seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Movimiento</th>
                <th className="py-2 pr-3">Condómino</th>
                <th className="py-2 pr-3">Concepto</th>
                <th className="py-2 pr-3">Medio</th>
                <th className="py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                    {row.dateLabel}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${movementTypeStyles(
                        row.movementType
                      )}`}
                    >
                      {movementTypeLabel(row.movementType)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                    {row.numberCondominium}
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                    {row.concept}
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                    {row.paymentType || "No especificado"}
                  </td>
                  <td
                    className={`py-2 text-right font-semibold ${
                      row.amount >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountLatestMovementsTable;
