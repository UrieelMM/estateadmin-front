import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dialog } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  CheckBadgeIcon,
  DevicePhoneMobileIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import {
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import logo from "../../../assets/logo.png";
import Footer from "./Footer";
import { getSeoExperimentCopy } from "../../seo/seoExperiments";

const navigation = [
  { name: "Características", href: "#features" },
  { name: "¿Cómo funciona?", href: "#how-it-works" },
  { name: "Para administradores", href: "#admin" },
  { name: "Para el personal", href: "#staff" },
  { name: "Contacto", href: "/contacto" },
];

const appFeatures = [
  {
    id: "tickets",
    icon: ClipboardDocumentListIcon,
    color: "indigo",
    title: "Gestión de Tickets",
    subtitle: "Órdenes de trabajo en la palma de tu mano",
    description:
      "El personal de mantenimiento recibe y gestiona todas sus órdenes de trabajo desde la app. Visualiza tickets asignados con estado, prioridad y descripción detallada. Filtra por estado (abierto, en progreso, cerrado) para enfocarse en lo más urgente.",
    highlights: [
      "Vista de todos los tickets asignados",
      "Filtros por estado y prioridad",
      "Historial completo de cada ticket",
      "Actualización de estado en tiempo real",
    ],
    badge: "Core",
  },
  {
    id: "inventory",
    icon: CubeIcon,
    color: "emerald",
    title: "Control de Inventario",
    subtitle: "Materiales y recursos siempre bajo control",
    description:
      "Consulta y actualiza el inventario de materiales directamente desde el campo. Visualiza alertas de stock bajo, filtra por tipo de material y registra el uso de recursos en cada trabajo. El administrador puede monitorear en tiempo real desde el dashboard.",
    highlights: [
      "Consulta de stock en tiempo real",
      "Alertas de stock bajo",
      "Actualización de cantidades desde campo",
      "Historial de movimientos por artículo",
    ],
    badge: "Inventario",
  },
  {
    id: "reports",
    icon: ChartBarIcon,
    color: "blue",
    title: "Reportes desde Campo",
    subtitle: "Documenta cada trabajo con detalle",
    description:
      "Crea y envía reportes de mantenimiento directamente desde el sitio de trabajo. Adjunta evidencia fotográfica, describe el trabajo realizado y registra materiales utilizados. Los reportes quedan disponibles de inmediato en el dashboard del administrador.",
    highlights: [
      "Creación de reportes desde campo",
      "Adjuntar evidencia fotográfica",
      "Filtros por fecha y tipo de reporte",
      "Vista de estadísticas de trabajo",
    ],
    badge: "Reportes",
  },
  {
    id: "scheduled",
    icon: ClockIcon,
    color: "purple",
    title: "Mantenimiento Programado",
    subtitle: "Nunca pierdas una tarea planificada",
    description:
      "Accede a todas las tareas de mantenimiento preventivo programadas. Consulta fechas, ubicaciones y especificaciones de cada tarea. Registra la ejecución y marca como completada para mantener el historial de mantenimiento del condominio.",
    highlights: [
      "Vista de calendario de tareas",
      "Detalle de cada actividad programada",
      "Registro de ejecución y notas",
      "Historial de mantenimiento preventivo",
    ],
    badge: "Planificación",
  },
  {
    id: "performance",
    icon: BoltIcon,
    color: "yellow",
    title: "Rendimiento Personal",
    subtitle: "Métricas claras de tu desempeño",
    description:
      "Cada técnico puede visualizar su propio desempeño: tickets resueltos, tiempo promedio de resolución y tasa de éxito. Esta transparencia fomenta la mejora continua y permite a los administradores reconocer el trabajo bien hecho.",
    highlights: [
      "Tickets resueltos en el período",
      "Tiempo promedio de resolución",
      "Comparativo con semanas anteriores",
      "Estadísticas por tipo de trabajo",
    ],
    badge: "Analítica",
  },
  {
    id: "multicondominium",
    icon: BuildingOffice2Icon,
    color: "rose",
    title: "Multi-Condominio",
    subtitle: "Un técnico, múltiples propiedades",
    description:
      "El personal de mantenimiento puede estar asignado a múltiples condominios. Desde un selector intuitivo, cambia rápidamente entre propiedades para ver los tickets e inventario correspondientes a cada una.",
    highlights: [
      "Gestión de múltiples condominios",
      "Cambio rápido entre propiedades",
      "Tickets separados por condominio",
      "Inventario independiente por propiedad",
    ],
    badge: "Flexibilidad",
  },
];

const adminFeatures = [
  {
    icon: ClipboardDocumentListIcon,
    title: "Asignación de Tickets",
    description:
      "Crea y asigna tickets de mantenimiento al personal desde el dashboard. Define prioridad, categoría, descripción y adjunta imágenes del problema.",
  },
  {
    icon: ChartBarIcon,
    title: "Métricas en Tiempo Real",
    description:
      "Visualiza el estado de todos los tickets: abiertos, en progreso y cerrados. Analiza tiempos de resolución y desempeño del equipo.",
  },
  {
    icon: CubeIcon,
    title: "Gestión de Inventario",
    description:
      "Administra el inventario desde el dashboard: agrega artículos, define stock mínimo y monitorea el uso del personal de campo.",
  },
  {
    icon: ArrowPathIcon,
    title: "Seguimiento Completo",
    description:
      "Cada acción del personal queda registrada. Desde el primer cambio de estado hasta el cierre del ticket con evidencias fotográficas.",
  },
];

const howItWorksSteps = [
  {
    number: "01",
    actor: "Administrador",
    action: "Crea el ticket",
    detail:
      "El administrador detecta un problema o recibe una solicitud de mantenimiento. Crea el ticket en el dashboard con descripción, prioridad y categoría.",
    color: "indigo",
  },
  {
    number: "02",
    actor: "Administrador",
    action: "Asigna al personal",
    detail:
      "El ticket se asigna al técnico correspondiente según disponibilidad y especialidad. El personal recibe la asignación de inmediato en la app.",
    color: "purple",
  },
  {
    number: "03",
    actor: "Personal",
    action: "Recibe y acepta",
    detail:
      'El técnico ve el nuevo ticket en su app, revisa los detalles y cambia el estado a "En progreso" al comenzar el trabajo.',
    color: "blue",
  },
  {
    number: "04",
    actor: "Personal",
    action: "Ejecuta y documenta",
    detail:
      "Durante el trabajo, el técnico consulta el inventario, usa los materiales necesarios y crea un reporte con evidencia fotográfica.",
    color: "cyan",
  },
  {
    number: "05",
    actor: "Personal",
    action: "Cierra el ticket",
    detail:
      'Al concluir, el técnico marca el ticket como "Cerrado" y adjunta el reporte final. El historial queda registrado permanentemente.',
    color: "green",
  },
  {
    number: "06",
    actor: "Administrador",
    action: "Analiza métricas",
    detail:
      "El administrador revisa el dashboard de mantenimiento con tiempos de resolución, costos y desempeño del equipo.",
    color: "emerald",
  },
];

const stats = [
  { value: "100%", label: "Trazabilidad de tickets" },
  { value: "< 2 min", label: "Para crear y asignar un ticket" },
  { value: "iOS & Android", label: "Disponible en ambas plataformas" },
  { value: "Tiempo real", label: "Sincronización con el dashboard" },
];

const colorMap: Record<
  string,
  { bg: string; text: string; border: string; badge: string; num: string }
> = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    badge:
      "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
    num: "bg-indigo-600",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    num: "bg-emerald-600",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    num: "bg-blue-600",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    badge:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    num: "bg-purple-600",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    badge:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    num: "bg-yellow-500",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    num: "bg-rose-600",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    badge: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    num: "bg-cyan-600",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    badge:
      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    num: "bg-green-600",
  },
};

const MaintenanceAppLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      try {
        setIsScrolled(window.scrollY > 20);
      } catch {
        setIsScrolled(false);
      }
    };
    try {
      window.addEventListener("scroll", handleScroll);
    } catch {
      // silently fail
    }
    return () => {
      try {
        window.removeEventListener("scroll", handleScroll);
      } catch {
        // silently fail
      }
    };
  }, []);

  const seoCopy = getSeoExperimentCopy("maintenance-app");
  const pageUrl = "https://estate-admin.com/app-mantenimiento";
  const pageTitle = seoCopy.title;
  const pageDescription = seoCopy.description;
  const pageKeywords = seoCopy.keywords;
  const pageImage =
    "https://res.cloudinary.com/dz5tntwl1/image/upload/v1771019512/ligh_mgf0tg.webp";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://estate-admin.com",
      },
      { "@type": "ListItem", position: 2, name: "EstateFix", item: pageUrl },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "EstateFix por EstateAdmin",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    url: pageUrl,
    description: pageDescription,
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo accede el personal a EstateFix?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El administrador habilita el acceso desde el dashboard de EstateAdmin. El personal descarga la app en iOS o Android e inicia sesión con las credenciales proporcionadas.",
        },
      },
      {
        "@type": "Question",
        name: "¿El personal puede ver todos los tickets del condominio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Cada técnico solo ve los tickets que le han sido asignados específicamente por el administrador, garantizando privacidad y foco en sus responsabilidades.",
        },
      },
      {
        "@type": "Question",
        name: "¿La app funciona sin conexión a internet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La app requiere conexión para sincronizar datos con el servidor. Sin embargo, puede consultar información previamente cargada mientras obtiene conectividad.",
        },
      },
    ],
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    if (href.startsWith("#")) {
      try {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          setMobileMenuOpen(false);
        }
      } catch {
        // silently fail
      }
    } else {
      try {
        window.location.href = href;
      } catch {
        // silently fail
      }
    }
  };

  return (
    <div className="relative isolate bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Background grid */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-300 dark:bg-indigo-400 opacity-[0.11] blur-[100px]" />
      </div>

      {/* Animated gradient blob */}
      <div className="fixed inset-x-0 -top-40 opacity-70 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            animationDuration: "8s",
          }}
        />
      </div>

      <Helmet>
        <title>{pageTitle}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="author" content="EstateAdmin" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta name="theme-color" content="#4F46E5" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareSchema)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* ─── HEADER ─── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav
          className="flex items-center justify-between p-4 lg:px-8"
          aria-label="Global"
        >
          <div className="flex items-center gap-3 lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <img
                className="h-8 w-auto"
                src={logo}
                alt="EstateAdmin Logo"
                loading="eager"
              />
            </Link>
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeftIcon className="h-3 w-3" />
              Volver al inicio
            </Link>
          </div>

          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="hidden lg:flex lg:gap-x-10">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
            <button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5">
                <SunIcon
                  className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${
                    !isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-180 scale-75"
                  }`}
                />
                <MoonIcon
                  className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${
                    isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 -rotate-180 scale-75"
                  }`}
                />
              </div>
            </button>
            <a
              href="/contacto"
              className="text-sm font-semibold leading-6 bg-indigo-600 px-4 py-2 rounded-md text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
            >
              Solicitar demo <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>

        {/* Mobile menu */}
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-700/50">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5">
                <img
                  className="h-8 w-auto"
                  src={logo}
                  alt="EstateAdmin Logo"
                  loading="eager"
                />
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6 space-y-2">
                  <button
                    onClick={toggleDarkMode}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"
                  >
                    <div className="relative w-5 h-5">
                      <SunIcon
                        className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 ${
                          !isDarkMode ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <MoonIcon
                        className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 ${
                          isDarkMode ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                    <span>{isDarkMode ? "Modo Oscuro" : "Modo Claro"}</span>
                  </button>
                  <a
                    href="/contacto"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Solicitar demo →
                  </a>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative px-6 pt-32 pb-16 lg:pt-36 lg:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 border border-indigo-200/60 dark:border-indigo-700/50">
              <DevicePhoneMobileIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                EstateFix · iOS & Android
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                EstateFix
              </span>{" "}
              — la app que transforma la operación diaria de tu condominio
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-2xl">
              <strong className="text-gray-900 dark:text-white">
                EstateFix
              </strong>{" "}
              es la app móvil de EstateAdmin para el personal de campo. Gestiona
              tickets asignados, controla inventario y crea reportes
              directamente desde el celular — sincronizado en tiempo real con el
              dashboard del administrador.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/contacto"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
              >
                Solicitar acceso
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, "#features")}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
              >
                Ver funcionalidades
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                <span>Sincronización en tiempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
                <span>Acceso controlado por el administrador</span>
              </div>
              <div className="flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5 text-blue-500" />
                <span>Pensada para el campo</span>
              </div>
            </div>

            {/* Pricing pill */}
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
              <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  $99{" "}
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    / mes
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Costo adicional al plan de administración EstateAdmin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phone mockup decoration */}
        <div className="hidden lg:block absolute right-8 xl:right-16 top-16 bottom-0 w-80 xl:w-[460px]">
          <div className="sticky top-24">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dz5tntwl1/image/upload/v1776137970/mockup_uukrb4.png"
                alt="EstateFix app móvil - pantalla de gestión de tickets"
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="eager"
              />
              {/* Glow */}
              <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-pink-600/15 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 sm:py-16 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {stat.value}
                </dt>
                <dd className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── TWO PERSPECTIVES ─── */}
      <section className="py-16 sm:py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Dos perspectivas, un ecosistema
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              El administrador coordina desde el dashboard web y el personal
              opera desde <strong>EstateFix</strong>. Todo conectado en tiempo
              real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Admin card */}
            <div
              id="admin"
              className="relative overflow-hidden rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 sm:p-8"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                  <ChartBarIcon className="h-4 w-4" />
                  Para el Administrador
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Coordina y supervisa desde el Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Desde el panel web de EstateAdmin, el administrador tiene
                  control total sobre la operación de mantenimiento sin salir
                  del escritorio.
                </p>
                <ul className="space-y-3">
                  {adminFeatures.map((feature) => (
                    <li key={feature.title} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center">
                        <feature.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {feature.title}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Staff card */}
            <div
              id="staff"
              className="relative overflow-hidden rounded-2xl border border-violet-200/60 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/40 p-6 sm:p-8"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-sm font-semibold">
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  Para el Personal de Campo
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Opera y resuelve desde{" "}
                  <span className="text-violet-600 dark:text-violet-400">
                    EstateFix
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  La app pone toda la información necesaria en manos del
                  técnico. Sin papeles, sin llamadas innecesarias, sin demoras.
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      label: "Ver tickets asignados al instante",
                      desc: "Con todos los detalles: descripción, ubicación, prioridad e historial.",
                    },
                    {
                      label: "Actualizar el estado del trabajo",
                      desc: "Cambia de 'Abierto' a 'En progreso' y 'Cerrado' con un toque.",
                    },
                    {
                      label: "Consultar y actualizar inventario",
                      desc: "Verifica disponibilidad y registra uso de materiales en campo.",
                    },
                    {
                      label: "Crear reportes con evidencia",
                      desc: "Documenta el trabajo realizado con fotos y notas detalladas.",
                    },
                  ].map((item) => (
                    <li key={item.label} className="flex gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {item.label}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="features"
        className="py-16 sm:py-24 px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-800/20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800">
              <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                Funcionalidades
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que el personal necesita
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Cada módulo fue diseñado pensando en el técnico de campo: rápido,
              claro y sin complejidades innecesarias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {appFeatures.map((feature) => {
              const colors = colorMap[feature.color] || colorMap.indigo;
              return (
                <div
                  key={feature.id}
                  className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-white dark:bg-gray-800/60 p-6 sm:p-7 hover:shadow-lg transition-all duration-300 group`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                    >
                      <feature.icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className={`text-xs font-semibold ${colors.text} mb-3`}>
                    {feature.subtitle}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircleIcon
                          className={`h-4 w-4 flex-shrink-0 ${colors.text}`}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-16 sm:py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800">
              <ArrowPathIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                Flujo de trabajo
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Desde que se detecta un problema hasta que se resuelve y
              documenta. Un flujo ágil y trazable de principio a fin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {howItWorksSteps.map((step) => {
              const colors = colorMap[step.color] || colorMap.indigo;
              return (
                <div
                  key={step.number}
                  className="relative bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${colors.num} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white font-black text-sm">
                        {step.number}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}
                    >
                      {step.actor}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                    {step.action}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-16 sm:py-20 px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-800/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800">
                <CheckBadgeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Beneficios clave
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Con EstateFix: más rápido,
                <br />
                mejor documentado
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                La combinación del dashboard de administración y EstateFix
                elimina el caos operativo y reduce los tiempos de resolución
                significativamente.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: BoltIcon,
                    title: "Resolución más rápida",
                    desc: "El personal recibe la asignación al instante y tiene toda la información para actuar.",
                    color: "text-yellow-500",
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: "Trazabilidad completa",
                    desc: "Cada acción queda registrada con fecha, hora y responsable. Sin zonas grises.",
                    color: "text-indigo-500",
                  },
                  {
                    icon: ChartBarIcon,
                    title: "Métricas accionables",
                    desc: "Identifica cuellos de botella, técnicos con mejor desempeño y tipos de problemas más recurrentes.",
                    color: "text-blue-500",
                  },
                  {
                    icon: DevicePhoneMobileIcon,
                    title: "Cero papel",
                    desc: "Los reportes, evidencias y actualizaciones son 100% digitales y accesibles desde cualquier lugar.",
                    color: "text-emerald-500",
                  },
                ].map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                      <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  Icon: ClipboardDocumentListIcon,
                  iconClass: "text-indigo-600 dark:text-indigo-400",
                  iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
                  value: "Tickets",
                  label: "Órdenes de trabajo asignadas",
                  bg: "from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",
                  border: "border-indigo-200 dark:border-indigo-700",
                },
                {
                  Icon: CubeIcon,
                  iconClass: "text-emerald-600 dark:text-emerald-400",
                  iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
                  value: "Inventario",
                  label: "Materiales disponibles en tiempo real",
                  bg: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30",
                  border: "border-emerald-200 dark:border-emerald-700",
                },
                {
                  Icon: DocumentTextIcon,
                  iconClass: "text-blue-600 dark:text-blue-400",
                  iconBg: "bg-blue-100 dark:bg-blue-900/40",
                  value: "Reportes",
                  label: "Documentación de trabajos realizados",
                  bg: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
                  border: "border-blue-200 dark:border-blue-700",
                },
                {
                  Icon: CalendarDaysIcon,
                  iconClass: "text-purple-600 dark:text-purple-400",
                  iconBg: "bg-purple-100 dark:bg-purple-900/40",
                  value: "Programados",
                  label: "Tareas de mantenimiento preventivo",
                  bg: "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
                  border: "border-purple-200 dark:border-purple-700",
                },
              ].map((card) => {
                const CardIcon = card.Icon;
                return (
                  <div
                    key={card.value}
                    className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 sm:p-6 flex flex-col gap-3`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    >
                      <CardIcon className={`h-5 w-5 ${card.iconClass}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        {card.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {card.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 sm:py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Todo lo que necesitas saber sobre EstateFix.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "¿Cómo accede el personal al App?",
                a: "El administrador habilita el acceso desde el dashboard de EstateAdmin. El personal descarga la app en iOS o Android e inicia sesión con las credenciales proporcionadas por el administrador.",
              },
              {
                q: "¿El personal puede ver todos los tickets?",
                a: "No. Cada técnico solo ve los tickets que le han sido asignados específicamente. Esto garantiza privacidad, foco y que cada quien sea responsable de su área de trabajo.",
              },
              {
                q: "¿Se puede usar en múltiples condominios?",
                a: "Sí. Un técnico puede estar asignado a varios condominios. Desde la app puede cambiar entre propiedades con un simple selector para ver los tickets e inventario de cada una.",
              },
              {
                q: "¿Los datos se sincronizan automáticamente?",
                a: "Sí. Todo lo que el técnico registra en la app aparece de inmediato en el dashboard del administrador. No hay pasos manuales de sincronización.",
              },
              {
                q: "¿Cuánto cuesta EstateFix?",
                a: "EstateFix tiene un costo de $99 MXN al mes. Este precio es adicional al plan de administración EstateAdmin que ya tengas contratado. Contáctanos para activarlo en tu cuenta.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {item.q}
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-300 group-open:rotate-90 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-12 lg:p-16 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <DevicePhoneMobileIcon className="h-14 w-14 text-white/80 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                Activa EstateFix
                <br />
                en tu condominio hoy
              </h2>
              <p className="text-lg text-white/80 mb-6 max-w-xl mx-auto">
                Da a tu personal la herramienta que necesita para trabajar más
                rápido y mejor documentado.
              </p>
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/15 border border-white/25 mb-8">
                <CurrencyDollarIcon className="h-6 w-6 text-white/80" />
                <div className="text-left">
                  <p className="text-white font-black text-lg leading-none">
                    $99{" "}
                    <span className="font-semibold text-sm text-white/80">
                      / mes
                    </span>
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    Adicional al plan de administración
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-white text-indigo-600 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:shadow-xl"
                >
                  Solicitar acceso
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white/90 border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Ver todo EstateAdmin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MaintenanceAppLanding;
