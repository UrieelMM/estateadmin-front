// useNewsAndGuidesStore.ts
import { create } from "./createStore";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import * as Sentry from "@sentry/react";

// Interfaz para los documentos en la colección linksNewsAndGuides
export interface NewsGuideItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  slug?: string; // URL slug para deep linking
  url: string;
  active: boolean;
  author?: string;
  content?: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  createdAt: any; // Timestamp de Firestore
}

interface NewsAndGuidesStore {
  items: NewsGuideItem[];
  currentGuide: NewsGuideItem | null;
  relatedGuides: NewsGuideItem[];
  loading: boolean;
  error: string | null;
  fetchNewsAndGuides: () => Promise<void>;
  getGuideBySlug: (slug: string) => Promise<NewsGuideItem | null>;
  getRelatedGuides: (
    currentGuideId: string,
    categoryId?: string
  ) => Promise<void>;
}

export const useNewsAndGuidesStore = create<NewsAndGuidesStore>()(
  (set, get) => ({
    items: [],
    currentGuide: null,
    relatedGuides: [],
    loading: false,
    error: null,

    fetchNewsAndGuides: async () => {
      try {
        set({ loading: true, error: null });
        const db = getFirestore();

        // Referencia a la colección linksNewsAndGuides en la raíz de Firestore
        const newsRef = collection(db, "linksNewsAndGuides");

        // Consulta ordenada por fecha de creación descendente (más recientes primero)
        // y filtrando solo por elementos activos
        const q = query(
          newsRef,
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          set({ items: [], loading: false });
          return;
        }

        // Mapear los documentos al formato requerido
        const newsItems: NewsGuideItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Generar un slug a partir del título si no existe
          const slug =
            data.slug ||
            data.title
              ?.toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]+/g, "") ||
            doc.id;

          return {
            id: doc.id, // Usamos el ID del documento de Firestore
            imageUrl: data.imageUrl || "",
            title: data.title || "",
            subtitle: data.subtitle || "",
            slug: slug,
            url: data.url || `/guias/${slug}`, // Actualizar a /guias/ en lugar de /guides/
            active: data.active === undefined ? true : data.active,
            author: data.author || "Administración de Condominios",
            content: data.content || "",
            excerpt: data.excerpt || data.subtitle || "",
            categories: data.categories || [],
            tags: data.tags || [],
            createdAt: data.createdAt,
          };
        });

        set({ items: newsItems, loading: false });
      } catch (error) {
        console.error("Error al obtener noticias y guías:", error);
        Sentry.captureException(error);
        set({
          error:
            "No se pudieron cargar las noticias y guías. Por favor, inténtelo de nuevo más tarde.",
          loading: false,
        });
      }
    },

    // Función para obtener una guía específica por su slug
    getGuideBySlug: async (slug: string) => {
      try {
        set({ loading: true, error: null });

        // Primero intentamos encontrarla en los items ya cargados
        const { items } = get();

        // Buscar coincidencia por slug o si la URL contiene el slug
        let guide = items.find(
          (item) =>
            item.slug === slug ||
            item.url?.includes(slug) ||
            (slug.includes(item.slug || "") && item.slug)
        );

        if (guide) {
          set({ currentGuide: guide, loading: false });
          return guide;
        }

        // Si no está en memoria, consultamos Firestore
        const db = getFirestore();
        const newsRef = collection(db, "linksNewsAndGuides");

        // Intentar primero con campo slug exacto
        let q = query(
          newsRef,
          where("slug", "==", slug),
          where("active", "==", true)
        );
        let snapshot = await getDocs(q);

        // Si no encontramos, buscar en URL que contenga el slug
        if (snapshot.empty) {
          // Buscar por URL que contenga el slug
          const allActive = query(newsRef, where("active", "==", true));
          const allDocs = await getDocs(allActive);

          // Buscar manualmente el documento que tenga una URL que contenga el slug
          const matchingDoc = allDocs.docs.find((doc) => {
            const data = doc.data();
            return data.url && data.url.includes(`/guias/${slug}`);
          });

          if (matchingDoc) {
            const data = matchingDoc.data();
            guide = {
              id: matchingDoc.id,
              imageUrl: data.imageUrl || "",
              title: data.title || "",
              subtitle: data.subtitle || "",
              slug: data.slug || slug,
              url: data.url || `/guias/${slug}`,
              active: data.active,
              author: data.author || "Administración de Condominios",
              content: data.content || "",
              excerpt: data.excerpt || data.subtitle || "",
              categories: data.categories || [],
              tags: data.tags || [],
              createdAt: data.createdAt,
            };

            set({ currentGuide: guide, loading: false });
            return guide;
          }

          // No encontramos, intentamos buscar por ID
          try {
            const docRef = doc(db, "linksNewsAndGuides", slug);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().active) {
              const data = docSnap.data();
              const guideSlug =
                data.slug ||
                data.title
                  ?.toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^\w-]+/g, "") ||
                docSnap.id;

              guide = {
                id: docSnap.id,
                imageUrl: data.imageUrl || "",
                title: data.title || "",
                subtitle: data.subtitle || "",
                slug: guideSlug,
                url: data.url || `/guias/${guideSlug}`,
                active: data.active,
                author: data.author || "Administración de Condominios",
                content: data.content || "",
                excerpt: data.excerpt || data.subtitle || "",
                categories: data.categories || [],
                tags: data.tags || [],
                createdAt: data.createdAt,
              };

              set({ currentGuide: guide, loading: false });
              return guide;
            }
          } catch (error) {
            console.error("Error al obtener guía por ID:", error);
          }

          // Si llegamos aquí, no encontramos la guía
          set({
            currentGuide: null,
            loading: false,
            error: "Guía no encontrada",
          });
          return null;
        }

        // Mapear el primer documento encontrado
        const data = snapshot.docs[0].data();
        const guideSlug =
          data.slug ||
          data.title
            ?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "") ||
          snapshot.docs[0].id;

        guide = {
          id: snapshot.docs[0].id,
          imageUrl: data.imageUrl || "",
          title: data.title || "",
          subtitle: data.subtitle || "",
          slug: guideSlug,
          url: data.url || `/guias/${guideSlug}`,
          active: data.active,
          author: data.author || "Administración de Condominios",
          content: data.content || "",
          excerpt: data.excerpt || data.subtitle || "",
          categories: data.categories || [],
          tags: data.tags || [],
          createdAt: data.createdAt,
        };

        set({ currentGuide: guide, loading: false });
        return guide;
      } catch (error) {
        console.error("Error al obtener guía por slug:", error);
        Sentry.captureException(error);
        set({
          error:
            "No se pudo cargar la guía. Por favor, inténtelo de nuevo más tarde.",
          loading: false,
          currentGuide: null,
        });
        return null;
      }
    },

    // Función para obtener guías relacionadas
    getRelatedGuides: async (currentGuideId: string, categoryId?: string) => {
      try {
        const { items } = get();

        // Filtrar guías relacionadas: misma categoría o más recientes, excluyendo la actual
        let related: NewsGuideItem[];

        if (
          categoryId &&
          items.some((item) => item.categories?.includes(categoryId))
        ) {
          // Si hay categoría, priorizar guías de la misma categoría
          related = items
            .filter(
              (item) =>
                item.id !== currentGuideId &&
                item.categories?.includes(categoryId)
            )
            .slice(0, 3);
        } else {
          // Si no hay categoría o no hay suficientes de la misma categoría, mostrar las más recientes
          related = items
            .filter((item) => item.id !== currentGuideId)
            .slice(0, 3);
        }

        set({ relatedGuides: related });
      } catch (error) {
        console.error("Error al obtener guías relacionadas:", error);
        Sentry.captureException(error);
      }
    },
  })
);
