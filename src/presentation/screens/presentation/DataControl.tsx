import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const DataControl = () => {
  return (
    <section className="relative py-10 sm:py-16 lg:py-24">
      <div className="max-w-7xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="grid items-center grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-20">
          <div>
            {/* Badge Superior */ }
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-green-500/20 border border-green-200/50 dark:border-green-700/50 backdrop-blur-sm">
              <ShieldCheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Control Total
              </span>
            </div>

            <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl dark:dark:text-gray-100">
              Tú tienes el control de tus datos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-900 dark:dark:text-gray-100">
              En EstateAdmin creemos que tus datos te pertenecen. Te
              proporcionamos herramientas flexibles para que accedas y exportes
              tu información cuando lo necesites, en el formato que prefieras.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start">
                <DocumentTextIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Exportación a PDF
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:text-gray-100">
                    Exporta estados de cuenta, recibos de pago y reportes en
                    formato PDF para conservar un registro detallado de toda tu
                    actividad.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <ArrowDownTrayIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Descarga en Excel
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-100">
                    Genera reportes en formato Excel para analizar tendencias,
                    gastos y pagos de manera detallada y personalizada.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <QrCodeIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Códigos QR
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-100">
                    Genera rápidamente códigos QR de pagos no identificados y
                    compártelos con los residentes para que puedan
                    identificarlos fácilmente.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <EnvelopeIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Notificaciones por correo
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-100">
                    Filtra y recibe recibos y comprobantes de pago directamente
                    en tu correo electrónico, manteniendo un registro organizado
                    de todas tus transacciones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pl-20 pr-6 sm:pl-6 md:px-0">
            <div className="relative w-full max-w-xs mt-4 mb-10 ml-auto">
              <img
                className="ml-auto rounded-lg"
                style={ {
                  filter:
                    "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                } }
                src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1771035690/asset10_kf8320_seive0.svg"
                alt="Control de datos"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
              <div className="absolute -bottom-10 -left-16 rounded-lg">
                <div className="bg-indigo-600 rounded-lg">
                  <div className="px-8 py-10">
                    <span className="block text-4xl font-bold text-white lg:text-5xl">
                      100%
                    </span>
                    <span className="block mt-2 text-base leading-tight text-white">
                      Control total
                      <br />
                      de tus datos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataControl;
