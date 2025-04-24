import { useState, useEffect, FormEvent } from "react";
import toast from "react-hot-toast";
import useUserStore from "../../../../store/UserDataStore";
import { useCalendarEventsStore } from "../../../../store/useReservationStore";
import {
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import { commonAreas } from "../../../../utils/commonAreas";
import { formatCentsToMXN } from "../../../../utils/curreyncy";

interface CalendarEvent {
  id: string;
  name: string;
  number: string;
  phone: string;
  eventDay: string;
  commonArea: string;
  startTime: string;
  endTime: string;
  comments?: string;
  email: string;
  folio: string;
}

interface FormCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const FormCalendar = ({ isOpen, onClose }: FormCalendarProps) => {
  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const { createEvent } = useCalendarEventsStore();
  const currentCondominiumId = useCondominiumStore(
    (state) => state.selectedCondominium?.id
  );

  // Estados locales para los campos del formulario
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [commonArea, setCommonArea] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [comments, setComments] = useState("");

  // Estados para el manejo de adeudos pendientes y evento pendiente
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<Omit<
    CalendarEvent,
    "id" | "folio"
  > | null>(null);
  const [unpaidCharges, setUnpaidCharges] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCondominiumsUsers();
      // Resetear el residente seleccionado al abrir el formulario o cambiar de condominio
      setSelectedResidentId("");
    }
  }, [fetchCondominiumsUsers, isOpen, currentCondominiumId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validar que se haya seleccionado un residente
    if (!selectedResidentId) {
      toast.error("Debe seleccionar un condomino.");
      return;
    }

    // Buscar el residente seleccionado para obtener su nombre y número
    const resident = condominiumsUsers.find(
      (user) => user.uid === selectedResidentId
    );
    if (!resident) {
      toast.error("Condomino no encontrado.");
      return;
    }

    // Validar campos obligatorios
    if (!commonArea || !eventDate || !startTime || !endTime) {
      toast.error("Por favor, complete todos los campos obligatorios.");
      return;
    }

    // Construir el objeto del evento sin incluir 'comments' si está vacío
    const eventData: Omit<CalendarEvent, "id" | "folio"> = {
      name: resident.name,
      number: resident.number || "",
      phone: resident.phone || "",
      eventDay: eventDate,
      commonArea,
      startTime,
      endTime,
      email: resident.email,
    };
    if (comments.trim() !== "") {
      eventData.comments = comments;
    }

    // Guardar el evento pendiente para usarlo en caso de confirmación forzada
    setPendingEventData(eventData);

    try {
      await createEvent(eventData);
      toast.success("Evento creado con éxito.");
      // Limpiar los campos y cerrar el modal
      setSelectedResidentId("");
      setCommonArea("");
      setEventDate("");
      setStartTime("");
      setEndTime("");
      setComments("");
      onClose();
    } catch (error: any) {
      console.error("Error al crear el evento:", error);
      // Si el error tiene adeudos pendientes, se muestra el modal para confirmar la acción
      if (error.unpaidCharges) {
        setUnpaidCharges(error.unpaidCharges);
        setConfirmModalVisible(true);
      } else {
        // Mostrar el error (por ejemplo, de empalme de reservas) en el toast
        const errorMessage =
          (error as any).message || "Ocurrió un error al crear el evento.";
        toast.error(errorMessage);
      }
    }
  };

  // Función para forzar la creación del evento (opción confirmada)
  const handleConfirm = async () => {
    if (!pendingEventData) return;
    try {
      await createEvent(pendingEventData, { force: true });
      toast.success("Evento creado con éxito.");
      // Limpiar campos y cerrar el modal
      setSelectedResidentId("");
      setCommonArea("");
      setEventDate("");
      setStartTime("");
      setEndTime("");
      setComments("");
      setPendingEventData(null);
      setConfirmModalVisible(false);
      onClose();
    } catch (error) {
      console.error("Error al crear el evento:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al crear el evento.";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-5 rounded-lg max-w-2xl w-full dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Registrar Evento</h2>
            <button
              onClick={onClose}
              className="text-black font-bold bg-indigo-100 rounded-full py-1 px-3"
            >
              X
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label
                htmlFor="resident"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Condomino
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="resident"
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                >
                  <option value="">Seleccione un condomino</option>
                  {condominiumsUsers.map((user) => (
                    <option key={user.uid} value={user.uid}>
                      {user.name} - {user.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="commonArea"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Área Común
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="commonArea"
                  value={commonArea}
                  onChange={(e) => setCommonArea(e.target.value)}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                >
                  <option value="">Seleccione un área</option>
                  {commonAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="eventDate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Día del Evento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="eventDate"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="startTime"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Inicio del Evento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Fin del Evento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="comments"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Comentarios
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <PencilIcon className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full pl-10 h-20 border border-gray-300 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  placeholder="Comentarios sobre el evento (opcional)"
                ></textarea>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button type="button" onClick={onClose} className="btn-secundary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para confirmar creación forzada en caso de adeudos pendientes - Reemplazado con Tailwind */}
      {confirmModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white min-w-[500px] dark:bg-gray-800 p-6 rounded-lg max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Adeudos Pendientes
              </h3>
              <button
                onClick={() => setConfirmModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                El condómino tiene los siguientes adeudos pendientes:
              </p>
              <ul className="list-disc pl-5 my-2 text-gray-700 dark:text-gray-300">
                {unpaidCharges.map((charge) => (
                  <li key={charge.id} className="mb-1">
                    Concepto:{" "}
                    <span className="font-bold">{charge.concept}</span> Monto:{" "}
                    <span className="font-bold">
                      {formatCentsToMXN(charge.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                ¿Desea confirmar la reservación?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModalVisible(false)}
                className="btn-secundary"
              >
                Cancelar
              </button>
              <button onClick={handleConfirm} className="btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormCalendar;
