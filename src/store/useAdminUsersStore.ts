import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import axios from "axios";

interface AdminUser {
  id?: string;
  name: string;
  lastName: string;
  email: string;
  role: "admin" | "admin-assistant";
  condominiumUids: string[];
  photoURL?: string;
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
  toggleUserActive: (userId: string, active: boolean) => Promise<void>;
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
          photoURL: data.photoURL,
          createdDate: data.createdDate,
          uid: data.uid,
          active: data.active,
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
          active: userData.active,
        }
      );

      // Si la respuesta es exitosa, recargamos la tabla y devolvemos la contraseña
      if (response.data) {
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
      const response = await axios.put(
        `${import.meta.env.VITE_URL_SERVER}/users-auth/edit-administrator/${
          userToUpdate.uid
        }`,
        {
          clientId, // Agregar clientId al body
          name: userData.name,
          lastName: userData.lastName,
          condominiumUids: userData.condominiumUids,
          role: userData.role,
          active: userData.active,
        }
      );

      if (response.data) {
        await get().fetchUsers(condominiumId);
      } else {
        throw new Error("Error al actualizar usuario");
      }
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      set({ error: error.message, loading: false });
      toast.error(
        error.response?.data?.message || "Error al actualizar usuario"
      );
    } finally {
      set({ loading: false });
    }
  },

  toggleUserActive: async (userId: string, active: boolean) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("clientId no disponible");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const userRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}`
      );
      await updateDoc(userRef, { active });

      toast.success(
        `Usuario ${active ? "activado" : "desactivado"} exitosamente`
      );
      await get().fetchUsers(condominiumId);
    } catch (error: any) {
      console.error("Error al actualizar estado del usuario:", error);
      set({ error: error.message, loading: false });
      toast.error("Error al actualizar estado del usuario");
    }
  },
}));
