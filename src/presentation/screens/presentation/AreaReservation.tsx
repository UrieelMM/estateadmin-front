import { motion } from "framer-motion";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

const AreaReservation = () => {
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
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={ { once: true, margin: "-100px" } }
      variants={ containerVariants }
      className="relative py-12 sm:py-16 lg:py-20"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:items-center gap-y-8 md:grid-cols-2 md:gap-x-16">
          <motion.div variants={ itemVariants }>
            <img
              style={ {
                filter:
                  "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
              } }
              className="w-full max-w-sm mx-auto"
              src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1771035689/4_kldikc_umubcl.svg"
              alt="Reserva de áreas comunes"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </motion.div>

          <motion.div variants={ itemVariants }>
            {/* Badge Superior */ }
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 dark:from-pink-500/20 dark:via-rose-500/20 dark:to-pink-500/20 border border-pink-200/50 dark:border-pink-700/50 backdrop-blur-sm">
              <CalendarDaysIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                Reservas Inteligentes
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl xl:text-4xl font-pj">
              Reserva de Áreas Comunes
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-900 dark:text-gray-100 sm:mt-8 font-pj">
              Gestiona y reserva las áreas comunes de tu condominio de manera
              sencilla. Recibe notificaciones instantáneas sobre el estado de
              tus reservas y mantente informado en todo momento.
            </p>

            <svg
              className="w-auto h-4 mt-8 text-gray-100 dark:text-gray-700 sm:mt-10"
              viewBox="0 0 172 16"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                y1="-0.5"
                x2="18.0278"
                y2="-0.5"
                transform="matrix(-0.5547 0.83205 0.83205 0.5547 11 1)"
              />
              <line
                y1="-0.5"
                x2="18.0278"
                y2="-0.5"
                transform="matrix(-0.5547 0.83205 0.83205 0.5547 46 1)"
              />
              <line
                y1="-0.5"
                x2="18.0278"
                y2="-0.5"
                transform="matrix(-0.5547 0.83205 0.83205 0.5547 81 1)"
              />
              <line
                y1="-0.5"
                x2="18.0278"
                y2="-0.5"
                transform="matrix(-0.5547 0.83205 0.83205 0.5547 116 1)"
              />
              <line
                y1="-0.5"
                x2="18.0278"
                y2="-0.5"
                transform="matrix(-0.5547 0.83205 0.83205 0.5547 151 1)"
              />
            </svg>

            <motion.ul
              variants={ containerVariants }
              className="mt-5 space-y-5 sm:mt-10"
            >
              <motion.li
                variants={ itemVariants }
                className="flex items-center text-gray-900 dark:text-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-3 text-lg font-bold font-pj dark:text-gray-100">
                  Notificaciones en Tiempo Real
                </span>
              </motion.li>

              <motion.li
                variants={ itemVariants }
                className="flex items-center text-gray-900 dark:text-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-3 text-lg font-bold font-pj dark:text-gray-100">
                  Calendario de Disponibilidad
                </span>
              </motion.li>

              <motion.li
                variants={ itemVariants }
                className="flex items-center text-gray-900 dark:text-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="ml-3 text-lg font-bold font-pj dark:text-gray-100">
                  Confirmación Automática
                </span>
              </motion.li>
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default AreaReservation;
