
import { Disclosure, } from '@headlessui/react'
import { navigation, } from './navigation'
import { ChevronRightIcon } from '@heroicons/react/16/solid';


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface Props {
  children: React.ReactNode;
}

const LayoutDashboard = ({ children }: Props) => {

  return (
    <div className="flex h-screen">
      <div className="flex w-44 flex-col gap-y-5 overflow-y-auto border-r border-gray-200 overflow-hidden bg-white px-4">
        <div className="flex h-16 shrink-0 items-center">
          <img
            className="h-8 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
          />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name} className="w-36">
                    {!item.children ? (
                      <a
                        href={item.href}
                        className={classNames(
                          item.current ? 'bg-indigo-100' : 'hover:bg-indigo-100',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                        {item.name}
                      </a>
                    ) : (
                      <Disclosure as="div">
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={classNames(
                                item.current ? 'bg-indigo-100' : 'hover:bg-indigo-100',
                                'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700'
                              )}
                            >
                              <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                              {item.name}
                              <ChevronRightIcon
                                className={classNames(
                                  open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                  'ml-auto h-5 w-5 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel as="ul" className="mt-1 px-2">
                              {item.children.map((subItem: { name: string; href: string; current?: boolean }) => (
                                <li key={subItem.name}>
                                  {/* 44px */}
                                  <Disclosure.Button
                                    as="a"
                                    href={subItem.href}
                                    className={classNames(
                                      subItem.current ? 'bg-indigo-100' : 'hover:bg-indigo-100',
                                      'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-700'
                                    )}
                                  >
                                    {subItem.name}
                                  </Disclosure.Button>
                                </li>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )}
                  </li>
                ))}
              </ul>
            </li>
            <li className="-mx-6 mt-auto">
              <a
                href="#"
                className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-indigo-200"
              >
                <img
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
                <span className="sr-only">Your profile</span>
                <span aria-hidden="true">Tom Cook</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="xl:pl-72">
        </div>
      </div>

     {/* Create a section with children  */}
      <div className="flex-1 flex  flex-grow flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="relative max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="py-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LayoutDashboard