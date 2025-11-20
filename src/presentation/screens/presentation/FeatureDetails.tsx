import { motion } from "framer-motion";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  EnvelopeIcon,
  MoonIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const FeatureDetails = () => {
  const features = [
    {
      title: "Control de ingresos y egresos",
      description:
        "Gestiona de manera eficiente todos los flujos de dinero en tu condominio. Registra ingresos por cuotas, gastos operativos y mantén un balance financiero saludable.",
      icon: CurrencyDollarIcon,
      color: "blue",
    },
    {
      title: "Reportes detallados",
      description:
        "Genera informes completos y visuales sobre la situación financiera, ocupación, uso de áreas comunes y más. Toma decisiones basadas en datos precisos y actualizados.",
      icon: ChartBarIcon,
      color: "orange",
    },
    {
      title: "Control de morosidad",
      description:
        "Seguimiento automatizado de pagos pendientes. Identificación temprana de retrasos, envío de recordatorios y generación de planes de pago para reducir la cartera vencida.",
      icon: BellAlertIcon,
      color: "green",
    },
    {
      title: "Gestión de proyectos",
      description:
        "Planifica, presupuesta y da seguimiento a proyectos de mejora para el condominio. Mantén a los residentes informados sobre el avance y resultados de cada iniciativa.",
      icon: ClipboardDocumentCheckIcon,
      color: "purple",
    },
    {
      title: "Módulo de caja chica",
      description:
        "Administra eficientemente los gastos menores del día a día. Registra movimientos, realiza arqueos y mantén un control preciso de los fondos disponibles para imprevistos.",
      icon: BanknotesIcon,
      color: "sky",
    },
    {
      title: "Tickets de mantenimiento",
      description:
        "Sistema completo para reportar, asignar y dar seguimiento a solicitudes de mantenimiento. Los residentes pueden enviar reportes y recibir actualizaciones en tiempo real.",
      icon: WrenchScrewdriverIcon,
      color: "red",
    },
    {
      title: "Automatización de reportes",
      description:
        "Configura el envío programado de informes financieros, estados de cuenta y notificaciones importantes a los miembros del comité directivo.",
      icon: EnvelopeIcon,
      color: "gray",
    },
    {
      title: "Modo oscuro y claro",
      description:
        "Adapta la interfaz a tus preferencias visuales. El modo oscuro reduce la fatiga visual durante uso nocturno, mientras el modo claro ofrece alta visibilidad durante el día.",
      icon: MoonIcon,
      color: "rose",
    },
    {
      title: "Seguridad en los datos",
      description:
        "Protección avanzada de la información mediante encriptación, autenticación de dos factores y controles de acceso por roles. Tus datos siempre están protegidos.",
      icon: ShieldCheckIcon,
      color: "lime",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "orange":
        return "text-orange-600";
      case "sky":
        return "text-sky-600";
      case "green":
        return "text-green-600";
      case "purple":
        return "text-purple-600";
      case "red":
        return "text-red-600";
      case "rose":
        return "text-rose-600";
      case "lime":
        return "text-lime-600";
      default:
        return "text-indigo-600";
    }
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24" id="features-detail">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 border border-indigo-200/50 dark:border-indigo-700/50 backdrop-blur-sm">
            <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Características Destacadas
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Características que transforman la gestión
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-100">
            EstateAdmin integra todas las herramientas que necesitas para
            administrar tu condominio de manera eficiente, transparente y
            moderna.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 md:grid-cols-3 lg:gap-y-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <div className="relative flex items-center justify-center mx-auto">
                <svg
                  className="text-indigo-50 dark:text-indigo-900/30"
                  width="72"
                  height="75"
                  viewBox="0 0 72 75"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M63.6911 28.8569C68.0911 48.8121 74.6037 61.2674 53.2349 65.9792C31.8661 70.6909 11.6224 61.2632 7.22232 41.308C2.82229 21.3528 3.6607 12.3967 25.0295 7.68503C46.3982 2.97331 59.2911 8.90171 63.6911 28.8569Z" />
                </svg>
                <feature.icon
                  className={`absolute w-10 h-10 ${getIconColor(
                    feature.color
                  )} bg-indigo-50 p-2 rounded-full`}
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="mt-4 text-base text-gray-600 dark:text-gray-100">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureDetails;
