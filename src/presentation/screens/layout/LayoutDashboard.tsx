import React, { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon, Bars3Icon } from '@heroicons/react/16/solid'; 
import { navigation } from './navigation';
import Navbar from '../../components/shared/Navbar';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Props {
  children: React.ReactNode;
}

const LayoutDashboard = ({ children }: Props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Mobile menu button */}
      <div className="md:hidden px-1 py-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-600 focus:outline-none "
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Sidebar/menu content */}
      <div
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block  w-52 md:w-56 lg:w-56 border-r border-gray-200`}
      >
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between h-16 border-b w- border-gray-200 p-4">
            <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt="Your Company"
            />
          </div>
          <nav className="flex-1 overflow-y-auto" aria-label="Sidebar">
            <ul className="py-6 space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  {!item.children ? (
                    <a
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-indigo-100' : 'hover:bg-indigo-100',
                        'group flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md'
                      )}
                    >
                      <item.icon className="mr-3 h-6 w-6 text-gray-400" aria-hidden="true" />
                      {item.name}
                    </a>
                  ) : (
                    <Disclosure as="div" className="space-y-1">
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={classNames(
                              item.current ? 'bg-indigo-100' : 'hover:bg-indigo-100',
                              'group w-full flex items-center  px-4 py-2 text-left text-sm font-medium text-gray-600 rounded-md focus:outline-none '
                            )}
                          >
                            <item.icon className="mr-3 h-6 w-6 text-gray-400" aria-hidden="true" />
                            {item.name}
                            <ChevronRightIcon
                              className={`${open ? 'transform rotate-90' : ''} ml-auto h-5 w-5 transition-transform`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="space-y-1">
                            {item.children.map((subItem) => (
                              <Disclosure.Button
                                key={subItem.name}
                                as="a"
                                href={subItem.href}
                                className="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-indigo-100"
                              >
                                {subItem.name}
                              </Disclosure.Button>
                            ))}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
      <nav>
        <Navbar />
      </nav>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

export default LayoutDashboard;