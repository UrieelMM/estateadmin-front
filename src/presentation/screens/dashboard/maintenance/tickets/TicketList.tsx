import React, { useEffect, useState } from "react";
import { useTicketsStore } from "./ticketsStore";
import TicketStatusBadge from "./TicketStatusBadge";

const tagOptions = ["Incidente", "Mantenimiento", "Sugerencia", "Otro"] as const;

const TicketList: React.FC = () => {
  const {
    tickets,
    loading,
    error,
    fetchTickets,
    hasMore,
    setActiveTicket,
    activeTicket,
  } = useTicketsStore();
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mainTicketId, setMainTicketId] = useState<string>("");
  const pageSize = 10;

  useEffect(() => {
    fetchTickets({}, pageSize * page);
    // eslint-disable-next-line
  }, [page]);

  const handleSelect = (ticket: any) => {
    setActiveTicket(ticket);
  };

  const handleRefresh = () => {
    fetchTickets({}, pageSize * page);
  };

  // Filtrar tickets por tags seleccionados
  const filteredTickets = selectedTags.length > 0
    ? tickets.filter(t => Array.isArray(t.tags) && selectedTags.every(tag => t.tags?.includes(tag)))
    : tickets;

  const handleCheckbox = (id: string) => {
    setSelectedTickets(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const openMergeModal = () => {
    setMainTicketId(selectedTickets[0] || "");
    setShowMergeModal(true);
  };

  const closeMergeModal = () => {
    setShowMergeModal(false);
    setMainTicketId("");
  };

  // Lógica real de merge
  const { mergeTickets } = useTicketsStore();
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const handleMerge = async () => {
    if (!mainTicketId || selectedTickets.length < 2) return;
    setMergeLoading(true);
    setMergeError(null);
    try {
      await mergeTickets(mainTicketId, selectedTickets);
      closeMergeModal();
      setSelectedTickets([]);
    } catch (err: any) {
      setMergeError(err.message || 'Error al fusionar tickets');
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-5 border border-gray-100 dark:border-gray-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tickets</h3>
        <button
          className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleRefresh}
          disabled={loading}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refrescar
        </button>
      </div>
      {/* Filtro de tags */}
      <div className="mb-5">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por categoría:</div>
        <div className="flex flex-wrap gap-2">
          {tagOptions.map(tag => (
            <button
              key={tag}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 font-medium shadow-sm ${
                selectedTags.includes(tag)
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-200 dark:shadow-none"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
              }`}
              onClick={() =>
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      {/* Botón Merge */}
      {selectedTickets.length > 1 && (
        <div className="mb-4">
          <button
            className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-3 py-2 text-sm rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            onClick={openMergeModal}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
            </svg>
            Fusionar ({selectedTickets.length}) tickets
          </button>
        </div>
      )}
      {/* Modal de confirmación de merge */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[320px] relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={closeMergeModal}
            >
              &times;
            </button>
            <h4 className="text-lg font-bold mb-4">Fusionar Tickets</h4>
            <div className="mb-2 text-sm">Selecciona el ticket principal (conservará los datos principales):</div>
            <div className="space-y-2 mb-4">
              {selectedTickets.map(id => {
                const ticket = tickets.find(t => t.id === id);
                return ticket ? (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mainTicket"
                      value={id}
                      checked={mainTicketId === id}
                      onChange={() => setMainTicketId(id as string)}
                      className="accent-indigo-600"
                    />
                    <span className="font-medium">{ticket.title}</span>
                    <span className="text-xs text-gray-500">({ticket.id})</span>
                  </label>
                ) : null;
              })}
            </div>
            {mergeError && <div className="text-red-500 text-xs mb-2">{mergeError}</div>}
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary px-3 py-1 text-xs" onClick={closeMergeModal} disabled={mergeLoading}>Cancelar</button>
              <button
                className="btn-primary px-3 py-1 text-xs"
                onClick={handleMerge}
                disabled={!mainTicketId || mergeLoading}
              >
                {mergeLoading ? 'Fusionando...' : 'Confirmar Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-6 text-indigo-600 dark:text-indigo-400">
          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando tickets...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center p-4 mb-4 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
          {error}
        </div>
      )}
      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-gray-500 dark:text-gray-300 text-sm">
          <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p>No hay tickets registrados.</p>
        </div>
      )}
      <div className="overflow-hidden">
        <ul className="space-y-3 mb-4">
          {filteredTickets.filter(t => !!t.id).map((ticket) => (
            <li
              key={ticket.id}
              className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${activeTicket?.id === ticket.id 
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-gray-800/70" 
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="flex items-start">
                {/* Checkbox selección múltiple */}
                <div className="flex-shrink-0 mr-3 pt-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-600"
                    checked={selectedTickets.includes(ticket.id as string)}
                    onChange={() => handleCheckbox(ticket.id as string)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => handleSelect(ticket)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate pr-2">{ticket.title}</h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {ticket.createdAt instanceof Date ? ticket.createdAt.toLocaleDateString() : ""}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                      </svg>
                      <span className="font-medium capitalize">{ticket.priority || "-"}</span>
                    </div>
                    
                    <TicketStatusBadge status={ticket.status} />
                    
                    {/* Mostrar tags */}
                    {Array.isArray(ticket.tags) && ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {ticket.providerId && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span>Proveedor</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between items-center mt-6 px-2">
        <button
          className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Anterior
        </button>
        
        <div className="px-4 py-2 rounded-lg bg-indigo-50 dark:bg-gray-800 text-sm font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-gray-700">
          Página {page}
        </div>
        
        <button
          className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
          disabled={!hasMore || loading}
        >
          Siguiente
          <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TicketList;
