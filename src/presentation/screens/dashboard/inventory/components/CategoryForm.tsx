import React, { useState } from "react";
import { Category } from "../../../../../store/inventoryStore";

interface CategoryFormProps {
  category?: Partial<Category>;
  categories: Category[];
  onSubmit: (data: Partial<Category>) => void;
  onCancel: () => void;
  loading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  categories,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    description: "",
    parentId: "",
    ...category,
  });

  // Manejar cambio de campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Limpiar error al cambiar el campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Formulario enviado", formData);

    if (validateForm()) {
      console.log("Formulario válido, llamando a onSubmit");
      try {
        onSubmit(formData);
      } catch (error) {
        console.error("Error al enviar formulario:", error);
      }
    } else {
      console.log("Formulario inválido", errors);
    }
  };

  // Manejar clic en botón guardar directamente
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Botón guardar clickeado directamente");

    if (validateForm()) {
      console.log("Formulario válido (clic directo), llamando a onSubmit");
      try {
        onSubmit(formData);
      } catch (error) {
        console.error("Error al enviar formulario (clic directo):", error);
      }
    } else {
      console.log("Formulario inválido (clic directo)", errors);
    }
  };

  console.log("Renderizando CategoryForm", { formData, loading });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Nombre de la categoría"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Categoría padre
        </label>
        <select
          name="parentId"
          value={formData.parentId || ""}
          onChange={handleChange}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        >
          <option value="">Ninguna (categoría principal)</option>
          {categories
            .filter((cat) => cat.id !== category?.id) // Evitar que una categoría sea su propio padre
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Opcional: seleccione una categoría padre para crear una subcategoría
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={3}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="Descripción de la categoría"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-wait"
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
      </div>
    </form>
  );
};

export default CategoryForm;
