import React, { useEffect, useState, useRef } from "react";
import {
  InventoryItem,
  ItemType,
  ItemStatus,
  Category,
  InventoryItemFormData,
} from "../../../../../store/inventoryStore";
import { useMaintenanceAppAccess } from "../../../../../hooks/useMaintenanceAppAccess";

interface InventoryItemFormProps {
  item?: Partial<InventoryItem>;
  categories: Category[];
  onSubmit: (data: Partial<InventoryItemFormData>) => void;
  onCancel: () => void;
  loading: boolean;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  item,
  categories,
  onSubmit,
  onCancel,
  loading,
}) => {
  // Estado para el formulario multi-step
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasMaintenanceApp } = useMaintenanceAppAccess();

  // Estado para el formulario
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    description: "",
    type: ItemType.SUPPLIES,
    category: "",
    location: "",
    status: ItemStatus.ACTIVE,
    stock: 0,
    minStock: 0,
    price: undefined,
    purchaseDate: undefined,
    expirationDate: undefined,
    serialNumber: "",
    model: "",
    brand: "",
    supplier: "",
    notes: "",
    images: [],
    managedByMaintenanceApp: false,
    ...item,
  });

  // Títulos de los pasos
  const stepTitles = [
    "Información básica",
    "Detalles de stock",
    "Información adicional",
    "Imágenes y notas",
  ];

  useEffect(() => {
    if (!hasMaintenanceApp && formData.managedByMaintenanceApp) {
      setFormData((prev) => ({ ...prev, managedByMaintenanceApp: false }));
    }
  }, [formData.managedByMaintenanceApp, hasMaintenanceApp]);

  // Manejar cambio de campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : 0 });
    } else if (type === "date") {
      // Si el valor está vacío, simplemente no incluimos esta propiedad
      if (value) {
        setFormData({ ...formData, [name]: new Date(value) });
      } else {
        const newFormData = { ...formData };
        delete newFormData[name as keyof typeof newFormData];
        setFormData(newFormData);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Limpiar error al cambiar el campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validar formulario
  const validateForm = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name?.trim()) {
        newErrors.name = "El nombre es obligatorio";
      }

      if (!formData.category) {
        newErrors.category = "La categoría es obligatoria";
      }

      if (!formData.type) {
        newErrors.type = "El tipo es obligatorio";
      }
    }

    if (step === 2) {
      if (formData.stock === undefined || formData.stock < 0) {
        newErrors.stock = "El stock debe ser un número positivo";
      }

      if (formData.minStock === undefined || formData.minStock < 0) {
        newErrors.minStock = "El stock mínimo debe ser un número positivo";
      }

      if (formData.price !== undefined && formData.price < 0) {
        newErrors.price = "El precio no puede ser negativo";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Detener cualquier propagación del evento
    }

    if (validateForm(step)) {
      // Procesar fechas antes de enviar para evitar valores undefined en Firestore
      const processedData: Record<string, any> = { ...formData };

      // Convertir fechas vacías a null (Firestore acepta null pero no undefined)
      if (!processedData.purchaseDate) {
        processedData.purchaseDate = null;
      }

      if (!processedData.expirationDate) {
        processedData.expirationDate = null;
      }

      // Asegurarse que otros valores opcionales no sean undefined
      if (processedData.price === undefined) {
        processedData.price = null;
      }

      if (processedData.location === undefined) {
        processedData.location = "";
      }

      if (processedData.description === undefined) {
        processedData.description = "";
      }

      if (processedData.serialNumber === undefined) {
        processedData.serialNumber = "";
      }

      if (processedData.model === undefined) {
        processedData.model = "";
      }

      if (processedData.brand === undefined) {
        processedData.brand = "";
      }

      if (processedData.supplier === undefined) {
        processedData.supplier = "";
      }

      if (processedData.notes === undefined) {
        processedData.notes = "";
      }

      // En lugar de crear URLs locales, enviamos los archivos File directamente
      // para que sean procesados por el store
      const dataToSubmit = {
        ...processedData,
        images: uploadedImages,
      };

      onSubmit(dataToSubmit);
    }
  };

  // Manejar navegación de pasos
  const handleNextStep = () => {
    if (validateForm(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Función para formatear fecha para input
  const formatDateForInput = (date?: Date): string => {
    if (!date) return "";
    return date instanceof Date ? date.toISOString().split("T")[0] : "";
  };

  // Manejar carga de imágenes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setUploadedImages((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedImages((prev) => [...prev, ...files]);
    }
  };

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {stepTitles.map((title, index) => (
            <div
              key={index}
              className={`text-xs font-medium ${
                step > index + 1
                  ? "text-green-500"
                  : step === index + 1
                  ? "text-indigo-500"
                  : "text-gray-500"
              }`}
            >
              Paso {index + 1}: {title}
            </div>
          ))}
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${(step / stepTitles.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Paso 1: Información básica */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  placeholder="Nombre del ítem"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.type
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value={ItemType.SUPPLIES}>Insumo</option>
                  <option value={ItemType.MACHINERY}>Maquinaria</option>
                  <option value={ItemType.TOOL}>Herramienta</option>
                  <option value={ItemType.MATERIAL}>Material</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-500">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.category
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Oficina, cuarto de maquinaria, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Descripción detallada del ítem"
                ></textarea>
              </div>

              {hasMaintenanceApp && (
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="managedByMaintenanceApp"
                      id="managedByMaintenanceApp"
                      checked={formData.managedByMaintenanceApp || false}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label
                      htmlFor="managedByMaintenanceApp"
                      className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Puede ser administrado por usuarios de la app de mantenimiento
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 ml-6">
                    Si se activa, los usuarios de la aplicación de mantenimiento podrán gestionar este ítem
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 2: Detalles de stock */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock inicial <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock === 0 ? "" : formData.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.stock
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock mínimo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock === 0 ? "" : formData.minStock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.minStock
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Se generarán alertas cuando el stock sea menor o igual a este
                  valor
                </p>
                {errors.minStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.minStock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio unitario
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`bg-white dark:bg-gray-700 border ${
                    errors.price
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status || ItemStatus.ACTIVE}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value={ItemStatus.ACTIVE}>Activo</option>
                  <option value={ItemStatus.INACTIVE}>Inactivo</option>
                  <option value={ItemStatus.MAINTENANCE}>
                    En mantenimiento
                  </option>
                  <option value={ItemStatus.DISCONTINUED}>Descontinuado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de compra
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formatDateForInput(formData.purchaseDate)}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de expiración
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formatDateForInput(formData.expirationDate)}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Información adicional */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de serie
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber || ""}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Número de serie"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model || ""}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Modelo del ítem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand || ""}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Marca del ítem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier || ""}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Proveedor"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Imágenes y notas */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas adicionales
              </label>
              <textarea
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                rows={4}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Notas adicionales o especificaciones"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imágenes
              </label>
              <div
                className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <i className="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-3"></i>
                <p className="text-gray-600 dark:text-gray-400">
                  Arrastra imágenes aquí o haz clic para seleccionar archivos
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  PNG, JPG o JPEG (máx. 5MB)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleSelectFiles}
                  className="mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Seleccionar archivos
                </button>
              </div>

              {/* Mostrar imágenes cargadas */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Imagen ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}

          {step < stepTitles.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Siguiente
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Guardar
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InventoryItemForm;
