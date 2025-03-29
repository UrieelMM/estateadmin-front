import { useEffect, useState } from "react";
import { useExpenseSummaryStore } from "../../../../../store/expenseSummaryStore";
import useProviderStore from "../../../../../store/providerStore";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import PDFExpenseByProviderReport from "./ExpensesByProvider/PDFExpenseByProviderReport";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

interface ProviderExpenseSummary {
  providerId: string;
  providerName: string;
  serviceLabel: string;
  totalAmount: number;
  expenseCount: number;
  expenses: any[];
}

const ExpensesByProvider = () => {
  const { selectedYear, getExpensesByProvider } = useExpenseSummaryStore();
  const { providers, fetchProviders } = useProviderStore();
  const [providerSummaries, setProviderSummaries] = useState<
    ProviderExpenseSummary[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProviders();
      setLoading(false);
    };
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    const loadExpenses = async () => {
      if (providers.length > 0) {
        const summaries: ProviderExpenseSummary[] = await Promise.all(
          providers.map(async (provider) => {
            const expenses = await getExpensesByProvider(
              provider.id,
              selectedYear
            );
            return {
              providerId: provider.id,
              providerName: provider.name,
              serviceLabel: provider.serviceLabel,
              totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
              expenseCount: expenses.length,
              expenses: expenses,
            };
          })
        );
        setProviderSummaries(
          summaries.filter((summary) => summary.expenseCount > 0)
        );
      }
    };
    loadExpenses();
  }, [providers, selectedYear]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  if (loading) {
    return <LoadingApp />;
  }

  return (
    <div className="space-y-2">
      {/* Encabezado con botón de reporte */}
      <div className="flex justify-between items-center">
        <PDFExpenseByProviderReport
          year={selectedYear}
          providerSummaries={providerSummaries}
        />
      </div>

      {/* Grid de tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {providerSummaries
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 4)
          .map((summary) => (
            <div
              key={summary.providerId}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg dark:shadow-xl"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {summary.providerName}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {summary.serviceLabel}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(summary.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {summary.expenseCount}{" "}
                    {summary.expenseCount === 1 ? "egreso" : "egresos"}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Tabla detallada */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Detalle de Egresos por Proveedor
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {providerSummaries.map((summary) =>
                    summary.expenses.map((expense, index) => (
                      <tr key={`${summary.providerId}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {summary.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {summary.serviceLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {expense.concept}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesByProvider;
