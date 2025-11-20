import { useState } from "react";
import { toast } from "react-hot-toast";
import * as Sentry from "@sentry/react";

const Contact = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Por favor, ingresa un correo electrónico válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        name: "No name",
        email: email,
        phone: "",
        message: "Correo envado desde el footer de estate-admin.com",
      };

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

      toast.success("¡Tu solicitud ha sido enviada con éxito!");
      setEmail("");
    } catch (error) {
      Sentry.captureException(error);
      toast.error(
        "Error al enviar la solicitud. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 bg-transparent sm:py-16 lg:py-20" id="contact">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 font-pj">
            ¿Listo para transformar la gestión de tu condominio?{" "}
            <span className="text-4xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              EstateAdmin
            </span>
          </h2>
          <p className="max-w-md mx-auto mt-5 text-base font-normal text-gray-600 dark:text-gray-300 font-pj">
            Únete a la comunidad de administradores que ya están disfrutando de
            una gestión más eficiente y moderna de sus condominios.
          </p>
        </div>

        <div className="relative max-w-lg mx-auto mt-14">
          <div className="absolute -inset-x-2 -inset-y-5">
            <div
              className="w-full h-full mx-auto rotate-180 opacity-30 blur-lg filter"
              style={{
                background:
                  "linear-gradient(70deg, #818CF8 0%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #915DF4 100%)",
              }}
            ></div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Ingresa tu correo electrónico"
              className="block w-full px-5 py-6 text-base font-normal text-gray-800 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-indigo-300 dark:focus:border-indigo-500 font-pj focus:outline-none transition-colors duration-300"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="mt-4 sm:mt-0 sm:absolute sm:inset-y-0 sm:right-0 sm:flex sm:items-center sm:pr-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center justify-center w-full px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-indigo-600 dark:bg-indigo-500 border border-transparent sm:w-auto sm:py-3 focus:outline-none font-pj hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-xl ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Enviando..." : "Solicitar información"}
              </button>
            </div>
          </form>
        </div>
        <p className="mt-6 text-sm font-normal text-center text-gray-500 dark:text-gray-400 font-pj">
          Sin anuncios. Sin spam. Sin compromisos.
        </p>
      </div>
    </section>
  );
};

export default Contact;
