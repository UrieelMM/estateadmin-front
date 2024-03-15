import { useState } from "react";
import UserDetailsAdmin from "./userDetails/UserDetailsAdmin";
import { PlusIcon } from "@heroicons/react/24/outline";

const usersList = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@mail.com',
        role: 'Admin',
        status: 'Active'
    },
    {
        id: 2,
        name: 'Mary Doe',
        email: 'mary@mail.com',
        role: 'Admin',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Sara Doe',
        email: 'sara@mail.com',
        role: 'Admin',
        status: 'Active'
    },
    {
        id: 4,
        name: 'Alex Doe',
        email: 'alex@mail.com',
        role: 'Admin',
        status: 'Active'
    },
    {
        id: 5,
        name: 'Robert Doe',
        email: 'robert@mail.com',
        role: 'Admin',
        status: 'Active'
    },
    {
        id: 6,
        name: 'Ursula Doe',
        email: 'ursula@mail.com',
        role: 'Admin',
        status: 'Active'
    },

]

const UsersListAdmin = () => {
    const [open, setOpen] = useState(false)
    
  return (
    <div className=" w-full ml-0 xl:ml-4 h-full md:w-[100%]">
        <p className="font-medium text-center mb-2 xl:text-xl text-md">Personal</p>
        <table className="w-full shadow-lg rounded-md">
            <thead>
            <tr className="bg-indigo-500 px-2 ">
                <th className="py-2 text-white rounded-l-md">Name</th>
                <th className="py-2 text-white">Email</th>
                <th className="py-2 text-white">Role</th>
                <th className="py-2 text-white rounded-r-md">Status</th>
            </tr>
            </thead>
            <tbody>
            {usersList.map((user) => (
                <tr key={user.id} className="border-b">
                <td className="p-4 h-16 text-sm font-medium">{user.name}</td>
                <td className="p-4 h-16 text-sm">{user.email}</td>
                <td className="p-4 h-16 text-sm">{user.role}</td>
                <td className="p-4 h-16 text-sm">
                    <button onClick={() => setOpen(!open)} className="bg-indigo-50 px-3 py-1 rounded-md text-indigo-900 hover:bg-indigo-100 ml-2">
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
        <UserDetailsAdmin open={open} setOpen={setOpen} />
    </div>
  )
}

export default UsersListAdmin