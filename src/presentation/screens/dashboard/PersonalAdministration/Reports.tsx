import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { usePersonalAdministrationStore } from "../../../../store/PersonalAdministration";
import { useTicketsStore } from "../maintenance/tickets/ticketsStore";

interface ReportData {
  attendance: any[];
  performance: any[];
  tickets: any[];
}

const Reports: React.FC = () => {
  const { employees, generateAttendanceReport, generatePerformanceReport } =
    usePersonalAdministrationStore();
  const { tickets } = useTicketsStore();

  const [selectedReport, setSelectedReport] = useState<
    "attendance" | "performance" | "tickets"
  >("attendance");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [reportData, setReportData] = useState<ReportData>({
    attendance: [],
    performance: [],
    tickets: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReports();
  }, [selectedReport, dateRange, selectedEmployee]);

  const generateTicketReport = (startDate: Date, endDate: Date) => {
    const filteredTickets = tickets.filter(
      (ticket) => ticket.createdAt >= startDate && ticket.createdAt <= endDate
    );

    const reportData = employees.map((employee) => {
      const employeeTickets = filteredTickets.filter(
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

      return {
        employee,
        totalTickets: employeeTickets.length,
        openTickets,
        inProgressTickets,
        closedTickets,
        completionRate:
          employeeTickets.length > 0
            ? (closedTickets / employeeTickets.length) * 100
            : 0,
      };
    });

    return reportData;
  };

  const generateReports = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      const attendance = generateAttendanceReport(startDate, endDate);
      const performance = generatePerformanceReport(
        selectedEmployee || undefined
      );
      const ticketReport = generateTicketReport(startDate, endDate);

      setReportData({
        attendance,
        performance: Array.isArray(performance) ? performance : [performance],
        tickets: ticketReport,
      });
    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const getAttendanceStats = () => {
    if (reportData.attendance.length === 0) return null;

    const totalEmployees = reportData.attendance.length;
    const avgAttendanceRate =
      reportData.attendance.reduce((sum, emp) => sum + emp.attendanceRate, 0) /
      totalEmployees;
    const totalShifts = reportData.attendance.reduce(
      (sum, emp) => sum + emp.totalShifts,
      0
    );
    const totalAbsences = reportData.attendance.reduce(
      (sum, emp) => sum + emp.absentShifts,
      0
    );

    return {
      totalEmployees,
      avgAttendanceRate,
      totalShifts,
      totalAbsences,
    };
  };

  const getPerformanceStats = () => {
    if (reportData.performance.length === 0) return null;

    const validPerformance = reportData.performance.filter(
      (emp) => emp.evaluations && emp.evaluations.length > 0
    );

    if (validPerformance.length === 0) return null;

    const avgScore =
      validPerformance.reduce((sum, emp) => sum + emp.averageScore, 0) /
      validPerformance.length;
    const totalEvaluations = validPerformance.reduce(
      (sum, emp) => sum + emp.evaluations.length,
      0
    );

    const scoreDistribution = {
      excellent: validPerformance.filter((emp) => emp.averageScore >= 4.5)
        .length,
      good: validPerformance.filter(
        (emp) => emp.averageScore >= 3.5 && emp.averageScore < 4.5
      ).length,
      average: validPerformance.filter(
        (emp) => emp.averageScore >= 2.5 && emp.averageScore < 3.5
      ).length,
      needsImprovement: validPerformance.filter((emp) => emp.averageScore < 2.5)
        .length,
    };

    return {
      avgScore,
      totalEvaluations,
      scoreDistribution,
      evaluatedEmployees: validPerformance.length,
    };
  };

  const getTicketStats = () => {
    if (reportData.tickets.length === 0) return null;

    const totalTickets = reportData.tickets.reduce(
      (sum, emp) => sum + emp.totalTickets,
      0
    );
    const closedTickets = reportData.tickets.reduce(
      (sum, emp) => sum + emp.closedTickets,
      0
    );
    const openTickets = reportData.tickets.reduce(
      (sum, emp) => sum + emp.openTickets,
      0
    );
    const avgCompletionRate =
      reportData.tickets.reduce((sum, emp) => sum + emp.completionRate, 0) /
      reportData.tickets.length;

    return {
      totalTickets,
      closedTickets,
      openTickets,
      avgCompletionRate,
    };
  };

  const reportTypes = [
    {
      id: "attendance",
      name: "Reporte de Asistencia",
      icon: ClockIcon,
      description: "Análisis de asistencia y puntualidad del personal",
    },
    {
      id: "performance",
      name: "Reporte de Desempeño",
      icon: ChartBarIcon,
      description: "Evaluaciones de desempeño y calificaciones",
    },
    {
      id: "tickets",
      name: "Reporte de Tickets",
      icon: CheckCircleIcon,
      description: "Análisis de tickets asignados y completados",
    },
  ];

  const attendanceStats = getAttendanceStats();
  const performanceStats = getPerformanceStats();
  const ticketStats = getTicketStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reportes y Análisis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Genera reportes detallados sobre el desempeño del personal
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={printReport}
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filtros
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empleado (opcional)
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

          <div className="flex items-end">
            <button
              onClick={generateReports}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Generando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tipos de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((type) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedReport === type.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => setSelectedReport(type.id as any)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-lg ${
                  selectedReport === type.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <type.icon className="h-6 w-6" />
              </div>
              <div>
                <h3
                  className={`font-medium ${
                    selectedReport === type.id
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {type.name}
                </h3>
                <p
                  className={`text-sm ${
                    selectedReport === type.id
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {type.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Estadísticas Resumen */}
      {selectedReport === "attendance" && attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Empleados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendanceStats.totalEmployees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Asistencia Promedio
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendanceStats.avgAttendanceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Turnos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendanceStats.totalShifts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Ausencias
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendanceStats.totalAbsences}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === "performance" && performanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Puntuación Promedio
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.avgScore.toFixed(1)}/5
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
                  Empleados Evaluados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.evaluatedEmployees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <DocumentArrowDownIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Evaluaciones
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.totalEvaluations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Necesitan Mejora
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.scoreDistribution.needsImprovement}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === "tickets" && ticketStats && (
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
                  {ticketStats.totalTickets}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tickets Cerrados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticketStats.closedTickets}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tickets Abiertos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticketStats.openTickets}
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
                  Tasa de Finalización
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticketStats.avgCompletionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Datos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {reportTypes.find((type) => type.id === selectedReport)?.name}
          </h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generando reporte...
              </p>
            </div>
          ) : (
            <div className="p-6">
              {selectedReport === "attendance" && (
                <div className="space-y-4">
                  {reportData.attendance.map((emp, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {emp.employee.personalInfo.firstName}{" "}
                          {emp.employee.personalInfo.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {emp.employee.employmentInfo.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {emp.attendanceRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {emp.completedShifts}/{emp.totalShifts} turnos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedReport === "performance" && (
                <div className="space-y-4">
                  {reportData.performance
                    .filter(
                      (emp) => emp.evaluations && emp.evaluations.length > 0
                    )
                    .map((emp, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {emp.employee.personalInfo.firstName}{" "}
                            {emp.employee.personalInfo.lastName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {emp.employee.employmentInfo.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {emp.averageScore.toFixed(1)}/5
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {emp.evaluations.length} evaluaciones
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {selectedReport === "tickets" && (
                <div className="space-y-4">
                  {reportData.tickets.map((emp, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {emp.employee.personalInfo.firstName}{" "}
                          {emp.employee.personalInfo.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {emp.employee.employmentInfo.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {emp.completionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {emp.closedTickets}/{emp.totalTickets} tickets
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
