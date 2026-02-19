export type NotificationModule =
  | "inventory"
  | "maintenance"
  | "staff"
  | "projects"
  | "finance"
  | "system";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export type NotificationChannel = "in_app";

export type NotificationAudienceScope =
  | "admins"
  | "admins_and_assistants"
  | "specific_users";

export type NotificationEventType =
  | "inventory.low_stock"
  | "inventory.out_of_stock"
  | "maintenance.ticket_created"
  | "maintenance.ticket_high_priority"
  | "maintenance.appointment_24h"
  | "staff.employee_status_alert"
  | "staff.shift_missing_checkout"
  | "staff.document_expiring"
  | "finance.petty_cash_low_threshold"
  | "finance.reconciliation_net_difference"
  | "finance.expense_outlier"
  | "finance.invoice_pending_payment"
  | "projects.expense_movement_registered"
  | "projects.task_overdue"
  | "projects.dependency_blocked"
  | "projects.schedule_deviation"
  | "projects.cost_deviation";

export interface NotificationTargetAudience {
  scope: NotificationAudienceScope;
  userIds?: string[];
}

export interface NotificationTemplateData {
  title: string;
  body: string;
}

export interface DomainNotificationEventInput {
  eventType: NotificationEventType;
  module: NotificationModule;
  priority: NotificationPriority;
  dedupeKey: string;
  audience?: NotificationTargetAudience;
  channels?: NotificationChannel[];
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  title: string;
  body: string;
  context?: {
    clientId: string;
    condominiumId: string;
  };
}

export interface NotificationEventDoc {
  eventType: NotificationEventType;
  module: NotificationModule;
  priority: NotificationPriority;
  title: string;
  body: string;
  dedupeKey: string;
  channels: NotificationChannel[];
  audience: NotificationTargetAudience;
  entityId: string;
  entityType: string;
  metadata: Record<string, unknown>;
  createdAt: unknown;
  createdBy: string;
  createdByName: string;
  status: "pending_dispatch" | "emitted";
  clientId: string;
  condominiumId: string;
}

export interface NotificationQueueDoc {
  sourceEventId: string;
  eventType: NotificationEventType;
  module: NotificationModule;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: "dispatched";
  dedupeKey: string;
  recipientsCount: number;
  recipients: string[];
  createdAt: unknown;
  dispatchedAt: unknown;
  dispatchedBy: string;
  clientId: string;
  condominiumId: string;
}

export interface UserNotificationDoc {
  title: string;
  body: string;
  module: NotificationModule;
  eventType: NotificationEventType;
  priority: NotificationPriority;
  read: boolean;
  readAt: unknown | null;
  entityId: string;
  entityType: string;
  metadata: Record<string, unknown>;
  sourceEventId: string;
  sourceQueueId: string;
  createdAt: unknown;
  createdBy: string;
  clientId: string;
  condominiumId: string;
}
