import { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  MagnifyingGlassIcon,
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
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
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
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-6 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <p className="tex-md font-medium dark:text-gray-100">Proveedores</p>
        <button
          className="btn-primary h-10 mb-3"
          onClick={() => {
            setSelectedProvider(null);
            setOpen(true);
          }}
        >
          Agregar proveedor
        </button>
      </header>

      {/* Tab Layout */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav
            className="-mb-px flex px-6 space-x-8 dark:border-gray-800 overflow-x-auto custom-scrollbar"
            aria-label="Tabs"
          >
            {/* 1. Tab Proveedores */}
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "providers"
                  ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab("providers")}
            >
              Proveedores
            </button>

            {/* 2. Tab Buscar Proveedores */}
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "search"
                  ? "border-indigo-500 text-indigo-600 dark:text-gray-100"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab("search")}
            >
              Buscar Proveedores
            </button>
          </nav>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-0 py-4">
        {activeTab === "providers" && (
          <>
            <div className="mb-6 px-6">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block px-10 w-full rounded-md h-12 ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                  placeholder="Buscar proveedor por nombre..."
                />
              </div>
            </div>

            {loading ? (
              <LoadingApp />
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : (
              <div className="grid px-6 grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      selectedProvider?.id === provider.id ? "z-10" : ""
                    }`}
                    onClick={() =>
                      setSelectedProvider(
                        selectedProvider?.id === provider.id ? null : provider
                      )
                    }
                  >
                    <div className="flex flex-1 flex-col p-8 dark:bg-gray-800">
                      <span className="w-32 h-32 mx-auto rounded-full flex justify-center items-center bg-indigo-300 text-white text-2xl font-bold">
                        {provider.name.substring(0, 1)}
                      </span>
                      <h3 className="mt-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {provider.name}
                      </h3>
                      <dl className="mt-1 flex flex-grow flex-col justify-between">
                        <dt className="sr-only">Title</dt>
                        <dd className="text-sm text-gray-500 dark:text-gray-100">
                          {provider.phone}
                        </dd>
                        <dd className="text-sm text-gray-500 dark:text-gray-100">
                          {provider.email}
                        </dd>
                        <dt className="sr-only">Role</dt>
                        <dd className="mt-3">
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            {provider.serviceLabel || provider.service}
                          </span>
                        </dd>
                      </dl>
                    </div>
                    <div>
                      <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-500">
                        <div className="flex w-0 flex-1">
                          <a
                            href={`mailto:${provider.email}`}
                            className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EnvelopeIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            Email
                          </a>
                        </div>
                        <div className="-ml-px flex w-0 flex-1">
                          <a
                            href={`tel:${provider.phone}`}
                            className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            Llamar
                          </a>
                        </div>
                      </div>
                    </div>
                    {selectedProvider?.id === provider.id && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {provider.comments}
                          </p>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProvider(provider);
                                setOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
        providerToEdit={selectedProvider}
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        onConfirm={() => providerToDelete && handleDelete(providerToDelete.id)}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar al proveedor ${providerToDelete?.name}? Esta acción no se puede deshacer.`}
      />
    </>
  );
};

export default ProvidersList;
