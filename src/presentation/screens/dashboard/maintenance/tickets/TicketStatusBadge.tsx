import React from "react";

interface Props {
  status: "abierto" | "en_progreso" | "cerrado";
}

const statusConfig = {
  abierto: {
    bgClass: "bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900",
    hoverClass: "hover:from-amber-400 hover:to-amber-500",
    icon: (
      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
      </svg>
    ),
    label: "Abierto"
  },
  en_progreso: {
    bgClass: "bg-gradient-to-r from-blue-300 to-blue-400 text-blue-900",
    hoverClass: "hover:from-blue-400 hover:to-blue-500",
    icon: (
      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
      </svg>
    ),
    label: "En Progreso"
  },
  cerrado: {
    bgClass: "bg-gradient-to-r from-emerald-300 to-emerald-400 text-emerald-900",
    hoverClass: "hover:from-emerald-400 hover:to-emerald-500",
    icon: (
      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
      </svg>
    ),
    label: "Cerrado"
  }
};

const TicketStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.hoverClass} shadow-sm transition-all duration-200 ease-in-out border border-white/20`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default TicketStatusBadge;
