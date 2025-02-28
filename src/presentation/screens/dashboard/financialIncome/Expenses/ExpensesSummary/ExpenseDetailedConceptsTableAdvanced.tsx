// src/components/ExpensesSummary/ExpenseDetailedConceptsTableAdvanced.tsx
import React from "react";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import dayjs from "dayjs";

// Función para truncar la descripción a 120 caracteres
const truncate = (text: string, maxLength = 120): string =>
  text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

// Formatear moneda: $2,500.00
const formatCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Formatear fecha para mostrar solo día, mes y año (DD/MM/YYYY)
const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const ExpenseDetailedConceptsTableAdvanced: React.FC = () => {
  const expenses = useExpenseSummaryStore((state) => state.expenses);

  return (
    <div className="mb-8 w-full">
      <h3 className="text-xl font-bold mb-4">Detalle de Egresos</h3>
      {expenses.length === 0 ? (
        <p className="text-gray-600">No hay egresos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Folio</th>
                <th className="py-2 px-4 border-b text-left">Concepto</th>
                <th className="py-2 px-4 border-b text-right">Monto</th>
                <th className="py-2 px-4 border-b text-left">Descripción</th>
                <th className="py-2 px-4 border-b text-left">Fecha</th>
                <th className="py-2 px-4 border-b text-center">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-2 px-4 border-b">{exp.folio}</td>
                  <td className="py-2 px-4 border-b">{exp.concept}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(exp.amount)}</td>
                  <td className="py-2 px-4 border-b">
                    {exp.description ? truncate(exp.description, 120) : ""}
                  </td>
                  <td className="py-2 px-4 border-b">{formatDate(exp.expenseDate)}</td>
                  <td className="py-2 px-4 border-b text-center">
                    {exp.invoiceUrl ? (
                      <a
                        href={exp.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-500"
                      >
                        Descargar
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación (si hay más de 20 resultados) se implementa en el componente principal */}
    </div>
  );
};

export default ExpenseDetailedConceptsTableAdvanced;
