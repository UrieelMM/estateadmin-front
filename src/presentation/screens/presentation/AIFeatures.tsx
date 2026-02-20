import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  SparklesIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import logo from "../../../assets/logo.png";
import Footer from "./Footer";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import PublicBreadcrumb from "../../components/public/PublicBreadcrumb";
import { getSeoExperimentCopy } from "../../seo/seoExperiments";

const AIFeatures = () => {
  const { isDarkMode } = useLocalDarkMode();
  const seoCopy = getSeoExperimentCopy("ai");
  const pageUrl = "https://estate-admin.com/caracteristicas-inteligencia-artificial";
  const pageTitle = seoCopy.title;
  const pageDescription = seoCopy.description;
  const pageKeywords = seoCopy.keywords;
  const pageImage =
    "https://res.cloudinary.com/dz5tntwl1/image/upload/v1771019555/darkmod_xsw29y.webp";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://estate-admin.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Características de IA",
        item: pageUrl,
      },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué aporta la IA en EstateAdmin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Genera reportes financieros ejecutivos, recomendaciones accionables y asistencia de redacción para reducir carga operativa.",
        },
      },
      {
        "@type": "Question",
        name: "¿La IA en EstateAdmin tiene control de costos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Se registra el consumo de tokens por funcionalidad y por condominio, con límites diarios configurables.",
        },
      },
      {
        "@type": "Question",
        name: "¿La IA sustituye el control administrativo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. La IA apoya al administrador con análisis y redacción, pero las decisiones y la trazabilidad siguen bajo control humano.",
        },
      },
    ],
  };
  const features = [
    {
      icon: DocumentChartBarIcon,
      title: "Reportes ejecutivos con IA",
      description:
        "Genera reportes financieros ejecutivos en segundos con métricas clave, hallazgos relevantes y recomendaciones accionables para la administración.",
    },
    {
      icon: ArrowPathIcon,
      title: "Uso controlado y trazable",
      description:
        "Cada generación IA registra tokens de entrada/salida por funcionalidad y por condominio, con límites diarios para mantener control de costos.",
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Asistente IA para publicaciones",
      description:
        "Convierte una idea general en un borrador claro, profesional y amable usando plantillas listas para avisos, mantenimiento, eventos y recordatorios.",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Análisis inteligente de comprobantes",
      description:
        "Procesa comprobantes y documentos para acelerar captura de datos operativos con mejor precisión y menos carga administrativa.",
    },
    {
      icon: RocketLaunchIcon,
      title: "App de mantenimiento en evolución",
      description:
        "Estamos construyendo una app de mantenimiento más potente con más automatización, trazabilidad de costos y flujos operativos asistidos por IA.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100"
          : "bg-gradient-to-b from-indigo-50 to-white"
      }`}
    >
      <Helmet>
        <title>{pageTitle}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="author" content="EstateAdmin" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <meta name="twitter:site" content="@estateadmin" />
        <meta name="twitter:creator" content="@estateadmin" />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <header className="bg-white shadow-sm dark:bg-gray-900 dark:border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              className="h-10 w-auto"
              src={logo}
              alt="EstateAdmin Logo"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <span className="ml-3 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              EstateAdmin
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            <ArrowLeftIcon className="h-5 w-5 inline mr-1" />
            Volver al inicio
          </Link>
        </div>
      </header>
      <PublicBreadcrumb
        items={[
          { label: "Inicio", to: "/" },
          { label: "Características de IA" },
        ]}
      />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-5 pattern-grid-lg"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block mb-6"
              >
                <SparklesIcon className="h-16 w-16 text-indigo-600" />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
              >
                <span className="block text-indigo-600">
                  Inteligencia Artificial
                </span>
                <span className="block mt-1">Implementaciones reales, valor real</span>
              </motion.h1>
            </motion.div>
          </div>
        </section>

        {/* Coming Soon Banner */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-12 sm:px-12 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
                <div className="lg:self-center">
                  <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                    <span className="block">Novedades IA ya disponibles</span>
                  </h2>
                  <p className="mt-4 text-lg leading-6 text-indigo-100">
                    Ya liberamos reportes IA, control de tokens por funcionalidad
                    y asistente de redacción para publicaciones. Además,
                    seguimos desarrollando una app de mantenimiento más potente.
                  </p>
                  <div className="mt-8">
                    <div className="inline-flex rounded-md shadow">
                      <Link
                        to="/contacto"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                      >
                        Mantente informado
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">
                Funcionalidades
              </h2>
              <p className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl sm:tracking-tight">
                Lo que la IA ya está haciendo por ti
              </p>
              <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-300">
                Funcionalidades lanzadas y mejoras en desarrollo continuo para
                una administración más rápida, profesional y trazable.
              </p>
            </div>

            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border dark:border-gray-700"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Tech Visualization */}
        <section className="py-16 bg-gradient-to-b from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-1 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl text-center">
                  Tecnología de vanguardia
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-300 text-center">
                  Nuestra hoja de ruta combina IA aplicada con operación real:
                  mejores decisiones financieras, comunicaciones claras y una
                  nueva experiencia de mantenimiento de alto impacto.
                </p>
                <div className="mt-6">
                  <ul className="space-y-3">
                    {[
                      "Reportes financieros IA con insights accionables",
                      "Control de cuotas y tokens por funcionalidad",
                      "Asistente IA para redacción de publicaciones",
                      "Procesamiento inteligente de comprobantes",
                      "Nueva app de mantenimiento en desarrollo avanzado",
                    ].map((item, i) => (
                      <li key={i} className="flex">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span className="ml-3 text-base text-gray-500 dark:text-gray-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-indigo-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">¿Listo para el futuro?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-100 max-w-2xl mx-auto">
              Sé parte de la revolución en la gestión de condominios. Mantente
              informado sobre nuestro lanzamiento y accede a contenido
              exclusivo.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/contacto"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Contáctanos
                </Link>
              </div>
              <div className="ml-3 inline-flex">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800"
                >
                  Regresar al inicio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIFeatures;
