// src/stores/userStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Ajusta la ruta según tu estructura de carpetas
import { UserData } from "../interfaces/UserData";
import { useCondominiumStore } from "./useCondominiumStore";
import * as Sentry from "@sentry/react";

export interface UserState {
  user: UserData | null;
  authListenerSet: boolean;
  condominiumsFetched: boolean;
  condominiumsUsersFetched: boolean;
  adminUsersFetched: boolean;
  adminUsers: UserData[];
  condominiums: Condominium[];
  condominiumsUsers: UserData[];
  setUser: (user: UserData) => void;
  fetchUserData: () => void;
  fetchCondominiums: () => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  fetchCondominiumsUsers: () => Promise<void>;
  fetchUserDetails: (uid: string) => Promise<UserData | null>;
  setAuthListenerSet: (value: boolean) => void;
  fetchPaginatedCondominiumsUsers: (
    pageSize: number,
    page: number
  ) => Promise<UserData[]>;
  searchUsersByName: (
    name: string,
    pageSize: number,
    page: number
  ) => Promise<UserData[]>;
  updateUser: (uid: string, userData: Partial<UserData>) => Promise<boolean>;
  resetCondominiumUserData: () => void;
}

interface Condominium {
  id: string;
  name: string;
}

const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  authListenerSet: false,
  condominiumsFetched: false,
  condominiums: [],
  adminUsersFetched: false,
  adminUsers: [],
  condominiumsUsersFetched: false,
  condominiumsUsers: [],
  setUser: (user) => set({ user }),
  setAuthListenerSet: (value) => set({ authListenerSet: value }),
  resetCondominiumUserData: () => {
    // Vaciamos inmediatamente los arrays para evitar que los datos viejos persistan
    set({
      condominiumsUsersFetched: false,
      adminUsersFetched: false,
      condominiumsFetched: false,
      condominiumsUsers: [],
      adminUsers: [],
      condominiums: [],
    });
  },
  fetchUserData: () => {
    if (!get().authListenerSet) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            const clientId = token.claims.clientId;

            if (clientId) {
              const db = getFirestore();
              // Primero, obtener todos los condominios donde el usuario tiene acceso
              const condominiumsRef = collection(
                db,
                `clients/${clientId}/condominiums`
              );
              const condominiumsSnapshot = await getDocs(condominiumsRef);

              const condominiums: Condominium[] = [];
              let userData: UserData | null = null;

              // Para cada condominio, verificar si el usuario tiene acceso
              for (const condominiumDoc of condominiumsSnapshot.docs) {
                const usersRef = collection(
                  db,
                  `clients/${clientId}/condominiums/${condominiumDoc.id}/users`
                );
                const q = query(usersRef, where("uid", "==", user.uid));
                const userSnapshot = await getDocs(q);

                if (!userSnapshot.empty) {
                  // Si el usuario tiene acceso a este condominio, añadirlo a la lista
                  condominiums.push({
                    id: condominiumDoc.id,
                    name: condominiumDoc.data().name,
                  });

                  // Si aún no tenemos los datos del usuario, guardarlos
                  if (!userData) {
                    userData = userSnapshot.docs[0].data() as UserData;
                  }
                }
              }

              // Si encontramos condominios y datos del usuario
              if (condominiums.length > 0 && userData) {
                set({
                  user: userData,
                  condominiums,
                  condominiumsFetched: true,
                });
              } else {
                console.error(
                  "No se encontraron datos del usuario o condominios."
                );
                set({ user: null });
              }
            }
          } catch (error) {
            Sentry.captureException(error);
          }
        } else {
          set({ user: null });
        }
      });
      set({ authListenerSet: true });
      return () => unsubscribe();
    }
  },
  fetchCondominiums: async () => {
    // Verifica si los datos de los condominios ya han sido cargados para evitar llamadas múltiples
    if (!get().condominiumsFetched) {
      const userAuth = auth.currentUser;
      if (userAuth) {
        const token = await getIdTokenResult(userAuth);
        const clientId = token.claims.clientId;
        if (clientId) {
          const db = getFirestore();
          const user = get().user;
          if (user && user.condominiumUids) {
            const condominiums: Condominium[] = [];
            for (const uid of user.condominiumUids) {
              const condominiumRef = doc(
                db,
                `clients/${clientId}/condominiums`,
                uid
              );
              const condominiumSnap = await getDoc(condominiumRef);
              if (condominiumSnap.exists()) {
                condominiums.push({
                  id: uid,
                  name: condominiumSnap.data().name,
                });
              } else {
                console.error(`Condominium with UID ${uid} not found.`);
              }
            }
            set({ condominiums, condominiumsFetched: true });
          }
        } else {
          console.error("Client ID not found in token claims.");
        }
      } else {
        console.error("No authenticated user found.");
      }
    }
  },
  fetchAdminUsers: async () => {
    if (!get().adminUsersFetched) {
      const userAuth = auth.currentUser;
      if (userAuth) {
        const token = await getIdTokenResult(userAuth);
        const clientId = token.claims.clientId;
        const role = token.claims.role;
        // Verifica si el usuario tiene el rol adecuado para realizar esta consulta
        if (clientId && (role === "admin" || role === "admin-assistant")) {
          const db = getFirestore();
          const usersRef = collection(
            db,
            `clients/${clientId}/condominiums/${token.claims.condominiumId}/users`
          );
          const q = query(
            usersRef,
            where("role", "in", ["admin", "admin-assistant"])
          );
          const querySnapshot = await getDocs(q);
          const adminUsers = querySnapshot.docs.map(
            (doc) => doc.data() as UserData
          );
          set({ adminUsers, adminUsersFetched: true });
        } else {
          console.error(
            "El usuario no tiene permisos para realizar esta acción."
          );
        }
      } else {
        console.error("No authenticated user found.");
      }
    }
  },
  fetchUserDetails: async (uid: string) => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      const token = await getIdTokenResult(userAuth);
      const clientId = token.claims.clientId;
      if (clientId) {
        const db = getFirestore();
        const condominiumId = useCondominiumStore
          .getState()
          .getCurrentCondominiumId();
        if (condominiumId) {
          const userRef = doc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users`,
            uid
          );
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userDetails = userSnap.data() as UserData;
            return userDetails;
          }
        }
      }
    }
    return null;
  },
  fetchCondominiumsUsers: async () => {
    // Verifica si ya se han cargado los datos para evitar llamadas múltiples
    // o si se ha cambiado de condominio
    const condominiumId = useCondominiumStore
      .getState()
      .getCurrentCondominiumId();

    if (
      !get().condominiumsUsersFetched ||
      get().condominiumsUsers.length === 0
    ) {
      const userAuth = auth.currentUser;
      if (userAuth) {
        try {
          const token = await getIdTokenResult(userAuth);
          const clientId = token.claims.clientId;
          const userRole = token.claims.role;

          // Verifica si el usuario tiene el rol adecuado para realizar esta consulta
          if (
            !clientId ||
            !(userRole === "admin" || userRole === "admin-assistant")
          ) {
            console.error(
              "El usuario no tiene permisos para realizar esta acción."
            );
            return;
          }

          const db = getFirestore();

          // Usar el ID del condominio actual en lugar de condominiumUids
          const currentCondominiumId = condominiumId;

          if (!currentCondominiumId) {
            console.error("No hay condominio seleccionado");
            return;
          }
          const usersRef = collection(
            db,
            `clients/${clientId}/condominiums/${currentCondominiumId}/users`
          );

          const q = query(
            usersRef,
            where("role", "not-in", ["admin", "admin-assistant"])
          );

          const querySnapshot = await getDocs(q);
          const users = querySnapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id } as unknown as UserData)
          );

          set({ condominiumsUsers: users, condominiumsUsersFetched: true });
        } catch (error) {
          console.error("Error al obtener usuarios del condominio:", error);
          set({ condominiumsUsers: [], condominiumsUsersFetched: false });
        }
      } else {
        console.error("No authenticated user found.");
      }
    }
  },
  fetchPaginatedCondominiumsUsers: async (pageSize: number, page: number) => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      try {
        const token = await getIdTokenResult(userAuth);
        const clientId = token.claims.clientId;
        const userRole = token.claims.role;

        if (
          !clientId ||
          !(userRole === "admin" || userRole === "admin-assistant")
        ) {
          console.error(
            "El usuario no tiene permisos para realizar esta acción."
          );
          return [];
        }

        const db = getFirestore();
        // Usar el ID del condominio actual en lugar de condominiumUids
        const currentCondominiumId = useCondominiumStore
          .getState()
          .getCurrentCondominiumId();

        if (!currentCondominiumId) {
          console.error("No hay condominio seleccionado");
          return [];
        }
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${currentCondominiumId}/users`
        );

        const q = query(
          usersRef,
          where("role", "not-in", ["admin", "admin-assistant"])
        );

        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as unknown as UserData)
        );

        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;

        const paginatedUsers = users.slice(startIdx, endIdx);
        return paginatedUsers;
      } catch (error) {
        console.error("Error al obtener usuarios paginados:", error);
        return [];
      }
    } else {
      console.error("No authenticated user found.");
      return [];
    }
  },
  searchUsersByName: async (name: string, pageSize: number, page: number) => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      try {
        const token = await getIdTokenResult(userAuth);
        const clientId = token.claims.clientId;
        const userRole = token.claims.role;

        if (
          !clientId ||
          !(userRole === "admin" || userRole === "admin-assistant")
        ) {
          console.error(
            "El usuario no tiene permisos para realizar esta acción."
          );
          return [];
        }

        const db = getFirestore();
        // Usar el ID del condominio actual en lugar de condominiumUids
        const currentCondominiumId = useCondominiumStore
          .getState()
          .getCurrentCondominiumId();

        if (!currentCondominiumId) {
          console.error("No hay condominio seleccionado");
          return [];
        }
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${currentCondominiumId}/users`
        );

        const q = query(
          usersRef,
          where("role", "not-in", ["admin", "admin-assistant"])
        );

        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as unknown as UserData)
        );

        // Función para normalizar y remover acentos de una cadena de texto
        const normalizeText = (text: string) =>
          text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        // Normalizar el término de búsqueda
        const normalizedSearchName = normalizeText(name);

        // Filtrar los usuarios por nombre en el cliente, después de normalizar
        const filteredUsersByName = users.filter((user) =>
          normalizeText(user.name).includes(normalizedSearchName)
        );

        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;

        const paginatedUsers = filteredUsersByName.slice(startIdx, endIdx);
        return paginatedUsers;
      } catch (error) {
        console.error("Error al buscar usuarios por nombre:", error);
        return [];
      }
    } else {
      console.error("No authenticated user found.");
      return [];
    }
  },
  updateUser: async (uid: string, userData: Partial<UserData>) => {
    try {
      const userAuth = auth.currentUser;
      if (!userAuth) {
        throw new Error("Usuario no autenticado");
      }

      const token = await getIdTokenResult(userAuth);
      const clientId = token.claims.clientId;
      const condominiumId = useCondominiumStore
        .getState()
        .getCurrentCondominiumId();

      if (!clientId || !condominiumId) {
        throw new Error("No se encontró el ID del cliente o condominio");
      }

      const db = getFirestore();
      const userRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`,
        uid
      );

      // Actualizar el documento
      await updateDoc(userRef, userData);

      // Actualizar el estado local
      const updatedUsers = get().condominiumsUsers.map((user) =>
        user.uid === uid ? { ...user, ...userData } : user
      );
      set({ condominiumsUsers: updatedUsers });

      return true;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  },
}));

export default useUserStore;
