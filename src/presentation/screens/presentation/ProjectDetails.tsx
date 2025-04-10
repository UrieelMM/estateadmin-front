import { motion } from "framer-motion";

const ProjectDetails = () => {
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

  const gradientVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 0.3,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="py-12 bg-transparent sm:py-16 lg:py-20"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          variants={itemVariants}
          className="max-w-xl mx-auto text-center xl:max-w-3xl"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl xl:text-4xl font-pj">
            Gestión de Proyectos
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-base leading-7 text-gray-600 sm:mt-8 font-pj">
            Planifica y supervisa proyectos y mantenimientos con herramientas
            especializadas.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative mt-8 sm:mt-16 md:max-w-md md:mx-auto px-6"
        >
          <motion.div variants={gradientVariants} className="absolute inset-0">
            <div
              className="w-full h-full max-w-lg rotate-180 blur-lg filter px-6"
              style={{
                background:
                  "linear-gradient(70deg, #915DF4 15%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #915DF4 100%)",
              }}
            ></div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-16"
          >
            <motion.div variants={itemVariants} className="flex items-center">
              <p className="text-4xl font-medium text-gray-900 font-pj">
                Control
              </p>
              <p className="ml-5 text-sm text-gray-900 font-pj">
                Total de
                <br />
                Proyectos
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center mt-6 sm:mt-0"
            >
              <p className="text-4xl font-medium text-gray-900 font-pj">
                Gestión
              </p>
              <p className="ml-5 text-sm text-gray-900 font-pj">
                De
                <br />
                Tareas
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="max-w-4xl mx-auto mt-10 sm:mt-16"
        >
          <img
            className="w-full rounded-lg shadow-xl"
            src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744246295/OmniPixel/proyectos_wpnz78.png"
            alt="Panel de gestión de proyectos"
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ProjectDetails;
