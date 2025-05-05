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

const AIFeatures = () => {
  const features = [
    {
      icon: DocumentChartBarIcon,
      title: "Reportes avanzados con IA",
      description:
        "Genera automáticamente análisis predictivos, tendencias de consumo y recomendaciones personalizadas basadas en los datos históricos de tu condominio.",
    },
    {
      icon: ArrowPathIcon,
      title: "Automatización inteligente",
      description:
        "Identifica y automatiza procesos repetitivos como recordatorios, seguimiento de pagos y programación de mantenimientos preventivos.",
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Mantenimiento preventivo inteligente",
      description:
        "Predice necesidades de mantenimiento en instalaciones comunes antes de que se produzcan fallos. Programa intervenciones oportunas y optimiza recursos de mantenimiento.",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Asistente virtual",
      description:
        "Responde preguntas frecuentes de residentes, genera informes bajo demanda y proporciona sugerencias contextuales para optimizar la gestión.",
    },
    {
      icon: RocketLaunchIcon,
      title: "Previsión presupuestaria",
      description:
        "Proyecta gastos futuros, optimiza la distribución de recursos y anticipa necesidades financieras con modelos predictivos de IA.",
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <Helmet>
        <title>
          Inteligencia Artificial - EstateAdmin | El futuro de la gestión de
          condominios
        </title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Descubre cómo la inteligencia artificial transformará la administración de condominios en EstateAdmin: reportes avanzados, automatización inteligente y asistente virtual."
        />
        <meta
          name="keywords"
          content="IA condominios, inteligencia artificial, gestión automatizada, reportes predictivos, asistente virtual condominios"
        />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <link rel="canonical" href="https://estateadmin.com/ai-features" />
      </Helmet>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img className="h-10 w-auto" src={logo} alt="EstateAdmin Logo" />
            <span className="ml-3 text-xl font-bold text-indigo-600">
              EstateAdmin
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeftIcon className="h-5 w-5 inline mr-1" />
            Volver al inicio
          </Link>
        </div>
      </header>

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
                className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
              >
                <span className="block text-indigo-600">
                  Inteligencia Artificial
                </span>
                <span className="block mt-1">El futuro de EstateAdmin</span>
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
                    <span className="block">Próximamente</span>
                  </h2>
                  <p className="mt-4 text-lg leading-6 text-indigo-100">
                    Nos encontramos en fase de desarrollo de nuestras
                    funcionalidades de IA. Serás de los primeros en experimentar
                    esta nueva forma de administrar condominios.
                  </p>
                  <div className="mt-8">
                    <div className="inline-flex rounded-md shadow">
                      <Link
                        to="/contact"
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
              <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
                Lo que la IA hará por ti
              </p>
              <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                Descubre todas las formas en que nuestra integración con
                inteligencia artificial transformará la gestión de tu
                condominio.
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
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-lg font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Tech Visualization */}
        <section className="py-16 bg-gradient-to-b from-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-1 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center">
                  Tecnología de vanguardia
                </h2>
                <p className="mt-4 text-lg text-gray-500 text-center">
                  Estamos trabajando en integrar capacidades avanzadas de
                  Inteligencia Artificial para revolucionar la forma en que
                  gestionas tu condominio.
                </p>
                <div className="mt-6">
                  <ul className="space-y-3">
                    {[
                      "Modelos predictivos para anticipar necesidades",
                      "Interfaces conversacionales intuitivas",
                      "Algoritmos de optimización financiera",
                      "Procesamiento de documentos e imágenes",
                      "Sistemas de recomendación personalizados",
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
                        <span className="ml-3 text-base text-gray-500">
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
                  to="/contact"
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
