import { motion } from "framer-motion";

const FeatureCards = () => {
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

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="relative py-10 sm:py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-white"
      id="features"
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-indigo-300 to-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-purple-300 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="max-w-xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200/50 backdrop-blur-sm">
            <svg
              className="h-4 w-4 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span className="text-sm font-semibold text-indigo-600">
              Sistema Integral de Gestión
            </span>
          </div>

          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
            Características Principales
          </h2>
        </motion.div>

        <div className="grid items-center grid-cols-1 mt-12 gap-y-10 lg:grid-cols-5 sm:mt-20 gap-x-4">
          <motion.div
            variants={containerVariants}
            className="space-y-8 lg:pr-16 xl:pr-24 lg:col-span-2 lg:space-y-12"
          >
            <motion.div
              variants={cardVariants}
              className="group flex items-start p-4 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg group-hover:shadow-lg transition-shadow">
                  <svg
                    className="text-white w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  Gestión Financiera
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Control de pagos, cobros, gastos y presupuestos en tiempo
                  real.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="group flex items-start p-4 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg group-hover:shadow-lg transition-shadow">
                  <svg
                    className="text-white w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  Gestión de Proyectos
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Planificación y seguimiento de obras y mantenimientos con
                  control de presupuesto.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="group flex items-start p-4 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg group-hover:shadow-lg transition-shadow">
                  <svg
                    className="text-white w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  Comunicación Eficiente
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Sistema de notificaciones por WhatsApp y correo electrónico.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="group flex items-start p-4 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg group-hover:shadow-lg transition-shadow">
                  <svg
                    className="text-white w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  Diseño Moderno y Accesible
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Interfaz intuitiva con modo oscuro y diseño responsivo para
                  una mejor experiencia de usuario.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <img
                className="relative w-full rounded-2xl shadow-2xl border border-gray-200"
                src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744234537/OmniPixel/Captura_de_pantalla_2025-04-09_a_la_s_3.34.11_p.m._ozb7dh.png"
                alt="Panel de administración del sistema de gestión de condominios"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default FeatureCards;
