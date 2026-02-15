import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";

export type ReconciliationHistoryType = "income" | "expenses";

export type ReconciliationHistoryItem = {
  id: string;
  type: ReconciliationHistoryType;
  name: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  dateRangeFrom: string;
  dateRangeTo: string;
  createdByUid: string;
  createdByName: string;
  summary: Record<string, any>;
  traceability: Record<string, any>;
  bankMovementsCount: number;
  internalMovementsCount: number;
  raw: Record<string, any>;
};

type ReconciliationHistoryFilters = {
  type: "all" | ReconciliationHistoryType;
  status: "all" | "completed" | "draft";
  updatedOrder: "desc" | "asc";
  search: string;
  dateFrom: string;
  dateTo: string;
};

type UseReconciliationHistoryState = {
  loading: boolean;
  error: string | null;
  sessions: ReconciliationHistoryItem[];
  filteredSessions: ReconciliationHistoryItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  selectedSession: ReconciliationHistoryItem | null;
  filters: ReconciliationHistoryFilters;
  fetchSessions: () => Promise<void>;
  setFilters: (patch: Partial<ReconciliationHistoryFilters>) => void;
  setPage: (page: number) => void;
  openSessionDetail: (id: string, type: ReconciliationHistoryType) => void;
  closeSessionDetail: () => void;
  hydrateSessionMovements: (
    id: string,
    type: ReconciliationHistoryType
  ) => Promise<ReconciliationHistoryItem | null>;
};

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function loadSubcollection(
  parentPath: string,
  subcollectionName: string
): Promise<Record<string, any>[]> {
  const db = getFirestore();
  const snap = await getDocs(collection(db, `${parentPath}/${subcollectionName}`));
  return snap.docs.map((doc) => doc.data());
}

