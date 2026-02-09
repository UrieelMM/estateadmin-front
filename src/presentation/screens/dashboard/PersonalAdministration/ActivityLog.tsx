import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PhotoIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import {
  usePersonalAdministrationStore,
  ActivityLog,
} from "../../../../store/PersonalAdministration";

const normalizeActivityType = (type: string) =>
  type === "tarea" ? "ticket" : type;

const getActivityLabel = (type: string) => {
  switch (normalizeActivityType(type)) {
    case "rondin":
      return "Rondín";
    case "mantenimiento":
      return "Mantenimiento";
    case "incidente":
      return "Incidente";
    case "ticket":
      return "Ticket";
    default:
      return "Otro";
  }
};

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityLog | null;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
}) => {
  const { employees } = usePersonalAdministrationStore();

  if (!isOpen || !activity) return null;

  const employee = employees.find((emp) => emp.id === activity.employeeId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Detalle de Actividad
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empleado
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {employee
                    ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`
                    : "Empleado no encontrado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Actividad
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {getActivityLabel(activity.type)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Área
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.area}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha y Hora
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.timestamp.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {activity.description}
              </p>
            </div>

            {/* Evidence */}
            {activity.evidence && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidencia
                </label>
                <div className="space-y-3">
                  {activity.evidence.photos &&
                    activity.evidence.photos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fotos
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {activity.evidence.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                            >
                              <img
                                src={photo}
                                alt={`Evidencia ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {activity.evidence.documents &&
                    activity.evidence.documents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Documentos
                        </h4>
                        <div className="space-y-2">
                          {activity.evidence.documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <a
                                href={doc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Documento {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Related Modules */}
            {activity.relatedModules && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Módulos Relacionados
                </label>
                <div className="space-y-2">
                  {activity.relatedModules.maintenanceId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mantenimiento: {activity.relatedModules.maintenanceId}
                    </p>
                  )}
                  {activity.relatedModules.incidentId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Incidente: {activity.relatedModules.incidentId}
                    </p>
                  )}
                  {activity.relatedModules.ticketId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tarea: {activity.relatedModules.ticketId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ActivityLogComponent: React.FC = () => {
  const { employees, getActivityLogs, activityLogs } =
    usePersonalAdministrationStore();

  const [filters, setFilters] = useState({
    employeeId: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>(
    []
  );

  useEffect(() => {
    let activities = getActivityLogs(
      filters.employeeId || undefined,
      filters.type || undefined,
      filters.startDate ? new Date(filters.startDate) : undefined,
      filters.endDate ? new Date(filters.endDate) : undefined
    );

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      activities = activities.filter(
        (activity) =>
          activity.description.toLowerCase().includes(searchLower) ||
          activity.area.toLowerCase().includes(searchLower) ||
          activity.type.toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setFilteredActivities(activities);
  }, [filters, searchTerm, getActivityLogs, activityLogs]);

  const getActivityIcon = (type: string) => {
    switch (normalizeActivityType(type)) {
      case "rondin":
        return ClockIcon;
      case "mantenimiento":
        return WrenchScrewdriverIcon;
      case "incidente":
        return ExclamationTriangleIcon;
      case "ticket":
        return CheckCircleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (normalizeActivityType(type)) {
      case "rondin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "mantenimiento":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "incidente":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "ticket":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee
      ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`
      : "Empleado no encontrado";
  };

  const handleViewActivity = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setFilters({
      employeeId: "",
      type: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bitácora de Actividades
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredActivities.length} actividad(es) registrada(s)
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en descripción, área o tipo de actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Empleado
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los empleados</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.personalInfo.firstName}{" "}
                      {employee.personalInfo.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Actividad
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="rondin">Rondín</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="incidente">Incidente</option>
                  <option value="ticket">Ticket</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.map((activity, index) => {
          const ActivityIcon = getActivityIcon(activity.type);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* Activity Icon */}
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <ActivityIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(
                          activity.type
                        )}`}
                      >
                        {getActivityLabel(activity.type)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.area}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.timestamp.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleViewActivity(activity)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getEmployeeName(activity.employeeId)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {activity.description}
                  </p>

                  {/* Evidence indicators */}
                  {activity.evidence && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {activity.evidence.photos &&
                        activity.evidence.photos.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <PhotoIcon className="h-4 w-4" />
                            <span>
                              {activity.evidence.photos.length} foto(s)
                            </span>
                          </div>
                        )}
                      {activity.evidence.documents &&
                        activity.evidence.documents.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <DocumentIcon className="h-4 w-4" />
                            <span>
                              {activity.evidence.documents.length} documento(s)
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No se encontraron actividades
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || Object.values(filters).some((f) => f)
              ? "Intenta ajustar los filtros de búsqueda"
              : "Las actividades aparecerán aquí cuando se registren"}
          </p>
        </motion.div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        activity={selectedActivity}
      />
    </div>
  );
};

export default ActivityLogComponent;
