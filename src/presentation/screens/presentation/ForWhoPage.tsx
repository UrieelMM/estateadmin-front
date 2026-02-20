import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SunIcon, MoonIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import PublicBreadcrumb from "../../components/public/PublicBreadcrumb";
import Footer from "./Footer";
import logo from "../../../assets/logo.png";

const segments = [
  {
    title: "Administradores de condominios",
    points: [
      "Control de cobranza, pagos y saldos por unidad.",
      "Seguimiento de mantenimiento, tickets y visitas.",
      "Reportes para cierre mensual y decisiones operativas.",
    ],
  },
  {
    title: "Empresas administradoras",
    points: [
      "Estandarización de procesos en varios condominios.",
      "Trazabilidad de movimientos financieros y operativos.",
      "Mayor visibilidad para supervisores y equipos de campo.",
    ],
  },
  {
    title: "Comités y mesas directivas",
    points: [
      "Transparencia de ingresos, egresos y estado financiero.",
      "Historial claro de gastos, tickets y acuerdos operativos.",
      "Mejor comunicación con residentes y proveedores.",
    ],
  },
  {
    title: "Fraccionamientos y residenciales",
    points: [
      "Operación diaria centralizada en una sola plataforma.",
      "Inventario, personal y proyectos con mejor seguimiento.",
      "Escalabilidad para comunidades pequeñas y grandes.",
    ],
  },
];

const ForWhoPage = () => {
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();
  const pageUrl = "https://estate-admin.com/para-quien-es";
  const pageTitle = "¿Para Quién Es EstateAdmin? | Administración de Condominios";
  const pageDescription =
    "Conoce para qué tipo de administradores, comités y empresas está diseñado EstateAdmin para control financiero y operación de condominios.";
  const pageKeywords =
    "para quien es software de condominios, administracion de condominios, software para administradores, plataforma condominal";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://estate-admin.com" },
      { "@type": "ListItem", position: 2, name: "¿Para quién es?", item: pageUrl },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Helmet>
        <title>{ pageTitle }</title>
        <meta name="description" content={ pageDescription } />
        <meta name="keywords" content={ pageKeywords } />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ pageUrl } />
        <meta property="og:title" content={ pageTitle } />
        <meta property="og:description" content={ pageDescription } />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={ pageUrl } />
        <meta name="twitter:title" content={ pageTitle } />
        <meta name="twitter:description" content={ pageDescription } />
        <meta name="twitter:site" content="@estateadmin" />
        <link rel="canonical" href={ pageUrl } />
        <script type="application/ld+json">
          { JSON.stringify( breadcrumbSchema ) }
        </script>
        <script type="application/ld+json">
          { JSON.stringify( webPageSchema ) }
        </script>
      </Helmet>

      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              className="h-10 w-auto"
              src={ logo }
              alt="EstateAdmin Logo"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <span className="ml-3 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              EstateAdmin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={ toggleDarkMode }
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300"
              aria-label="Cambiar modo"
            >
              <div className="relative w-5 h-5">
                <SunIcon
                  className={ `absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${ !isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-75"
                    }` }
                />
                <MoonIcon
                  className={ `absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${ isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-180 scale-75"
                    }` }
                />
              </div>
            </button>
            <Link
              to="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <ArrowLeftIcon className="h-5 w-5 inline mr-1" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <PublicBreadcrumb items={ [ { label: "Inicio", to: "/" }, { label: "¿Para quién es?" } ] } />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            ¿Para quién es EstateAdmin?
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            EstateAdmin está diseñado para equipos que necesitan orden financiero, trazabilidad operativa y mejor control de mantenimiento en condominios.
          </p>
        </div>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          { segments.map( ( segment ) => (
            <article
              key={ segment.title }
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                { segment.title }
              </h2>
              <ul className="mt-4 space-y-2">
                { segment.points.map( ( point ) => (
                  <li key={ point } className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <span>{ point }</span>
                  </li>
                ) ) }
              </ul>
            </article>
          ) ) }
        </section>

        <section className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            ¿Quieres validar si aplica a tu operación?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Te ayudamos a mapear tus procesos actuales y recomendar una configuración acorde a tu condominio o cartera administrada.
          </p>
          <div className="mt-4">
            <Link
              to="/contacto"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Hablar con un asesor
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForWhoPage;
