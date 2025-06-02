import React, { useState, useEffect } from "react";
import { useTicketsStore, Ticket } from "./ticketsStore";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketForm from "./TicketForm";
import TicketTimeline from "./TicketTimeline";
import { motion } from "framer-motion";
import {
  usePersonalAdministrationStore,
  PersonalProfile,
} from "../../../../../store/PersonalAdministration";
import useProviderStore from "../../../../../store/providerStore";

const TicketDetail: React.FC = () => {
  const {
    activeTicket,
    setActiveTicket,
    updateTicket,
    deleteTicket,
    loading,
    tickets,
  } = useTicketsStore();

  const { employees, fetchEmployees } = usePersonalAdministrationStore();
  const { providers, fetchProviders } = useProviderStore();

  // Función helper para obtener el nombre del empleado o proveedor asignado
  const getAssignedEmployeeName = (assignedTo: string | undefined): string => {
    if (!assignedTo) return "No asignado";

    // Primero buscar en empleados
    const employee = employees.find(
      (emp: PersonalProfile) => emp.id === assignedTo
    );

    if (employee) {
      return `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
    }

    // Si no es un empleado, buscar en proveedores
    const provider = providers.find((prov) => prov.id === assignedTo);

    if (provider) {
      return `${provider.name} (Proveedor)`;
    }

    // Si no se encuentra ni como empleado ni como proveedor, mostrar el valor original
    // (podría ser un email o nombre ya formateado)
    return assignedTo;
  };

  // Cargar empleados y proveedores al montar el componente
  useEffect(() => {
    fetchEmployees();
    fetchProviders();
  }, [fetchEmployees, fetchProviders]);

  function renderMergedTimeline(activeTicket: Ticket, tickets: Ticket[]) {
    console.log("TicketDetail - activeTicket:", activeTicket);
    console.log("TicketDetail - activeTicket.history:", activeTicket.history);

    // Verificar si activeTicket.history está inicializado correctamente
    if (!activeTicket.history) {
      console.warn("El historial del ticket está vacío o undefined");
    }

    // Asegurarse de que history sea un array
    let mergedHistory = Array.isArray(activeTicket.history)
      ? [...activeTicket.history]
      : [];
    let mergedTags = [...(activeTicket.tags || [])];
    let mergedInfo: { title: string; description: string; id: string }[] = [];

    // Manejar tickets fusionados
    if (activeTicket.mergedFrom && activeTicket.mergedFrom.length > 0) {
      console.log("Ticket tiene mergedFrom:", activeTicket.mergedFrom);
      for (const mergedId of activeTicket.mergedFrom) {
        const mergedTicket = tickets.find((t) => t.id === mergedId);
        if (mergedTicket) {
          mergedHistory.push({
            date: mergedTicket.updatedAt || mergedTicket.createdAt,
            action: "merge",
            user: mergedTicket.createdBy,
            comment: `Ticket fusionado: ${mergedTicket.title}`,
          });
          mergedInfo.push({
            title: mergedTicket.title,
            description: mergedTicket.description,
            id: mergedTicket.id || "",
          });

          // Verificar si el ticket fusionado tiene historial
          if (mergedTicket.history && mergedTicket.history.length > 0) {
            console.log(
              `Añadiendo historial del ticket fusionado ${mergedId}:`,
              mergedTicket.history
            );
            mergedHistory = mergedHistory.concat(mergedTicket.history);
          }

          mergedTags = mergedTags.concat(mergedTicket.tags || []);
        }
      }
      mergedTags = Array.from(new Set(mergedTags));
    }

    // Asegurarse de que todas las fechas sean objetos Date para ordenar correctamente
    mergedHistory = mergedHistory.map((item) => {
      if (typeof item.date === "string") {
        return { ...item, date: new Date(item.date) };
      }
      return item;
    });

    // Ordenar por fecha
    mergedHistory.sort((a, b) => {
      const dateA =
        a.date instanceof Date ? a.date : new Date(a.date as string);
      const dateB =
        b.date instanceof Date ? b.date : new Date(b.date as string);
      return dateA.getTime() - dateB.getTime();
    });

    console.log("TicketDetail - mergedHistory final:", mergedHistory);
    console.log("TicketDetail - mergedHistory length:", mergedHistory.length);

    return mergedHistory.length > 0 ? (
      <>
        {mergedInfo.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-bold">
              Tickets fusionados:
            </div>
            <ul className="list-disc ml-5">
              {mergedInfo.map((info, idx) => (
                <li key={info.id + idx} className="mb-1">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                    {info.title}
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                    {info.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-transparent border-b-2 border-indigo-700 dark:border-indigo-100 mb-4 text-sm text-indigo-700 dark:text-indigo-100 flex items-center font-medium transition-colors relative"
          >
            {/* Indicador de actualización reciente */}
            {activeTicket?.history &&
              activeTicket.history.length > 0 &&
              (() => {
                const lastEntry =
                  activeTicket.history[activeTicket.history.length - 1];
                const lastEntryTime =
                  lastEntry.date instanceof Date
                    ? lastEntry.date.getTime()
                    : new Date(lastEntry.date as string).getTime();
                const isRecentUpdate = Date.now() - lastEntryTime < 60000; // 1 minuto

                return (
                  isRecentUpdate && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )
                );
              })()}

            {showHistory ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Ocultar Historial
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Mostrar Historial
              </>
            )}
          </button>
        </div>

        {showHistory && <TicketTimeline history={mergedHistory} />}
      </>
    ) : (
      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
        No hay historial de actividad para este ticket.
      </div>
    );
  }

  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Efecto para mostrar automáticamente el historial después de una edición
  useEffect(() => {
    if (activeTicket?.history && activeTicket.history.length > 0) {
      // Verificar si la última entrada del historial es reciente (menos de 3 segundos)
      const lastEntry = activeTicket.history[activeTicket.history.length - 1];
      const lastEntryTime =
        lastEntry.date instanceof Date
          ? lastEntry.date.getTime()
          : new Date(lastEntry.date as string).getTime();

      const isRecentUpdate = Date.now() - lastEntryTime < 3000; // 3 segundos

      // Si se acaba de hacer una actualización, mostrar automáticamente el historial
      if (isRecentUpdate && !showHistory) {
        setShowHistory(true);
      }
    }
  }, [activeTicket?.history]);
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
                {activeTicket.folio ||
                  `#${activeTicket.id?.substring(0, 6) || ""}`}
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
      {/* Se eliminó el mensaje de error visual ya que ahora se muestra como toast */}

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
                        className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-indigo-600 dark:text-indigo-300 text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md"
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
                  {activeTicket.createdByEmail || activeTicket.createdBy}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Asignado a
                </label>
                <div className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 truncate">
                  {getAssignedEmployeeName(activeTicket.assignedTo)}
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
      {/* Timeline moderno y tags a la izquierda, descripciones a la derecha */}
      <div className="mt-8">{renderMergedTimeline(activeTicket, tickets)}</div>
    </motion.div>
  );
};

export default TicketDetail;
