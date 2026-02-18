import React, { useEffect, useMemo, useState } from "react";
import useInventoryStore from "../../../../store/inventoryStore";
import InventoryTable from "./components/InventoryTable";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Modal from "../../../../components/Modal";

const InventoryAlerts: React.FC = () => {
  const {
    stockAlerts,
    fetchItems,
    loading,
    changeItemStatus,
    deleteItem,
    applyFilters,
  } = useInventoryStore();

  const navigate = useNavigate();
  const location = useLocation();
  const lowStockItems = stockAlerts.length;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const selectedDeleteItem = useMemo(
    () => stockAlerts.find((item) => item.id === selectedDeleteId) || null,
    [selectedDeleteId, stockAlerts]
  );

  useEffect(() => {
    fetchItems();
    // Aplicar filtro de stock bajo después de cargar los items
    applyFilters({ lowStock: true });
  }, [fetchItems, applyFilters]);

  const handleViewItem = (id: string) => {
    navigate(`/dashboard/inventory/item/${id}`);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return;
    setSubmitLoading(true);
    await deleteItem(selectedDeleteId);
    setSubmitLoading(false);
    setIsDeleteModalOpen(false);
    setSelectedDeleteId(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
            Alertas de Stock
          </h1>
          <button
            onClick={() => navigate("/dashboard/inventory")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center"
          >
            <i className="fas fa-arrow-left mr-2 text-white"></i>
            Volver a Inventario
          </button>
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

        <div
          className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-2xl mr-3"></i>
            </div>
            <div>
              <p className="font-bold">Alerta de stock bajo</p>
              <p className="text-sm">
                Se muestran los ítems que tienen stock igual o menor al stock
                mínimo definido.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <InventoryTable
          items={stockAlerts}
          loading={loading}
          onEdit={(item) => handleViewItem(item.id)}
          onDelete={(id) => {
            setSelectedDeleteId(id);
            setIsDeleteModalOpen(true);
          }}
          onChangeStatus={changeItemStatus}
          onAddStock={(id) => handleViewItem(id)}
          onConsumeStock={(id) => handleViewItem(id)}
        />
      </div>

      <Modal
        title="Confirmar eliminación"
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeleteId(null);
        }}
        size="sm"
      >
        <div className="p-6">
          <p className="text-center text-base text-gray-800 dark:text-white mb-2">
            ¿Eliminar el ítem{ " " }
            <span className="font-semibold">{selectedDeleteItem?.name || "seleccionado"}</span>?
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            Esta acción no se puede deshacer si no tiene movimientos asociados.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDeleteId(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={submitLoading}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitLoading ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>

      {stockAlerts.length === 0 && !loading && (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-6">
          <i className="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            ¡No hay alertas de stock!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Todos tus ítems tienen niveles de stock adecuados.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;
