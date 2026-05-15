import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useScheduledMaintenanceStore,
  CreateScheduledTaskPayload,
  MaintenanceFrequency,
  MaintenancePriority,
} from "../../../../store/useScheduledMaintenanceStore";
import { usePersonalAdministrationStore } from "../../../../store/PersonalAdministration";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BellAlertIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";

// ─── Config maps ──────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: MaintenanceFrequency; label: string; description: string }[] = [
  { value: "daily",     label: "Diaria",      description: "Se repite cada día" },
  { value: "weekly",    label: "Semanal",     description: "Se repite cada semana" },
  { value: "biweekly",  label: "Quincenal",   description: "Cada 2 semanas" },
  { value: "monthly",   label: "Mensual",     description: "Se repite cada mes" },
  { value: "quarterly", label: "Trimestral",  description: "Cada 3 meses" },
  { value: "biannual",  label: "Semestral",   description: "Cada 6 meses" },
  { value: "annual",    label: "Anual",       description: "Se repite cada año" },
];

const PRIORITY_OPTIONS: { value: MaintenancePriority; label: string; color: string; bg: string }[] = [
  { value: "low",      label: "Baja",    color: "text-green-700",  bg: "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700" },
  { value: "medium",   label: "Media",   color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700" },
  { value: "high",     label: "Alta",    color: "text-orange-700", bg: "bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700" },
  { value: "critical", label: "Crítica", color: "text-red-700",    bg: "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700" },
];

const CATEGORIES = [
  "Limpieza general",
  "Áreas verdes",
  "Plomería",
  "Electricidad",
  "Equipos mecánicos",
  "Fumigación",
  "Pintura",
  "Seguridad",
  "Elevadores",
  "Cisterna / Agua",
  "Aire acondicionado",
  "Otro",
];

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = (): Partial<CreateScheduledTaskPayload> & { nextDueDateStr: string; checklistInput: string } => ({
  title: "",
  description: "",
  category: "",
  location: "",
  priority: "medium",
  frequency: "monthly",
  estimatedDuration: 60,
  notificationDaysBefore: 3,
  instructions: "",
  assignedTo: "",
  assignedToName: "",
  isActive: true,
  status: "pending",
  checklistItems: [],
  attachments: [],
  nextDueDateStr: new Date().toISOString().split("T")[0],
  checklistInput: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateScheduledMaintenanceModal({ isOpen, onClose }: Props) {
  const { addTask, saving, error } = useScheduledMaintenanceStore();
  const { employees, fetchEmployees } = usePersonalAdministrationStore();

  const [form, setForm] = useState(defaultForm());
  const [activeSection, setActiveSection] = useState<"info" | "schedule" | "assignment" | "checklist">("info");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setForm(defaultForm());
      setActiveSection("info");
      setSubmitError(null);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── Form helpers ────────────────────────────────────────────────────────────

  const set_ = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addChecklistItem = () => {
    const item = form.checklistInput?.trim();
    if (!item) return;
    setForm((prev) => ({
      ...prev,
      checklistItems: [...(prev.checklistItems || []), item],
      checklistInput: "",
    }));
    checklistInputRef.current?.focus();
  };

  const removeChecklistItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      checklistItems: (prev.checklistItems || []).filter((_, i) => i !== index),
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    set_("assignedTo", employeeId);
    set_("assignedToName", emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : "");
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!form.title?.trim()) return "El título es obligatorio.";
    if (!form.category?.trim()) return "Selecciona una categoría.";
    if (!form.frequency) return "Selecciona la frecuencia.";
    if (!form.priority) return "Selecciona la prioridad.";
    if (!form.nextDueDateStr) return "Indica la primera fecha de vencimiento.";
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setSubmitError(validationError); return; }
    setSubmitError(null);

    const nextDueDate = Timestamp.fromDate(new Date(form.nextDueDateStr + "T12:00:00"));

    const payload: CreateScheduledTaskPayload = {
      title: form.title!.trim(),
      description: form.description?.trim() || "",
      category: form.category!.trim(),
      location: form.location?.trim() || "",
      priority: form.priority as MaintenancePriority,
      frequency: form.frequency as MaintenanceFrequency,
      status: "pending",
      nextDueDate,
      estimatedDuration: Number(form.estimatedDuration) || 60,
      notificationDaysBefore: Number(form.notificationDaysBefore) || 3,
      instructions: form.instructions?.trim() || "",
      assignedTo: form.assignedTo || "",
      assignedToName: form.assignedToName || "",
      isActive: true,
      checklistItems: form.checklistItems || [],
      attachments: [],
    };

    try {
      await addTask(payload);
      onClose();
    } catch {
      // error already set in store
    }
  };

  // ── Sections nav ───────────────────────────────────────────────────────────

  const SECTIONS = [
    { id: "info" as const,       label: "Información",   icon: <DocumentTextIcon className="h-4 w-4" /> },
    { id: "schedule" as const,   label: "Programación",  icon: <CalendarDaysIcon className="h-4 w-4" /> },
    { id: "assignment" as const, label: "Asignación",    icon: <UserIcon className="h-4 w-4" /> },
    { id: "checklist" as const,  label: "Checklist",     icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nueva Tarea Recurrente</h2>
              <p className="text-white/70 text-xs">Mantenimiento programado desde el dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 bg-gray-50 dark:bg-gray-800/50">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeSection === s.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">

          {/* ── INFORMACIÓN BÁSICA ── */}
          {activeSection === "info" && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title || ""}
                  onChange={(e) => set_("title", e.target.value)}
                  placeholder="Ej: Revisión mensual de cisterna"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => set_("description", e.target.value)}
                  rows={3}
                  placeholder="Describe qué se debe hacer en esta tarea..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                />
              </div>

              {/* Category + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category || ""}
                    onChange={(e) => set_("category", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="">Seleccionar categoría</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={form.location || ""}
                    onChange={(e) => set_("location", e.target.value)}
                    placeholder="Ej: Área de cisterna, planta baja"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set_("priority", opt.value)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.priority === opt.value
                          ? `${opt.bg} ${opt.color} scale-105 shadow-md`
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PROGRAMACIÓN ── */}
          {activeSection === "schedule" && (
            <div className="space-y-5">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia de recurrencia <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set_("frequency", opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        form.frequency === opt.value
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-300"
                      }`}
                    >
                      <div className={`h-3 w-3 rounded-full shrink-0 ${form.frequency === opt.value ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-500"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${form.frequency === opt.value ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next due date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Primera fecha de vencimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.nextDueDateStr || ""}
                  onChange={(e) => set_("nextDueDateStr", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Después de cada completación, la siguiente fecha se calculará automáticamente según la frecuencia.
                </p>
              </div>

              {/* Estimated duration + notification days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Duración estimada (minutos)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={form.estimatedDuration || 60}
                    onChange={(e) => set_("estimatedDuration", Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <BellAlertIcon className="h-4 w-4 inline mr-1" />
                    Notificar X días antes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={form.notificationDaysBefore || 3}
                    onChange={(e) => set_("notificationDaysBefore", Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── ASIGNACIÓN ── */}
          {activeSection === "assignment" && (
            <div className="space-y-5">
              {/* Employee selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Asignar a empleado
                </label>
                <select
                  value={form.assignedTo || ""}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Sin asignar</option>
                  {employees
                    .filter((e) => e.employmentInfo?.status === "activo")
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName} —{" "}
                        {emp.employmentInfo.position}
                      </option>
                    ))}
                </select>

                {form.assignedToName && (
                  <div className="mt-3 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 border border-indigo-100 dark:border-indigo-800">
                    <div className="h-9 w-9 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                      {form.assignedToName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                        {form.assignedToName}
                      </p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400">
                        {employees.find((e) => e.id === form.assignedTo)?.employmentInfo.position || ""}
                      </p>
                    </div>
                  </div>
                )}

                {employees.filter((e) => e.employmentInfo?.status === "activo").length === 0 && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    No hay empleados activos. Puedes dejar la tarea sin asignar por ahora.
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Instrucciones para el ejecutor
                </label>
                <textarea
                  value={form.instructions || ""}
                  onChange={(e) => set_("instructions", e.target.value)}
                  rows={5}
                  placeholder="Describe paso a paso cómo debe ejecutarse esta tarea: herramientas necesarias, precauciones de seguridad, resultados esperados..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* ── CHECKLIST ── */}
          {activeSection === "checklist" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  El checklist se usa durante la ejecución de cada recurrencia. Cada vez que la tarea se completa,
                  el resultado del checklist queda registrado en el historial de esa ejecución.
                </p>
              </div>

              {/* Add item */}
              <div className="flex gap-2">
                <input
                  ref={checklistInputRef}
                  type="text"
                  value={form.checklistInput || ""}
                  onChange={(e) => set_("checklistInput", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }}
                  placeholder="Agregar ítem de verificación..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  disabled={!form.checklistInput?.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              {/* Items list */}
              {(form.checklistItems || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  <ClipboardDocumentListIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Sin ítems en el checklist.</p>
                  <p className="text-xs mt-1">Es opcional — puedes agregar puntos de verificación arriba.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(form.checklistItems || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600 group"
                    >
                      <span className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-500 shrink-0" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(form.checklistItems || []).length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(form.checklistItems || []).length} ítem{(form.checklistItems || []).length !== 1 ? "s" : ""} en el checklist
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {(submitError || error) && (
          <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{submitError || error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 flex-wrap">
          {/* Section stepper hint */}
          <div className="flex items-center gap-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`h-2 rounded-full transition-all ${
                  activeSection === s.id ? "w-6 bg-indigo-500" : "w-2 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  Crear tarea recurrente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
