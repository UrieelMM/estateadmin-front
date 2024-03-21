import { Fragment, useState, useEffect } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import ConboBox from './ComboBox'
import { getCurrentDateWithGreeting } from '../../../utils/getCurrentDate'
import useUserStore from '../../../store/UserDataStore'
import { UserData } from '../../../interfaces/UserData'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}



const Navbar = () => {
  const [currentDate, setCurrentDate] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const {fetchUserData, user } = useUserStore(state => ({
    user: state.user,
    fetchUserData: state.fetchUserData,
  }));

  useEffect(() => {
    setCurrentDate(getCurrentDateWithGreeting())
  }, [])

  useEffect(() => {
    fetchUserData();
    if (user) {
      setUserData(user)
    }
  }, [fetchUserData, user]);

  return (
    <Disclosure as="nav" className="bg-gradient-to-r shadow-lg from-indigo-700 to-indigo-600">
        <>
          <div className="w-full px-2 lg:pr-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-start">
                <div className="sm:ml-6 sm:block">
                  <div className="flex space-x-4 items-center">
                    <ConboBox />
                    <p className="text-white text-sm lg:text-base align-middle"><span className="font-bold">Hola, {userData?.name} </span>{currentDate}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none">
                      <span className="absolute -inset-1.5" />
                      {
                        userData?.photoURL ? (
                          <img
                          className="h-12 w-12 rounded-full"
                          src={userData?.photoURL as string}
                          alt=""
                        />
                        ) : 
                        (
                          <p className="bg-indigo-300 text-white rounded-full w-12 h-12 flex justify-center items-center">
                            {userData?.name?.charAt(0)}
                          </p>
                        )
                      }
                      
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Perfil
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Configuración
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Cerrar sesión
                          </a>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>

    </Disclosure>
  )
}

export default Navbar