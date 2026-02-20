import React, { useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useNewsAndGuidesStore } from "../../../../store/useNewsAndGuidesStore";
import moment from "moment";
import "moment/locale/es";
import { Helmet } from "react-helmet-async";
import "./GuidePage.css";
import NotFoundPage from "../../../screens/NotFoundPage/NotFoundPage";
import Sidebar from "./Sidebar";
import {
  FINANCIAL_MANAGEMENT_CONTENT,
  COMMUNICATION_CONTENT,
  RESERVATION_SYSTEM_CONTENT,
  MAINTENANCE_GUIDE_CONTENT,
  INVENTORY_MANAGEMENT_CONTENT,
  INCOMES_AND_EXPENSES_CONTENT,
  PROJECTS_MANAGEMENT_CONTENT,
} from "../shared/sampleContents";
import LoadingApp from "../../shared/loaders/LoadingApp";

// Componente para la página detallada de una guía
const GuidePage: React.FC = () => {
  // Obtener el slug de la URL
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Obtener datos de la guía
  const {
    currentGuide,
    relatedGuides,
    loading,
    error,
    getGuideBySlug,
    getRelatedGuides,
  } = useNewsAndGuidesStore();

  useEffect(() => {
    if (slug) {
      // Cargar la guía específica
      const loadGuide = async () => {
        const guide = await getGuideBySlug(slug);
        if (guide) {
          // Cargar guías relacionadas
          await getRelatedGuides(guide.id, guide.categories?.[0]);
        }
      };

      loadGuide();
    }

    // Configurar moment en español
    moment.locale("es");
  }, [slug, getGuideBySlug, getRelatedGuides]);

  // Mostrar indicador de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <LoadingApp />
      </div>
    );
  }

  // Si hay error o no se encuentra la guía, mostrar NotFoundPage
  if (error || !currentGuide) {
    return <NotFoundPage />;
  }

  // Formatear la fecha
  const formattedDate = currentGuide.createdAt
    ? moment(currentGuide.createdAt.toDate()).format("LL")
    : "";

  // Seleccionar el contenido estático adecuado según el slug
  const getStaticContent = () => {
    // Comprobar por slug o parte de la URL
    const guideSlug = currentGuide.slug || "";
    const guideUrl = currentGuide.url || "";

    // Guía de Mantenimiento
    if (
      guideSlug === "modulo-de-mantenimiento" ||
      slug === "modulo-de-mantenimiento" ||
      guideUrl.includes("modulo-de-mantenimiento")
    ) {
      return MAINTENANCE_GUIDE_CONTENT;
    }

    // Guía de Gestión Financiera
    if (
      guideSlug === "gestion-financiera-condominio" ||
      slug === "gestion-financiera-condominio" ||
      guideUrl.includes("gestion-financiera-condominio")
    ) {
      return FINANCIAL_MANAGEMENT_CONTENT;
    }

    // Guía de Comunicación
    if (
      guideSlug === "comunicacion-efectiva-residentes" ||
      slug === "comunicacion-efectiva-residentes" ||
      guideUrl.includes("comunicacion-efectiva-residentes")
    ) {
      return COMMUNICATION_CONTENT;
    }

    // Guía de Reservas
    if (
      guideSlug === "reserva-areas-comunes" ||
      slug === "reserva-areas-comunes" ||
      guideUrl.includes("reserva-areas-comunes")
    ) {
      return RESERVATION_SYSTEM_CONTENT;
    }

    // Guía de Inventario (stub)
    if (
      guideSlug === "inventario" ||
      slug === "inventario" ||
      guideUrl.includes("/guias/inventario")
    ) {
      return INVENTORY_MANAGEMENT_CONTENT;
    }

    // Guía de Ingresos y Egresos
    if (
      guideSlug === "ingresos-y-egresos" ||
      slug === "ingresos-y-egresos" ||
      guideUrl.includes("ingresos-y-egresos")
    ) {
      return INCOMES_AND_EXPENSES_CONTENT;
    }

    // Guía de Proyectos
    if (
      guideSlug === "proyectos" ||
      slug === "proyectos" ||
      guideUrl.includes("/guias/proyectos")
    ) {
      return PROJECTS_MANAGEMENT_CONTENT;
    }

    // Si no hay un contenido estático específico, usar el contenido dinámico o mensaje por defecto
    return (
      currentGuide.content ||
      "<p>No hay contenido disponible para esta guía.</p>"
    );
  };

  // Obtener el contenido adecuado
  const guideContent = getStaticContent();
  const siteUrl = "https://estate-admin.com";
  const canonicalUrl = `${siteUrl}${location.pathname}`;
  const pageTitle = `${currentGuide.title} | Guía de Administración de Condominios`;
  const pageDescription =
    currentGuide.excerpt ||
    currentGuide.subtitle ||
    "Guía práctica para mejorar la administración y operación de condominios.";
  const baseKeywords =
    "administracion de condominios, cuotas de mantenimiento, cobranza condominal, egresos de condominio, mantenimiento condominios";
  const pageKeywords = currentGuide.tags?.length
    ? `${currentGuide.tags.join(", ")}, ${baseKeywords}`
    : baseKeywords;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guías",
        item: `${siteUrl}/guias`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: currentGuide.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={currentGuide.imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={currentGuide.imageUrl} />
        <meta name="twitter:site" content="@estateadmin" />
        {/* Metadatos adicionales para SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        {/* Schema.org structured data para Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: pageTitle,
            description: pageDescription,
            image: currentGuide.imageUrl,
            author: {
              "@type": "Person",
              name: currentGuide.author,
            },
            publisher: {
              "@type": "Organization",
              name: "Estate Admin",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.png`,
              },
            },
            datePublished: currentGuide.createdAt
              ? currentGuide.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            dateModified: currentGuide.createdAt
              ? currentGuide.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl,
            },
            articleSection:
              currentGuide.categories && currentGuide.categories.length > 0
                ? currentGuide.categories[0]
                : "Guía",
            keywords: pageKeywords,
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-indigo-600">
                  Inicio
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <Link
                  to="/guias"
                  className="text-gray-500 hover:text-indigo-600"
                >
                  Guías
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <span className="text-gray-700">{currentGuide.title}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenido principal */}
            <main className="lg:col-span-2">
              <article className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Imagen principal */}
                <div className="relative">
                  <img
                    src={currentGuide.imageUrl}
                    alt={currentGuide.title}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                <div className="p-6 md:p-8">
                  {/* Categorías */}
                  {currentGuide.categories &&
                    currentGuide.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentGuide.categories.map((category) => (
                          <Link
                            key={category}
                            to={`/guias?category=${encodeURIComponent(
                              category
                            )}`}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm hover:bg-indigo-200"
                          >
                            {category}
                          </Link>
                        ))}
                      </div>
                    )}

                  {/* Título y metadata */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {currentGuide.title}
                  </h1>

                  <div className="flex items-center text-gray-500 text-sm mb-6">
                    <span>{formattedDate}</span>
                    <span className="mx-2">•</span>
                    <span>Por {currentGuide.author}</span>
                  </div>

                  {/* Extracto */}
                  {currentGuide.excerpt && (
                    <div className="text-lg text-gray-700 mb-8 font-medium border-l-4 border-indigo-500 pl-4 italic">
                      {currentGuide.excerpt}
                    </div>
                  )}

                  {/* Contenido */}
                  <div
                    className="guide-content"
                    dangerouslySetInnerHTML={{ __html: guideContent }}
                  />

                  {/* Tags */}
                  {currentGuide.tags && currentGuide.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Etiquetas:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentGuide.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/guias?tag=${encodeURIComponent(tag)}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </main>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar
                relatedGuides={relatedGuides}
                categories={currentGuide.categories}
                tags={currentGuide.tags}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuidePage;
