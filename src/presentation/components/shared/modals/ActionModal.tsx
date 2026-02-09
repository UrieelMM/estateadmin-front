import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

type ActionModalVariant = "info" | "success" | "warning" | "danger";

interface ActionModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  variant?: ActionModalVariant;
}

const getVariantStyles = (variant: ActionModalVariant) => {
  switch (variant) {
    case "success":
      return {
        icon: CheckCircleIcon,
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-300",
        button:
          "bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600",
      };
    case "warning":
      return {
        icon: ExclamationTriangleIcon,
        iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        iconColor: "text-yellow-600 dark:text-yellow-300",
        button:
          "bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600",
      };
    case "danger":
      return {
        icon: ExclamationTriangleIcon,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-300",
        button:
          "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600",
      };
    default:
      return {
        icon: InformationCircleIcon,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-300",
        button:
          "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
      };
  }
};

const ActionModal = ({
  open,
  setOpen,
  title,
  message,
  onConfirm,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  showCancel = false,
  variant = "info",
}: ActionModalProps) => {
  const styles = getVariantStyles(variant);
  const Icon = styles.icon;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${styles.iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto ${styles.button}`}
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      setOpen(false);
                    }}
                  >
                    {confirmLabel}
                  </button>
                  {showCancel && (
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setOpen(false)}
                    >
                      {cancelLabel}
                    </button>
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

export default ActionModal;
