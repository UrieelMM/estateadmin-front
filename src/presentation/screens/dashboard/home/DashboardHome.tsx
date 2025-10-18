import { useEffect } from "react";
import CardsHomeSummary from "./CardsHomeSummary";
import DirectAccess from "../../../components/shared/DirectAccess";
import { Card } from "@heroui/react";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { useCalendarEventsStore } from "../../../../store/useReservationStore";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import ImageSlider from "../../../components/shared/sliders/ImageSlider";
import { useAppTour } from "../../../../hooks/useAppTour";
import TourButton from "../../../components/shared/TourButton";

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
    <div className="space-y-3 px-2 max-h-[200px] overflow-auto shadow-lg py-4">
      {weekEvents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No hay eventos esta semana
        </p>
      ) : (
        weekEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:shadow-xl"
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
          </div>
        ))
      )}
    </div>
  );
};

const DashboardHome = () => {
  // Inicializar el tour de la aplicación
  const { startTour } = useAppTour();

  return (
    <>
      <TourButton onClick={startTour} />
      <div className="flex flex-col gap-6 px-4 py-4 md:px-8">
      {/* Fila 1: Solo Cards Summary (KPIs) */}
      <div className="w-full">
        <section>
          <CardsHomeSummary />
        </section>
      </div>

      {/* Fila 2: Calendario (70%) y Slider (30%) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Columna izquierda (60%) - Calendario */}
        <div className="w-full lg:w-[60%]">
          <Card className="p-6 pt-2 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold dark:text-white">
                  Eventos de la Semana
                </h3>
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

        {/* Columna derecha (40%) - Slider de imágenes */}
        <div className="w-full lg:w-[40%]" id="novedades-guias">
          <Card className="p-6 pt-0 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-center dark:text-white">
              Novedades y Guías
            </h3>
            <div className="flex justify-center">
              <ImageSlider />
            </div>
          </Card>
        </div>
      </div>

      {/* Fila 3: Accesos Directos (100% ancho) */}
      <DirectAccess />
      </div>
    </>
  );
};

export default DashboardHome;
