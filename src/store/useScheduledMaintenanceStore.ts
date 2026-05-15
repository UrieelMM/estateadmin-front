import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import * as Sentry from "@sentry/react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type MaintenanceTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled";

export type MaintenancePriority = "low" | "medium" | "high" | "critical";

export type MaintenanceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "annual";

export interface MaintenanceCompletion {
  id: string;
  completedAt: Timestamp;
  completedBy: string;
  completedByName: string;
  duration: number; // minutos
  notes: string;
  photos: string[];
  checklistResults: { [key: string]: boolean };
}

export type MaintenanceTaskAction =
  | "created"
  | "updated"
  | "completed"
  | "status_changed"
  | "assigned"
  | "deleted"
  | "checklist_updated";

export interface MaintenanceTaskHistory {
  id: string;
  action: MaintenanceTaskAction;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  description: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  frequency: MaintenanceFrequency;
  priority: MaintenancePriority;
  status: MaintenanceTaskStatus;
  location: string;
  assignedTo: string; // employeeId
  assignedToName: string;
  category: string;
  estimatedDuration: number; // minutos
  nextDueDate: Timestamp;
  lastCompletedDate: Timestamp | null;
  completionHistory: MaintenanceCompletion[];
  notificationDaysBefore: number;
  isActive: boolean;
  instructions: string;
  checklistItems: string[];
  checklistProgress?: { [key: string]: boolean };
  attachments: string[];
  history: MaintenanceTaskHistory[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
}

/** Payload para crear una tarea — los campos de auditoría se generan automáticamente */
export type CreateScheduledTaskPayload = Omit<
  ScheduledTask,
  "id" | "createdAt" | "updatedAt" | "history" | "completionHistory" | "checklistProgress" | "lastCompletedDate" | "createdBy" | "createdByName" | "updatedBy" | "updatedByName"
>;

// ─── Store ────────────────────────────────────────────────────────────────────

interface ScheduledMaintenanceState {
  tasks: ScheduledTask[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchTasks: (condominiumId?: string) => Promise<void>;
  addTask: (payload: CreateScheduledTaskPayload) => Promise<void>;
}

export const useScheduledMaintenanceStore =
  create<ScheduledMaintenanceState>()((set) => ({
    tasks: [],
    loading: false,
    saving: false,
    error: null,

    // ── Fetch ──────────────────────────────────────────────────────────────────
    fetchTasks: async (condominiumId?: string) => {
      try {
        set({ loading: true, error: null });
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) { set({ error: "Usuario no autenticado", loading: false }); return; }

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) { set({ error: "No se pudo obtener el clientId", loading: false }); return; }

        const targetCondominiumId = condominiumId || localStorage.getItem("condominiumId");
        if (!targetCondominiumId) { set({ error: "No hay condominio seleccionado", loading: false }); return; }

        const db = getFirestore();
        const tasksRef = collection(db, "clients", clientId, "condominiums", targetCondominiumId, "scheduledMaintenance");
        const q = query(tasksRef, orderBy("nextDueDate", "asc"));
        const snapshot = await getDocs(q);

        const tasks: ScheduledTask[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ScheduledTask)
        );
        set({ tasks, loading: false });
      } catch (error) {
        console.error("Error al obtener tareas programadas:", error);
        Sentry.captureException(error);
        set({ error: "No se pudieron cargar las tareas. Por favor, inténtelo de nuevo.", loading: false });
      }
    },

    // ── Add Task ───────────────────────────────────────────────────────────────
    addTask: async (payload: CreateScheduledTaskPayload) => {
      try {
        set({ saving: true, error: null });
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("No se pudo obtener el clientId");

        const targetCondominiumId = localStorage.getItem("condominiumId");
        if (!targetCondominiumId) throw new Error("No hay condominio seleccionado");

        // Obtener nombre del usuario desde el token o displayName
        const creatorName =
          (tokenResult.claims["name"] as string) ||
          user.displayName ||
          user.email ||
          "Administrador";

        const now = Timestamp.now();
        const historyEntry: MaintenanceTaskHistory = {
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: "created",
          timestamp: now,
          userId: user.uid,
          userName: creatorName,
          description: `Tarea creada desde el dashboard: ${payload.title}`,
        };

        const taskData = {
          ...payload,
          createdBy: user.uid,
          createdByName: creatorName,
          updatedBy: user.uid,
          updatedByName: creatorName,
          lastCompletedDate: null,
          completionHistory: [],
          checklistProgress: {},
          history: [historyEntry],
          createdAt: now,
          updatedAt: now,
        };

        const db = getFirestore();
        const tasksRef = collection(db, "clients", clientId, "condominiums", targetCondominiumId, "scheduledMaintenance");
        const docRef = await addDoc(tasksRef, taskData);

        const newTask: ScheduledTask = { id: docRef.id, ...taskData } as ScheduledTask;

        set((state) => ({
          tasks: [...state.tasks, newTask].sort(
            (a, b) => (a.nextDueDate?.seconds || 0) - (b.nextDueDate?.seconds || 0)
          ),
          saving: false,
        }));
      } catch (error: any) {
        console.error("Error al crear tarea programada:", error);
        Sentry.captureException(error);
        set({ error: error.message || "Error al crear la tarea.", saving: false });
        throw error;
      }
    },
  }));
