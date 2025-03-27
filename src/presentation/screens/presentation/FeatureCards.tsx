const features = [
  {
    name: "Gestión de Pagos",
    description:
      "Sistema integral para la gestión de pagos, incluyendo cuotas de mantenimiento, cargos extraordinarios y seguimiento de saldos.",
    icon: "fa-solid fa-money-bill-wave",
  },
  {
    name: "Comunicación",
    description:
      "Plataforma interna para la comunicación entre residentes y administración, incluyendo notificaciones y anuncios.",
    icon: "fa-solid fa-comments",
  },
  {
    name: "Reservas",
    description:
      "Sistema de reservas para áreas comunes, salones de eventos y estacionamientos.",
    icon: "fa-solid fa-calendar-check",
  },
  {
    name: "Reportes",
    description:
      "Generación de reportes detallados sobre pagos, mantenimiento y estado general del condominio.",
    icon: "fa-solid fa-chart-bar",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-12 bg-gray-50 sm:py-16 lg:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center xl:max-w-2xl">
          <h2 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl xl:text-2xl font-pj">
            Mejora tu gestión con nuestras herramientas innovadoras
          </h2>
        </div>

        <div className="grid max-w-4xl grid-cols-1 mx-auto mt-8 text-center gap-y-4 sm:gap-x-8 sm:grid-cols-2 sm:mt-12 lg:mt-20 sm:text-left">
          {features.map((feature, index) => (
            <div key={index} className="space-y-4 sm:space-y-8">
              <div className="overflow-hidden bg-white shadow-md rounded-xl">
                <div className="p-9">
                  <i
                    className={`${feature.icon} w-12 h-12 mx-auto text-gray-400 sm:mx-0`}
                  ></i>
                  <h3 className="mt-8 text-2xl font-bold text-gray-900 sm:mt-20 font-pj">
                    {feature.name}
                  </h3>
                  <p className="mt-6 text-base text-gray-600 font-pj">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
