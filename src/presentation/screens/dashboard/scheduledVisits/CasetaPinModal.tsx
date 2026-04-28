import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  KeyIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import "moment/locale/es";
import toast from "react-hot-toast";
import {
  generateSecurePin,
  useCasetaPinStore,
} from "../../../../store/useCasetaPinStore";
import { toDate } from "../../../../store/useScheduledVisitsStore";

moment.locale("es");

interface Props {
  open: boolean;
  onClose: () => void;
}

const CasetaPinModal = ({ open, onClose }: Props) => {
  const {
    status,
    lastGeneratedPin,
    loadingStatus,
    saving,
    deleting,
    fetchStatus,
    setPin,
    deletePin,
    clearLastGenerated,
  } = useCasetaPinStore();

  const [manualPin, setManualPin] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Cargar status al abrir; limpiar PIN visible al cerrar.
  useEffect(() => {
    if (open) {
      fetchStatus();
    } else {
      clearLastGenerated();
      setManualPin("");
      setConfirmingDelete(false);
    }
  }, [open, fetchStatus, clearLastGenerated]);

  const handleGenerateRandom = async () => {
    const pin = generateSecurePin();
    await setPin(pin);
  };

  const handleSaveManual = async () => {
    if (!/^\d{6}$/.test(manualPin)) {
      toast.error("El PIN debe ser de exactamente 6 dígitos");
      return;
    }
    const ok = await setPin(manualPin);
    if (ok) setManualPin("");
  };

  const handleCopy = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("PIN copiado");
    } catch (_e) {
      toast.error("No se pudo copiar");
    }
  };

  const handleDelete = async () => {
    const ok = await deletePin();
    if (ok) setConfirmingDelete(false);
  };

  const updatedAtDate = toDate(status?.updatedAt ?? null);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto">
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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-2">
                    <ShieldCheckIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                      PIN de caseta
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Define un PIN de 6 dígitos que el guardia deberá ingresar
                      al registrar entradas y salidas.
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 mb-4">
                  {loadingStatus ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cargando estado...
                    </p>
                  ) : status?.configured ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            PIN configurado
                          </p>
                          {updatedAtDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Última actualización:{" "}
                              {moment(updatedAtDate).format(
                                "D [de] MMMM YYYY, h:mm A",
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Sin PIN configurado
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cualquier persona con el QR puede registrar entradas
                          / salidas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mostrar PIN recién generado */}
                {lastGeneratedPin && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">
                      PIN generado — guárdalo ahora
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-2xl font-mono tracking-widest text-center bg-white dark:bg-gray-800 rounded-md py-2 px-3 text-gray-900 dark:text-white">
                        {lastGeneratedPin}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(lastGeneratedPin)}
                        className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        Copiar
                      </button>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      ⚠️ El backend solo almacena el hash. Si lo pierdes, deberás
                      generar uno nuevo.
                    </p>
                  </div>
                )}

                {/* Acciones — generar / definir */}
                <div className="space-y-4">
                  <div>
                    <button
                      type="button"
                      disabled={saving || deleting}
                      onClick={handleGenerateRandom}
                      className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <KeyIcon className="h-4 w-4 mr-2" />
                          {status?.configured
                            ? "Generar PIN nuevo"
                            : "Generar PIN aleatorio"}
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      Crea un PIN aleatorio de 6 dígitos.
                    </p>
                  </div>

                  <div className="relative">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                        o define uno manualmente
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={manualPin}
                      onChange={(e) =>
                        setManualPin(e.target.value.replace(/\D/g, ""))
                      }
                      className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:ring-gray-600 text-center text-lg tracking-widest"
                    />
                    <button
                      type="button"
                      disabled={
                        saving || deleting || !/^\d{6}$/.test(manualPin)
                      }
                      onClick={handleSaveManual}
                      className="inline-flex items-center justify-center rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Eliminar PIN */}
                {status?.configured && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {confirmingDelete ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
                        <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                          ¿Seguro que quieres eliminar el PIN? La caseta podrá
                          registrar entradas sin él.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(false)}
                            disabled={deleting}
                            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting ? "Eliminando..." : "Sí, eliminar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Eliminar PIN
                      </button>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CasetaPinModal;
