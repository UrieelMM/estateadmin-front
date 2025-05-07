import React, { useEffect, useState } from "react";
import useInventoryStore from "../../../../store/inventoryStore";
import { Category } from "../../../../store/inventoryStore";
import CategoryForm from "./components/CategoryForm";
import Modal from "../../../../components/Modal";
import { Link, useLocation } from "react-router-dom";
import ModalButton from "./components/ModalButton";

const InventoryCategories: React.FC = () => {
  const {
    categories,
    loading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    stockAlerts,
  } = useInventoryStore();

  const location = useLocation();
  const lowStockItems = stockAlerts.length;

  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    console.log("Modal de añadir categoría:", isAddModalOpen);
  }, [isAddModalOpen]);

  // Filtrar categorías por término de búsqueda
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers para operaciones CRUD
  const handleAddCategory = async (data: Partial<Category>) => {
    console.log("Iniciando handleAddCategory con datos:", data);
    setSubmitLoading(true);

    try {
      console.log("Llamando a addCategory con:", data);
      const categoryId = await addCategory(data as Omit<Category, "id">);
      console.log("Resultado de addCategory:", categoryId);

      if (categoryId) {
        console.log("Categoría agregada exitosamente con ID:", categoryId);
        setIsAddModalOpen(false);
      } else {
        console.error("No se pudo crear la categoría: el ID retornado es nulo");
      }
    } catch (error) {
      console.error("Error al crear categoría:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditCategory = async (data: Partial<Category>) => {
    if (!selectedCategory) return;
    setSubmitLoading(true);
    const success = await updateCategory(selectedCategory.id, data);
    setSubmitLoading(false);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setSubmitLoading(true);
    try {
      const success = await deleteCategory(selectedCategory.id);
      if (success) {
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      }
    } catch (error) {
      // Si hay un error (por ejemplo, hay ítems asociados), mostrar mensaje
      alert((error as Error).message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Función para obtener el nombre de la categoría padre
  const getParentCategoryName = (parentId?: string) => {
    if (!parentId) return "";
    const parent = categories.find((cat) => cat.id === parentId);
    return parent ? parent.name : "";
  };

  // Función específica para abrir modal
  const openAddModal = () => {
    console.log("Intento abrir modal de categoría");
    setIsAddModalOpen(true);
    console.log("Después de setIsAddModalOpen (categoría):", true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
            Categorías de Inventario
          </h1>
          <ModalButton text="Añadir categoría" onClick={openAddModal} />
        </div>

        {/* Barra de navegación secundaria */}
        <div className="dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/inventory"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/dashboard/inventory"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              }`}
            >
              <i className="fas fa-boxes-stacked mr-2"></i>
              Inventario
            </Link>

            <Link
              to="/dashboard/inventory/categories"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/dashboard/inventory/categories"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              }`}
            >
              <i className="fas fa-tags mr-2"></i>
              Categorías
            </Link>

            <Link
              to="/dashboard/inventory/movements"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/dashboard/inventory/movements"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              }`}
            >
              <i className="fas fa-arrows-rotate mr-2"></i>
              Movimientos
            </Link>

            <Link
              to="/dashboard/inventory/alerts"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/dashboard/inventory/alerts"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              }`}
            >
              <i className="fas fa-triangle-exclamation mr-2"></i>
              Alertas
              {lowStockItems > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs font-medium rounded-full h-5 w-5 inline-flex items-center justify-center">
                  {lowStockItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative max-w-lg mb-6">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full ps-2 p-2.5"
            placeholder="Buscar categorías..."
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-white"
              onClick={() => setSearchTerm("")}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de categorías */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="spinner-border text-indigo-500" role="status">
              <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
            </div>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs uppercase dar:bg-gray-700 text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Categoría padre
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {category.name}
                    </td>
                    <td className="px-6 py-4">
                      {getParentCategoryName(category.parentId) || "-"}
                    </td>
                    <td className="px-6 py-4">{category.description || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsEditModalOpen(true);
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                          title="Editar"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash-alt mr-1"></i>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            {searchTerm ? (
              <div>
                <i className="fas fa-search text-gray-500 text-3xl mb-2"></i>
                <p className="text-gray-400">
                  No se encontraron categorías para "{searchTerm}"
                </p>
              </div>
            ) : (
              <div>
                <i className="fas fa-folder-open text-gray-500 text-3xl mb-2"></i>
                <p className="text-gray-400">No hay categorías creadas aún</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-100 bg-opacity-20 dark:bg-indigo-100 dark:bg-opacity-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-100">
                Añadir categoría
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 dark:bg-gray-800">
              <CategoryForm
                categories={categories}
                onSubmit={handleAddCategory}
                onCancel={() => setIsAddModalOpen(false)}
                loading={submitLoading}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        title="Editar categoría"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="md"
      >
        {selectedCategory && (
          <div className="p-6">
            <CategoryForm
              category={selectedCategory}
              categories={categories}
              onSubmit={handleEditCategory}
              onCancel={() => setIsEditModalOpen(false)}
              loading={submitLoading}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Confirmar eliminación"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
      >
        <div className="p-6">
          <p className="text-center text-lg text-white mb-6">
            ¿Estás seguro de que deseas eliminar la categoría{" "}
            <span className="font-bold">{selectedCategory?.name}</span>?
          </p>
          <p className="text-center text-sm text-gray-400 mb-6">
            No podrás eliminar categorías que tengan ítems asociados.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 flex items-center"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Eliminando...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt mr-2"></i>
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryCategories;
