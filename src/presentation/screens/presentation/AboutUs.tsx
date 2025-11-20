import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import logo from "../../../assets/logo.png";
import Footer from "./Footer";

const AboutUs = () => {
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <Helmet>
        <title>
          Sobre Nosotros - EstateAdmin | Gestión Inteligente de Condominios
        </title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Conoce más sobre EstateAdmin, nuestra visión y objetivos como empresa líder en soluciones de gestión para condominios en México. Software especializado en administración de propiedades."
        />
        <meta
          name="keywords"
          content="estateadmin, software condominios, administración de propiedades, gestión de edificios, empresa tecnológica, software inmobiliario, administración inmobiliaria, gestión de condominios méxico"
        />
        <meta name="author" content="EstateAdmin" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta name="revisit-after" content="7 days" />
        <meta name="theme-color" content="#4F46E5" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://estate-admin.com/sobre-nosotros"
        />
        <meta
          property="og:title"
          content="Sobre Nosotros - EstateAdmin | Gestión Inteligente de Condominios"
        />
        <meta
          property="og:description"
          content="Conoce más sobre EstateAdmin, nuestra visión y objetivos como empresa líder en soluciones de gestión para condominios en México."
        />
        <meta property="og:image" content={logo} />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:url"
          content="https://estate-admin.com/sobre-nosotros"
        />
        <meta
          name="twitter:title"
          content="Sobre Nosotros - EstateAdmin | Gestión Inteligente de Condominios"
        />
        <meta
          name="twitter:description"
          content="Conoce más sobre EstateAdmin, nuestra visión y objetivos como empresa líder en soluciones de gestión para condominios en México."
        />
        <meta name="twitter:image" content={logo} />
        <meta name="twitter:creator" content="@estateadmin" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://estate-admin.com/sobre-nosotros" />
      </Helmet>

      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img className="h-10 w-auto" src={logo} alt="EstateAdmin Logo" />
            <span className="ml-3 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              EstateAdmin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5">
                <SunIcon
                  className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${
                    !isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-180 scale-75"
                  }`}
                />
                <MoonIcon
                  className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${
                    isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 -rotate-180 scale-75"
                  }`}
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

      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
          <div className="absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#9c80ff] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 sm:text-5xl md:text-6xl">
                Sobre Nosotros
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
                Conoce la historia, visión y propósito detrás de EstateAdmin
              </p>
            </div>
          </div>
        </section>

        {/* Quiénes Somos Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-16 sm:py-24"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div variants={itemVariants} className="lg:order-2">
                <img
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1746316218/OmniPixel/ChatGPT_Image_3_may_2025_05_45_17_p.m._tmnygn.png"
                  alt="Equipo de EstateAdmin trabajando"
                  className="rounded-xl shadow-xl w-full h-auto object-cover"
                />
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="mt-10 lg:mt-0 lg:order-1"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  ¿Quiénes somos?
                </h2>
                <div className="w-20 h-1 bg-indigo-600 dark:bg-indigo-400 mt-4 mb-6"></div>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  EstateAdmin nació como respuesta a la creciente necesidad de
                  digitalizar la gestión de condominios en México. Somos un
                  equipo multidisciplinario de profesionales apasionados por la
                  tecnología y la innovación, comprometidos con transformar la
                  forma en que se administran las propiedades residenciales.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nuestra plataforma fue diseñada tras escuchar atentamente los
                  desafíos que enfrentan administradores, propietarios y
                  residentes en la gestión diaria de sus comunidades. Combinamos
                  experiencia en desarrollo de software, administración
                  inmobiliaria y atención al cliente para ofrecer una solución
                  integral que simplifica la vida de todos los involucrados.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Nuestra Visión Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-16 sm:py-24 bg-indigo-50 dark:bg-gray-800 transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div variants={itemVariants}>
                <img
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1746316218/OmniPixel/ChatGPT_Image_3_may_2025_05_47_10_p.m._ri3ank.png"
                  alt="Visión de EstateAdmin"
                  className="rounded-xl shadow-xl w-full h-auto object-cover"
                />
              </motion.div>
              <motion.div variants={itemVariants} className="mt-10 lg:mt-0">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Nuestra visión
                </h2>
                <div className="w-20 h-1 bg-indigo-600 dark:bg-indigo-400 mt-4 mb-6"></div>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  En EstateAdmin visualizamos un futuro donde la administración
                  de condominios sea sinónimo de eficiencia, transparencia y
                  colaboración. Aspiramos a ser el estándar de oro en soluciones
                  tecnológicas para comunidades residenciales en toda
                  Latinoamérica.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Creemos firmemente que la tecnología debe servir para unir a
                  las personas y facilitar su día a día. Por eso, trabajamos
                  incansablemente para desarrollar herramientas que no solo
                  automaticen procesos administrativos, sino que también
                  fomenten un sentido de comunidad y bienestar entre los
                  residentes.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nuestra visión se extiende hacia la creación de comunidades
                  residenciales más inteligentes, sostenibles y armoniosas,
                  donde la convivencia y la gestión de recursos se optimicen a
                  través de soluciones digitales accesibles para todos.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Nuestro Objetivo Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-16 sm:py-24"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div variants={itemVariants} className="lg:order-2">
                <img
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1746316731/OmniPixel/ChatGPT_Image_3_may_2025_05_57_45_p.m._1_feh4zc.png"
                  alt="Objetivos de EstateAdmin"
                  className="rounded-xl shadow-xl w-full h-auto object-cover"
                />
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="mt-10 lg:mt-0 lg:order-1"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Nuestro objetivo
                </h2>
                <div className="w-20 h-1 bg-indigo-600 dark:bg-indigo-400 mt-4 mb-6"></div>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nuestro objetivo principal es revolucionar la administración
                  de condominios en México y Latinoamérica, ofreciendo una
                  plataforma intuitiva, potente y accesible que resuelva de
                  manera efectiva los desafíos cotidianos de la gestión
                  inmobiliaria.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nos hemos propuesto reducir en un 50% el tiempo dedicado a
                  tareas administrativas, eliminar la morosidad en pagos de
                  mantenimiento y mejorar la comunicación entre todos los
                  miembros de la comunidad residencial.
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Para 2026, aspiramos a estar presentes en al menos 1,000
                  condominios en toda la región, contribuyendo
                  significativamente a la transformación digital del sector
                  inmobiliario y mejorando la calidad de vida de más de un
                  millón de residentes a través de nuestra tecnología.
                </p>
                <div className="mt-8">
                  <Link
                    to="/contacto"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Contáctanos
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <section className="bg-indigo-500 dark:bg-indigo-600 py-16 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white dark:text-gray-100">
              ¿Listo para transformar la gestión de tu condominio?
            </h2>
            <p className="mt-4 text-xl text-indigo-100 dark:text-gray-200 max-w-3xl mx-auto">
              Únete a miles de administradores y residentes que ya disfrutan de
              los beneficios de EstateAdmin
            </p>
            <div className="mt-8 flex justify-center gap-x-4">
              <Link
                to="/contacto"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 dark:text-indigo-600 bg-white dark:bg-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-300"
              >
                Solicitar demo
              </Link>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 border border-white dark:border-gray-300 text-base font-medium rounded-md text-white dark:text-gray-100 hover:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-300"
              >
                Conocer más
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
