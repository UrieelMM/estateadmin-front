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
      className="py-10 bg-transparent sm:py-16 lg:py-24"
      id="features"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="max-w-xl mx-auto text-center"
        >
          <p className="text-sm font-semibold tracking-widest text-indigo-500 uppercase">
            Sistema Integral de Gestión
          </p>

          <h2 className="mt-6 text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-4xl">
            Características Principales
          </h2>
        </motion.div>

        <div className="grid items-center grid-cols-1 mt-12 gap-y-10 lg:grid-cols-5 sm:mt-20 gap-x-4">
          <motion.div
            variants={containerVariants}
            className="space-y-8 lg:pr-16 xl:pr-24 lg:col-span-2 lg:space-y-12"
          >
            <motion.div variants={cardVariants} className="flex items-start">
              <svg
                className="flex-shrink-0 text-green-500 w-9 h-9"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-black">
                  Gestión Financiera
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Control de pagos, cobros, gastos y presupuestos en tiempo
                  real.
                </p>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="flex items-start">
              <svg
                className="flex-shrink-0 text-blue-600 w-9 h-9"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-black">
                  Gestión de Proyectos
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Planificación y seguimiento de obras y mantenimientos con
                  control de presupuesto.
                </p>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="flex items-start">
              <svg
                className="flex-shrink-0 text-red-500 w-9 h-9"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-black">
                  Comunicación Eficiente
                </h3>
                <p className="mt-3 text-base text-gray-600">
                  Sistema de notificaciones por WhatsApp y correo electrónico.
                </p>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="flex items-start">
              <svg
                className="flex-shrink-0 text-purple-500 w-9 h-9"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div className="ml-5">
                <h3 className="text-xl font-semibold text-black">
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
            <img
              className="w-full rounded-lg shadow-2xl"
              src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744234537/OmniPixel/Captura_de_pantalla_2025-04-09_a_la_s_3.34.11_p.m._ozb7dh.png"
              alt="Panel de administración del sistema de gestión de condominios"
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default FeatureCards;
