import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "react-hot-toast";
import * as Sentry from "@sentry/react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Helmet } from "react-helmet-async";

const ContactForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const sanitizeInput = (input: string): string => {
    // Elimina solo caracteres potencialmente peligrosos como < y >
    // Mantiene los espacios y otros caracteres seguros
    return input.replace(/[<>]/g, "");
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      message: "",
    };

    // Validación del nombre
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    // Validación del email
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }

    // Validación del teléfono (opcional)
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Ingresa un teléfono válido";
    }

    // Validación del mensaje
    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es requerido";
    } else if (formData.message.length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, completa los campos requeridos correctamente");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_SERVER}/tools/contact-form`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al enviar el formulario");
      }

      toast.success("¡Mensaje enviado con éxito!");
      setShowSuccessMessage(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="min-h-screen bg-white"
    >
      <Helmet>
        <title>Contacta con EstateAdmin | Solicita información y soporte</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Contacta con el equipo de EstateAdmin para obtener más información sobre nuestras soluciones de gestión de condominios. Estamos aquí para ayudarte."
        />
        <meta
          name="keywords"
          content="contacto estateadmin, soporte condominios, solicitar información, contactar administración condominios"
        />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <link rel="canonical" href="https://estateadmin.com/contact" />
      </Helmet>

      <div className="flex flex-col lg:flex-row h-screen">
        <motion.div
          variants={itemVariants}
          className="flex-1 flex items-center justify-center p-8 lg:p-12"
        >
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("/presentation")}
              className="mb-6 flex items-center text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver
            </button>
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-indigo-500 sm:text-4xl font-pj">
                Contáctanos
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Déjanos tus datos y nos pondremos en contacto contigo lo antes
                posible.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {showSuccessMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <h3 className="text-lg font-medium text-indigo-800">
                    ¡Gracias por contactarnos!
                  </h3>
                  <p className="mt-2 text-indigo-700">
                    Hemos recibido tu mensaje y nos pondremos en contacto
                    contigo lo antes posible.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessMessage(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        message: "",
                      });
                    }}
                    className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Nombre"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full mt-1 px-2 h-[42px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500  ${
                        errors.name ? "border-red-500" : ""
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full mt-1 px-2 h-[42px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500  ${
                        errors.email ? "border-red-500" : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full mt-1 px-2 h-[42px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500  ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mensaje
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      placeholder="Mensaje"
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full mt-1 px-2 py-2 h-[100px] border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500  ${
                        errors.message ? "border-red-500" : ""
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                    </button>
                  </motion.div>
                </>
              )}
            </form>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="hidden lg:block lg:w-1/2 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
          <div className="h-full flex items-center justify-center">
            <img
              className="w-full h-[90vh] object-contain"
              src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744248053/OmniPixel/Sin_ti%CC%81tulo_650_x_650_px_cgb9uo.svg"
              style={{
                filter:
                  "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.4)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
              }}
              alt="Imagen de contacto"
            />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ContactForm;
