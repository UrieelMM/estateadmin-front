import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowLeftEndOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
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
import InitialSetupSteps from "../dashboard/InitialSetup/InitialSetupSteps";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useSyncClientPlan } from "../../../hooks/useSyncClientPlan";
import { useClientPlanStore } from "../../../store/clientPlanStore";
import SupportModal from "../../components/shared/forms/SupportModal";
import TutorialsMenu from "../../components/shared/Help/TutorialsMenu";

// Función global de diagnóstico (accesible desde la consola del navegador)
declare global {
  interface Window {
    debugClientPlan?: () => void;
    forceUpdateClientPlan?: () => void;
  }
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Animaciones ────────────────────────────────────────────────────────────
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

// Stagger para los items del nav — solo al montar
const navListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.18 } },
};
const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};
// ─────────────────────────────────────────────────────────────────────────────

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
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showInitialSetup, setShowInitialSetup] = useState<boolean | null>(
    null
  );
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useSyncClientPlan();

  // Configuramos las funciones de diagnóstico global
  useEffect(() => {
    window.debugClientPlan = () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        user.getIdTokenResult().then(() => {
          console.log("[LayoutDashboard] Usuario autenticado correctamente");
        });
      } else {
        console.log("[LayoutDashboard] No hay usuario autenticado");
      }
    };

    window.forceUpdateClientPlan = () => {
      useClientPlanStore.getState().forceUpdate();
    };

    return () => {
      // Limpiamos las funciones globales
      window.debugClientPlan = undefined;
      window.forceUpdateClientPlan = undefined;
    };
  }, []);

  // Verificar si el usuario necesita hacer la configuración inicial
  useEffect(() => {
    const checkInitialSetup = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setShowInitialSetup(false);
          return;
        }

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) {
          setShowInitialSetup(false);
          return;
        }

        const db = getFirestore();
        const configDocRef = doc(db, "clients", clientId);
        const configDoc = await getDoc(configDocRef);

        setShowInitialSetup(
          !configDoc.exists() || !configDoc.data()?.initialSetupCompleted
        );
      } catch (error) {
        console.error("Error al verificar configuración inicial:", error);
        setShowInitialSetup(false);
      }
    };

    checkInitialSetup();
  }, []);

  useEffect(() => {
    setLoadingSession(true);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }
    });
    setLoadingSession(false);
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

  // Mostrar loading mientras verificamos todo
  if (isLoadingData || loadingSession || showInitialSetup === null) {
    return <Loading />;
  }

  // Si necesita configuración inicial, mostrar solo ese componente
  if (showInitialSetup) {
    return <InitialSetupSteps />;
  }

  // Renderizar el layout normal
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-x-hidden">
      <ChatBot />
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Botón móvil (arriba a la izquierda) para abrir/cerrar sidebar */}
      <div className="xl:hidden px-1 py-4">
        <motion.button
          whileTap={{ scale: 0.88, rotate: isMobileMenuOpen ? -10 : 10 }}
          transition={SPRING}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-600 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
          )}
        </motion.button>
      </div>

      {/*
        SIDEBAR FIJO EN PANTALLAS GRANDES
        ---------------------------------
        En dispositivos grandes, lo hacemos "fixed" para que no se mueva al hacer scroll.
      */}
      <div className="hidden xl:block">
        <motion.aside
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className={classNames(
            "fixed inset-y-0 left-0 border-r bg-gray-50 border-gray-200 dark:border-gray-700 dark:bg-gray-800 z-50",
            "h-screen flex flex-col transition-all duration-300 ease-in-out",
            isDesktopMenuCollapsed ? "w-16" : "w-52 md:w-56"
          )}
        >
          {/* Header fijo */}
          <div className="flex-none h-16 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: isDesktopMenuCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className={classNames(
                "h-8 w-auto",
                isDesktopMenuCollapsed ? "hidden" : "block"
              )}
              src={logo}
              alt="EstateAdmin"
            />
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88, rotate: -15 }}
              transition={SPRING}
              onClick={() => setIsDesktopMenuCollapsed(!isDesktopMenuCollapsed)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
            >
              <span className="sr-only">Toggle menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Contenido con scroll */}
          <nav
            className="flex-1 overflow-y-auto custom-scrollbar"
            aria-label="Sidebar"
          >
            <motion.ul
              variants={navListVariants}
              initial="hidden"
              animate="show"
              className="py-6 space-y-2"
            >
              {navigation.map((item) => {
                const itemId = `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

                return (
                  <motion.li key={item.name} variants={navItemVariants}>
                    {!item.children ? (
                      <Link
                        to={item.href}
                        id={itemId}
                        className={classNames(
                          item.current
                            ? "bg-indigo-100"
                            : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                          "group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md transition-colors duration-150",
                          isDesktopMenuCollapsed ? "justify-center" : ""
                        )}
                        title={isDesktopMenuCollapsed ? item.name : undefined}
                      >
                        <item.icon
                          className={classNames(
                            "text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500 dark:group-hover:text-indigo-400",
                            isDesktopMenuCollapsed ? "h-6 w-6" : "mr-3 h-6 w-6"
                          )}
                          aria-hidden="true"
                        />
                        {!isDesktopMenuCollapsed && item.name}
                      </Link>
                    ) : (
                      <Disclosure as="div" className="space-y-1">
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              id={itemId}
                              className={classNames(
                                item.current
                                  ? "bg-indigo-100"
                                  : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                                "group w-full flex items-center px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-100 rounded-md focus:outline-none transition-colors duration-150",
                                isDesktopMenuCollapsed ? "justify-center" : ""
                              )}
                              title={isDesktopMenuCollapsed ? item.name : undefined}
                              onClick={() => {
                                if (isDesktopMenuCollapsed) {
                                  setIsDesktopMenuCollapsed(false);
                                }
                              }}
                            >
                              <item.icon
                                className={classNames(
                                  "text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500 dark:group-hover:text-indigo-400",
                                  isDesktopMenuCollapsed ? "h-6 w-6" : "mr-3 h-6 w-6"
                                )}
                                aria-hidden="true"
                              />
                              {!isDesktopMenuCollapsed && (
                                <>
                                  {item.name}
                                  <ChevronRightIcon
                                    className={classNames(
                                      "ml-auto h-5 w-5 transition-transform duration-200",
                                      open ? "rotate-90" : ""
                                    )}
                                  />
                                </>
                              )}
                            </Disclosure.Button>
                            {!isDesktopMenuCollapsed && (
                              <Disclosure.Panel className="space-y-1">
                                {item.children.map((subItem) => (
                                  <Disclosure.Button
                                    key={subItem.name}
                                    as={Link}
                                    to={subItem.href}
                                    id={`nav-sub-desktop-${subItem.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}
                                    className="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150"
                                  >
                                    {subItem.name}
                                  </Disclosure.Button>
                                ))}
                              </Disclosure.Panel>
                            )}
                          </>
                        )}
                      </Disclosure>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          {/* Footer fijo */}
          <div className="flex-none py-6">
            <ul className="space-y-2">
              <li className={classNames(
                "mx-auto",
                isDesktopMenuCollapsed ? "w-full px-2" : "w-40"
              )}>
                <TutorialsMenu collapsed={isDesktopMenuCollapsed} />
              </li>

              {/* Support widget con hover sutil */}
              <motion.li
                whileHover={{ scale: 1.03, y: -1 }}
                transition={SPRING}
                className={classNames(
                  "bg-gradient-to-tr from-[#9f86f81c] to-[#746dfc17] shadow-lg flex justify-center items-center rounded-lg mx-auto cursor-default",
                  isDesktopMenuCollapsed ? "w-12 h-12" : "w-40 h-36 mb-8"
                )}
              >
                <div
                  className={classNames(
                    "group flex-col justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md",
                    isDesktopMenuCollapsed ? "p-0" : ""
                  )}
                >
                  <div className="flex justify-center items-center">
                    <ShieldExclamationIcon
                      className="h-6 w-6 text-indigo-400"
                      aria-hidden="true"
                    />
                  </div>
                  {!isDesktopMenuCollapsed && (
                    <>
                      <p className="text-xs mt-2 mb-2 text-center">
                        ¿Necesitas ayuda?
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={SPRING}
                        className="bg-indigo-400 text-xs text-center m-0 text-white rounded-md p-1"
                        onClick={() => setIsSupportModalOpen(true)}
                      >
                        <span className="block mb-0.5">Contacta a soporte</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.li>

              {/* Configuración */}
              <motion.li
                whileHover={{ x: isDesktopMenuCollapsed ? 0 : 3 }}
                transition={SPRING}
              >
                <Link
                  to="/dashboard/client-config/general"
                  id="nav-configuracion"
                  className={classNames(
                    "group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors duration-150",
                    isDesktopMenuCollapsed ? "justify-center" : ""
                  )}
                  title={isDesktopMenuCollapsed ? "Configuración" : undefined}
                >
                  <Cog6ToothIcon
                    className={classNames(
                      "text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500 dark:group-hover:text-indigo-400",
                      isDesktopMenuCollapsed ? "h-6 w-6" : "mr-3 h-6 w-6"
                    )}
                    aria-hidden="true"
                  />
                  {!isDesktopMenuCollapsed && "Configuración"}
                </Link>
              </motion.li>

              {/* Cerrar sesión */}
              <motion.li
                whileHover={{ x: isDesktopMenuCollapsed ? 0 : 3 }}
                transition={SPRING}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className={classNames(
                    "w-full group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150",
                    isDesktopMenuCollapsed ? "justify-center" : ""
                  )}
                  title={isDesktopMenuCollapsed ? "Cerrar sesión" : undefined}
                >
                  <ArrowLeftEndOnRectangleIcon
                    className={classNames(
                      "text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-red-500",
                      isDesktopMenuCollapsed ? "h-6 w-6" : "mr-3 h-6 w-6"
                    )}
                  />
                  {!isDesktopMenuCollapsed && "Cerrar sesión"}
                </button>
              </motion.li>
            </ul>
          </div>
        </motion.aside>
      </div>

      {/*
        SIDEBAR PARA MÓVIL Y TABLET (usa 'fixed' también).
        Cuando isMobileMenuOpen = true, lo mostramos;
        caso contrario, se oculta a la izquierda.
      */}
      <div className="xl:hidden">
        <aside
          className={classNames(
            "fixed inset-y-0 bg-gray-50 left-0 w-52 md:w-56 border-r border-gray-200 dark:border-gray-700 dark:bg-gray-800 transform transition-transform duration-300 ease-in-out",
            "h-screen z-50 flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header fijo */}
          <div className="flex-none flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 p-4">
            <img className="h-8 w-auto" src={logo} alt="Your Company" />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 dark:text-gray-400"
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Contenido con scroll */}
          <nav
            className="flex-1 overflow-y-auto custom-scrollbar"
            aria-label="Sidebar"
          >
            <motion.ul
              variants={navListVariants}
              initial="hidden"
              animate={isMobileMenuOpen ? "show" : "hidden"}
              className="py-6 space-y-2"
            >
              {navigation.map((item) => {
                const itemId = `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

                return (
                  <motion.li key={item.name} variants={navItemVariants}>
                    {!item.children ? (
                      <Link
                        to={item.href}
                        id={itemId}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={classNames(
                          item.current
                            ? "bg-indigo-100"
                            : "hover:bg-indigo-100",
                          "group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md transition-colors duration-150"
                        )}
                      >
                        <item.icon
                          className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ) : (
                      <Disclosure as="div" className="space-y-1">
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              id={itemId}
                              className={classNames(
                                item.current
                                  ? "bg-indigo-100"
                                  : "hover:bg-indigo-100 dark:hover:bg-gray-700",
                                "group w-full flex items-center px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-100 rounded-md focus:outline-none transition-colors duration-150"
                              )}
                            >
                              <item.icon
                                className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500"
                                aria-hidden="true"
                              />
                              {item.name}
                              <ChevronRightIcon
                                className={classNames(
                                  "ml-auto h-5 w-5 transition-transform duration-200",
                                  open ? "rotate-90" : ""
                                )}
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel className="space-y-1">
                              {item.children.map((subItem) => (
                                <Disclosure.Button
                                  key={subItem.name}
                                  as={Link}
                                  to={subItem.href}
                                  id={`nav-sub-mobile-${subItem.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}
                                  className="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 hover:text-indigo-600 transition-colors duration-150"
                                >
                                  {subItem.name}
                                </Disclosure.Button>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          {/* Footer fijo */}
          <div className="flex-none py-6">
            <ul className="space-y-2">
              <li className="w-40 mx-auto">
                <TutorialsMenu />
              </li>
              <motion.li
                whileHover={{ scale: 1.03, y: -1 }}
                transition={SPRING}
                className="w-40 h-36 mb-8 bg-gradient-to-tr from-[#9f86f81c] to-[#746dfc17] shadow-lg flex justify-center items-center rounded-lg mx-auto cursor-default"
              >
                <div className="group flex-col justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md">
                  <div className="flex justify-center items-center">
                    <ShieldExclamationIcon
                      className="h-6 w-6 text-indigo-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs mt-2 mb-2 text-center">
                    ¿Necesitas ayuda?
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING}
                    className="bg-indigo-400 text-xs text-center m-0 text-white rounded-md p-1"
                    onClick={() => setIsSupportModalOpen(true)}
                  >
                    <span className="block mb-0.5">Contacta a soporte</span>
                  </motion.button>
                </div>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={SPRING}>
                <Link
                  to="/dashboard/client-config/general"
                  id="nav-configuracion"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <Cog6ToothIcon
                    className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-indigo-500"
                    aria-hidden="true"
                  />
                  Configuración
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={SPRING}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
                >
                  <ArrowLeftEndOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-300 transition-colors duration-150 group-hover:text-red-500" />
                  Cerrar sesión
                </button>
              </motion.li>
            </ul>
          </div>
        </aside>
      </div>

      {/*
        CONTENIDO PRINCIPAL
        -------------------
        - En pantallas grandes tiene margin-left para dejar espacio al sidebar fijo.
      */}
      <div
        className={classNames(
          "transition-all duration-300 ease-in-out",
          isDesktopMenuCollapsed ? "xl:ml-16" : "xl:ml-52"
        )}
      >
        <Navbar />
        <main className="p-4 bg-gray-50 dark:bg-gray-800 min-h-screen pl-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutDashboard;
