// src/stores/userStore.ts
import {create}from 'zustand';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase'; // Ajusta la ruta según tu estructura de carpetas
import { UserData } from '../interfaces/UserData';

export interface UserState {
  user: UserData | null;
  authListenerSet: boolean;
  condominiumsFetched: boolean; 
  condominiumsUsersFetched: boolean;
  adminUsersFetched: boolean;
  adminUsers: UserData[];
  condominiums: Condominium[];
  condominiumsUsers: UserData[],
  setUser: (user: UserData) => void;
  fetchUserData: () => void;
  fetchCondominiums: () => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  fetchCondominiumsUsers: () => Promise<void>;
  fetchUserDetails: (uid: string) => Promise<UserData | null>;
  setAuthListenerSet: (value: boolean) => void;
  fetchPaginatedCondominiumsUsers: (pageSize: number, page: number) => Promise<UserData[]>;
  searchUsersByName: (name: string, pageSize: number, page: number) => Promise<UserData[]>;
}

interface Condominium {
  name: string;
  uid: string;
}

const useUserStore = create<UserState>((set, get) => ({
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
  fetchUserData: () => {
    if (!get().authListenerSet) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            const clientId = token.claims.clientId;
            const condominiumId = token.claims.condominiumId;

            if (clientId && condominiumId) {
              const db = getFirestore();
              const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumId}/users`);
              const q = query(usersRef, where("uid", "==", user.uid));
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data() as UserData;
                set({ user: userData });
              } else {
                console.error('No se encontraron datos del usuario.');
                set({ user: null });
              }
            }
          } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
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
              const condominiumRef = doc(db, `clients/${clientId}/condominiums`, uid);
              const condominiumSnap = await getDoc(condominiumRef);
              if (condominiumSnap.exists()) {
                condominiums.push({
                  name: condominiumSnap.data().name,
                  uid
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
        if (clientId && (role === 'admin' || role === 'admin-assistant')) {
          const db = getFirestore();
          const usersRef = collection(db, `clients/${clientId}/condominiums/${token.claims.condominiumId}/users`);
          const q = query(usersRef, where("role", "in", ["admin", "admin-assistant"]));
          const querySnapshot = await getDocs(q);
          const adminUsers = querySnapshot.docs.map(doc => doc.data() as UserData);
          set({ adminUsers, adminUsersFetched: true });
        } else {
          console.error("El usuario no tiene permisos para realizar esta acción.");
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
        // Asume una estructura de colección como clients/${clientId}/condominiums/${condominiumId}/users
        // Nota: necesitas el condominiumId para la ruta, asegúrate de tenerlo disponible o ajusta la ruta según tu estructura
        const condominiumId = token.claims.condominiumId;
        if (condominiumId) {
          const userRef = doc(db, `clients/${clientId}/condominiums/${condominiumId}/users`, uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userDetails = userSnap.data() as UserData;
            return userDetails;
          } else {
            console.error("User not found.");
            return null;
          }
        } else {
          console.error("Condominium ID not found in token claims.");
          return null;
        }
      } else {
        console.error("Client ID not found in token claims.");
        return null;
      }
    } else {
      console.error("No authenticated user found.");
      return null;
    }
  },
  fetchCondominiumsUsers: async () => {
    // Verifica si ya se han cargado los datos para evitar llamadas múltiples
    if (!get().condominiumsUsersFetched) {
      const userAuth = auth.currentUser;
      if (userAuth) {
        const token = await getIdTokenResult(userAuth);
        const clientId = token.claims.clientId;
        const userRole = token.claims.role;
        // Verifica si el usuario tiene el rol adecuado para realizar esta consulta
        if (clientId && (userRole === 'admin' || userRole === 'admin-assistant')) {
          const db = getFirestore();
          const user = get().user;
          if (user && user.condominiumUids) {
            let users: UserData[] = [];
            for (const condominiumUid of user.condominiumUids) {
              const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumUid}/users`);
              const q = query(usersRef, where("role", "not-in", ["admin", "admin-assistant"]));
              const querySnapshot = await getDocs(q);
              users = users.concat(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserData));
            }
            set({ condominiumsUsers: users, condominiumsUsersFetched: true });
          }
        } else {
          console.error("El usuario no tiene permisos para realizar esta acción.");
        }
      } else {
        console.error("No authenticated user found.");
      }
    }
  },
  fetchPaginatedCondominiumsUsers: async (pageSize: number, page: number) => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      const token = await getIdTokenResult(userAuth);
      const clientId = token.claims.clientId;
      const userRole = token.claims.role;
      if (clientId && (userRole === 'admin' || userRole === 'admin-assistant')) {
        const db = getFirestore();
        const user = get().user;
        if (user && user.condominiumUids) {
          const users: UserData[] = [];
          const startIdx = (page - 1) * pageSize;
          const endIdx = startIdx + pageSize;

          for (const condominiumUid of user.condominiumUids) {
            const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumUid}/users`);
            const q = query(usersRef, where("role", "not-in", ["admin", "admin-assistant"]));
            const querySnapshot = await getDocs(q);

            const usersSnapshot = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserData);
            users.push(...usersSnapshot);
          }

          const paginatedUsers = users.slice(startIdx, endIdx);
          return paginatedUsers;
        }
      } else {
        console.error("El usuario no tiene permisos para realizar esta acción.");
      }
    } else {
      console.error("No authenticated user found.");
    }
    return [];
  },
  searchUsersByName: async (name: string, pageSize: number, page: number) => {
    const userAuth = auth.currentUser;
    if (userAuth) {
      const token = await getIdTokenResult(userAuth);
      const clientId = token.claims.clientId;
      const userRole = token.claims.role;
      if (clientId && (userRole === 'admin' || userRole === 'admin-assistant')) {
        const db = getFirestore();
        const user = get().user;
        if (user && user.condominiumUids) {
          const startIdx = (page - 1) * pageSize;
          const endIdx = startIdx + pageSize;
  
          const filteredUsers: UserData[] = [];
  
          for (const condominiumUid of user.condominiumUids) {
            const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumUid}/users`);
            const q = query(usersRef, where("role", "not-in", ["admin", "admin-assistant"]));
            const querySnapshot = await getDocs(q);
  
            const usersSnapshot = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserData);
            filteredUsers.push(...usersSnapshot);
          }
  
          // Filtrar los usuarios por nombre en el cliente
          const filteredUsersByName = filteredUsers.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  
          const paginatedUsers = filteredUsersByName.slice(startIdx, endIdx);
          return paginatedUsers;
        }
      } else {
        console.error("El usuario no tiene permisos para realizar esta acción.");
      }
    } else {
      console.error("No authenticated user found.");
    }
    return [];
  }
}));

export default useUserStore;
