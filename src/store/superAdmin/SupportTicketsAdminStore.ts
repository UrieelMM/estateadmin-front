import { create } from "../createStore";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getSuperAdminSessionToken } from "../../services/superAdminService";

export type SupportTicketAdmin = {
  id: string;
  ticketNumber: string;
  email: string;
  title: string;
  description: string;
  issueType: "bug" | "incident" | "question" | "request";
  priority: "low" | "medium" | "high";
  module: string;
  currentPath: string;
  userAgent: string;
  attachmentUrls: string[];
  status: "pending" | "in_progress" | "resolved";
  createdBy: string;
  condominiumId: string;
  clientId: string;
  createdAt?: any;
  updatedAt?: any;
};

interface SupportTicketsAdminStore {
  tickets: SupportTicketAdmin[];
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
}

const useSupportTicketsAdminStore = create<SupportTicketsAdminStore>()((set) => ({
  tickets: [],
  loading: false,
  error: null,

  fetchTickets: async () => {
    if (!getSuperAdminSessionToken()) {
      set({ error: "No tienes una sesión válida de Super Admin." });
      return;
    }

    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const ticketsRef = collection(db, "supportTickets");
      const q = query(ticketsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const tickets = snapshot.docs.map((doc) => {
        const data = doc.data() as SupportTicketAdmin;
        return {
          ...data,
          id: doc.id,
          attachmentUrls: Array.isArray(data.attachmentUrls)
            ? data.attachmentUrls
            : [],
        };
      });

      set({ tickets, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar tickets de soporte:", error);
      set({
        loading: false,
        error: error?.message || "No se pudieron cargar los tickets.",
      });
    }
  },
}));

export default useSupportTicketsAdminStore;
