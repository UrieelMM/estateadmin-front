import create from "zustand";

export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
  rating?: number;
  user_ratings_total?: number;
  // La respuesta Nearby Search de Google Places no incluye teléfono, correo o sitio web.
  // Para esos datos se requiere una consulta adicional con Place Details.
}

export interface PlaceDetails extends Place {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  adr_address: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  icon?: string;
  name: string;
  opening_hours?: {
    isOpen: () => boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
  place_id: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
    relative_time_description?: string;
  }>;
  price_level?: number;
  business_status?: string;
  types: string[];
  url?: string;
  user_ratings_total?: number;
  html_attributions: string[];
}

interface PlacesStore {
  places: Place[];
  loading: boolean;
  error: string | null;
  /**
   * Realiza una búsqueda en Google Places API usando:
   * - keyword: Palabra clave para buscar (ej. "fontanero", "electricista")
   * - latitude: Latitud del punto de inicio
   * - longitude: Longitud del punto de inicio
   * - radius: Radio de búsqueda en metros (máximo 5000)
   */
  searchPlaces: (
    keyword: string,
    latitude: number,
    longitude: number,
    radius: number
  ) => Promise<void>;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails>;
}

const usePlacesStore = create<PlacesStore>((set, _get) => ({
  places: [],
  loading: false,
  error: null,
  searchPlaces: async (
    keyword: string,
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    set({ loading: true, error: null });
    try {
      if (keyword.trim() === "") {
        throw new Error("La palabra clave es requerida.");
      }
      // Aseguramos que la distancia no supere 5000 metros.
      if (radius > 5000) radius = 5000;

      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/tools/places`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword: keyword.trim(),
            latitude,
            longitude,
            radius,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error en la consulta a Places API");
      }

      const data = await response.json();
      if (data.status !== "OK") {
        throw new Error(
          data.error_message || "Error en la consulta: " + data.status
        );
      }
      // data.results es el arreglo de lugares encontrados.
      set({ places: data.results, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Error en la búsqueda", loading: false });
    }
  },
  getPlaceDetails: async (placeId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_URL_SERVER
        }/tools/places/${placeId}?fields=place_id,name,vicinity,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,reviews,opening_hours,photos,address_components,adr_address,geometry,icon,plus_code,price_level,business_status,types,url,html_attributions`
      );

      if (!response.ok) {
        throw new Error("Error al cargar los detalles del lugar");
      }

      const data = await response.json();
      if (data.status !== "OK") {
        throw new Error(
          data.error_message || "Error en la consulta: " + data.status
        );
      }

      return data.result;
    } catch (error: any) {
      throw new Error(error.message || "Error al cargar los detalles");
    }
  },
}));

export default usePlacesStore;
