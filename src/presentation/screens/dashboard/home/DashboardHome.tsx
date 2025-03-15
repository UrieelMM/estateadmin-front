import { useEffect } from 'react';
import CardsHomeSummary from '../../../components/CardsHomeSummary'
import DirectAccess from '../../../components/shared/DirectAccess'
import { Card } from "@heroui/react";
import {
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useCalendarEventsStore } from '../../../../store/useReservationStore';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const NextEvents = () => {
  const { events, fetchEvents } = useCalendarEventsStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Obtener eventos de la semana actual
  const startWeek = dayjs().startOf('week');
  const endWeek = dayjs().endOf('week');

  const weekEvents = events
    .filter(event => {
      const eventDate = dayjs(event.eventDay);
      return eventDate.isAfter(startWeek) && eventDate.isBefore(endWeek);
    })
    .sort((a, b) => dayjs(a.eventDay).diff(dayjs(b.eventDay)));

  return (
    <div className="space-y-3 max-h-[200px] overflow-auto shadow-lg">
      {weekEvents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay eventos esta semana</p>
      ) : (
        weekEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:shadow-xl"
          >
            <div className="min-w-[50px] text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {dayjs(event.eventDay).format('DD')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dayjs(event.eventDay).format('MMM')}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {event.commonArea}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {event.startTime} - {event.endTime}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div className='flex flex-col gap-6 px-4 md:px-8'>
      {/* Resumen Financiero */}
      <section>
        <CardsHomeSummary />
      </section>

      {/* Grid de información relevante */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DirectAccess />
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold dark:text-white">Eventos de la Semana</h3>
            </div>
            <Link
              to="/dashboard/calendar"
              className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors border-b border-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 dark:border-indigo-400"
            >
              Ver calendario
            </Link>
          </div>
          <NextEvents />
        </Card>
      </div>
    </div>
  )
}

export default DashboardHome