import React, { useState } from "react";
import TicketDetail from "./TicketDetail";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";
import TicketMetrics from "./TicketMetrics";

const TicketsMain: React.FC = () => {
  const [showNewForm, setShowNewForm] = useState(false);

  return (
    <div className="w-full max-w-8xl mx-auto px-4">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600 mb-2">
              Gestión de Tickets
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sistema de administración de solicitudes y reportes de
              mantenimiento
            </p>
          </div>

          {!showNewForm && (
            <button
              className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 font-medium"
              onClick={() => setShowNewForm(true)}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Crear Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="mb-8">
        <TicketMetrics />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="order-2 lg:order-1">
          {showNewForm ? (
            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-100 dark:border-gray-800 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Nuevo Ticket
                </h3>
                <button
                  className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-1.5 text-sm shadow-sm border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none"
                  onClick={() => setShowNewForm(false)}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                  Cancelar
                </button>
              </div>
              <TicketForm onClose={() => setShowNewForm(false)} />
            </div>
          ) : (
            <TicketList />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <TicketDetail />
        </div>
      </div>
    </div>
  );
};

export default TicketsMain;
