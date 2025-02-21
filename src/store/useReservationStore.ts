// calendarEventsStore.ts

import { create } from "zustand";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

export interface CalendarEvent {
  id: string;
  name: string;          // Nombre de quien reserva
  number: string;        // Número de quien reserva
  eventDay: string;      // Día del evento (formato "YYYY-MM-DD")
  commonArea: string;    // Área común que se usará
  startTime: string;     // Inicio del evento (hora, e.g., "HH:mm")
  endTime: string;       // Fin del evento (hora, e.g., "HH:mm")
  comments?: string;     // Comentarios (opcional)
  email: string;         // Email del usuario que crea el evento
}

export interface Resident {
  id: string;
  name: string;
  number: string;
}

export type FilterCriteria = {
  eventDay?: string;   // por ejemplo, "2025-02-17"
  commonArea?: string;
};

// Función auxiliar para convertir "HH:mm" a minutos
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Función auxiliar para determinar si dos rangos de tiempo se solapan
const timeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

type CalendarEventsState = {
  events: CalendarEvent[];
  residents: Resident[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  updateEvent: (id: string, data: Partial<Omit<CalendarEvent, "id" | "email">>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  /**
   * Crea un evento validando:
   *  - Que la hora de fin sea mayor que la de inicio.
   *  - Que no se empalmen eventos en la misma área y horario.
   *  - Que el condómino no tenga adeudos pendientes, a menos que se confirme la acción (force).
   *
   * En caso de tener adeudos, se lanza un error que incluye la propiedad "unpaidCharges".
   */
  createEvent: (
    data: Omit<CalendarEvent, "id" | "email">,
    options?: { force?: boolean }
  ) => Promise<void>;
  fetchResidents: () => Promise<void>;
  filterEvents: (filters: FilterCriteria) => CalendarEvent[];
};

export const useCalendarEventsStore = create<CalendarEventsState>((set, get) => ({
  events: [],
  residents: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      // Se obtiene el condominiumId de localStorage
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      const db = getFirestore();
      const eventsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/calendarEvents`
      );
      const snapshot = await getDocs(eventsRef);
      const events: CalendarEvent[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CalendarEvent, "id">),
      }));

      set({ events, loading: false });
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      set({
        error: error.message || "Error al obtener los eventos",
        loading: false,
      });
    }
  },

  createEvent: async (data: Omit<CalendarEvent, "id" | "email">, options?: { force?: boolean }) => {
    set({ loading: true, error: null });
    try {
      // Validar que todos los campos obligatorios estén completos
      if (
        !data.name ||
        !data.number ||
        !data.eventDay ||
        !data.commonArea ||
        !data.startTime ||
        !data.endTime
      ) {
        throw new Error("Todos los campos, excepto comentarios, son obligatorios.");
      }

      // Validar que la hora de fin sea mayor que la de inicio
      if (timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
        throw new Error("La hora de fin debe ser mayor que la hora de inicio.");
      }

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }
      if (!user.email) {
        throw new Error("El usuario no tiene un email válido.");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      // Validar que no existan eventos que se empalmen en la misma área y día
      const overlappingEvents = get().events.filter(
        (event) =>
          event.eventDay === data.eventDay &&
          event.commonArea === data.commonArea &&
          timeOverlap(event.startTime, event.endTime, data.startTime, data.endTime)
      );
      if (overlappingEvents.length > 0) {
        throw new Error(`${data.commonArea} ya está reservado en ese horario.`);
      }

      const db = getFirestore();
      // Validar que el condómino no tenga adeudos pendientes
      // Primero, obtener el condómino a partir del número
      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const q = query(usersRef, where("number", "==", data.number));
      const userSnapshot = await getDocs(q);
      if (userSnapshot.empty) {
        throw new Error("Condómino no encontrado.");
      }
      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id;

      // Consultar la subcolección de cargos del condómino
      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
      );
      const chargesSnapshot = await getDocs(chargesRef);
      const unpaidCharges: any[] = [];
      chargesSnapshot.forEach((doc) => {
        const chargeData = doc.data();
        if (chargeData.paid === false) {
          unpaidCharges.push({ id: doc.id, ...chargeData });
        }
      });

      // Si hay adeudos y no se ha confirmado la acción (force), se lanza un error con los cargos pendientes
      if (unpaidCharges.length > 0 && !options?.force) {
        const errorObj = new Error("El condómino tiene adeudos pendientes.");
        (errorObj as any).unpaidCharges = unpaidCharges;
        throw errorObj;
      }

      // Se arma el objeto a guardar, agregando el email del usuario autenticado
      const eventData = { ...data, email: user.email };

      // Si pasa todas las validaciones, se crea el evento
      const eventsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/calendarEvents`
      );
      await addDoc(eventsRef, eventData);

      // Refrescar la lista de eventos
      await get().fetchEvents();
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      set({
        error: error.message || "Error al crear el evento",
        loading: false,
      });
      // Se relanza el error para que el componente pueda manejarlo (por ejemplo, mostrar un modal de confirmación)
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchResidents: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      const db = getFirestore();
      const residentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const snapshot = await getDocs(residentsRef);
      const residents: Resident[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          number: data.number || "",
        };
      });

      set({ residents, loading: false });
    } catch (error: any) {
      console.error("Error fetching residents:", error);
      set({
        error: error.message || "Error al obtener los residentes",
        loading: false,
      });
    }
  },

  filterEvents: (filters: FilterCriteria) => {
    let filtered = get().events;
    if (filters.eventDay) {
      filtered = filtered.filter(
        (event) => event.eventDay === filters.eventDay
      );
    }
    if (filters.commonArea) {
      filtered = filtered.filter(
        (event) => event.commonArea === filters.commonArea
      );
    }
    return filtered;
  },

  updateEvent: async (id: string, data: Partial<Omit<CalendarEvent, "id" | "email">>) => {
    set({ loading: true, error: null });
    try {
      // Sólo se permiten actualizar los siguientes campos:
      const allowedFields = ["eventDay", "commonArea", "startTime", "endTime", "comments"];
      const updateData = allowedFields.reduce((obj, key) => {
        const value = data[key as keyof typeof data];
        // Para "comments", si es undefined, lo asignamos como cadena vacía,
        // ya que es válido tener comentarios vacíos.
        if (key === "comments") {
          obj[key] = value === undefined ? "" : value;
        } else if (value !== undefined) {
          obj[key as keyof typeof updateData] = value;
        }
        return obj;
      }, {} as Partial<Omit<CalendarEvent, "id" | "email">>);

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const db = getFirestore();
      const eventDocRef = doc(db, `clients/${clientId}/condominiums/${condominiumId}/calendarEvents`, id);
      await updateDoc(eventDocRef, updateData);
      await get().fetchEvents();
    } catch (error: any) {
      console.error("Error updating event:", error);
      set({ error: error.message || "Error al actualizar el evento", loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  deleteEvent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }
      const db = getFirestore();
      const eventDocRef = doc(db, `clients/${clientId}/condominiums/${condominiumId}/calendarEvents`, id);
      await deleteDoc(eventDocRef);
      await get().fetchEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      set({ error: error.message || "Error al eliminar el evento", loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
