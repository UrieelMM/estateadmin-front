import React, { useState, useEffect, Fragment } from 'react';
import { Menu, Dialog, Transition } from '@headlessui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useCalendarEventsStore } from '../../../../store/useReservationStore';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);
dayjs.locale('es');

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export interface CalendarEvent {
  id: string;
  name: string;
  number: string;
  eventDay: string; // "YYYY-MM-DD"
  commonArea: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  comments?: string;
  email?: string;
}

function getHoursRange(startHour: number, endHour: number): number[] {
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }
  return hours;
}

function computeGridRowSpan(startTime: string, endTime: string, baseHour = 6) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const baseInMinutes = baseHour * 60;
  const startOffset = startTotal - baseInMinutes;
  const endOffset = endTotal - baseInMinutes;
  const minutesPerSlot = 30;
  const rowStart = Math.floor(startOffset / minutesPerSlot) + 1;
  const rowEnd = Math.ceil(endOffset / minutesPerSlot);
  const span = rowEnd - rowStart + 1;
  return { rowStart, span };
}

// Se utiliza isoWeek para obtener la semana iniciando el lunes
function getWeekDays(baseDate: string) {
  const startOfWeek = dayjs(baseDate).startOf('isoWeek'); // lunes
  return Array.from({ length: 7 }).map((_, i) => {
    const d = startOfWeek.add(i, 'day');
    return {
      date: d.format('YYYY-MM-DD'),
      label: d.format('D MMM'),
      dayName: d.format('ddd'),
      isToday: d.isSame(dayjs(), 'day'),
    };
  });
}

function getMonthDays(baseDate: string) {
  const startOfMonth = dayjs(baseDate).startOf('month');
  const endOfMonth = dayjs(baseDate).endOf('month');

  // Calculamos el domingo anterior (o el mismo si ya es domingo)
  const startCalendar = startOfMonth.subtract(startOfMonth.day(), 'day');
  // Calculamos el sábado siguiente (o el mismo si ya es sábado)
  const endCalendar = endOfMonth.add(6 - endOfMonth.day(), 'day');

  const totalDays = endCalendar.diff(startCalendar, 'day') + 1;
  const days = [];
  for (let i = 0; i < totalDays; i++) {
    const d = startCalendar.add(i, 'day');
    days.push({
      date: d.format('YYYY-MM-DD'),
      dayNumber: d.format('D'),
      isCurrentMonth: d.isBetween(startOfMonth, endOfMonth, 'day', '[]'),
      isToday: d.isSame(dayjs(), 'day'),
    });
  }
  return days;
}

function getYearMonths(baseDate: string) {
  const year = dayjs(baseDate).year();
  return Array.from({ length: 12 }).map((_, i) => {
    const d = dayjs(new Date(year, i, 1));
    return {
      month: d.format('MMMM'),
      monthShort: d.format('MMM'),
      index: i,
    };
  });
}

