import React, { useEffect, useState } from "react";
import useInventoryStore from "../../../../store/inventoryStore";
import { ItemStatus, InventoryItem } from "../../../../store/inventoryStore";
import FilterBar from "./components/FilterBar";
import InventoryTable from "./components/InventoryTable";
import InventoryItemForm from "./components/InventoryItemForm";
import StockOperationModal from "./components/StockOperationModal";
import Modal from "../../../../components/Modal";
import KPICard from "./components/KPICard";
import { Link, useLocation } from "react-router-dom";
import ModalButton from "./components/ModalButton";

const InventoryList: React.FC = () => {
  const {
    items,
    filteredItems,
    categories,
    loading,
    stockAlerts,
    filters,
    fetchItems,
    fetchCategories,
    addItem,
    updateItem,
    deleteItem,
    applyFilters,
    resetFilters,
    changeItemStatus,
    consumeItem,
    addStock,
  } = useInventoryStore();

  const location = useLocation();

  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  useEffect(() => {
    console.log("Modal de añadir ítem:", isAddModalOpen);
  }, [isAddModalOpen]);

  // Handlers para modales
  const handleAddItem = async (data: Partial<InventoryItem>) => {
    setSubmitLoading(true);
    const success = await addItem(
      data as Omit<
        InventoryItem,
        "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
      >
    );
    setSubmitLoading(false);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEditItem = async (data: Partial<InventoryItem>) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await updateItem(selectedItem.id, data);
    setSubmitLoading(false);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await deleteItem(selectedItem.id);
    setSubmitLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleAddStock = async (quantity: number, notes?: string) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await addStock(selectedItem.id, quantity, notes);
    setSubmitLoading(false);
    if (success) {
      setIsAddStockModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleConsumeStock = async (quantity: number, notes?: string) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await consumeItem(selectedItem.id, quantity, notes);
    setSubmitLoading(false);
    if (success) {
      setIsConsumeModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: ItemStatus) => {
    await changeItemStatus(id, newStatus);
  };

  // KPI Calculations
  const totalItems = items.length;
  const activeItems = items.filter(
    (item) => item.status === ItemStatus.ACTIVE
  ).length;
  const lowStockItems = stockAlerts.length;
  const totalValue = items.reduce(
    (sum, item) => sum + (item.price || 0) * item.stock,
    0
  );

  // Verificar si hay categorías disponibles
  const hasCategoriesWarning = categories.length === 0;

  // Función específica para abrir modal
  const openAddModal = () => {
    console.log("Intento abrir modal");
    setIsAddModalOpen(true);
    console.log("Después de setIsAddModalOpen:", true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
            Inventario
          </h1>
          <ModalButton text="Añadir ítem" onClick={openAddModal} />
        </div>

        {/* Barra de navegación secundaria */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
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

        {/* Advertencia de crear categorías primero */}
        {hasCategoriesWarning && (
          <div
            className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded mb-6"
            role="alert"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-2xl mr-3"></i>
              </div>
              <div>
                <p className="font-bold">No hay categorías de inventario</p>
                <p className="text-sm">
                  Debes crear al menos una categoría antes de añadir ítems.{" "}
                  <Link
                    to="/dashboard/inventory/categories"
                    className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    Ir a crear categorías
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total de ítems"
            value={totalItems}
            icon="fa-boxes-stacked"
            color="border-blue-500"
          />
          <KPICard
            title="Ítems activos"
            value={activeItems}
            icon="fa-check-circle"
            color="border-green-500"
          />
          <KPICard
            title="Stock bajo"
            value={lowStockItems}
            icon="fa-exclamation-triangle"
            color="border-red-500"
            onClick={() => applyFilters({ lowStock: true })}
          />
          <KPICard
            title="Valor total"
            value={`$${totalValue.toFixed(2)}`}
            icon="fa-dollar-sign"
            color="border-yellow-500"
          />
        </div>
      </div>

      {/* Filtros */}
      <FilterBar
        filters={filters}
        categories={categories}
        onFilterChange={applyFilters}
        onResetFilters={resetFilters}
        lowStockCount={lowStockItems}
      />

      {/* Tabla de inventario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <InventoryTable
          items={filteredItems}
          loading={loading}
          onEdit={(item) => {
            setSelectedItem(item);
            setIsEditModalOpen(true);
          }}
          onDelete={(id) => {
            const item = items.find((item) => item.id === id);
            if (item) {
              setSelectedItem(item);
              setIsDeleteModalOpen(true);
            }
          }}
          onChangeStatus={handleChangeStatus}
          onAddStock={(id) => {
            const item = items.find((item) => item.id === id);
            if (item) {
              setSelectedItem(item);
              setIsAddStockModalOpen(true);
            }
          }}
          onConsumeStock={(id) => {
            const item = items.find((item) => item.id === id);
            if (item) {
              setSelectedItem(item);
              setIsConsumeModalOpen(true);
            }
          }}
        />
      </div>

      {/* Modales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-100 bg-opacity-20 dark:bg-indigo-100 dark:bg-opacity-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-4xl w-full">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">
                Añadir ítem de inventario
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div>
              <InventoryItemForm
                categories={categories}
                onSubmit={handleAddItem}
                onCancel={() => setIsAddModalOpen(false)}
                loading={submitLoading}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        title="Editar ítem de inventario"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="xl"
      >
        {selectedItem && (
          <InventoryItemForm
            item={selectedItem}
            categories={categories}
            onSubmit={handleEditItem}
            onCancel={() => setIsEditModalOpen(false)}
            loading={submitLoading}
          />
        )}
      </Modal>

      <Modal
        title="Confirmar eliminación"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
      >
        <div className="p-6">
          <p className="text-center text-lg text-gray-800 dark:text-white mb-6">
            ¿Estás seguro de que deseas eliminar{" "}
            <span className="font-bold">{selectedItem?.name}</span>?
          </p>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
            Si este ítem tiene movimientos asociados, se marcará como inactivo
            en lugar de eliminarse.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteItem}
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

      {/* Modal para añadir stock */}
      <Modal
        title="Añadir stock"
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        size="md"
      >
        {selectedItem && (
          <StockOperationModal
            title="Añadir stock"
            item={selectedItem}
            onSubmit={handleAddStock}
            onCancel={() => setIsAddStockModalOpen(false)}
            loading={submitLoading}
            operation="add"
          />
        )}
      </Modal>

      {/* Modal para consumir stock */}
      <Modal
        title="Consumir stock"
        isOpen={isConsumeModalOpen}
        onClose={() => setIsConsumeModalOpen(false)}
        size="md"
      >
        {selectedItem && (
          <StockOperationModal
            title="Consumir stock"
            item={selectedItem}
            onSubmit={handleConsumeStock}
            onCancel={() => setIsConsumeModalOpen(false)}
            loading={submitLoading}
            operation="consume"
            maxQuantity={selectedItem.stock}
          />
        )}
      </Modal>
    </div>
  );
};

export default InventoryList;
