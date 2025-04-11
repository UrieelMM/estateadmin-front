import React, { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Project } from "../../../../../store/projectStore";
import ProjectPDFGenerator from "./ProjectPDFGenerator";
import ProjectExcelGenerator from "./ProjectExcelGenerator";

interface ProjectExportMenuProps {
  project: Project;
  logoBase64?: string;
  signatureBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
}

const ProjectExportMenu: React.FC<ProjectExportMenuProps> = ({
  project,
  logoBase64,
  signatureBase64,
  adminCompany,
  adminPhone,
  adminEmail,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left mt-2">
      <div>
        <Menu.Button className="flex items-center gap-2 bg-indigo-600 text-white text-sm py-1 px-2 rounded font-medium hover:bg-indigo-700">
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Exportar
          <svg
            className="-mr-1 ml-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <div
                  className={`${
                    active
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-200"
                  } flex w-full py-2 text-sm items-center`}
                >
                  <ProjectPDFGenerator
                    project={project}
                    logoBase64={logoBase64}
                    signatureBase64={signatureBase64}
                    adminCompany={adminCompany}
                    adminPhone={adminPhone}
                    adminEmail={adminEmail}
                  />
                </div>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <div
                  className={`${
                    active
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-200"
                  } flex w-full py-2 text-sm items-center`}
                >
                  <ProjectExcelGenerator project={project} />
                </div>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ProjectExportMenu;
