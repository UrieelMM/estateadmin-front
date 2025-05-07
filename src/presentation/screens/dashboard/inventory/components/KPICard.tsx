import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color,
  onClick,
}) => {
  return (
    <div
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${color} ${
        onClick ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {value}
          </p>
        </div>
        <div className="rounded-full p-3 bg-gray-100 dark:bg-gray-700">
          <i className={`fas ${icon} text-gray-600 dark:text-gray-400`}></i>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
