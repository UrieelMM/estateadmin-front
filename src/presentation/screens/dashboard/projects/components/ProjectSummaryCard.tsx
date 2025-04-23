import React from "react";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

interface ProjectSummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: "budget" | "money" | "calendar" | "clock";
  color: "blue" | "green" | "yellow" | "red" | "indigo";
}

const ProjectSummaryCard: React.FC<ProjectSummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
}) => {
  // Determinar el icono a mostrar
  const renderIcon = () => {
    const iconClasses = `h-8 w-8 ${getIconColorClass(color)}`;

    switch (icon) {
      case "budget":
        return <CurrencyDollarIcon className={iconClasses} />;
      case "money":
        return <BanknotesIcon className={iconClasses} />;
      case "calendar":
        return <CalendarIcon className={iconClasses} />;
      case "clock":
        return <ClockIcon className={iconClasses} />;
      default:
        return <CurrencyDollarIcon className={iconClasses} />;
    }
  };

  // Obtener las clases de color según el color proporcionado
  const getIconColorClass = (color: string): string => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "green":
        return "text-green-600";
      case "yellow":
        return "text-yellow-600";
      case "red":
        return "text-red-600";
      case "indigo":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };

  const getBackgroundColorClass = (color: string): string => {
    switch (color) {
      case "blue":
        return "bg-blue-50";
      case "green":
        return "bg-green-50";
      case "yellow":
        return "bg-yellow-50";
      case "red":
        return "bg-red-50";
      case "indigo":
        return "bg-indigo-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4 dark:bg-gray-800 dark:text-gray-100 dark:shadow-lg">
      <div className={`p-3 rounded-full ${getBackgroundColorClass(color)}`}>
        {renderIcon()}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};

export default ProjectSummaryCard;
