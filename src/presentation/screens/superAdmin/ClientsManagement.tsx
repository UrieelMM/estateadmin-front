import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { executeSuperAdminOperation } from "../../../services/superAdminService";
import useSuperAdminStore from "../../../store/SuperAdminStore";
import NewClientForm from "../../components/shared/forms/NewClientForm";

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

// Interfaz para el cliente
interface ClientFormData {
  id: string;
  companyName: string;
  email: string;
  country: string;
  RFC: string;
  status: "active" | "inactive" | "pending";
  plan: string;
}

interface ClientCredentials {
  email: string;
  password: string;
}

const ClientsManagement: React.FC = () => {
  const { clients, loadingClients, error, fetchClients, createClient } =
    useSuperAdminStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientFormData | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<ClientCredentials | null>(
    null
  );

  useEffect(() => {
    // Cargar clientes usando el store
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          fetchClients();
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
    setCurrentClient({
      id: client.id,
      companyName: client.companyName,
      email: client.email,
      country: client.country || "",
      RFC: client.RFC || "",
      status: client.status,
      plan: client.plan || "Free",
    });
    setIsEditModalOpen(true);
  };

  // Actualizar datos del cliente en formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (currentClient) {
      setCurrentClient({
        ...currentClient,
        [e.target.name]: e.target.value,
      });
    }
  };

  // Enviar datos actualizados del cliente
  const handleSubmitClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClient) return;

    try {
      setLoading(true);

      // Usar la Cloud Function para actualizar cliente
      const result = await executeSuperAdminOperation(
        "update_client",
        currentClient.id,
        {
          companyName: currentClient.companyName,
          email: currentClient.email,
          country: currentClient.country,
          RFC: currentClient.RFC,
          status: currentClient.status,
          plan: currentClient.plan,
        }
      );

      if (result && result.success) {
        toast.success("Cliente actualizado con éxito");
        // Cerrar modal y recargar datos
        setIsEditModalOpen(false);
        fetchClients();
      } else {
        toast.error("No se pudo actualizar el cliente");
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.error("Error al actualizar la información del cliente");
    } finally {
      setLoading(false);
    }
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

  // Modal de edición de cliente
  const ClientEditModal = () => {
    if (!currentClient) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-2">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Editar Cliente
            </h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmitClientEdit} className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={currentClient.companyName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={currentClient.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="RFC"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  RFC
                </label>
                <input
                  type="text"
                  name="RFC"
                  id="RFC"
                  value={currentClient.RFC}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  País
                </label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  value={currentClient.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="plan"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Plan
                </label>
                <select
                  name="plan"
                  id="plan"
                  value={currentClient.plan}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Estado
                </label>
                <select
                  name="status"
                  id="status"
                  value={currentClient.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
        {loadingClients || loading ? (
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
              onClick={() => fetchClients()}
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
                          statusColors[client.status]
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
                      {client.condominiumsCount}
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

      {/* Modal de Edición */}
      {isEditModalOpen && <ClientEditModal />}

      {/* Modal para crear nuevo cliente */}
      <NewClientForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
      />

      {/* Modal de Credenciales */}
      {showCredentials && credentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Credenciales del Cliente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentials.email}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(credentials.email)
                    }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentials.password}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(credentials.password)
                    }
                    className="ml-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setCredentials(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;
