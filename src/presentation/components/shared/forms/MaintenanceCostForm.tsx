import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  MaintenanceCost,
  useMaintenanceCostStore,
  useMaintenanceAppointmentStore,
} from "../../../../store/useMaintenanceStore";
import { useTicketsStore } from "../../../screens/dashboard/maintenance/tickets/ticketsStore";
import useProviderStore from "../../../../store/providerStore";

interface MaintenanceCostFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MaintenanceCost;
}

const MaintenanceCostForm = ({
  isOpen,
  onClose,
  initialData,
}: MaintenanceCostFormProps) => {
  const { createCost, updateCost } = useMaintenanceCostStore();
  const { appointments, fetchAppointments } = useMaintenanceAppointmentStore();
  const { tickets, fetchTickets } = useTicketsStore();
  const { providers, fetchProviders } = useProviderStore();
  const [loading, setLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<MaintenanceCost>({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    category: "Materiales",
    provider: "",
    providerId: "",
    status: "pending",
    notes: "",
  });

  // Cargar datos necesarios al abrir el formulario
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        await Promise.all([
          fetchAppointments(),
          fetchTickets(),
          fetchProviders(),
        ]);
      };
      loadData();

      // Si hay datos iniciales, cargarlos en el formulario
      if (initialData) {
        setFormData({
          ...initialData,
          // Convertir amount a número si viene como string
          amount:
            typeof initialData.amount === "string"
              ? parseInt(initialData.amount)
              : initialData.amount,
        });
      } else {
        // Resetear el formulario
        setFormData({
          description: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          category: "Materiales",
          provider: "",
          providerId: "",
          status: "pending",
          notes: "",
        });
        setInvoiceFile(null);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Manejar el campo de monto especialmente
    if (name === "amount") {
      // Limpiar el valor de cualquier carácter que no sea número o punto
      const cleanValue = value.replace(/[^0-9.]/g, "");

      // Si está vacío, establecer 0
      if (cleanValue === "" || cleanValue === ".") {
        setFormData({ ...formData, [name]: 0 });
      } else {
        // Convertir a centavos (multiplicar por 100)
        const amountInCents = Math.round(parseFloat(cleanValue) * 100);
        setFormData({ ...formData, [name]: amountInCents });
      }
    } else if (name === "providerId") {
      // Cuando cambia el proveedor seleccionado
      const selectedProvider = providers.find(
        (provider) => provider.id === value
      );

      setFormData({
        ...formData,
        providerId: value,
        provider: selectedProvider ? selectedProvider.name : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.id) {
        // Actualizar costo existente
        await updateCost(initialData.id, formData, invoiceFile || undefined);
      } else {
        // Crear nuevo costo
        await createCost(formData, invoiceFile || undefined);
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar el costo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center"
                >
                  {initialData?.id
                    ? "Editar Gasto de Mantenimiento"
                    : "Registrar Gasto de Mantenimiento"}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Descripción *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="Descripción del gasto"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="w-full mt-1 p-2 h-[90px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Monto *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={
                              formData.amount === 0 ? "" : formData.amount / 100
                            }
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            className="w-full mt-1 pl-6 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Fecha *
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                          className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Categoría *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      >
                        <option value="Materiales">Materiales</option>
                        <option value="Mano de obra">Mano de obra</option>
                        <option value="Repuestos">Repuestos</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="providerId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Proveedor
                      </label>
                      <select
                        id="providerId"
                        name="providerId"
                        value={formData.providerId || ""}
                        onChange={handleChange}
                        className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      >
                        <option value="">Seleccionar proveedor</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="invoiceNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Número de Factura
                      </label>
                      <input
                        type="text"
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={formData.invoiceNumber || ""}
                        onChange={handleChange}
                        className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="invoiceFile"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Archivo de Factura
                      </label>
                      <input
                        type="file"
                        id="invoiceFile"
                        name="invoiceFile"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-400 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                      />
                      {initialData?.invoiceFile && !invoiceFile && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Ya existe un archivo. Sube uno nuevo solo si deseas
                          reemplazarlo.
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Estado *
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Relacionar con
                      </label>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="ticketId"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Ticket
                          </label>
                          <select
                            id="ticketId"
                            name="ticketId"
                            value={formData.ticketId || ""}
                            onChange={handleChange}
                            className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                          >
                            <option value="">No relacionado</option>
                            {tickets.map((ticket) => (
                              <option key={ticket.id} value={ticket.id}>
                                {ticket.folio || "Sin folio"} - {ticket.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="appointmentId"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Visita
                          </label>
                          <select
                            id="appointmentId"
                            name="appointmentId"
                            value={formData.appointmentId || ""}
                            onChange={handleChange}
                            className="w-full mt-1 pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                          >
                            <option value="">No relacionada</option>
                            {appointments.map((appointment) => (
                              <option
                                key={appointment.id}
                                value={appointment.id}
                              >
                                {appointment.date} - {appointment.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Notas adicionales
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes || ""}
                        onChange={handleChange}
                        className="w-full mt-1 pl-2 h-[64px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-400 bg-yellow-50  mt-2 dark:bg-yellow-900/10 dark:border-yellow-500 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
                    <span className="text-xs text-gray-700 font-medium dark:text-white">
                      Este gasto también será registrado en los egresos con el
                      fin de mantener consistencia de gastos
                    </span>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                    >
                      {loading ? (
                        <span className="flex items-center">
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
                        </span>
                      ) : initialData?.id ? (
                        "Actualizar Gasto"
                      ) : (
                        "Registrar Gasto"
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MaintenanceCostForm;
