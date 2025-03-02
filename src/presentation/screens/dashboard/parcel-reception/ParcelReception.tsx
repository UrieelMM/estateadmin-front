import { useState } from "react";
import ParcelReceptionForm from "../../../components/shared/forms/ParcerlReceptionForm";

const shipping = [
  {
    name: "Lindsay Walton",
    title: "Front-end Developer",
    email: "lindsay.walton@example.com",
    status: "shipping",
  },
  {
    name: "Whitney Francis",
    title: "Front-end Developer",
    email: "lindsay.walton@example.com",
    status: "pending",
  },
];

const ParcelReception = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="tex-md">Recepción y entrega de paquetes</p>
          <button className="btn-primary  h-10 mb-3" onClick={() => setOpen(!open)}>
            Agregar Paquete
          </button>
        </header>
        <div className="-mx-4 mt-8 sm:-mx-0">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-gray-100"
                >
                  Propietario
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-gray-100"
                >
                  Receptor
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
                  Estatus
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800">
              {shipping.map((person) => (
                <tr key={person.email} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer pr-4">
                  <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-0 dark:text-gray-100">
                    {person.name}
                    <dl className="font-normal lg:hidden">
                      <dt className="sr-only">Title</dt>
                      <dd className="mt-1 truncate text-gray-700">
                        {person.title}
                      </dd>
                      <dt className="sr-only sm:hidden">Email</dt>
                      <dd className="mt-1 truncate text-gray-500 sm:hidden">
                        {person.email}
                      </dd>
                    </dl>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell dark:text-gray-100">
                    {person.title}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-100">
                    {person.email}
                  </td>
                  {
                    person.status === "shipping" ? (
                        <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-100">
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Entregado
                            </span>
                        </td>
                        ) : (
                        <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-100">
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                                Pendiente
                            </span>
                        </td>
                    )
                  }
                  <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <a
                      href="#"
                      className="text-white  bg-indigo-500 hover:bg-indigo-600 py-1 px-4 rounded"
                    >
                      Editar<span className="sr-only">, {person.name}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ParcelReceptionForm open={open} setOpen={setOpen} />
    </>
  );
};

export default ParcelReception;
