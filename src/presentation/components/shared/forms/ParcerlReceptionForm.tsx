import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { InboxIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { useParcelReceptionStore } from "../../../../store/useParcelStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface FormParcelReceptionProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ParcelReceptionForm = ({ open, setOpen }: FormParcelReceptionProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [receptor, setReceptor] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [dateReception, setDateReception] = useState<string>("");
  const [hourReception, setHourReception] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const addParcelReception = useParcelReceptionStore(
    (state) => state.addParcelReception
  );
  const isLoading = useParcelReceptionStore((state) => state.isLoading);

  useEffect(() => {
    if (open) {
      fetchCondominiumsUsers();
    }
  }, [fetchCondominiumsUsers, open]);

  useEffect(() => {
    if (condominiumsUsers) {
      setUsers(
        condominiumsUsers.filter(
          (user) =>
            user.role !== "admin" &&
            user.role !== "super-admin" &&
            user.role !== "security"
        )
      );
    }
  }, [condominiumsUsers]);

  // Establece la fecha y hora actuales al abrir el formulario
  useEffect(() => {
    if (open) {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

      setDateReception(dateStr);
      setHourReception(timeStr);
    }
  }, [open]);

  const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    const user = users.find((user) => user.uid === uid);

    if (user) {
      setRecipientName(user.name);
      setEmail(user.email);
      setFormErrors({ ...formErrors, recipientName: "" });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!receptor.trim()) {
        errors.receptor = "El nombre del receptor es obligatorio";
      }

      if (!recipientName) {
        errors.recipientName = "Debes seleccionar un destinatario";
      }
    }

    if (step === 2) {
      if (!dateReception) {
        errors.dateReception = "La fecha de recepción es obligatoria";
      }

      if (!hourReception) {
        errors.hourReception = "La hora de recepción es obligatoria";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const resetForm = () => {
    setReceptor("");
    setEmail("");
    setRecipientName("");
    const today = new Date();
    setDateReception(today.toISOString().split("T")[0]);
    setHourReception(today.toTimeString().split(" ")[0].substring(0, 5));
    setComments("");
    setFile(null);
    setFileName("");
    setFormErrors({});
    setCurrentStep(1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!validateStep(currentStep)) {
      setLoading(false);
      return;
    }

    try {
      await addParcelReception({
        receptor,
        email,
        recipientName,
        dateReception,
        hourReception,
        comments,
        file,
      });

      resetForm();
      setOpen(false);
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
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                      {currentStep === 1 && (
                        <InboxIcon
                          className="h-6 w-6 text-indigo-600 dark:text-indigo-300"
                          aria-hidden="true"
                        />
                      )}
                      {currentStep === 2 && (
                        <PhotoIcon
                          className="h-6 w-6 text-indigo-600 dark:text-indigo-300"
                          aria-hidden="true"
                        />
                      )}
                      {currentStep === 3 && (
                        <CheckCircleIcon
                          className="h-6 w-6 text-indigo-600 dark:text-indigo-300"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                      >
                        {currentStep === 1 && "Información del Paquete"}
                        {currentStep === 2 && "Detalles y Foto"}
                        {currentStep === 3 && "Confirmar Información"}
                      </Dialog.Title>

                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {currentStep === 1 &&
                            "Ingresa la información básica del paquete y su destinatario."}
                          {currentStep === 2 &&
                            "Añade información adicional y una foto si es necesario."}
                          {currentStep === 3 &&
                            "Verifica toda la información antes de registrar el paquete."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-6">
                    {/* Indicador de progreso */}
                    <div className="w-full mb-12">
                      <div className="pt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">
                          Paso {currentStep} de 3
                        </p>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-100 dark:bg-gray-700">
                          <motion.div
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                            initial={{ width: `${(currentStep - 1) * 33.3}%` }}
                            animate={{ width: `${currentStep * 33.3}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Paso 1: Información básica */}
                      {currentStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div>
                            <label
                              htmlFor="receptor"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                              Nombre de quien recibió el paquete
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="receptor"
                                id="receptor"
                                value={receptor}
                                onChange={(e) => {
                                  setReceptor(e.target.value);
                                  if (e.target.value.trim()) {
                                    setFormErrors({
                                      ...formErrors,
                                      receptor: "",
                                    });
                                  }
                                }}
                                className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                                  formErrors.receptor
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                                } dark:bg-gray-700 dark:text-white`}
                              />
                              {formErrors.receptor && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  {formErrors.receptor}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="recipient"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                              Destinatario
                            </label>
                            <div className="mt-1">
                              <select
                                id="recipient"
                                name="recipient"
                                onChange={handleRecipientChange}
                                className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                                  formErrors.recipientName
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                                } dark:bg-gray-700 dark:text-white`}
                              >
                                <option value="">
                                  Selecciona un destinatario
                                </option>
                                {users.map((user) => (
                                  <option key={user.uid} value={user.uid}>
                                    {user.number ? `#${user.number} - ` : ""}
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                              {formErrors.recipientName && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  {formErrors.recipientName}
                                </p>
                              )}
                            </div>
                          </div>

                          {recipientName && (
                            <div className="rounded-md bg-indigo-50 p-4 dark:bg-indigo-900">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <CheckCircleIcon
                                    className="h-5 w-5 text-indigo-400"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                    Destinatario seleccionado
                                  </h3>
                                  <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                                    <p>Nombre: {recipientName}</p>
                                    <p>Email: {email}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Paso 2: Detalles y foto */}
                      {currentStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="dateReception"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Fecha de recepción
                              </label>
                              <div className="mt-1">
                                <input
                                  type="date"
                                  name="dateReception"
                                  id="dateReception"
                                  value={dateReception}
                                  onChange={(e) => {
                                    setDateReception(e.target.value);
                                    setFormErrors({
                                      ...formErrors,
                                      dateReception: "",
                                    });
                                  }}
                                  className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                                    formErrors.dateReception
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-300 dark:border-gray-600"
                                  } dark:bg-gray-700 dark:text-white`}
                                />
                                {formErrors.dateReception && (
                                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {formErrors.dateReception}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="hourReception"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Hora de recepción
                              </label>
                              <div className="mt-1">
                                <input
                                  type="time"
                                  name="hourReception"
                                  id="hourReception"
                                  value={hourReception}
                                  onChange={(e) => {
                                    setHourReception(e.target.value);
                                    setFormErrors({
                                      ...formErrors,
                                      hourReception: "",
                                    });
                                  }}
                                  className={`block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border ${
                                    formErrors.hourReception
                                      ? "border-red-500 dark:border-red-500"
                                      : "border-gray-300 dark:border-gray-600"
                                  } dark:bg-gray-700 dark:text-white`}
                                />
                                {formErrors.hourReception && (
                                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {formErrors.hourReception}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="comments"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                              Comentarios
                            </label>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Estos comentarios serán enviados al destinatario a
                              través de una notificación
                            </span>
                            <div className="mt-1">
                              <textarea
                                id="comments"
                                name="comments"
                                rows={3}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="block w-full rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="Detalles adicionales del paquete..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                              Foto del paquete (opcional)
                            </label>
                            <div
                              {...getRootProps()}
                              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                                isDragActive
                                  ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30"
                                  : "border-gray-300 dark:border-gray-600"
                              } dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                            >
                              <div className="space-y-1 text-center">
                                <input {...getInputProps()} />
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
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
                        </motion.div>
                      )}

                      {/* Paso 3: Confirmación */}
                      {currentStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg dark:bg-gray-700">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Resumen del Paquete
                              </h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
                                Verifica la información antes de guardar.
                              </p>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-5 sm:p-0">
                              <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-600">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Receptor
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {receptor}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Destinatario
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {recipientName}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Email
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {email}
                                  </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                    Fecha y hora
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                    {dateReception} a las {hourReception}
                                  </dd>
                                </div>
                                {comments && (
                                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                      Comentarios
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                      {comments}
                                    </dd>
                                  </div>
                                )}
                                {file && (
                                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                      Foto
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 dark:text-white">
                                      {fileName} (adjunto)
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                        onClick={prevStep}
                      >
                        Atrás
                      </button>
                    )}

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        onClick={nextStep}
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
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
                          "Confirmar registro"
                        )}
                      </button>
                    )}
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

export default ParcelReceptionForm;
