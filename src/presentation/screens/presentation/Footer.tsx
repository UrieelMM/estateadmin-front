import logo from "../../../assets/logo.png";

const Footer = () => {
  return (
    <footer
      className="py-12 bg-white dark:bg-gray-900 sm:py-16 lg:py-8 shadow-[0_-400px_400px_-100px_#9c80ff14] dark:shadow-[0_-400px_400px_-100px_#4c1d9514] transition-colors duration-300"
      id="about"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <img
          className="w-auto h-16 mx-auto"
          src={ logo }
          alt="EstateAdmin Logo"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />

        <ul className="flex flex-col items-center justify-center space-y-4 mt-8 sm:flex-row sm:space-y-0 sm:space-x-8 md:space-x-12 lg:space-x-16 sm:mt-14">
          <li>
            <a
              href="#features"
              title="Características"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Características
            </a>
          </li>

          <li>
            <a
              href="#about"
              title="Sobre nosotros"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Sobre nosotros
            </a>
          </li>

          <li>
            <a
              href="/contacto"
              title="Contacto"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Contacto
            </a>
          </li>

          <li>
            <a
              href="/privacidad"
              title="Política de Privacidad"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Privacidad
            </a>
          </li>

          <li>
            <a
              href="/eliminar-datos"
              title="Guía para eliminación de datos"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Eliminación de datos
            </a>
          </li>

          <li>
            <a
              href="/guias"
              title="Guía para conocer el sistema"
              className="inline-flex text-lg font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 transform font-pj hover:-translate-y-1 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Guías y tutoriales
            </a>
          </li>
        </ul>

        <div className="mt-8 sm:mt-12">
          <svg
            className="w-auto h-4 mx-auto text-gray-300 dark:text-gray-700"
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
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8 sm:mt-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              WhatsApp Bot
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              <a
                href="https://wa.me/+525633449827"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Chatea con nosotros
              </a>
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Email
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              <a
                href="mailto:info@estate-admin.com"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                info@estate-admin.com
              </a>
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Horario de atención
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Lunes a Viernes
              <br />
              9:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        <ul className="flex items-center justify-center mt-8 space-x-4 sm:space-x-6 sm:mt-12">
          <li>
            <a
              href="https://wa.me/+525633449827"
              target="_blank"
              title="WhatsApp Business"
              className="inline-flex items-center justify-center w-10 h-10 text-gray-900 dark:text-gray-100 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700"
              rel="noopener noreferrer"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </li>

          <li>
            <a
              href="https://facebook.com/estateadmin"
              target="_blank"
              title="Facebook"
              className="inline-flex items-center justify-center w-10 h-10 text-gray-900 dark:text-gray-100 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700"
              rel="noopener noreferrer"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
              </svg>
            </a>
          </li>

          <li>
            <a
              href="https://instagram.com/estateadmin"
              target="_blank"
              title="Instagram"
              className="inline-flex items-center justify-center w-10 h-10 text-gray-900 dark:text-gray-100 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700"
              rel="noopener noreferrer"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248 4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008 3.004 3.004 0 0 1 0 6.008z" />
                <circle cx="16.806" cy="7.207" r="1.078" />
                <path d="M20.533 6.111A4.605 4.605 0 0 0 17.9 3.479a6.606 6.606 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.554 6.554 0 0 0-2.184.42 4.6 4.6 0 0 0-2.633 2.632 6.585 6.585 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71 0 2.442 0 2.753.056 3.71.015.748.156 1.486.419 2.187a4.61 4.61 0 0 0 2.634 2.632 6.584 6.584 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.615 6.615 0 0 0 2.186-.419 4.613 4.613 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.581 6.581 0 0 0-.421-2.217zm-1.218 9.532a5.043 5.043 0 0 1-.311 1.688 2.987 2.987 0 0 1-1.712 1.711 4.985 4.985 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055-2.438 0-2.687 0-3.655-.055a4.96 4.96 0 0 1-1.669-.311 2.985 2.985 0 0 1-1.719-1.711 5.08 5.08 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654 0-2.437 0-2.686.053-3.655a5.038 5.038 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5.01 5.01 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a4.96 4.96 0 0 1 1.67.311 2.991 2.991 0 0 1 1.712 1.712 5.08 5.08 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655 0 2.436 0 2.698-.043 3.654h-.011z" />
              </svg>
            </a>
          </li>

          <li>
            <a
              href="https://github.com/estateadmin"
              target="_blank"
              title="GitHub"
              className="inline-flex items-center justify-center w-10 h-10 text-gray-900 dark:text-gray-100 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700"
              rel="noopener noreferrer"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
                />
              </svg>
            </a>
          </li>
        </ul>

        <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
          43815 Guerreo 11 Tizayuca Hidalgo, México
        </p>

        <p className="text-base font-normal text-center text-gray-600 dark:text-gray-400 mt-7 font-pj">
          © Copyright 2025, Todos los derechos reservados
          <br />
          Un servicio de <span className="font-bold">EstateAdmin</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
