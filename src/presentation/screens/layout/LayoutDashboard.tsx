import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowRightEndOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  Bars3Icon,
  ShieldExclamationIcon,
} from "@heroicons/react/16/solid";
import { navigation } from "./navigation";
import Navbar from "../../components/shared/Navbar";
import useAuthStore from "../../../store/AuthStore";
import useUserStore from "../../../store/UserDataStore";
import Loading from "../../components/shared/loaders/Loading";
import { auth } from "../../../firebase/firebase";
import logo from "../../../assets/logo.png";
import ChatBot from "../IA/ChatBot";
// import InitialSetupSteps from "../dashboard/InitialSetup/InitialSetupSteps";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface Props {
  children: React.ReactNode;
}

const LayoutDashboard = ({ children }: Props) => {
  const navigate = useNavigate();

  const { fetchUserData } = useUserStore((state) => ({
    user: state.user,
    fetchUserData: state.fetchUserData,
  }));
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);
  const [componentIsVisible, setComponentIsVisible] = useState(false);

  useEffect(() => {
    setLoadingSession(true);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }
    });
    setLoadingSession(false);
    setComponentIsVisible(true);
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setIsLoadingData(true);
    fetchUserData();
    setTimeout(() => {
      setIsLoadingData(false);
    }, 2500);
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  if (isLoadingData || loadingSession || !componentIsVisible) {
    return <Loading />;
  }

  if (!fetchUserData) {
    return null;
  }

  return !isLoadingData && componentIsVisible ? (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <ChatBot />
      {/* <InitialSetupSteps /> */}

      {/* Botón móvil (arriba a la izquierda) para abrir/cerrar sidebar */}
      <div className="lg:hidden px-1 py-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-600 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/*
        SIDEBAR FIJO EN PANTALLAS GRANDES
        ---------------------------------
        En dispositivos grandes, lo hacemos "fixed" para que no se mueva al hacer scroll.
      */}
      <div className="hidden lg:block">
        <aside
          className={classNames(
            "fixed inset-y-0 left-0 w-52 md:w-56 border-r border-gray-200 dark:border-gray-700 dark:bg-gray-800",
            "h-screen" // Ocupa todo el alto
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 p-4">
              <img className="h-8 w-auto" src={logo} alt="Your Company" />
            </div>

            <nav className="flex-1 flex flex-col justify-between" aria-label="Sidebar">
              <ul className="py-6 space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    {!item.children ? (
                      <Link
                        to={item.href}
                        className={classNames(
                          item.current ? "bg-indigo-100" : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                          "group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                        )}
                      >
                        <item.icon
                          className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ) : (
                      <Disclosure as="div" className="space-y-1">
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={classNames(
                                item.current
                                  ? "bg-indigo-100"
                                  : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                                "group w-full flex items-center px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-100 rounded-md focus:outline-none"
                              )}
                            >
                              <item.icon
                                className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                                aria-hidden="true"
                              />
                              {item.name}
                              <ChevronRightIcon
                                className={`${
                                  open ? "transform rotate-90" : ""
                                } ml-auto h-5 w-5 transition-transform`}
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel className="space-y-1">
                              {item.children.map((subItem) => (
                                <Link to={subItem.href} key={subItem.name}>
                                  <Disclosure.Button
                                    as="a"
                                    href={subItem.href}
                                    className="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700"
                                  >
                                    {subItem.name}
                                  </Disclosure.Button>
                                </Link>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="py-6">
                <li className="w-40 h-36 mb-8 bg-gradient-to-tr from-[#9f86f81c] to-[#746dfc17] shadow-lg flex justify-center items-center rounded-lg mx-auto">
                  <a
                    href="#"
                    className="group flex-col justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <div className="flex justify-center items-center">
                      <ShieldExclamationIcon
                        className="h-6 w-6 text-indigo-400"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs mt-2 mb-2 text-center">¿Necesitas ayuda?</p>
                    <button className="bg-indigo-400 text-xs text-center m-0 text-white rounded-md p-1">
                      <span className="block mb-0.5">Contacta a soporte</span>
                    </button>
                  </a>
                </li>
                <li>
                  <Link
                    to="/dashborad/client-config"
                    className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <Cog6ToothIcon
                      className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                      aria-hidden="true"
                    />
                    Configuración
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <ArrowRightEndOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300" />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>
      </div>

      {/*
        SIDEBAR PARA MÓVIL (usa 'fixed' también).
        Cuando isMobileMenuOpen = true, lo mostramos;
        caso contrario, se oculta a la izquierda.
      */}
      <div className="lg:hidden">
        <aside
          className={classNames(
            "fixed inset-y-0 left-0 w-52 md:w-56 border-r border-gray-200 dark:border-gray-700 dark:bg-gray-800 transform transition-transform",
            "h-screen z-50", // Para superponerse al contenido
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Botón para cerrar en móvil */}
            <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 p-4">
              <img className="h-8 w-auto" src={logo} alt="Your Company" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 dark:text-gray-400"
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col justify-between" aria-label="Sidebar">
              <ul className="py-6 space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    {!item.children ? (
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={classNames(
                          item.current ? "bg-indigo-100" : "hover:bg-indigo-100",
                          "group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                        )}
                      >
                        <item.icon
                          className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ) : (
                      <Disclosure as="div" className="space-y-1">
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={classNames(
                                item.current
                                  ? "bg-indigo-100 "
                                  : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                                "group w-full flex items-center px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-100 rounded-md focus:outline-none"
                              )}
                            >
                              <item.icon
                                className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                                aria-hidden="true"
                              />
                              {item.name}
                              <ChevronRightIcon
                                className={`${
                                  open ? "transform rotate-90" : ""
                                } ml-auto h-5 w-5 transition-transform`}
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel className="space-y-1">
                              {item.children.map((subItem) => (
                                <Link
                                  to={subItem.href}
                                  key={subItem.name}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <Disclosure.Button
                                    as="a"
                                    href={subItem.href}
                                    className="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700"
                                  >
                                    {subItem.name}
                                  </Disclosure.Button>
                                </Link>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="py-6">
                <li className="w-40 h-36 mb-8 bg-gradient-to-tr from-[#9f86f81c] to-[#746dfc17] shadow-lg flex justify-center items-center rounded-lg mx-auto">
                  <a
                    href="#"
                    className="group flex-col justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <div className="flex justify-center items-center">
                      <ShieldExclamationIcon
                        className="h-6 w-6 text-indigo-400"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs mt-2 mb-2 text-center">¿Necesitas ayudaa?</p>
                    <button className="bg-indigo-400 text-xs text-center m-0 text-white rounded-md p-1">
                      <span className="block mb-0.5">Contacta a soporte</span>
                    </button>
                    
                  </a>
                </li>
                <li>
                  <Link
                    to="/dashborad/client-config"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <Cog6ToothIcon
                      className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300"
                      aria-hidden="true"
                    />
                    Configuración
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <ArrowRightEndOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300" />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>
      </div>

      {/*
        CONTENIDO PRINCIPAL
        -------------------
        - En pantallas grandes tiene margin-left para dejar espacio al sidebar fijo.
      */}
      <div className="lg:ml-52 md:ml-56">
        <Navbar />
        <main className="p-4 bg-white dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default LayoutDashboard;
