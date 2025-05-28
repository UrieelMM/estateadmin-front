import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { UserData } from "../../../../interfaces/UserData";
import useUserStore from "../../../../store/UserDataStore";
import { toast } from "react-hot-toast";

interface EditUserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userDetails: UserData | null;
  onSuccess?: () => void;
}

const EditUserModal = ({
  open,
  setOpen,
  userDetails,
  onSuccess,
}: EditUserModalProps) => {
  const [formData, setFormData] = useState<Partial<UserData>>({
    name: "",
    lastName: "",
    phone: "",
    email: "",
    number: "",
    taxResidence: "",
    RFC: "",
    taxtRegime: "",
    businessName: "",
    invoiceRequired: false,
    notifications: {
      email: false,
      whatsapp: false,
    },
  });

  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || "",
        lastName: userDetails.lastName || "",
        phone: String(userDetails.phone || ""),
        email: userDetails.email || "",
        number: String(userDetails.number || ""),
        taxResidence: userDetails.taxResidence || "",
        RFC: userDetails.RFC || "",
        taxtRegime: userDetails.taxtRegime || "",
        businessName: userDetails.businessName || "",
        invoiceRequired: userDetails.invoiceRequired || false,
        notifications: userDetails.notifications || {
          email: false,
          whatsapp: false,
        },
      });
    }
  }, [userDetails]);

  const updateUser = useUserStore((state) => state.updateUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar teléfono
    if (formData.phone && formData.phone.length < 10) {
      toast.error("El teléfono debe tener al menos 10 dígitos");
      return;
    }

    try {
      if (userDetails?.uid) {
        await updateUser(userDetails.uid, formData);
        toast.success("Usuario actualizado correctamente");
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error("Error al actualizar el usuario");
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "phone" || name === "number") {
      // Asegurar que phone y number siempre sean string
      setFormData((prev) => ({
        ...prev,
        [name]: String(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNotificationChange = (type: "email" | "whatsapp") => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        email: prev.notifications?.email || false,
        whatsapp: prev.notifications?.whatsapp || false,
        [type]: !prev.notifications?.[type],
      },
    }));
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-gray-800">
                    <div className="px-4 py-6 sm:px-6 dark:bg-gray-900">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                          Editar Usuario
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <form
                      onSubmit={handleSubmit}
                      className="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Nombre
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Apellido
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              id="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="number"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Número de departamento
                            </label>
                            <input
                              type="text"
                              name="number"
                              id="number"
                              value={formData.number}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <label
                              htmlFor="taxResidence"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Dirección fiscal
                            </label>
                            <input
                              type="text"
                              name="taxResidence"
                              id="taxResidence"
                              value={formData.taxResidence}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="RFC"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              RFC
                            </label>
                            <input
                              type="text"
                              name="RFC"
                              id="RFC"
                              value={formData.RFC}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="taxtRegime"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Régimen fiscal
                            </label>
                            <input
                              type="text"
                              name="taxtRegime"
                              id="taxtRegime"
                              value={formData.taxtRegime}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <label
                              htmlFor="businessName"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Razón social
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              id="businessName"
                              value={formData.businessName}
                              onChange={handleChange}
                              className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <div className="flex items-center justify-between">
                              <span className="flex flex-col">
                                <span className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                  Requiere factura
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Marque si el usuario requiere factura
                                </span>
                              </span>
                              <Switch
                                checked={formData.invoiceRequired}
                                onChange={(checked) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    invoiceRequired: checked,
                                  }))
                                }
                                className={`${
                                  formData.invoiceRequired
                                    ? "bg-indigo-600"
                                    : "bg-gray-200"
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                              >
                                <span className="sr-only">
                                  Requiere factura
                                </span>
                                <span
                                  className={`${
                                    formData.invoiceRequired
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                              </Switch>
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Notificaciones
                              </h3>
                              <div className="flex items-center justify-between">
                                <span className="flex flex-col">
                                  <span className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                    Notificaciones por correo
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Recibir notificaciones por correo
                                    electrónico
                                  </span>
                                </span>
                                <Switch
                                  checked={formData.notifications?.email}
                                  onChange={() =>
                                    handleNotificationChange("email")
                                  }
                                  className={`${
                                    formData.notifications?.email
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                                >
                                  <span className="sr-only">
                                    Notificaciones por correo
                                  </span>
                                  <span
                                    className={`${
                                      formData.notifications?.email
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                  />
                                </Switch>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex flex-col">
                                  <span className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                    Notificaciones por WhatsApp
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Recibir notificaciones por WhatsApp
                                  </span>
                                </span>
                                <Switch
                                  checked={formData.notifications?.whatsapp}
                                  onChange={() =>
                                    handleNotificationChange("whatsapp")
                                  }
                                  className={`${
                                    formData.notifications?.whatsapp
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                                >
                                  <span className="sr-only">
                                    Notificaciones por WhatsApp
                                  </span>
                                  <span
                                    className={`${
                                      formData.notifications?.whatsapp
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                  />
                                </Switch>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                          Guardar cambios
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-600"
                          onClick={() => setOpen(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditUserModal;
