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
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import { useCommonAreasStore } from "../../../../store/useCommonAreasStore";
import { formatCentsToMXN } from "../../../../utils/curreyncy";

interface CalendarEvent {
  id: string;
  name: string;
  number: string;
  phone: string;
  eventDay: string;
  commonArea: string;
  commonAreaId?: string;
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
  const { commonAreas, fetchCommonAreas } = useCommonAreasStore();

  // Estados locales para los campos del formulario
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [commonArea, setCommonArea] = useState("");
  const [commonAreaId, setCommonAreaId] = useState("");
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

  // Estado para alerta de horario
  const [timeRangeModalVisible, setTimeRangeModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  // Nuevo estado para calcular el costo
  const [reservationCost, setReservationCost] = useState<number | null>(null);
  const [reservationHours, setReservationHours] = useState<number>(0);

  // Estado para alerta de área en mantenimiento
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCondominiumsUsers();
      fetchCommonAreas();
      // Resetear el residente seleccionado al abrir el formulario o cambiar de condominio
      setSelectedResidentId("");
      setCommonArea("");
      setCommonAreaId("");
    }
  }, [fetchCondominiumsUsers, fetchCommonAreas, isOpen, currentCondominiumId]);

  // Calcular el costo cuando cambia el área común o los horarios
  useEffect(() => {
    calculateReservationCost();
  }, [startTime, endTime, selectedArea]);

  const calculateReservationCost = () => {
    if (!selectedArea || !startTime || !endTime || selectedArea.rate === 0) {
      setReservationCost(null);
      setReservationHours(0);
      return;
    }

    // Calcular duración en horas
    const convertToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);

    // Si el fin es antes que el inicio, asumimos que es para el día siguiente
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Añadir 24 horas en minutos
    }

    // Convertir a horas y redondear hacia arriba
    const durationHours = Math.ceil(durationMinutes / 60);
    setReservationHours(durationHours);

    // Calcular costo total (tarifa por hora * horas redondeadas hacia arriba)
    const totalCost = selectedArea.rate * durationHours;
    setReservationCost(totalCost);
  };

  const handleCommonAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (selectedId) {
      const selectedArea = commonAreas.find(
        (area) => area.uid === selectedId || area.id === selectedId
      );
      if (selectedArea) {
        setCommonArea(selectedArea.name);
        setCommonAreaId(selectedArea.uid || selectedArea.id || "");
        setSelectedArea(selectedArea);
      }
    } else {
      setCommonArea("");
      setCommonAreaId("");
      setSelectedArea(null);
    }
  };

  const validateTimeRange = () => {
    if (!selectedArea || !startTime || !endTime) return true;

    const openTime = selectedArea.openTime || "00:00";
    const closeTime = selectedArea.closeTime || "23:59";

    // Convertir a minutos para facilitar la comparación
    const convertToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const openMinutes = convertToMinutes(openTime);
    const closeMinutes = convertToMinutes(closeTime);
    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);

    // Comprobar si el inicio y fin de la reserva están dentro del horario del área
    return startMinutes >= openMinutes && endMinutes <= closeMinutes;
  };

  const validateAreaNotInMaintenance = () => {
    if (!selectedArea) return true;
    return selectedArea.status !== "maintenance";
  };

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

    // Verificar que el área no esté en mantenimiento
    if (!validateAreaNotInMaintenance()) {
      setMaintenanceModalVisible(true);
      return;
    }

    // Verificar rango de horario
    if (!validateTimeRange()) {
      setTimeRangeModalVisible(true);
      return;
    }

    // Continuar con la creación del evento
    proceedWithEventCreation(resident);
  };

  const proceedWithEventCreation = async (resident: any) => {
    // Construir el objeto del evento sin incluir 'comments' si está vacío
    const eventData: Omit<CalendarEvent, "id" | "folio"> = {
      name: resident.name,
      number: resident.number || "",
      phone: resident.phone || "",
      eventDay: eventDate,
      commonArea,
      commonAreaId,
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
      resetForm();
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

  const resetForm = () => {
    setSelectedResidentId("");
    setCommonArea("");
    setCommonAreaId("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setComments("");
    setTimeRangeModalVisible(false);
    setMaintenanceModalVisible(false);
    setSelectedArea(null);
  };

  // Función para forzar la creación del evento (opción confirmada)
  const handleConfirm = async () => {
    if (!pendingEventData) return;
    try {
      await createEvent(pendingEventData, { force: true });
      toast.success("Evento creado con éxito.");
      // Limpiar campos y cerrar el modal
      resetForm();
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

  // Función para proceder con la creación a pesar de estar fuera del rango horario
  const handleForceTimeRange = () => {
    setTimeRangeModalVisible(false);
    // Buscar el residente seleccionado para continuar con la creación
    const resident = condominiumsUsers.find(
      (user) => user.uid === selectedResidentId
    );
    if (resident) {
      proceedWithEventCreation(resident);
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
                  value={commonAreaId}
                  onChange={handleCommonAreaChange}
                  className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  required
                >
                  <option value="">Seleccione un área</option>
                  {commonAreas.map((area) => (
                    <option key={area.id} value={area.uid || area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedArea && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Horario disponible: {selectedArea.openTime} -{" "}
                  {selectedArea.closeTime}
                </p>
              )}
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
            {reservationCost !== null &&
              selectedArea?.rate > 0 &&
              startTime &&
              endTime && (
                <div className="md:col-span-2">
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 mt-2">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CurrencyDollarIcon
                          className="h-5 w-5 text-blue-400"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Información de Costo
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                          <p>
                            Duración de la reserva:{" "}
                            <span className="font-semibold">
                              {reservationHours} hora
                              {reservationHours !== 1 ? "s" : ""}
                            </span>
                          </p>
                          <p>
                            Costo total estimado:{" "}
                            <span className="font-semibold">
                              {formatCentsToMXN(reservationCost)}
                            </span>
                          </p>
                          <p className="mt-2 text-xs italic">
                            Recuerda generar el cargo correspondiente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            {/* Renderización condicional para mostrar alerta si el área está en mantenimiento */}
            {selectedArea && selectedArea.status === "maintenance" && (
              <div className="md:col-span-2">
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 mt-2">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <WrenchScrewdriverIcon
                        className="h-5 w-5 text-yellow-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Área en mantenimiento
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                        <p>
                          Esta área común se encuentra actualmente en
                          mantenimiento y no está disponible para reservaciones.
                        </p>
                        {selectedArea.maintenanceNotes && (
                          <p className="mt-1 font-semibold">
                            Notas: {selectedArea.maintenanceNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Modal para confirmar creación forzada en caso de adeudos pendientes */}
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

      {/* Modal para confirmar horario fuera de rango */}
      {timeRangeModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white min-w-[500px] dark:bg-gray-800 p-6 rounded-lg max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-2" />
                Horario fuera de rango
              </h3>
              <button
                onClick={() => setTimeRangeModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                El horario seleccionado ({startTime} - {endTime}) está fuera del
                rango permitido para esta área común.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2 font-bold">
                Horario permitido: {selectedArea?.openTime} -{" "}
                {selectedArea?.closeTime}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                ¿Desea continuar con la reservación de todos modos?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setTimeRangeModalVisible(false)}
                className="btn-secundary"
              >
                Cancelar
              </button>
              <button onClick={handleForceTimeRange} className="btn-primary">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para informar que el área está en mantenimiento */}
      {maintenanceModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white min-w-[500px] dark:bg-gray-800 p-6 rounded-lg max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-500 mr-2" />
                Área en mantenimiento
              </h3>
              <button
                onClick={() => setMaintenanceModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Lo sentimos, el área común "{selectedArea?.name}" se encuentra
                actualmente en mantenimiento y no está disponible para
                reservaciones.
              </p>
              {selectedArea?.maintenanceNotes && (
                <p className="text-gray-700 dark:text-gray-300 mt-2 font-bold">
                  Notas de mantenimiento: {selectedArea.maintenanceNotes}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Por favor, seleccione otra área común o intente más tarde cuando
                el mantenimiento haya concluido.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setMaintenanceModalVisible(false)}
                className="btn-primary"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormCalendar;
