import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  MaintenanceAppointment,
  useMaintenanceAppointmentStore,
  useMaintenanceContractStore,
} from "../../../../store/useMaintenanceStore";
import { useTicketsStore } from "./tickets/ticketsStore";
import moment from "moment";
import toast from "react-hot-toast";
import TicketToAppointment from "./TicketToAppointment";

const MaintenanceAppointments: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<MaintenanceAppointment | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "cancelled" | "in_progress"
  >("all");

  const {
    appointments,
    loading,
    fetchAppointments,
    updateAppointment,
    deleteAppointment,
  } = useMaintenanceAppointmentStore();
  const { tickets, fetchTickets } = useTicketsStore();
  const { contracts, fetchContracts } = useMaintenanceContractStore();

  useEffect(() => {
    // Cargar datos al iniciar el componente
    const fetchData = async () => {
      // Obtener mes y año actual
      const currentYear = currentMonth.getFullYear();
      const currentMonthNumber = currentMonth.getMonth() + 1; // +1 porque getMonth() devuelve 0-11

      await fetchAppointments(currentMonthNumber, currentYear);
      await fetchTickets();
      await fetchContracts();
    };

    fetchData();
  }, [currentMonth]);

  // Iniciar el formulario de creación
  const handleNewAppointment = () => {
    setCurrentAppointment(null);
    setIsFormOpen(true);
  };

  // Editar una cita existente
  const handleEditAppointment = (appointment: MaintenanceAppointment) => {
    setCurrentAppointment(appointment);
    setIsFormOpen(true);
  };

  // Guardar cita (ya se ejecuta desde el formulario)
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentAppointment(null);
  };

  // Cambiar estado de cita
  const handleChangeStatus = async (
    id: string,
    newStatus: MaintenanceAppointment["status"]
  ) => {
    try {
      await updateAppointment(id, { status: newStatus });
      toast.success(
        `Estado de la cita actualizado a: ${getStatusText(newStatus)}`
      );
    } catch (error) {
      toast.error("Error al actualizar el estado de la cita");
    }
  };

  // Eliminar cita
  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta cita?")) {
      try {
        await deleteAppointment(id);
        toast.success("Cita eliminada correctamente");
      } catch (error) {
        toast.error("Error al eliminar la cita");
      }
    }
  };

  // Generar vista de calendario
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0 = Domingo, 6 = Sábado)
    const firstDayOfWeek = firstDay.getDay();

    // Número de días en el mes
    const daysInMonth = lastDay.getDate();

    // Array con los días del calendario
    const calendarDays = [];

    // Días del mes anterior para completar la primera semana
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push({ day: null, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = moment(currentDate).format("YYYY-MM-DD");

      // Filtrar citas para este día
      const appointmentsForDay = appointments.filter((a) => a.date === dateStr);

      calendarDays.push({
        day,
        date: currentDate,
        isCurrentMonth: true,
        appointments: appointmentsForDay,
      });
    }

    return calendarDays;
  };

  // Días de la semana para el encabezado del calendario
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Filtrar citas según el estado seleccionado
  const filteredAppointments = appointments.filter((app) =>
    filter === "all" ? true : app.status === filter
  );

  // Formatear fecha para mostrar
  const formatAppointmentDate = (dateStr: string) => {
    return moment(dateStr).format("dddd, D [de] MMMM [de] YYYY");
  };

  // Obtener color según estado
  const getStatusColor = (status: MaintenanceAppointment["status"]) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Traducir estado para mostrar
  const getStatusText = (status: MaintenanceAppointment["status"]) => {
    switch (status) {
      case "pending":
        return "Programada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "in_progress":
        return "En progreso";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y controles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Agenda de Visitas de Mantenimiento
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra y programa visitas de proveedores y técnicos
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "calendar"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              }`}
              onClick={() => setView("calendar")}
            >
              Calendario
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              }`}
              onClick={() => setView("list")}
            >
              Lista
            </button>
          </div>

          <button
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            onClick={handleNewAppointment}
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Integración con tickets - Añadir esto */}
      <TicketToAppointment />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === "all"
              ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setFilter("all")}
        >
          Todas
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === "pending"
              ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setFilter("pending")}
        >
          Programadas
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === "in_progress"
              ? "bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setFilter("in_progress")}
        >
          En Progreso
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === "completed"
              ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setFilter("completed")}
        >
          Completadas
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === "cancelled"
              ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setFilter("cancelled")}
        >
          Canceladas
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Vista de Calendario */}
          {view === "calendar" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Navegación del mes */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                >
                  &lt; Mes anterior
                </button>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  {moment(currentMonth).format("MMMM YYYY")}
                </h3>
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                >
                  Mes siguiente &gt;
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 auto-rows-fr">
                {generateCalendarDays().map((dayInfo, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] border border-gray-100 dark:border-gray-700 p-1 ${
                      dayInfo.isCurrentMonth
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {dayInfo.day && (
                      <>
                        <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {dayInfo.day}
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                          {dayInfo.appointments?.map((app) => (
                            <div
                              key={app.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                                app.status
                              )}`}
                              onClick={() => handleEditAppointment(app)}
                            >
                              {app.time} - {app.title}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista de Lista */}
          {view === "list" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
              {filteredAppointments.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white flex items-center">
                            {appointment.title}
                            <span
                              className={`ml-2 text-xs py-0.5 px-2 rounded-full ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatAppointmentDate(appointment.date)} •{" "}
                            {appointment.time}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-medium">Técnico:</span>{" "}
                            {appointment.technician} •
                            <span className="font-medium ml-2">Ubicación:</span>{" "}
                            {appointment.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {appointment.status === "pending" && (
                            <button
                              className="p-1.5 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-full"
                              onClick={() =>
                                handleChangeStatus(
                                  appointment.id!,
                                  "in_progress"
                                )
                              }
                              title="Marcar en progreso"
                            >
                              <ClockIcon className="h-5 w-5" />
                            </button>
                          )}

                          {(appointment.status === "pending" ||
                            appointment.status === "in_progress") && (
                            <button
                              className="p-1.5 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-full"
                              onClick={() =>
                                handleChangeStatus(appointment.id!, "completed")
                              }
                              title="Marcar como completada"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}

                          {appointment.status !== "cancelled" && (
                            <button
                              className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-full"
                              onClick={() =>
                                handleChangeStatus(appointment.id!, "cancelled")
                              }
                              title="Cancelar cita"
                            >
                              <ExclamationCircleIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            className="p-1.5 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-full"
                            onClick={() => handleEditAppointment(appointment)}
                            title="Editar cita"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>

                          <button
                            className="p-1.5 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-full"
                            onClick={() =>
                              handleDeleteAppointment(appointment.id!)
                            }
                            title="Eliminar cita"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {appointment.notes}
                        </p>
                      )}

                      {(appointment.ticketId || appointment.contractId) && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {appointment.ticketId && (
                            <span className="inline-flex items-center mr-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
                              Ticket relacionado:{" "}
                              {appointment.ticketFolio || appointment.ticketId}
                            </span>
                          )}
                          {appointment.contractId && (
                            <span className="inline-flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              Contrato relacionado: {appointment.contractId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No hay citas que coincidan con los filtros seleccionados.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Formulario Modal */}
      {isFormOpen && (
        <AppointmentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          appointment={currentAppointment}
          tickets={tickets}
          contracts={contracts}
        />
      )}
    </div>
  );
};

// Formulario para creación/edición de citas
interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: MaintenanceAppointment | null;
  tickets: any[];
  contracts: any[];
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  appointment,
  tickets,
  contracts,
}) => {
  const { createAppointment, updateAppointment, loading } =
    useMaintenanceAppointmentStore();

  const [formData, setFormData] = useState<Partial<MaintenanceAppointment>>({
    title: appointment?.title || "",
    description: appointment?.description || "",
    date: appointment?.date || moment().format("YYYY-MM-DD"),
    time: appointment?.time || "10:00",
    location: appointment?.location || "",
    status: appointment?.status || "pending",
    technician: appointment?.technician || "",
    contactPhone: appointment?.contactPhone || "",
    ticketId: appointment?.ticketId || "",
    contractId: appointment?.contractId || "",
    notes: appointment?.notes || "",
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title,
        description: appointment.description,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        status: appointment.status,
        technician: appointment.technician,
        contactPhone: appointment.contactPhone || "",
        ticketId: appointment.ticketId || "",
        contractId: appointment.contractId || "",
        notes: appointment.notes || "",
      });
    } else {
      // Valores por defecto para nueva cita
      setFormData({
        title: "",
        description: "",
        date: moment().format("YYYY-MM-DD"),
        time: "10:00",
        location: "",
        status: "pending",
        technician: "",
        contactPhone: "",
        ticketId: "",
        contractId: "",
        notes: "",
      });
    }
  }, [appointment]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Si se selecciona un ticket, autocompletar algunos campos
  const handleTicketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ticketId = e.target.value;
    if (ticketId) {
      const selectedTicket = tickets.find((t) => t.id === ticketId);
      if (selectedTicket) {
        setFormData((prev) => ({
          ...prev,
          ticketId,
          title: prev.title || `Visita: ${selectedTicket.title}`,
          description: prev.description || selectedTicket.description,
          location: prev.location || selectedTicket.location || "",
        }));
      }
    }
  };

  // Si se selecciona un contrato, autocompletar algunos campos
  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractId = e.target.value;
    if (contractId) {
      const selectedContract = contracts.find((c) => c.id === contractId);
      if (selectedContract) {
        setFormData((prev) => ({
          ...prev,
          contractId,
          title: prev.title || `Servicio: ${selectedContract.serviceType}`,
          description: prev.description || selectedContract.description,
          contactPhone:
            prev.contactPhone || selectedContract.contactPhone || "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validaciones básicas
      if (!formData.title || !formData.date || !formData.time) {
        toast.error("Título, fecha y hora son obligatorios");
        return;
      }

      if (appointment?.id) {
        // Modo edición
        await updateAppointment(appointment.id, formData);
        toast.success("Cita actualizada correctamente");
      } else {
        // Modo creación
        await createAppointment(formData as MaintenanceAppointment);
        toast.success("Cita creada correctamente");
      }
      onClose();
    } catch (error) {
      toast.error("Error al guardar la cita");
      console.error("Error:", error);
    }
  };

  // Función que traduce los estados para la UI
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Programada",
      completed: "Completada",
      cancelled: "Cancelada",
      in_progress: "En progreso",
    };
    return statusMap[status] || status;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {appointment ? "Editar Cita" : "Nueva Cita de Mantenimiento"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
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

        <div className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título de la cita
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ej. Revisión de instalación eléctrica"
                  required
                />
              </div>

              {/* Fecha y hora */}
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

              {/* Ubicación */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ej. Área común, edificio A, piso 2"
                />
              </div>

              {/* Técnico y contacto */}
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
                  placeholder="Nombre del técnico o responsable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono de contacto
                </label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Teléfono de contacto"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pending">{getStatusLabel("pending")}</option>
                  <option value="in_progress">
                    {getStatusLabel("in_progress")}
                  </option>
                  <option value="completed">
                    {getStatusLabel("completed")}
                  </option>
                  <option value="cancelled">
                    {getStatusLabel("cancelled")}
                  </option>
                </select>
              </div>

              {/* Relacionar con ticket o contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relacionar con Ticket
                </label>
                <select
                  name="ticketId"
                  value={formData.ticketId}
                  onChange={handleTicketChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Ninguno</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.title.substring(0, 30)} - {ticket.folio}
                      {ticket.title.length > 30 ? "..." : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relacionar con Contrato
                </label>
                <select
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleContractChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Ninguno</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.providerName} - {contract.serviceType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Descripción detallada de la cita"
                />
              </div>

              {/* Notas */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Notas adicionales, instrucciones especiales, etc."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
              >
                {loading ? (
                  <span className="flex items-center">
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
                    Guardando...
                  </span>
                ) : appointment ? (
                  "Actualizar Cita"
                ) : (
                  "Crear Cita"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAppointments;
