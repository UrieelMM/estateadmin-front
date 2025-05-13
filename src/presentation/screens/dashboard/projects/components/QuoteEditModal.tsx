import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import moment from "moment";
import {
  ProjectQuote,
  ProjectQuoteCreateInput,
  useProjectStore,
  QUOTE_CATEGORIES,
} from "../../../../../store/projectStore";
import { toast } from "react-hot-toast";
import { XMarkIcon, DocumentArrowUpIcon } from "@heroicons/react/24/solid";
import { Dialog } from "@headlessui/react";

interface QuoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: ProjectQuote;
}

interface FormValues {
  providerName: string;
  concept: string;
  category: string;
  amount: string;
  description: string;
  validUntil: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  deliveryDate: string;
  startDate: string;
  warranty: string;
  termsAndConditions: string;
}

interface FormErrors {
  providerName?: string;
  concept?: string;
  category?: string;
  amount?: string;
  description?: string;
  validUntil?: string;
  deliveryDate?: string;
}

// Traducción de categorías para la interfaz
const CATEGORY_LABELS: Record<string, string> = {
  tecnico: "Técnico / Mano de obra",
  materiales: "Materiales",
  herramientas: "Herramientas y Equipamiento",
  transporte: "Transporte",
  consultoria: "Consultoría / Diseño",
  instalacion: "Instalación",
  otro: "Otro",
};

