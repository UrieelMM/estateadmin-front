import React, { useState, useRef, useEffect } from "react";
import usePlacesStore, {
  PlaceDetails,
} from "../../../../store/useSearchProviders";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";

// Definición de tipos para Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options?: any) => any;
        LatLng: new (lat: number, lng: number) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        places: {
          PlacesService: new (map: any) => GooglePlacesService;
          PlacesServiceStatus: {
            OK: string;
          };
        };
      };
    };
  }
}

interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesService {
  nearbySearch(
    request: {
      location: any;
      radius: number;
      keyword: string;
    },
    callback: (results: GooglePlaceResult[] | null, status: string) => void
  ): void;
}

const SearchProviders: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [distanceKm, setDistanceKm] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const { places, loading, error, searchPlaces, getPlaceDetails } =
    usePlacesStore();

  useEffect(() => {
    // Cargar coordenadas guardadas
    const savedCoords = localStorage.getItem("userCoordinates");
    if (savedCoords) {
      setUserCoordinates(JSON.parse(savedCoords));
      initMap(JSON.parse(savedCoords));
    }
  }, []);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (userCoordinates) {
          initMap(userCoordinates);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const initMap = (coords: { lat: number; lng: number }) => {
    if (mapRef.current && window.google) {
      const initialMap = new window.google.maps.Map(mapRef.current, {
        center: coords,
        zoom: 12,
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#000000" }],
          },
        ],
      });
      setMap(initialMap);
    }
  };

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoordinates(coords);
          localStorage.setItem("userCoordinates", JSON.stringify(coords));
          if (map) {
            map.setCenter(coords);
          } else {
            initMap(coords);
          }
        },
        (err) => {
          console.error("Error obteniendo la ubicación:", err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCoordinates) {
      alert("Por favor, obtén tu ubicación primero.");
      return;
    }
    if (!keyword.trim()) {
      alert("Ingresa una palabra clave.");
      return;
    }

    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);

    await searchPlaces(
      keyword,
      userCoordinates.lat,
      userCoordinates.lng,
      distanceKm * 1000
    );
  };

  useEffect(() => {
    if (map && places.length > 0) {
      const newMarkers = places
        .map((place) => {
          if (!place.geometry?.location) return null;

          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
            <div class="p-2">
              <h3 class="font-semibold">${place.name}</h3>
              <p class="text-sm">${place.vicinity}</p>
              ${
                place.rating
                  ? `
                <div class="flex items-center mt-1">
                  <span class="text-yellow-400">★</span>
                  <span class="ml-1">${place.rating}</span>
                  ${
                    place.user_ratings_total
                      ? `<span class="ml-1 text-gray-500">(${place.user_ratings_total})</span>`
                      : ""
                  }
                </div>
              `
                  : ""
              }
            </div>
          `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          return marker;
        })
        .filter((marker): marker is any => marker !== null);

      setMarkers(newMarkers);
    }
  }, [places, map]);

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setLoadingDetails(true);
      setDetailsError(null);
      const details = await getPlaceDetails(placeId);
      setSelectedPlace(details);
      setShowDetails(true);
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : "Error desconocido"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePlaceClick = (placeId: string) => {
    fetchPlaceDetails(placeId);
  };

  const nextPhoto = () => {
    if (selectedPlace?.photos) {
      setCurrentPhotoIndex((prev) =>
        prev === selectedPlace.photos!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (selectedPlace?.photos) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? selectedPlace.photos!.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="w-full p-6">
      {/* Layout principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna izquierda: Formulario y cards */}
        <div className="space-y-4">
          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="mb-4">
              <button
                onClick={obtenerUbicacion}
                className="btn-primary h-10 mb-3 w-full"
              >
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Obtener mi ubicación
              </button>
            </div>
            <form onSubmit={handleSearch} className="flex flex-row gap-4">
              <div className="w-2/4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Palabra clave (ej. herrero, electricista)"
                    className="w-full pl-10 pr-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  />
                </div>
              </div>
              <div className="w-1/4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <select
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full pl-10 pr-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                  >
                    {[1, 5, 10, 15, 20].map((km) => (
                      <option key={km} value={km}>
                        {km} km
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-1/4">
                <button
                  type="submit"
                  className="flex items-center w-full align-middle justify-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <svg
                    className="w-5 h-5 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Buscar
                </button>
              </div>
            </form>
          </div>

          {loading && (
            <div className="text-center py-4">
              <LoadingApp />
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md dark:bg-red-900/50 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!loading &&
              places.length > 0 &&
              places.slice(0, showAll ? places.length : 8).map((place) => (
                <div
                  key={place.place_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => handlePlaceClick(place.place_id)}
                >
                  <div className="relative h-32 mb-2 rounded-lg overflow-hidden">
                    {place.photos && place.photos.length > 0 ? (
                      <img
                        src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${
                          place.photos[0].photo_reference
                        }&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.parentElement?.classList.add(
                            "bg-gray-200",
                            "dark:bg-gray-700"
                          );
                          target.parentElement?.classList.add(
                            "flex",
                            "items-center",
                            "justify-center"
                          );
                          const span = document.createElement("span");
                          span.className =
                            "text-2xl font-semibold text-gray-500 dark:text-gray-400";
                          span.textContent = place.name.charAt(0).toUpperCase();
                          target.parentElement?.appendChild(span);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
                          {place.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {place.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {place.vicinity}
                  </p>
                  {place.rating && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">
                        {place.rating}
                      </span>
                      {place.user_ratings_total && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({place.user_ratings_total})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {!loading && places.length > 8 && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-2 border-b border-indigo-500 text-indigo-500 bg-transparent hover:border-indigo-700 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-500"
              >
                {showAll ? "Mostrar menos" : "Mostrar más"}
              </button>
            </div>
          )}
        </div>

        {/* Columna derecha: Mapa */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="h-full rounded-lg overflow-hidden shadow-lg">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedPlace(null);
                  setCurrentPhotoIndex(0);
                }}
                className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {loadingDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : detailsError ? (
                <div className="p-4 text-red-600 dark:text-red-400">
                  {detailsError}
                </div>
              ) : selectedPlace ? (
                <div className="p-6">
                  {/* Carrusel de imágenes */}
                  <div className="relative h-64 mb-6 rounded-lg overflow-hidden">
                    {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
                      <>
                        <img
                          src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${
                            selectedPlace.photos[currentPhotoIndex]
                              .photo_reference
                          }&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                          alt={selectedPlace.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedPlace.photos.length > 1 && (
                          <>
                            <button
                              onClick={prevPhoto}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={nextPhoto}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                              {currentPhotoIndex + 1} /{" "}
                              {selectedPlace.photos.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-4xl font-semibold text-gray-500 dark:text-gray-400">
                          {selectedPlace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del lugar */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedPlace.name}
                        </h2>
                        {selectedPlace.types && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedPlace.types.map((type, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                              >
                                {type.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedPlace.icon && (
                        <img
                          src={selectedPlace.icon}
                          alt=""
                          className="w-8 h-8"
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      {selectedPlace.formatted_phone_number && (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {selectedPlace.formatted_phone_number}
                        </div>
                      )}
                      {selectedPlace.website && (
                        <a
                          href={selectedPlace.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Sitio web
                        </a>
                      )}
                      {selectedPlace.url && (
                        <a
                          href={selectedPlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          Ver en Google Maps
                        </a>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedPlace.formatted_address}
                    </div>

                    {selectedPlace.price_level && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <span className="mr-2">Nivel de precios:</span>
                        <span className="text-yellow-500">
                          {"$".repeat(selectedPlace.price_level)}
                        </span>
                      </div>
                    )}

                    {selectedPlace.business_status && (
                      <div className="flex items-center text-sm">
                        <span className="mr-2">Estado:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            selectedPlace.business_status === "OPERATIONAL"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : selectedPlace.business_status ===
                                "CLOSED_TEMPORARILY"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedPlace.business_status === "OPERATIONAL"
                            ? "Abierto"
                            : selectedPlace.business_status ===
                              "CLOSED_TEMPORARILY"
                            ? "Cerrado temporalmente"
                            : "Cerrado permanentemente"}
                        </span>
                      </div>
                    )}

                    {selectedPlace.opening_hours && (
                      <div className="text-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Horario de apertura
                        </h3>
                        <div className="space-y-1">
                          {selectedPlace.opening_hours.weekday_text.map(
                            (day, index) => (
                              <div
                                key={index}
                                className="text-gray-600 dark:text-gray-300"
                              >
                                {day}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPlace.reviews &&
                      selectedPlace.reviews.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              Reseñas
                            </h3>
                            {selectedPlace.rating && (
                              <div className="flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="ml-1 text-gray-700 dark:text-gray-300">
                                  {selectedPlace.rating}
                                </span>
                                {selectedPlace.user_ratings_total && (
                                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                                    ({selectedPlace.user_ratings_total})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {selectedPlace.reviews.map((review, index) => (
                              <div
                                key={index}
                                className="border-b border-gray-200 dark:border-gray-700 pb-4"
                              >
                                <div className="flex items-center mb-2">
                                  {review.profile_photo_url && (
                                    <img
                                      src={review.profile_photo_url}
                                      alt={review.author_name}
                                      className="w-8 h-8 rounded-full mr-2"
                                    />
                                  )}
                                  <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {review.author_name}
                                    </span>
                                    <div className="flex items-center">
                                      <span className="text-yellow-400">★</span>
                                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                                        {review.rating}
                                      </span>
                                      {review.relative_time_description && (
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                          {review.relative_time_description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {review.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchProviders;
