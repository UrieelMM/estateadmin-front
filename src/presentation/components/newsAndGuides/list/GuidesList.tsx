import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNewsAndGuidesStore } from "../../../../store/useNewsAndGuidesStore";
import moment from "moment";
import "moment/locale/es";
import { Helmet } from "react-helmet-async";
import CategoryFilter from "./CategoryFilter";
import GuideCard from "./GuideCard";
import SearchBar from "./SearchBar";
import LoadingApp from "../../shared/loaders/LoadingApp";

// Componente principal de la lista de guías
const GuidesList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { items, loading, error, fetchNewsAndGuides } = useNewsAndGuidesStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtros
  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");

  useEffect(() => {
    fetchNewsAndGuides();
    // Inicializar moment en español
    moment.locale("es");
  }, [fetchNewsAndGuides]);

  // Extraer todas las categorías únicas
  const allCategories = React.useMemo(() => {
    const categories = new Set<string>();
    items.forEach((item) => {
      item.categories?.forEach((category) => {
        categories.add(category);
      });
    });
    return Array.from(categories);
  }, [items]);

  // Filtrar ítems según los parámetros de búsqueda
  const filteredItems = items.filter((item) => {
    // Solo mostrar items activos
    if (!item.active) return false;

    // Filtrar por categoría si está especificada
    if (
      categoryFilter &&
      (!item.categories || !item.categories.includes(categoryFilter))
    ) {
      return false;
    }

    // Filtrar por etiqueta si está especificada
    if (tagFilter && (!item.tags || !item.tags.includes(tagFilter))) {
      return false;
    }

    return true;
  });

  // Preparar título y descripción para SEO
  const pageTitle = categoryFilter
    ? `Guías sobre ${categoryFilter} | Guías y Tutoriales`
    : tagFilter
    ? `Guías con etiqueta #${tagFilter} | Guías y Tutoriales`
    : "Guías y Tutoriales | Recursos y ayuda";

  const pageDescription = categoryFilter
    ? `Explora nuestras guías y tutoriales sobre ${categoryFilter}. Recursos prácticos para ayudarte a gestionar tus propiedades.`
    : tagFilter
    ? `Encuentra guías y tutoriales relacionados con #${tagFilter}. Contenido especializado para propietarios e inquilinos.`
    : "Encuentra guías y tutoriales prácticos para gestionar tus propiedades, resolver problemas comunes y maximizar tu inversión inmobiliaria.";

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingApp />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => fetchNewsAndGuides()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.href} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        {items.length > 0 && items[0].imageUrl && (
          <meta property="og:image" content={items[0].imageUrl} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {items.length > 0 && items[0].imageUrl && (
          <meta name="twitter:image" content={items[0].imageUrl} />
        )}

        {/* Schema.org structured data for CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            headline: pageTitle,
            description: pageDescription,
            url: window.location.href,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: filteredItems
                .slice(0, 10)
                .map((guide, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  url: `${window.location.origin}/guias/${guide.slug}`,
                  name: guide.title,
                })),
            },
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Guías y Tutoriales
          {categoryFilter && <span> sobre {categoryFilter}</span>}
          {tagFilter && <span> con etiqueta #{tagFilter}</span>}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar con filtros */}
          <div className="lg:col-span-1">
            <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} />

            <CategoryFilter
              categories={allCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Lista de guías */}
          <div className="lg:col-span-3">
            {/* Filtros aplicados */}
            {(categoryFilter || tagFilter) && (
              <div className="mb-6 flex flex-wrap gap-2 items-center">
                <span className="text-gray-500">Filtros aplicados:</span>

                {categoryFilter && (
                  <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                    <span>Categoría: {categoryFilter}</span>
                  </div>
                )}

                {tagFilter && (
                  <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center">
                    <span>Etiqueta: #{tagFilter}</span>
                  </div>
                )}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No se encontraron guías que coincidan con tu búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredItems.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GuidesList;
