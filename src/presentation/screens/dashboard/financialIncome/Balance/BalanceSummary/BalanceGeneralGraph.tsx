// src/components/BalanceGeneral/BalanceGeneralGraph.tsx
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "../../../../../../context/Theme/ThemeContext";

interface IncomeMonthlyStat {
  month: string;
  paid: number;
  saldo: number;
  creditUsed: number;
}

interface ExpenseMonthlyStat {
  month: string;
  spent: number;
}

interface BalanceGeneralGraphProps {
  incomesMonthlyStats: IncomeMonthlyStat[];
  expensesMonthlyStats: ExpenseMonthlyStat[];
}

const monthNames: Record<string, string> = {
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

const BalanceGeneralGraph: React.FC<BalanceGeneralGraphProps> = ({
  incomesMonthlyStats,
  expensesMonthlyStats,
}) => {
  const { isDarkMode } = useTheme();
  const chartColors = {
    income: {
      color1: "#818CF8",
      color2: "#6366F1",
    },
    expense: {
      color1: "#F5A4A4",
      color2: "#E56666",
    },
    balance: {
      positive: {
        color1: "#98D7A5",
        color2: "#6BAF78",
      },
      negative: {
        color1: "#F5A4A4",
        color2: "#E56666",
      },
    },
  };

  // Formateador para moneda
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Formateador para valores grandes (eje Y)
  const formatLargeValues = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`;
    } else {
      return `$${value}`;
    }
  };

  // Combina la data por mes para formar la serie comparativa
  const data = incomesMonthlyStats.map((incomeStat) => {
    const expenseStat = expensesMonthlyStats.find(
      (exp) => exp.month === incomeStat.month
    ) || {
      spent: 0,
    };

    const ingresos = incomeStat.paid + incomeStat.saldo - incomeStat.creditUsed;
    const egresos = expenseStat.spent;
    const balance = ingresos - egresos;

    return {
      month: monthNames[incomeStat.month] || incomeStat.month,
      ingresos: ingresos,
      egresos: egresos,
      balance: balance,
    };
  });

  return (
    <div className="bg-white shadow rounded p-4 mb-6 dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-4 dark:text-gray-100">
        Comparativa Mensual
      </h3>
      <div style={{ width: "100%", height: 500 }}>
        <ReactECharts
          option={{
            backgroundColor: isDarkMode ? "#1f2937" : "transparent",
            tooltip: {
              trigger: "item",
              formatter: function (params: any) {
                if (!params || !params.data) return "";

                const { month, ingresos, egresos, balance } = params.data;
                return `
                  <div style="padding: 4px 8px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">${month}</div>
                    <div>Ingresos: ${formatCurrency(ingresos)}</div>
                    <div>Egresos: ${formatCurrency(egresos)}</div>
                    <div style="margin-top: 8px; font-weight: bold; color: ${
                      balance >= 0 ? "#6BAF78" : "#E56666"
                    }">
                      Balance: ${formatCurrency(balance)}
                    </div>
                  </div>
                `;
              },
              backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
              borderColor: isDarkMode ? "#414141" : "#d9d9d9",
              textStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 14,
              },
            },
            grid: {
              left: "5%",
              right: "5%",
              bottom: "15%",
              top: "15%",
              containLabel: true,
            },
            legend: {
              data: ["Ingresos", "Egresos"],
              textStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
              },
              bottom: 5,
              icon: "circle",
              itemGap: 20,
            },
            xAxis: {
              type: "category",
              data: data.map((item) => item.month),
              axisLabel: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 13,
                interval: 0,
                rotate: 45,
                margin: 14,
              },
              axisLine: {
                lineStyle: {
                  color: isDarkMode ? "#ffffff" : "#d9d9d9",
                  opacity: isDarkMode ? 0.5 : 1,
                },
              },
              axisTick: {
                alignWithLabel: true,
              },
            },
            yAxis: {
              type: "value",
              name: "Monto",
              nameLocation: "middle",
              nameGap: 65,
              nameTextStyle: {
                color: isDarkMode ? "#ffffff" : "#1f2937",
                padding: [0, 0, 8, 0],
                align: "center",
                verticalAlign: "middle",
              },
              axisLabel: {
                formatter: (value: number) => formatLargeValues(value),
                color: isDarkMode ? "#ffffff" : "#1f2937",
                fontSize: 13,
                margin: 14,
              },
              axisLine: {
                lineStyle: {
                  color: isDarkMode ? "#ffffff" : "#d9d9d9",
                  opacity: isDarkMode ? 0.5 : 1,
                },
              },
              splitLine: {
                lineStyle: {
                  type: "dashed",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb",
                },
              },
            },
            series: [
              {
                name: "Ingresos",
                type: "scatter",
                symbolSize: function (data: number) {
                  return Math.max(Math.sqrt(data) * 0.8, 15);
                },
                data: data.map((item) => ({
                  value: item.ingresos,
                  month: item.month,
                  ingresos: item.ingresos,
                  egresos: item.egresos,
                  balance: item.balance,
                })),
                itemStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: chartColors.income.color1 },
                      { offset: 1, color: chartColors.income.color2 },
                    ],
                    global: false,
                  },
                  borderWidth: 0,
                  shadowColor: "rgba(0, 0, 0, 0.3)",
                  shadowBlur: 10,
                },
                label: {
                  show: false,
                },
              },
              {
                name: "Egresos",
                type: "scatter",
                symbolSize: function (data: number) {
                  return Math.max(Math.sqrt(data) * 0.8, 15);
                },
                data: data.map((item) => ({
                  value: item.egresos,
                  month: item.month,
                  ingresos: item.ingresos,
                  egresos: item.egresos,
                  balance: item.balance,
                })),
                itemStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: chartColors.expense.color1 },
                      { offset: 1, color: chartColors.expense.color2 },
                    ],
                    global: false,
                  },
                  borderWidth: 0,
                  shadowColor: "rgba(0, 0, 0, 0.3)",
                  shadowBlur: 10,
                },
                label: {
                  show: false,
                },
              },
              {
                name: "Balance",
                type: "scatter",
                symbolSize: function (data: any) {
                  const value = Math.abs(data.balance);
                  return Math.max(Math.sqrt(value) * 0.8, 15);
                },
                data: data.map((item) => ({
                  value: Math.abs(item.balance),
                  month: item.month,
                  ingresos: item.ingresos,
                  egresos: item.egresos,
                  balance: item.balance,
                })),
                itemStyle: {
                  color: function (params: any) {
                    const balance = params.data.balance;
                    return {
                      type: "radial",
                      x: 0.5,
                      y: 0.5,
                      r: 0.5,
                      colorStops:
                        balance >= 0
                          ? [
                              {
                                offset: 0,
                                color: chartColors.balance.positive.color1,
                              },
                              {
                                offset: 1,
                                color: chartColors.balance.positive.color2,
                              },
                            ]
                          : [
                              {
                                offset: 0,
                                color: chartColors.balance.negative.color1,
                              },
                              {
                                offset: 1,
                                color: chartColors.balance.negative.color2,
                              },
                            ],
                      global: false,
                    };
                  },
                  borderWidth: 0,
                  shadowColor: "rgba(0, 0, 0, 0.3)",
                  shadowBlur: 10,
                },
                label: {
                  show: false,
                },
              },
            ],
            animation: true,
            animationDuration: 1000,
            animationEasing: "elasticOut",
            hoverLayerThreshold: 3000,
            progressive: 500,
            progressiveThreshold: 3000,
            textStyle: {
              color: isDarkMode ? "#ffffff" : "#1f2937",
            },
          }}
          style={{ height: "100%", width: "100%" }}
          opts={{
            renderer: "canvas",
            devicePixelRatio: window.devicePixelRatio || 2,
          }}
        />
      </div>
    </div>
  );
};

export default BalanceGeneralGraph;
