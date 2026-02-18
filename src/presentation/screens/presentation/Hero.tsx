import { useState } from "react";
import { Dialog } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  CheckBadgeIcon,
  BoltIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { useLocalDarkMode } from "../../../hooks/useLocalDarkMode";
import { Helmet } from "react-helmet-async";
import logo from "../../../assets/logo.png";
import Footer from "./Footer";
import Contact from "./Contact";
import FeatureCards from "./FeatureCards";
import FinancialDetails from "./FinancialDetails";
import ProjectDetails from "./ProjectDetails";
import AreaReservation from "./AreaReservation";
import DataControl from "./DataControl";
import MaintenanceTickets from "./MaintenanceTickets";
import FeatureDetails from "./FeatureDetails";

const navigation = [
  { name: "Características", href: "#features" },
  { name: "Sobre nosotros", href: "/sobre-nosotros" },
  { name: "Contacto", href: "/contacto" },
];

const Hero = () => {
  const [ mobileMenuOpen, setMobileMenuOpen ] = useState( false );
  const { isDarkMode, toggleDarkMode } = useLocalDarkMode();

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();

    // Si es un enlace interno (inicia con #), hacer scroll
    if ( href.startsWith( "#" ) ) {
      const element = document.querySelector( href );
      if ( element ) {
        element.scrollIntoView( { behavior: "smooth" } );
        setMobileMenuOpen( false );
      }
    } else {
      // Si es un enlace externo (no inicia con #), navegar a esa URL
      window.location.href = href;
    }
  };

  return (
    <div className="relative isolate bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Grid Pattern Background - Global para toda la landing */ }
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 dark:bg-indigo-600 opacity-20 blur-[100px]"></div>
      </div>

      {/* Animated Gradient Blobs - Global */ }
      <div className="fixed inset-x-0 -top-40 opacity-90 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-slow-pulse"
          style={ {
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          } }
        />
      </div>

      <Helmet>
        <title>EstateAdmin - Sistema de Gestión de Condominios</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="EstateAdmin es una plataforma integral para la gestión de condominios. Administra pagos, mantenimiento, comunicación y más de manera eficiente."
        />
        <meta
          name="keywords"
          content="gestión de condominios, administración de condominios, sistema de pagos, mantenimiento de edificios, comunicación vecinal, software de administración, gestión de propiedades, administración de edificios"
        />
        <meta name="author" content="EstateAdmin" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta name="revisit-after" content="7 days" />
        <meta name="theme-color" content="#4F46E5" />

        {/* Open Graph / Facebook */ }
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://estate-admin.com" />
        <meta
          property="og:title"
          content="EstateAdmin - Sistema de Gestión de Condominios"
        />
        <meta
          property="og:description"
          content="Plataforma integral para la gestión eficiente de condominios. Administra pagos, mantenimiento y comunicación."
        />
        <meta property="og:image" content={ logo } />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */ }
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://estate-admin.com" />
        <meta
          name="twitter:title"
          content="EstateAdmin - Sistema de Gestión de Condominios"
        />
        <meta
          name="twitter:description"
          content="Plataforma integral para la gestión eficiente de condominios."
        />
        <meta name="twitter:image" content={ logo } />
        <meta name="twitter:creator" content="@estateadmin" />

        {/* WhatsApp Business */ }
        <meta
          property="business:contact_data:street_address"
          content="43815 Guerreo Tizayuca Hidalgo, México"
        />
        <meta
          property="business:contact_data:email"
          content="info@estate-admin.com"
        />
        <meta property="business:contact_data:phone" content="+527711953837" />
        <meta
          property="business:contact_data:website"
          content="https://estate-admin.com"
        />
        <meta
          property="business:contact_data:category"
          content="Software de Administración"
        />
        <meta
          property="business:contact_data:description"
          content="Sistema integral para la gestión de condominios"
        />

        {/* Favicon */ }
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Canonical URL */ }
        <link rel="canonical" href="https://estate-admin.com" />
      </Helmet>

      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <img
                className="h-8 w-auto"
                src={ logo }
                alt="EstateAdmin Logo"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-100"
              onClick={ () => setMobileMenuOpen( true ) }
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            { navigation.map( ( item ) => (
              <a
                key={ item.name }
                href={ item.href }
                onClick={ ( e ) => handleScroll( e, item.href ) }
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                { item.name }
              </a>
            ) ) }
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
            {/* Theme Toggle Button */ }
            <button
              onClick={ toggleDarkMode }
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5">
                {/* Sol icon */ }
                <SunIcon
                  className={ `absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${ !isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-180 scale-75"
                    }` }
                />
                {/* Luna icon */ }
                <MoonIcon
                  className={ `absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${ isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 -rotate-180 scale-75"
                    }` }
                />
              </div>
            </button>
            <a
              href="/login"
              className="text-sm font-semibold leading-6 bg-indigo-600 px-4 py-2 rounded-md text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
            >
              Inicia sesión <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
        <Dialog
          as="div"
          className="lg:hidden"
          open={ mobileMenuOpen }
          onClose={ setMobileMenuOpen }
        >
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-700/50">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <img
                  className="h-8 w-auto"
                  src={ logo }
                  alt="EstateAdmin Logo"
                  loading="eager"
                  decoding="async"
                />
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-100"
                onClick={ () => setMobileMenuOpen( false ) }
              >
                <span className="sr-only">Cerrar menú</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  { navigation.map( ( item ) => (
                    <a
                      key={ item.name }
                      href={ item.href }
                      onClick={ ( e ) => handleScroll( e, item.href ) }
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      { item.name }
                    </a>
                  ) ) }
                </div>
                <div className="py-6 space-y-2">
                  {/* Theme Toggle Button Mobile */ }
                  <button
                    onClick={ toggleDarkMode }
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"
                  >
                    <div className="relative w-5 h-5">
                      <SunIcon
                        className={ `absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-500 transform ${ !isDarkMode
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 rotate-180 scale-75"
                          }` }
                      />
                      <MoonIcon
                        className={ `absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-500 transform ${ isDarkMode
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-180 scale-75"
                          }` }
                      />
                    </div>
                    <span>{ isDarkMode ? "Modo Oscuro" : "Modo Claro" }</span>
                  </button>
                  <a
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Iniciar sesión
                  </a>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      <div className="relative px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-[1920px] py-24 sm:py-32 lg:pt-56 lg:pb-4">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative rounded-full px-4 py-2 text-sm leading-6 bg-white dark:bg-gray-800 ring-1 ring-gray-900/10 dark:ring-gray-700/50 hover:ring-gray-900/20 dark:hover:ring-gray-600/50 transition-all">
                <SparklesIcon className="inline h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                <span className="text-gray-600 dark:text-gray-100">
                  Sistema Integral de Gestión de Condominios
                </span>
                <a
                  href="#features"
                  onClick={ ( e ) => handleScroll( e, "#features" ) }
                  className="font-semibold text-indigo-600 dark:text-indigo-400 ml-1 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  Conoce más <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
          <div className="text-center relative">
            {/* Main Title with Gradient */ }
            <div className="relative inline-block">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                  EstateAdmin
                </span>
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg blur-2xl opacity-20 group-hover:opacity-30 -z-10"></div>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-4 mb-6">
              Tecnología que une y{ " " }
              <br className="hidden sm:block" /> cuentas que cuadran
            </h2>

            <p className="mt-8 text-lg md:text-xl leading-8 text-gray-600 dark:text-gray-100 max-w-3xl mx-auto">
              Simplifica la administración de tu condominio con nuestra
              plataforma integral.
              <br className="hidden sm:block" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Gestiona pagos, mantenimiento, comunicación
              </span>{ " " }
              y más de manera eficiente y segura.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <a
                href="/contacto"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 "
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative flex items-center gap-2">
                  Comenzar ahora
                </span>
              </a>
              <a
                href="#features"
                onClick={ ( e ) => handleScroll( e, "#features" ) }
                className="group inline-flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Ver características
                <span
                  className="inline-block transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            </div>
            <div className="mt-8">
              <a
                href="/caracteristicas-inteligencia-artificial"
                className="group relative inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-full transition-all duration-300 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 "
              >
                <SparklesIcon className="h-4 w-4 animate-pulse" />
                <span>Conoce en lo que hemos estado trabajando para ti</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>

            {/* Trust Indicators */ }
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                <span>Seguro y Confiable</span>
              </div>
              <div className="flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-yellow-500" />
                <span>Rápido y Eficiente</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                <span>Fácil de Usar</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] via-[#9c80ff] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-pulse"
            style={ {
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              animationDuration: "4s",
            } }
          />
        </div>
      </div>
      <FeatureCards />
      <FinancialDetails />
      <ProjectDetails />
      <AreaReservation />
      <MaintenanceTickets />
      <DataControl />
      <FeatureDetails />
      <Contact />
      <Footer />
    </div>
  );
};

export default Hero;
