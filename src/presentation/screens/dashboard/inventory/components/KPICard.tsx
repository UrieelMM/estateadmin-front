import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onClick?: () => void;
}

const colorMap: Record<string, { icon: string; ring: string; bg: string; text: string; border: string; }> = {
  "border-blue-500": { icon: "text-blue-500", ring: "ring-blue-100 dark:ring-blue-900", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-t-blue-500" },
  "border-green-500": { icon: "text-green-500", ring: "ring-green-100 dark:ring-green-900", bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", border: "border-t-green-500" },
  "border-red-500": { icon: "text-red-500", ring: "ring-red-100 dark:ring-red-900", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", border: "border-t-red-500" },
  "border-yellow-500": { icon: "text-yellow-500", ring: "ring-yellow-100 dark:ring-yellow-900", bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-t-yellow-500" },
};

const KPICard: React.FC<KPICardProps> = ( { title, value, icon, color, onClick } ) => {
  const theme = colorMap[ color ] ?? colorMap[ "border-blue-500" ];

  return (
    <div
      className={ `relative overflow-hidden p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md border-t-4 ${ theme.border } ${ onClick ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5" : ""
        } transition-all duration-200` }
      onClick={ onClick }
    >
      {/* Background decoration */ }
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 bg-current" />

      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            { title }
          </p>
          <p className={ `text-3xl font-extrabold ${ theme.text } truncate` }>
            { value }
          </p>
        </div>
        <div className={ `flex-shrink-0 ml-4 w-14 h-14 rounded-2xl ${ theme.bg } ring-4 ${ theme.ring } flex items-center justify-center` }>
          <i className={ `fas ${ icon } text-xl ${ theme.icon }` } />
        </div>
      </div>

      { onClick && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <i className="fas fa-arrow-right text-[10px]" />
          Ver detalles
        </p>
      ) }
    </div>
  );
};

export default KPICard;
