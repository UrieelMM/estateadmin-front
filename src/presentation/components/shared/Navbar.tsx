import { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";
import ConboBox from "./ComboBox";
import { getCurrentDateWithGreeting } from "../../../utils/getCurrentDate";
import useUserStore from "../../../store/UserDataStore";
import { UserData } from "../../../interfaces/UserData";
import NotificationBell from "./notifications/NotificationsBell";

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

  useEffect(() => {
    setCurrentDate(getCurrentDateWithGreeting());
  }, []);

  useEffect(() => {
    fetchUserData();
    if (user) {
      setUserData(user);
    }
  }, [fetchUserData, user]);

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
                        <a
                          href="#"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-gray-700" : "",
                            "block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                          )}
                        >
                          Perfil
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/dashborad/client-config"
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
                        <a
                          href="#"
                          className={classNames(
                            active ? "bg-gray-100 dark:bg-gray-700" : "",
                            "block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                          )}
                        >
                          Cerrar sesión
                        </a>
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
