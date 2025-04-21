import React from "react";
import { TicketHistoryItem, TicketHistoryAction } from "./ticketsStore";

interface TicketTimelineProps {
  history: TicketHistoryItem[];
}

// Función para formatear correctamente fechas de Firestore (Timestamp) o cualquier otro formato
const formatDate = (date: any): { day: string; time: string } => {
  try {
    // Preparar la fecha dependiendo del formato recibido
    let dateObj;

    // Caso 1: Es un objeto Timestamp de Firestore (tiene seconds y nanoseconds)
    if (date && typeof date === "object" && "seconds" in date) {
      dateObj = new Date(date.seconds * 1000);
    }
    // Caso 2: Es un objeto Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Caso 3: Es un string con formato de fecha
    else if (typeof date === "string") {
      dateObj = new Date(date);
    } else {
      return { day: "Fecha", time: "no disponible" };
    }

    // Formatear día y mes
    const day = dateObj.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Formatear hora
    const time = dateObj.toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { day, time };
  } catch (error) {
    console.error("Error al formatear fecha:", date, error);
    return { day: "Fecha", time: "inválida" };
  }
};

/**
 * Componente que renderiza el icono correspondiente a cada tipo de acción del historial
 * con un diseño moderno y animaciones sutiles para mejorar la experiencia de usuario
 */
const TimelineIcon: React.FC<{ action: TicketHistoryAction }> = ({
  action,
}) => {
  const getIconProps = () => {
    switch (action) {
      case "created":
        return {
          bgColor: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          ),
          label: "Creación",
        };
      case "status_changed":
        return {
          bgColor: "bg-gradient-to-br from-indigo-400 to-indigo-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          label: "Estado",
        };
      case "comment_added":
        return {
          bgColor: "bg-gradient-to-br from-amber-400 to-amber-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          ),
          label: "Comentario",
        };
      case "merge":
        return {
          bgColor: "bg-gradient-to-br from-purple-400 to-purple-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
          ),
          label: "Fusión",
        };
      case "files_added":
        return {
          bgColor: "bg-gradient-to-br from-green-400 to-green-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
          label: "Archivos",
        };
      case "files_removed":
        return {
          bgColor: "bg-gradient-to-br from-orange-400 to-orange-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
          label: "Archivos",
        };
      case "priority_changed":
        return {
          bgColor: "bg-gradient-to-br from-rose-400 to-rose-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          label: "Prioridad",
        };
      case "tags_changed":
        return {
          bgColor: "bg-gradient-to-br from-sky-400 to-sky-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          ),
          label: "Etiquetas",
        };
      case "area_changed":
        return {
          bgColor: "bg-gradient-to-br from-amber-400 to-amber-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
          label: "Área",
        };
      case "assigned":
        return {
          bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          ),
          label: "Asignación",
        };
      case "edited":
      default:
        return {
          bgColor: "bg-gradient-to-br from-gray-400 to-gray-600",
          icon: (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          ),
          label: "Edición",
        };
    }
  };

  const { bgColor, icon, label } = getIconProps();

  return (
    <div className="group relative">
      <span
        className={`${bgColor} w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800`}
      >
        {icon}
      </span>

      {/* Tooltip que se muestra al hacer hover */}
      <span
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 bg-black bg-opacity-80 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10"
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
};

