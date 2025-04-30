import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  CheckCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  useParcelReceptionStore,
  Parcel,
} from "../../../../store/useParcelStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface ParcelDeliveryFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  parcelId: string;
  onSuccess?: () => void;
}

const ParcelDeliveryForm = ({
  open,
  setOpen,
  parcelId,
  onSuccess,
}: ParcelDeliveryFormProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [deliveryPerson, setDeliveryPerson] = useState<string>("");
  const [deliveredTo, setDeliveredTo] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { isLoading, getParcelById, updateDeliveryDetails } =
    useParcelReceptionStore();

  // Cargar información del paquete
  useEffect(() => {
    if (open && parcelId) {
      const fetchParcel = async () => {
        const result = await getParcelById(parcelId);
        if (result) {
          setParcel(result);
        }
      };

      fetchParcel();
    }
  }, [open, parcelId, getParcelById]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!deliveryPerson.trim()) {
      errors.deliveryPerson =
        "El nombre de la persona que entrega es obligatorio";
    }

    if (!deliveredTo.trim()) {
      errors.deliveredTo = "El nombre de la persona que recibe es obligatorio";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setDeliveryPerson("");
    setDeliveredTo("");
    setDeliveryNotes("");
    setFile(null);
    setFileName("");
    setFormErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await updateDeliveryDetails(parcelId, {
        deliveryPerson,
        deliveredTo,
        deliveryNotes,
        deliveryFile: file,
      });

      resetForm();
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dropzoneOptions = {
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setFileName(acceptedFiles[0].name);
        setFormErrors({ ...formErrors, file: "" });
      }
    },
    onDropRejected: () => {
      toast.error("Por favor sube una imagen de menos de 10MB");
    },
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
      >
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircleIcon
                        className="h-6 w-6 text-green-600 dark:text-green-300"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                      >
                        Registrar entrega de paquete
                      </Dialog.Title>

                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Ingresa los detalles de la entrega del paquete a su
                          destinatario.
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {parcel && (
                        <div className="bg-gray-50 px-4 py-3 rounded-md dark:bg-gray-700">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                                <svg
                                  className="h-6 w-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                Paquete para: {parcel.recipientName}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Recibido el: {parcel.dateReception} a las{" "}
                                {parcel.hourReception}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="deliveryPerson"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                          Nombre de quien entrega el paquete
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="deliveryPerson"
                            id="deliveryPerson"
                            value={deliveryPerson}
                            onChange={(e) => {
                              setDeliveryPerson(e.target.value);
                              if (e.target.value.trim()) {
                                setFormErrors({
                                  ...formErrors,
                                  deliveryPerson: "",
                                });
                              }
                            }}
                            className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                              formErrors.deliveryPerson
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } dark:bg-gray-700 dark:text-white`}
                          />
                          {formErrors.deliveryPerson && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {formErrors.deliveryPerson}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="deliveredTo"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                          Nombre de quien recibe el paquete
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="deliveredTo"
                            id="deliveredTo"
                            value={deliveredTo}
                            onChange={(e) => {
                              setDeliveredTo(e.target.value);
                              if (e.target.value.trim()) {
                                setFormErrors({
                                  ...formErrors,
                                  deliveredTo: "",
                                });
                              }
                            }}
                            className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                              formErrors.deliveredTo
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } dark:bg-gray-700 dark:text-white`}
                          />
                          {formErrors.deliveredTo && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {formErrors.deliveredTo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="deliveryNotes"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                          Notas adicionales (opcional)
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="deliveryNotes"
                            name="deliveryNotes"
                            rows={3}
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Información adicional sobre la entrega..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Foto de evidencia de entrega (opcional)
                        </label>
                        <div
                          {...getRootProps()}
                          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                            isDragActive
                              ? "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/30"
                              : "border-gray-300 dark:border-gray-600"
                          } dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                        >
                          <div className="space-y-1 text-center">
                            <input {...getInputProps()} />
                            <PhotoIcon
                              className="mx-auto h-12 w-12 text-gray-400"
                              aria-hidden="true"
                            />
                            <div className="flex text-sm text-gray-600 dark:text-gray-300">
                              {fileName ? (
                                <p className="pl-1">{fileName}</p>
                              ) : (
                                <p className="pl-1">
                                  {isDragActive
                                    ? "Suelta la imagen aquí..."
                                    : "Arrastra y suelta una imagen o haz clic para seleccionar"}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG, JPEG hasta 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                      onClick={() => {
                        setOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                      disabled={isLoading || loading}
                    >
                      {isLoading || loading ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Guardando...
                        </div>
                      ) : (
                        "Confirmar entrega"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ParcelDeliveryForm;
