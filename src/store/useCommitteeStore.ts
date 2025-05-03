import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useCondominiumStore } from "./useCondominiumStore";

// Interfaz para los miembros del comité
export interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  reportsPreferences: {
    maintenance: boolean;
    financialReports: boolean;
  };
  clientId: string;
  condominiumId: string;
  condominiumName: string;
  frequency: "daily" | "weekly" | "monthly";
  scheduleDay:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  scheduleTime: string;
  receiveReports: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para el store
interface CommitteeStore {
  members: CommitteeMember[];
  isLoading: boolean;
  error: string | null;
  fetchCommitteeMembers: () => Promise<void>;
  addCommitteeMember: (
    member: Omit<
      CommitteeMember,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "clientId"
      | "condominiumId"
      | "condominiumName"
    > & {
      frequency?: "daily" | "weekly" | "monthly";
      scheduleDay?:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday";
      scheduleTime?: string;
      receiveReports?: boolean;
    }
  ) => Promise<void>;
  updateCommitteeMember: (
    id: string,
    member: Partial<
      Omit<
        CommitteeMember,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "clientId"
        | "condominiumId"
        | "condominiumName"
      >
    >
  ) => Promise<void>;
  deleteCommitteeMember: (id: string) => Promise<void>;
  resetCommitteeData: () => void;
}

export const useCommitteeStore = create<CommitteeStore>()((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  fetchCommitteeMembers: async () => {
    try {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      if (!clientId) {
        throw new Error("ID de cliente no disponible");
      }

      const condominiumId = useCondominiumStore
        .getState()
        .getCurrentCondominiumId();

      if (!condominiumId) {
        throw new Error("ID de condominio no disponible");
      }

      // Obtener el nombre del condominio actual
      const condominiumData =
        useCondominiumStore.getState().selectedCondominium;
      const condominiumName = condominiumData?.name || "Condominio";

      const db = getFirestore();
      const committeeRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/reportsForCommitteeMembers`
      );

      const snapshot = await getDocs(committeeRef);

      const committeeMembers: CommitteeMember[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convertir los reportes antiguos al nuevo formato si es necesario
        let maintenance = data.reportsPreferences?.maintenance || false;
        let financialReports = false;

        // Si tenemos datos en el formato antiguo, hacer la conversión
        if (data.reportsPreferences) {
          if (
            data.reportsPreferences.expenses ||
            data.reportsPreferences.income ||
            data.reportsPreferences.globalAccountStatus
          ) {
            financialReports = true;
          }
        }

        return {
          id: doc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          department: data.department || "",
          role: data.role || "",
          reportsPreferences: {
            maintenance: maintenance,
            financialReports:
              data.reportsPreferences?.financialReports !== undefined
                ? data.reportsPreferences.financialReports
                : financialReports,
          },
          clientId: data.clientId || clientId,
          condominiumId: data.condominiumId || condominiumId,
          condominiumName: data.condominiumName || condominiumName,
          frequency: data.frequency || "weekly",
          scheduleDay: data.scheduleDay || "monday",
          scheduleTime: data.scheduleTime || "06:00",
          receiveReports:
            data.receiveReports !== undefined ? data.receiveReports : true,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });

      set({
        members: committeeMembers,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al cargar miembros del comité";
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        members: [],
      });
    }
  },

  addCommitteeMember: async (member) => {
    try {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      if (!clientId) {
        throw new Error("ID de cliente no disponible");
      }

      const condominiumId = useCondominiumStore
        .getState()
        .getCurrentCondominiumId();

      if (!condominiumId) {
        throw new Error("ID de condominio no disponible");
      }

      // Obtener el nombre del condominio actual
      const condominiumData =
        useCondominiumStore.getState().selectedCondominium;
      const condominiumName = condominiumData?.name || "Condominio";

      const db = getFirestore();
      const committeeRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/reportsForCommitteeMembers`
      );

      // Verificar si ya existe un miembro con el mismo correo
      const emailQuery = query(
        committeeRef,
        where("email", "==", member.email)
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        throw new Error(
          "Ya existe un miembro del comité con este correo electrónico"
        );
      }

      await addDoc(committeeRef, {
        ...member,
        clientId,
        condominiumId,
        condominiumName,
        frequency: member.frequency || "weekly",
        scheduleDay: member.scheduleDay || "monday",
        scheduleTime: member.scheduleTime || "06:00",
        receiveReports:
          member.receiveReports !== undefined ? member.receiveReports : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Refrescar la lista después de agregar
      await get().fetchCommitteeMembers();

      toast.success("Miembro del comité agregado correctamente");
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al agregar miembro del comité";
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  updateCommitteeMember: async (id, memberUpdate) => {
    try {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      if (!clientId) {
        throw new Error("ID de cliente no disponible");
      }

      const condominiumId = useCondominiumStore
        .getState()
        .getCurrentCondominiumId();

      if (!condominiumId) {
        throw new Error("ID de condominio no disponible");
      }

      const db = getFirestore();
      const memberRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/reportsForCommitteeMembers/${id}`
      );

      // Si el correo cambió, verificar que no exista otro miembro con ese correo
      if (memberUpdate.email) {
        const committeeRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/reportsForCommitteeMembers`
        );
        const emailQuery = query(
          committeeRef,
          where("email", "==", memberUpdate.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty && emailSnapshot.docs[0].id !== id) {
          throw new Error(
            "Ya existe un miembro del comité con este correo electrónico"
          );
        }
      }

      await updateDoc(memberRef, {
        ...memberUpdate,
        updatedAt: serverTimestamp(),
      });

      // Refrescar la lista después de actualizar
      await get().fetchCommitteeMembers();

      toast.success("Miembro del comité actualizado correctamente");
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al actualizar miembro del comité";
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  deleteCommitteeMember: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      if (!clientId) {
        throw new Error("ID de cliente no disponible");
      }

      const condominiumId = useCondominiumStore
        .getState()
        .getCurrentCondominiumId();

      if (!condominiumId) {
        throw new Error("ID de condominio no disponible");
      }

      const db = getFirestore();
      const memberRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/reportsForCommitteeMembers/${id}`
      );

      await deleteDoc(memberRef);

      // Actualizar el estado eliminando el miembro
      const currentMembers = get().members;
      set({
        members: currentMembers.filter((member) => member.id !== id),
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.message || "Error al eliminar miembro del comité";
      toast.error(errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  resetCommitteeData: () => {
    set({
      members: [],
      isLoading: false,
      error: null,
    });
  },
}));

export default useCommitteeStore;
