import { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;
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
  const userPhoto =
    userData?.photoURL ||
    (userData as UserData & { photoUrl?: string })?.photoUrl;

  useEffect(() => {
    setCurrentDate(getCurrentDateWithGreeting(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
    if (user) {
      setUserData(user);
    }
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
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.38, ease: EASE_OUT }}
    >
      <Disclosure
        as="nav"
        className="bg-gradient-to-r shadow-lg from-indigo-700 to-indigo-600 dark:from-gray-900 dark:to-gray-900"
      >
        <>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Sección izquierda */}
              <div className="flex flex-1 items-center justify-start">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {userData?.role !== "super-provider-admin" && <ConboBox />}
                  <motion.p
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.12, ease: EASE_OUT }}
                    className="text-white text-sm lg:text-base"
                  >
                    <span className="font-bold">Hola, {userData?.name}</span>
                    <span className="hidden sm:inline"> {currentDate}</span>
                  </motion.p>
                </div>
              </div>

              {/* Sección derecha */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Theme Toggle — spring en tap */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88, rotate: 20 }}
                  transition={SPRING}
                  onClick={toggleDarkMode}
                  className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 transition-colors duration-200 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-indigo-400/50"
                >
                  <div className="relative w-5 h-5">
                    <SunIcon
                      className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-300 transform ${
                        !isDarkMode
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 rotate-90 scale-75"
                      }`}
                    />
                    <MoonIcon
                      className={`absolute inset-0 w-5 h-5 text-indigo-200 transition-all duration-300 transform ${
                        isDarkMode
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 -rotate-90 scale-75"
                      }`}
                    />
                  </div>
                </motion.button>

                {/* NotificationBell */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.18, ease: EASE_OUT }}
                >
                  <NotificationBell />
                </motion.div>

                {/* Avatar con spring */}
                <Menu as="div" className="relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.22, ease: EASE_OUT }}
                  >
                    <MotionMenuButton
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      transition={SPRING}
                      className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none ring-2 ring-transparent hover:ring-white/40 transition-all duration-200"
                    >
                      <span className="absolute -inset-1.5" />
                      {userPhoto ? (
                        <img
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                          src={userPhoto}
                          alt=""
                        />
                      ) : (
                        <p className="bg-indigo-300 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex justify-center items-center text-sm sm:text-base">
                          {userData?.name?.charAt(0)}
                        </p>
                      )}
                    </MotionMenuButton>
                  </motion.div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="transform opacity-0 scale-95 -translate-y-1"
                    enterTo="transform opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="transform opacity-100 scale-100 translate-y-0"
                    leaveTo="transform opacity-0 scale-95 -translate-y-1"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-gray-800 py-1 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard/client-config/general"
                            className={classNames(
                              active ? "bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200",
                              "flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-100"
                            )}
                          >
                            Configuración
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-200",
                              "flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors duration-100"
                            )}
                          >
                            Cerrar sesión
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>
      </Disclosure>
    </motion.div>
  );
};

export default Navbar;
