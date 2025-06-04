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
import toast from "react-hot-toast";

// Función helper para formatear los estados de los tickets con formato amigable
const formatStatus = (status: string): string => {
  switch (status) {
    case "abierto":
      return "Abierto";
    case "en_progreso":
      return "En progreso";
    case "cerrado":
      return "Cerrado";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Función helper para formatear las prioridades de los tickets
const formatPriority = (priority: string): string => {
  switch (priority) {
    case "baja":
      return "Baja";
    case "media":
      return "Media";
    case "alta":
      return "Alta";
    default:
      return priority.charAt(0).toUpperCase() + priority.slice(1);
  }
};

export type TicketHistoryAction =
  | "created" // Creación
  | "status_changed" // Cambio de estado
  | "priority_changed" // Cambio de prioridad
  | "tags_changed" // Cambio de etiquetas
  | "area_changed" // Cambio de área
  | "files_added" // Archivos añadidos
  | "files_removed" // Archivos eliminados
  | "comment_added" // Comentario añadido
  | "merge" // Fusión de tickets
  | "assigned" // Asignación a usuario
  | "edited"; // Edición general

export type TicketHistoryItem = {
  date: Date | string;
  action: TicketHistoryAction;
  status?: "abierto" | "en_progreso" | "cerrado";
  priority?: "baja" | "media" | "alta";
  user?: string;
  comment?: string;
  previousValue?: string;
  newValue?: string;
  mergedTicketInfo?: {
    id: string;
    title: string;
  };
  files?: string[];
  area?: string;
  tags?: string[];
};

export type Ticket = {
  id?: string;
  folio?: string;
  title: string;
  description: string;
  status: "abierto" | "en_progreso" | "cerrado";
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date; // Fecha en que se cerró el ticket
  createdBy: string;
  createdByEmail?: string;
  assignedTo?: string;
  priority?: "baja" | "media" | "alta";
  attachments?: string[];
  tags?: string[];
  providerId?: string;
  commonAreaId?: string;
  commonAreaName?: string;
  history?: TicketHistoryItem[];
  mergedFrom?: string[];
  area?: string;
  comment?: string; // Campo temporal para añadir comentarios al historial
  hasAppointment?: boolean; // Indica si el ticket ya tiene una visita programada
};

export type TicketFilters = {
  status?: Ticket["status"];
  priority?: Ticket["priority"];
  assignedTo?: string;
  folio?: string;
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
  searchTicketByFolio: (folio: string) => Promise<void>;
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
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }
      const db = getFirestore();
      const userName = user.displayName || user.email || "Usuario";
      const now = new Date();

      // Obtener los tickets a fusionar
      const allTickets = get().tickets;
      const main = allTickets.find((t) => t.id === mainTicketId);
      const merged = allTickets.filter((t) => mergedIds.includes(t.id!));
      if (!main || merged.length === 0)
        throw new Error("No se encontraron los tickets a fusionar");

      // Fusionar historiales, adjuntos, tags, mergedFrom
      const mergedHistories = [...(main.history ?? [])]; // Comenzamos con el historial del ticket principal

      // Agregar entradas de historial para cada ticket fusionado
      for (const ticket of merged) {
        if (ticket.id === mainTicketId) continue; // Evitar duplicar el ticket principal

        // Agregar evento de fusión para este ticket
        mergedHistories.push({
          date: now,
          action: "merge",
          user: userName,
          comment: `Ticket #${
            ticket.id?.substring(0, 6) || ""
          } fusionado a este ticket`,
          mergedTicketInfo: {
            id: ticket.id || "",
            title: ticket.title,
          },
        });

        // Agregar el historial del ticket fusionado con una marca de tiempo ligeramente anterior
        // para mantener el orden cronológico correcto
        const ticketHistory = ticket.history || [];
        mergedHistories.push(...ticketHistory);
      }

      // Ordenar el historial combinado por fecha
      mergedHistories.sort((a, b) => {
        const dateA =
          a.date instanceof Date ? a.date : new Date(a.date as string);
        const dateB =
          b.date instanceof Date ? b.date : new Date(b.date as string);
        return dateA.getTime() - dateB.getTime();
      });

      // Fusionar otros datos
      const mergedAttachments = [
        ...(main.attachments ?? []),
        ...merged.flatMap((t) => t.attachments ?? []),
      ];
      const mergedTags = Array.from(
        new Set([...(main.tags ?? []), ...merged.flatMap((t) => t.tags ?? [])])
      );
      const mergedAreas = Array.from(
        new Set([main.area, ...merged.map((t) => t.area)].filter(Boolean))
      ) as string[];
      const mergedFrom = [
        ...(main.mergedFrom ?? []),
        ...merged.map((t) => t.id!).filter((id) => id !== mainTicketId),
        ...merged.flatMap((t) => t.mergedFrom || []),
      ];

      // Agregar una entrada final del historial sobre la fusión completa
      mergedHistories.push({
        date: new Date(now.getTime() + 1), // Asegurar que aparece al final
        action: "merge",
        user: userName,
        comment: `Fusión completada: ${merged.length} tickets fusionados en uno solo`,
        tags: mergedTags,
      });

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

      // Preparar datos de actualización evitando valores undefined
      const updateData: any = {
        history: mergedHistories,
        attachments: mergedAttachments,
        tags: mergedTags,
        mergedFrom,
        updatedAt: new Date(),
      };

      // Solo incluir área si hay un valor válido para evitar error de undefined
      if (mergedAreas.length > 0) {
        updateData.area = mergedAreas[0];
      } else if (main.area) {
        updateData.area = main.area;
      }
      // No incluimos el campo area si no hay un valor válido

      await updateDoc(ticketDocRef, updateData);
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
      set({ loading: false });
      let errorMsg = error.message || "Error al procesar el ticket";

      // Detectar errores específicos de Firebase Storage
      if (error.code === "storage/unauthorized") {
        errorMsg = "No tienes permisos para subir archivos";
      } else if (error.code === "storage/object-too-large") {
        errorMsg =
          "Uno o más archivos son demasiado grandes. El límite es de 15MB por archivo";
      } else if (error.code === "storage/retry-limit-exceeded") {
        errorMsg = "Error de conexión al intentar subir los archivos";
      }

      toast.error(errorMsg);
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
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }

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
          folio: data.folio || "",
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
          createdByEmail: data.createdByEmail || "",
          assignedTo: data.assignedTo,
          priority: data.priority,
          attachments: data.attachments || [],
          history: data.history || [],
          mergedFrom: data.mergedFrom || [],
          area: data.area,
          tags: data.tags || [],
          providerId: data.providerId,
          closedAt: data.closedAt?.toDate
            ? data.closedAt.toDate()
            : data.closedAt
            ? new Date(data.closedAt)
            : undefined,
          hasAppointment: data.hasAppointment || false,
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
      set({ loading: false });
      toast.error(error.message || "Error al obtener los tickets");
    }
  },

  createTicket: async (ticket, files) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }
      const db = getFirestore();
      const storage = getStorage();
      const userName = user.displayName || user.email || "Usuario";

      // Generar ID única para posible uso en la ruta de storage
      const ticketId = Math.random().toString(36).substring(2, 15);
      const now = new Date();

      // Preparar historial inicial
      const initialHistory: TicketHistoryItem[] = [
        {
          date: now,
          action: "created",
          status: ticket.status || "abierto",
          user: userName,
          comment: `Ticket creado por ${userName}`,
        },
      ];

      // Si hay prioridad inicial
      if (ticket.priority) {
        initialHistory.push({
          date: now,
          action: "priority_changed",
          priority: ticket.priority,
          user: userName,
          newValue: ticket.priority,
          comment: `Prioridad inicial: ${ticket.priority}`,
        });
      }

      // Si hay tags iniciales
      if (ticket.tags && ticket.tags.length > 0) {
        initialHistory.push({
          date: now,
          action: "tags_changed",
          user: userName,
          tags: ticket.tags,
          newValue: ticket.tags.join(", "),
          comment: `Tags iniciales: ${ticket.tags.join(", ")}`,
        });
      }

      // Si hay área inicial
      if (ticket.area) {
        initialHistory.push({
          date: now,
          action: "area_changed",
          user: userName,
          area: ticket.area,
          newValue: ticket.area,
          comment: `Área inicial: ${ticket.area}`,
        });
      }

      // Si hay asignado inicial
      if (ticket.assignedTo) {
        initialHistory.push({
          date: now,
          action: "assigned",
          user: userName,
          newValue: ticket.assignedTo,
          comment: `Asignado inicialmente a: ${ticket.assignedTo}`,
        });
      }

      // Subir archivos si existen
      let attachments: string[] = [];
      if (files && files.length > 0) {
        const fileUrls: string[] = [];
        for (const file of files) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/ticketsMaintenance/${ticketId}/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          fileUrls.push(url);
          attachments.push(url);
        }

        // Registrar los archivos iniciales en el historial
        initialHistory.push({
          date: now,
          action: "files_added",
          user: userName,
          files: fileUrls,
          comment: `Se ${
            fileUrls.length === 1
              ? "ha añadido 1 archivo inicial"
              : "han añadido " + fileUrls.length + " archivos iniciales"
          }`,
        });
      }

      // Añadir cualquier historial proporcionado explícitamente
      const history = [...initialHistory, ...(ticket.history || [])];

      // Preparar datos del ticket
      const ticketData = {
        ...ticket,
        status: ticket.status || "abierto",
        createdAt: now,
        updatedAt: now,
        attachments,
        tags: ticket.tags || [],
        providerId: ticket.providerId || "",
        history,
        mergedFrom: ticket.mergedFrom || [],
        folio: ticket.folio || "",
        createdByEmail: ticket.createdByEmail || user.email || "",
        hasAppointment: ticket.hasAppointment,
      };

      // Eliminar campo temporal de comentario si existe
      if (ticketData.comment) {
        delete ticketData.comment;
      }

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
      set({ loading: false });
      let errorMsg = error.message || "Error al procesar el ticket";

      // Detectar errores específicos de Firebase Storage
      if (error.code === "storage/unauthorized") {
        errorMsg = "No tienes permisos para subir archivos";
      } else if (error.code === "storage/object-too-large") {
        errorMsg =
          "Uno o más archivos son demasiado grandes. El límite es de 15MB por archivo";
      } else if (error.code === "storage/retry-limit-exceeded") {
        errorMsg = "Error de conexión al intentar subir los archivos";
      }

      toast.error(errorMsg);
      throw error;
    }
  },

  updateTicket: async (ticketId, data, files) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }
      const db = getFirestore();
      const storage = getStorage();
      const userName = user.displayName || user.email || "Usuario";

      // Obtener el ticket actual para comparar cambios
      const currentTicket = get().tickets.find((t) => t.id === ticketId);
      if (!currentTicket)
        throw new Error("No se encontró el ticket a actualizar");

      // Historial actual
      const currentHistory = [...(currentTicket.history || [])];
      const historyUpdates: TicketHistoryItem[] = [];
      const now = new Date();

      // Registrar cambio de estado
      if (data.status && data.status !== currentTicket.status) {
        historyUpdates.push({
          date: now,
          action: "status_changed",
          status: data.status,
          user: userName,
          previousValue: currentTicket.status,
          newValue: data.status,
          comment: `Estado cambiado de ${formatStatus(
            currentTicket.status
          )} a ${formatStatus(data.status)}`,
        });

        // Si el ticket se cierra, establecer la fecha de cierre
        if (data.status === "cerrado" && currentTicket.status !== "cerrado") {
          data.closedAt = now;
        }
      }

      // Registrar cambio de prioridad
      if (data.priority && data.priority !== currentTicket.priority) {
        historyUpdates.push({
          date: now,
          action: "priority_changed",
          priority: data.priority,
          user: userName,
          previousValue: currentTicket.priority || "no definida",
          newValue: data.priority,
          comment: `Prioridad cambiada de ${
            currentTicket.priority
              ? formatPriority(currentTicket.priority)
              : "No definida"
          } a ${formatPriority(data.priority)}`,
        });
      }

      // Registrar cambio de área
      if (data.area && data.area !== currentTicket.area) {
        historyUpdates.push({
          date: now,
          action: "area_changed",
          user: userName,
          previousValue: currentTicket.area || "no definida",
          newValue: data.area,
          area: data.area,
          comment: `Área cambiada de ${currentTicket.area || "no definida"} a ${
            data.area
          }`,
        });
      }

      // Registrar cambio de asignación
      if (data.assignedTo && data.assignedTo !== currentTicket.assignedTo) {
        historyUpdates.push({
          date: now,
          action: "assigned",
          user: userName,
          previousValue: currentTicket.assignedTo || "nadie",
          newValue: data.assignedTo,
          comment: `Ticket asignado a ${data.assignedTo}`,
        });
      }

      // Registrar cambio de tags
      if (
        data.tags &&
        JSON.stringify(data.tags) !== JSON.stringify(currentTicket.tags)
      ) {
        const oldTags = currentTicket.tags || [];
        const newTags = data.tags || [];
        // Encontrar tags añadidos y eliminados
        const addedTags = newTags.filter((tag) => !oldTags.includes(tag));
        const removedTags = oldTags.filter((tag) => !newTags.includes(tag));
        let tagsChangeComment = "Tags modificados";

        if (addedTags.length > 0) {
          tagsChangeComment += `. Añadidos: ${addedTags.join(", ")}`;
        }
        if (removedTags.length > 0) {
          tagsChangeComment += `. Eliminados: ${removedTags.join(", ")}`;
        }

        historyUpdates.push({
          date: now,
          action: "tags_changed",
          user: userName,
          tags: newTags,
          previousValue: oldTags.join(", "),
          newValue: newTags.join(", "),
          comment: tagsChangeComment,
        });
      }

      // Gestionar archivos
      let attachments = [...(currentTicket.attachments || [])];
      let fileHistoryItem: TicketHistoryItem | null = null;

      // Si hay nuevos archivos para subir
      if (files && files.length > 0) {
        const newFileUrls: string[] = [];
        for (const file of files) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/ticketsMaintenance/${ticketId}/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          newFileUrls.push(url);
          attachments.push(url);
        }

        fileHistoryItem = {
          date: now,
          action: "files_added",
          user: userName,
          files: newFileUrls,
          comment: `Se ${
            newFileUrls.length === 1
              ? "ha añadido 1 archivo"
              : "han añadido " + newFileUrls.length + " archivos"
          }`,
        };
      }

      // Si hay eliminación de archivos
      if (data.attachments && data.attachments.length < attachments.length) {
        const dataAttachments = data.attachments; // Guardar en variable para el tipado
        const removedFiles = attachments.filter(
          (url) => !dataAttachments.includes(url)
        );
        if (removedFiles.length > 0) {
          fileHistoryItem = {
            date: now,
            action: "files_removed",
            user: userName,
            files: removedFiles,
            comment: `Se ${
              removedFiles.length === 1
                ? "ha eliminado 1 archivo"
                : "han eliminado " + removedFiles.length + " archivos"
            }`,
          };
          // Actualizar la lista de archivos
          attachments = data.attachments;
        }
      }

      if (fileHistoryItem) {
        historyUpdates.push(fileHistoryItem);
      }

      // Si no hay cambios específicos pero hay una actualización general
      if (
        historyUpdates.length === 0 &&
        (data.title !== currentTicket.title ||
          data.description !== currentTicket.description)
      ) {
        historyUpdates.push({
          date: now,
          action: "edited",
          user: userName,
          comment: `Ticket actualizado`,
        });
      }

      // Si hay un comentario explícito, añadirlo como evento
      if (data.comment) {
        historyUpdates.push({
          date: now,
          action: "comment_added",
          user: userName,
          comment: data.comment,
        });
        delete data.comment; // Remover para que no se guarde en los datos principales
      }

      // Fusionar el historial actual con las nuevas actualizaciones
      const history = [...currentHistory, ...historyUpdates];

      const updateData = {
        ...data,
        updatedAt: now,
        attachments,
        history,
        hasAppointment: data.hasAppointment,
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
      set({ loading: false });
      let errorMsg = error.message || "Error al procesar el ticket";

      // Detectar errores específicos de Firebase Storage
      if (error.code === "storage/unauthorized") {
        errorMsg = "No tienes permisos para subir archivos";
      } else if (error.code === "storage/object-too-large") {
        errorMsg =
          "Uno o más archivos son demasiado grandes. El límite es de 15MB por archivo";
      } else if (error.code === "storage/retry-limit-exceeded") {
        errorMsg = "Error de conexión al intentar subir los archivos";
      }

      toast.error(errorMsg);
      throw error;
    }
  },

  deleteTicket: async (ticketId) => {
    set({ loading: true, error: null });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }
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
      set({ loading: false });
      let errorMsg = error.message || "Error al procesar el ticket";

      // Detectar errores específicos de Firebase Storage
      if (error.code === "storage/unauthorized") {
        errorMsg = "No tienes permisos para subir archivos";
      } else if (error.code === "storage/object-too-large") {
        errorMsg =
          "Uno o más archivos son demasiado grandes. El límite es de 15MB por archivo";
      } else if (error.code === "storage/retry-limit-exceeded") {
        errorMsg = "Error de conexión al intentar subir los archivos";
      }

      toast.error(errorMsg);
      throw error;
    }
  },

  setActiveTicket: (ticket) => {
    set({ activeTicket: ticket });
  },

  searchTicketByFolio: async (folio) => {
    set({ loading: true });
    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ loading: false });
        toast.error("Condominio no seleccionado");
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ loading: false });
        toast.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) {
        set({ loading: false });
        toast.error("clientId no disponible en el token");
        throw new Error("clientId no disponible en el token");
      }

      const db = getFirestore();
      const ticketsRef = collection(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "ticketsMaintenance"
      );

      // Crea una consulta filtrada por folio
      const q = query(ticketsRef, where("folio", "==", folio));
      const querySnapshot = await getDocs(q);

      const tickets: Ticket[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tickets.push({
          id: docSnap.id,
          folio: data.folio || "",
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
          createdByEmail: data.createdByEmail || "",
          assignedTo: data.assignedTo,
          priority: data.priority,
          attachments: data.attachments || [],
          history: data.history || [],
          mergedFrom: data.mergedFrom || [],
          area: data.area,
          tags: data.tags || [],
          providerId: data.providerId,
          closedAt: data.closedAt?.toDate
            ? data.closedAt.toDate()
            : data.closedAt
            ? new Date(data.closedAt)
            : undefined,
          hasAppointment: data.hasAppointment || false,
        });
      });

      set({ tickets, loading: false, hasMore: false });

      // Si se encuentra exactamente un ticket, establecerlo como activo
      if (tickets.length === 1) {
        set({ activeTicket: tickets[0] });
        toast.success(`Ticket con folio ${folio} encontrado`);
      } else if (tickets.length === 0) {
        toast.error(`No se encontró ningún ticket con folio ${folio}`);
      } else {
        toast.success(`Se encontraron ${tickets.length} tickets`);
      }
    } catch (error: any) {
      set({ loading: false });
      toast.error(error.message || "Error al buscar ticket");
    }
  },

  invalidateCache: () => {
    set({ hasMore: true, lastDoc: null });
  },
}));
