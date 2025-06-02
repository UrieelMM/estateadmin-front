import { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
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
                <ConboBox />
                <p className="text-white text-sm lg:text-base">
                  <span className="font-bold">Hola, {userData?.name}</span>
                  <span className="hidden sm:inline"> {currentDate}</span>
                </p>
              </div>
            </div>

            {/* Sección derecha */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 transition-all duration-300 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-indigo-400/50"
              >
                <div className="relative w-5 h-5">
                  {/* Sol icon */}
                  <SunIcon
                    className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-500 transform ${
                      !isDarkMode
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-180 scale-75"
                    }`}
                  />
                  {/* Luna icon */}
                  <MoonIcon
                    className={`absolute inset-0 w-5 h-5 text-indigo-200 transition-all duration-500 transform ${
                      isDarkMode
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-180 scale-75"
                    }`}
                  />
                </div>
              </button>

              <NotificationBell />
              <Menu as="div" className="relative">
                <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none">
                  <span className="absolute -inset-1.5" />
                  {userData?.photoURL ? (
                    <img
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                      src={userData?.photoURL as string}
                      alt=""
                    />
                  ) : (
                    <p className="bg-indigo-300 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex justify-center items-center text-sm sm:text-base">
                      {userData?.name?.charAt(0)}
                    </p>
                  )}
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/dashboard/client-config"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-gray-700" : "",
                            "block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
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
                            active ? "bg-gray-100 dark:bg-gray-700" : "",
                            "block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
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
  );
};

export default Navbar;
