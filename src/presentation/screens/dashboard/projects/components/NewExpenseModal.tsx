import React, { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  ProjectExpenseCreateInput,
  PROJECT_EXPENSE_TAGS,
  useProjectStore,
} from "../../../../../store/projectStore";
import { toast } from "react-hot-toast";
import { usePaymentStore } from "../../../../../store/usePaymentStore";

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string; // Añadimos el nombre del proyecto
}

// Financial account interface is already defined in the payment store

const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { addProjectExpense, loading } = useProjectStore();
  const { financialAccounts, fetchFinancialAccounts } = usePaymentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<
    Omit<ProjectExpenseCreateInput, "projectId">
  >({
    amount: 0,
    concept: "",
    tags: [],
    paymentType: "transfer",
    expenseDate: new Date().toISOString().split("T")[0] + "T00:00",
    description: "",
    financialAccountId: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cargar cuentas financieras al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchFinancialAccounts();
      // Establecer el concepto predeterminado con el nombre del proyecto
      setFormData((prev) => ({
        ...prev,
        concept: `Proyecto - ${projectName}`,
      }));
    }
  }, [isOpen, fetchFinancialAccounts, projectName]);

  // Manejar cambios en los campos del formulario
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Manejar cambios en las etiquetas (checkbox)
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData({
        ...formData,
        tags: [...formData.tags, value],
      });
    } else {
      setFormData({
        ...formData,
        tags: formData.tags.filter((tag) => tag !== value),
      });
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Formatear fecha para solo guardar día, mes y año con hora 00:00
  const formatExpenseDate = (date: string): string => {
    // Tomar solo la fecha y agregar T00:00 para la hora
    return date.split("T")[0] + "T00:00";
  };

  // Procesar el formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validaciones básicas
    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!formData.concept.trim()) {
      toast.error("El concepto es obligatorio");
      return;
    }

    if (formData.tags.length === 0) {
      toast.error("Debe seleccionar al menos una etiqueta");
      return;
    }

    if (!formData.expenseDate) {
      toast.error("La fecha del gasto es obligatoria");
      return;
    }

    if (!formData.financialAccountId) {
      toast.error("Seleccione una cuenta financiera");
      return;
    }

    // Preparar datos para enviar
    const expenseData: ProjectExpenseCreateInput = {
      ...formData,
      projectId,
      file: selectedFile || undefined,
      // Formatear la fecha para que tenga la hora establecida a 00:00
      expenseDate: formatExpenseDate(formData.expenseDate),
    };

    try {
      await addProjectExpense(expenseData);
      toast.success("Gasto registrado exitosamente");
      onClose();

      // Resetear formulario
      setFormData({
        amount: 0,
        concept: "",
        tags: [],
        paymentType: "transfer",
        expenseDate: new Date().toISOString().split("T")[0] + "T00:00",
        description: "",
        financialAccountId: "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Error al registrar el gasto");
    }
  };

  // Obtener etiqueta para el tag
  const getTagLabel = (tag: string): string => {
    const tagLabels: Record<string, string> = {
      labor: "Mano de obra",
      materials: "Materiales",
      equipment: "Equipamiento",
      tools: "Herramientas",
      transportation: "Transporte",
      permits: "Permisos y licencias",
      consulting: "Consultoría",
      design: "Diseño",
      maintenance: "Mantenimiento",
      other: "Otros",
    };

    return tagLabels[tag] || tag;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !loading && onClose()}
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="pointer-events-none flex items-center justify-center w-full min-h-full">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="pointer-events-auto transform overflow-hidden rounded-lg mx-auto w-full max-w-2xl">
                  <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 bg-indigo-700 dark:bg-gray-800">
                      <Dialog.Title className="text-lg font-medium text-white">
                        Registrar Nuevo Gasto
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-indigo-200 hover:text-white"
                        onClick={onClose}
                        disabled={loading}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="p-4 space-y-4 dark:bg-gray-900"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="amount"
                            className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                          >
                            Monto (MXN) *
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                $
                              </span>
                            </div>
                            <input
                              type="number"
                              name="amount"
                              id="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              className="px-6 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                              min="1"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="expenseDate"
                            className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                          >
                            Fecha del Gasto *
                          </label>
                          <input
                            type="datetime-local"
                            name="expenseDate"
                            id="expenseDate"
                            value={formData.expenseDate}
                            onChange={handleChange}
                            className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="concept"
                          className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                        >
                          Concepto *
                        </label>
                        <input
                          type="text"
                          name="concept"
                          id="concept"
                          value={formData.concept}
                          className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500 cursot-not-allowed"
                          disabled
                          readOnly
                        />
                      </div>

                      <div className="mb-2">
                        <label className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300 mb-2">
                          Etiquetas *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {PROJECT_EXPENSE_TAGS.map((tag) => (
                            <div key={tag} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`tag-${tag}`}
                                name="tags"
                                value={tag}
                                checked={formData.tags.includes(tag)}
                                onChange={handleTagChange}
                                className="min-h-4 min-w-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                              />
                              <label
                                htmlFor={`tag-${tag}`}
                                className="ml-2 block text-sm text-left text-gray-700 dark:text-gray-300"
                              >
                                {getTagLabel(tag)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="paymentType"
                          className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                        >
                          Tipo de Pago *
                        </label>
                        <select
                          name="paymentType"
                          id="paymentType"
                          value={formData.paymentType}
                          onChange={handleChange}
                          className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                        >
                          <option value="cash">Efectivo</option>
                          <option value="transfer">Transferencia</option>
                          <option value="check">Cheque</option>
                          <option value="credit_card">
                            Tarjeta de Crédito
                          </option>
                          <option value="debit_card">Tarjeta de Débito</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                        >
                          Descripción
                        </label>
                        <textarea
                          name="description"
                          id="description"
                          rows={2}
                          value={formData.description}
                          onChange={handleChange}
                          className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="file"
                          className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                        >
                          Factura / Recibo
                        </label>
                        <input
                          type="file"
                          name="file"
                          id="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer
                "
                        />
                        {selectedFile && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Archivo seleccionado: {selectedFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="financialAccountId"
                          className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300"
                        >
                          Cuenta Financiera *
                        </label>
                        <select
                          name="financialAccountId"
                          id="financialAccountId"
                          value={formData.financialAccountId}
                          onChange={handleChange}
                          className="px-2 mt-1 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                          required
                        >
                          <option value="">Seleccionar cuenta</option>
                          {financialAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          disabled={loading}
                        >
                          {loading ? "Registrando..." : "Registrar Gasto"}
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

export default NewExpenseModal;
