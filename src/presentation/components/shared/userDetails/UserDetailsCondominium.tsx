import { Fragment } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { UserData } from "../../../../interfaces/UserData";

interface UserDetailsProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userDetails: UserData | null;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Función para generar un color basado en el nombre
function stringToColor(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
}

const UserDetailsCondominium = ({
  open,
  setOpen,
  userDetails,
}: UserDetailsProps) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-gray-800">
                    <div className="px-4 py-6 sm:px-6 dark:bg-gray-900">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          Perfil
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Main */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      <div className="pb-6 dark:bg-gray-800">
                        <div className="h-24 bg-indigo-700 sm:h-20 lg:h-28 dark:bg-gray-900" />
                        <div className="-mt-12 flow-root px-4 sm:-mt-8 sm:flex sm:items-end sm:px-6 lg:-mt-16">
                          <div>
                            <div className="-m-1 flex">
                              <div className="inline-flex overflow-hidden rounded-lg border-4 border-white">
                                {userDetails?.photoURL ? (
                                  <img
                                    className="w-24 h-24 rounded-lg flex-shrink-0 sm:h-40 sm:w-40 lg:h-48 lg:w-48 dark:bg-gray-900"
                                    src={userDetails.photoURL}
                                    alt={userDetails.name}
                                    onError={(e) => {
                                      // Prevenir múltiples llamadas al manejador de error
                                      e.currentTarget.onerror = null;

                                      // Crear un nuevo elemento div para el avatar
                                      const avatarDiv =
                                        document.createElement("div");
                                      avatarDiv.className =
                                        "w-24 h-24 flex justify-center items-center rounded-lg flex-shrink-0 sm:h-40 sm:w-40 lg:h-48 lg:w-48";
                                      avatarDiv.style.background = `linear-gradient(135deg, ${stringToColor(
                                        userDetails.name || ""
                                      )}, ${stringToColor(
                                        userDetails.name + "bg" || ""
                                      )})`;

                                      // Agregar la letra al avatar
                                      const letterP =
                                        document.createElement("p");
                                      letterP.className =
                                        "text-white text-2xl md:text-4xl font-bold";
                                      letterP.textContent = userDetails.name
                                        .charAt(0)
                                        .toUpperCase();
                                      avatarDiv.appendChild(letterP);

                                      // Reemplazar la imagen con el avatar
                                      const parent =
                                        e.currentTarget.parentElement;
                                      if (parent) {
                                        // Eliminar la imagen actual
                                        parent.removeChild(e.currentTarget);
                                        // Agregar el avatar en su lugar
                                        parent.appendChild(avatarDiv);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-24 h-24 flex justify-center items-center rounded-lg flex-shrink-0 sm:h-40 sm:w-40 lg:h-48 lg:w-48"
                                    style={{
                                      background: `linear-gradient(135deg, ${stringToColor(
                                        userDetails?.name || ""
                                      )}, ${stringToColor(
                                        (userDetails?.name || "") + "bg"
                                      )})`,
                                    }}
                                  >
                                    <p className="text-white text-2xl md:text-4xl font-bold">
                                      {userDetails?.name
                                        ? userDetails.name
                                            .charAt(0)
                                            .toUpperCase()
                                        : "U"}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 sm:ml-6 sm:flex-1">
                            <div>
                              <div className="flex items-center">
                                <h3 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
                                  {userDetails?.name} {userDetails?.lastName}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-100">
                                {userDetails?.email}
                              </p>
                            </div>
                            <div className="mt-5 flex flex-wrap space-y-3 sm:space-x-3 sm:space-y-0">
                              <button
                                type="button"
                                className="inline-flex w-full flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:flex-1"
                              >
                                Mensaje
                              </button>
                              <button
                                type="button"
                                className="inline-flex w-full flex-1 items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                Llamar
                              </button>
                              <div className="ml-3 inline-flex sm:ml-0">
                                <Menu
                                  as="div"
                                  className="relative inline-block text-left"
                                >
                                  <Menu.Button className="relative inline-flex items-center rounded-md bg-white p-2 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    <span className="absolute -inset-1" />
                                    <EllipsisVerticalIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
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
                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                      <div className="py-1">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <a
                                              href="#"
                                              className={classNames(
                                                active
                                                  ? "bg-gray-100 text-gray-900"
                                                  : "text-gray-700",
                                                "block px-4 py-2 text-sm"
                                              )}
                                            >
                                              Ver perfil
                                            </a>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-5 sm:px-0 sm:py-0 dark:bg-gray-800">
                        <dl className="space-y-8 sm:space-y-0 sm:divide-y sm:divide-gray-200">
                          <div className="sm:flex sm:px-6 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0 lg:w-48 dark:text-gray-100">
                              Dirección fiscal
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:ml-6 sm:mt-0 dark:text-gray-100">
                              <p>{userDetails?.taxResidence}</p>
                            </dd>
                          </div>
                          <div className="sm:flex sm:px-6 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0 lg:w-48 dark:text-gray-100">
                              RFC
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:ml-6 sm:mt-0 dark:text-gray-100">
                              {userDetails?.RFC}
                            </dd>
                          </div>
                          <div className="sm:flex sm:px-6 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0 lg:w-48 dark:text-gray-100">
                              Régimen fiscal
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:ml-6 sm:mt-0 dark:text-gray-100">
                              {userDetails?.taxtRegime}
                            </dd>
                          </div>
                          <div className="sm:flex sm:px-6 sm:py-5">
                            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0 lg:w-48 dark:text-gray-100">
                              Razón social
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:ml-6 sm:mt-0 dark:text-gray-100">
                              <time dateTime="1982-06-23">
                                {userDetails?.businessName}
                              </time>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default UserDetailsCondominium;
