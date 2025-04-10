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
                  "linear-gradient(70deg, #818CF8 0%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #915DF4 100%)",
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
                Solicitar información
              </button>
            </div>
          </form>
        </div>
        <p className="mt-6 text-sm font-normal text-center text-gray-500 font-pj">
          Sin anuncios. Sin spam. Sin compromisos.
        </p>
      </div>
    </section>
  );
};

export default Contact;
