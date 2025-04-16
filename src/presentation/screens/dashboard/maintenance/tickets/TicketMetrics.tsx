import React, { useMemo } from "react";
import { useTicketsStore } from "./ticketsStore";

const TicketMetrics: React.FC = () => {
  const { tickets } = useTicketsStore();

  const metrics = useMemo(() => {
    const total = tickets.length;
    const abiertos = tickets.filter((t) => t.status !== "cerrado").length;
    const enProgreso = tickets.filter((t) => t.status === "en_progreso").length;
    const cerrados = tickets.filter((t) => t.status === "cerrado").length;
    
    // Calcular promedio de resolución (solo tickets cerrados con history)
    const resolvedTickets = tickets.filter(
      (t) => t.status === "cerrado" && Array.isArray(t.history) && (t.history?.length ?? 0) > 0
    );
    let avgTime = 0;
    if (resolvedTickets.length > 0) {
      const sum = resolvedTickets.reduce((acc, t) => {
        const historyArr = t.history ?? [];
        const created = historyArr[0]?.date ? new Date(historyArr[0].date).getTime() : 0;
        const closed = historyArr.find((h:any) => h.status === "cerrado");
        const closedDate = closed ? new Date(closed.date).getTime() : 0;
        return acc + (closedDate && created ? closedDate - created : 0);
      }, 0);
      avgTime = Math.round(sum / resolvedTickets.length / 1000 / 60 / 60); // en horas
    }
    
    return { total, abiertos, enProgreso, cerrados, avgTime };
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 transition duration-300 ease-in-out transform hover:translate-y-[-5px] hover:shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tickets totales</div>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-300 dark:to-indigo-400">{metrics.total}</div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 transition duration-300 ease-in-out transform hover:translate-y-[-5px] hover:shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tickets abiertos</div>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-300 dark:to-amber-400">{metrics.abiertos}</div>
            <div className="text-xs text-gray-400 mt-1">{metrics.total > 0 ? Math.round((metrics.abiertos / metrics.total) * 100) : 0}% del total</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 transition duration-300 ease-in-out transform hover:translate-y-[-5px] hover:shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">En progreso</div>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-300 dark:to-blue-400">{metrics.enProgreso}</div>
            <div className="text-xs text-gray-400 mt-1">{metrics.total > 0 ? Math.round((metrics.enProgreso / metrics.total) * 100) : 0}% del total</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-4 transition duration-300 ease-in-out transform hover:translate-y-[-5px] hover:shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tiempo promedio</div>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-300 dark:to-emerald-400">{metrics.avgTime}h</div>
            <div className="text-xs text-gray-400 mt-1">Resolución de tickets</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketMetrics;
