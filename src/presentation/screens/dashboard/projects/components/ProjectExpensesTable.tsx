import React, { useState } from "react";
import { ProjectExpense } from "../../../../../store/projectStore";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

interface ProjectExpensesTableProps {
  expenses: ProjectExpense[];
}

const ProjectExpensesTable: React.FC<ProjectExpensesTableProps> = ({
  expenses,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Función para formatear montos en pesos
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  };

  // Función para formatear fechas
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Obtener etiqueta de tipo de pago
  const getPaymentTypeLabel = (paymentType: string): string => {
    const paymentTypes: Record<string, string> = {
      cash: "Efectivo",
      transfer: "Transferencia",
      check: "Cheque",
      credit_card: "Tarjeta de Crédito",
      debit_card: "Tarjeta de Débito",
    };

    return paymentTypes[paymentType] || paymentType;
  };

  // Obtener etiqueta para el tag
  const getTagLabel = (tag: string): string => {
    const tagLabels: Record<string, string> = {
      labor: "Mano de obra",
      materials: "Materiales",
      equipment: "Equipamiento",
      tools: "Herramientas",
      transportation: "Transporte",
      permits: "Permisos y licencias",
      consulting: "Consultoría",
      design: "Diseño",
      maintenance: "Mantenimiento",
      other: "Otros",
    };

    return tagLabels[tag] || tag;
  };

  // Manejar clic en una fila para expandir/contraer
  const handleRowClick = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Si no hay gastos, mostrar mensaje
  if (expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No hay gastos registrados para este proyecto
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="dark:text-gray-100">
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Fecha
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Concepto
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Etiquetas
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Monto
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Tipo de Pago
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100"
            >
              Factura
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
          {expenses.map((expense) => (
            <React.Fragment key={expense.id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handleRowClick(expense.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                  {formatDate(expense.expenseDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {expense.concept}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {expense.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {getTagLabel(tag)}
                      </span>
                    ))}
                    {expense.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{expense.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                  {getPaymentTypeLabel(expense.paymentType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                  {expense.invoiceUrl ? (
                    <a
                      href={expense.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>

              {/* Fila expandida con detalles */}
              {expandedRowId === expense.id && (
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={6} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Detalles del Gasto
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {expense.description || "Sin descripción"}
                        </p>

                        <h4 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          Folio
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-100">
                          {expense.folio}
                        </p>

                        <h4 className="mt-4 text-sm font-medium text-gray-900  dark:text-gray-100">
                          Fecha de Registro
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-100">
                          {formatDate(expense.registerDate)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Todas las Etiquetas
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {expense.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {getTagLabel(tag)}
                            </span>
                          ))}
                        </div>

                        {expense.invoiceUrl && (
                          <>
                            <h4 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Factura/Recibo
                            </h4>
                            <div className="mt-1">
                              <a
                                href={expense.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <DocumentTextIcon className="h-4 w-4 mr-1" />
                                Ver Documento
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectExpensesTable;
