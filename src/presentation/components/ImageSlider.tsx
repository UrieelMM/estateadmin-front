import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// Importar estilos de Swiper
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";

// Estilos personalizados para el slider
import "./ImageSlider.css";

// Datos de muestra para las imágenes del slider (noticias y novedades)
const sliderData = [
  {
    id: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=385&h=385&auto=format&fit=crop",
    title: "Nueva área de picnic",
    description: "Inauguración del área de picnic renovada",
    url: "/dashboard/amenities",
  },
  {
    id: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1536337005238-94b997371b40?q=80&w=385&h=385&auto=format&fit=crop",
    title: "Evento comunitario",
    description: "Próxima reunión de vecinos este fin de semana",
    url: "/dashboard/calendar",
  },
  {
    id: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1562007908-17c67e878c88?q=80&w=385&h=385&auto=format&fit=crop",
    title: "Mantenimiento piscina",
    description: "La piscina estará cerrada el próximo lunes",
    url: "/dashboard/maintenance",
  },
  {
    id: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1605146768851-eda79da39897?q=80&w=385&h=385&auto=format&fit=crop",
    title: "Nuevos servicios",
    description: "Hemos añadido seguridad 24/7 al condominio",
    url: "/dashboard/services",
  },
];

const ImageSlider: React.FC = () => {
  console.log("Rendering ImageSlider with data:", sliderData);

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
        {sliderData.map((slide) => (
          <SwiperSlide
            key={slide.id}
            className="card-square rounded-md overflow-hidden shadow-lg"
          >
            <Link to={slide.url} className="block w-full h-full relative">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-white text-xl font-semibold mb-1">
                  {slide.title}
                </h3>
                <p className="text-white/90 text-sm">{slide.description}</p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
