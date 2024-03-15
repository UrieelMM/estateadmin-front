
const people = [
  { name: 'Lindsay Walton', phone: '55 34-53-45-32', email: 'lindsay.walton@example.com', role: 'Propietario' },
  { name: 'Lindsay Walton', phone: '55 34-53-45-32', email: 'lindsay.walton@example.com', role: 'Propietario' },
  { name: 'Lindsay Walton', phone: '55 34-53-45-32', email: 'lindsay.walton@example.com', role: 'Propietario' },
  { name: 'Lindsay Walton', phone: '55 34-53-45-32', email: 'lindsay.walton@example.com', role: 'Propietario' },
  { name: 'Lindsay Walton', phone: '55 34-53-45-32', email: 'lindsay.walton@example.com', role: 'Propietario' },
]

const UsersScreen = () => {
  return (
    <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
      <header className="bg-gray-50 shadow-md flex w-full h-16 justify-center px-2 rounded-md items-center mb-2">
        <p className="text-xl font-medium">Condominos</p>
      </header>
      <div className="-mx-4 mt-8 sm:-mx-0">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                Nombre
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
              >
                Teléfono
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
              >
                Email
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {people.map((person) => (
              <tr key={person.email}>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-0">
                  {person.name}
                  <dl className="font-normal lg:hidden">
                    <dt className="sr-only">Title</dt>
                    <dd className="mt-1 truncate text-gray-700">{person.phone}</dd>
                    <dt className="sr-only sm:hidden">Email</dt>
                    <dd className="mt-1 truncate text-gray-500 sm:hidden">{person.email}</dd>
                  </dl>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{person.phone}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">{person.email}</td>
                <td className="px-3 py-4 text-sm text-gray-500">{person.role}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">
                  <div className="flex-col lg:flex-row">
                    <a href="#" className="bg-green-50 p-2 rounded-md text-green-900 hover:bg-green-100 mr-2">
                      Editar
                    </a>
                    <a href="#" className="bg-indigo-50 px-3 py-2 rounded-md text-indigo-900 hover:bg-indigo-100 ml-2">
                      Ver
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UsersScreen