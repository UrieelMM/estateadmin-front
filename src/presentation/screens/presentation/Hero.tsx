import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();

    // Si es un enlace interno (inicia con #), hacer scroll
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    } else {
      // Si es un enlace externo (no inicia con #), navegar a esa URL
      window.location.href = href;
    }
  };

  return (
    <div className="bg-white">
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

        {/* Open Graph / Facebook */}
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
        <meta property="og:image" content={logo} />
        <meta property="og:site_name" content="EstateAdmin" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */}
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
        <meta name="twitter:image" content={logo} />
        <meta name="twitter:creator" content="@estateadmin" />

        {/* WhatsApp Business */}
        <meta
          property="business:contact_data:street_address"
          content="43815 Guerreo Tizayuca Hidalgo, México"
        />
        <meta
          property="business:contact_data:email"
          content="administraction@estate-admin.com"
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

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://estate-admin.com" />
      </Helmet>

      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <img className="h-8 w-auto" src={logo} alt="EstateAdmin Logo" />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a
              href="/login"
              className="text-sm font-semibold leading-6 bg-indigo-600 px-4 py-2 rounded-md text-white hover:bg-indigo-700"
            >
              Inicia sesión <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <img className="h-8 w-auto" src={logo} alt="EstateAdmin Logo" />
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Cerrar menú</span>
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
                      onClick={(e) => handleScroll(e, item.href)}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                  <a
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Iniciar sesión
                  </a>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#9c80ff] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
        <div className="mx-auto max-w-[1920px] py-24 sm:py-32 lg:pt-56 lg:pb-4">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Sistema Integral de Gestión de Condominios
              <a
                href="#features"
                onClick={(e) => handleScroll(e, "#features")}
                className="font-semibold text-indigo-600 ml-1"
              >
                <span className="absolute inset-0" aria-hidden="true" />
                Conoce más <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-indigo-600 sm:text-6xl">
              EstateAdmin
            </h1>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Gestión Inteligente <br /> de Condominios
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Simplifica la administración de tu condominio con nuestra
              plataforma integral. <br />
              Gestiona pagos, mantenimiento, comunicación y más de manera
              eficiente y segura.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/contacto"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Comenzar ahora
              </a>
              <a
                href="#features"
                onClick={(e) => handleScroll(e, "#features")}
                className="text-sm font-semibold leading-6 text-gray-900 cursor-pointer"
              >
                Ver características <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="mt-6">
              <a
                href="/caracteristicas-inteligencia-artificial"
                className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-full transition-colors duration-300 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700"
              >
                Conoce en lo que hemos estado trabajando para ti
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 ml-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#9c80ff] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
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