function applyFilters(
  sessions: ReconciliationHistoryItem[],
  filters: ReconciliationHistoryFilters
) {
  const filtered = sessions.filter((session) => {
    if (filters.type !== "all" && session.type !== filters.type) return false;
    if (filters.status !== "all" && session.status !== filters.status) return false;

    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      const haystack = `${session.name} ${session.id} ${session.createdByUid}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (filters.dateFrom) {
      const from = new Date(`${filters.dateFrom}T00:00:00`);
      if (session.createdAt && session.createdAt < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(`${filters.dateTo}T23:59:59`);
      if (session.createdAt && session.createdAt > to) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    const aTime = (a.updatedAt || a.createdAt)?.getTime() || 0;
    const bTime = (b.updatedAt || b.createdAt)?.getTime() || 0;
    return filters.updatedOrder === "asc" ? aTime - bTime : bTime - aTime;
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

export const useReconciliationHistoryStore =
  create<UseReconciliationHistoryState>()((set, get) => ({
    loading: false,
    error: null,
    sessions: [],
    filteredSessions: [],
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
    selectedSession: null,
    filters: {
      type: "all",
      status: "all",
      updatedOrder: "desc",
      search: "",
      dateFrom: "",
      dateTo: "",
    },

    fetchSessions: async () => {
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
        const [incomeSnap, expenseSnap] = await Promise.all([
          getDocs(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/paymentReconciliations`
            )
          ),
          getDocs(
            collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/expenseReconciliations`
            )
          ),
        ]);

        const usersSnap = await getDocs(
          collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`)
        );
        const userNamesByUid = usersSnap.docs.reduce<Record<string, string>>(
          (acc, userDoc) => {
            const userData = userDoc.data();
            const uid = String(userData.uid || userDoc.id || "");
            const fullName = [userData.name, userData.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();
            acc[uid] = fullName || userData.email || uid;
            return acc;
          },
          {}
        );

        const incomeSessions: ReconciliationHistoryItem[] = incomeSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "income",
            name: String(data.name || "Sin nombre"),
            status: String(data.status || "completed"),
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
            dateRangeFrom: String(data?.dateRange?.from || ""),
            dateRangeTo: String(data?.dateRange?.to || ""),
            createdByUid: String(data?.createdBy?.uid || data.createdBy || ""),
            createdByName:
              userNamesByUid[
                String(data?.createdBy?.uid || data.createdBy || "")
              ] || "No disponible",
            summary: data.summary || {},
            traceability: data.traceability || {},
            bankMovementsCount:
              Number(data?.traceability?.bankMovementsCount) ||
              (Array.isArray(data.bankMovements) ? data.bankMovements.length : 0),
            internalMovementsCount:
              Number(data?.traceability?.internalMovementsCount) ||
              (Array.isArray(data.internalPayments) ? data.internalPayments.length : 0),
            raw: data,
          };
        });

        const expenseSessions: ReconciliationHistoryItem[] = expenseSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "expenses",
            name: String(data.name || "Sin nombre"),
            status: String(data.status || "completed"),
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
            dateRangeFrom: String(data?.dateRange?.from || ""),
            dateRangeTo: String(data?.dateRange?.to || ""),
            createdByUid: String(data?.createdBy?.uid || data.createdBy || ""),
            createdByName:
              userNamesByUid[
                String(data?.createdBy?.uid || data.createdBy || "")
              ] || "No disponible",
            summary: data.summary || {},
            traceability: data.traceability || {},
            bankMovementsCount:
              Number(data?.traceability?.bankMovementsCount) ||
              (Array.isArray(data.bankMovements) ? data.bankMovements.length : 0),
            internalMovementsCount:
              Number(data?.traceability?.internalMovementsCount) ||
              (Array.isArray(data.internalExpenses) ? data.internalExpenses.length : 0),
            raw: data,
          };
        });

        const allSessions = [...incomeSessions, ...expenseSessions].sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return bTime - aTime;
        });

        const { filters, page, pageSize } = get();
        const filtered = applyFilters(allSessions, filters);
        const pagination = paginate(filtered, page, pageSize);

        set({
          loading: false,
          sessions: allSessions,
          filteredSessions: pagination.data,
          totalItems: pagination.totalItems,
          totalPages: pagination.totalPages,
          page: pagination.page,
        });
      } catch (error: any) {
        console.error("Error fetching reconciliation sessions:", error);
        set({
          loading: false,
          error: error?.message || "No fue posible cargar historial de conciliaciones",
        });
      }
    },

    setFilters: (patch) => {
      const current = get();
      const nextFilters = { ...current.filters, ...patch };
      const filtered = applyFilters(current.sessions, nextFilters);
      const pagination = paginate(filtered, 1, current.pageSize);
      set({
        filters: nextFilters,
        page: pagination.page,
        filteredSessions: pagination.data,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
      });
    },

    setPage: (page) => {
      const current = get();
      const filtered = applyFilters(current.sessions, current.filters);
      const pagination = paginate(filtered, page, current.pageSize);
      set({
        page: pagination.page,
        filteredSessions: pagination.data,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
      });
    },

    openSessionDetail: (id, type) => {
      const found =
        get().sessions.find((item) => item.id === id && item.type === type) ||
        null;
      set({ selectedSession: found });
    },

    closeSessionDetail: () => set({ selectedSession: null }),

    hydrateSessionMovements: async (id, type) => {
      const current =
        get().sessions.find((item) => item.id === id && item.type === type) || null;
      if (!current) return null;

      const isIncome = type === "income";
      const raw = current.raw || {};
      const hasInlineData = isIncome
        ? Array.isArray(raw?.bankMovements) && Array.isArray(raw?.internalPayments)
        : Array.isArray(raw?.bankMovements) && Array.isArray(raw?.internalExpenses);
      if (hasInlineData) return current;

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

        const parentPath = `clients/${clientId}/condominiums/${condominiumId}/${
          isIncome ? "paymentReconciliations" : "expenseReconciliations"
        }/${id}`;
        const [bankMovements, internalMovements] = await Promise.all([
          loadSubcollection(parentPath, "bankMovements"),
          loadSubcollection(parentPath, "internalMovements"),
        ]);

        const hydrated: ReconciliationHistoryItem = {
          ...current,
          raw: {
            ...raw,
            bankMovements,
            ...(isIncome
              ? { internalPayments: internalMovements }
              : { internalExpenses: internalMovements }),
          },
        };

        const mapHydrated = (item: ReconciliationHistoryItem) =>
          item.id === id && item.type === type ? hydrated : item;
        set((state) => ({
          sessions: state.sessions.map(mapHydrated),
          filteredSessions: state.filteredSessions.map(mapHydrated),
          selectedSession:
            state.selectedSession?.id === id && state.selectedSession?.type === type
              ? hydrated
              : state.selectedSession,
        }));
        return hydrated;
      } catch (error: any) {
        console.error("Error hydrating reconciliation movements:", error);
        set({
          error:
            error?.message || "No fue posible cargar movimientos de la conciliación",
        });
        return current;
      }
    },
  }));
