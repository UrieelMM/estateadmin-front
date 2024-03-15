// src/stores/userStore.ts
import create from 'zustand';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase'; // Ajusta la ruta según tu estructura de carpetas
import { UserData } from '../interfaces/UserData';

export interface UserState {
  user: UserData | null;
  authListenerSet: boolean;
  setUser: (user: UserData) => void;
  fetchUserData: () => void;
  setAuthListenerSet: (value: boolean) => void;
}

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  authListenerSet: false, 
  setUser: (user) => set({ user }),
  setAuthListenerSet: (value) => set({ authListenerSet: value }),
  fetchUserData: () => {
    if (!get().authListenerSet) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const token = await user.getIdTokenResult();
            const clientId = token.claims.clientId;
            const condominiumName = token.claims.condominiumName;

            if (clientId && condominiumName) {
              const db = getFirestore();
              const usersRef = collection(db, `clients/${clientId}/condominiums/${condominiumName}/users`);
              const q = query(usersRef, where("uid", "==", user.uid));
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data() as UserData; // Aserción de tipo aquí
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
      return () => unsubscribe(); // Esta es la función de limpieza para desuscribirse
    } 
  },
}));

export default useUserStore;
