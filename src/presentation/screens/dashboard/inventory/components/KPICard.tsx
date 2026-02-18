import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  hint?: string;
  onClick?: () => void;
}

const colorMap: Record<string, { icon: string; ring: string; bg: string; text: string; border: string; }> = {
  indigo: { icon: "text-indigo-500", ring: "ring-indigo-100 dark:ring-indigo-900", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-t-indigo-500" },
  emerald: { icon: "text-emerald-500", ring: "ring-emerald-100 dark:ring-emerald-900", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-t-emerald-500" },
  amber: { icon: "text-amber-500", ring: "ring-amber-100 dark:ring-amber-900", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", border: "border-t-amber-500" },
  rose: { icon: "text-rose-500", ring: "ring-rose-100 dark:ring-rose-900", bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", border: "border-t-rose-500" },
  slate: { icon: "text-slate-500", ring: "ring-slate-100 dark:ring-slate-900", bg: "bg-slate-50 dark:bg-slate-900/30", text: "text-slate-600 dark:text-slate-400", border: "border-t-slate-500" },
};

const KPICard: React.FC<KPICardProps> = ( { title, value, icon, color, hint, onClick } ) => {
  const theme = colorMap[ color ] ?? colorMap.indigo;

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
      { hint && !onClick && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{ hint }</p>
      ) }
    </div>
  );
};

export default KPICard;
