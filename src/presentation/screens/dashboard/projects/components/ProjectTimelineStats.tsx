import React from "react";
import {
  Project,
  ProjectExpense,
  ProjectQuote,
} from "../../../../../store/projectStore";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";

interface ProjectTimelineStatsProps {
  project: Project;
  expenses: ProjectExpense[];
  quotes: ProjectQuote[];
}

const ProjectTimelineStats: React.FC<ProjectTimelineStatsProps> = ({
  project,
  expenses,
  quotes,
}) => {
  // Calcular estadísticas
  const totalQuotes = quotes.length;
  const selectedQuotes = quotes.filter((q) => q.isSelected).length;
  const totalExpenses = expenses.length;
  const significantExpenses = expenses.filter(
    (expense) => expense.amount >= project.initialBudget * 0.1
  ).length;

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetUsedPercent = (totalSpent / project.initialBudget) * 100;

  // Calcular días desde el inicio
  const startDate = new Date(project.createdAt);
  const today = new Date();
  const daysActive = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    {
      name: "Cotizaciones",
      value: `${selectedQuotes}/${totalQuotes}`,
      subtitle: "Seleccionadas/Total",
      icon: DocumentTextIcon,
      color: "blue",
    },
    {
      name: "Gastos Registrados",
      value: totalExpenses.toString(),
      subtitle: `${significantExpenses} significativos`,
      icon: CurrencyDollarIcon,
      color: "green",
    },
    {
      name: "Presupuesto Usado",
      value: `${budgetUsedPercent.toFixed(1)}%`,
      subtitle: `$${totalSpent.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
      icon: CheckBadgeIcon,
      color:
        budgetUsedPercent > 90
          ? "red"
          : budgetUsedPercent > 75
          ? "yellow"
          : "green",
    },
    {
      name: "Días Activo",
      value: daysActive.toString(),
      subtitle: project.status === "completed" ? "Finalizado" : "En progreso",
      icon: ClockIcon,
      color: "indigo",
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900",
      green:
        "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900",
      yellow:
        "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900",
      red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900",
      indigo:
        "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900",
    };
    return classes[color as keyof typeof classes];
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stat.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stat.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectTimelineStats;
