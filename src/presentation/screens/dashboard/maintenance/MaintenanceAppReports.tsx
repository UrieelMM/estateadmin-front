import { useState, useEffect, useMemo } from "react";
import {
  useMaintenanceAppReportsStore,
  MaintenanceAppReport,
} from "../../../../store/useMaintenanceAppReportsStore";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

type FilterType = "day" | "week" | "month";

const MaintenanceAppReports = () => {
  const { reports, loading, error, fetchReports } = useMaintenanceAppReportsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<FilterType>("week");
  const [selectedReport, setSelectedReport] = useState<MaintenanceAppReport | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  useEffect(() => {
    fetchReports();
  }, []);

  // Calculate date range based on filter type
  const dateRange = useMemo(() => {
    const current = moment(currentDate);

    switch (filterType) {
      case "day":
        return {
          start: current.clone().startOf('day').toDate(),
          end: current.clone().endOf('day').toDate(),
        };
      case "week":
        return {
          start: current.clone().startOf('isoWeek').toDate(),
          end: current.clone().endOf('isoWeek').toDate(),
        };
      case "month":
        return {
          start: current.clone().startOf('month').toDate(),
          end: current.clone().endOf('month').toDate(),
        };
    }
  }, [currentDate, filterType]);

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    if (filterType !== "month") return [];
    
    const current = moment(currentDate);
    const monthStart = current.clone().startOf('month');
    const monthEnd = current.clone().endOf('month');
    const calendarStart = monthStart.clone().startOf('isoWeek');
    const calendarEnd = monthEnd.clone().endOf('isoWeek');

    const days: Date[] = [];
    const day = calendarStart.clone();
    
    while (day.isSameOrBefore(calendarEnd, 'day')) {
      days.push(day.toDate());
      day.add(1, 'day');
    }

    return days;
  }, [currentDate, filterType]);

  // Get unique employees
  const employees = useMemo(() => {
    const uniqueEmployees = new Map<string, string>();
    reports.forEach((report) => {
      if (!uniqueEmployees.has(report.employeeId)) {
        uniqueEmployees.set(report.employeeId, report.employeeName);
      }
    });
    return Array.from(uniqueEmployees.entries()).map(([id, name]) => ({ id, name }));
  }, [reports]);

  // Filter reports by date range and employee
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = report.createdAt.toDate();
      const dateMatch = reportDate >= dateRange.start && reportDate <= dateRange.end;
      const employeeMatch = selectedEmployee === "all" || report.employeeId === selectedEmployee;
      return dateMatch && employeeMatch;
    });
  }, [reports, dateRange, selectedEmployee]);

  // Group reports by day
  const reportsByDay = useMemo(() => {
    const grouped: { [key: string]: MaintenanceAppReport[] } = {};
    
    filteredReports.forEach((report) => {
      const dayKey = moment(report.createdAt.toDate()).format("YYYY-MM-DD");
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(report);
    });

    return grouped;
  }, [filteredReports]);

  const handlePrevious = () => {
    switch (filterType) {
      case "day":
        setCurrentDate((prev) => moment(prev).subtract(1, 'day').toDate());
        break;
      case "week":
        setCurrentDate((prev) => moment(prev).subtract(1, 'week').toDate());
        break;
      case "month":
        setCurrentDate((prev) => moment(prev).subtract(1, 'month').toDate());
        break;
    }
  };

  const handleNext = () => {
    switch (filterType) {
      case "day":
        setCurrentDate((prev) => moment(prev).add(1, 'day').toDate());
        break;
      case "week":
        setCurrentDate((prev) => moment(prev).add(1, 'week').toDate());
        break;
      case "month":
        setCurrentDate((prev) => moment(prev).add(1, 'month').toDate());
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    switch (filterType) {
      case "day":
        return moment(currentDate).format("D [de] MMMM [de] YYYY");
      case "week":
        return `${moment(dateRange.start).format("D MMM")} - ${moment(dateRange.end).format("D MMM YYYY")}`;
      case "month":
        return moment(currentDate).format("MMMM YYYY");
    }
  };

  const isMediaVideo = (url: string) => {
    return url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".mov") || url.toLowerCase().includes(".avi");
  };

  const openMediaModal = (report: MaintenanceAppReport, index: number = 0) => {
    setSelectedReport(report);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setShowMediaModal(false);
    setSelectedReport(null);
    setSelectedMediaIndex(0);
  };

  const ReportCard = ({ report, compact = false }: { report: MaintenanceAppReport; compact?: boolean }) => (
    <div
      onClick={() => setSelectedReport(report)}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl
        transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700
        hover:border-indigo-400 dark:hover:border-indigo-500 overflow-hidden
        ${compact ? "p-3" : "p-4"}
      `}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-semibold text-gray-900 dark:text-white ${compact ? "text-sm" : "text-base"} line-clamp-2 flex-1`}>
          {report.title}
        </h4>
        {report.mediaUrls && report.mediaUrls.length > 0 && (
          <div className="flex items-center gap-1 ml-2 text-xs text-indigo-600 dark:text-indigo-400">
            <PhotoIcon className="h-4 w-4" />
            <span>{report.mediaUrls.length}</span>
          </div>
        )}
      </div>

      <p className={`text-gray-600 dark:text-gray-400 ${compact ? "text-xs line-clamp-1" : "text-sm line-clamp-2"} mb-2`}>
        {report.description}
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <UserIcon className="h-3.5 w-3.5" />
          <span className="truncate max-w-[100px]">{report.employeeName}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>{moment(report.createdAt.toDate()).format("HH:mm")}</span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            {report.reportType}
          </span>
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  );

  const ReportDetailModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">{selectedReport.title}</h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Empleado</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedReport.employeeName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedReport.employeeId}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Condominio</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedReport.condominiumName}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {moment(selectedReport.startDate.toDate()).format("D [de] MMMM [de] YYYY, HH:mm")}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Fin</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {moment(selectedReport.endDate.toDate()).format("D [de] MMMM [de] YYYY, HH:mm")}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Supervisor</span>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedReport.supervisor}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Reporte</span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {selectedReport.reportType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Descripción
              </h4>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                {selectedReport.description}
              </p>
            </div>

            {/* Media Gallery */}
            {selectedReport.mediaUrls && selectedReport.mediaUrls.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Archivos Multimedia ({selectedReport.mediaUrls.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedReport.mediaUrls.map((url, index) => (
                    <div
                      key={index}
                      onClick={() => openMediaModal(selectedReport, index)}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100 dark:bg-gray-700"
                    >
                      {isMediaVideo(url) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <VideoCameraIcon className="h-12 w-12 text-gray-400" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Ver Video</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-white" />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MediaModal = () => {
    if (!showMediaModal || !selectedReport || !selectedReport.mediaUrls) return null;

    const currentMedia = selectedReport.mediaUrls[selectedMediaIndex];
    const isVideo = isMediaVideo(currentMedia);

    return (
      <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <button
          onClick={closeMediaModal}
          className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2 transition-colors z-10"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>

        <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
          {selectedReport.mediaUrls.length > 1 && (
            <>
              <button
                onClick={() => setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : selectedReport.mediaUrls.length - 1))}
                className="absolute left-4 text-white hover:bg-white/20 rounded-full p-3 transition-colors"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>
              <button
                onClick={() => setSelectedMediaIndex((prev) => (prev < selectedReport.mediaUrls.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 text-white hover:bg-white/20 rounded-full p-3 transition-colors"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-h-[90vh] max-w-full">
            {isVideo ? (
              <video
                src={currentMedia}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full rounded-lg"
              />
            ) : (
              <img
                src={currentMedia}
                alt={`Media ${selectedMediaIndex + 1}`}
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
              />
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {selectedMediaIndex + 1} / {selectedReport.mediaUrls.length}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* First Row: Filter Type and Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Type Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setFilterType("day")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterType === "day"
                  ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setFilterType("week")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterType === "week"
                  ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setFilterType("month")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterType === "month"
                  ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Mes
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center gap-2 min-w-[200px] justify-center">
              <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                {getDateRangeText()}
              </span>
            </div>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={handleToday}
              className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Hoy
            </button>
          </div>
          </div>

          {/* Second Row: Employee Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filtrar por empleado:
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="flex-1 max-w-xs px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="all">Todos los empleados</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            {selectedEmployee !== "all" && (
              <button
                onClick={() => setSelectedEmployee("all")}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Total de reportes: <span className="font-semibold text-gray-900 dark:text-white">{filteredReports.length}</span>
              </span>
            </div>
            {selectedEmployee !== "all" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Empleado: <span className="font-semibold text-gray-900 dark:text-white">{employees.find(e => e.id === selectedEmployee)?.name}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid (Month View) */}
      {filterType === "month" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayKey = moment(day).format("YYYY-MM-DD");
              const dayReports = reportsByDay[dayKey] || [];
              const isCurrentMonth = moment(day).month() === moment(currentDate).month();
              const isDayToday = moment(day).isSame(moment(), 'day');

              return (
                <div
                  key={dayKey}
                  className={`
                    min-h-[120px] rounded-lg border transition-all
                    ${isCurrentMonth
                      ? "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
                    }
                    ${isDayToday ? "ring-2 ring-indigo-500" : ""}
                  `}
                >
                  <div className={`
                    text-sm font-medium p-2 text-center
                    ${isDayToday
                      ? "bg-indigo-500 text-white rounded-t-lg"
                      : isCurrentMonth
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  `}>
                    {moment(day).format("D")}
                  </div>

                  <div className="p-2 space-y-1 overflow-y-auto max-h-[90px]">
                    {dayReports.slice(0, 2).map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 rounded px-2 py-1 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors truncate"
                      >
                        {report.title}
                      </div>
                    ))}
                    {dayReports.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{dayReports.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View (Day/Week) */}
      {(filterType === "day" || filterType === "week") && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No hay reportes para este período
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedReport && !showMediaModal && <ReportDetailModal />}
      {showMediaModal && <MediaModal />}
    </div>
  );
};

export default MaintenanceAppReports;
