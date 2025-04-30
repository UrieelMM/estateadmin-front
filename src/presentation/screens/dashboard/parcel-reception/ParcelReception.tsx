import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  CheckIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import ParcelReceptionForm from "../../../components/shared/forms/ParcerlReceptionForm";
import ParcelDeliveryForm from "../../../components/shared/forms/ParcelDeliveryForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  useParcelReceptionStore,
  Parcel,
} from "../../../../store/useParcelStore";
import moment from "moment";
import "moment/locale/es";
import toast from "react-hot-toast";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const ParcelReception = () => {
  // Configurar moment para usar español
  moment.locale("es");

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [currentFilter, setCurrentFilter] = useState<
    "all" | "pending" | "delivered"
  >("all");

  const { parcels, isLoading, error, filters, getParcels, setFilters } =
    useParcelReceptionStore();

  useEffect(() => {
    getParcels();
  }, [getParcels]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFilters({ search: e.target.value });
  };

  const handleFilterChange = (filter: "all" | "pending" | "delivered") => {
    setCurrentFilter(filter);
    setFilters({ status: filter });
  };

  const handleDeliveryRequest = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setDeliveryOpen(true);
  };

  const handleViewDetails = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setDetailOpen(true);
  };

  const handleDeliverySuccess = () => {
    getParcels();
  };

  const filteredParcels = parcels.filter((parcel) => {
    // Aplicar filtro de estado
    if (filters.status !== "all" && parcel.status !== filters.status) {
      return false;
    }

    // Aplicar búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        parcel.recipientName.toLowerCase().includes(searchLower) ||
        parcel.email.toLowerCase().includes(searchLower) ||
        parcel.receptor.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Función para formatear fecha en español
  const formatDate = (dateString: string) => {
    try {
      return moment(dateString).format("D [de] MMMM, YYYY");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <div className="min-h-full bg-white dark:bg-gray-900 rounded-lg shadow">
        {/* Header */}
        <header className="bg-white shadow-sm dark:bg-gray-800">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6 flex items-center justify-between">
              <h1 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                Recepción y Entrega de Paquetes
              </h1>
              <motion.button
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                Registrar Paquete
              </motion.button>
            </div>
          </div>
        </header>

        {/* Filtros y búsqueda */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="search"
                name="search"
                id="search"
                value={search}
                onChange={handleSearch}
                className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
                placeholder="Buscar por nombre, email..."
              />
            </div>

            <div className="flex space-x-2">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600">
                    <FunnelIcon
                      className="h-5 w-5 mr-1 text-gray-400"
                      aria-hidden="true"
                    />
                    {currentFilter === "all" && "Todos"}
                    {currentFilter === "pending" && "Pendientes"}
                    {currentFilter === "delivered" && "Entregados"}
                    <ChevronDownIcon
                      className="-mr-1 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleFilterChange("all")}
                            className={classNames(
                              active
                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                : "text-gray-700 dark:text-gray-200",
                              "flex items-center px-4 py-2 text-sm w-full"
                            )}
                          >
                            {currentFilter === "all" && (
                              <CheckIcon
                                className="h-4 w-4 mr-2 text-indigo-500"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={currentFilter === "all" ? "ml-6" : ""}
                            >
                              Todos
                            </span>
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleFilterChange("pending")}
                            className={classNames(
                              active
                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                : "text-gray-700 dark:text-gray-200",
                              "flex items-center px-4 py-2 text-sm w-full"
                            )}
                          >
                            {currentFilter === "pending" && (
                              <CheckIcon
                                className="h-4 w-4 mr-2 text-indigo-500"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={
                                currentFilter === "pending" ? "ml-6" : ""
                              }
                            >
                              Pendientes
                            </span>
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleFilterChange("delivered")}
                            className={classNames(
                              active
                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                : "text-gray-700 dark:text-gray-200",
                              "flex items-center px-4 py-2 text-sm w-full"
                            )}
                          >
                            {currentFilter === "delivered" && (
                              <CheckIcon
                                className="h-4 w-4 mr-2 text-indigo-500"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={
                                currentFilter === "delivered" ? "ml-6" : ""
                              }
                            >
                              Entregados
                            </span>
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Lista de paquetes */}
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flow-root">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-8 w-8 text-indigo-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-300">
                      Cargando paquetes...
                    </span>
                  </div>
                </div>
              ) : filteredParcels.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No hay paquetes
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {filters.search
                      ? "No se encontraron paquetes con tu búsqueda."
                      : filters.status !== "all"
                      ? `No hay paquetes ${
                          filters.status === "pending"
                            ? "pendientes"
                            : "entregados"
                        }.`
                      : "No hay paquetes registrados todavía."}
                  </p>
                  {!filters.search && filters.status === "all" && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <PlusIcon
                          className="-ml-0.5 mr-1.5 h-5 w-5"
                          aria-hidden="true"
                        />
                        Registrar Paquete
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8 dark:text-gray-200"
                          >
                            <div className="flex items-center">
                              Destinatario
                              <ArrowsUpDownIcon
                                className="h-4 w-4 ml-1 text-gray-400"
                                aria-hidden="true"
                              />
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                          >
                            <div className="flex items-center">
                              Receptor
                              <ArrowsUpDownIcon
                                className="h-4 w-4 ml-1 text-gray-400"
                                aria-hidden="true"
                              />
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-gray-200"
                          >
                            Fecha recepción
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                          >
                            Estado
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                          >
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        <AnimatePresence>
                          {filteredParcels.map((parcel) => (
                            <motion.tr
                              key={parcel.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => handleViewDetails(parcel)}
                            >
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8 dark:text-white">
                                {parcel.recipientName}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                {parcel.receptor}
                              </td>
                              <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell dark:text-gray-300">
                                {formatDate(parcel.dateReception)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {parcel.status === "delivered" ? (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30">
                                    Entregado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-500/30">
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                                <div
                                  className="flex justify-end space-x-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(parcel);
                                    }}
                                    className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                                  >
                                    <EyeIcon className="mr-1 h-4 w-4" />
                                    Ver
                                  </button>

                                  {parcel.status === "pending" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeliveryRequest(parcel);
                                      }}
                                      className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                                    >
                                      <CheckIcon className="mr-1 h-4 w-4" />
                                      Entregar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de registro de paquete */}
      <ParcelReceptionForm open={open} setOpen={setOpen} />

      {/* Formulario de registro de entrega */}
      {selectedParcel && (
        <ParcelDeliveryForm
          open={deliveryOpen}
          setOpen={setDeliveryOpen}
          parcelId={selectedParcel.id}
          onSuccess={handleDeliverySuccess}
        />
      )}

      {/* Modal de detalles del paquete */}
      <Transition.Root show={detailOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setDetailOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => setDetailOpen(false)}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                      >
                        Detalles del paquete
                      </Dialog.Title>

                      {selectedParcel && (
                        <div className="mt-4">
                          <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg dark:bg-gray-700">
                            <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-5 sm:p-0">
                              <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-600">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Estado
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {selectedParcel.status === "delivered" ? (
                                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30">
                                        Entregado
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-500/30">
                                        Pendiente
                                      </span>
                                    )}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Destinatario
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {selectedParcel.recipientName}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Email
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {selectedParcel.email}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Receptor
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {selectedParcel.receptor}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Fecha de recepción
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {formatDate(selectedParcel.dateReception)} a
                                    las {selectedParcel.hourReception}
                                  </dd>
                                </div>
                                {selectedParcel.status === "delivered" &&
                                  selectedParcel.deliveryDate && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                        Fecha de entrega
                                      </dt>
                                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                        {formatDate(
                                          selectedParcel.deliveryDate
                                        )}{" "}
                                        a las {selectedParcel.deliveryHour}
                                      </dd>
                                    </div>
                                  )}
                                {selectedParcel.comments && (
                                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                      Comentarios
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                      {selectedParcel.comments}
                                    </dd>
                                  </div>
                                )}

                                {/* Sección de fotos y evidencias */}
                                {(selectedParcel.attachmentParcelReception ||
                                  selectedParcel.attachmentParcelDelivery) && (
                                  <div className="py-4 sm:py-5 sm:px-6">
                                    <dt className="text-base font-medium text-gray-900 dark:text-white mb-4">
                                      Fotos y evidencias
                                    </dt>

                                    <div className="space-y-4">
                                      {/* Botón para foto del paquete (recepción) */}
                                      {selectedParcel.attachmentParcelReception && (
                                        <button
                                          onClick={() => window.open(selectedParcel.attachmentParcelReception, "_blank")}
                                          className="w-full flex items-center justify-center gap-x-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                          <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                          Ver foto del paquete al recibirlo
                                        </button>
                                      )}

                                      {/* Botón para foto de evidencia de entrega */}
                                      {selectedParcel.attachmentParcelDelivery && (
                                        <button
                                          onClick={() => window.open(selectedParcel.attachmentParcelDelivery, "_blank")}
                                          className="w-full flex items-center justify-center gap-x-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                                        >
                                          <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                          Ver foto de evidencia de entrega
                                        </button>
                                      )}

                                      {/* Mensaje si no hay ninguna imagen disponible */}
                                      {(!selectedParcel.attachmentParcelReception && !selectedParcel.attachmentParcelDelivery) && (
                                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                          <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                          <p className="mt-2">
                                            No hay imágenes disponibles para
                                            este paquete
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {selectedParcel.deliveryNotes && (
                                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                      Notas de entrega
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                      {selectedParcel.deliveryNotes}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setDetailOpen(false)}
                    >
                      Cerrar
                    </button>
                    {selectedParcel && selectedParcel.status === "pending" && (
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        onClick={() => {
                          setDetailOpen(false);
                          handleDeliveryRequest(selectedParcel);
                        }}  
                      >
                        Registrar entrega
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ParcelReception;
