// useScheduledVisitsStore.ts
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  limit,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import toast from "react-hot-toast";

// =========== Tipos ===========

export type VisitStatus = "active" | "used" | "expired" | "cancelled";
export type VisitType = "single" | "recurring";

export interface ScheduledVisitResident {
  userId: string;
  email: string;
  departmentNumber: string;
  tower: string | null;
  phoneNumber: string;
  name?: string | null;
  lastName?: string | null;
}

export interface ScheduledVisitRecurrence {
  daysOfWeek: number[]; // 0=domingo … 6=sábado
  dailyArrivalTime: string; // "HH:MM" 24h
  dailyDepartureTime: string;
  startDate: Timestamp;
  endDate: Timestamp;
  timezone?: string;
}

export interface ScheduledVisit {
  id: string;
  visitType: VisitType;
  visitorName: string;
  visitorVehicle: { plates?: string; description?: string } | null;

  // Para recurrentes apuntan a la PRÓXIMA ocurrencia futura
  arrivalAt: Timestamp;
  departureAt: Timestamp;
  expiresAt: Timestamp;
  arrivalAtLabel: string;
  departureAtLabel: string;

  recurrence: ScheduledVisitRecurrence | null;

  resident: ScheduledVisitResident;

  clientId: string;
  condominiumId: string;
  condominiumName: string | null;

  qrId: string;
  // accessToken se omite intencionalmente: es secreto y no debe leerse en UI.
  qrImageUrl: string;

  status: VisitStatus;
  usedAt: Timestamp | null;
  exitAt: Timestamp | null;
  lastUsedAt?: Timestamp | null;
  lastExitAt?: Timestamp | null;

  createdVia: "whatsapp_chatbot" | string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  cancelledAt?: Timestamp | null;
  cancelledBy?: string | null;
}

export interface ScheduledVisitEntry {
  id: string;
  type: "check-in" | "check-out";
  createdAt: Timestamp;
}

export type StatusFilter = "all" | VisitStatus;
export type TypeFilter = "all" | VisitType;

interface Filters {
  status: StatusFilter;
  type: TypeFilter;
  search: string;
  dateFrom: string | null; // YYYY-MM-DD
  dateTo: string | null;
}

interface ScheduledVisitsState {
  visits: ScheduledVisit[];
  isLoading: boolean;
  error: string | null;
  filters: Filters;

  fetchVisits: () => Promise<void>;
  getVisitById: (qrId: string) => Promise<ScheduledVisit | null>;
  cancelVisit: (qrId: string) => Promise<void>;
  setFilters: (partial: Partial<Filters>) => void;

  // Suscripción a la subcolección entries de una visita recurrente
  subscribeToEntries: (
    qrId: string,
    onUpdate: (entries: ScheduledVisitEntry[]) => void,
  ) => Promise<Unsubscribe | null>;
}

// =========== Helpers internos ===========

const buildVisit = (id: string, data: any): ScheduledVisit => ({
  id,
  visitType: data.visitType || "single",
  visitorName: data.visitorName || "",
  visitorVehicle: data.visitorVehicle || null,
  arrivalAt: data.arrivalAt,
  departureAt: data.departureAt,
  expiresAt: data.expiresAt,
  arrivalAtLabel: data.arrivalAtLabel || "",
  departureAtLabel: data.departureAtLabel || "",
  recurrence: data.recurrence || null,
  resident: data.resident || {
    userId: "",
    email: "",
    departmentNumber: "",
    tower: null,
    phoneNumber: "",
  },
  clientId: data.clientId || "",
  condominiumId: data.condominiumId || "",
  condominiumName: data.condominiumName || null,
  qrId: data.qrId || id,
  qrImageUrl: data.qrImageUrl || "",
  status: data.status || "active",
  usedAt: data.usedAt || null,
  exitAt: data.exitAt || null,
  lastUsedAt: data.lastUsedAt || null,
  lastExitAt: data.lastExitAt || null,
  createdVia: data.createdVia || "whatsapp_chatbot",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  cancelledAt: data.cancelledAt || null,
  cancelledBy: data.cancelledBy || null,
});

const getClientAndCondominium = async (): Promise<{
  clientId: string;
  condominiumId: string;
} | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;

  const tokenResult = await getIdTokenResult(user);
  const clientId = tokenResult.claims["clientId"] as string | undefined;
  const condominiumId = localStorage.getItem("condominiumId");

  if (!clientId || !condominiumId) return null;
  return { clientId, condominiumId };
};

// =========== Store ===========

