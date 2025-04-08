import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import KanbanBoard from "./KanbanBoard";

interface KanbanBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const KanbanBoardModal: React.FC<KanbanBoardModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" />

        {/* Modal container */}
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            {/* Modal panel - 90% del tamaño de la pantalla */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform rounded-xl p-4 bg-white dark:bg-gray-900 text-left shadow-xl transition-all w-[90vw] h-[90vh] overflow-hidden">
                {/* Header del modal */}
                <div className="flex justify-between items-center border-b rounded-lg border-gray-200 dark:border-gray-700 p-4 bg-indigo-700 dark:bg-gray-800">
                  <Dialog.Title className="text-lg font-medium text-white">
                    Tablero Kanban: {projectName}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-indigo-200 hover:text-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Contenido del modal - el tablero Kanban */}
                <div className="p-4 h-[calc(90vh-64px)] overflow-auto">
                  <KanbanBoard
                    projectId={projectId}
                    projectName={projectName}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default KanbanBoardModal;
