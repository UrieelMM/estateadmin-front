import { useState } from 'react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'
import ProviderForm from '../../../components/shared/forms/ProviderForm'


const people = [
  {
    name: 'Jane Cooper',
    title: 'Paradigm Representative',
    role: 'Telefonía e Internet',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Cody Fisher',
    title: 'Paradigm Representative',
    role: 'Telefonía e Internet',
    email: 'codyfisher@example.com',
    telephone: '+1-202-555-0191',
    imageUrl:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Esther Howard',
    title: 'Paradigm Representative',
    role: 'Telefonía e Internet',
    email: 'estherhoward@example.com',
    telephone: '+1-202-555-0115',
    imageUrl:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Jenny Wilson',
    title: 'Paradigm Representative',
    role: 'Telefonía e Internet',
    email: 'jennywilson@example.com',
    telephone: '+1-202-555-0115',
    imageUrl:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
]

const ProvidersList = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
    <header className="bg-gray-50 shadow-md flex w-full h-16 justify-between px-2 rounded-md items-center mb-2">
        <p className="tex-md font-medium ">Proveedores</p>
        <button className="btn-primary h-10 mb-3" onClick={() => setOpen(!open)}>Agregar proveedor</button>
      </header>
      <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {people.map((person) => (
          <li
            key={person.email}
            className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-lg"
          >
            <div className="flex flex-1 flex-col p-8">
              {/* <img className="mx-auto h-32 w-32 flex-shrink-0 rounded-full" src={person.imageUrl} alt="" /> */}
              <span className="w-32 h-32 mx-auto rounded-full flex justify-center items-center bg-indigo-300 text-white text-2xl font-bold">
                  {person.name.substring(0, 1)}
              </span>
              <h3 className="mt-6 text-sm font-medium text-gray-900">{person.name}</h3>
              <dl className="mt-1 flex flex-grow flex-col justify-between">
                <dt className="sr-only">Title</dt>
                <dd className="text-sm text-gray-500">{person.telephone}</dd>
                <dt className="sr-only">Role</dt>
                <dd className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {person.role}
                  </span>
                </dd>
              </dl>
            </div>
            <div>
              <div className="-mt-px flex divide-x divide-gray-200">
                <div className="flex w-0 flex-1">
                  <a
                    href={`mailto:${person.email}`}
                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  >
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    Email
                  </a>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <a
                    href={`tel:${person.telephone}`}
                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  >
                    <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    Llamar
                  </a>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ProviderForm open={open} setOpen={setOpen} />
    </>
  )
}

export default ProvidersList