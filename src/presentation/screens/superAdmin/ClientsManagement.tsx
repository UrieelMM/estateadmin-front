import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { executeSuperAdminOperation } from "../../../services/superAdminService";
import useSuperAdminStore from "../../../store/superAdmin/SuperAdminStore";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";
import NewClientForm from "../../components/shared/forms/NewClientForm";
import ClientEditModal from "../../components/superAdmin/ClientEditModal";
import CredentialsModal from "../../components/superAdmin/CredentialsModal";

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const ClientsManagement: React.FC = () => {
  const {
    clients,
    loadingClients,
    error,
    fetchClients: fetchClientsFromStore,
    createClient,
  } = useSuperAdminStore();

  const {
    clientsWithCondominiums,
    setCurrentClient,
    setCredentials,
    fetchClientsWithCondominiums,
    loading: storeLoading,
  } = useClientsConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const loadClients = async () => {
    await fetchClientsFromStore();
    // Después de cargar los clientes básicos, cargamos la información de condominios
    if (clients.length > 0) {
      await fetchClientsWithCondominiums(clients);
    }
  };

  useEffect(() => {
    // Cargar clientes cuando se monta el componente
    loadClients();
  }, []);

  // Cuando clients cambia y hay clientes disponibles, actualizar con la información de condominios
  useEffect(() => {
    if (clients.length > 0 && !loadingClients) {
      fetchClientsWithCondominiums(clients);
    }
  }, [clients, loadingClients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredClients =
    clientsWithCondominiums.length > 0
      ? clientsWithCondominiums.filter(
          (client) =>
            client.companyName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.plan &&
              client.plan.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : clients.filter(
          (client) =>
            client.companyName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.plan &&
              client.plan.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  const handleDeleteClient = async (clientId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
      )
    ) {
      try {
        setLoading(true);

        // Usar la Cloud Function para operaciones críticas
        const result = await executeSuperAdminOperation(
          "delete_client",
          clientId,
          { reason: "Eliminación solicitada por administrador" }
        );

        if (result && result.success) {
          toast.success("Cliente eliminado con éxito");
          // Recargar la lista de clientes
          loadClients();
        } else {
          toast.error("No se pudo eliminar el cliente");
        }
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        toast.error(
          "Error al eliminar el cliente. Verifique su conexión o permisos."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para abrir el modal de edición con los datos del cliente
  const openEditModal = (client: any) => {
    setCurrentClient(client);
    setIsEditModalOpen(true);
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      setLoading(true);
      const result = await createClient(clientData);
      if (result.success) {
        toast.success("Cliente creado exitosamente");
        setIsCreateModalOpen(false);
        // Mostrar las credenciales en el modal
        if (result.credentials) {
          setCredentials(result.credentials);
          setShowCredentials(true);
        }
      } else {
        toast.error("No se pudo crear el cliente");
      }
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Clientes
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra los clientes de la plataforma
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Buscar clientes..."
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {loadingClients || loading || storeLoading ? (
          <div className="animate-pulse p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            <p>Error al cargar los datos: {error}</p>
            <button
              onClick={() => loadClients()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Plan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Condominios
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Fecha Registro
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {client.companyName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {client.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[
                            client.status as keyof typeof statusColors
                          ]
                        }`}
                      >
                        {client.status === "active"
                          ? "Activo"
                          : client.status === "inactive"
                          ? "Inactivo"
                          : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {client.condominiumsCount !== undefined
                        ? client.condominiumsCount
                        : "..."}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {client.createdDate && client.createdDate.toDate
                        ? client.createdDate
                            .toDate()
                            .toLocaleDateString("es-ES")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(client)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición con Componente Separado */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadClients}
      />

      {/* Modal para crear nuevo cliente */}
      <NewClientForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
      />

      {/* Modal de Credenciales con Componente Separado */}
      <CredentialsModal
        isOpen={showCredentials}
        onClose={() => {
          setShowCredentials(false);
          setCredentials(null);
        }}
      />
    </div>
  );
};

export default ClientsManagement;
