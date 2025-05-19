import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { executeSuperAdminOperation } from "../../../services/superAdminService";
import useSuperAdminStore from "../../../store/superAdmin/SuperAdminStore";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";
import NewClientForm from "../../components/superAdmin/NewClientForm";
import ClientEditModal from "../../components/superAdmin/ClientEditModal";
import CredentialsModal from "../../components/superAdmin/CredentialsModal";
import CondominiumEditModal from "../../components/superAdmin/CondominiumEditModal";

// Interfaz actualizada para cliente
interface Client {
  id: string;
  companyName: string;
  email: string;
  country: string;
  createdDate: any; // Firestore timestamp
  RFC: string;
  status: "active" | "inactive" | "pending" | "blocked";
  plan?: string;
  condominiumsCount?: number;
  businessName?: string;
  fullFiscalAddress?: string;
  taxRegime?: string;
  businessActivity?: string;
  condominiumLimit?: number;
  // Datos del administrador
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  responsiblePersonName?: string;
  responsiblePersonPosition?: string;
  condominiums?: any[]; // Lista de condominios asociados al cliente
  totalRegularUsers?: number;
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const planColors = {
  Basic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Essential:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Professional: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  Premium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Free: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
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
    setCurrentCondominium,
    setCredentials,
    fetchClientsWithCondominiums,
    loading: storeLoading,
  } = useClientsConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isCondominiumEditModalOpen, setIsCondominiumEditModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [condominiumToDelete, setCondominiumToDelete] = useState<{
    clientId: string;
    condominiumId: string;
  } | null>(null);

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

