import React, { useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import useInventoryStore, {
  ItemStatus,
  InventoryItem,
} from "../../../../store/inventoryStore";
import Modal from "../../../../components/Modal";
import StockOperationModal from "./components/StockOperationModal";
import StatusBadge from "./components/StatusBadge";
import TypeBadge from "./components/TypeBadge";
import InventoryItemForm from "./components/InventoryItemForm";

const InventoryItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items,
    selectedItem,
    movements,
    loading,
    loadingMovements,
    fetchItems,
    fetchMovements,
    setSelectedItem,
    consumeItem,
    addStock,
    changeItemStatus,
    deleteItem,
    stockAlerts,
    updateItem,
    categories,
  } = useInventoryStore();

  const lowStockItems = stockAlerts.length;

  // Estados para modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = React.useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Cuando cambie el ID o los items, seleccionar el ítem correspondiente
  useEffect(() => {
    if (id && items.length > 0) {
      const item = items.find((item) => item.id === id);
      if (item) {
        setSelectedItem(item);
        fetchMovements(id);
      } else {
        // Si no encontramos el ítem, volvemos a la lista
        navigate("/dashboard/inventory");
      }
    }
  }, [id, items, setSelectedItem, fetchMovements, navigate]);

  // Limpiar el ítem seleccionado al desmontar el componente
  useEffect(() => {
    return () => {
      setSelectedItem(null);
    };
  }, [setSelectedItem]);

  // Handlers para operaciones
  const handleAddStock = async (quantity: number, notes?: string) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await addStock(selectedItem.id, quantity, notes);
    setSubmitLoading(false);
    if (success) {
      setIsAddStockModalOpen(false);
    }
  };

  const handleConsumeStock = async (quantity: number, notes?: string) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await consumeItem(selectedItem.id, quantity, notes);
    setSubmitLoading(false);
    if (success) {
      setIsConsumeModalOpen(false);
    }
  };

  const handleStatusChange = async (status: ItemStatus) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    await changeItemStatus(selectedItem.id, status);
    setSubmitLoading(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await deleteItem(selectedItem.id);
    setSubmitLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      navigate("/dashboard/inventory");
    }
  };

  const handleEditItem = async (data: Partial<InventoryItem>) => {
    if (!selectedItem) return;
    setSubmitLoading(true);
    const success = await updateItem(selectedItem.id, data);
    setSubmitLoading(false);
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  if (loading || !selectedItem) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabecera con botones de acción */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate("/dashboard/inventory")}
              className="mr-3 text-gray-400 hover:text-white"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="text-2xl font-bold text-white">
              {selectedItem.name}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={selectedItem.status} />
            <TypeBadge type={selectedItem.type} />
            <span className="text-gray-400 text-sm">
              {selectedItem.categoryName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center"
          >
            <i className="fas fa-plus-circle mr-1"></i>
            Añadir stock
          </button>

          <button
            onClick={() => setIsConsumeModalOpen(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center"
            disabled={selectedItem.stock <= 0}
          >
            <i className="fas fa-minus-circle mr-1"></i>
            Consumir
          </button> */}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center"
          >
            <i className="fas fa-edit mr-1"></i>
            Editar
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center"
          >
            <i className="fas fa-trash-alt mr-1"></i>
            Eliminar
          </button>
        </div>
      </div>

      {/* Barra de navegación secundaria */}
      <div className="dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard/inventory"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              location.pathname.startsWith("/dashboard/inventory") &&
              !location.pathname.includes("categories") &&
              !location.pathname.includes("movements") &&
              !location.pathname.includes("alerts")
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

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información general */}
        <div className="lg:col-span-2">
          <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">
              Información general
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Descripción
                </h3>
                <p className="text-white">
                  {selectedItem.description || "Sin descripción"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Ubicación
                </h3>
                <p className="text-white">
                  {selectedItem.location || "Sin ubicación asignada"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Stock actual
                </h3>
                <p
                  className={`text-xl font-bold ${
                    selectedItem.stock <= selectedItem.minStock
                      ? "text-red-500"
                      : selectedItem.stock <= selectedItem.minStock * 1.2
                      ? "text-yellow-500"
                      : "text-white"
                  }`}
                >
                  {selectedItem.stock}
                  {selectedItem.stock <= selectedItem.minStock && (
                    <span className="ml-2 text-xs text-red-500 font-normal">
                      <i className="fas fa-exclamation-triangle"></i> Stock bajo
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  Mínimo: {selectedItem.minStock}
                </p>
              </div>

              {selectedItem.price !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Precio unitario
                  </h3>
                  <p className="text-white">
                    ${selectedItem.price.toFixed(2)}
                    <span className="text-green-500 ml-2">
                      (Total: $
                      {(selectedItem.price * selectedItem.stock).toFixed(2)})
                    </span>
                  </p>
                </div>
              )}

              {selectedItem.purchaseDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Fecha de compra
                  </h3>
                  <p className="text-white">
                    {selectedItem.purchaseDate.toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedItem.expirationDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Fecha de expiración
                  </h3>
                  <p className="text-white">
                    {selectedItem.expirationDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {selectedItem.brand && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Marca
                  </h3>
                  <p className="text-white">{selectedItem.brand}</p>
                </div>
              )}

              {selectedItem.model && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Modelo
                  </h3>
                  <p className="text-white">{selectedItem.model}</p>
                </div>
              )}

              {selectedItem.serialNumber && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Número de serie
                  </h3>
                  <p className="text-white">{selectedItem.serialNumber}</p>
                </div>
              )}
            </div>

            {selectedItem.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Notas adicionales
                </h3>
                <p className="text-white">{selectedItem.notes}</p>
              </div>
            )}
          </div>

          {/* Movimientos recientes */}
          <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                Movimientos recientes
              </h2>
              <button
                onClick={() =>
                  navigate(
                    `/dashboard/inventory/movements?itemId=${selectedItem.id}`
                  )
                }
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Ver todos
              </button>
            </div>

            {loadingMovements ? (
              <div className="flex justify-center items-center h-40">
                <div className="spinner-border text-indigo-500" role="status">
                  <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
                </div>
              </div>
            ) : movements.length > 0 ? (
              <div className="space-y-4">
                {movements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium">
                          {movement.type === "added" ? (
                            <span className="text-green-500">
                              <i className="fas fa-plus-circle mr-1"></i>{" "}
                              Adición de stock
                            </span>
                          ) : movement.type === "consumed" ? (
                            <span className="text-yellow-500">
                              <i className="fas fa-minus-circle mr-1"></i>{" "}
                              Consumo de stock
                            </span>
                          ) : movement.type === "status_change" ? (
                            <span className="text-indigo-500">
                              <i className="fas fa-sync-alt mr-1"></i> Cambio de
                              estado
                            </span>
                          ) : movement.type === "created" ? (
                            <span className="text-indigo-500">
                              <i className="fas fa-plus-circle mr-1"></i>{" "}
                              Creación
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              <i className="fas fa-history mr-1"></i>{" "}
                              {movement.type}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {movement.createdAt.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-white text-sm">
                      {movement.notes ||
                        (movement.type === "added"
                          ? `Se añadieron ${movement.quantity} unidades`
                          : movement.type === "consumed"
                          ? `Se consumieron ${movement.quantity} unidades`
                          : movement.type === "status_change"
                          ? `Estado cambiado de ${movement.previousStatus} a ${movement.newStatus}`
                          : "Sin detalles")}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Por: {movement.createdByName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-history text-gray-500 text-3xl mb-2"></i>
                <p className="text-gray-400">
                  No hay movimientos registrados para este ítem
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Estado actual y acciones rápidas */}
          <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">
              Estado y acciones
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-1">
                Estado actual
              </h3>
              <div className="flex items-center space-x-2">
                <StatusBadge status={selectedItem.status} />
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs"
                >
                  Cambiar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsAddStockModalOpen(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center justify-center"
              >
                <i className="fas fa-plus-circle mr-1"></i>
                Añadir stock
              </button>

              <button
                onClick={() => setIsConsumeModalOpen(true)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center justify-center"
                disabled={selectedItem.stock <= 0}
              >
                <i className="fas fa-minus-circle mr-1"></i>
                Consumir stock
              </button>

              <button
                onClick={() =>
                  handleStatusChange(
                    selectedItem.status === ItemStatus.ACTIVE
                      ? ItemStatus.INACTIVE
                      : ItemStatus.ACTIVE
                  )
                }
                className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center justify-center"
              >
                <i
                  className={`fas ${
                    selectedItem.status === ItemStatus.ACTIVE
                      ? "fa-ban text-red-500"
                      : "fa-check-circle text-green-500"
                  } mr-1`}
                ></i>
                {selectedItem.status === ItemStatus.ACTIVE
                  ? "Desactivar"
                  : "Activar"}
              </button>

              {selectedItem.status !== ItemStatus.MAINTENANCE && (
                <button
                  onClick={() => handleStatusChange(ItemStatus.MAINTENANCE)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg px-3 py-2 inline-flex items-center justify-center"
                >
                  <i className="fas fa-wrench text-yellow-500 mr-1"></i>
                  Marcar en mantenimiento
                </button>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">
              Información adicional
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-1">
                Fecha de creación
              </h3>
              <p className="text-white">
                {selectedItem.createdAt.toLocaleDateString()}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-1">
                Última actualización
              </h3>
              <p className="text-white">
                {selectedItem.updatedAt.toLocaleDateString()}
              </p>
            </div>

            {selectedItem.supplier && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Proveedor
                </h3>
                <p className="text-white">{selectedItem.supplier}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <Modal
        title="Añadir stock"
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        size="md"
      >
        <StockOperationModal
          title="Añadir stock"
          item={selectedItem}
          onSubmit={handleAddStock}
          onCancel={() => setIsAddStockModalOpen(false)}
          loading={submitLoading}
          operation="add"
        />
      </Modal>

      <Modal
        title="Consumir stock"
        isOpen={isConsumeModalOpen}
        onClose={() => setIsConsumeModalOpen(false)}
        size="md"
      >
        <StockOperationModal
          title="Consumir stock"
          item={selectedItem}
          onSubmit={handleConsumeStock}
          onCancel={() => setIsConsumeModalOpen(false)}
          loading={submitLoading}
          operation="consume"
          maxQuantity={selectedItem.stock}
        />
      </Modal>

      <Modal
        title="Confirmar eliminación"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
      >
        <div className="p-6">
          <p className="text-center text-lg text-white mb-6">
            ¿Estás seguro de que deseas eliminar{" "}
            <span className="font-bold">{selectedItem.name}</span>?
          </p>
          <p className="text-center text-sm text-gray-400 mb-6">
            Si este ítem tiene movimientos asociados, se marcará como inactivo
            en lugar de eliminarse.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
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
    </div>
  );
};

export default InventoryItemDetail;
