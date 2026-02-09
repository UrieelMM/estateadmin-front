import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import KanbanBoard from "./KanbanBoard";
import { useProjectTaskStore } from "../../../../../store/projectTaskStore";
import "./kanban.css"; // Se creará este archivo CSS

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
  const { fetchProjectTasks } = useProjectTaskStore();
  const [boardReady, setBoardReady] = useState(false);

  // Pre-cargar las tareas antes de mostrar el tablero
  useEffect(() => {
    if (isOpen) {
      // Resetear el estado al abrir el modal
      setBoardReady(false);

      // Cargar las tareas primero
      const loadTasks = async () => {
        try {
          await fetchProjectTasks(projectId);
          // Darle un pequeño tiempo para asegurar que todos los estados se inicialicen correctamente
          setTimeout(() => {
            setBoardReady(true);
          }, 200);
        } catch (error) {
          console.error("Error al cargar tareas:", error);
          setBoardReady(true); // Permitir mostrar el tablero aunque haya error
        }
      };

      loadTasks();
    }

    // Cuando el modal está abierto, desactivamos el scroll del body
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    // Al cerrar el modal, restauramos el scroll
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, projectId, fetchProjectTasks]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          // Retraso para evitar problemas con animaciones y estados
          setTimeout(() => {
            onClose();
          }, 10);
        }}
      >
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" />

        {/* Modal container */}
        <div className="fixed inset-0 z-10">
          <div className="flex min-h-full items-center justify-center p-0 text-center">
            {/* Modal panel - 95% del tamaño de la pantalla */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform rounded-xl bg-white dark:bg-gray-900 text-left shadow-xl transition-all w-[95vw] h-[95vh] flex flex-col">
                {/* Header del modal */}
                <div className="flex justify-between items-center border-b rounded-lg border-gray-200 dark:border-gray-700 p-4 bg-indigo-700 dark:bg-gray-800">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-white">
                      Tablero Kanban: {projectName}
                    </Dialog.Title>
                    <p className="text-xs text-indigo-100 mt-0.5">
                      Arrastra tareas entre columnas para actualizar su estado.
                    </p>
                  </div>
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
                <div className="kanban-container p-4 flex-grow overflow-auto">
                  {/* Mostrar el KanbanBoard solo cuando esté listo */}
                  {boardReady ? (
                    <KanbanBoard
                      projectId={projectId}
                      projectName={projectName}
                    />
                  ) : (
                    <div className="flex flex-col justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Preparando tablero de tareas...
                      </p>
                    </div>
                  )}
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
