import {
  NotificationEventType,
  NotificationPriority,
  NotificationTargetAudience,
} from "../types/notifications";

type EventCatalogEntry = {
  eventType: NotificationEventType;
  moduleLabel: string;
  description: string;
  defaultPriority: NotificationPriority;
  defaultAudience: NotificationTargetAudience;
};

export const NOTIFICATION_EVENT_CATALOG: Record<
  NotificationEventType,
  EventCatalogEntry
> = {
  "inventory.low_stock": {
    eventType: "inventory.low_stock",
    moduleLabel: "Inventario",
    description: "Item con stock por debajo del mínimo configurado.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "inventory.out_of_stock": {
    eventType: "inventory.out_of_stock",
    moduleLabel: "Inventario",
    description: "Item sin existencias (stock en 0).",
    defaultPriority: "critical",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "maintenance.ticket_created": {
    eventType: "maintenance.ticket_created",
    moduleLabel: "Mantenimiento",
    description: "Nuevo ticket de mantenimiento registrado.",
    defaultPriority: "medium",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "maintenance.ticket_high_priority": {
    eventType: "maintenance.ticket_high_priority",
    moduleLabel: "Mantenimiento",
    description: "Ticket de mantenimiento marcado en prioridad alta.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "maintenance.appointment_24h": {
    eventType: "maintenance.appointment_24h",
    moduleLabel: "Mantenimiento",
    description: "Visita programada dentro de las próximas 24 horas.",
    defaultPriority: "medium",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "staff.employee_status_alert": {
    eventType: "staff.employee_status_alert",
    moduleLabel: "Personal",
    description: "Cambio relevante de estatus laboral del empleado.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "staff.shift_missing_checkout": {
    eventType: "staff.shift_missing_checkout",
    moduleLabel: "Personal",
    description: "Turno con entrada registrada pero sin salida.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "staff.document_expiring": {
    eventType: "staff.document_expiring",
    moduleLabel: "Personal",
    description: "Documento laboral próximo a vencer.",
    defaultPriority: "medium",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "finance.petty_cash_low_threshold": {
    eventType: "finance.petty_cash_low_threshold",
    moduleLabel: "Finanzas",
    description: "Caja chica por debajo del umbral configurado.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "finance.reconciliation_net_difference": {
    eventType: "finance.reconciliation_net_difference",
    moduleLabel: "Finanzas",
    description: "Conciliación con diferencia neta detectada.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "finance.expense_outlier": {
    eventType: "finance.expense_outlier",
    moduleLabel: "Finanzas",
    description: "Egreso alto fuera de patrón histórico.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "finance.invoice_pending_payment": {
    eventType: "finance.invoice_pending_payment",
    moduleLabel: "Finanzas",
    description: "Nueva factura pendiente de pago generada para el cliente.",
    defaultPriority: "critical",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "projects.expense_movement_registered": {
    eventType: "projects.expense_movement_registered",
    moduleLabel: "Proyectos",
    description: "Movimiento de gasto registrado en un proyecto.",
    defaultPriority: "medium",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "projects.task_overdue": {
    eventType: "projects.task_overdue",
    moduleLabel: "Proyectos",
    description: "Tarea vencida detectada en gestión de proyectos.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "projects.dependency_blocked": {
    eventType: "projects.dependency_blocked",
    moduleLabel: "Proyectos",
    description: "Tarea bloqueada por dependencia.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "projects.schedule_deviation": {
    eventType: "projects.schedule_deviation",
    moduleLabel: "Proyectos",
    description: "Desviación de tiempo mayor al 10% en proyecto activo.",
    defaultPriority: "high",
    defaultAudience: { scope: "admins_and_assistants" },
  },
  "projects.cost_deviation": {
    eventType: "projects.cost_deviation",
    moduleLabel: "Proyectos",
    description: "Desviación de costo mayor al 10% del presupuesto inicial.",
    defaultPriority: "critical",
    defaultAudience: { scope: "admins_and_assistants" },
  },
};
