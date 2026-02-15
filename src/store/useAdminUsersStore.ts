import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  writeBatch,
} from "firebase/firestore";
import toast from "react-hot-toast";
import axios from "axios";
import { writeAuditLog } from "../services/auditService";

interface AdminUser {
  id?: string;
  name: string;
  lastName: string;
  email: string;
  role: "admin" | "admin-assistant";
  condominiumUids: string[];
  photoURL?: string;
  photoUrl?: string;
  createdDate: any;
  uid: string;
  active: boolean;
}

interface Condominium {
  id: string;
  name: string;
  clientId: string;
}

interface CreateUserResponse {
  success: boolean;
  password?: string;
  error?: string;
}

interface AdminUsersState {
  users: AdminUser[];
  condominiums: Condominium[];
  loading: boolean;
  error: string | null;
  fetchUsers: (condominiumId: string) => Promise<void>;
  fetchCondominiums: () => Promise<void>;
  createUser: (
    userData: Omit<AdminUser, "id" | "createdDate">
  ) => Promise<CreateUserResponse>;
  updateUser: (userId: string, userData: Partial<AdminUser>) => Promise<void>;
  toggleUserActive: (
    userId: string,
    active: boolean,
    condominiumId?: string
  ) => Promise<void>;
}

function generatePassword(): string {
  const length = 8;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";

  // Asegurar al menos una mayúscula, una minúscula y un número
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];

  // Llenar el resto con caracteres aleatorios
  for (let i = 3; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Mezclar la contraseña
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export const useAdminUsersStore = create<AdminUsersState>()((set, get) => ({
  users: [],
  condominiums: [],
  loading: false,
  error: null,

  fetchUsers: async (condominiumId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      const db = getFirestore();
      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const q = query(
        usersRef,
        where("role", "in", ["admin", "admin-assistant"])
      );
      const snapshot = await getDocs(q);

      const users: AdminUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          condominiumUids: data.condominiumUids || [],
          photoURL: data.photoURL || data.photoUrl,
          createdDate: data.createdDate,
          uid: data.uid,
          active: typeof data.active === "boolean" ? data.active : true,
        });
      });

      set({ users, loading: false });
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      set({ error: error.message, loading: false });
      toast.error("Error al cargar usuarios");
    }
  },

  fetchCondominiums: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      const db = getFirestore();
      const condominiumsRef = collection(
        db,
        `clients/${clientId}/condominiums`
      );
      const snapshot = await getDocs(condominiumsRef);

      const condominiums: Condominium[] = [];
      snapshot.forEach((doc) => {
        condominiums.push({
          id: doc.id,
          name: doc.data().name,
          clientId: clientId,
        });
      });

      set({ condominiums, loading: false });
    } catch (error: any) {
      console.error("Error al cargar condominios:", error);
      set({ error: error.message, loading: false });
      toast.error("Error al cargar condominios");
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      // Generar contraseña
      const password = generatePassword();

      // Crear usuario usando el endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/register-administrators`,
        {
          email: userData.email,
          password,
          clientId,
          name: userData.name,
          lastName: userData.lastName,
          condominiumUids: userData.condominiumUids,
          photoURL: userData.photoURL || null,
          role: userData.role,
          active: true,
        }
      );

      // Si la respuesta es exitosa, recargamos la tabla y devolvemos la contraseña
      if (response.data) {
        await writeAuditLog({
          module: "Administradores",
          entityType: "admin_user",
          entityId: response.data?.id || userData.email,
          action: "create",
          summary: `Se creó el administrador ${userData.name} ${userData.lastName}`,
          after: {
            email: userData.email,
            role: userData.role,
            condominiumUids: userData.condominiumUids,
            active: true,
          },
        });
        toast.success("Usuario creado exitosamente");
        // Recargar la tabla de usuarios
        await get().fetchUsers(userData.condominiumUids[0]);
        return {
          success: true,
          password, // Devolvemos la contraseña generada para mostrarla en el modal
        };
      } else {
        throw new Error("Error al crear usuario");
      }
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      set({ error: error.message, loading: false });
      toast.error(error.response?.data?.message || "Error al crear usuario");
      return { success: false, error: error.message };
    }
  },

  updateUser: async (userId: string, userData: Partial<AdminUser>) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      const condominiumId =
        userData.condominiumUids?.[0] || localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Buscar el usuario para obtener su uid
      const userToUpdate = get().users.find((u) => u.id === userId);
      if (!userToUpdate) throw new Error("Usuario no encontrado");

      // Actualizar usuario usando el endpoint con el uid correcto
      const requestPayload = {
        clientId,
        email: userData.email || userToUpdate.email || "",
        name: userData.name || userToUpdate.name || "",
        lastName: userData.lastName || userToUpdate.lastName || "",
        condominiumUids:
          userData.condominiumUids || userToUpdate.condominiumUids || [],
        photoURL:
          userData.photoURL ||
          userToUpdate.photoURL ||
          userToUpdate.photoUrl ||
          "",
        role: userData.role || userToUpdate.role,
        active:
          typeof userData.active === "boolean"
            ? userData.active
            : userToUpdate.active,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/edit-administrator/${
          userToUpdate.uid
        }`,
        requestPayload
      );

      if (response.data) {
        await writeAuditLog({
          module: "Administradores",
          entityType: "admin_user",
          entityId: userToUpdate.uid,
          action: "update",
          summary: `Se actualizó el administrador ${requestPayload.name} ${requestPayload.lastName}`,
          before: {
            email: userToUpdate.email,
            role: userToUpdate.role,
            condominiumUids: userToUpdate.condominiumUids,
            active: userToUpdate.active,
          },
          after: {
            email: requestPayload.email,
            role: requestPayload.role,
            condominiumUids: requestPayload.condominiumUids,
            active: requestPayload.active,
          },
        });
        await get().fetchUsers(condominiumId);
      } else {
        throw new Error("Error al actualizar usuario");
      }
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      if (error?.response?.data) {
        console.error("Detalle backend updateUser:", error.response.data);
      }
      set({ error: error.message, loading: false });
      toast.error(
        error.response?.data?.message || "Error al actualizar usuario"
      );
    } finally {
      set({ loading: false });
    }
  },

  toggleUserActive: async (userId: string, active: boolean, condominiumId) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      const userToToggle = get().users.find((u) => u.id === userId);
      if (!userToToggle) throw new Error("Usuario no encontrado");

      const targetCondominiumId =
        condominiumId || localStorage.getItem("condominiumId");
      if (!targetCondominiumId) throw new Error("Condominio no seleccionado");

      if (!userToToggle.condominiumUids.includes(targetCondominiumId)) {
        throw new Error(
          "No autorizado para modificar usuarios fuera del condominio seleccionado"
        );
      }

      // Actualiza Auth mediante backend (deshabilita/habilita inicio de sesión)
      const requestPayload = {
        clientId,
        email: userToToggle.email || "",
        name: userToToggle.name || "",
        lastName: userToToggle.lastName || "",
        condominiumUids: userToToggle.condominiumUids || [],
        photoURL: userToToggle.photoURL || userToToggle.photoUrl || "",
        role: userToToggle.role,
        active,
      };

      await axios.put(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/edit-administrator/${
          userToToggle.uid
        }`,
        requestPayload
      );

      const db = getFirestore();
      const batch = writeBatch(db);
      userToToggle.condominiumUids.forEach((condoId) => {
        const userRef = doc(
          db,
          `clients/${clientId}/condominiums/${condoId}/users/${userId}`
        );
        batch.set(userRef, { active }, { merge: true });
      });
      await batch.commit();

      await writeAuditLog({
        module: "Administradores",
        entityType: "admin_user",
        entityId: userToToggle.uid,
        action: "toggle",
        summary: `Se ${active ? "activó" : "desactivó"} al administrador ${userToToggle.name} ${userToToggle.lastName}`,
        before: { active: userToToggle.active },
        after: { active },
        metadata: { condominiumId: targetCondominiumId },
      });

      toast.success(
        `Usuario ${active ? "activado" : "desactivado"} exitosamente`
      );
      await get().fetchUsers(targetCondominiumId);
    } catch (error: any) {
      console.error("Error al actualizar estado del usuario:", error);
      if (error?.response?.data) {
        console.error("Detalle backend toggleUserActive:", error.response.data);
      }
      set({ error: error.message, loading: false });
      toast.error(
        error.response?.data?.message || "Error al actualizar estado del usuario"
      );
    } finally {
      set({ loading: false });
    }
  },
}));
