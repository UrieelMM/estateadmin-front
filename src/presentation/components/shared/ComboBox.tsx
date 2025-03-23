import { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useCondominiumStore } from '../../../store/useCondominiumStore'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const ComboBox = () => {
  const [mounted, setMounted] = useState(false);
  const { 
    condominiums, 
    selectedCondominium, 
    isLoading,
    error,
    fetchCondominiums, 
    setSelectedCondominium 
  } = useCondominiumStore();

  // Efecto inicial para cargar los condominios
  useEffect(() => {
    if (!mounted) {
      console.log("ComboBox - Montaje inicial");
      fetchCondominiums().then(() => {
        setMounted(true);
        console.log("ComboBox - Condominios cargados inicialmente");
      });
    }
  }, [mounted, fetchCondominiums]);

  // Efecto para monitorear cambios en los condominios
  useEffect(() => {
    console.log("ComboBox - Estado actual:", {
      condominiums,
      selectedCondominium,
      isLoading,
      error,
      mounted
    });
  }, [condominiums, selectedCondominium, isLoading, error, mounted]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-100">
        <span>Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 dark:bg-red-900 dark:text-red-100">
        <span>Error al cargar</span>
      </div>
    );
  }

  if (!mounted || condominiums.length === 0) {
    return (
      <div className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-100">
        <span>No hay condominios</span>
      </div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-900">
          {selectedCondominium?.name || "Seleccionar condominio"}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            {condominiums.map((condominium) => {
              console.log("Renderizando condominio:", condominium);
              return (
                <Menu.Item key={condominium.id}>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        console.log("ComboBox - Seleccionando condominio:", condominium);
                        setSelectedCondominium(condominium);
                      }}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200',
                        'block w-full px-4 py-2 text-left text-sm',
                        selectedCondominium?.id === condominium.id ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                      )}
                    >
                      {condominium.name}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export default ComboBox