import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useScheduledMaintenanceStore,
  ScheduledTask,
  MaintenanceTaskStatus,
  MaintenancePriority,
} from "../../../../store/useScheduledMaintenanceStore";
import CreateScheduledMaintenanceModal from "./CreateScheduledMaintenanceModal";
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellAlertIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  PhotoIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  ExclamationCircleIcon,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MaintenanceTaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendiente",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-700",
    dot: "bg-yellow-500",
    icon: <ClockIcon className="h-3.5 w-3.5" />,
  },
  in_progress: {
    label: "En progreso",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    dot: "bg-blue-500",
    icon: <ArrowPathIcon className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completada",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
    dot: "bg-green-500",
    icon: <CheckCircleIcon className="h-3.5 w-3.5" />,
  },
  overdue: {
    label: "Vencida",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    dot: "bg-red-500",
    icon: <ExclamationTriangleIcon className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelada",
    bg: "bg-gray-50 dark:bg-gray-700/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-600",
    dot: "bg-gray-400",
    icon: <XMarkIcon className="h-3.5 w-3.5" />,
  },
};

const PRIORITY_CONFIG: Record<
  MaintenancePriority,
  { label: string; bg: string; text: string; border: string; barColor: string }
> = {
  low: {
    label: "Baja",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
    barColor: "bg-green-500",
  },
  medium: {
    label: "Media",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-700",
    barColor: "bg-yellow-500",
  },
  high: {
    label: "Alta",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-700",
    barColor: "bg-orange-500",
  },
  critical: {
    label: "Crítica",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    barColor: "bg-red-600",
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diaria",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  biannual: "Semestral",
  annual: "Anual",
};

const ACTION_LABELS: Record<string, string> = {
  created: "Creada",
  updated: "Actualizada",
  completed: "Completada",
  status_changed: "Estado cambiado",
  assigned: "Reasignada",
  deleted: "Eliminada",
  checklist_updated: "Checklist actualizado",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: MaintenanceTaskStatus }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: MaintenancePriority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.barColor}`} />
      {cfg.label}
    </span>
  );
};

const DueDateChip = ({ task }: { task: ScheduledTask }) => {
  const dueDate = task.nextDueDate?.toDate?.();
  if (!dueDate) return null;
  const now = moment();
  const due = moment(dueDate);
  const diffDays = due.diff(now, "days");
  const isOverdue = task.status === "overdue" || (diffDays < 0 && task.status !== "completed");
  const isDueToday = diffDays === 0;
  const isDueSoon = diffDays > 0 && diffDays <= 3;

  const label = isOverdue
    ? `Venció ${due.fromNow()}`
    : isDueToday
    ? "Vence hoy"
    : isDueSoon
    ? `Vence en ${diffDays}d`
    : due.format("D MMM YYYY");

  const cls = isOverdue
    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    : isDueToday
    ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
    : isDueSoon
    ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${cls}`}
    >
      <CalendarDaysIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MaintenanceScheduledTasks = () => {
  const { tasks, loading, error, fetchTasks } = useScheduledMaintenanceStore();

  // Filters
  const [statusFilter, setStatusFilter] = useState<MaintenanceTaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "checklist" | "history" | "completions">("info");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))],
    [tasks]
  );

  const stats = useMemo(() => {
    const now = moment();
    return {
      total: tasks.length,
      overdue: tasks.filter((t) => t.status === "overdue").length,
      critical: tasks.filter((t) => t.priority === "critical" && t.status !== "completed").length,
      dueToday: tasks.filter((t) => {
        const due = t.nextDueDate?.toDate?.();
        return due && moment(due).isSame(now, "day") && t.status !== "completed";
      }).length,
      dueSoon: tasks.filter((t) => {
        const due = t.nextDueDate?.toDate?.();
        const diff = due ? moment(due).diff(now, "days") : 999;
        return diff > 0 && diff <= 3 && t.status !== "completed";
      }).length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || t.priority === priorityFilter;
      const categoryMatch = categoryFilter === "all" || t.category === categoryFilter;
      const searchMatch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedToName?.toLowerCase().includes(search.toLowerCase()) ||
        t.location?.toLowerCase().includes(search.toLowerCase());
      return statusMatch && priorityMatch && categoryMatch && searchMatch;
    });
  }, [tasks, statusFilter, priorityFilter, categoryFilter, search]);

  const hasActiveFilters =
    statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || search !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setSearch("");
  };

  // ── Detail Modal ──────────────────────────────────────────────────────────────

  const DetailModal = () => {
    if (!selectedTask) return null;
    const t = selectedTask;
    const priorityCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
    const checklistDone = t.checklistProgress
      ? Object.values(t.checklistProgress).filter(Boolean).length
      : 0;
    const checklistTotal = t.checklistItems?.length || 0;

    return createPortal(
      <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl my-4">
          {/* ── Header ── */}
          <div
            className={`rounded-t-2xl px-6 py-5 flex items-start justify-between ${priorityCfg.barColor.replace("bg-", "bg-")} bg-gradient-to-r from-indigo-600 to-purple-700`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <span className="text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                  {FREQUENCY_LABELS[t.frequency] || t.frequency}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white truncate mt-2">{t.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-white/70 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {t.location || "Sin ubicación"}
                </span>
                <span className="flex items-center gap-1">
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  {t.category || "Sin categoría"}
                </span>
                <DueDateChip task={t} />
              </div>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors ml-3 shrink-0"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* ── Created by banner ── */}
          <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
              </div>
              <div>
                <span className="text-xs text-indigo-500 dark:text-indigo-400">Creada por</span>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                  {t.createdByName || "Desconocido"}
                </p>
              </div>
            </div>
            <span className="text-indigo-300 dark:text-indigo-600">·</span>
            <div>
              <span className="text-xs text-indigo-500 dark:text-indigo-400">Fecha de creación</span>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                {t.createdAt ? moment(t.createdAt.toDate()).format("D [de] MMMM [de] YYYY, HH:mm") : "—"}
              </p>
            </div>
            {t.assignedToName && (
              <>
                <span className="text-indigo-300 dark:text-indigo-600">·</span>
                <div>
                  <span className="text-xs text-indigo-500 dark:text-indigo-400">Asignada a</span>
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    {t.assignedToName}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── Inner tabs ── */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <nav className="flex gap-1 -mb-px" aria-label="Modal tabs">
              {(
                [
                  { id: "info", label: "Información", icon: <InformationCircleIcon className="h-4 w-4" /> },
                  {
                    id: "checklist",
                    label: `Checklist (${checklistDone}/${checklistTotal})`,
                    icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
                  },
                  {
                    id: "completions",
                    label: `Completadas (${t.completionHistory?.length || 0})`,
                    icon: <CheckCircleIcon className="h-4 w-4" />,
                  },
                  {
                    id: "history",
                    label: `Historial (${t.history?.length || 0})`,
                    icon: <ClockIcon className="h-4 w-4" />,
                  },
                ] as { id: typeof detailTab; label: string; icon: React.ReactNode }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    detailTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Tab Content ── */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">

            {/* INFO TAB */}
            {detailTab === "info" && (
              <div className="space-y-5">
                {/* Description */}
                {t.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Descripción
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap text-sm">
                      {t.description}
                    </p>
                  </div>
                )}

                {/* Detail grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard icon={<WrenchScrewdriverIcon className="h-5 w-5 text-indigo-500" />} label="Categoría">
                    {t.category || "—"}
                  </InfoCard>
                  <InfoCard icon={<MapPinIcon className="h-5 w-5 text-indigo-500" />} label="Ubicación">
                    {t.location || "—"}
                  </InfoCard>
                  <InfoCard icon={<ArrowPathIcon className="h-5 w-5 text-indigo-500" />} label="Frecuencia">
                    {FREQUENCY_LABELS[t.frequency] || t.frequency}
                  </InfoCard>
                  <InfoCard icon={<ClockIcon className="h-5 w-5 text-indigo-500" />} label="Duración estimada">
                    {t.estimatedDuration ? `${t.estimatedDuration} minutos` : "—"}
                  </InfoCard>
                  <InfoCard icon={<CalendarDaysIcon className="h-5 w-5 text-indigo-500" />} label="Próximo vencimiento">
                    {t.nextDueDate
                      ? moment(t.nextDueDate.toDate()).format("D [de] MMMM [de] YYYY")
                      : "—"}
                  </InfoCard>
                  <InfoCard icon={<CheckCircleIcon className="h-5 w-5 text-indigo-500" />} label="Última completación">
                    {t.lastCompletedDate
                      ? moment(t.lastCompletedDate.toDate()).format("D [de] MMMM [de] YYYY")
                      : "Sin completaciones aún"}
                  </InfoCard>
                  <InfoCard icon={<BellAlertIcon className="h-5 w-5 text-indigo-500" />} label="Notificar antes de">
                    {t.notificationDaysBefore ? `${t.notificationDaysBefore} días` : "—"}
                  </InfoCard>
                  <InfoCard icon={<UserIcon className="h-5 w-5 text-indigo-500" />} label="Última modificación por">
                    {t.updatedByName || "—"}
                    {t.updatedAt && (
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {moment(t.updatedAt.toDate()).fromNow()}
                      </span>
                    )}
                  </InfoCard>
                </div>

                {/* Instructions */}
                {t.instructions && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Instrucciones
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 leading-relaxed whitespace-pre-wrap text-sm">
                      {t.instructions}
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {t.attachments && t.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <PhotoIcon className="h-4 w-4" />
                      Archivos adjuntos ({t.attachments.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {t.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-indigo-400 transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Adjunto ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHECKLIST TAB */}
            {detailTab === "checklist" && (
              <div>
                {!t.checklistItems || t.checklistItems.length === 0 ? (
                  <EmptyState icon={<ClipboardDocumentListIcon className="h-10 w-10" />} text="Sin ítems en el checklist" />
                ) : (
                  <div className="space-y-2">
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          Progreso actual
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {checklistDone}/{checklistTotal}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-indigo-500 h-2.5 rounded-full transition-all"
                          style={{ width: checklistTotal > 0 ? `${(checklistDone / checklistTotal) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    {t.checklistItems.map((item, i) => {
                      const done = t.checklistProgress?.[i] || false;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            done
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          {done ? (
                            <CheckCircleIconSolid className="h-5 w-5 text-green-500 shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-500 shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              done
                                ? "text-green-700 dark:text-green-300 line-through"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* COMPLETIONS TAB */}
            {detailTab === "completions" && (
              <div className="space-y-4">
                {!t.completionHistory || t.completionHistory.length === 0 ? (
                  <EmptyState icon={<CheckCircleIcon className="h-10 w-10" />} text="Sin completaciones registradas" />
                ) : (
                  [...t.completionHistory]
                    .sort((a, b) => b.completedAt?.seconds - a.completedAt?.seconds)
                    .map((c, i) => (
                      <div
                        key={c.id || i}
                        className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600 p-4"
                      >
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-gray-800 dark:text-white text-sm">
                              {c.completedByName || "Usuario desconocido"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {c.completedAt
                                ? moment(c.completedAt.toDate()).format("D MMM YYYY, HH:mm")
                                : "—"}
                            </span>
                            {c.duration > 0 && (
                              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                {c.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                        {c.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                            "{c.notes}"
                          </p>
                        )}
                        {c.checklistResults && Object.keys(c.checklistResults).length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Checklist:{" "}
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {Object.values(c.checklistResults).filter(Boolean).length}/
                              {Object.keys(c.checklistResults).length} completados
                            </span>
                          </div>
                        )}
                        {c.photos && c.photos.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {c.photos.map((url, pi) => (
                              <a key={pi} href={url} target="_blank" rel="noreferrer">
                                <img
                                  src={url}
                                  alt={`Foto ${pi + 1}`}
                                  className="h-14 w-14 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-400 transition-colors"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {detailTab === "history" && (
              <div className="space-y-3">
                {!t.history || t.history.length === 0 ? (
                  <EmptyState icon={<ClockIcon className="h-10 w-10" />} text="Sin historial de cambios" />
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-600" />
                    <div className="space-y-4">
                      {[...t.history]
                        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                        .map((h, i) => (
                          <div key={h.id || i} className="flex gap-4 items-start">
                            {/* Dot */}
                            <div
                              className={`relative z-10 h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shrink-0 text-xs font-bold ${
                                h.action === "created"
                                  ? "bg-green-500 text-white"
                                  : h.action === "completed"
                                  ? "bg-indigo-500 text-white"
                                  : h.action === "status_changed"
                                  ? "bg-yellow-500 text-white"
                                  : h.action === "deleted"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-white"
                              }`}
                            >
                              {h.action === "created"
                                ? "✦"
                                : h.action === "completed"
                                ? "✓"
                                : h.action === "status_changed"
                                ? "↻"
                                : "·"}
                            </div>
                            {/* Content */}
                            <div className="flex-1 pb-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                    {h.userName || "Usuario"}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    — {ACTION_LABELS[h.action] || h.action}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {h.timestamp
                                    ? moment(h.timestamp.toDate()).format("D MMM YYYY, HH:mm")
                                    : "—"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {h.description}
                              </p>
                              {h.changes && h.changes.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {h.changes.map((change, ci) => (
                                    <div
                                      key={ci}
                                      className="text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5"
                                    >
                                      <span className="font-medium text-gray-600 dark:text-gray-300">
                                        {change.field}:
                                      </span>{" "}
                                      <span className="text-red-500 dark:text-red-400 line-through">
                                        {String(change.oldValue ?? "—")}
                                      </span>{" "}
                                      →{" "}
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        {String(change.newValue ?? "—")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ── Loading / Error ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        <button
          onClick={() => fetchTasks()}
          className="ml-auto text-xs text-red-600 dark:text-red-400 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total" value={stats.total} color="indigo" />
        <StatCard label="Vencidas" value={stats.overdue} color="red" alert={stats.overdue > 0} />
        <StatCard label="Críticas" value={stats.critical} color="orange" alert={stats.critical > 0} />
        <StatCard label="Vencen hoy" value={stats.dueToday} color="yellow" alert={stats.dueToday > 0} />
        <StatCard label="Vencen pronto" value={stats.dueSoon} color="amber" />
        <StatCard label="Pendientes" value={stats.pending} color="blue" />
        <StatCard label="Completadas" value={stats.completed} color="green" />
      </div>

      {/* ── Alert Banners ── */}
      {stats.overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">
            <span className="font-bold">{stats.overdue} tarea{stats.overdue > 1 ? "s" : ""}</span>{" "}
            {stats.overdue > 1 ? "han" : "ha"} vencido su fecha límite y requieren{" "}
            {stats.overdue > 1 ? "" : "e"} atención inmediata.
          </p>
          <button
            onClick={() => setStatusFilter("overdue")}
            className="ml-auto text-xs font-semibold text-red-700 dark:text-red-300 hover:underline whitespace-nowrap"
          >
            Ver vencidas →
          </button>
        </div>
      )}

      {stats.critical > 0 && stats.overdue === 0 && (
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-5 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Hay <span className="font-bold">{stats.critical} tarea{stats.critical > 1 ? "s" : ""} de prioridad crítica</span>{" "}
            sin completar.
          </p>
          <button
            onClick={() => setPriorityFilter("critical")}
            className="ml-auto text-xs font-semibold text-orange-700 dark:text-orange-300 hover:underline whitespace-nowrap"
          >
            Ver críticas →
          </button>
        </div>
      )}

      {/* ── Filters Panel ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descripción, empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700"
                : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 bg-indigo-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => fetchTasks()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-600"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all shadow-md shadow-indigo-500/20"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Estado
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "pending", "in_progress", "overdue", "completed", "cancelled"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        statusFilter === s
                          ? s === "all"
                            ? "bg-indigo-500 text-white border-indigo-500"
                            : `${STATUS_CONFIG[s as MaintenanceTaskStatus]?.bg || "bg-gray-100"} ${
                                STATUS_CONFIG[s as MaintenanceTaskStatus]?.text || "text-gray-700"
                              } ${STATUS_CONFIG[s as MaintenanceTaskStatus]?.border || "border-gray-300"} shadow-sm`
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {s === "all" ? "Todos" : STATUS_CONFIG[s as MaintenanceTaskStatus]?.label || s}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Priority filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Prioridad
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      priorityFilter === p
                        ? p === "all"
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : `${PRIORITY_CONFIG[p as MaintenancePriority]?.bg} ${
                              PRIORITY_CONFIG[p as MaintenancePriority]?.text
                            } ${PRIORITY_CONFIG[p as MaintenancePriority]?.border} shadow-sm`
                        : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    {p === "all" ? "Todas" : PRIORITY_CONFIG[p as MaintenancePriority]?.label || p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "Todas las categorías" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active filters + count */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{filteredTasks.length}</span>
            {" "}de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{tasks.length}</span>{" "}
            tareas
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Task List ── */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <EmptyState
            icon={<WrenchScrewdriverIcon className="h-12 w-12" />}
            text={
              hasActiveFilters
                ? "No hay tareas que coincidan con los filtros actuales."
                : "Aún no hay tareas de mantenimiento programado. Crea la primera desde el dashboard o desde la app móvil."
            }
          >
            {!hasActiveFilters && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all shadow-md shadow-indigo-500/20"
              >
                <PlusIcon className="h-4 w-4" />
                Crear primera tarea
              </button>
            )}
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => { setSelectedTask(task); setDetailTab("info"); }} />
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedTask && <DetailModal />}

      {/* ── Create Modal ── */}
      <CreateScheduledMaintenanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────

const InfoCard = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-1.5">
      {icon}
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <div className="text-gray-900 dark:text-white font-semibold text-sm">{children}</div>
  </div>
);

const StatCard = ({
  label,
  value,
  color,
  alert = false,
}: {
  label: string;
  value: number;
  color: string;
  alert?: boolean;
}) => {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    red: "from-red-500 to-red-600",
    orange: "from-orange-500 to-orange-600",
    yellow: "from-yellow-500 to-yellow-600",
    amber: "from-amber-500 to-amber-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
  };
  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-md border overflow-hidden ${
        alert && value > 0
          ? "border-red-300 dark:border-red-700 ring-1 ring-red-400/30"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${colorMap[color] || colorMap.indigo}`} />
      <div className="p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p
          className={`text-2xl font-extrabold mt-0.5 ${
            alert && value > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
      {alert && value > 0 && (
        <ExclamationCircleIcon className="absolute top-3 right-3 h-4 w-4 text-red-400 dark:text-red-500" />
      )}
    </div>
  );
};

const TaskCard = ({
  task,
  onClick,
}: {
  task: ScheduledTask;
  onClick: () => void;
}) => {
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = task.status === "overdue";

  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border overflow-hidden ${
        isOverdue
          ? "border-red-300 dark:border-red-700 ring-1 ring-red-400/20"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500"
      }`}
    >
      {/* Priority bar */}
      <div className={`h-1 w-full ${priorityCfg.barColor}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 flex-1">
            {task.title}
          </h4>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge status={task.status} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            <ArrowPathIcon className="h-3 w-3" />
            {FREQUENCY_LABELS[task.frequency] || task.frequency}
          </span>
        </div>

        {/* Due date */}
        <div className="mb-3">
          <DueDateChip task={task} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-1 truncate">
            <UserIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">{task.assignedToName || "Sin asignar"}</span>
          </div>
          <div className="flex items-center gap-3">
            {task.category && (
              <span className="truncate max-w-[80px] hidden sm:block">{task.category}</span>
            )}
            {task.checklistItems && task.checklistItems.length > 0 && (
              <span className="flex items-center gap-1">
                <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                {Object.values(task.checklistProgress || {}).filter(Boolean).length}/
                {task.checklistItems.length}
              </span>
            )}
            {task.completionHistory && task.completionHistory.length > 0 && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {task.completionHistory.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  text,
  children,
}: {
  icon: React.ReactNode;
  text: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
      {icon}
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">{text}</p>
    {children}
  </div>
);

export default MaintenanceScheduledTasks;
