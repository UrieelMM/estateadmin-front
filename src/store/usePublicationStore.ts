// publicationsStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  query,
  collection,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";

type Publication = {
  title: string;
  author: string;
  tags: string;
  content: string;
  file: File | null;
  sendTo: string;
  condominiumName: string;
  condominiumId: string;
  createdAt?: Date;
};

type PublicationsState = {
  publications: Publication[];
  loadedCount: number;
  hasMore: boolean;
  lastVisible: unknown;
  addPublication: (publication: Publication) => Promise<void>;
  loadPublications: (loadMore?: boolean) => Promise<void>;
};

export const usePublicationStore = create<PublicationsState>()((set, get) => ({
  publications: [],
  loadedCount: 0,
  hasMore: true,
  lastVisible: null,

  addPublication: async (publication) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("title", publication.title);
    formData.append("author", publication.author);
    formData.append("tags", publication.tags);
    formData.append("content", publication.content);
    formData.append("condominiumName", publication.condominiumName);
    formData.append("condominiumId", condominiumId as string);
    formData.append("sendTo", publication.sendTo);
    formData.append("attachments", publication.file as Blob);

    try {
      await axios.post("http://localhost:3000/publications/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      throw new Error("Error al enviar la publicación");
    }
  },

  loadPublications: async (loadMore = false) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set((state: any) => ({ ...state, loading: true }));
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("Usuario no autenticado");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set((state: any) => ({ ...state, loading: false }));
      return;
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");

    let publicationsQuery = query(
      collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/publications`
      ),
      orderBy("createdAt", "desc"),
      limit(4)
    );

    if (loadMore && get().lastVisible) {
      publicationsQuery = query(
        publicationsQuery,
        startAfter(get().lastVisible)
      );
    }

    try {
      const documentSnapshots = await getDocs(publicationsQuery);
      const newPublications = documentSnapshots.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        return {
          ...data,
          createdAt,
          id: doc.id,
        } as unknown as Publication;
      });
      const newLastVisible =
        documentSnapshots.docs[documentSnapshots.docs.length - 1];

      set((state: PublicationsState) => ({
        publications: loadMore
          ? [...state.publications, ...newPublications]
          : newPublications,
        loadedCount: state.loadedCount + newPublications.length,
        hasMore: documentSnapshots.docs.length === 4,
        lastVisible: newLastVisible,
        loading: false,
      }));
    } catch (error) {
      console.error("Error al cargar las publicaciones desde Firestore", error);
      set((state: PublicationsState) => ({ ...state, loading: false }));
    }
  },
}));
