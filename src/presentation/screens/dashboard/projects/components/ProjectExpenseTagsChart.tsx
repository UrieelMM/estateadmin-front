import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { ProjectExpense } from "../../../../../store/projectStore";

interface ProjectExpenseTagsChartProps {
  expenses: ProjectExpense[];
}

const ProjectExpenseTagsChart: React.FC<ProjectExpenseTagsChartProps> = ({
  expenses,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

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

  // Calcular totales por etiquetas
  const calculateTagTotals = () => {
    const tagTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      expense.tags.forEach((tag) => {
        // Distribuir el monto equitativamente entre todas las etiquetas del gasto
        const amountPerTag = expense.amount / expense.tags.length;

        if (tagTotals[tag]) {
          tagTotals[tag] += amountPerTag;
        } else {
          tagTotals[tag] = amountPerTag;
        }
      });
    });

    return tagTotals;
  };

  useEffect(() => {
    if (chartRef.current) {
      // Destruir el gráfico anterior si existe
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const tagTotals = calculateTagTotals();

      // Si no hay datos, no renderizar el gráfico
      if (Object.keys(tagTotals).length === 0) {
        return;
      }

      // Preparar datos para el gráfico
      const labels = Object.keys(tagTotals).map((tag) => getTagLabel(tag));
      const data = Object.values(tagTotals);

      // Colores para las diferentes categorías
      const backgroundColors = [
        "#818CF8", // blue
        "#F5A4A4", // orange
        "#98D7A5", // green
        "#8b5cf6", // purple
        "#ff9770", // pink
        "#f59e0b", // amber
        "#ef4444", // red
        "#14b8a6", // teal
        "#6366f1", // indigo
        "#84cc16", // lime
      ];

      // Crear el contexto del gráfico
      const ctx = chartRef.current.getContext("2d");

      if (ctx) {
        // Crear el nuevo gráfico
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Monto por Categoría",
                data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 0,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y", // Gráfico horizontal
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `$${value.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  callback: (value) => {
                    return `$${Number(value).toLocaleString("es-MX", {
                      minimumFractionDigits: 0,
                    })}`;
                  },
                },
              },
              y: {
                grid: {
                  display: false,
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
  }, [expenses]);

  // Si no hay gastos, mostrar mensaje
  if (expenses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          No hay datos disponibles para mostrar
        </p>
      </div>
    );
  }

  return <canvas ref={chartRef} className="w-full h-full" />;
};

export default ProjectExpenseTagsChart;