const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
  isOpen,
  onClose,
  quote,
}) => {
  const { updateProjectQuote, loading } = useProjectStore();
  const [initialValues, setInitialValues] = useState<FormValues>({
    providerName: "",
    concept: "",
    category: "",
    amount: "",
    description: "",
    validUntil: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    deliveryDate: "",
    startDate: "",
    warranty: "",
    termsAndConditions: "",
  });
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Llenar el formulario con los datos de la cotización existente cuando se abre el modal
  useEffect(() => {
    if (quote) {
      const quoteValues: FormValues = {
        providerName: quote.providerName || "",
        concept: quote.concept || "",
        category: quote.category || "",
        amount: quote.amount.toString() || "",
        description: quote.description || "",
        validUntil:
          quote.validUntil || moment().add(30, "days").format("YYYY-MM-DD"),
        contactName: quote.contactName || "",
        contactEmail: quote.contactEmail || "",
        contactPhone: quote.contactPhone || "",
        notes: quote.notes || "",
        deliveryDate: quote.deliveryDate || "",
        startDate: quote.startDate || "",
        warranty: quote.warranty || "",
        termsAndConditions: quote.termsAndConditions || "",
      };
      setInitialValues(quoteValues);
      setValues(quoteValues);
    }
  }, [quote]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, values[name as keyof FormValues]);
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case "providerName":
        if (!value.trim()) {
          newErrors.providerName = "El nombre del proveedor es obligatorio";
        } else {
          delete newErrors.providerName;
        }
        break;
      case "concept":
        if (!value.trim()) {
          newErrors.concept = "El concepto de la cotización es obligatorio";
        } else {
          delete newErrors.concept;
        }
        break;
      case "category":
        if (!value.trim()) {
          newErrors.category = "La categoría es obligatoria";
        } else {
          delete newErrors.category;
        }
        break;
      case "amount":
        if (!value) {
          newErrors.amount = "El monto es obligatorio";
        } else if (parseFloat(value) <= 0) {
          newErrors.amount = "El monto debe ser positivo";
        } else {
          delete newErrors.amount;
        }
        break;
      case "description":
        if (!value.trim()) {
          newErrors.description = "La descripción es obligatoria";
        } else {
          delete newErrors.description;
        }
        break;
      case "validUntil":
        if (!value) {
          newErrors.validUntil = "La fecha de validez es obligatoria";
        } else {
          delete newErrors.validUntil;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {
      providerName: true,
      concept: true,
      category: true,
      amount: true,
      description: true,
      validUntil: true,
    };
    setTouched(allTouched);

    // Validar todos los campos requeridos
    let formIsValid = true;
    const newErrors: FormErrors = {};

    if (!values.providerName.trim()) {
      newErrors.providerName = "El nombre del proveedor es obligatorio";
      formIsValid = false;
    }

    if (!values.concept.trim()) {
      newErrors.concept = "El concepto de la cotización es obligatorio";
      formIsValid = false;
    }

    if (!values.category.trim()) {
      newErrors.category = "La categoría es obligatoria";
      formIsValid = false;
    }

    if (!values.amount) {
      newErrors.amount = "El monto es obligatorio";
      formIsValid = false;
    } else if (parseFloat(values.amount) <= 0) {
      newErrors.amount = "El monto debe ser positivo";
      formIsValid = false;
    }

    if (!values.description.trim()) {
      newErrors.description = "La descripción es obligatoria";
      formIsValid = false;
    }

    if (!values.validUntil) {
      newErrors.validUntil = "La fecha de validez es obligatoria";
      formIsValid = false;
    }

    setErrors(newErrors);
    return formIsValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data: Partial<ProjectQuoteCreateInput> = {
        providerName: values.providerName,
        concept: values.concept,
        category: values.category,
        amount: parseFloat(values.amount),
        description: values.description,
        validUntil: values.validUntil,
        contactName: values.contactName || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        notes: values.notes || undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
        deliveryDate: values.deliveryDate || undefined,
        startDate: values.startDate || undefined,
        warranty: values.warranty || undefined,
        termsAndConditions: values.termsAndConditions || undefined,
      };

      await updateProjectQuote(quote.id, data);
      toast.success("Cotización actualizada correctamente");

      // Limpiar el formulario y cerrar el modal
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la cotización");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSelectedFiles([]);
    onClose();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir que el evento burbujee y active el submit
    if (!loading) {
      resetForm();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!loading) resetForm();
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-lg bg-white p-6 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
            <Dialog.Title className="text-lg font-medium border-b pb-2 mb-4 dark:border-gray-700">
              Editar Cotización: {quote.concept}
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label
                    htmlFor="concept"
                    className="block text-sm font-medium mb-1"
                  >
                    Concepto *
                  </label>
                  <input
                    id="concept"
                    name="concept"
                    type="text"
                    value={values.concept}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Concepto de la cotización"
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.concept && errors.concept
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  />
                  {touched.concept && errors.concept && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.concept}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium mb-1"
                  >
                    Categoría *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.category && errors.category
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  >
                    <option value="">Seleccione una categoría</option>
                    {QUOTE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                  {touched.category && errors.category && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="providerName"
                    className="block text-sm font-medium mb-1"
                  >
                    Nombre del Proveedor *
                  </label>
                  <input
                    id="providerName"
                    name="providerName"
                    type="text"
                    value={values.providerName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nombre del proveedor"
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.providerName && errors.providerName
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  />
                  {touched.providerName && errors.providerName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.providerName}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium mb-1"
                  >
                    Monto (MXN) *
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={values.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Monto de la cotización"
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.amount && errors.amount
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  />
                  {touched.amount && errors.amount && (
                    <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="validUntil"
                    className="block text-sm font-medium mb-1"
                  >
                    Válido Hasta *
                  </label>
                  <input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                    value={values.validUntil}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.validUntil && errors.validUntil
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  />
                  {touched.validUntil && errors.validUntil && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.validUntil}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="deliveryDate"
                    className="block text-sm font-medium mb-1"
                  >
                    Fecha de Entrega
                  </label>
                  <input
                    id="deliveryDate"
                    name="deliveryDate"
                    type="date"
                    value={values.deliveryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium mb-1"
                  >
                    Fecha de Inicio
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={values.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium mb-1"
                  >
                    Descripción *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Descripción detallada de la cotización"
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      touched.description && errors.description
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  />
                  {touched.description && errors.description && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="warranty"
                    className="block text-sm font-medium mb-1"
                  >
                    Garantías Ofrecidas
                  </label>
                  <textarea
                    id="warranty"
                    name="warranty"
                    rows={2}
                    value={values.warranty}
                    onChange={handleChange}
                    placeholder="Detalle de las garantías que ofrece el proveedor"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="termsAndConditions"
                    className="block text-sm font-medium mb-1"
                  >
                    Términos y Condiciones
                  </label>
                  <textarea
                    id="termsAndConditions"
                    name="termsAndConditions"
                    rows={2}
                    value={values.termsAndConditions}
                    onChange={handleChange}
                    placeholder="Términos y condiciones especiales de la cotización"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium mb-1"
                  >
                    Nombre de Contacto
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    value={values.contactName}
                    onChange={handleChange}
                    placeholder="Nombre de la persona de contacto"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium mb-1"
                  >
                    Teléfono de Contacto
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="text"
                    value={values.contactPhone}
                    onChange={handleChange}
                    placeholder="Teléfono de contacto"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium mb-1"
                  >
                    Email de Contacto
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={values.contactEmail}
                    onChange={handleChange}
                    placeholder="Email de contacto"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-1">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium mb-1"
                  >
                    Notas Adicionales
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={values.notes}
                    onChange={handleChange}
                    placeholder="Notas adicionales sobre la cotización"
                    className="w-full px-3 py-2 border rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Archivos adjuntos
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="files"
                      className="flex-shrink-0 cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                      <DocumentArrowUpIcon className="h-5 w-5 inline mr-1" />
                      Seleccionar más archivos
                    </label>
                    <input
                      id="files"
                      name="files"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} archivo(s) nuevo(s) seleccionado(s)`
                        : "No hay archivos nuevos seleccionados"}
                    </span>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">
                        Archivos nuevos seleccionados:
                      </p>
                      <ul className="text-sm space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded dark:bg-gray-700"
                          >
                            <span className="truncate max-w-xs">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {quote.fileUrls && quote.fileUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">
                        Archivos existentes:
                      </p>
                      <ul className="text-sm space-y-1">
                        {quote.fileUrls.map((url, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded dark:bg-gray-700"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 truncate max-w-xs"
                            >
                              Archivo {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Actualizar Cotización"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default QuoteEditModal;