export default function CalendarReservations() {
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [listWeek, setListWeek] = useState(dayjs());

  // Extraemos funciones para actualizar y eliminar eventos
  const updateEventFn = useCalendarEventsStore((state) => state.updateEvent);
  const deleteEventFn = useCalendarEventsStore((state) => state.deleteEvent);

  const months = [
    { value: '01', label: 'enero' },
    { value: '02', label: 'febrero' },
    { value: '03', label: 'marzo' },
    { value: '04', label: 'abril' },
    { value: '05', label: 'mayo' },
    { value: '06', label: 'junio' },
    { value: '07', label: 'julio' },
    { value: '08', label: 'agosto' },
    { value: '09', label: 'septiembre' },
    { value: '10', label: 'octubre' },
    { value: '11', label: 'noviembre' },
    { value: '12', label: 'diciembre' },
  ];
  const currentYear = dayjs().year();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const { events, fetchEvents } = useCalendarEventsStore();
  useEffect(() => {
    fetchEvents().catch((err) => toast.error(err.message || 'Error al obtener eventos'));
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      setEditedEvent({ ...selectedEvent });
      setIsEditing(false);
    }
  }, [selectedEvent]);

  const handlePrev = () => {
    if (view === 'day')
      setCurrentDate(dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD'));
    else if (view === 'week')
      setCurrentDate(dayjs(currentDate).subtract(1, 'week').format('YYYY-MM-DD'));
    else if (view === 'month')
      setCurrentDate(dayjs(currentDate).subtract(1, 'month').format('YYYY-MM-DD'));
    else
      setCurrentDate(dayjs(currentDate).subtract(1, 'year').format('YYYY-MM-DD'));
  };
  const handleNext = () => {
    if (view === 'day')
      setCurrentDate(dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD'));
    else if (view === 'week')
      setCurrentDate(dayjs(currentDate).add(1, 'week').format('YYYY-MM-DD'));
    else if (view === 'month')
      setCurrentDate(dayjs(currentDate).add(1, 'month').format('YYYY-MM-DD'));
    else
      setCurrentDate(dayjs(currentDate).add(1, 'year').format('YYYY-MM-DD'));
  };
  const handleToday = () => setCurrentDate(dayjs().format('YYYY-MM-DD'));
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    const newDate = dayjs(currentDate).month(parseInt(newMonth, 10) - 1).date(1);
    setCurrentDate(newDate.format('YYYY-MM-DD'));
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = dayjs(currentDate).year(newYear).date(1);
    setCurrentDate(newDate.format('YYYY-MM-DD'));
  };

  // eslint-disable-next-line no-unused-vars
  let mainLabel = '';
  console.log(mainLabel);
  if (view === 'day') mainLabel = dayjs(currentDate).format('D [de] MMMM YYYY');
  else if (view === 'week' || view === 'month') mainLabel = dayjs(currentDate).format('MMMM YYYY');
  else mainLabel = dayjs(currentDate).format('YYYY');

  let displayedEvents: CalendarEvent[] = [];
  if (view === 'day') {
    displayedEvents = events.filter((evt) => evt.eventDay === currentDate);
  } else if (view === 'week') {
    const startWeek = dayjs(currentDate).startOf('isoWeek');
    const endWeek = startWeek.add(6, 'day');
    displayedEvents = events.filter((evt) => {
      const d = dayjs(evt.eventDay);
      return d.isBetween(startWeek, endWeek, 'day', '[]');
    });
  } else if (view === 'month') {
    const startMonth = dayjs(currentDate).startOf('month');
    const endMonth = dayjs(currentDate).endOf('month');
    displayedEvents = events.filter((evt) => {
      const d = dayjs(evt.eventDay);
      return d.isBetween(startMonth, endMonth, 'day', '[]');
    });
  } else {
    const startYear = dayjs(currentDate).startOf('year');
    const endYear = dayjs(currentDate).endOf('year');
    displayedEvents = events.filter((evt) => {
      const d = dayjs(evt.eventDay);
      return d.isBetween(startYear, endYear, 'day', '[]');
    });
  }

  const openEventModal = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
  };

  const handleListPrevWeek = () => {
    setListWeek((prev) => prev.subtract(1, 'week'));
  };

  const handleListNextWeek = () => {
    setListWeek((prev) => prev.add(1, 'week'));
  };

  const startListWeek = listWeek.startOf('isoWeek');
  const endListWeek = startListWeek.add(6, 'day');
  const listEvents = events
    .filter((evt) => {
      const d = dayjs(evt.eventDay);
      return d.isBetween(startListWeek, endListWeek, 'day', '[]');
    })
    .sort((a, b) => {
      const aDateTime = dayjs(`${a.eventDay} ${a.startTime}`, 'YYYY-MM-DD HH:mm');
      const bDateTime = dayjs(`${b.eventDay} ${b.startTime}`, 'YYYY-MM-DD HH:mm');
      return aDateTime.diff(bDateTime);
    });

  // Handlers para editar y eliminar
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedEvent(selectedEvent);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent || !editedEvent) return;
    try {
      await updateEventFn(selectedEvent.id, {
        eventDay: editedEvent.eventDay,
        commonArea: editedEvent.commonArea,
        startTime: editedEvent.startTime,
        endTime: editedEvent.endTime,
        comments: editedEvent.comments,
      });
      setSelectedEvent(editedEvent);
      setIsEditing(false);
      toast.success("Evento actualizado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el evento");
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("¿Está seguro de eliminar este evento?")) return;
    try {
      await deleteEventFn(selectedEvent.id);
      setSelectedEvent(null);
      toast.success("Evento eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el evento");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          {/* <h1 className="text-base font-semibold text-gray-900 capitalize">{mainLabel}</h1> */}
          {view === 'week' && (
            <p className="text-sm text-gray-500">
              Semana del {dayjs(currentDate).startOf('isoWeek').format('D MMM')} al {dayjs(currentDate).startOf('isoWeek').add(6, 'day').format('D MMM')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <button onClick={handlePrev} className="p-2 rounded hover:bg-gray-100">
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button onClick={handleToday} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">
              Hoy
            </button>
            <button onClick={handleNext} className="p-2 rounded hover:bg-gray-100">
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={dayjs(currentDate).format('YYYY')}
              onChange={handleYearChange}
              className="border p-1 text-sm w-20 border-gray-300 py-[0.450rem] rounded-lg text-black font-semibold"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={dayjs(currentDate).format('MM')}
              onChange={handleMonthChange}
              className="border p-1 text-sm w-28 border-gray-300 py-[0.450rem] rounded-lg text-black font-semibold"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} style={{ textTransform: 'capitalize' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {view === 'day' ? 'Día' : view === 'week' ? 'Semana' : view === 'month' ? 'Mes' : 'Año'}
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => setView('day')} className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700')}>
                      Día
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => setView('week')} className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700')}>
                      Semana
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => setView('month')} className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700')}>
                      Mes
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => setView('year')} className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700')}>
                      Año
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {view === 'day' && <DayView currentDate={currentDate} events={displayedEvents} onEventClick={openEventModal} />}
          {view === 'week' && <WeekView currentDate={currentDate} events={displayedEvents} onEventClick={openEventModal} />}
          {view === 'month' && <MonthView currentDate={currentDate} events={displayedEvents} />}
          {view === 'year' && <YearView currentDate={currentDate} events={displayedEvents} />}
        </div>
        <aside className="w-80 border-l p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Eventos de la Semana</h2>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleListPrevWeek} className="p-2 rounded hover:bg-gray-100">
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-700">
              {startListWeek.format('D MMM')} - {endListWeek.format('D MMM')}
            </span>
            <button onClick={handleListNextWeek} className="p-2 rounded hover:bg-gray-100">
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <ul className="space-y-2">
            {listEvents.length > 0 ? (
              listEvents.map((event) => (
                <li
                  key={event.id}
                  onClick={() => openEventModal(event)}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-xs">Área: {event.commonArea}</p>
                  <p className="text-xs">
                    {dayjs(event.eventDay).format('D MMM YYYY')}{' '}
                    {dayjs(`${event.eventDay} ${event.startTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')} -{' '}
                    {dayjs(`${event.eventDay} ${event.endTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                  </p>
                  {event.comments && <p className="text-xs">{event.comments}</p>}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No hay eventos para esta semana.</li>
            )}
          </ul>
        </aside>
      </div>
      <Transition appear show={selectedEvent !== null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            setSelectedEvent(null);
            setIsEditing(false);
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Detalles del Evento
                  </Dialog.Title>
                  {selectedEvent && !isEditing && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <strong>{selectedEvent.name}</strong> - {selectedEvent.number}
                      </p>
                      <p className="text-sm text-gray-500">Área: {selectedEvent.commonArea}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(selectedEvent.eventDay).format('D MMM YYYY')} de{' '}
                        {dayjs(`${selectedEvent.eventDay} ${selectedEvent.startTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')} a{' '}
                        {dayjs(`${selectedEvent.eventDay} ${selectedEvent.endTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                      </p>
                      {selectedEvent.comments && (
                        <p className="mt-2 text-sm text-gray-500">{selectedEvent.comments}</p>
                      )}
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="inline-flex rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(null)}
                          className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedEvent && isEditing && editedEvent && (
                    <div className="mt-2 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha</label>
                        <input
                          type="date"
                          value={editedEvent.eventDay}
                          onChange={(e) =>
                            setEditedEvent({ ...editedEvent, eventDay: e.target.value })
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Área</label>
                        <select
                          value={editedEvent.commonArea}
                          onChange={(e) =>
                            setEditedEvent({ ...editedEvent, commonArea: e.target.value })
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        >
                          <option value="">Seleccione un área</option>
                          <option value="Salón de fiestas">Salón de fiestas</option>
                          <option value="Gimnasio">Gimnasio</option>
                          <option value="Alberca">Alberca</option>
                          <option value="Cancha de tenis">Cancha de tenis</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hora de inicio</label>
                        <input
                          type="time"
                          value={editedEvent.startTime}
                          onChange={(e) =>
                            setEditedEvent({ ...editedEvent, startTime: e.target.value })
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hora de fin</label>
                        <input
                          type="time"
                          value={editedEvent.endTime}
                          onChange={(e) =>
                            setEditedEvent({ ...editedEvent, endTime: e.target.value })
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Comentarios</label>
                        <textarea
                          value={editedEvent.comments || ""}
                          onChange={(e) =>
                            setEditedEvent({ ...editedEvent, comments: e.target.value })
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick }: { currentDate: string; events: CalendarEvent[]; onEventClick: (evt: CalendarEvent) => void }) {
  const hours = getHoursRange(6, 22);
  return (
    <div className="p-4 relative">
      <h2 className="text-lg font-semibold mb-2 capitalize">
        {dayjs(currentDate).format('dddd D [de] MMMM')}
      </h2>
      <div
        className="relative grid grid-cols-[3rem,1fr] gap-0 border divide-x divide-y divide-gray-200 max-h-[calc(100vh-12rem)] overflow-auto"
        style={{ gridTemplateRows: 'repeat(32, 2.5rem)' }}
      >
        {hours.map((hour, idx) => (
          <Fragment key={hour}>
            <div
              className="text-right pr-2 text-xs text-gray-400"
              style={{ gridRow: `${idx * 2 + 1} / span 2` }}
            >
              {dayjs().hour(hour).minute(0).format('h:mm A')}
            </div>
            <div style={{ gridRow: `${idx * 2 + 1} / span 2` }} />
          </Fragment>
        ))}
        {events.map((event) => {
          const { rowStart, span } = computeGridRowSpan(event.startTime, event.endTime, 6);
          const areaColors: Record<string, { bg: string; border: string; text: string }> = {
            'Gimnasio': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
            'Salón de fiestas': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
            'Alberca': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
            'Cancha de tenis': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
          };
          const colors = areaColors[event.commonArea] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={classNames("p-1 rounded border text-xs overflow-hidden cursor-pointer", colors.bg, colors.border, colors.text)}
              style={{
                gridColumn: 2,
                gridRow: `${rowStart} / span ${span}`,
                marginLeft: '0.25rem',
                marginRight: '0.25rem',
              }}
            >
              <p className="font-semibold">{event.name}</p>
              <p className="text-xs">{event.number} - {event.commonArea}</p>
              <p className="text-xs">
                {dayjs(`${event.eventDay} ${event.startTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')} -{' '}
                {dayjs(`${event.eventDay} ${event.endTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
              </p>
              {event.comments && <p className="text-xs">{event.comments}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, onEventClick }: { currentDate: string; events: CalendarEvent[]; onEventClick: (evt: CalendarEvent) => void }) {
  const weekDays = getWeekDays(currentDate);
  const hours = getHoursRange(6, 22);
  // Calculamos el número total de filas: cada hora ocupa 2 filas (2.5rem cada una)
  const totalRows = (22 - 6) * 2; // (16 * 2 = 32 filas)

  return (
    <div className="flex flex-col">
      {/* Cabecera: columna de horas vacía + días */}
      <div className="hidden sm:flex border-b border-gray-200 text-xs text-gray-500">
        <div className="w-12" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day) => (
            <div key={day.date} className="py-2 pl-1">
              <p className="font-medium text-center">
                {day.dayName} {day.label}
              </p>
              {day.isToday && (
                <p className="mt-1 text-indigo-600 font-semibold text-center">Hoy</p>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Contenedor principal: columna de horas y grid de eventos */}
      <div className="flex flex-auto">
        {/* Columna de horas: ahora como grid con 32 filas */}
        <div className="w-12 grid" style={{ gridTemplateRows: `repeat(${totalRows}, 2.5rem)` }}>
          {hours.map((hour, idx) => (
            <div
              key={hour}
              className="text-right pr-2 text-xs text-gray-400"
              style={{ gridRow: `${idx * 2 + 1} / span 2` }}
            >
              {dayjs().hour(hour).minute(0).format('h:mm A')}
            </div>
          ))}
        </div>
        {/* Grid de eventos: 7 columnas para cada día */}
        <div className="flex-1 relative">
          <div
            className="grid gap-0 w-full border"
            style={{
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: `repeat(${totalRows}, 2.5rem)`,
              backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
              backgroundSize: `calc(100% / 7) 2.5rem, 100% 2.5rem`,
              backgroundPosition: 'top left, top left',
            }}
          >
            {events.map((event) => {
              const colIndex = weekDays.findIndex((wd) => wd.date === event.eventDay);
              if (colIndex < 0) return null;
              const { rowStart, span } = computeGridRowSpan(event.startTime, event.endTime, 6);
              const areaColors: Record<string, { bg: string; border: string; text: string }> = {
                'Gimnasio': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                'Salón de fiestas': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
                'Alberca': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                'Cancha de tenis': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
              };
              const colors = areaColors[event.commonArea] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={classNames(
                    "p-1 rounded border text-xs overflow-hidden cursor-pointer",
                    colors.bg,
                    colors.border,
                    colors.text
                  )}
                  style={{
                    gridColumn: colIndex + 1,
                    gridRow: `${rowStart} / span ${span}`,
                  }}
                >
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-xs">
                    {event.number} - {event.commonArea}
                  </p>
                  <p className="text-xs">
                    {dayjs(`${event.eventDay} ${event.startTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')} -{' '}
                    {dayjs(`${event.eventDay} ${event.endTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                  </p>
                  {/* {event.comments && <p className="text-xs">{event.comments}</p>} */}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



function MonthView({ currentDate, events }: { currentDate: string; events: CalendarEvent[] }) {
  const days = getMonthDays(currentDate);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2 capitalize">{dayjs(currentDate).format('MMMM YYYY')}</h2>
      <div className="grid grid-cols-7 text-xs text-center text-gray-500 mb-2">
        <span>Dom</span>
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
      </div>
      <div className="space-y-2">
        {weeks.map((week, idx) => (
          <div key={idx} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dayEvts = events.filter((evt) => evt.eventDay === day.date);
              return (
                <div
                  key={day.date}
                  className={classNames(
                    'border p-1 rounded relative h-24 overflow-auto',
                    !day.isCurrentMonth && 'bg-gray-50 text-gray-400',
                    day.isToday && 'border-indigo-500'
                  )}
                >
                  <span className="text-xs font-semibold">{day.dayNumber}</span>
                  {dayEvts.map((evt) => (
                    <div key={evt.id} className="mt-1 bg-blue-50 text-blue-700 text-xs rounded px-1">
                      {evt.name} - {evt.startTime}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function YearView({ currentDate, events }: { currentDate: string; events: CalendarEvent[] }) {
  const months = getYearMonths(currentDate);
  const year = dayjs(currentDate).year();
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{year}</h2>
      <div className="grid grid-cols-4 gap-4">
        {months.map((m) => {
          const startMonth = dayjs(new Date(year, m.index, 1)).startOf('month');
          const endMonth = dayjs(new Date(year, m.index, 1)).endOf('month');
          const monthEvts = events.filter((evt) => {
            const d = dayjs(evt.eventDay);
            return d.isBetween(startMonth, endMonth, 'day', '[]');
          });
          return (
            <div key={m.index} className="border p-2 rounded">
              <h3 className="text-sm font-semibold capitalize mb-1">{m.month}</h3>
              <p className="text-xs text-gray-500">{monthEvts.length} evento(s)</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
