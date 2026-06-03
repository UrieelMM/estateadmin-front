import { Fragment, useState, useEffect, useCallback } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import {
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import GlobalSearch from "./GlobalSearch";

// ─── Animation constants (Emil Kowalski philosophy) ────────────────────────
// Strong ease-out: starts fast, gives instant visual feedback
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;

const MotionMenuButton = motion(Menu.Button);

import ConboBox from "./ComboBox";
import { getCurrentDateWithGreeting } from "../../../utils/getCurrentDate";
import useUserStore from "../../../store/UserDataStore";
import { UserData } from "../../../interfaces/UserData";
import NotificationBell from "./notifications/NotificationsBell";
import { useTheme } from "../../../context/Theme/ThemeContext";
import useAuthStore from "../../../store/AuthStore";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Staggered children variants ───────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// ─── Component ──────────────────────────────────────────────────────────────
const Navbar = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  const { fetchUserData, user } = useUserStore((state) => ({
    user: state.user,
    fetchUserData: state.fetchUserData,
  }));
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { logoutUser } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ─── Cmd/Ctrl + K shortcut ───────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsSearchOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const userPhoto =
    userData?.photoURL ||
    (userData as UserData & { photoUrl?: string })?.photoUrl;

  const userInitial = userData?.name?.charAt(0)?.toUpperCase() ?? "?";

  useEffect(() => {
    setCurrentDate(getCurrentDateWithGreeting(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
    if (user) setUserData(user);
  }, [fetchUserData, user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <Disclosure as="nav">
          {/* ── Shell: indigo→violet gradient (light) / deep frosted (dark) ── */}
          <div
            className={classNames(
              "w-full px-4 sm:px-6 lg:px-8 h-16",
              // Light: branded gradient + subtle blur for depth
              "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600",
              "backdrop-blur-xl",
              "border-b border-indigo-700/30",
              "shadow-[0_4px_24px_-4px_rgba(99,102,241,0.45),0_1px_0_0_rgba(255,255,255,0.08)_inset]",
              // Dark: deep slate frosted panel — override the gradient
              "dark:bg-none dark:bg-gray-900/85 dark:border-white/[0.06]",
              "dark:shadow-[0_1px_3px_0_rgb(0,0,0,0.4)]",
            )}
            // Inline style so dark mode can cleanly override the CSS gradient
            style={
              isDarkMode ? { background: "rgba(17,24,39,0.85)" } : undefined
            }
          >
            <div className="relative flex h-full items-center justify-between gap-3">
              {/* ── LEFT: ComboBox + greeting ── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-1 items-center gap-3 min-w-0"
              >
                {/* ComboBox — hidden for super-provider-admin */}
                {userData?.role !== "super-provider-admin" && (
                  <motion.div variants={itemVariants} className="shrink-0">
                    <ConboBox />
                  </motion.div>
                )}

                {/* Divider vertical sutil entre el selector y el saludo */}
                {userData?.role !== "super-provider-admin" && (
                  <motion.div
                    variants={itemVariants}
                    className="hidden md:block h-7 w-px bg-white/20 dark:bg-white/10"
                  />
                )}

                {/* Greeting */}
                <motion.p
                  variants={itemVariants}
                  className="hidden md:block truncate text-sm font-medium min-w-0 text-white/90 dark:text-gray-200"
                >
                  <span className="font-semibold text-white dark:text-white">
                    Hola, {userData?.name}
                  </span>
                  <span className="hidden lg:inline font-normal ml-1 text-indigo-200/90 dark:text-gray-400">
                    · {currentDate}
                  </span>
                </motion.p>
              </motion.div>

              {/* ── RIGHT: actions ── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-1 sm:gap-2 shrink-0"
              >
                {/* ── Search trigger ── */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Buscar (Cmd+K)"
                    title="Buscar (⌘K)"
                    className="relative flex items-center gap-2 h-9 pl-3 pr-3 sm:pr-4 rounded-xl bg-white/15 hover:bg-white/25 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-white/20 dark:border-white/[0.08] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 dark:focus-visible:ring-indigo-500/60"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 text-white/80 dark:text-gray-400" />
                    <span className="hidden sm:block text-xs text-white/60 dark:text-gray-500 font-medium pr-1">
                      Buscar…
                    </span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50 dark:text-gray-500 font-sans">
                      ⌘K
                    </kbd>
                  </motion.button>
                </motion.div>

                {/* Dark-mode toggle */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    whileTap={{ scale: 0.88, rotate: 18 }}
                    transition={SPRING}
                    onClick={toggleDarkMode}
                    aria-label={
                      isDarkMode ? "Activar modo claro" : "Activar modo oscuro"
                    }
                    className={classNames(
                      "relative flex items-center justify-center",
                      "w-9 h-9 rounded-xl",
                      // Light: ghost white pill on gradient
                      "bg-white/15 hover:bg-white/25",
                      "border border-white/20",
                      // Dark: subtle slate pill
                      "dark:bg-white/[0.07] dark:hover:bg-white/[0.12]",
                      "dark:border-white/[0.08]",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-white/50 dark:focus-visible:ring-indigo-500/60",
                      "[@media(hover:hover)_and_(pointer:fine)]:hover:scale-105",
                    )}
                    style={{
                      transition:
                        "transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease",
                    }}
                  >
                    {/* Sun */}
                    <SunIcon
                      className={classNames(
                        "absolute transition-all duration-200",
                        // Light: warm yellow-white; Dark: amber
                        "text-yellow-200 dark:text-amber-400",
                        !isDarkMode
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 rotate-90 scale-75",
                      )}
                      style={{ width: 18, height: 18 }}
                    />
                    {/* Moon */}
                    <MoonIcon
                      className={classNames(
                        "absolute transition-all duration-200",
                        "text-white/90 dark:text-indigo-400",
                        isDarkMode
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 -rotate-90 scale-75",
                      )}
                      style={{ width: 18, height: 18 }}
                    />
                  </motion.button>
                </motion.div>

                {/* Notification bell */}
                <motion.div variants={itemVariants}>
                  <div
                    className={classNames(
                      "flex items-center justify-center",
                      "w-9 h-9 rounded-xl",
                      // Light: ghost white
                      "bg-white/15 hover:bg-white/25 border border-white/20",
                      // Dark: subtle slate
                      "dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:border-white/[0.08]",
                      "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/25",
                      "dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.12]",
                      "transition-colors duration-150",
                    )}
                  >
                    <NotificationBell />
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div
                  variants={itemVariants}
                  className="hidden sm:block w-px h-6 bg-white/20 dark:bg-white/10 mx-1"
                />

                {/* Avatar + dropdown */}
                <motion.div variants={itemVariants}>
                  <Menu as="div" className="relative">
                    <MotionMenuButton
                      whileTap={{ scale: 0.94 }}
                      transition={SPRING}
                      className={classNames(
                        "flex items-center gap-2 rounded-xl px-1.5 py-1",
                        "ring-1 ring-transparent",
                        "[@media(hover:hover)_and_(pointer:fine)]:hover:ring-white/30",
                        "dark:[@media(hover:hover)_and_(pointer:fine)]:hover:ring-white/10",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-white/50 dark:focus-visible:ring-indigo-500/60",
                        "transition-all duration-150",
                      )}
                    >
                      {/* Avatar */}
                      {userPhoto ? (
                        <img
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover ring-2 ring-white/30 dark:ring-gray-700 shadow-sm"
                          src={userPhoto}
                          alt={userData?.name ?? "Avatar"}
                        />
                      ) : (
                        <span
                          className={classNames(
                            "flex items-center justify-center",
                            "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
                            "bg-white/20 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-violet-600",
                            "text-white text-sm font-bold",
                            "ring-2 ring-white/30 dark:ring-gray-700 shadow-sm",
                            "select-none backdrop-blur-sm",
                          )}
                          style={
                            !isDarkMode
                              ? { background: "rgba(255,255,255,0.22)" }
                              : undefined
                          }
                        >
                          {userInitial}
                        </span>
                      )}

                      {/* Name — visible sm+ */}
                      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate pr-1 text-white/90 dark:text-gray-200">
                        {userData?.name}
                      </span>

                      {/* Chevron */}
                      <svg
                        className="hidden sm:block w-3.5 h-3.5 text-white/50 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </MotionMenuButton>

                    {/* Dropdown panel */}
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-150"
                      enterFrom="transform opacity-0 scale-95 -translate-y-1"
                      enterTo="transform opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="transform opacity-100 scale-100 translate-y-0"
                      leaveTo="transform opacity-0 scale-95 -translate-y-1"
                    >
                      <Menu.Items
                        className={classNames(
                          "absolute right-0 z-50 mt-2 w-52 origin-top-right",
                          "rounded-2xl overflow-hidden",
                          "bg-white/95 dark:bg-gray-800/90 backdrop-blur-xl",
                          "shadow-xl shadow-indigo-900/10 dark:shadow-black/30",
                          "ring-1 ring-black/[0.06] dark:ring-white/[0.08]",
                          "focus:outline-none",
                        )}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                            Cuenta
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate mt-0.5">
                            {userData?.name}
                          </p>
                        </div>

                        <div className="p-1.5">
                          {/* Configuración */}
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/dashboard/client-config/general"
                                className={classNames(
                                  active
                                    ? "bg-gray-100 dark:bg-white/[0.07] text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-700 dark:text-gray-300",
                                  "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl",
                                  "transition-colors duration-100",
                                )}
                              >
                                <Cog6ToothIcon className="w-4 h-4 shrink-0" />
                                Configuración
                              </Link>
                            )}
                          </Menu.Item>

                          {/* Divider */}
                          <div className="my-1 h-px bg-gray-100 dark:bg-white/[0.06]" />

                          {/* Cerrar sesión */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={classNames(
                                  active
                                    ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "text-gray-700 dark:text-gray-300",
                                  "flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm rounded-xl",
                                  "transition-colors duration-100",
                                )}
                              >
                                <ArrowRightStartOnRectangleIcon className="w-4 h-4 shrink-0" />
                                Cerrar sesión
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Disclosure>
      </motion.div>

      {/* ── Global Search overlay (rendered outside the fixed navbar flow) ── */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navbar;
