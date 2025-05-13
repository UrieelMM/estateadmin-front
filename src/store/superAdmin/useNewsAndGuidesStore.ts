import { create } from "../createStore";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// Interfaces
export interface NewsGuide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  url: string;
  active: boolean;
  createdAt: string;
}

interface NewsGuideInput {
  title: string;
  subtitle: string;
  url: string;
  active: boolean;
  imageFile: File | null;
}

interface NewsGuideUpdate {
  title?: string;
  subtitle?: string;
  url?: string;
  active?: boolean;
  imageFile?: File | null;
}

interface NewsAndGuidesState {
  newsAndGuides: NewsGuide[];
  loading: boolean;
  error: string | null;
  fetchNewsAndGuides: () => Promise<void>;
  createNewsGuide: (input: NewsGuideInput) => Promise<string>;
  updateNewsGuide: (id: string, updates: NewsGuideUpdate) => Promise<void>;
  deleteNewsGuide: (id: string) => Promise<void>;
}

// Store
const useNewsAndGuidesStore = create<NewsAndGuidesState>()((set, get) => ({
  newsAndGuides: [],
  loading: false,
  error: null,

  // Obtener todas las noticias y guías
  fetchNewsAndGuides: async () => {
    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const newsCollection = collection(db, "linksNewsAndGuides");

      // Ordenar por fecha de creación descendente (más recientes primero)
      const q = query(newsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const newsItems: NewsGuide[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newsItems.push({
          id: doc.id,
          title: data.title || "",
          subtitle: data.subtitle || "",
          imageUrl: data.imageUrl || "",
          url: data.url || "/dashboard",
          active: data.active === undefined ? true : data.active,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });

      set({ newsAndGuides: newsItems, loading: false });
    } catch (error: any) {
      console.error("Error al obtener noticias y guías:", error);
      set({
        error: error.message || "Error al cargar noticias y guías",
        loading: false,
      });
    }
  },

  // Crear una nueva noticia o guía
  createNewsGuide: async (input: NewsGuideInput) => {
    set({ loading: true, error: null });
    try {
      if (!input.title.trim()) {
        throw new Error("El título es obligatorio");
      }

      if (!input.imageFile) {
        throw new Error("La imagen es obligatoria");
      }

      const db = getFirestore();
      const storage = getStorage();

      // Subir imagen a Storage
      const imageName = `${Date.now()}_${input.imageFile.name}`;
      const imageRef = storageRef(
        storage,
        `administration/assets/linksNewsAndGuides/${imageName}`
      );

      // Subir archivo y obtener URL pública
      await uploadBytes(imageRef, input.imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      // Crear documento en Firestore
      const newsCollection = collection(db, "linksNewsAndGuides");
      const newsData = {
        title: input.title,
        subtitle: input.subtitle || "",
        url: input.url || "/dashboard",
        active: input.active === undefined ? true : input.active,
        imageUrl,
        imagePath: `administration/assets/linksNewsAndGuides/${imageName}`,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(newsCollection, newsData);

      // Actualizar estado local
      await get().fetchNewsAndGuides();

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      console.error("Error al crear noticia/guía:", error);
      set({
        error: error.message || "Error al crear la noticia o guía",
        loading: false,
      });
      throw error;
    }
  },

  // Actualizar una noticia o guía existente
  updateNewsGuide: async (id: string, updates: NewsGuideUpdate) => {
    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const storage = getStorage();
      const newsRef = doc(db, "linksNewsAndGuides", id);

      // Obtener documento actual para referencia
      const newsDoc = await getDoc(newsRef);
      if (!newsDoc.exists()) {
        throw new Error("La noticia o guía no existe");
      }

      const currentData = newsDoc.data();
      const updateData: Record<string, any> = {};

      // Actualizar título si se proporciona
      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }

      // Actualizar subtítulo si se proporciona
      if (updates.subtitle !== undefined) {
        updateData.subtitle = updates.subtitle;
      }

      // Actualizar URL si se proporciona
      if (updates.url !== undefined) {
        updateData.url = updates.url;
      }

      // Actualizar estado activo si se proporciona
      if (updates.active !== undefined) {
        updateData.active = updates.active;
      }

      // Si hay una nueva imagen, subirla y actualizar URL
      if (updates.imageFile) {
        // Eliminar imagen anterior si existe
        if (currentData.imagePath) {
          const oldImageRef = storageRef(storage, currentData.imagePath);
          try {
            await deleteObject(oldImageRef);
          } catch (error) {
            console.warn("No se pudo eliminar la imagen anterior:", error);
          }
        }

        // Subir nueva imagen
        const imageName = `${Date.now()}_${updates.imageFile.name}`;
        const imageRef = storageRef(
          storage,
          `administration/assets/linksNewsAndGuides/${imageName}`
        );

        await uploadBytes(imageRef, updates.imageFile);
        const imageUrl = await getDownloadURL(imageRef);

        updateData.imageUrl = imageUrl;
        updateData.imagePath = `administration/assets/linksNewsAndGuides/${imageName}`;
      }

      // Añadir timestamp de actualización
      updateData.updatedAt = serverTimestamp();

      // Actualizar documento en Firestore
      await updateDoc(newsRef, updateData);

      // Actualizar estado local
      await get().fetchNewsAndGuides();

      set({ loading: false });
    } catch (error: any) {
      console.error("Error al actualizar noticia/guía:", error);
      set({
        error: error.message || "Error al actualizar la noticia o guía",
        loading: false,
      });
      throw error;
    }
  },

  // Eliminar una noticia o guía
  deleteNewsGuide: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const storage = getStorage();
      const newsRef = doc(db, "linksNewsAndGuides", id);

      // Obtener documento para recuperar ruta de la imagen
      const newsDoc = await getDoc(newsRef);
      if (!newsDoc.exists()) {
        throw new Error("La noticia o guía no existe");
      }

      const data = newsDoc.data();

      // Eliminar imagen de Storage si existe
      if (data.imagePath) {
        const imageRef = storageRef(storage, data.imagePath);
        try {
          await deleteObject(imageRef);
        } catch (error) {
          console.warn("No se pudo eliminar la imagen:", error);
        }
      }

      // Eliminar documento de Firestore
      await deleteDoc(newsRef);

      // Actualizar estado local
      set((state) => ({
        newsAndGuides: state.newsAndGuides.filter((item) => item.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error("Error al eliminar noticia/guía:", error);
      set({
        error: error.message || "Error al eliminar la noticia o guía",
        loading: false,
      });
      throw error;
    }
  },
}));

export default useNewsAndGuidesStore;
