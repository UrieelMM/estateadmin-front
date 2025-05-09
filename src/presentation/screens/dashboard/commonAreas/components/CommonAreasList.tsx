import { CommonArea } from "../../../../../store/useCommonAreasStore";
import { formatCentsToMXN } from "../../../../../utils/curreyncy";
import {
  WrenchIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface CommonAreasListProps {
  commonAreas: CommonArea[];
  onViewDetails: (id: string) => void;
}

const CommonAreasList = ({
  commonAreas,
  onViewDetails,
}: CommonAreasListProps) => {
  if (commonAreas.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          No hay áreas comunes registradas
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comienza creando una nueva área común para el condominio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {commonAreas.map((area) => (
        <div
          key={area.id}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
          onClick={() => area.id && onViewDetails(area.id)}
        >
          <div className="relative h-48 overflow-hidden">
            {area.images && area.images.length > 0 ? (
              <img
                src={area.images[0]}
                alt={area.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {area.name}
                </span>
              </div>
            )}
            {area.status === "maintenance" && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                <WrenchIcon className="h-4 w-4 mr-1" />
                En Mantenimiento
              </div>
            )}
            {area.status === "inactive" && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                Inactiva
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {area.name}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
              {area.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                <span>Capacidad: {area.capacity}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>
                  {area.openTime} - {area.closeTime}
                </span>
              </div>

              {area.isReservable && (
                <div className="col-span-2 mt-2">
                  <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 text-xs font-medium py-1 px-2 rounded flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Reservable: {formatCentsToMXN(area.rate)}/hora</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommonAreasList;
