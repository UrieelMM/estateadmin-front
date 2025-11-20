import { motion } from "framer-motion";
import {
  SparklesIcon,
  ChartBarIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/solid";

const FinancialDetails = () => {
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
      className="relative py-12 sm:py-16 lg:py-20"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="max-w-4xl px-4 mx-auto text-center sm:px-0"
        >
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-indigo-200/50 dark:border-indigo-700/50 backdrop-blur-sm">
            <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Finanzas Inteligentes
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 font-pj">
            <span className="relative inline-block">Gestión Financiera</span>
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 font-pj">
              y Reportes Avanzados
            </span>
          </h2>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
            Controla cada aspecto financiero de tu condominio con herramientas
            profesionales y automatización inteligente
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="relative max-w-md mx-auto mt-12 md:max-w-none md:mt-20"
        >
          <motion.div
            variants={itemVariants}
            className="absolute inset-x-0 hidden top-36 xl:block"
          >
            <motion.img
              transition={{ type: "spring", stiffness: 300 }}
              className="object-contain w-full h-auto max-w-xl mx-auto"
              src="https://cdn.rareblocks.xyz/collection/clarity/images/how-it-works/2/line-pattern.png"
              alt=""
            />
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 text-center md:text-left md:grid-cols-3 md:gap-x-16 gap-y-12 xl:gap-x-32"
          >
            <motion.div
              variants={cardVariants}
              className="group relative flex flex-col justify-between"
            >
              {/* Glassmorphism Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-indigo-50/50 dark:from-gray-800/80 dark:to-indigo-900/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl opacity-0 transition-opacity duration-300 -z-10"></div>

              <motion.div className="relative flex-shrink-0 mx-8 md:mx-0">
                {/* Icon Badge */}
                <div className="absolute -top-4 -right-4 z-10">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <motion.img
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px] transition-all duration-300 group-hover:drop-shadow-2xl"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.2)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.2)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744238996/OmniPixel/1_fc7uk1.svg"
                  alt="Pagos Sencillos"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-6 md:mt-10 relative z-10"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-pj">
                  Pagos Sencillos
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600 dark:text-gray-100">
                  Realiza pagos de manera rápida y segura. El sistema genera
                  automáticamente los recibos y actualiza el estado de cuenta de
                  cada residente.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    Automático
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                    Seguro
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="group relative flex flex-col justify-between"
            >
              {/* Glassmorphism Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-purple-50/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl opacity-0 transition-opacity duration-300 -z-10"></div>

              <motion.div className="relative flex-shrink-0 mx-8 md:mx-0">
                {/* Icon Badge */}
                <div className="absolute -top-4 -right-4 z-10">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <BellAlertIcon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <motion.img
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px] transition-all duration-300 group-hover:drop-shadow-2xl"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.2)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.2)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744243752/OmniPixel/5_vxlcht.svg"
                  alt="Notificaciones Automáticas"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-6 md:mt-10 relative z-10"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-pj">
                  Notificaciones Automáticas
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600 dark:text-gray-100">
                  Notificaciones instantáneas por WhatsApp y correo electrónico
                  para pagos y confirmaciones.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                    Instantáneo
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 rounded-full">
                    Multi-canal
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="group relative flex flex-col justify-between"
            >
              {/* Glassmorphism Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-pink-50/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl opacity-0 transition-opacity duration-300 -z-10"></div>

              <motion.div className="relative flex-shrink-0 mx-8 md:mx-0">
                {/* Icon Badge */}
                <div className="absolute -top-4 -right-4 z-10">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <DocumentChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <motion.img
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px] transition-all duration-300 group-hover:drop-shadow-2xl"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.2)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.2)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744238997/OmniPixel/3_en0ihl.svg"
                  alt="Reportes Financieros"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-6 md:mt-10 relative z-10"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-pj ">
                  Reportes Financieros
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600 dark:text-gray-100">
                  Accede a reportes detallados de ingresos, gastos, pagos
                  pendientes y estados de cuenta de cada residente en tiempo
                  real.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 rounded-full">
                    Tiempo Real
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    Detallado
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FinancialDetails;
