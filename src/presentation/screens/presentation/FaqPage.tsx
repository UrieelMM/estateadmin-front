import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SunIcon, MoonIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import PublicBreadcrumb from "../../components/public/PublicBreadcrumb";
import Footer from "./Footer";
import logo from "../../../assets/logo.png";

const faqs = [
  {
    question: "¿Qué módulos incluye EstateAdmin para condominios?",
    answer:
      "Incluye ingresos, egresos, mantenimiento, inventario, personal, proyectos, publicaciones, reportes y herramientas de IA para análisis, redacción y más.",
  },
  {
    question: "¿Se puede controlar la cobranza y morosidad?",
    answer:
      "Sí. Puedes registrar cargos, pagos, saldos pendientes, historiales por condominio y reportes para dar seguimiento puntual a las finanzas del condominio.",
  },
  {
    question: "¿El sistema permite manejar mantenimiento con tickets?",
    answer:
      "Sí. Puedes registrar tickets, agenda de visitas, contratos y costos de mantenimiento con trazabilidad operativa.",
  },
  {
    question: "¿Puedo llevar egresos e ingresos en un mismo panel?",
    answer:
      "Sí. EstateAdmin integra control de ingresos, egresos y balance para revisar la salud financiera del condominio.",
  },
  {
    question: "¿Cómo se gestionan los usuarios administradores?",
    answer:
      "Puedes crear usuarios con roles, permisos y control de estado para mantener seguridad y trazabilidad de acciones.",
  },
  {
    question: "¿EstateAdmin funciona para condominios de diferentes tamaños?",
    answer:
      "Sí. Hay planes para condominios pequeños, medianos y grandes, manteniendo consistencia operativa en todos los módulos.",
  },
  {
    question: "¿El sistema tiene reportes con inteligencia artificial?",
    answer:
      "Sí. Puedes generar reportes ejecutivos con IA a partir de datos reales del sistema y mantener control de consumo por tokens.",
  },
  {
    question: "¿Hay soporte para onboarding y configuración inicial?",
    answer:
      "Sí. Puedes apoyarte en guías, formularios de configuración y soporte para alinear la operación desde el inicio.",
  },
];

const FaqPage = () => {
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();
  const pageUrl = "https://estate-admin.com/preguntas-frecuentes";
  const pageTitle = "Preguntas Frecuentes de Administración de Condominios | EstateAdmin";
  const pageDescription =
    "Resuelve dudas sobre planes, módulos, cobranza, mantenimiento, egresos, personal y reportes con IA en EstateAdmin.";
  const pageKeywords =
    "preguntas frecuentes administracion condominios, software condominios faq, cobranza condominio, mantenimiento condominal";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://estate-admin.com" },
      { "@type": "ListItem", position: 2, name: "Preguntas frecuentes", item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map( ( faq ) => ( {
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    } ) ),
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
          { JSON.stringify( faqSchema ) }
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

      <PublicBreadcrumb
        items={ [ { label: "Inicio", to: "/" }, { label: "Preguntas frecuentes" } ] }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Preguntas frecuentes
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Respuestas claras sobre funcionalidades, operación y alcance del sistema para administración de condominios.
          </p>
        </div>

        <section className="mt-10 space-y-4">
          { faqs.map( ( faq ) => (
            <article
              key={ faq.question }
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                { faq.question }
              </h2>
              <p className="mt-2 text-gray-700 dark:text-gray-300">{ faq.answer }</p>
            </article>
          ) ) }
        </section>

        <section className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Podemos revisar tu caso y ayudarte a definir la mejor configuración para tu condominio.
          </p>
          <div className="mt-4">
            <Link
              to="/contacto"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Contactar al equipo
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FaqPage;
