/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { UserData } from "../../../../interfaces/UserData";
import useUserStore from "../../../../store/UserDataStore";
import UserDetailsCondominium from "../../../components/shared/userDetails/UserDetailsCondominium";
import EditUserModal from "../../../components/shared/userDetails/EditUserModal";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const UsersScreen = () => {
  // Original states
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // New UI/UX enhancement states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    phone: true,
    email: true,
    role: true,
    department: true,
    actions: true,
  });
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [activeFilters, _setActiveFilters] = useState({
    role: null as string | null,
    status: null as string | null,
  });

  const currentCondominiumId = useCondominiumStore(
    (state) => state.selectedCondominium?.id
  );

  const pageSize = 30; // Cantidad de usuarios por página

  const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);
  const fetchPaginatedCondominiumsUsers = useUserStore(
    (state) => state.fetchPaginatedCondominiumsUsers
  );
  const searchUsersByName = useUserStore((state) => state.searchUsersByName);

  const handleViewUser = async (userUid: string) => {
    setOpen(!open);
    const res = await fetchUserDetails(userUid);
    if (res) {
      setUserDetails(res);
    }
  };

  const handleEditUser = async (userUid: string) => {
    setEditOpen(true);
    const res = await fetchUserDetails(userUid);
    if (res) {
      setUserDetails(res);
    }
  };

  const handleSearch = async (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return fetchUsers(1);

    setCurrentPage(1); // Resetear a la primera página después de la búsqueda
    if (searchTerm.trim() !== "") {
      // La función searchUsersByName ahora busca en todos los usuarios, no solo la página actual
      // y ahora también busca por número de departamento/casa
      const filteredUsers = await searchUsersByName(searchTerm, pageSize, 1);
      setUsers(filteredUsers);
    } else {
      fetchUsers(1); // Si la búsqueda está vacía, recuperar usuarios normales
    }
  };

  const fetchUsers = async (page: number) => {
    try {
      setIsLoading(true);
      setLoadingError(null);
      const fetchedUsers = await fetchPaginatedCondominiumsUsers(
        pageSize,
        page
      );
      setUsers(fetchedUsers);
    } catch (error) {
      setLoadingError(
        "Error al cargar usuarios. Por favor, inténtalo de nuevo."
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Table sorting function
  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev?.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { field, direction: "asc" };
    });
  };

  // Column visibility toggle
  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnName as keyof typeof prev]: !prev[columnName as keyof typeof prev],
    }));
  };

  const handleEditSuccess = () => {
    fetchUsers(currentPage); // Recargar la página actual
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Efecto para detectar cambios en el condominio seleccionado
  useEffect(() => {
    if (currentCondominiumId) {
      // Limpiar la lista de usuarios actual
      setUsers([]);
      // Resetear a la primera página y volver a cargar los usuarios
      setCurrentPage(1);
      fetchUsers(1);
    }
  }, [currentCondominiumId]);

  // Memo for sorted users data
  const sortedUsers = useMemo(() => {
    if (!sortConfig) return users;

    return [...users].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortConfig.field) {
        case "name":
          aValue = `${a.name || ""} ${a.lastName || ""}`;
          bValue = `${b.name || ""} ${b.lastName || ""}`;
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "phone":
          aValue = a.phone || "";
          bValue = b.phone || "";
          break;
        case "role":
          aValue = a.role || "";
          bValue = b.role || "";
          break;
        case "department":
          aValue = a.number || "";
          bValue = b.number || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortConfig]);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden transition-all duration-300">
        {/* Header with title and settings */}
        <div className="py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Administración de Condominos
          </h1>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setColumnSettingsOpen(!columnSettingsOpen)}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              aria-label="Configurar columnas"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Column settings dropdown */}
        {columnSettingsOpen && (
          <div className="absolute right-6 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-4 z-10 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Personalizar columnas
            </h3>
            {Object.entries(visibleColumns).map(([key, value]) => (
              <div key={key} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`column-${key}`}
                  checked={value}
                  onChange={() => toggleColumnVisibility(key)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor={`column-${key}`}
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize"
                >
                  {key === "department"
                    ? "Número"
                    : key === "name"
                    ? "Nombre"
                    : key === "phone"
                    ? "Teléfono"
                    : key === "email"
                    ? "Email"
                    : key === "role"
                    ? "Rol"
                    : "Acciones"}
                </label>
              </div>
            ))}
          </div>
        )}
        {/* Search and filter section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  name="user-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="user-search"
                  className="w-full pl-10 pr-4 py-3 text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="Buscar por nombre o número"
                  aria-label="Buscar usuarios por nombre"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm px-4 py-2 transition-colors"
                  aria-label="Iniciar búsqueda"
                >
                  Buscar
                </button>
              </form>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                {activeFilters.role && (
                  <div
                    id="role-filter-dropdown"
                    className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-2">
                      <div className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        Todos
                      </div>
                      <div className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        Administrador
                      </div>
                      <div className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        Usuario
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Table container with responsive design */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : loadingError ? (
            <div className="text-center py-20">
              <div className="text-red-500 mb-4">{loadingError}</div>
              <button
                onClick={() => fetchUsers(currentPage)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <p className="text-xl">No se encontraron usuarios</p>
              <p className="mt-2">
                Intenta con una búsqueda diferente o agrega nuevos usuarios
              </p>
            </div>
          ) : (
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {visibleColumns.name && (
                    <th
                      onClick={() => handleSort("name")}
                      className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <span>Nombre</span>
                        {sortConfig?.field === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                  )}

                  {visibleColumns.phone && (
                    <th
                      onClick={() => handleSort("phone")}
                      className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:table-cell"
                    >
                      <div className="flex items-center">
                        <span>Teléfono</span>
                        {sortConfig?.field === "phone" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                  )}

                  {visibleColumns.email && (
                    <th
                      onClick={() => handleSort("email")}
                      className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:table-cell"
                    >
                      <div className="flex items-center">
                        <span>Email</span>
                        {sortConfig?.field === "email" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                  )}

                  {visibleColumns.role && (
                    <th
                      onClick={() => handleSort("role")}
                      className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <span>Rol</span>
                        {sortConfig?.field === "role" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                  )}

                  {visibleColumns.department && (
                    <th
                      onClick={() => handleSort("department")}
                      className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <span>Número</span>
                        {sortConfig?.field === "department" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                  )}

                  {visibleColumns.actions && (
                    <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {(sortedUsers || []).map((user) => (
                  <tr
                    key={user.uid}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    {visibleColumns.name && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden">
                            {user.photoURL && user.photoURL.trim() !== "" && !imageErrors[user.uid || ''] ? (
                              <img 
                                src={user.photoURL} 
                                alt="User Photo" 
                                className="w-full h-full object-cover"
                                onError={() => setImageErrors(prev => ({ ...prev, [user.uid || '']: true }))}
                              />
                            ) : (
                              <UserCircleIcon className="h-7 w-7" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.name} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 lg:hidden">
                              {user.phone}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:hidden">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleColumns.phone && (
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                        {user.phone}
                      </td>
                    )}

                    {visibleColumns.email && (
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                        {user.email}
                      </td>
                    )}

                    {visibleColumns.role && (
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "Administrador"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                    )}

                    {visibleColumns.department && (
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {user.number}
                      </td>
                    )}

                    {visibleColumns.actions && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user.uid || "")}
                            className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900 dark:hover:bg-opacity-20 transition-colors"
                            aria-label={`Editar usuario ${user.name || ""} ${
                              user.lastName || ""
                            }`}
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewUser(user.uid || "")}
                            className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900 dark:hover:bg-opacity-20 transition-colors"
                            aria-label={`Ver detalles de usuario ${
                              user.name || ""
                            } ${user.lastName || ""}`}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{users.length}</span>{" "}
                usuarios
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
              }
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              } border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((prevPage) => prevPage + 1)}
              disabled={users.length < pageSize}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                users.length < pageSize
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
              } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserDetailsCondominium
        open={open}
        setOpen={setOpen}
        userDetails={userDetails}
      />
      <EditUserModal
        open={editOpen}
        setOpen={setEditOpen}
        userDetails={userDetails}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default UsersScreen;
