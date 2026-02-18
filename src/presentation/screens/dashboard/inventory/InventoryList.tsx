import React, { useEffect, useState } from "react";
import useInventoryStore, {
  ItemStatus,
  InventoryItem,
  InventoryItemFormData,
} from "../../../../store/inventoryStore";
import FilterBar from "./components/FilterBar";
import InventoryTable from "./components/InventoryTable";
import InventoryItemForm from "./components/InventoryItemForm";
import StockOperationModal from "./components/StockOperationModal";
import Modal from "../../../../components/Modal";
import KPICard from "./components/KPICard";
import { Link, useLocation } from "react-router-dom";
import ModalButton from "./components/ModalButton";
import { formatCurrencyInventory } from "../../../../utils/curreyncy";

const navLinks = [
  { to: "/dashboard/inventory", icon: "fa-boxes-stacked", label: "Inventario" },
  { to: "/dashboard/inventory/categories", icon: "fa-tags", label: "Categorías" },
  { to: "/dashboard/inventory/movements", icon: "fa-arrows-rotate", label: "Movimientos" },
  { to: "/dashboard/inventory/alerts", icon: "fa-triangle-exclamation", label: "Alertas" },
];

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
  const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );
  const [ isEditModalOpen, setIsEditModalOpen ] = useState( false );
  const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState( false );
  const [ isAddStockModalOpen, setIsAddStockModalOpen ] = useState( false );
  const [ isConsumeModalOpen, setIsConsumeModalOpen ] = useState( false );
  const [ selectedItem, setSelectedItem ] = useState<InventoryItem | null>( null );
  const [ submitLoading, setSubmitLoading ] = useState( false );

  // Cargar datos al montar el componente
  useEffect( () => {
    fetchItems();
    fetchCategories();
  }, [ fetchItems, fetchCategories ] );

  useEffect( () => { }, [ isAddModalOpen ] );

  // Handlers para modales
  const handleAddItem = async ( data: Partial<InventoryItemFormData> ) => {
    setSubmitLoading( true );
    const success = await addItem(
      data as Omit<
        InventoryItemFormData,
        "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
      >
    );
    setSubmitLoading( false );
    if ( success ) {
      setIsAddModalOpen( false );
    }
  };

  const handleEditItem = async ( data: Partial<InventoryItemFormData> ) => {
    if ( !selectedItem ) return;
    setSubmitLoading( true );
    const success = await updateItem( selectedItem.id, data );
    setSubmitLoading( false );
    if ( success ) {
      setIsEditModalOpen( false );
      setSelectedItem( null );
    }
  };

  const handleDeleteItem = async () => {
    if ( !selectedItem ) return;
    setSubmitLoading( true );
    const success = await deleteItem( selectedItem.id );
    setSubmitLoading( false );
    if ( success ) {
      setIsDeleteModalOpen( false );
      setSelectedItem( null );
    }
  };

  const handleAddStock = async ( quantity: number, notes?: string ) => {
    if ( !selectedItem ) return;
    setSubmitLoading( true );
    const success = await addStock( selectedItem.id, quantity, notes );
    setSubmitLoading( false );
    if ( success ) {
      setIsAddStockModalOpen( false );
      setSelectedItem( null );
    }
  };

  const handleConsumeStock = async ( quantity: number, notes?: string ) => {
    if ( !selectedItem ) return;
    setSubmitLoading( true );
    const success = await consumeItem( selectedItem.id, quantity, notes );
    setSubmitLoading( false );
    if ( success ) {
      setIsConsumeModalOpen( false );
      setSelectedItem( null );
    }
  };

  const handleChangeStatus = async ( id: string, newStatus: ItemStatus ) => {
    await changeItemStatus( id, newStatus );
  };

  // KPI Calculations
  const totalItems = items.length;
  const activeItems = items.filter(
    ( item ) => item.status === ItemStatus.ACTIVE
  ).length;
  const lowStockItems = stockAlerts.length;
  const totalValue = items.reduce(
    ( sum, item ) => sum + ( item.price || 0 ) * item.stock,
    0
  );

  // Verificar si hay categorías disponibles
  const hasCategoriesWarning = categories.length === 0;

  // Función específica para abrir modal
  const openAddModal = () => {
    console.log( "Intento abrir modal" );
    setIsAddModalOpen( true );
    console.log( "Después de setIsAddModalOpen:", true );
  };

  return (
    <div className="container mx-auto px-4 py-6">

      {/* ── Page Header ── */ }
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
              <i className="fas fa-boxes-stacked mr-2 text-indigo-500" />
              Inventario
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Gestiona los ítems, categorías y movimientos de tu inventario
            </p>
          </div>
          <ModalButton text="Añadir ítem" onClick={ openAddModal } />
        </div>

        {/* ── Secondary Navigation (Tabs) ── */ }
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-1.5 mb-6">
          <div className="flex flex-wrap gap-1">
            { navLinks.map( ( link ) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={ link.to }
                  to={ link.to }
                  className={ `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${ isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                    }` }
                >
                  <i className={ `fas ${ link.icon } text-xs` } />
                  { link.label }
                  { link.label === "Alertas" && lowStockItems > 0 && (
                    <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 inline-flex items-center justify-center">
                      { lowStockItems }
                    </span>
                  ) }
                </Link>
              );
            } ) }
          </div>
        </div>

        {/* ── Categories Warning ── */ }
        { hasCategoriesWarning && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3.5 rounded-xl mb-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-amber-500 text-sm" />
            </div>
            <div>
              <p className="font-semibold text-sm">No hay categorías de inventario</p>
              <p className="text-sm mt-0.5 text-amber-700 dark:text-amber-400">
                Debes crear al menos una categoría antes de añadir ítems.{ " " }
                <Link
                  to="/dashboard/inventory/categories"
                  className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                >
                  Crear categoría →
                </Link>
              </p>
            </div>
          </div>
        ) }

        {/* ── KPIs ── */ }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total de ítems"
            value={ totalItems }
            icon="fa-boxes-stacked"
            color="border-blue-500"
          />
          <KPICard
            title="Ítems activos"
            value={ activeItems }
            icon="fa-check-circle"
            color="border-green-500"
          />
          <KPICard
            title="Stock bajo"
            value={ lowStockItems }
            icon="fa-exclamation-triangle"
            color="border-red-500"
            onClick={ () => applyFilters( { lowStock: true } ) }
          />
          <KPICard
            title="Valor total"
            value={ formatCurrencyInventory( totalValue ) }
            icon="fa-dollar-sign"
            color="border-yellow-500"
          />
        </div>
      </div>

      {/* ── Filters ── */ }
      <FilterBar
        filters={ filters }
        categories={ categories }
        onFilterChange={ applyFilters }
        onResetFilters={ resetFilters }
        lowStockCount={ lowStockItems }
      />

      {/* ── Inventory Table ── */ }
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 overflow-hidden">
        <InventoryTable
          items={ filteredItems }
          loading={ loading }
          onEdit={ ( item ) => {
            setSelectedItem( item );
            setIsEditModalOpen( true );
          } }
          onDelete={ ( id ) => {
            const item = items.find( ( item ) => item.id === id );
            if ( item ) {
              setSelectedItem( item );
              setIsDeleteModalOpen( true );
            }
          } }
          onChangeStatus={ handleChangeStatus }
          onAddStock={ ( id ) => {
            const item = items.find( ( item ) => item.id === id );
            if ( item ) {
              setSelectedItem( item );
              setIsAddStockModalOpen( true );
            }
          } }
          onConsumeStock={ ( id ) => {
            const item = items.find( ( item ) => item.id === id );
            if ( item ) {
              setSelectedItem( item );
              setIsConsumeModalOpen( true );
            }
          } }
        />
      </div>

      {/* ── Modales ── */ }
      <Modal
        title="Añadir ítem de inventario"
        isOpen={ isAddModalOpen }
        onClose={ () => setIsAddModalOpen( false ) }
        size="xl"
      >
        <InventoryItemForm
          categories={ categories }
          onSubmit={ handleAddItem }
          onCancel={ () => setIsAddModalOpen( false ) }
          loading={ submitLoading }
        />
      </Modal>

      <Modal
        title="Editar ítem de inventario"
        isOpen={ isEditModalOpen }
        onClose={ () => setIsEditModalOpen( false ) }
        size="xl"
      >
        { selectedItem && (
          <InventoryItemForm
            item={ selectedItem }
            categories={ categories }
            onSubmit={ handleEditItem }
            onCancel={ () => setIsEditModalOpen( false ) }
            loading={ submitLoading }
          />
        ) }
      </Modal>

      {/* Delete confirmation modal */ }
      <Modal
        title="Confirmar eliminación"
        isOpen={ isDeleteModalOpen }
        onClose={ () => setIsDeleteModalOpen( false ) }
        size="sm"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <i className="fas fa-trash-alt text-2xl text-red-500" />
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              ¿Eliminar "{ selectedItem?.name }"?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
              Si este ítem tiene movimientos asociados, se marcará como inactivo en lugar de eliminarse.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={ () => setIsDeleteModalOpen( false ) }
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={ handleDeleteItem }
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={ submitLoading }
            >
              { submitLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt" />
                  Eliminar
                </>
              ) }
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para añadir stock */ }
      <Modal
        title="Añadir stock"
        isOpen={ isAddStockModalOpen }
        onClose={ () => setIsAddStockModalOpen( false ) }
        size="md"
      >
        { selectedItem && (
          <StockOperationModal
            title="Añadir stock"
            item={ selectedItem }
            onSubmit={ handleAddStock }
            onCancel={ () => setIsAddStockModalOpen( false ) }
            loading={ submitLoading }
            operation="add"
          />
        ) }
      </Modal>

      {/* Modal para consumir stock */ }
      <Modal
        title="Consumir stock"
        isOpen={ isConsumeModalOpen }
        onClose={ () => setIsConsumeModalOpen( false ) }
        size="md"
      >
        { selectedItem && (
          <StockOperationModal
            title="Consumir stock"
            item={ selectedItem }
            onSubmit={ handleConsumeStock }
            onCancel={ () => setIsConsumeModalOpen( false ) }
            loading={ submitLoading }
            operation="consume"
            maxQuantity={ selectedItem.stock }
          />
        ) }
      </Modal>
    </div>
  );
};

export default InventoryList;
