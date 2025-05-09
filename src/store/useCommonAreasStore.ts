// useCommonAreasStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

// Definición de tipos para el área común
export type CommonArea = {
  id?: string;
  uid?: string;
  name: string;
  description: string;
  capacity: number;
  rate: number; // Tarifa por hora en centavos
  isReservable: boolean;
  amenities: string[];
  openTime: string;
  closeTime: string;
  images: string[];
  status: "active" | "maintenance" | "inactive";
  maintenanceNotes?: string;
  lastMaintenanceDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

// Definición de tipos para el estado del store
type CommonAreasState = {
  commonAreas: CommonArea[];
  selectedArea: CommonArea | null;
  loading: boolean;
  error: string | null;

  // Acciones
  fetchCommonAreas: () => Promise<void>;
  getCommonArea: (id: string) => Promise<void>;
  createCommonArea: (commonArea: CommonArea, images: File[]) => Promise<string>;
  updateCommonArea: (
    id: string,
    updates: Partial<CommonArea>,
    newImages?: File[]
  ) => Promise<void>;
  deleteCommonArea: (id: string) => Promise<void>;
  setMaintenanceStatus: (
    id: string,
    inMaintenance: boolean,
    notes?: string
  ) => Promise<void>;
  clearSelectedArea: () => void;
};

// Creación del store
export const useCommonAreasStore = create<CommonAreasState>()((set, get) => ({
  commonAreas: [],
  selectedArea: null,
  loading: false,
  error: null,

  // Obtener todas las áreas comunes
  fetchCommonAreas: async () => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      return;
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      const q = query(
        collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/commonAreas`
        ),
        orderBy("name", "asc")
      );

      const querySnapshot = await getDocs(q);
      const areas: CommonArea[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        areas.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
        } as CommonArea);
      });

      set({ commonAreas: areas, loading: false });
    } catch (error) {
      console.error("Error al obtener áreas comunes:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar áreas comunes",
      });
    }
  },

  // Obtener un área común específica
  getCommonArea: async (id: string) => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      return;
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      const docRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${id}`
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          selectedArea: {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
          } as CommonArea,
          loading: false,
        });
      } else {
        set({ loading: false, error: "Área común no encontrada" });
      }
    } catch (error) {
      console.error("Error al obtener área común:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar el área común",
      });
    }
  },

  // Crear una nueva área común
  createCommonArea: async (commonArea: CommonArea, images: File[]) => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const storage = getStorage();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      throw new Error("Usuario no autenticado");
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      // Subir imágenes al Storage
      const imageUrls: string[] = [];

      if (images && images.length > 0) {
        for (const image of images) {
          const imageId = uuidv4();
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${imageId}`
          );

          await uploadBytes(storageRef, image);
          const downloadURL = await getDownloadURL(storageRef);
          imageUrls.push(downloadURL);
        }
      }

      // Crear documento en Firestore
      const newArea = {
        ...commonArea,
        images: imageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/commonAreas`
        ),
        newArea
      );

      // Actualizar el documento con su propio ID
      await updateDoc(docRef, { uid: docRef.id });

      // Actualizar el estado local
      set((state) => ({
        commonAreas: [
          ...state.commonAreas,
          {
            ...newArea,
            id: docRef.id,
            uid: docRef.id,
          } as unknown as CommonArea,
        ],
        loading: false,
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error al crear área común:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear el área común",
      });
      throw error;
    }
  },

  // Actualizar un área común
  updateCommonArea: async (
    id: string,
    updates: Partial<CommonArea>,
    newImages?: File[]
  ) => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const storage = getStorage();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      throw new Error("Usuario no autenticado");
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      // Subir nuevas imágenes si existen
      let updatedImageUrls = [...(updates.images || [])];

      if (newImages && newImages.length > 0) {
        for (const image of newImages) {
          const imageId = uuidv4();
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${imageId}`
          );

          await uploadBytes(storageRef, image);
          const downloadURL = await getDownloadURL(storageRef);
          updatedImageUrls.push(downloadURL);
        }
      }

      // Actualizar documento en Firestore
      const docRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${id}`
      );

      const updateData = {
        ...updates,
        images: updatedImageUrls,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // Actualizar el estado local
      set((state) => {
        const updatedCommonAreas = state.commonAreas.map((area) =>
          area.id === id
            ? { ...area, ...updates, images: updatedImageUrls }
            : area
        );

        let updatedSelectedArea = state.selectedArea;
        if (state.selectedArea && state.selectedArea.id === id) {
          updatedSelectedArea = {
            ...state.selectedArea,
            ...updates,
            images: updatedImageUrls,
          };
        }

        return {
          commonAreas: updatedCommonAreas,
          selectedArea: updatedSelectedArea,
          loading: false,
        };
      });
    } catch (error) {
      console.error("Error al actualizar área común:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el área común",
      });
      throw error;
    }
  },

  // Eliminar un área común
  deleteCommonArea: async (id: string) => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const storage = getStorage();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      throw new Error("Usuario no autenticado");
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      // Obtener el área para eliminar sus imágenes
      const areaToDelete = get().commonAreas.find((area) => area.id === id);

      if (
        areaToDelete &&
        areaToDelete.images &&
        areaToDelete.images.length > 0
      ) {
        // Eliminar imágenes del Storage
        for (const imageUrl of areaToDelete.images) {
          if (imageUrl.includes("firebasestorage")) {
            const imageRef = ref(storage, imageUrl);
            try {
              await deleteObject(imageRef);
            } catch (error) {
              console.warn("No se pudo eliminar la imagen:", error);
            }
          }
        }
      }

      // Eliminar documento de Firestore
      const docRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${id}`
      );
      await deleteDoc(docRef);

      // Actualizar el estado local
      set((state) => ({
        commonAreas: state.commonAreas.filter((area) => area.id !== id),
        selectedArea: state.selectedArea?.id === id ? null : state.selectedArea,
        loading: false,
      }));
    } catch (error) {
      console.error("Error al eliminar área común:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar el área común",
      });
      throw error;
    }
  },

  // Cambiar el estado de mantenimiento de un área común
  setMaintenanceStatus: async (
    id: string,
    inMaintenance: boolean,
    notes?: string
  ) => {
    set({ loading: true, error: null });
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      set({ loading: false, error: "Usuario no autenticado" });
      throw new Error("Usuario no autenticado");
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      const docRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/commonAreas/${id}`
      );

      const updateData: any = {
        status: inMaintenance ? "maintenance" : "active",
        updatedAt: serverTimestamp(),
      };

      if (inMaintenance) {
        updateData.maintenanceNotes = notes || "";
      } else {
        updateData.lastMaintenanceDate = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      // Actualizar el estado local
      set((state) => {
        const updatedCommonAreas = state.commonAreas.map((area) =>
          area.id === id
            ? ({
                ...area,
                status: inMaintenance ? "maintenance" : "active",
                maintenanceNotes: inMaintenance
                  ? notes || ""
                  : area.maintenanceNotes,
                lastMaintenanceDate: !inMaintenance
                  ? new Date()
                  : area.lastMaintenanceDate,
              } as unknown as CommonArea)
            : area
        );

        let updatedSelectedArea = state.selectedArea;
        if (state.selectedArea && state.selectedArea.id === id) {
          updatedSelectedArea = {
            ...state.selectedArea,
            status: inMaintenance ? "maintenance" : "active",
            maintenanceNotes: inMaintenance
              ? notes || ""
              : state.selectedArea.maintenanceNotes,
            lastMaintenanceDate: !inMaintenance
              ? new Date()
              : state.selectedArea.lastMaintenanceDate,
          };
        }

        return {
          commonAreas: updatedCommonAreas,
          selectedArea: updatedSelectedArea,
          loading: false,
        };
      });
    } catch (error) {
      console.error("Error al cambiar estado de mantenimiento:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado de mantenimiento",
      });
      throw error;
    }
  },

  // Limpiar el área seleccionada
  clearSelectedArea: () => {
    set({ selectedArea: null });
  },
}));
