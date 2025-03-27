const Contact = () => {
  return (
    <section className="py-12 bg-transparent sm:py-16 lg:py-20" id="contact">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 font-pj">
            ¿Listo para transformar la gestión de tu condominio?{" "}
            <span className="text-4xl font-bold tracking-tight text-indigo-600">
              EstateAdmin
            </span>
          </h2>
          <p className="max-w-md mx-auto mt-5 text-base font-normal text-gray-600 font-pj">
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
                  "linear-gradient(90deg, #44ff9a -0.55%, #44b0ff 22.86%, #8b44ff 48.36%, #ff6644 73.33%, #ebff70 99.34%)",
              }}
            ></div>
          </div>

          <form action="#" method="POST" className="relative">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Ingresa tu correo electrónico"
              className="block w-full px-5 py-6 text-base font-normal text-gray-800 placeholder-gray-600 bg-white border border-gray-300 rounded-xl focus:border-indigo-300 font-pj focus:outline-none"
              required
            />

            <div className="mt-4 sm:mt-0 sm:absolute sm:inset-y-0 sm:right-0 sm:flex sm:items-center sm:pr-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center w-full px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-indigo-600 border border-transparent sm:w-auto sm:py-3 focus:outline-none font-pj hover:bg-indigo-700 rounded-xl"
              >
                Solicitar demo
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              WhatsApp Business
            </h3>
            <p className="mt-2 text-gray-600">
              <a
                href="https://wa.me/TUNUMERO"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Chatea con nosotros
              </a>
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Email</h3>
            <p className="mt-2 text-gray-600">
              <a
                href="mailto:contacto@estateadmin.com"
                className="text-indigo-600 hover:text-indigo-700"
              >
                administraction@estate-admin.com
              </a>
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Horario de atención
            </h3>
            <p className="mt-2 text-gray-600">
              Lunes a Viernes
              <br />
              9:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm font-normal text-center text-gray-500 font-pj">
          Sin anuncios. Sin spam. Sin compromisos.
        </p>
      </div>
    </section>
  );
};

export default Contact;
