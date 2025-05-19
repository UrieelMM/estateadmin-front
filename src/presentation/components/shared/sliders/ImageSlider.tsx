import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNewsAndGuidesStore } from "../../../../store/useNewsAndGuidesStore";

// Importar estilos de Swiper
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";

// Estilos personalizados para el slider
import "./ImageSlider.css";

const ImageSlider: React.FC = () => {
  // Usar el nuevo store
  const { items, loading, error, fetchNewsAndGuides } = useNewsAndGuidesStore();
  const navigate = useNavigate();

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    fetchNewsAndGuides();
  }, [fetchNewsAndGuides]);

  // Mostrar indicadores visuales mientras se cargan los datos o si hay un error
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 dark:text-indigo-400">
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>Error al cargar los datos.</p>
          <button
            onClick={() => fetchNewsAndGuides()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Filtrar solo los elementos activos (aunque esto ya se hace en el store)
  const activeItems = items.filter((item) => item.active);

  // Si no hay elementos activos, mostrar un mensaje informativo
  if (activeItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          No hay noticias o guías disponibles en este momento.
        </div>
      </div>
    );
  }

  // Convertir URL externa en ruta interna si es necesario
  const getInternalPath = (url: string) => {
    // Si la URL contiene guias/ pero es una URL completa, extraer la parte de la ruta
    if (
      url.includes("/guias/") &&
      (url.startsWith("http") || url.startsWith("/"))
    ) {
      const match = url.match(/\/guias\/([^/]+)/);
      if (match && match[1]) {
        return `/guias/${match[1]}`;
      }
    }
    return url;
  };

  // Manejar clics en enlaces internos
  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    const internalPath = getInternalPath(url);

    // Si se presiona Ctrl o es clic con botón derecho, permitir el comportamiento predeterminado
    // que abrirá en una nueva pestaña
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }

    // Para clics normales con botón izquierdo sin Ctrl/Cmd, navegar internamente
    e.preventDefault();
    navigate(internalPath);
  };

  return (
    <div className="w-full h-full relative image-slider-container flex items-center justify-center">
      {/* Flechas de navegación personalizadas */}
      <div className="swiper-button-prev-custom absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-md cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
        <ChevronLeftIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="swiper-button-next-custom absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-md cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
        <ChevronRightIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>

      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards, Navigation]}
        navigation={{
          prevEl: ".swiper-button-prev-custom",
          nextEl: ".swiper-button-next-custom",
        }}
        className="image-slider card-square-wrapper"
      >
        {activeItems.map((slide, index) => {
          // Determinar si es una URL externa o interna
          const isExternalUrl = slide.url?.startsWith("http");
          const internalPath = getInternalPath(slide.url || "");

          return (
            <SwiperSlide
              key={index}
              className="card-square rounded-md overflow-hidden shadow-lg"
            >
              {isExternalUrl ? (
                // Para URLs externas, siempre usar <a> con target="_blank"
                <a
                  href={slide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full relative"
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {slide.title}
                    </h3>
                    <p className="text-white/90 text-sm">{slide.subtitle}</p>
                  </div>
                </a>
              ) : (
                // Para URLs internas, usar <a> con onClick personalizado
                <a
                  href={internalPath}
                  onClick={(e) => handleLinkClick(slide.url || "", e)}
                  className="block w-full h-full relative"
                  title="Clic para ver la guía | Ctrl+Clic para abrir en nueva pestaña"
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {slide.title}
                    </h3>
                    <p className="text-white/90 text-sm">{slide.subtitle}</p>
                  </div>
                </a>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
