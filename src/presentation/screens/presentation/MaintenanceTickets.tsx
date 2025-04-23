const MaintenanceTickets = () => {
  return (
    <section className="py-12 bg-transparent sm:py-16 lg:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center xl:max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl xl:text-5xl">
            Sistema de Tickets de Mantenimiento Eficiente
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Gestiona todas las solicitudes de mantenimiento de tu condominio con
            nuestro avanzado sistema de tickets.
          </p>
        </div>

        <div className="grid max-w-4xl grid-cols-1 mx-auto mt-8 text-center gap-y-4 sm:gap-x-8 sm:grid-cols-2 sm:mt-12 lg:mt-20 sm:text-left">
          <div className="space-y-4 sm:space-y-8">
            <div className="overflow-hidden bg-white shadow-md rounded-xl">
              <div className="p-9">
                <svg
                  className="w-12 h-12 mx-auto text-indigo-500 sm:mx-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <h3 className="mt-8 text-2xl font-bold text-gray-900 sm:mt-20">
                  Seguimiento en Tiempo Real
                </h3>
                <p className="mt-6 text-base text-gray-600">
                  Mantén a los residentes informados sobre el progreso de sus
                  solicitudes. Cada actualización se registra cronológicamente,
                  creando un historial completo y transparente del servicio.
                </p>
              </div>
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
              <div className="p-9">
                <svg
                  className="w-12 h-12 mx-auto text-indigo-500 sm:mx-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-8 text-2xl font-bold text-gray-900 sm:mt-20">
                  Métricas Detalladas
                </h3>
                <p className="mt-6 text-base text-gray-600">
                  Analiza el desempeño del servicio de mantenimiento con
                  métricas clave como tiempos de respuesta, solución y
                  satisfacción. Identifica tendencias y mejora continuamente la
                  calidad del servicio.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-8">
            <div className="relative">
              <div className="absolute -inset-1">
                <div
                  className="w-full h-full rotate-180 opacity-30 blur-lg filter"
                  style={{
                    background:
                      "linear-gradient(70deg, #818CF8 0%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #915DF4 100%)",
                  }}
                ></div>
              </div>

              <div className="relative overflow-hidden bg-white shadow-md rounded-xl">
                <div className="p-9">
                  <svg
                    className="w-12 h-12 mx-auto text-indigo-500 sm:mx-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                  <h3 className="mt-8 text-2xl font-bold text-gray-900 sm:mt-20">
                    Comunicación Integrada
                  </h3>
                  <p className="mt-6 text-base text-gray-600">
                    Sistema de comunicación bidireccional que permite a los
                    residentes y administradores intercambiar información, fotos
                    y documentos relacionados con cada solicitud de
                    mantenimiento.
                  </p>
                  <p className="mt-6 text-base text-gray-600">
                    Las notificaciones automáticas mantienen a todos informados
                    sobre cada cambio de estado o actualización importante.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-white shadow-md rounded-xl">
              <div className="p-9">
                <svg
                  className="w-12 h-12 mx-auto text-indigo-500 sm:mx-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-8 text-2xl font-bold text-gray-900 sm:mt-20">
                  Gestión Eficiente
                </h3>
                <p className="mt-6 text-base text-gray-600">
                  Asigna, prioriza y categoriza tickets para optimizar recursos
                  y tiempos de respuesta. El sistema permite filtrar por
                  urgencia, tipo, estado y ubicación, facilitando la toma de
                  decisiones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaintenanceTickets;
