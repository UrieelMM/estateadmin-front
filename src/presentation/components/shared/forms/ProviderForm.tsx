import { Transition, Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import useProviderStore from "../../../../store/providerStore";
import { toast } from "react-hot-toast";

interface FormProviderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  providerToEdit?: any;
}

const services = [
  { value: "1", label: "Telefonía e Internet" },
  { value: "2", label: "Limpieza" },
  { value: "3", label: "Mantenimiento" },
  { value: "4", label: "Seguridad" },
  { value: "5", label: "Papelería" },
  { value: "6", label: "Jardinería" },
  { value: "7", label: "Pintura" },
  { value: "8", label: "Electricidad" },
  { value: "9", label: "Plomería" },
  { value: "10", label: "Carpintería" },
  { value: "11", label: "Herrería" },
  { value: "12", label: "Vidriería" },
  { value: "13", label: "Aire Acondicionado" },
  { value: "14", label: "Calefacción" },
  { value: "15", label: "Gas" },
  { value: "16", label: "Limpieza de Cisternas" },
  { value: "17", label: "Fumigación" },
  { value: "18", label: "Control de Plagas" },
  { value: "19", label: "Limpieza de Alfombras" },
  { value: "20", label: "Limpieza de Ventanas" },
  { value: "21", label: "Limpieza de Fachadas" },
  { value: "22", label: "Limpieza de Pisos" },
  { value: "23", label: "Limpieza de Muebles" },
  { value: "24", label: "Limpieza de Cortinas" },
  { value: "25", label: "Limpieza de Persianas" },
  { value: "26", label: "Limpieza de Tapicería" },
  { value: "27", label: "Limpieza de Colchones" },
  { value: "28", label: "Limpieza de Azulejos" },
  { value: "29", label: "Limpieza de Grifería" },
  { value: "30", label: "Limpieza de Sanitarios" },
];

const FormProvider = ({ open, setOpen, providerToEdit }: FormProviderProps) => {
  const [formData, setFormData] = useState({
    name: providerToEdit?.name || "",
    service: providerToEdit?.service || "",
    serviceLabel: providerToEdit?.serviceLabel || "",
    phone: providerToEdit?.phone || "",
    email: providerToEdit?.email || "",
    comments: providerToEdit?.comments || "",
  });

  const { addProvider, updateProvider, loading } = useProviderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!formData.service) {
      toast.error("El servicio es obligatorio");
      return;
    }

    if (formData.phone && formData.phone.length < 10) {
      toast.error("El teléfono debe tener al menos 10 dígitos");
      return;
    }

    try {
      if (providerToEdit) {
        const success = await updateProvider(providerToEdit.id, formData);
        if (success) {
          toast.success("Proveedor actualizado correctamente");
          setOpen(false);
        } else {
          toast.error("Error al actualizar el proveedor");
        }
      } else {
        const success = await addProvider(formData);
        if (success) {
          toast.success("Proveedor agregado correctamente");
          setOpen(false);
        } else {
          toast.error("Error al agregar el proveedor");
        }
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "service") {
      const selectedService = services.find((s) => s.value === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        serviceLabel: selectedService?.label || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  >
                    <div className="h-0 flex-1 overflow-y-auto dark:bg-gray-900">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white dark:text-gray-100">
                            {providerToEdit
                              ? "Editar proveedor"
                              : "Registrar proveedor"}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            {providerToEdit
                              ? "Edita la información del proveedor"
                              : "Llena el formulario para registrar un nuevo proveedor"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            <div>
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Nombre del proveedor *
                              </label>
                              <div className="mt-2">
                                <input
                                  type="text"
                                  name="name"
                                  id="name"
                                  required
                                  value={formData.name}
                                  onChange={handleChange}
                                  className="block px-2 w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="service"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Servicio *
                              </label>
                              <div className="mt-2">
                                <select
                                  name="service"
                                  id="service"
                                  required
                                  value={formData.service}
                                  onChange={handleChange}
                                  className="block w-full px-2 rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                >
                                  <option value="">
                                    Selecciona un servicio
                                  </option>
                                  {services.map((service) => (
                                    <option
                                      key={service.value}
                                      value={service.value}
                                    >
                                      {service.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="phone"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Teléfono
                              </label>
                              <div className="mt-2">
                                <input
                                  type="tel"
                                  name="phone"
                                  id="phone"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  pattern="[0-9]{10,}"
                                  className="block w-full px-2 rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="email"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Email
                              </label>
                              <div className="mt-2">
                                <input
                                  type="email"
                                  name="email"
                                  id="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  className="block w-full px-2 rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="comments"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  id="comments"
                                  name="comments"
                                  rows={4}
                                  value={formData.comments}
                                  onChange={handleChange}
                                  className="block w-full px-2 rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 justify-end px-4 py-4 dark:bg-gray-900 bg:shadow-xl">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={() => setOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? "Guardando..."
                          : providerToEdit
                          ? "Actualizar"
                          : "Guardar"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default FormProvider;
