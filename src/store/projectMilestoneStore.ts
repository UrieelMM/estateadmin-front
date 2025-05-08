// src/store/projectMilestoneStore.ts
import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc as createDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";

export enum MilestoneStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestoneCreateInput {
  projectId: string;
  title: string;
  description?: string;
  date: string;
  status?: MilestoneStatus;
}

interface ProjectMilestoneState {
  milestones: ProjectMilestone[];
  loading: boolean;
  error: string | null;
  fetchMilestones: (projectId: string) => Promise<void>;
  addMilestone: (data: ProjectMilestoneCreateInput) => Promise<string>;
  updateMilestone: (
    milestoneId: string,
    data: Partial<ProjectMilestoneCreateInput & { status: MilestoneStatus }>
  ) => Promise<void>;
  deleteMilestone: (milestoneId: string) => Promise<void>;
  toggleMilestoneStatus: (
    milestoneId: string,
    newStatus: MilestoneStatus
  ) => Promise<void>;
}

export const useProjectMilestoneStore = create<ProjectMilestoneState>()(
  (set, get) => ({
    milestones: [],
    loading: false,
    error: null,

    fetchMilestones: async (projectId: string) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("No se encontró clientId en los claims");
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");
        const db = getFirestore();
        const coll = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/milestones`
        );
        const q = query(coll, orderBy("date"));
        const snap = await getDocs(q);
        const items: ProjectMilestone[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            date: data.date,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        set({ milestones: items, loading: false });
      } catch (error: any) {
        console.error("Error al cargar hitos:", error);
        set({ loading: false, error: error.message });
      }
    },

    addMilestone: async (data: ProjectMilestoneCreateInput) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("No se encontró clientId en los claims");
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");
        const db = getFirestore();
        const coll = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/projects/${data.projectId}/milestones`
        );
        const newRef = createDoc(coll);
        const timestamp = new Date().toISOString();
        const milestoneData = {
          projectId: data.projectId,
          title: data.title,
          description: data.description || "",
          date: data.date,
          status: data.status || MilestoneStatus.PENDING,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await setDoc(newRef, milestoneData);
        await get().fetchMilestones(data.projectId);
        set({ loading: false });
        return newRef.id;
      } catch (error: any) {
        console.error("Error al crear hito:", error);
        set({ loading: false, error: error.message });
        return "";
      }
    },

    updateMilestone: async (milestoneId, data) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("No se encontró clientId en los claims");
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");
        const items = get().milestones;
        const ms = items.find((m) => m.id === milestoneId);
        if (!ms) throw new Error("Hito no encontrado");
        const db = getFirestore();
        const ref = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/projects/${ms.projectId}/milestones/${milestoneId}`
        );
        const updated = { ...data, updatedAt: new Date().toISOString() };
        await updateDoc(ref, updated);
        await get().fetchMilestones(ms.projectId);
        set({ loading: false });
      } catch (error: any) {
        console.error("Error al actualizar hito:", error);
        set({ loading: false, error: error.message });
      }
    },

    deleteMilestone: async (milestoneId) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("No se encontró clientId en los claims");
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");
        const items = get().milestones;
        const ms = items.find((m) => m.id === milestoneId);
        if (!ms) throw new Error("Hito no encontrado");
        const db = getFirestore();
        const ref = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/projects/${ms.projectId}/milestones/${milestoneId}`
        );
        await deleteDoc(ref);
        await get().fetchMilestones(ms.projectId);
        set({ loading: false });
      } catch (error: any) {
        console.error("Error al eliminar hito:", error);
        set({ loading: false, error: error.message });
      }
    },

    toggleMilestoneStatus: async (milestoneId, newStatus) => {
      await get().updateMilestone(milestoneId, { status: newStatus });
    },
  })
);
