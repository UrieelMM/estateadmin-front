import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowRightEndOnRectangleIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  DocumentPlusIcon,
  EnvelopeIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/solid";
import {
  Bars3Icon,
  ShieldExclamationIcon,
} from "@heroicons/react/16/solid";
import useAuthStore from "../../../store/AuthStore";
import Loading from "../../components/shared/loaders/Loading";
import { auth } from "../../../firebase/firebase";
import { superAdminRoutes } from "../../../routes/superAdminRoutes";
import {
  initializeSuperAdminSession,
  clearSuperAdminSession,
} from "../../../services/superAdminService";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const { user, logoutUser } = useAuthStore();

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar si el usuario tiene el rol de super-provider-admin
    const checkSuperAdminRole = async () => {
      setIsLoading(true);
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setIsSuperAdmin(false);
          navigate("/login");
          return;
        }

        // Inicializar sesión segura de Super Admin con la Cloud Function
        await initializeSuperAdminSession();
        setIsSuperAdmin(true);
      } catch (error) {
        console.error("Error al verificar rol:", error);
        toast.error("No tienes permisos para acceder a esta sección");
        navigate("/dashboard/home");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      checkSuperAdminRole();
    } else {
      navigate("/login");
    }

    // Limpiar sesión al desmontar el componente
    return () => {
      clearSuperAdminSession();
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      // Limpiar la sesión Super Admin antes de cerrar sesión
      clearSuperAdminSession();
      await logoutUser();
      toast.success("Sesión cerrada con éxito");
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isSuperAdmin) {
    return null; // No renderizar nada mientras verificamos permisos
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Disclosure as="nav" className="bg-indigo-900 dark:bg-indigo-950">
        {({ open }) => (
          <>
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Link
                      to="/super-admin/dashboard"
                      className="flex items-center"
                    >
                      <ShieldCheckIcon className="h-8 w-8 text-white" />
                      <span className="ml-2 text-xl font-bold text-white">
                        Admin Panel
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Parte derecha del navbar */}
                <div className="hidden md:flex items-center justify-end flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <ShieldExclamationIcon className="mr-1 h-3 w-3" />
                      Super Admin
                    </span>
                    <span className="text-white">{user?.email}</span>
                    <button
                      onClick={handleLogout}
                      className="ml-4 rounded-md bg-indigo-800 p-2 text-white hover:bg-indigo-700"
                    >
                      <ArrowRightEndOnRectangleIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                {/* Botón de menú para móvil */}
                <div className="-mr-2 flex md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-indigo-800 p-2 text-white hover:bg-indigo-700 focus:outline-none">
                    <span className="sr-only">Abrir menú principal</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                {superAdminRoutes.map((route) => (
                  <NavLink
                    key={route.to}
                    to={`/super-admin/${route.to}`}
                    className={({ isActive }) =>
                      `${
                        isActive
                          ? "bg-indigo-800 text-white"
                          : "text-indigo-200 hover:bg-indigo-700 hover:text-white"
                      } block rounded-md px-3 py-2 text-base font-medium`
                    }
                  >
                    {route.name}
                  </NavLink>
                ))}
              </div>
              <div className="border-t border-indigo-800 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center text-white">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user?.email}
                    </div>
                    <div className="text-sm font-medium text-indigo-300">
                      Super Administrator
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto flex-shrink-0 rounded-md bg-indigo-800 p-1 text-indigo-200 hover:bg-indigo-700 hover:text-white"
                  >
                    <ArrowRightEndOnRectangleIcon
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <div className="flex">
        {/* Sidebar for desktop */}
        <div className="hidden md:flex w-64 bg-indigo-900 dark:bg-indigo-900 min-h-screen flex-col">
          <div className="flex flex-col flex-grow">
            <div className="px-4 pt-5">
              <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <ShieldExclamationIcon className="mr-1 h-3 w-3" />
                Super Admin
              </span>
            </div>
            <nav className="mt-5 flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
              {superAdminRoutes.map((route) => {
                let Icon;

                switch (route.to) {
                  case "dashboard":
                    Icon = ChartBarIcon;
                    break;
                  case "clients":
                    Icon = BuildingOffice2Icon;
                    break;
                  case "billing":
                    Icon = CreditCardIcon;
                    break;
                  case "news-and-guides":
                    Icon = DocumentTextIcon;
                    break;
                  case "new-customer-form":
                    Icon = DocumentPlusIcon;
                    break;
                  case "emails":
                    Icon = EnvelopeIcon;
                    break;
                  case "support-tickets":
                    Icon = LifebuoyIcon;
                    break;
                  default:
                    Icon = ChartBarIcon;
                }

                return (
                  <NavLink
                    key={route.to}
                    to={`/super-admin/${route.to}`}
                    className={({ isActive }) =>
                      `${
                        isActive
                          ? "bg-indigo-700 text-white"
                          : "text-indigo-100 hover:bg-indigo-700"
                      } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
                    }
                  >
                    <Icon
                      className="mr-3 h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {route.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          {/* Botón de cerrar sesión fijo en la parte inferior */}
          <div className="border-t border-indigo-700 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-start text-indigo-100 hover:text-white"
            >
              <ArrowRightEndOnRectangleIcon
                className="h-5 w-5 mr-3"
                aria-hidden="true"
              />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
