import React, { useEffect, useMemo, useState } from "react";
import useInventoryStore, {
  ItemStatus,
  InventoryItem,
  InventoryItemFormData,
  MovementType,
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
import toast from "react-hot-toast";

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
    movements,
    loading,
    stockAlerts,
    filters,
    fetchItems,
    fetchCategories,
    fetchMovements,
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
    fetchMovements();
  }, [ fetchItems, fetchCategories, fetchMovements ] );

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
  const lowStockItems = stockAlerts.length;
  const now = new Date();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

  const lastMovementByItem = useMemo( () => {
    const map = new Map<string, Date>();
    movements.forEach( ( movement ) => {
      const movementDate =
        movement.createdAt instanceof Date
          ? movement.createdAt
          : movement.createdAt
            ? new Date( movement.createdAt as unknown as string )
            : null;
      if ( !movementDate || Number.isNaN( movementDate.getTime() ) ) return;
      const current = map.get( movement.itemId );
      if ( !current || movementDate > current ) {
        map.set( movement.itemId, movementDate );
      }
    } );
    return map;
  }, [ movements ] );

  const criticalItems = items.filter(
    ( item ) => item.status === ItemStatus.ACTIVE && item.stock <= item.minStock
  );
  const nearExpirationItems = items.filter( ( item ) => {
    if ( !item.expirationDate ) return false;
    const expirationDate =
      item.expirationDate instanceof Date
        ? item.expirationDate
        : new Date( item.expirationDate as unknown as string );
    if ( Number.isNaN( expirationDate.getTime() ) ) return false;
    const diffMs = expirationDate.getTime() - now.getTime();
    return diffMs >= 0 && diffMs <= THIRTY_DAYS_MS;
  } );
  const staleItems = items.filter( ( item ) => {
    const lastMovement = lastMovementByItem.get( item.id );
    const referenceDate = lastMovement || item.updatedAt || item.createdAt;
    const refDate =
      referenceDate instanceof Date
        ? referenceDate
        : new Date( referenceDate as unknown as string );
    if ( Number.isNaN( refDate.getTime() ) ) return false;
    return now.getTime() - refDate.getTime() > SIXTY_DAYS_MS && item.stock > 0;
  } );
  const immobilizedValue = staleItems.reduce(
    ( sum, item ) => sum + ( item.price || 0 ) * item.stock,
    0
  );

  const consumptionByItemLast30 = useMemo( () => {
    const cutoff = now.getTime() - THIRTY_DAYS_MS;
    const map = new Map<string, number>();
    movements.forEach( ( movement ) => {
      if ( movement.type !== MovementType.CONSUMED ) return;
      const movementDate =
        movement.createdAt instanceof Date
          ? movement.createdAt
          : movement.createdAt
            ? new Date( movement.createdAt as unknown as string )
            : null;
      if ( !movementDate || movementDate.getTime() < cutoff ) return;
      const qty = movement.quantity || 0;
      if ( qty <= 0 ) return;
      map.set( movement.itemId, ( map.get( movement.itemId ) || 0 ) + qty );
    } );
    return map;
  }, [ movements, now ] );

  const replenishmentRecommendations = useMemo( () => {
    return items
      .map( ( item ) => {
        const consumed30 = consumptionByItemLast30.get( item.id ) || 0;
        if ( consumed30 <= 0 ) return null;
        const desiredStock = Math.max( item.minStock, consumed30 );
        const suggestedQty = Math.max( 0, desiredStock - item.stock );
        if ( suggestedQty <= 0 ) return null;
        const stockCoverageDays = item.stock > 0 ? Math.round( ( item.stock / consumed30 ) * 30 ) : 0;
        return {
          id: item.id,
          name: item.name,
          currentStock: item.stock,
          consumed30,
          suggestedQty,
          stockCoverageDays,
        };
      } )
      .filter( ( item ): item is NonNullable<typeof item> => item !== null )
      .sort( ( a, b ) => a.stockCoverageDays - b.stockCoverageDays || b.suggestedQty - a.suggestedQty )
      .slice( 0, 5 );
  }, [ items, consumptionByItemLast30 ] );

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map( ( item ) => ( item.location || "" ).trim() )
            .filter( ( location ) => location.length > 0 )
        )
      ).sort( ( a, b ) => a.localeCompare( b, "es", { sensitivity: "base" } ) ),
    [ items ]
  );

  // Verificar si hay categorías disponibles
  const hasCategoriesWarning = categories.length === 0;

  const statusLabelMap: Record<ItemStatus, string> = {
    [ ItemStatus.ACTIVE ]: "Activo",
    [ ItemStatus.INACTIVE ]: "Inactivo",
    [ ItemStatus.MAINTENANCE ]: "Mantenimiento",
    [ ItemStatus.DISCONTINUED ]: "Descontinuado",
  };

  const typeLabelMap: Record<string, string> = {
    machinery: "Maquinaria",
    supplies: "Insumos",
    tool: "Herramientas",
    material: "Materiales",
  };

  const escapeCsvCell = ( value: string | number ) => {
    const cell = String( value ?? "" );
    if ( /[",\n]/.test( cell ) ) {
      return `"${ cell.replace( /"/g, "\"\"" ) }"`;
    }
    return cell;
  };

  const handleExportFilteredCsv = () => {
    if ( filteredItems.length === 0 ) {
      toast( "No hay datos filtrados para exportar." );
      return;
    }
    const headers = [
      "Nombre",
      "Tipo",
      "Categoría",
      "Ubicación",
      "Estado",
      "Stock",
      "Stock mínimo",
      "Precio unitario",
      "Valor total",
      "Última actualización",
    ];

    const rows = filteredItems.map( ( item ) => [
      item.name,
      typeLabelMap[ item.type ] || item.type,
      item.categoryName || "-",
      item.location || "-",
      statusLabelMap[ item.status ] || item.status,
      item.stock,
      item.minStock,
      item.price ?? 0,
      ( item.price || 0 ) * item.stock,
      item.updatedAt ? new Date( item.updatedAt ).toLocaleString( "es-MX" ) : "-",
    ] );

    const csvContent = [
      headers.map( escapeCsvCell ).join( "," ),
      ...rows.map( ( row ) => row.map( escapeCsvCell ).join( "," ) ),
    ].join( "\n" );

    const blob = new Blob( [ "\uFEFF" + csvContent ], { type: "text/csv;charset=utf-8;" } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( "a" );
    link.href = url;
    link.download = `inventory_${ new Date().toISOString().slice( 0, 10 ) }.csv`;
    document.body.appendChild( link );
    link.click();
    document.body.removeChild( link );
    URL.revokeObjectURL( url );
  };

  // Función específica para abrir modal
  const openAddModal = () => {
    setIsAddModalOpen( true );
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={ handleExportFilteredCsv }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
            >
              <i className="fas fa-file-csv text-xs" />
              Exportar CSV
            </button>
            <ModalButton text="Añadir ítem" onClick={ openAddModal } />
          </div>
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
            title="Ítems críticos"
            value={ criticalItems.length }
            icon="fa-triangle-exclamation"
            color="rose"
            hint="Stock en mínimo o por debajo."
            onClick={ () => applyFilters( { lowStock: true } ) }
          />
          <KPICard
            title="Por vencer (30 días)"
            value={ nearExpirationItems.length }
            icon="fa-calendar-days"
            color="amber"
            hint="Revisa consumibles y materiales."
          />
          <KPICard
            title="Sin movimiento (+60 días)"
            value={ staleItems.length }
            icon="fa-clock-rotate-left"
            color="slate"
            hint="Posible sobreinventario o baja rotación."
          />
          <KPICard
            title="Valor inmovilizado"
            value={ formatCurrencyInventory( immobilizedValue ) }
            icon="fa-coins"
            color="indigo"
            hint="Capital detenido en ítems sin rotación."
          />
        </div>

        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-900 p-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <i className="fas fa-lightbulb text-xs" />
                Recomendaciones de reposición (basado en consumo últimos 30 días)
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Prioriza ítems con menor cobertura de stock para evitar faltantes operativos.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              { replenishmentRecommendations.length } sugerencias
            </span>
          </div>

          { replenishmentRecommendations.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              { replenishmentRecommendations.map( ( recommendation ) => (
                <div
                  key={ recommendation.id }
                  className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white/90 dark:bg-gray-800/80 p-3"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    { recommendation.name }
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cobertura estimada: <span className="font-semibold">{ recommendation.stockCoverageDays } días</span>
                  </p>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <p>Stock actual: <span className="font-semibold">{ recommendation.currentStock }</span></p>
                    <p>Consumo 30d: <span className="font-semibold">{ recommendation.consumed30 }</span></p>
                    <p>Reposición sugerida: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{ recommendation.suggestedQty }</span></p>
                  </div>
                </div>
              ) ) }
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 p-3 text-sm text-gray-600 dark:text-gray-400">
              Aún no hay consumo suficiente en los últimos 30 días para generar recomendaciones automáticas.
            </div>
          ) }
        </div>
      </div>

      {/* ── Filters ── */ }
      <FilterBar
        filters={ filters }
        categories={ categories }
        locations={ locations }
        totalItems={ totalItems }
        filteredItems={ filteredItems.length }
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
