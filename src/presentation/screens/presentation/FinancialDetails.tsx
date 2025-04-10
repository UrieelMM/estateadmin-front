import { motion } from "framer-motion";

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
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 300,
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
      className="py-12 bg-white sm:py-16 lg:py-20"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="max-w-4xl px-4 mx-auto text-center sm:px-0"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl xl:text-4xl font-pj">
            Gestión Financiera y Reportes Avanzados
          </h2>
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
              whileHover={{ scale: 1.02 }}
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
              whileHover="hover"
              className="flex flex-col justify-between"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative flex-shrink-0 mx-8 md:mx-0"
              >
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px]"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744238996/OmniPixel/1_fc7uk1.svg"
                  alt="Pagos Sencillos"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="mt-6 md:mt-10">
                <h3 className="text-xl font-bold text-gray-900 font-pj">
                  Pagos Sencillos
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600">
                  Realiza pagos de manera rápida y segura. El sistema genera
                  automáticamente los recibos y actualiza el estado de cuenta de
                  cada residente.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col justify-between"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative flex-shrink-0 mx-8 md:mx-0"
              >
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px]"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744243752/OmniPixel/5_vxlcht.svg"
                  alt="Notificaciones Automáticas"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="mt-6 md:mt-10">
                <h3 className="text-xl font-bold text-gray-900 font-pj">
                  Notificaciones Automáticas
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600">
                  Notificaciones instantáneas por WhatsApp y correo electrónico
                  para pagos y confirmaciones.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col justify-between"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative flex-shrink-0 mx-8 md:mx-0"
              >
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  className="relative w-full h-auto mx-auto rounded-lg max-w-[200px]"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                  }}
                  src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744238997/OmniPixel/3_en0ihl.svg"
                  alt="Reportes Financieros"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="mt-6 md:mt-10">
                <h3 className="text-xl font-bold text-gray-900 font-pj">
                  Reportes Financieros
                </h3>
                <p className="mt-4 text-base font-normal leading-7 text-gray-600">
                  Accede a reportes detallados de ingresos, gastos, pagos
                  pendientes y estados de cuenta de cada residente en tiempo
                  real.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FinancialDetails;
