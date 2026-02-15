import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore";

type AuditLogItem = {
  id: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: Date | null;
  userName: string;
  userEmail: string;
  userRole: string;
  metadata: Record<string, any>;
};

type AuditFilters = {
  module: string;
  action: string;
  search: string;
  dateFrom: string;
  dateTo: string;
};

type AuditTrailState = {
  loading: boolean;
  error: string | null;
  logs: AuditLogItem[];
  filteredLogs: AuditLogItem[];
  filters: AuditFilters;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  fetchLogs: () => Promise<void>;
  setFilters: (patch: Partial<AuditFilters>) => void;
  setPage: (page: number) => void;
  exportCsv: () => string;
};

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function applyFilters(items: AuditLogItem[], filters: AuditFilters) {
  return items.filter((item) => {
    if (filters.module && item.module !== filters.module) return false;
    if (filters.action && item.action !== filters.action) return false;
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      const source = `${item.summary} ${item.entityType} ${item.entityId} ${item.userName} ${item.userEmail}`.toLowerCase();
      if (!source.includes(term)) return false;
    }
    if (filters.dateFrom) {
      const from = new Date(`${filters.dateFrom}T00:00:00`);
      if (item.createdAt && item.createdAt < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(`${filters.dateTo}T23:59:59`);
      if (item.createdAt && item.createdAt > to) return false;
    }
    return true;
  });
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalItems,
    totalPages,
    data: items.slice(start, start + pageSize),
  };
}

export const useAuditTrailStore = create<AuditTrailState>()((set, get) => ({
  loading: false,
  error: null,
  logs: [],
  filteredLogs: [],
  filters: {
    module: "",
    action: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  },
  page: 1,
  pageSize: 20,
  totalPages: 1,
  totalItems: 0,

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(currentUser);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!clientId || !condominiumId) {
        throw new Error("Contexto de cliente/condominio no disponible");
      }

      const db = getFirestore();
      const logsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/auditLogs`
      );
      const snapshot = await getDocs(query(logsRef, orderBy("createdAt", "desc")));
      const logs: AuditLogItem[] = snapshot.docs.map((row) => {
        const data = row.data();
        return {
          id: row.id,
          module: String(data.module || ""),
          entityType: String(data.entityType || ""),
          entityId: String(data.entityId || ""),
          action: String(data.action || ""),
          summary: String(data.summary || ""),
          createdAt: toDateOrNull(data.createdAt),
          userName: String(data?.performedBy?.displayName || ""),
          userEmail: String(data?.performedBy?.email || ""),
          userRole: String(data?.performedBy?.role || ""),
          metadata: (data.metadata || {}) as Record<string, any>,
        };
      });

      const filtered = applyFilters(logs, get().filters);
      const pagination = paginate(filtered, get().page, get().pageSize);
      set({
        loading: false,
        logs,
        filteredLogs: pagination.data,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        page: pagination.page,
      });
    } catch (error: any) {
      console.error("Error al cargar auditoría:", error);
      set({
        loading: false,
        error: error?.message || "No fue posible cargar auditoría",
      });
    }
  },

  setFilters: (patch) => {
    const state = get();
    const filters = { ...state.filters, ...patch };
    const filtered = applyFilters(state.logs, filters);
    const pagination = paginate(filtered, 1, state.pageSize);
    set({
      filters,
      page: pagination.page,
      filteredLogs: pagination.data,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    });
  },

  setPage: (page) => {
    const state = get();
    const filtered = applyFilters(state.logs, state.filters);
    const pagination = paginate(filtered, page, state.pageSize);
    set({
      page: pagination.page,
      filteredLogs: pagination.data,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    });
  },

  exportCsv: () => {
    const rows = get().filteredLogs;
    const header = [
      "fecha",
      "modulo",
      "accion",
      "entidad",
      "entidadId",
      "resumen",
      "usuario",
      "email",
      "rol",
    ];
    const csvRows = rows.map((item) => [
      item.createdAt ? item.createdAt.toISOString() : "",
      item.module,
      item.action,
      item.entityType,
      item.entityId,
      item.summary,
      item.userName,
      item.userEmail,
      item.userRole,
    ]);
    return [header, ...csvRows]
      .map((line) =>
        line.map((col) => `"${String(col || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  },
}));

