import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { usePersonalAdministrationStore } from "../../../../store/PersonalAdministration";
import { useTicketsStore, Ticket } from "../maintenance/tickets/ticketsStore";
import { useNavigate } from "react-router-dom";

interface TicketStats {
  employeeId: string;
  employeeName: string;
  position: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  completionRate: number;
  avgResponseTime: number;
  tickets: Ticket[];
}

const TaskManagement: React.FC = () => {
  const { employees } = usePersonalAdministrationStore();
  const { tickets, loading, fetchTickets } = useTicketsStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "tickets" | "completion">(
    "name"
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Calcular estadísticas por empleado
  const getEmployeeStats = (): TicketStats[] => {
    const stats: TicketStats[] = [];

    employees.forEach((employee) => {
      const employeeTickets = tickets.filter(
        (ticket) => ticket.assignedTo === employee.id
      );

      const openTickets = employeeTickets.filter(
        (ticket) => ticket.status === "abierto"
      ).length;
      const inProgressTickets = employeeTickets.filter(
        (ticket) => ticket.status === "en_progreso"
      ).length;
      const closedTickets = employeeTickets.filter(
        (ticket) => ticket.status === "cerrado"
      ).length;

      const completionRate =
        employeeTickets.length > 0
          ? (closedTickets / employeeTickets.length) * 100
          : 0;

      // Calcular tiempo promedio de respuesta (días)
      const closedTicketsWithDates = employeeTickets.filter(
        (ticket) => ticket.status === "cerrado" && ticket.updatedAt
      );
      const avgResponseTime =
        closedTicketsWithDates.length > 0
          ? closedTicketsWithDates.reduce((sum, ticket) => {
              const days = Math.ceil(
                (ticket.updatedAt!.getTime() - ticket.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / closedTicketsWithDates.length
          : 0;

      stats.push({
        employeeId: employee.id,
        employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        position: employee.employmentInfo.position,
        totalTickets: employeeTickets.length,
        openTickets,
        inProgressTickets,
        closedTickets,
        completionRate,
        avgResponseTime,
        tickets: employeeTickets,
      });
    });

    return stats;
  };

  const employeeStats = getEmployeeStats();

  // Filtrar y ordenar estadísticas
  const filteredStats = employeeStats
    .filter((stat) => {
      const matchesSearch = stat.employeeName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesEmployee =
        !selectedEmployee || stat.employeeId === selectedEmployee;
      return matchesSearch && matchesEmployee;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.employeeName.localeCompare(b.employeeName);
        case "tickets":
          return b.totalTickets - a.totalTickets;
        case "completion":
          return b.completionRate - a.completionRate;
        default:
          return 0;
      }
    });

  // Estadísticas generales
  const totalTickets = tickets.length;
  const assignedTickets = tickets.filter((ticket) => ticket.assignedTo).length;
  const unassignedTickets = totalTickets - assignedTickets;
  const statsWithTickets = employeeStats.filter(
    (stat) => stat.totalTickets > 0
  );
  const avgCompletionRate =
    statsWithTickets.length > 0
      ? statsWithTickets.reduce((sum, stat) => sum + stat.completionRate, 0) /
        statsWithTickets.length
      : 0;

  const getStatusColor = (status: "abierto" | "en_progreso" | "cerrado") => {
    switch (status) {
      case "abierto":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "en_progreso":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      case "cerrado":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleCreateTicket = () => {
    navigate("/dashboard/maintenance-reports");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Análisis de Tickets por Personal
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estadísticas y rendimiento de tickets asignados al personal
          </p>
        </div>
        <button
          onClick={handleCreateTicket}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Crear Ticket
          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tickets
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tickets Asignados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignedTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sin Asignar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unassignedTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasa Promedio
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgCompletionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los empleados</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.personalInfo.firstName}{" "}
                {employee.personalInfo.lastName}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="tickets">Ordenar por tickets</option>
            <option value="completion">Ordenar por tasa de finalización</option>
          </select>
        </div>
      </div>

      {/* Lista de empleados con estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredStats.map((stat) => (
            <motion.div
              key={stat.employeeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stat.employeeName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {stat.position}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${getCompletionRateColor(
                      stat.completionRate
                    )}`}
                  >
                    {stat.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tasa de finalización
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.totalTickets}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stat.openTickets + stat.inProgressTickets}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Pendientes
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stat.closedTickets}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Cerrados
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Abiertos:
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {stat.openTickets}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    En progreso:
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {stat.inProgressTickets}
                  </span>
                </div>
                {stat.avgResponseTime > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tiempo promedio:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stat.avgResponseTime.toFixed(1)} días
                    </span>
                  </div>
                )}
              </div>

              {/* Últimos tickets */}
              {stat.tickets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Últimos tickets:
                  </h4>
                  <div className="space-y-2">
                    {stat.tickets.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                          {ticket.title}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status === "abierto"
                            ? "Abierto"
                            : ticket.status === "en_progreso"
                            ? "En Progreso"
                            : "Cerrado"}
                        </span>
                      </div>
                    ))}
                    {stat.tickets.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{stat.tickets.length - 3} tickets más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Cargando estadísticas...
          </p>
        </div>
      )}

      {!loading && filteredStats.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedEmployee
              ? "No se encontraron empleados con los filtros aplicados."
              : employees.length === 0
              ? "No hay empleados registrados."
              : tickets.length === 0
              ? "No hay tickets registrados."
              : "No hay datos de tickets para mostrar."}
          </p>
          <button
            onClick={handleCreateTicket}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Primer Ticket
            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
