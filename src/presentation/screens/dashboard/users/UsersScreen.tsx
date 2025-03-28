/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { UserData } from "../../../../interfaces/UserData";
import useUserStore from "../../../../store/UserDataStore";
import UserDetailsCondominium from "../../../components/shared/userDetails/UserDetailsCondominium";
import EditUserModal from "../../../components/shared/userDetails/EditUserModal";

const UsersScreen = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const pageSize = 10; // Cantidad de usuarios por página

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
      const filteredUsers = await searchUsersByName(searchTerm, pageSize, 1);
      setUsers(filteredUsers);
    } else {
      fetchUsers(1); // Si la búsqueda está vacía, recuperar usuarios normales
    }
  };

  const fetchUsers = async (page: number) => {
    const fetchedUsers = await fetchPaginatedCondominiumsUsers(pageSize, page);
    setUsers(fetchedUsers);
  };

  const handleEditSuccess = () => {
    fetchUsers(currentPage); // Recargar la página actual
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  return (
    <>
      <div className="px-4 shadow-lg  py-4 rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-xl font-medium">Condominos</p>
        </header>
        <form className="my-8" onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <input
              type="search"
              name="user-search"
              onChange={(e) => setSearchTerm(e.target.value)}
              id="user-search"
              style={{
                backgroundColor: "white !important",
                color: "black !important",
              }}
              className="block w-full p-4 pl-10 text-sm border outline-none border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-0 dark:focus:border-indigo-300"
              placeholder="Buscar por nombre"
            />
            <button
              type="submit"
              className="text-white absolute right-2.5 bottom-2.5 bg-indigo-700 hover:bg-indigo-800 focus:outline-none font-medium rounded-lg text-sm px-4 py-2 "
            >
              Buscar
            </button>
          </div>
        </form>
        <div className="-mx-4 mt-8 min-h-[580px] sm:-mx-0">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-gray-100"
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-gray-100"
                >
                  Teléfono
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-gray-100"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                  Departamento
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-gray-100"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user.email}
                  className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-0 dark:text-gray-100">
                    {user.name} {user.lastName}
                    <dl className="font-normal lg:hidden">
                      <dd className="mt-1 truncate text-gray-700 dark:text-gray-100">
                        {user.phone}
                      </dd>
                      <dd className="mt-1 truncate text-gray-500 sm:hidden dark:text-gray-100">
                        {user.email}
                      </dd>
                    </dl>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell dark:text-gray-100">
                    {user.phone}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-100">
                    {user.email}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-100">
                    {user.role}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-100">
                    {user.number}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-100">
                    <div className="flex-col lg:flex-row">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditUser(user.uid);
                        }}
                        className="bg-indigo-50 p-2 rounded-md text-indigo-900 hover:bg-indigo-100 mr-2"
                      >
                        Editar
                      </a>
                      <a
                        onClick={() => handleViewUser(user.uid)}
                        href="#"
                        className="bg-indigo-600 px-3 py-2 rounded-md text-white hover:bg-indigo-700 ml-2"
                      >
                        Ver
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() =>
              setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
            }
            disabled={currentPage === 1}
            className="px-4 py-2 cursor-pointer btn-secundary "
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((prevPage) => prevPage + 1)}
            disabled={users.length < pageSize}
            className="px-4 py-2 cursor-pointer btn-primary"
          >
            Siguiente
          </button>
        </div>
      </div>
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
