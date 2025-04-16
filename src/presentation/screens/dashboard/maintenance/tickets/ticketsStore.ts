import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { create } from "../../../../../store/createStore";

export type TicketHistoryItem = {
  date: Date | string;
  action: string;
  status?: "abierto" | "en_progreso" | "cerrado";
  user?: string;
  comment?: string;
};

export type Ticket = {
  id?: string;
  title: string;
  description: string;
  status: "abierto" | "en_progreso" | "cerrado";
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  priority?: "baja" | "media" | "alta";
  attachments?: string[];
  tags?: string[];
  providerId?: string;
  history?: TicketHistoryItem[];
  mergedFrom?: string[];
};

export type TicketFilters = {
  status?: Ticket["status"];
  priority?: Ticket["priority"];
  assignedTo?: string;
};

export type TicketState = {
  tickets: Ticket[];
  activeTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  fetchTickets: (
    filters?: TicketFilters,
    pageSize?: number,
    nextPage?: boolean
  ) => Promise<void>;
  createTicket: (
    ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "attachments">,
    files?: File[]
  ) => Promise<void>;
  updateTicket: (
    ticketId: string,
    data: Partial<Omit<Ticket, "id">>,
    files?: File[]
  ) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  setActiveTicket: (ticket: Ticket | null) => void;
  invalidateCache: () => void;
  mergeTickets: (mainTicketId: string, mergedIds: string[]) => Promise<void>;
};

export const useTicketsStore = create<TicketState>()((set, get) => ({
  // ...otras funciones...
  mergeTickets: async (mainTicketId, mergedIds) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");
      const db = getFirestore();

      // Obtener los tickets a fusionar
      const allTickets = get().tickets;
      const main = allTickets.find(t => t.id === mainTicketId);
      const merged = allTickets.filter(t => mergedIds.includes(t.id!));
      if (!main || merged.length === 0) throw new Error("No se encontraron los tickets a fusionar");
      // Fusionar histories, adjuntos, tags, mergedFrom
      const mergedHistories = [ ...(main.history ?? []), ...merged.flatMap(t => t.history ?? []) ];
      const mergedAttachments = [ ...(main.attachments ?? []), ...merged.flatMap(t => t.attachments ?? []) ];
      const mergedTags = Array.from(new Set([...(main.tags ?? []), ...merged.flatMap(t => t.tags ?? [])]));
      const mergedFrom = [ ...(main.mergedFrom ?? []), ...merged.map(t => t.id!).filter(id => id !== mainTicketId) ];
      // Actualizar el ticket principal
      const ticketDocRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance",
        mainTicketId
      );
      await updateDoc(ticketDocRef, {
        history: mergedHistories,
        attachments: mergedAttachments,
        tags: mergedTags,
        mergedFrom,
        updatedAt: new Date(),
      });
      // Eliminar los tickets fusionados (menos el principal)
      for (const t of merged) {
        if (t.id !== mainTicketId) {
          const mergedDocRef = doc(
            db,
            "clients",
            clientId,
            "condominiums",
            condominiumId,
            "ticketsMaintenance",
            t.id!
          );
          await deleteDoc(mergedDocRef);
        }
      }
      set({ loading: false });
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  tickets: [],
  activeTicket: null,
  loading: false,
  error: null,
  hasMore: true,
  lastDoc: null,

  fetchTickets: async (filters, pageSize = 10, nextPage = false) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");

      const db = getFirestore();
      const ticketsRef = collection(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance"
      );

      const constraints: any[] = [orderBy("createdAt", "desc")];
      if (filters) {
        if (filters.status)
          constraints.push(where("status", "==", filters.status));
        if (filters.priority)
          constraints.push(where("priority", "==", filters.priority));
        if (filters.assignedTo)
          constraints.push(where("assignedTo", "==", filters.assignedTo));
      }
      constraints.push(limit(pageSize));
      if (nextPage && get().lastDoc) {
        constraints.push(startAfter(get().lastDoc));
      }

      const q = query(ticketsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const tickets: Ticket[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tickets.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(data.updatedAt),
          createdBy: data.createdBy,
          assignedTo: data.assignedTo,
          priority: data.priority,
          attachments: data.attachments || [],
        });
      });
      set({
        tickets: nextPage ? [...get().tickets, ...tickets] : tickets,
        loading: false,
        hasMore: tickets.length === pageSize,
        lastDoc:
          querySnapshot.docs.length > 0
            ? querySnapshot.docs[querySnapshot.docs.length - 1]
            : null,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTicket: async (ticket, files) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");
      const db = getFirestore();
      const storage = getStorage();

      let attachments: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/ticketsMaintenance/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          attachments.push(url);
        }
      }

      const now = new Date();
      const ticketData = {
        ...ticket,
        status: ticket.status || "abierto",
        createdAt: now,
        updatedAt: now,
        attachments,
        tags: ticket.tags || [],
        providerId: ticket.providerId || "",
        history: ticket.history || [],
        mergedFrom: ticket.mergedFrom || [],
      };

      const ticketsRef = collection(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance"
      );
      await addDoc(ticketsRef, ticketData);
      set({ loading: false });
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTicket: async (ticketId, data, files) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");
      const db = getFirestore();
      const storage = getStorage();

      let attachments = data.attachments || [];
      if (files && files.length > 0) {
        for (const file of files) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/ticketsMaintenance/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          attachments.push(url);
        }
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
        attachments,
      };

      const ticketDocRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance",
        ticketId
      );
      await updateDoc(ticketDocRef, updateData);
      set({ loading: false });
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTicket: async (ticketId) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible en el token");
      const db = getFirestore();
      const ticketDocRef = doc(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance",
        ticketId
      );
      await deleteDoc(ticketDocRef);
      set({ loading: false });
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setActiveTicket: (ticket) => {
    set({ activeTicket: ticket });
  },

  invalidateCache: () => {
    set({ tickets: [], lastDoc: null, hasMore: true });
  },
}));
