import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalculatorIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import Footer from "./Footer";
import PublicBreadcrumb from "../../components/public/PublicBreadcrumb";
import logo from "../../../assets/logo.png";

const PLAN_BASE = 499;
const COST_PER_UNIT = 4.0;
const MIN_UNITS = 30;
const MAX_UNITS = 500;
const IVA_RATE = 0.16;

const includedFeatures = [
  "Acceso a todas las funciones de la plataforma",
  "Precio según número de unidades administradas",
  "Sin cargos ocultos ni letras pequeñas",
  "Implementación rápida desde el primer día",
  "Escalable para crecer contigo",
  "Ideal para administradores y mesas directivas",
  "Gestión financiera completa (ingresos, egresos, balance)",
  "Cobranza y seguimiento de morosidad",
  "Mantenimiento con tickets y trazabilidad",
  "Inventario y proyectos de mejora",
  "Reportes ejecutivos con Inteligencia Artificial",
  "Soporte técnico por WhatsApp y correo",
];

const faqs = [
  {
    q: "¿El precio incluye IVA?",
    a: "El precio mostrado es antes de IVA (16%). La cotización final que recibirás en tu factura incluirá el IVA correspondiente.",
  },
  {
    q: "¿Puedo cambiar el número de unidades después?",
    a: "Sí. El plan se ajusta según tus necesidades. Si el condominio crece, simplemente actualizamos el número de unidades y el costo se recalcula automáticamente.",
  },
  {
    q: "¿Qué son las 'unidades'?",
    a: "Una unidad corresponde a un departamento, casa, local o espacio habitable dentro del condominio que requiere administración.",
  },
  {
    q: "¿Existe un contrato de permanencia?",
    a: "No. El servicio es mensual y puedes cancelar en cualquier momento sin penalizaciones.",
  },
  {
    q: "¿Qué pasa si tengo más de 500 unidades?",
    a: "Para condominios con más de 500 unidades ofrecemos planes enterprise a la medida. Contáctanos para una cotización personalizada.",
  },
  {
    q: "¿Hay costo de implementación o setup?",
    a: "No. La configuración inicial y el onboarding están incluidos sin costo adicional.",
  },
];

