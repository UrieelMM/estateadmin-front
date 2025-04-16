import { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import ProviderForm from "../../../components/shared/forms/ProviderForm";
import DeleteConfirmationModal from "../../../components/shared/modals/DeleteConfirmationModal";
import useProviderStore from "../../../../store/providerStore";
import { toast } from "react-hot-toast";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";
import SearchProviders from "./SearchProviders";

const ProvidersList = () => {
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const [providerToDelete, setProviderToDelete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("providers");
  const {
    filteredProviders: providers,
    loading,
    error,
    fetchProviders,
    deleteProvider,
    searchProviders,
    searchTerm,
  } = useProviderStore();

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleDelete = async (id: string) => {
    const success = await deleteProvider(id);
    if (success) {
      toast.success("Proveedor eliminado correctamente");
    } else {
      toast.error("Error al eliminar el proveedor");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchProviders(e.target.value);
  };

  return (
    <>
      <header className="bg-gradient-to-r ml-2  shadow-lg flex w-full justify-between px-6 py-4 rounded-lg items-center mb-6 dark:shadow-2xl">
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Directorio de Proveedores
          </h1>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg  shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 active:scale-95"
          onClick={() => {
            setSelectedProviderId(null);
            setOpen(true);
          }}
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Agregar proveedor
        </button>
      </header>

      {/* Tab Layout */}
      <div className="mb-6">
        <nav
          className="flex px-6 space-x-8 overflow-x-auto custom-scrollbar"
          aria-label="Tabs"
        >
          {["providers", "search"].map((tab) => (
            <button
              key={tab}
              className={`relative whitespace-nowrap py-3 px-1 text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "providers" ? "Proveedores" : "Buscar Proveedores"}
            </button>
          ))}
        </nav>
      </div>

      <div className="-mx-4 sm:-mx-0 py-4">
        {activeTab === "providers" && (
          <>
            <div className="mb-6 px-6">
              <div className="relative transition-all duration-200 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full rounded-xl h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-gray-200 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Buscar proveedor por nombre, servicio, o datos de contacto..."
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingApp />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Cargando proveedores...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm mx-6">
                <p className="font-medium">{error}</p>
              </div>
            ) : (
              <div className="grid px-6 grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {providers.length === 0 && !loading && (
                  <div className="col-span-full text-center py-12">
                    <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <UserCircleIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                      No se encontraron proveedores
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No hay proveedores que coincidan con tu búsqueda.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setSelectedProviderId(null);
                          setOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-1" /> Agregar proveedor
                      </button>
                    </div>
                  </div>
                )}

                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`self-start flex flex-col col-span-1 rounded-xl bg-white dark:bg-gray-800 text-center overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 ${
                      selectedProviderId === provider.id
                        ? "ring-2 ring-indigo-500 z-10"
                        : ""
                    }`}
                  >
                    {/* Sección del titular, clickeable para mostrar/ocultar detalles */}
                    <div
                      className="flex flex-1 flex-col p-6 relative cursor-pointer"
                      onClick={() =>
                        setSelectedProviderId(
                          selectedProviderId === provider.id
                            ? null
                            : provider.id
                        )
                      }
                    >
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/40">
                          {provider.serviceLabel || provider.service}
                        </span>
                      </div>

                      <div className="w-24 h-24 mx-auto mt-2 rounded-full flex justify-center items-center bg-gradient-to-r from-indigo-400 to-purple-500 text-white text-2xl font-bold shadow-md">
                        {provider.name.substring(0, 1)}
                      </div>

                      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>

                      <dl className="mt-2 flex flex-grow flex-col justify-between">
                        <div className="space-y-2 mt-2">
                          <dd className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                            <PhoneIcon className="h-4 w-4 mr-1 text-indigo-500" />
                            {provider.phone}
                          </dd>
                          <dd className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                            <EnvelopeIcon className="h-4 w-4 mr-1 text-indigo-500" />
                            {provider.email}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <div className="flex divide-x divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900">
                        <a
                          href={`mailto:${provider.email}`}
                          className="flex-1 inline-flex items-center justify-center gap-x-2 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EnvelopeIcon
                            className="h-5 w-5 text-indigo-500"
                            aria-hidden="true"
                          />
                          Email
                        </a>
                        <a
                          href={`tel:${provider.phone}`}
                          className="flex-1 inline-flex items-center justify-center gap-x-2 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PhoneIcon
                            className="h-5 w-5 text-indigo-500"
                            aria-hidden="true"
                          />
                          Llamar
                        </a>
                      </div>
                    </div>

                    {/* Panel de detalles expandible */}
                    {selectedProviderId === provider.id && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Comentarios:
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                            {provider.comments || "Sin comentarios"}
                          </p>
                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProviderId(provider.id);
                                setOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProviderToDelete(provider);
                                setDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "search" && <SearchProviders />}
      </div>

      <ProviderForm
        open={open}
        setOpen={setOpen}
        providerToEdit={
          providers.find((p) => p.id === selectedProviderId) || null
        }
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        onConfirm={() => providerToDelete && handleDelete(providerToDelete.id)}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar al proveedor ${providerToDelete?.name}? Esta acción no se puede deshacer.`}
      />

      {/* Aquí iría un Modal, pero estamos usando un enfoque simple para mostrar detalles */}
    </>
  );
};

export default ProvidersList;
