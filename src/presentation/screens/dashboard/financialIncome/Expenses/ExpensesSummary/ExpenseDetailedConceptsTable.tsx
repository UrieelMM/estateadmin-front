// src/components/ExpensesSummary/ExpenseDetailedConceptsTable.tsx
import React from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";


/**
 * Tabla con todos los egresos.
 * Muestra:
 *  - Monto
 *  - Concepto
 *  - Descripción (truncada a 120 chars)
 *  - Fecha (expenseDate)
 */
const ExpenseDetailedConceptsTable: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Función para truncar la descripción
  const truncate = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">Detalle de Egresos</h3>
      {expenses.length === 0 ? (
        <p className="text-gray-600">No hay egresos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Folio</th>
                <th className="py-2 px-4 border-b text-left">Concepto</th>
                <th className="py-2 px-4 border-b text-right">Monto</th>
                <th className="py-2 px-4 border-b text-left">Descripción</th>
                <th className="py-2 px-4 border-b text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-2 px-4 border-b">{exp.folio}</td>
                  <td className="py-2 px-4 border-b">{exp.concept}</td>
                  <td className="py-2 px-4 border-b text-right">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {exp.description ? truncate(exp.description, 120) : ""}
                  </td>
                  <td className="py-2 px-4 border-b">{exp.expenseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailedConceptsTable;