const PricingPage = () => {
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();
  const [ units, setUnits ] = useState( 50 );
  const [ openFaq, setOpenFaq ] = useState<number | null>( null );

  const subtotal = PLAN_BASE + units * COST_PER_UNIT;
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  const formatMXN = ( value: number ) =>
    value.toLocaleString( "es-MX", { style: "currency", currency: "MXN" } );

  const pageUrl = "https://estate-admin.com/precios";
  const pageTitle = "Precios y Planes para Administración de Condominios | EstateAdmin";
  const pageDescription =
    "Planes claros para condominios de 30 a 500 unidades. Desde $599/mes + IVA. Calculadora interactiva para conocer tu tarifa exacta. Sin contratos. Sin cargos ocultos.";
  const pageKeywords =
    "precio software administracion condominio, plan condominio mexico, costo sistema condominios, cotizacion condominio, software condominio precio mensual, administracion condominio cuanto cuesta, sistema condominio precio, estateadmin precios";
  const seoImage = "https://res.cloudinary.com/dz5tntwl1/image/upload/v1771019512/ligh_mgf0tg.webp";

  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EstateAdmin",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://estate-admin.com",
    description: pageDescription,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "MXN",
      lowPrice: "599",
      highPrice: "2499",
      offerCount: "1",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "599",
        priceCurrency: "MXN",
        unitText: "MONTH",
        description: "Precio base mensual más IVA para 30 unidades",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://estate-admin.com" },
      { "@type": "ListItem", position: 2, name: "Precios", item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map( ( faq ) => ( {
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    } ) ),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Background grid */ }
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[400px] w-[400px] rounded-full bg-indigo-400 dark:bg-indigo-600 opacity-10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-400 dark:bg-purple-700 opacity-10 blur-[100px]" />
      </div>

      <Helmet>
        <title>{ pageTitle }</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={ pageDescription } />
        <meta name="keywords" content={ pageKeywords } />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta name="author" content="EstateAdmin" />
        <meta name="revisit-after" content="7 days" />
        <meta name="theme-color" content="#4F46E5" />
        {/* Open Graph */ }
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ pageUrl } />
        <meta property="og:title" content={ pageTitle } />
        <meta property="og:description" content={ pageDescription } />
        <meta property="og:image" content={ seoImage } />
        <meta property="og:image:alt" content="EstateAdmin – Planes y precios" />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />
        {/* Twitter */ }
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={ pageUrl } />
        <meta name="twitter:title" content={ pageTitle } />
        <meta name="twitter:description" content={ pageDescription } />
        <meta name="twitter:image" content={ seoImage } />
        <meta name="twitter:site" content="@estateadmin" />
        {/* Canonical */ }
        <link rel="canonical" href={ pageUrl } />
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* Structured data */ }
        <script type="application/ld+json">{ JSON.stringify( pricingSchema ) }</script>
        <script type="application/ld+json">{ JSON.stringify( breadcrumbSchema ) }</script>
        <script type="application/ld+json">{ JSON.stringify( faqSchema ) }</script>
      </Helmet>

      {/* Header */ }
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              className="h-9 w-auto transition-transform group-hover:scale-105"
              src={ logo }
              alt="EstateAdmin Logo"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
              EstateAdmin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={ toggleDarkMode }
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-700 shadow-sm"
              aria-label="Cambiar modo"
            >
              <div className="relative w-5 h-5">
                <SunIcon
                  className={ `absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${ !isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-75" }` }
                />
                <MoonIcon
                  className={ `absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${ isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-180 scale-75" }` }
                />
              </div>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al inicio</span>
            </Link>
            <a
              href="/contacto"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 rounded-lg text-white transition-colors shadow-sm"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      <PublicBreadcrumb
        items={ [ { label: "Inicio", to: "/" }, { label: "Precios" } ] }
      />

      <main>
        {/* Hero Section */ }
        <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
              <SparklesIcon className="h-4 w-4 animate-pulse" />
              Todos los montos se muestran más IVA · Sin contratos de permanencia
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                Administra mejor,
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                paga lo justo
              </span>
            </h1>

            <p className="mt-8 text-xl font-semibold text-gray-800 dark:text-gray-100">
              Un precio que crece contigo
            </p>

            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Desde condominios pequeños hasta desarrollos más grandes, nuestro esquema está diseñado para ser claro, competitivo y fácil de entender.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-8 py-4 shadow-2xl shadow-indigo-500/30">
              <CurrencyDollarIcon className="h-8 w-8 text-white opacity-80" />
              <div className="text-left">
                <div className="text-2xl font-black text-white">
                  Desde $599 <span className="text-base font-semibold opacity-80">/ mes</span>
                </div>
                <div className="text-indigo-200 text-sm font-medium">+ IVA · Acceso completo a la plataforma incluido</div>
              </div>
            </div>

            <p className="mt-5 text-xs text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              El costo mensual se calcula según el número de unidades administradas. Todos los montos que se muestran son más IVA.
            </p>
          </div>
        </section>

        {/* Value highlights */ }
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              { [
                {
                  icon: <BuildingOffice2Icon className="h-7 w-7" />,
                  label: "Capacidad",
                  value: `${ MIN_UNITS } – ${ MAX_UNITS }`,
                  sublabel: "unidades administradas por condominio",
                  color: "from-indigo-500 to-indigo-600",
                  bg: "bg-indigo-50 dark:bg-indigo-950/40",
                  border: "border-indigo-200 dark:border-indigo-800",
                  text: "text-indigo-700 dark:text-indigo-300",
                },
                {
                  icon: <ShieldCheckIcon className="h-7 w-7" />,
                  label: "Permanencia",
                  value: "Sin contrato",
                  sublabel: "Cancela cuando quieras, sin penalizaciones",
                  color: "from-purple-500 to-purple-600",
                  bg: "bg-purple-50 dark:bg-purple-950/40",
                  border: "border-purple-200 dark:border-purple-800",
                  text: "text-purple-700 dark:text-purple-300",
                },
                {
                  icon: <SparklesIcon className="h-7 w-7" />,
                  label: "Plataforma",
                  value: "Todo incluido",
                  sublabel: "Acceso completo a todos los módulos desde el día uno",
                  color: "from-pink-500 to-rose-500",
                  bg: "bg-pink-50 dark:bg-pink-950/40",
                  border: "border-pink-200 dark:border-pink-800",
                  text: "text-pink-700 dark:text-pink-300",
                },
              ].map( ( item, i ) => (
                <div
                  key={ i }
                  className={ `rounded-2xl border ${ item.border } ${ item.bg } p-6 flex flex-col items-center text-center gap-3 transition-all hover:scale-[1.02] hover:shadow-lg` }
                >
                  <div className={ `p-3 rounded-xl bg-gradient-to-br ${ item.color } text-white shadow-md` }>
                    { item.icon }
                  </div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{ item.label }</p>
                  <p className={ `text-2xl font-black ${ item.text }` }>{ item.value }</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{ item.sublabel }</p>
                </div>
              ) ) }
            </div>
          </div>
        </section>

        {/* Interactive Calculator */ }
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Glow */ }
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 animate-pulse" />

              <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-2xl">
                {/* Header bar */ }
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-7 text-center">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <CalculatorIcon className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Descubre tu precio en segundos</h2>
                  </div>
                  <p className="mt-2 text-indigo-100 text-sm max-w-xs mx-auto">
                    Ingresa el número de unidades de tu condominio y obtén una estimación inmediata de tu tarifa mensual
                  </p>
                </div>

                <div className="p-8">
                  {/* Units display */ }
                  <div className="text-center mb-8">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        { units }
                      </span>
                      <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        { units === 1 ? "unidad" : "unidades" }
                      </span>
                    </div>
                  </div>

                  {/* Slider */ }
                  <div className="mb-8">
                    <input
                      id="units-slider"
                      type="range"
                      min={ MIN_UNITS }
                      max={ MAX_UNITS }
                      value={ units }
                      onChange={ ( e ) => setUnits( Number( e.target.value ) ) }
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={ {
                        background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${ ( ( units - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100 }%, #e5e7eb ${ ( ( units - MIN_UNITS ) / ( MAX_UNITS - MIN_UNITS ) ) * 100 }%, #e5e7eb 100%)`,
                      } }
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>{ MIN_UNITS } unidades</span>
                      <span>{ MAX_UNITS } unidades</span>
                    </div>
                  </div>

                  {/* Manual input */ }
                  <div className="flex items-center gap-3 mb-8">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      O ingresa el número:
                    </label>
                    <input
                      type="number"
                      min={ MIN_UNITS }
                      max={ MAX_UNITS }
                      value={ units }
                      onChange={ ( e ) => {
                        const v = Math.min( MAX_UNITS, Math.max( MIN_UNITS, Number( e.target.value ) ) );
                        setUnits( isNaN( v ) ? MIN_UNITS : v );
                      } }
                      className="w-28 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">unidades</span>
                  </div>

                  {/* Price breakdown */ }
                  <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Acceso total a la plataforma</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{ formatMXN( PLAN_BASE ) }</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        { units } unidades × { formatMXN( COST_PER_UNIT ) }
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        { formatMXN( units * COST_PER_UNIT ) }
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{ formatMXN( subtotal ) }</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">IVA (16%)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{ formatMXN( iva ) }</span>
                    </div>
                    <div className="border-t-2 border-indigo-300 dark:border-indigo-600 pt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total mensual</span>
                      <div className="text-right">
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                          { formatMXN( total ) }
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">/ mes con IVA</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost per unit breakdown */ }
                  <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Equivale a <strong className="text-indigo-600 dark:text-indigo-400">{ formatMXN( total / units ) }</strong> por unidad al mes
                  </div>

                  {/* CTA */ }
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/contacto"
                      className="group relative flex-1 inline-flex items-center justify-center px-6 py-4 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-[1.02]"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                      <span className="relative">Contratar mi plan</span>
                    </a>
                    <a
                      href="https://wa.me/+525531139560"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-6 py-4 text-base font-bold text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                    >
                      <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Hablar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included */ }
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Incluye todo lo que necesitas
              </h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Mantenimiento, inventario, proyectos y más, en un solo lugar. Todos los planes incluyen acceso completo a la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              { includedFeatures.map( ( feature, i ) => (
                <div
                  key={ i }
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 group"
                >
                  <CheckCircleIcon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ feature }</span>
                </div>
              ) ) }
            </div>
          </div>
        </section>

        {/* Trust bar */ }
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/30 p-8">
              <p className="text-center text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
                Sin complicaciones. Sin planes confusos.
                <span className="block mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                  Un esquema claro para que sepas cuánto pagarás de acuerdo con el tamaño real de tu operación.
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                { [
                  { icon: <BoltIcon className="h-8 w-8" />, label: "Implementación rápida", sub: "Empieza a operar el mismo día" },
                  { icon: <ShieldCheckIcon className="h-8 w-8" />, label: "Sin contratos", sub: "Cancela cuando quieras, sin penalizaciones" },
                  { icon: <SparklesIcon className="h-8 w-8" />, label: "Soporte incluido", sub: "WhatsApp y correo sin costo adicional" },
                ].map( ( item, i ) => (
                  <div key={ i } className="flex flex-col items-center gap-2">
                    <div className="text-indigo-600 dark:text-indigo-400">{ item.icon }</div>
                    <p className="font-bold text-gray-900 dark:text-white">{ item.label }</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ item.sub }</p>
                  </div>
                ) ) }
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */ }
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preguntas frecuentes sobre precios</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Resolvemos las dudas más comunes sobre nuestros planes.
              </p>
            </div>

            <div className="space-y-3">
              { faqs.map( ( faq, i ) => (
                <div
                  key={ i }
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    onClick={ () => setOpenFaq( openFaq === i ? null : i ) }
                    aria-expanded={ openFaq === i }
                  >
                    <span className="font-semibold text-gray-900 dark:text-white pr-4">{ faq.q }</span>
                    <span
                      className={ `flex-shrink-0 w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${ openFaq === i ? "rotate-180" : "" }` }
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 3 } d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  { openFaq === i && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{ faq.a }</p>
                    </div>
                  ) }
                </div>
              ) ) }
            </div>
          </div>
        </section>

        {/* Final CTA */ }
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="relative text-center py-16 px-6">
                <SparklesIcon className="h-10 w-10 text-white/60 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  ¿Listo para modernizar tu condominio?
                </h2>
                <p className="mt-4 text-indigo-100 text-base max-w-xl mx-auto">
                  Únete a los condominios que ya confían en EstateAdmin para su administración diaria.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/contacto"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-xl hover:shadow-2xl hover:scale-[1.02] transform duration-200"
                  >
                    Comenzar ahora
                  </a>
                  <a
                    href="https://wa.me/+525531139560"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/30 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Hablar con un asesor
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{ `
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(99,102,241,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(99,102,241,0.7);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(99,102,241,0.5);
        }
      ` }</style>
    </div>
  );
};

export default PricingPage;