const TicketTimeline: React.FC<TicketTimelineProps> = ({ history }) => {
  // Si no hay historial, mostrar mensaje con un diseño atractivo
  if (!history || history.length === 0) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-4 mb-4 shadow-inner">
          <svg
            className="w-10 h-10 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sin historial
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          No hay eventos registrados para este ticket. Los cambios de estado,
          comentarios y modificaciones aparecerán aquí.
        </p>
      </div>
    );
  }
  
  // Función para convertir cualquier formato de fecha a timestamp
  const getTimestamp = (date: any): number => {
    try {
      // Caso 1: Es un objeto Timestamp de Firestore (tiene seconds y nanoseconds)
      if (date && typeof date === "object" && "seconds" in date) {
        return date.seconds * 1000;
      }
      // Caso 2: Es un objeto Date
      if (date instanceof Date) {
        return date.getTime();
      }
      // Caso 3: Es un string con formato de fecha
      if (typeof date === "string") {
        return new Date(date).getTime();
      }
      // Si no es ninguno de los anteriores, devolver fecha actual
      console.warn("Formato de fecha no reconocido:", date);
      return Date.now(); 
    } catch (error) {
      console.error("Error al procesar fecha para ordenamiento:", date, error);
      return 0;
    }
  };

  // Ordenar el historial para mostrar los más recientes primero
  const sortedHistory = [...history].sort((a, b) => {
    const timestampA = getTimestamp(a.date);
    const timestampB = getTimestamp(b.date);
    return timestampB - timestampA; // Orden descendente (más reciente primero)
  });

  return (
    <div className="p-4">
      {/* Timeline unificado con estilo profesional */}
      <div className="relative">
        {/* Línea vertical punteada del timeline */}
        <div className="absolute left-[67px] top-0 bottom-0 w-0 border-l-2 border-dashed border-gray-200 dark:border-gray-600" />

        {/* Items del timeline */}
        <div className="flex flex-col space-y-6">
          {sortedHistory.map((item, idx) => (
            <div key={idx} className="flex items-start relative">
              {/* Fecha/hora en dos líneas */}
              <div className="text-xs font-medium min-w-[55px] text-right">
                <div className="text-gray-700 dark:text-gray-300">
                  {formatDate(item.date).day}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {formatDate(item.date).time}
                </div>
              </div>

              {/* Icono */}
              <div className="z-10 ml-1 mr-2">
                <TimelineIcon action={item.action} />
              </div>

              {/* Tarjeta con descripción */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 relative ml-3">
                {/* Barra de color superior */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${getActionColor(
                    item.action
                  )}`}
                ></div>

                {/* Encabezado del evento */}
                <div className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center">
                  {item.action === "created" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-emerald-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Ticket creado
                    </span>
                  )}
                  {item.action === "status_changed" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Cambio de estado a <StatusBadge status={item.status} />
                    </span>
                  )}
                  {item.action === "priority_changed" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-rose-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Cambio de prioridad a{" "}
                      <PriorityBadge priority={item.priority} />
                    </span>
                  )}
                  {item.action === "tags_changed" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-sky-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      Etiquetas modificadas
                    </span>
                  )}
                  {item.action === "area_changed" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Área modificada:{" "}
                      <span className="ml-1 text-amber-700 dark:text-amber-400">
                        {item.area}
                      </span>
                    </span>
                  )}
                  {item.action === "files_added" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Archivos añadidos
                    </span>
                  )}
                  {item.action === "files_removed" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-orange-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 13h6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Archivos eliminados
                    </span>
                  )}
                  {item.action === "comment_added" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Comentario
                    </span>
                  )}
                  {item.action === "merge" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-purple-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                        />
                      </svg>
                      Fusión de tickets
                      {item.mergedTicketInfo && (
                        <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2.5 py-0.5 rounded-full">
                          #{item.mergedTicketInfo.id.substring(0, 6)}
                        </span>
                      )}
                    </span>
                  )}
                  {item.action === "assigned" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Asignación de ticket
                    </span>
                  )}
                  {item.action === "edited" && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Ticket actualizado
                    </span>
                  )}
                </div>

                {/* Contenido del comentario */}
                {item.comment && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 pl-6">
                    {item.comment}
                  </div>
                )}

                {/* Pie con información del usuario */}
                {item.user && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 pl-6 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {item.user}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el estado de manera visual
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;

  const getStatusStyles = () => {
    switch (status) {
      case "abierto":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "en_progreso":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cerrado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "en_progreso":
        return "En progreso";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span
      className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {getStatusLabel()}
    </span>
  );
};

// Componente para mostrar la prioridad de manera visual
const PriorityBadge: React.FC<{ priority?: string }> = ({ priority }) => {
  if (!priority) return null;

  const getPriorityStyles = () => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "media":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "baja":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <span
      className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles()}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Función auxiliar para obtener el color de fondo según el tipo de acción
const getActionColor = (action: TicketHistoryAction): string => {
  switch (action) {
    case "created":
      return "bg-gradient-to-r from-emerald-400 to-emerald-600";
    case "status_changed":
      return "bg-gradient-to-r from-indigo-400 to-indigo-600";
    case "priority_changed":
      return "bg-gradient-to-r from-rose-400 to-rose-600";
    case "tags_changed":
      return "bg-gradient-to-r from-sky-400 to-sky-600";
    case "area_changed":
      return "bg-gradient-to-r from-amber-400 to-amber-600";
    case "files_added":
      return "bg-gradient-to-r from-green-400 to-green-600";
    case "files_removed":
      return "bg-gradient-to-r from-orange-400 to-orange-600";
    case "comment_added":
      return "bg-gradient-to-r from-amber-400 to-amber-600";
    case "merge":
      return "bg-gradient-to-r from-purple-400 to-purple-600";
    case "assigned":
      return "bg-gradient-to-r from-blue-400 to-blue-600";
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-600";
  }
};

export default TicketTimeline;
