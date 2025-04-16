import React, { useState } from "react";
import { useTicketsStore, Ticket } from "./ticketsStore";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketForm from "./TicketForm";
import { motion } from "framer-motion";

const TicketDetail: React.FC = () => {
  const {
    activeTicket,
    setActiveTicket,
    updateTicket,
    deleteTicket,
    loading,
    error,
  } = useTicketsStore();
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<Ticket["status"]>(
    activeTicket?.status || "abierto"
  );

  if (!activeTicket) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80"></div>
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] bg-fixed opacity-20"></div>

        <div className="relative w-20 h-20 mb-6 text-indigo-500 dark:text-indigo-400">
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            ></path>
          </svg>
          <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center tracking-tight">
          Selecciona un ticket
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-6 text-center max-w-xs leading-relaxed">
          Elige un ticket de la lista para visualizar sus detalles y gestionarlo
        </p>

        <motion.div
          className="mt-2 flex gap-6 text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Ver detalles</span>
          </div>
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              ></path>
            </svg>
            <span>Editar ticket</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value as Ticket["status"];
    setStatus(newStatus);
    await updateTicket(activeTicket.id!, { status: newStatus });
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteTicket(activeTicket.id!);
    setActiveTicket(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl rounded-2xl p-0 min-h-[400px] border border-gray-100 dark:border-gray-700 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      {/* Encabezado */}
      <div className="relative p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                Ticket
              </h3>
              <div className="ml-3 px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-full flex items-center shadow-sm">
                #{activeTicket.id?.substring(0, 6) || ""}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creado el{" "}
              {activeTicket.createdAt instanceof Date
                ? activeTicket.createdAt.toLocaleDateString()
                : ""}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setActiveTicket(null)}
        >
          <svg
            className="w-4 h-4 mr-1.5"
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
          Cerrar
        </motion.button>
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6 flex items-center p-4 text-sm rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/30 shadow-sm"
        >
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      <div className="p-6 pt-0 flex flex-col gap-6">
        <div className="w-full mt-6">
          <div className="bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                INFORMACIÓN PRINCIPAL
              </h4>
              <TicketStatusBadge status={status} />
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                {activeTicket.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 border border-gray-100 dark:border-gray-700">
                {activeTicket.description}
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5 text-indigo-500 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  ></path>
                </svg>
                Etiquetas
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(activeTicket.tags) &&
                activeTicket.tags.length > 0 ? (
                  activeTicket.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-800/50 flex items-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-300 mr-1.5"></span>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No hay etiquetas
                  </span>
                )}
              </div>
            </div>

            {activeTicket.attachments &&
              activeTicket.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5 text-indigo-500 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      ></path>
                    </svg>
                    Archivos adjuntos ({activeTicket.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTicket.attachments.map((url, idx) => (
                      <motion.a
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-indigo-600 dark:text-indigo-300 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                      >
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg mr-3">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            ></path>
                          </svg>
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-gray-700 dark:text-gray-300 font-medium">
                            Archivo {idx + 1}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                            {url.split("/").pop()}
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          ></path>
                        </svg>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="w-full bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center mb-4">
            <svg
              className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
            DETALLES DEL TICKET
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Estado
              </label>
              <div className="flex items-center gap-2">
                <TicketStatusBadge status={status} />
                <select
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={status}
                  onChange={handleStatusChange}
                  disabled={loading}
                >
                  <option value="abierto">Abierto</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Prioridad
              </label>
              <div className="flex items-center px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 font-medium capitalize">
                <svg
                  className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  ></path>
                </svg>
                {activeTicket.priority || "No asignada"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Creado por
                </label>
                <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 truncate">
                  {activeTicket.createdBy}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Asignado a
                </label>
                <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 truncate">
                  {activeTicket.assignedTo || "No asignado"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Creado
                </label>
                <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
                  {activeTicket.createdAt instanceof Date
                    ? activeTicket.createdAt.toLocaleString()
                    : ""}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Actualizado
                </label>
                <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
                  {activeTicket.updatedAt instanceof Date
                    ? activeTicket.updatedAt.toLocaleString()
                    : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-8 mt-6 px-6">
        <button
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          onClick={() => setEditMode(true)}
          disabled={loading}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            ></path>
          </svg>
          Editar Ticket
        </button>
        <button
          className="flex items-center bg-white hover:bg-red-50 text-red-600 border border-red-300 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm dark:bg-gray-800 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-700/50"
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
          Eliminar Ticket
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="text-center mb-5">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Confirmar eliminación
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ¿Estás seguro de que deseas eliminar este ticket? Esta acción no
                se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 font-medium text-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editMode && (
        <div className="mt-4">
          <TicketForm
            initialTicket={activeTicket}
            onClose={() => setEditMode(false)}
          />
        </div>
      )}
      {/* Historial de actividad */}
      {Array.isArray(activeTicket.history) &&
        activeTicket.history.length > 0 && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide mb-5 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Historial de actividad
            </h4>

            <div className="flow-root">
              <ol className="relative border-l-2 border-indigo-200 dark:border-indigo-700 ml-3 space-y-5">
                {activeTicket.history.map((h, idx) => (
                  <li key={idx} className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-full -left-3 ring-4 ring-white dark:ring-gray-800">
                      {h.action.toLowerCase().includes("creación") ? (
                        <svg
                          className="w-3 h-3 text-indigo-600 dark:text-indigo-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      ) : h.status === "cerrado" ? (
                        <svg
                          className="w-3 h-3 text-green-600 dark:text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      ) : h.status === "en_progreso" ? (
                        <svg
                          className="w-3 h-3 text-blue-600 dark:text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 5.477V14a1 1 0 11-2 0V2a1 1 0 011-1z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 text-gray-600 dark:text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      )}
                    </span>

                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {h.action}
                          {h.status && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 capitalize">
                              {h.status.replace("_", " ")}
                            </span>
                          )}
                        </h3>
                        <time className="text-xs text-gray-500 dark:text-gray-400">
                          {h.date ? new Date(h.date).toLocaleString() : ""}
                        </time>
                      </div>

                      {h.user && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <svg
                            className="w-4 h-4 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          {h.user}
                        </div>
                      )}

                      {h.comment && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {h.comment}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default TicketDetail;
