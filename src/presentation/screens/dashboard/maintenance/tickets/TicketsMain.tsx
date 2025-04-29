import React, { useState } from "react";
import TicketDetail from "./TicketDetail";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";
import TicketMetrics from "./TicketMetrics";
import { useTicketsStore } from "./ticketsStore";
import toast from "react-hot-toast";

const TicketsMain: React.FC = () => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchFolio, setSearchFolio] = useState("");
  const { searchTicketByFolio, loading, fetchTickets } = useTicketsStore();

  return (
    <div className="w-full max-w-8xl mx-auto px-4">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500">
              Gestión de Tickets
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sistema de administración de solicitudes y reportes de
              mantenimiento
            </p>
          </div>

          {!showNewForm && (
            <button
              className="flex items-center bg-gradient-to-r bg-indigo-600  hover:bg-indigo-700  text-white px-2 py-1.5 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 text-sm focus:ring-indigo-500 focus:ring-opacity-50 font-medium "
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

      {/* Buscador de tickets por folio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="mb-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-md p-4 flex items-center">
          <div className="flex-grow flex items-center justify-start space-x-2">
            <div className="relative flex-grow max-w-lg">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                placeholder="Buscar ticket por folio (ej: EA-ABC123)"
                value={searchFolio}
                onChange={(e) => setSearchFolio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchFolio.trim()) {
                    searchTicketByFolio(searchFolio.trim());
                  }
                }}
              />
            </div>
            <button
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => {
                if (searchFolio.trim()) {
                  searchTicketByFolio(searchFolio.trim());
                } else {
                  toast.error("Ingresa un folio para buscar");
                }
              }}
              disabled={loading || !searchFolio.trim()}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Buscando...
                </>
              ) : (
                <>Buscar</>
              )}
            </button>
            <button
              className="flex items-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg shadow-md transition-colors duration-200"
              onClick={() => {
                setSearchFolio("");
                fetchTickets();
              }}
              title="Limpiar búsqueda y mostrar todos los tickets"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div></div>
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
                  className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 text-sm shadow-sm border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none"
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
