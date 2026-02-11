import { useEffect } from "react";
import CardsHomeSummary from "./CardsHomeSummary";
import DirectAccess from "../../../components/shared/DirectAccess";
import { Card } from "@heroui/react";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { useCalendarEventsStore } from "../../../../store/useReservationStore";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import ImageSlider from "../../../components/shared/sliders/ImageSlider";
import { motion } from "framer-motion";
import DashboardOperationalHealth from "./DashboardOperationalHealth";


const NextEvents = () => {
  const { events, fetchEvents } = useCalendarEventsStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Obtener eventos de la semana actual
  const startWeek = dayjs().startOf("week");
  const endWeek = dayjs().endOf("week");

  const weekEvents = events
    .filter((event) => {
      const eventDate = dayjs(event.eventDay);
      return eventDate.isAfter(startWeek) && eventDate.isBefore(endWeek);
    })
    .sort((a, b) => dayjs(a.eventDay).diff(dayjs(b.eventDay)));

  return (
    <div className="space-y-3 px-2 max-h-[220px] overflow-auto py-2">
      {weekEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No hay eventos esta semana.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Puedes crear uno desde el calendario para mantener la agenda al día.
          </p>
        </div>
      ) : (
        weekEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
          >
            <div className="min-w-[50px] text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {dayjs(event.eventDay).format("DD")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dayjs(event.eventDay).format("MMM")}
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
          </motion.div>
        ))
      )}
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div className="flex flex-col gap-5 px-4 py-4 md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-5"
      >
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Vista General del Condominio
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revisa métricas clave, agenda semanal y accesos rápidos desde un solo lugar.
        </p>
      </motion.section>

      <section className="w-full">
        <CardsHomeSummary />
      </section>

      <DashboardOperationalHealth />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-7"
        >
          <Card className="p-5 pt-3 w-full rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold dark:text-white">
                  Agenda de esta semana
                </h3>
              </div>
              <Link
                to="/dashboard/calendar"
                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors border-b border-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 dark:border-indigo-400"
              >
                Abrir calendario
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Próximas reservaciones y eventos programados en áreas comunes.
            </p>
            <NextEvents />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="lg:col-span-5"
          id="novedades-guias"
        >
          <Card className="p-5 pt-3 flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold mb-1 text-center dark:text-white">
              Novedades y Guías
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              Actualizaciones del sistema y tutoriales rápidos para tu equipo.
            </p>
            <div className="flex justify-center">
              <ImageSlider />
            </div>
          </Card>
        </motion.div>
      </section>

      <DirectAccess />
    </div>
  );
};

export default DashboardHome;