  const filteredClients = (
    clientsWithCondominiums.length > 0 ? clientsWithCondominiums : clients
  ).filter(
    (client: Client) =>
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.businessName &&
        client.businessName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (client.RFC &&
        client.RFC.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.plan &&
        client.plan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.name &&
        client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.lastName &&
        client.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteClient = async (clientId: string) => {
    // Abrir el modal de confirmación
    setClientToDelete(clientId);
    setIsDeleteModalOpen(true);
  };

  // Nueva función para confirmar la eliminación cuando el usuario acepta en el modal
  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      setLoading(true);
      // Usar la Cloud Function para operaciones críticas
      const result = await executeSuperAdminOperation(
        "delete_client",
        clientToDelete,
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
      // Cerrar el modal y limpiar el estado
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // Función para abrir el modal de edición con los datos del cliente
  const openEditModal = (client: Client) => {
    // Asegurar compatibilidad del status con el tipo esperado por setCurrentClient
    const compatibleClient = {
      ...client,
      status: client.status === "blocked" ? "inactive" : client.status,
    };
    setCurrentClient(compatibleClient);
    setIsEditModalOpen(true);
  };

  // Función para abrir el modal de edición de condominio
  const openCondominiumEditModal = (clientId: string, condominium: any) => {
    const client = filteredClients.find((c) => c.id === clientId);
    if (client) {
      // Establecer el cliente actual (necesario para actualizar el condominio)
      const compatibleClient = {
        ...client,
        status: client.status === "blocked" ? "inactive" : client.status,
      };
      setCurrentClient(compatibleClient);

      // Establecer el condominio actual
      setCurrentCondominium(condominium);

      // Abrir el modal
      setIsCondominiumEditModalOpen(true);
    } else {
      toast.error("No se pudo encontrar el cliente para este condominio");
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

  // Función para alternar la expansión de una fila
  const toggleRowExpansion = (clientId: string, event: React.MouseEvent) => {
    // Evitar que se expanda al hacer clic en botones de acción
    if ((event.target as HTMLElement).closest(".action-button")) {
      return;
    }

    setExpandedRows((prevExpandedRows) => {
      if (prevExpandedRows.includes(clientId)) {
        return prevExpandedRows.filter((id) => id !== clientId);
      } else {
        return [...prevExpandedRows, clientId];
      }
    });
  };

  // Verificar si una fila está expandida
  const isRowExpanded = (clientId: string) => {
    return expandedRows.includes(clientId);
  };

  const handleDeleteCondominium = async (
    clientId: string,
    condominiumId: string
  ) => {
    // Guardar la info y abrir el modal
    setCondominiumToDelete({ clientId, condominiumId });
    setIsDeleteModalOpen(true);
  };

  // Nueva función para confirmar la eliminación del condominio
  const confirmDeleteCondominium = async () => {
    if (!condominiumToDelete) return;

    try {
      setLoading(true);

      const result = await executeSuperAdminOperation(
        "delete_condominium",
        condominiumToDelete.condominiumId,
        {
          clientId: condominiumToDelete.clientId,
          reason: "Eliminación solicitada por administrador",
        }
      );

      if (result && result.success) {
        toast.success("Condominio eliminado con éxito");
        // Recargar la lista de clientes
        loadClients();
      } else {
        toast.error("No se pudo eliminar el condominio");
      }
    } catch (error) {
      console.error("Error al eliminar condominio:", error);
      toast.error(
        "Error al eliminar el condominio. Verifique su conexión o permisos."
      );
    } finally {
      setLoading(false);
      // Cerrar el modal y limpiar el estado
      setIsDeleteModalOpen(false);
      setCondominiumToDelete(null);
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
            placeholder="Buscar por email..."
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
                    Empresa
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Información
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Datos Fiscales
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Condominios
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
                {filteredClients.map((client: Client) => (
                  <React.Fragment key={client.id}>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        isRowExpanded(client.id)
                          ? "bg-gray-50 dark:bg-gray-700"
                          : ""
                      }`}
                      onClick={(e) => toggleRowExpansion(client.id, e)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isRowExpanded(client.id) ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                          )}
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {client.companyName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {client.businessName || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {client.name} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Tel: {client.phoneNumber || "-"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Email: {client.email}
                          </div>
                          {client.responsiblePersonName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Resp: {client.responsiblePersonName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            RFC: {client.RFC || "-"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            País: {client.country || "-"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            Régimen: {client.taxRegime || "-"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Act: {client.businessActivity || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            <span className="font-bold mr-1">Condominios:</span>
                            {client.condominiumsCount !== undefined
                              ? client.condominiumsCount
                              : "..."}
                          </div>

                          {client.condominiumLimit && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-bold mr-1">
                                Límite de condóminos:
                              </span>
                              {client.condominiumLimit}
                            </div>
                          )}

                          {client.condominiumLimit && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-bold mr-1">
                                Condóminos:
                              </span>
                              {client.totalRegularUsers !== undefined
                                ? Math.round(
                                    (client.totalRegularUsers /
                                      client.condominiumLimit) *
                                      100
                                  )
                                : Math.round(
                                    ((client.condominiumsCount || 0) /
                                      client.condominiumLimit) *
                                      100
                                  )}
                              % usado
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(client);
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 action-button"
                            title="Editar cliente"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 action-button"
                            title="Eliminar cliente"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Filas expandibles con información de condominios */}
                    {isRowExpanded(client.id) && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-0 py-0 border-b border-gray-200 dark:border-gray-700"
                        >
                          <div className="bg-gray-50 dark:bg-gray-900 p-4">
                            <div className="mb-3">
                              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                                Condominios de {client.companyName}
                              </h3>
                            </div>

                            {client.condominiums &&
                            client.condominiums.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Nombre
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Dirección
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Plan
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Estado
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Creado
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Acciones
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {client.condominiums.map(
                                      (condominium, index) => (
                                        <tr
                                          key={condominium.id || index}
                                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {condominium.name}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {condominium.address || "-"}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <span
                                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                planColors[
                                                  condominium.plan as keyof typeof planColors
                                                ] ||
                                                "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                              }`}
                                            >
                                              {condominium.plan || "Free"}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            <span
                                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                statusColors[
                                                  condominium.status as keyof typeof statusColors
                                                ] ||
                                                "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                              }`}
                                            >
                                              {condominium.status === "active"
                                                ? "Activo"
                                                : condominium.status ===
                                                  "inactive"
                                                ? "Inactivo"
                                                : condominium.status ===
                                                  "blocked"
                                                ? "Bloqueado"
                                                : "Pendiente"}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {condominium.createdDate &&
                                            condominium.createdDate.toDate
                                              ? condominium.createdDate
                                                  .toDate()
                                                  .toLocaleDateString("es-ES")
                                              : "-"}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openCondominiumEditModal(
                                                    client.id,
                                                    condominium
                                                  );
                                                }}
                                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 action-button"
                                                title="Editar condominio"
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteCondominium(
                                                    client.id,
                                                    condominium.id
                                                  );
                                                }}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 action-button"
                                                title="Eliminar condominio"
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No hay condominios registrados para este cliente
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
        onSubmit={handleCreateClient as any}
      />

      {/* Modal de Credenciales con Componente Separado */}
      <CredentialsModal
        isOpen={showCredentials}
        onClose={() => {
          setShowCredentials(false);
          setCredentials(null);
        }}
      />

      {/* Modal de Edición de Condominio */}
      <CondominiumEditModal
        isOpen={isCondominiumEditModalOpen}
        onClose={() => setIsCondominiumEditModalOpen(false)}
        onSuccess={loadClients}
      />

      {/* Modal de Confirmación para Eliminación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {clientToDelete ? "Eliminar Cliente" : "Eliminar Condominio"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {clientToDelete
                  ? "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
                  : "¿Estás seguro de que deseas eliminar este condominio? Esta acción no se puede deshacer."}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setClientToDelete(null);
                    setCondominiumToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={
                    clientToDelete
                      ? confirmDeleteClient
                      : confirmDeleteCondominium
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  {loading ? "Eliminando..." : "Confirmar Eliminación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;
