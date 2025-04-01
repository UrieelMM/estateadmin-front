import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  clientId: string;
  clientName: string;
  lastLogin: any; // Firestore timestamp
  status: "active" | "inactive" | "suspended";
}

const roleColors = {
  admin:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "provider-admin":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "super-provider-admin":
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  operator: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // En una implementación real, estos datos vendrían de Firestore
        // Aquí simulamos una carga de datos
        setTimeout(() => {
          setUsers([
            {
              id: "user1",
              name: "Admin Principal",
              email: "admin@estateadmin.com",
              role: "super-provider-admin",
              clientId: "system",
              clientName: "Estate Admin",
              lastLogin: { toDate: () => new Date("2024-04-01") },
              status: "active",
            },
            {
              id: "user2",
              name: "Juan Pérez",
              email: "juan@laspalmas.com",
              role: "admin",
              clientId: "client1",
              clientName: "Condominio Las Palmas",
              lastLogin: { toDate: () => new Date("2024-03-28") },
              status: "active",
            },
            {
              id: "user3",
              name: "María González",
              email: "maria@losrobles.com",
              role: "provider-admin",
              clientId: "client2",
              clientName: "Residencial Los Robles",
              lastLogin: { toDate: () => new Date("2024-03-15") },
              status: "active",
            },
            {
              id: "user4",
              name: "Carlos Ramírez",
              email: "carlos@torresaragon.com",
              role: "operator",
              clientId: "client3",
              clientName: "Torres de Aragón",
              lastLogin: { toDate: () => new Date("2024-02-20") },
              status: "inactive",
            },
            {
              id: "user5",
              name: "Lucía Fernández",
              email: "lucia@pacifichills.com",
              role: "user",
              clientId: "client4",
              clientName: "Conjunto Pacific Hills",
              lastLogin: { toDate: () => new Date("2024-01-10") },
              status: "suspended",
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        toast.error("Error al cargar los datos de usuarios");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "inactive" | "suspended"
  ) => {
    try {
      // En una implementación real, actualizarías el estado en Firestore
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      toast.success(`Estado actualizado con éxito`);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar el estado del usuario");
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "super-provider-admin":
        return "Super Administrador";
      case "provider-admin":
        return "Administrador de Proveedores";
      case "admin":
        return "Administrador";
      case "operator":
        return "Operador";
      case "user":
        return "Usuario";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Usuarios
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra los usuarios del sistema
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
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
            placeholder="Buscar usuarios..."
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="animate-pulse p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
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
                    Usuario
                  </th>
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
                    Rol
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
                    Último login
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.clientName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {user.clientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          roleColors[user.role as keyof typeof roleColors] ||
                          roleColors.user
                        }`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[user.status]
                        }`}
                      >
                        {user.status === "active"
                          ? "Activo"
                          : user.status === "inactive"
                          ? "Inactivo"
                          : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin?.toDate().toLocaleDateString("es-ES")}
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
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Reiniciar contraseña"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
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
    </div>
  );
};

export default UserManagement;