export const useScheduledVisitsStore = create<ScheduledVisitsState>()(
  (set) => ({
    visits: [],
    isLoading: false,
    error: null,
    filters: {
      status: "all",
      type: "all",
      search: "",
      dateFrom: null,
      dateTo: null,
    },

    fetchVisits: async () => {
      set({ isLoading: true, error: null });
      try {
        const ctx = await getClientAndCondominium();
        if (!ctx) {
          set({
            error: "Sesión o condominio no disponibles",
            isLoading: false,
          });
          return;
        }
        const { clientId, condominiumId } = ctx;

        const ref = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/scheduledVisits`,
        );

        // Por defecto: orden DESC por arrivalAt para ver lo más reciente primero
        const q = query(ref, orderBy("arrivalAt", "desc"), limit(200));

        const snap = await getDocs(q);
        const visits = snap.docs.map((d) => buildVisit(d.id, d.data()));

        set({ visits, isLoading: false });
      } catch (err: any) {
        console.error("Error al obtener visitas agendadas:", err);
        set({
          error: err?.message || "Error al obtener visitas",
          isLoading: false,
        });
        toast.error("Error al obtener visitas agendadas");
      }
    },

    getVisitById: async (qrId) => {
      try {
        const ctx = await getClientAndCondominium();
        if (!ctx) return null;
        const { clientId, condominiumId } = ctx;

        const ref = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/scheduledVisits/${qrId}`,
        );
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return buildVisit(snap.id, snap.data());
      } catch (err) {
        console.error("Error al obtener visita:", err);
        return null;
      }
    },

    cancelVisit: async (qrId) => {
      try {
        const ctx = await getClientAndCondominium();
        if (!ctx) {
          toast.error("Sesión no disponible");
          return;
        }
        const { clientId, condominiumId } = ctx;
        const auth = getAuth();

        const ref = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/scheduledVisits/${qrId}`,
        );

        await updateDoc(ref, {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          cancelledBy: auth.currentUser?.uid || null,
          updatedAt: serverTimestamp(),
        });

        // Actualizar estado local
        set((state) => ({
          visits: state.visits.map((v) =>
            v.id === qrId
              ? {
                  ...v,
                  status: "cancelled" as VisitStatus,
                }
              : v,
          ),
        }));

        toast.success("Visita cancelada");
      } catch (err: any) {
        console.error("Error al cancelar visita:", err);
        toast.error(err?.message || "Error al cancelar la visita");
      }
    },

    setFilters: (partial) =>
      set((state) => ({ filters: { ...state.filters, ...partial } })),

    subscribeToEntries: async (qrId, onUpdate) => {
      const ctx = await getClientAndCondominium();
      if (!ctx) return null;
      const { clientId, condominiumId } = ctx;

      const ref = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/scheduledVisits/${qrId}/entries`,
      );
      const q = query(ref, orderBy("createdAt", "desc"), limit(100));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const entries: ScheduledVisitEntry[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: (data.type as "check-in" | "check-out") || "check-in",
              createdAt: data.createdAt,
            };
          });
          onUpdate(entries);
        },
        (err) => {
          console.error("Error en suscripción a entries:", err);
        },
      );

      return unsub;
    },
  }),
);

// =========== Helpers UI ===========

const DAY_NAMES_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatDaysOfWeek(days: number[]): string {
  if (!days || days.length === 0) return "—";
  const set = [...days].sort().join(",");
  if (set === "0,1,2,3,4,5,6") return "Todos los días";
  if (set === "1,2,3,4,5") return "Lun – Vie";
  if (set === "1,2,3,4,5,6") return "Lun – Sáb";
  if (set === "0,6") return "Fines de semana";
  return [...days]
    .sort()
    .map((d) => DAY_NAMES_ES[d])
    .join(" · ");
}

export function nextOccurrenceLabel(visit: ScheduledVisit): string {
  if (visit.visitType === "single") {
    return `${visit.arrivalAtLabel} → ${visit.departureAtLabel}`;
  }
  const r = visit.recurrence;
  if (!r) return visit.arrivalAtLabel || "";
  return `${formatDaysOfWeek(r.daysOfWeek)} · ${r.dailyArrivalTime}–${r.dailyDepartureTime}`;
}

export function statusBadgeClasses(status: VisitStatus): string {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30";
    case "used":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30";
    case "expired":
      return "bg-gray-100 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/30";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-600/20";
  }
}

export function statusLabel(status: VisitStatus): string {
  switch (status) {
    case "active":
      return "Activa";
    case "used":
      return "Usada";
    case "expired":
      return "Expirada";
    case "cancelled":
      return "Cancelada";
  }
}

export function visitTypeLabel(type: VisitType): string {
  return type === "single" ? "Única" : "Recurrente";
}

// Convierte cualquier fecha estilo Firestore (Timestamp | Date | string) a Date
export function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
