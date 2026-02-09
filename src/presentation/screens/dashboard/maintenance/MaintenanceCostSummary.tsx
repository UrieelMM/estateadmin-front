import { useState, useEffect } from "react";
import { useMaintenanceCostStore } from "../../../../store/useMaintenanceStore";
import { formatCurrency } from "../../../../utils/curreyncy";
import {
  LineChart,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import "moment/locale/es";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";

// Colores para las gráficas
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#d53e4f",
];

const MaintenanceCostSummary = () => {
  const { costs, getCostSummaryByCategory, getCostSummaryByMonth, fetchCosts } =
    useMaintenanceCostStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryData, setCategoryData] = useState<
    { category: string; total: number }[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<
    { month: number; total: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [topProviders, setTopProviders] = useState<
    { provider: string; total: number }[]
  >([]);
  const [statusDistribution, setStatusDistribution] = useState<
    { status: string; count: number; amount: number }[]
  >([]);

  // Configurar locale para español
  moment.locale("es");

  // Carga de datos cuando cambia el año
  useEffect(() => {
    const loadSummaryData = async () => {
      setLoading(true);
      try {
        // Obtener datos por categoría
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // Cargar gastos filtrados por año
        await fetchCosts({ startDate, endDate }, { rememberFilters: false });

        // Obtener datos por categoría
        const categoryResults = await getCostSummaryByCategory(
          startDate,
          endDate
        );
        setCategoryData(categoryResults);

        // Obtener datos por mes
        const monthlyResults = await getCostSummaryByMonth(year);
        setMonthlyData(monthlyResults);

      } catch (error) {
        console.error("Error al cargar datos de resumen:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSummaryData();
  }, [year]);

  useEffect(() => {
    if (!loading) {
      calculateAdditionalMetrics();
    }
  }, [costs, loading]);

  // Función para calcular métricas adicionales
  const calculateAdditionalMetrics = () => {
    // Calcular principales proveedores
    const providerMap: Record<string, number> = {};
    costs.forEach((cost) => {
      if (cost.provider) {
        const provider = cost.provider;
        providerMap[provider] = (providerMap[provider] || 0) + cost.amount;
      }
    });

    // Convertir a array y ordenar por total
    const providers = Object.entries(providerMap)
      .map(([provider, total]) => ({
        provider,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 proveedores

    setTopProviders(providers);

    // Calcular distribución por estado
    const statusMap: Record<string, { count: number; amount: number }> = {
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };

    costs.forEach((cost) => {
      if (statusMap[cost.status]) {
        statusMap[cost.status].count += 1;
        statusMap[cost.status].amount += cost.amount;
      }
    });

    // Convertir a array
    const statusData = Object.entries(statusMap).map(([status, data]) => ({
      status:
        status === "pending"
          ? "Pendiente"
          : status === "paid"
          ? "Pagado"
          : "Cancelado",
      count: data.count,
      amount: data.amount,
    }));

    setStatusDistribution(statusData);
  };

  // Función para transformar datos mensuales para el gráfico
  const getMonthlyChartData = () => {
    return monthlyData.map((item) => ({
      name: moment()
        .month(item.month - 1)
        .format("MMM"),
      total: item.total / 100, // Convertir de centavos a pesos
    }));
  };

  // Función para obtener datos de categorías para el gráfico
  const getCategoryChartData = () => {
    return categoryData.map((item) => ({
      name: item.category,
      total: item.total / 100, // Convertir de centavos a pesos
    }));
  };

  // Obtener años disponibles para selección (últimos 5 años)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  // Calcular estadísticas
  const getTotalExpenses = () => {
    return monthlyData.reduce((acc, item) => acc + item.total, 0) / 100;
  };

  const getAvgMonthlyExpense = () => {
    if (monthlyData.length === 0) return 0;
    const activeMonths = monthlyData.filter((m) => m.total > 0).length;
    return activeMonths > 0 ? getTotalExpenses() / activeMonths : 0;
  };

  const getMaxMonthExpense = () => {
    if (monthlyData.length === 0) return { month: "", amount: 0 };
    const maxMonth = monthlyData.reduce((prev, current) =>
      prev.total > current.total ? prev : current
    );
    return {
      month: moment()
        .month(maxMonth.month - 1)
        .format("MMMM"),
      amount: maxMonth.total / 100,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">
          Resumen Financiero de Mantenimiento
        </h2>
        <div className="flex items-center space-x-2">
          <label
            htmlFor="yearSelect"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Año:
          </label>
          <select
            id="yearSelect"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {getYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingApp />
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Gastos ({year})
              </h3>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(getTotalExpenses())}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {costs.length} gastos registrados
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                Promedio Mensual
              </h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getAvgMonthlyExpense())}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Por mes con actividad
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mayor Gasto Mensual
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(getMaxMonthExpense().amount)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getMaxMonthExpense().month} {year}
              </p>
            </div>
          </div>

          {/* Gráfico de gastos mensuales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
              Gastos Mensuales
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getMonthlyChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), "Monto"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366F1"
                    activeDot={{ r: 8 }}
                    name="Gasto Mensual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de gastos por categoría */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
              Gastos por Categoría
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getCategoryChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), "Monto"]}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#6366F1" name="Monto" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nuevas visualizaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Principales proveedores */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
                Principales Proveedores
              </h3>
              {topProviders.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProviders.map((item) => ({
                          name: item.provider,
                          value: item.total / 100,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {topProviders.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay datos de proveedores disponibles
                  </p>
                </div>
              )}
            </div>

            {/* Estado de pagos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
                Estado de Pagos
              </h3>
              {statusDistribution.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusDistribution.map((item) => ({
                        name: item.status,
                        monto: item.amount / 100,
                        cantidad: item.count,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          return name === "monto"
                            ? [formatCurrency(value), "Monto"]
                            : [value, "Cantidad"];
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="monto"
                        fill="#8884d8"
                        name="Monto"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="cantidad"
                        fill="#82ca9d"
                        name="Cantidad"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay datos de estados disponibles
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de resumen por categoría */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-medium text-gray-800 dark:text-white">
                Detalle por Categorías
              </h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Categoría
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Total Gastado
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      % del Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryData.map((item) => {
                    const totalAllCategories = categoryData.reduce(
                      (sum, cat) => sum + cat.total,
                      0
                    );
                    const percentage =
                      totalAllCategories > 0
                        ? ((item.total / totalAllCategories) * 100).toFixed(2)
                        : "0.00";

                    return (
                      <tr key={item.category}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatCurrency(item.total / 100)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {percentage}%
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1 dark:bg-gray-700">
                            <div
                              className="h-2 rounded-full bg-indigo-600"
                              style={{
                                width: `${percentage}%`,
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(
                        categoryData.reduce(
                          (sum, item) => sum + item.total,
                          0
                        ) / 100
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaintenanceCostSummary;
