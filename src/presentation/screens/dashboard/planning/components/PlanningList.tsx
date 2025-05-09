import React from "react";
import {
  Planning,
  PlanningStatus,
  PlanningType,
} from "../../../../../store/planningStore";
import moment from "moment";
import "moment/locale/es";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface PlanningListProps {
  plannings: Planning[];
  onSelectPlanning: (planningId: string) => void;
}

const PlanningList: React.FC<PlanningListProps> = ({
  plannings,
  onSelectPlanning,
}) => {
  // Función para obtener el color de badge según el estado
  const getStatusColor = (status: PlanningStatus) => {
    switch (status) {
      case PlanningStatus.DRAFT:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case PlanningStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case PlanningStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case PlanningStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: PlanningStatus) => {
    switch (status) {
      case PlanningStatus.DRAFT:
        return "Borrador";
      case PlanningStatus.IN_PROGRESS:
        return "En Progreso";
      case PlanningStatus.COMPLETED:
        return "Completado";
      case PlanningStatus.CANCELLED:
        return "Cancelado";
      default:
        return "Desconocido";
    }
  };

  // Función para obtener el texto del tipo de planificación
  const getTypeText = (type: PlanningType) => {
    switch (type) {
      case PlanningType.MONTHLY:
        return "Mensual";
      case PlanningType.QUARTERLY:
        return "Trimestral";
      case PlanningType.BIANNUAL:
        return "Semestral";
      case PlanningType.ANNUAL:
        return "Anual";
      default:
        return "Desconocido";
    }
  };

  // Función para obtener el color del tipo de planificación
  const getTypeColor = (type: PlanningType) => {
    switch (type) {
      case PlanningType.MONTHLY:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case PlanningType.QUARTERLY:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";
      case PlanningType.BIANNUAL:
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300";
      case PlanningType.ANNUAL:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (!plannings.length) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay planificaciones
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea una nueva planificación para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plannings.map((planning) => (
          <li
            key={planning.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => onSelectPlanning(planning.id)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {planning.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        planning.status
                      )}`}
                    >
                      {getStatusText(planning.status)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        planning.type
                      )}`}
                    >
                      {getTypeText(planning.type)}
                    </span>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0 relative -mt-1">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {planning.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {planning.description}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span>
                    {moment(planning.startDate).format("D MMM YYYY")} -{" "}
                    {moment(planning.endDate).format("D MMM YYYY")}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span>Creado {moment(planning.createdAt).fromNow()}</span>
                </div>

                {planning.assignedTo.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span>
                      {planning.assignedTo.length}{" "}
                      {planning.assignedTo.length === 1
                        ? "asignado"
                        : "asignados"}
                    </span>
                  </div>
                )}

                {planning.tags.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <TagIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="truncate">
                      {planning.tags.slice(0, 3).join(", ")}
                      {planning.tags.length > 3 &&
                        ` +${planning.tags.length - 3}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanningList;
