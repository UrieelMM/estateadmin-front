import React, { useState, useEffect } from "react";
import { useTicketsStore } from "./tickets/ticketsStore";
import { useMaintenanceAppointmentStore } from "../../../../store/useMaintenanceStore";
import {
  CalendarDaysIcon,
  XMarkIcon,
  StarIcon,
  LinkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import toast from "react-hot-toast";

// Constantes de colores por estado para mantener consistencia en toda la UI
const TICKET_STATUS_COLORS = {
  abierto: {
    bg: "rgba(120, 53, 15, 0.8)",
    border: "border-yellow-400",
    bgLight: "bg-yellow-50",
    bgDark: "dark:bg-yellow-900/10",
    borderDark: "dark:border-yellow-500",
    text: "text-yellow-500",
    textDark: "dark:text-yellow-400",
  },
  en_progreso: {
    bg: "rgba(59, 130, 246, 0.8) ",
    border: "border-blue-400",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/10",
    borderDark: "dark:border-blue-500",
    text: "text-blue-500",
    textDark: "dark:text-blue-400",
  },
  cerrado: {
    bg: "rgba(52, 211, 153, 0.8)",
    border: "border-green-400",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-700/30",
    borderDark: "dark:border-green-500",
    text: "text-green-500",
    textDark: "dark:text-green-400",
  },
};

// Componente para convertir tickets en citas de mantenimiento
const TicketToAppointment: React.FC = () => {
  const { tickets, fetchTickets, error, loading } = useTicketsStore();
  const { convertTicketToAppointment } = useMaintenanceAppointmentStore();

  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    date: moment().format("YYYY-MM-DD"),
    time: "09:00",
    technician: "",
    notes: "",
  });

  useEffect(() => {
    fetchTickets(); // Obtener todos los tickets activos
  }, []);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setFormOpen(true);

    // Obtener información del ticket para autocompletar
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setFormData((prev) => ({
        ...prev,
        notes: `Visita de seguimiento para el ticket: ${ticket.title}`,
      }));
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedTicketId("");
    setFormData({
      date: moment().format("YYYY-MM-DD"),
      time: "09:00",
      technician: "",
      notes: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicketId) {
      toast.error("Seleccione un ticket para programar una visita");
      return;
    }

    try {
      const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
      if (!selectedTicket) {
        toast.error("Ticket no encontrado");
        return;
      }

      const appointmentData = {
        title: `Visita: ${selectedTicket.title}`,
        description: selectedTicket.description,
        date: formData.date,
        time: formData.time,
        location: selectedTicket.area || "",
        technician: formData.technician,
        notes: formData.notes,
        status: "pending" as
          | "pending"
          | "completed"
          | "cancelled"
          | "in_progress",
      };

      await convertTicketToAppointment(selectedTicketId, appointmentData);
      toast.success("Visita programada correctamente");
      handleCloseForm();
    } catch (error) {
      toast.error("Error al programar la visita");
      console.error(error);
    }
  };

  // Filtrar tickets solo en proceso o abiertos
  const availableTickets = tickets.filter(
    (ticket) => ticket.status === "abierto" || ticket.status === "en_progreso"
  );

  // Agrupar tickets por estado
  const ticketsByStatus = {
    abierto: availableTickets.filter((t) => t.status === "abierto"),
    en_progreso: availableTickets.filter((t) => t.status === "en_progreso"),
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Convertir Tickets a Visitas
          </h3>
        </div>

        <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs py-1 px-2 rounded-md">
          <InformationCircleIcon className="h-4 w-4 mr-1" />
          <span>Selecciona un ticket para programar una visita técnica</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 dark:bg-red-900/30 dark:border-red-500">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : availableTickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay tickets disponibles para programar visitas.
          <p className="mt-2 text-sm">
            Los tickets deben estar en estado 'Abierto' o 'En Proceso'.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tickets en progreso */}
          {ticketsByStatus.en_progreso.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                <StarIcon
                  className={`h-4 w-4 mr-1 ${TICKET_STATUS_COLORS.en_progreso.text}`}
                />
                En Proceso
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketsByStatus.en_progreso.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`border-l-4 ${TICKET_STATUS_COLORS.en_progreso.border} ${TICKET_STATUS_COLORS.en_progreso.bgLight} ${TICKET_STATUS_COLORS.en_progreso.bgDark} ${TICKET_STATUS_COLORS.en_progreso.borderDark} rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => handleSelectTicket(ticket.id!)}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm mb-2 truncate">
                        {ticket.title}
                      </h4>
                      <CalendarDaysIcon
                        className={`h-5 w-5 ${TICKET_STATUS_COLORS.en_progreso.text} ${TICKET_STATUS_COLORS.en_progreso.textDark} ml-2`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {moment(ticket.createdAt).format("DD/MM/YYYY")}
                      </span>
                      <button className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/40">
                        Programar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets abiertos */}
          {ticketsByStatus.abierto.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                <StarIcon
                  className={`h-4 w-4 mr-1 ${TICKET_STATUS_COLORS.abierto.text}`}
                />
                Abiertos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketsByStatus.abierto.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`border-l-4 ${TICKET_STATUS_COLORS.abierto.border} ${TICKET_STATUS_COLORS.abierto.bgLight} ${TICKET_STATUS_COLORS.abierto.bgDark} ${TICKET_STATUS_COLORS.abierto.borderDark} rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => handleSelectTicket(ticket.id!)}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm mb-2 truncate">
                        {ticket.title}
                      </h4>
                      <CalendarDaysIcon
                        className={`h-5 w-5 ${TICKET_STATUS_COLORS.abierto.text} ${TICKET_STATUS_COLORS.abierto.textDark} ml-2`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {moment(ticket.createdAt).format("DD/MM/YYYY")}
                      </span>
                      <button className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/40">
                        Programar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de formulario */}
      {formOpen && selectedTicketId && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Programar Visita de Mantenimiento
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ticket Seleccionado
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-800 dark:text-gray-200">
                  {tickets.find((t) => t.id === selectedTicketId)?.title ||
                    "Ticket no encontrado"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Técnico / Responsable
                </label>
                <input
                  type="text"
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nombre del técnico asignado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Instrucciones o notas para el técnico"
                />
              </div>

              <div className="flex justify-end mt-4 space-x-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Programar Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketToAppointment;
