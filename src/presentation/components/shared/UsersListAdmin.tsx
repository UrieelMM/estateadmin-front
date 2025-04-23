import { useState, useEffect } from "react";
import UserDetailsAdmin from "./userDetails/UserDetailsAdmin";
import { PlusIcon } from "@heroicons/react/24/solid";
import useUserStore from "../../../store/UserDataStore";
import { UserData } from "../../../interfaces/UserData";

const UsersListAdmin = () => {
  const [open, setOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const fetchAdminUsers = useUserStore((state) => state.fetchAdminUsers);
  const adminUsers = useUserStore((state) => state.adminUsers);
  const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);

  useEffect(() => {
    fetchAdminUsers();
    if (adminUsers.length > 0) {
      setUsersList(adminUsers);
    }
  }, [fetchAdminUsers, adminUsers]);

  const handleViewUser = async (userUid: string) => {
    setOpen(!open);
    const res = await fetchUserDetails(userUid);
    if (res) {
      setUserDetails(res);
    }
  };

  return (
    <div className=" w-full ml-0 xl:ml-4 h-full md:w-[100%]">
      <p className="font-medium text-center mb-2 xl:text-xl text-md">
        Personal
      </p>
      <table className="w-full shadow-lg rounded-md">
        <thead>
          <tr className="bg-indigo-500 px-2 ">
            <th className="py-2 text-white rounded-l-md">Nombre</th>
            <th className="py-2 text-white">Email</th>
            <th className="py-2 text-white">Role</th>
            <th className="py-2 text-white rounded-r-md">Detalles</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((user) => (
            <tr key={user.uid} className="border-b">
              <td className="p-4 h-16 text-sm text-left font-medium">
                {user?.name} {user?.lastName}
              </td>
              <td className="p-4 h-16 text-sm text-center">{user?.email}</td>
              <td className="p-4 h-16 text-sm text-center">
                {user?.role === "admin" && "Administrador"}
                {user?.role === "admin-assistant" && "Asistente"}
              </td>
              <td className="p-4 h-16 text-sm text-center">
                <button
                  onClick={() => handleViewUser(user.uid)}
                  className="bg-indigo-50 px-3 py-1 rounded-md text-indigo-900 hover:bg-indigo-100 ml-2"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="w-full mt-4">
        <button className="flex w-full text-center justify-center py-1 text-indigo-600 bg-white border border-indigo-500 rounded-md">
          <PlusIcon className="h-6 w-6" />
          Agregar usuario
        </button>
      </div>
      <UserDetailsAdmin
        open={open}
        setOpen={setOpen}
        userDetails={userDetails}
      />
    </div>
  );
};

export default UsersListAdmin;
