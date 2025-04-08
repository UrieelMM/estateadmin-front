import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ProjectBudgetChartProps {
  initialBudget: number;
  currentBudget: number;
}

const ProjectBudgetChart: React.FC<ProjectBudgetChartProps> = ({
  initialBudget,
  currentBudget,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Calcular el presupuesto usado
  const usedBudget = initialBudget - currentBudget;

  // Formatear los valores para mostrar
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (chartRef.current) {
      // Destruir el gráfico anterior si existe
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Crear el contexto del gráfico
      const ctx = chartRef.current.getContext("2d");

      if (ctx) {
        // Crear el nuevo gráfico
        chartInstanceRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Presupuesto Utilizado", "Presupuesto Restante"],
            datasets: [
              {
                data: [usedBudget, currentBudget],
                backgroundColor: ["#F5A4A4", "#818CF8"],
                borderWidth: 0,
              },
            ],
          },
          options: {
            cutout: "70%",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                  padding: 20,
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || "";
                    const value = context.raw as number;
                    const percentage = ((value / initialBudget) * 100).toFixed(
                      1
                    );
                    return `${label}: ${formatCurrency(
                      value
                    )} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }
    }

    // Limpiar gráfico al desmontar el componente
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [initialBudget, currentBudget, usedBudget]);

  return (
    <div className="relative h-full">
      <canvas ref={chartRef} className="w-full h-full" />

      {/* Centro del donut chart - Información resumida */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Utilizado</p>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-100">
            {((usedBudget / initialBudget) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(usedBudget)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectBudgetChart;
