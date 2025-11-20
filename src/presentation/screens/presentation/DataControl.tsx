import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const DataControl = () => {
  return (
    <section className="py-10 bg-transparent sm:py-16 lg:py-24">
      <div className="max-w-7xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="grid items-center grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-20">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl dark:dark:text-gray-100">
              Tú tienes el control de tus datos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-900 dark:dark:text-gray-300">
              En EstateAdmin creemos que tus datos te pertenecen. Te
              proporcionamos herramientas flexibles para que accedas y exportes
              tu información cuando lo necesites, en el formato que prefieras.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start">
                <DocumentTextIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Exportación a PDF
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-300">
                    Exporta estados de cuenta, recibos de pago y reportes en
                    formato PDF para conservar un registro detallado de toda tu
                    actividad.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <ArrowDownTrayIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Descarga en Excel
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-300">
                    Genera reportes en formato Excel para analizar tendencias,
                    gastos y pagos de manera detallada y personalizada.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <QrCodeIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Códigos QR
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-300">
                    Genera rápidamente códigos QR de pagos no identificados y
                    compártelos con los residentes para que puedan
                    identificarlos fácilmente.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <EnvelopeIcon className="flex-shrink-0 w-6 h-6 text-indigo-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notificaciones por correo
                  </h3>
                  <p className="mt-1 text-base text-gray-600 dark:dark:text-gray-300">
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
                style={{
                  filter:
                    "drop-shadow(0 0 20px rgba(68, 255, 154, 0.1)) drop-shadow(0 0 15px rgba(139, 90, 255, 0.3)) drop-shadow(0 0 15px rgba(139, 68, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 102, 68, 0.1)) drop-shadow(0 0 20px rgba(235, 255, 112, 0.1))",
                }}
                src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1744327578/OmniPixel/asset10_kf8320.svg"
                alt="Control de datos"
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
