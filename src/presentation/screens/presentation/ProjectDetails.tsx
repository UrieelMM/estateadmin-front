import { motion } from "framer-motion";
import {
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";

const PROJECT_PREVIEW_LIGHT_URL =
  "https://res.cloudinary.com/dz5tntwl1/image/upload/v1771019953/projectsLight_boh3d1.webp";
const PROJECT_PREVIEW_DARK_URL =
  "https://res.cloudinary.com/dz5tntwl1/image/upload/v1771019953/projectsDarkmode_dxravl.webp";

const ProjectDetails = () => {
  const { isDarkMode } = useLocalDarkMode();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
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
          className="max-w-xl mx-auto text-center xl:max-w-3xl"
        >
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
            <RocketLaunchIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              Proyectos Profesionales
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 font-pj">
            <span className="relative inline-block">Gestión de Proyectos</span>
          </h2>
          <p className="max-w-xl mx-auto mt-6 text-lg leading-7 text-gray-600 dark:text-gray-100 font-pj">
            Planifica y supervisa proyectos y mantenimientos con herramientas
            especializadas y control total del presupuesto.
          </p>
        </motion.div>

        {/* Grid de 2 columnas: Tarjetas a la izquierda, Imagen a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-12 sm:mt-16 items-center">
          {/* Columna Izquierda - Feature Highlights Cards */}
          <motion.div variants={itemVariants} className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-pj mb-2">
                    Control de Gastos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-100">
                    Seguimiento detallado de presupuestos y gastos en tiempo
                    real
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                      Presupuestos
                    </span>
                    <span className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                      Reportes
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl shadow-lg">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-pj mb-2">
                    Gestión de Tareas
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-100">
                    Organiza y asigna tareas con seguimiento completo del
                    progreso
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                      Kanban
                    </span>
                    <span className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                      Asignaciones
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Columna Derecha - Imagen */}
          <motion.div variants={itemVariants}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <img
                className="relative w-full rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                src={isDarkMode ? PROJECT_PREVIEW_DARK_URL : PROJECT_PREVIEW_LIGHT_URL}
                alt="Panel de gestión de proyectos"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProjectDetails;
