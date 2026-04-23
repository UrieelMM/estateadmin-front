import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { Helmet } from "react-helmet-async";
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

function classNames(...classes: (string | boolean | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Tipos de navegación ─────────────────────────────────────────────────────
type SubNavItem = { name: string; href: string };
type NavItem = {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current: boolean;
  href?: string;
  children?: SubNavItem[];
};

// ─── Constantes de animación ─────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 380, damping: 24 } as const;
const PANEL_EASE = [0.4, 0, 0.2, 1] as const;

const navListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};
const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show:  { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
};
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

const LayoutDashboard = ({ children }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { fetchUserData } = useUserStore((state) => ({
    user: state.user,
    fetchUserData: state.fetchUserData,
  }));
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showInitialSetup, setShowInitialSetup] = useState<boolean | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useSyncClientPlan();

  // ── Helpers de ruta activa ────────────────────────────────────────────────
  const isRouteActive = (href: string) => {
    if (href === "/dashboard/home") return pathname === href;
    return pathname.startsWith(href);
  };
  const isParentActive = (children: SubNavItem[]) =>
    children.some((c) => pathname.startsWith(c.href));

  // ── Funciones de diagnóstico global ──────────────────────────────────────
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
        if (!user) { setShowInitialSetup(false); return; }
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) { setShowInitialSetup(false); return; }
        const db = getFirestore();
        const configDocRef = doc(db, "clients", clientId);
        const configDoc = await getDoc(configDocRef);
        setShowInitialSetup(!configDoc.exists() || !configDoc.data()?.initialSetupCompleted);
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
      if (!user) navigate("/login");
    });
    setLoadingSession(false);
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setIsLoadingData(true);
    fetchUserData();
    setTimeout(() => setIsLoadingData(false), 2500);
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

  if (isLoadingData || loadingSession || showInitialSetup === null) {
    return <Loading />;
  }
  if (showInitialSetup) {
    return <InitialSetupSteps />;
  }

  // ── Renderer de ítem de navegación (compartido desktop & mobile) ──────────
  const renderNavItem = (item: NavItem, collapsed: boolean, onLinkClick?: () => void) => {
    const itemId = `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

    // Ítem simple sin hijos
    if (!item.children) {
      const active = isRouteActive(item.href!);
      return (
        <Link
          to={item.href!}
          id={itemId}
          onClick={onLinkClick}
          title={collapsed ? item.name : undefined}
          className={classNames(
            "group flex items-center w-full rounded-lg text-sm font-medium transition-colors duration-150",
            collapsed ? "justify-center p-2.5" : "px-3 py-2",
            active
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <item.icon
            className={classNames(
              "flex-shrink-0 h-5 w-5 transition-colors duration-150",
              !collapsed && "mr-3",
              active
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            )}
            aria-hidden="true"
          />
          {!collapsed && <span>{item.name}</span>}
        </Link>
      );
    }

    // Ítem con hijos (Disclosure)
    const parentActive = isParentActive(item.children);
    return (
      <Disclosure as="div" defaultOpen={isParentActive(item.children)}>
        {({ open }) => (
          <>
            <Disclosure.Button
              id={itemId}
              title={collapsed ? item.name : undefined}
              onClick={() => {
                if (collapsed) setIsDesktopMenuCollapsed(false);
              }}
              className={classNames(
                "group w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none",
                collapsed ? "justify-center p-2.5" : "px-3 py-2",
                parentActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon
                className={classNames(
                  "flex-shrink-0 h-5 w-5 transition-colors duration-150",
                  !collapsed && "mr-3",
                  parentActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}
                aria-hidden="true"
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  <motion.span
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="flex-shrink-0 flex items-center"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </motion.span>
                </>
              )}
            </Disclosure.Button>

            {!collapsed && (
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: PANEL_EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <Disclosure.Panel static className="pt-1 pb-1">
                      <div className="ml-5 pl-3 border-l border-gray-200 dark:border-gray-700/70 space-y-0.5">
                        {item.children!.map((subItem) => {
                          const subActive = pathname.startsWith(subItem.href);
                          return (
                            <Disclosure.Button
                              key={subItem.name}
                              as={Link}
                              to={subItem.href}
                              id={`nav-sub-${subItem.name
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/\s+/g, "-")}`}
                              onClick={onLinkClick}
                              className={classNames(
                                "group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                                subActive
                                  ? "text-indigo-700 dark:text-indigo-300 font-medium"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
                              )}
                            >
                              <span
                                className={classNames(
                                  "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors duration-150",
                                  subActive
                                    ? "bg-indigo-500 dark:bg-indigo-400"
                                    : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500"
                                )}
                              />
                              {subItem.name}
                            </Disclosure.Button>
                          );
                        })}
                      </div>
                    </Disclosure.Panel>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </>
        )}
      </Disclosure>
    );
  };

  // ── Footer del sidebar (compartido desktop & mobile) ──────────────────────
  const renderSidebarFooter = (collapsed: boolean, onLinkClick?: () => void) => (
    <div className="flex-none border-t border-gray-100 dark:border-gray-800 pt-2 pb-3">
      <div className="px-2 space-y-0.5">
        {/* Menú de tutoriales */}
        <div className={classNames(collapsed ? "flex justify-center" : "")}>
          <TutorialsMenu collapsed={collapsed} />
        </div>

        {/* Widget de soporte */}
        <div className="pt-1 pb-1">
          <motion.div
            whileHover={{ scale: collapsed ? 1.06 : 1.02 }}
            transition={SPRING}
            onClick={collapsed ? () => setIsSupportModalOpen(true) : undefined}
            className={classNames(
              "rounded-xl border transition-colors duration-150",
              "bg-gradient-to-br from-indigo-50 to-purple-50/60 dark:from-indigo-900/20 dark:to-purple-900/10",
              "border-indigo-100/80 dark:border-indigo-800/30",
              collapsed ? "p-2.5 flex justify-center items-center cursor-pointer" : "p-3 flex flex-col items-center"
            )}
          >
            <ShieldExclamationIcon
              className="h-5 w-5 text-indigo-400 dark:text-indigo-500 flex-shrink-0"
              aria-hidden="true"
            />
            {!collapsed && (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-2.5 text-center leading-relaxed">
                  ¿Necesitas ayuda?
                </p>
                <button
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-medium py-1.5 transition-colors duration-150"
                >
                  Contactar soporte
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Configuración */}
        <Link
          to="/dashboard/client-config/general"
          id="nav-configuracion"
          onClick={onLinkClick}
          title={collapsed ? "Configuración" : undefined}
          className={classNames(
            "group flex items-center w-full rounded-lg text-sm font-medium transition-colors duration-150",
            collapsed ? "justify-center p-2.5" : "px-3 py-2",
            isRouteActive("/dashboard/client-config")
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <Cog6ToothIcon
            className={classNames(
              "flex-shrink-0 h-5 w-5 transition-colors duration-150",
              !collapsed && "mr-3",
              isRouteActive("/dashboard/client-config")
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            )}
            aria-hidden="true"
          />
          {!collapsed && <span>Configuración</span>}
        </Link>

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={() => {
            onLinkClick?.();
            handleLogout();
          }}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={classNames(
            "group flex items-center w-full rounded-lg text-sm font-medium transition-colors duration-150",
            collapsed ? "justify-center p-2.5" : "px-3 py-2",
            "text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
          )}
        >
          <ArrowLeftEndOnRectangleIcon
            className={classNames(
              "flex-shrink-0 h-5 w-5 transition-colors duration-150",
              !collapsed && "mr-3",
              "text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400"
            )}
          />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-x-hidden">
      <Helmet>
        <title>EstateAdmin</title>
      </Helmet>
      <ChatBot />
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Botón móvil para abrir/cerrar sidebar */}
      <div className="xl:hidden px-3 py-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={SPRING}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-sm transition-colors duration-150 focus:outline-none"
        >
          <span className="sr-only">Abrir menú principal</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isMobileMenuOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-5 w-5" aria-hidden="true" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Backdrop para sidebar móvil */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/*
        SIDEBAR FIJO — PANTALLAS GRANDES
      */}
      <div className="hidden xl:block">
        <motion.aside
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className={classNames(
            "fixed inset-y-0 left-0 z-50 flex flex-col h-screen",
            "bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800",
            "transition-[width] duration-300 ease-in-out",
            isDesktopMenuCollapsed ? "w-16" : "w-52 md:w-56"
          )}
        >
          {/* Header */}
          <div
            className={classNames(
              "flex-none h-14 border-b border-gray-100 dark:border-gray-800 flex items-center",
              isDesktopMenuCollapsed ? "justify-center px-3" : "justify-between px-4"
            )}
          >
            <AnimatePresence mode="wait">
              {!isDesktopMenuCollapsed && (
                <motion.img
                  key="logo"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="h-7 w-auto"
                  src={logo}
                  alt="EstateAdmin"
                />
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              transition={SPRING}
              onClick={() => setIsDesktopMenuCollapsed(!isDesktopMenuCollapsed)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none"
            >
              <span className="sr-only">Colapsar menú</span>
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-3" aria-label="Sidebar">
            <motion.ul
              variants={navListVariants}
              initial="hidden"
              animate="show"
              className="px-2 space-y-0.5"
            >
              {navigation.map((item) => (
                <motion.li key={item.name} variants={navItemVariants}>
                  {renderNavItem(item as NavItem, isDesktopMenuCollapsed)}
                </motion.li>
              ))}
            </motion.ul>
          </nav>

          {/* Footer */}
          {renderSidebarFooter(isDesktopMenuCollapsed)}
        </motion.aside>
      </div>

      {/*
        SIDEBAR — MÓVIL Y TABLET
      */}
      <div className="xl:hidden">
        <motion.aside
          initial={false}
          animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className={classNames(
            "fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-56",
            "bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800"
          )}
        >
          {/* Header */}
          <div className="flex-none h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
            <img className="h-7 w-auto" src={logo} alt="EstateAdmin" />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <span className="sr-only">Cerrar sidebar</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-3" aria-label="Sidebar">
            <motion.ul
              variants={navListVariants}
              initial="hidden"
              animate={isMobileMenuOpen ? "show" : "hidden"}
              className="px-2 space-y-0.5"
            >
              {navigation.map((item) => (
                <motion.li key={item.name} variants={navItemVariants}>
                  {renderNavItem(
                    item as NavItem,
                    false,
                    () => setIsMobileMenuOpen(false)
                  )}
                </motion.li>
              ))}
            </motion.ul>
          </nav>

          {/* Footer */}
          {renderSidebarFooter(false, () => setIsMobileMenuOpen(false))}
        </motion.aside>
      </div>

      {/*
        CONTENIDO PRINCIPAL
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
