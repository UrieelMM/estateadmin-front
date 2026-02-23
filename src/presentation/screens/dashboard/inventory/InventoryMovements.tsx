import React, { useEffect, useState } from "react";
import useInventoryStore, {
  MovementType,
} from "../../../../store/inventoryStore";
import moment from "moment";
import "moment/locale/es";
import { Link, useLocation } from "react-router-dom";

const MOVEMENTS_PAGE_SIZE = 10;

const InventoryMovements: React.FC = () => {
  const { movements, items, loading, fetchMovements, fetchItems, stockAlerts } =
    useInventoryStore();

  const location = useLocation();
  const lowStockItems = stockAlerts.length;

  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ selectedItemId, setSelectedItemId ] = useState<string>( "" );
  const [ movementTypeFilter, setMovementTypeFilter ] = useState<
    MovementType | ""
  >( "" );
  const [ dateRangeFilter, setDateRangeFilter ] = useState( {
    startDate: "",
    endDate: "",
  } );
  const [ visibleMovementsCount, setVisibleMovementsCount ] = useState(
    MOVEMENTS_PAGE_SIZE
  );

  // Cargar datos al montar el componente
  useEffect( () => {
    fetchMovements();
    fetchItems();
  }, [ fetchMovements, fetchItems ] );

  // Filtros combinados
  const filteredMovements = movements.filter( ( movement ) => {
    // Filtro por ítem
    if ( selectedItemId && movement.itemId !== selectedItemId ) {
      return false;
    }

    // Filtro por tipo de movimiento
    if ( movementTypeFilter && movement.type !== movementTypeFilter ) {
      return false;
    }

    // Filtro por búsqueda
    if ( searchTerm ) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !movement.itemName.toLowerCase().includes( searchLower ) &&
        !movement.createdByName.toLowerCase().includes( searchLower ) &&
        !movement.notes?.toLowerCase().includes( searchLower )
      ) {
        return false;
      }
    }

    // Filtro por fecha
    if ( dateRangeFilter.startDate ) {
      const startDate = moment( dateRangeFilter.startDate )
        .startOf( "day" )
        .toDate();
      if ( movement.createdAt < startDate ) {
        return false;
      }
    }

    if ( dateRangeFilter.endDate ) {
      const endDate = moment( dateRangeFilter.endDate ).endOf( "day" ).toDate();
      if ( movement.createdAt > endDate ) {
        return false;
      }
    }

    return true;
  } );
  const visibleMovements = filteredMovements.slice( 0, visibleMovementsCount );

  useEffect( () => {
    setVisibleMovementsCount( MOVEMENTS_PAGE_SIZE );
  }, [
    searchTerm,
    selectedItemId,
    movementTypeFilter,
    dateRangeFilter.startDate,
    dateRangeFilter.endDate,
  ] );

  // Función para obtener el color del badge según el tipo de movimiento
  const getMovementTypeStyle = ( type: MovementType ) => {
    switch ( type ) {
      case MovementType.CREATED:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case MovementType.UPDATED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case MovementType.CONSUMED:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case MovementType.ADDED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case MovementType.REMOVED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case MovementType.TRANSFERRED:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case MovementType.MAINTENANCE:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case MovementType.STATUS_CHANGE:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Función para obtener el icono según el tipo de movimiento
  const getMovementTypeIcon = ( type: MovementType ) => {
    switch ( type ) {
      case MovementType.CREATED:
        return "fa-plus-circle";
      case MovementType.UPDATED:
        return "fa-pencil-alt";
      case MovementType.CONSUMED:
        return "fa-minus-circle";
      case MovementType.ADDED:
        return "fa-plus-circle";
      case MovementType.REMOVED:
        return "fa-trash-alt";
      case MovementType.TRANSFERRED:
        return "fa-exchange-alt";
      case MovementType.MAINTENANCE:
        return "fa-wrench";
      case MovementType.STATUS_CHANGE:
        return "fa-sync-alt";
      default:
        return "fa-question-circle";
    }
  };

  // Función para obtener el texto según el tipo de movimiento
  const getMovementTypeText = ( type: MovementType ) => {
    switch ( type ) {
      case MovementType.CREATED:
        return "Creación";
      case MovementType.UPDATED:
        return "Actualización";
      case MovementType.CONSUMED:
        return "Consumo";
      case MovementType.ADDED:
        return "Adición";
      case MovementType.REMOVED:
        return "Eliminación";
      case MovementType.TRANSFERRED:
        return "Traslado";
      case MovementType.MAINTENANCE:
        return "Mantenimiento";
      case MovementType.STATUS_CHANGE:
        return "Cambio de estado";
      default:
        return "Desconocido";
    }
  };

  // Formato de fecha
  const formatDate = ( date: Date ) => {
    return moment( date ).locale( "es" ).format( "D [de] MMMM [de] YYYY, HH:mm" );
  };

  // Resetear filtros
  const resetFilters = () => {
    setSearchTerm( "" );
    setSelectedItemId( "" );
    setMovementTypeFilter( "" );
    setDateRangeFilter( { startDate: "", endDate: "" } );
    setVisibleMovementsCount( MOVEMENTS_PAGE_SIZE );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Historial de Movimientos
        </h1>

        {/* Barra de navegación secundaria */ }
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/inventory"
              className={ `px-4 py-2 rounded-md text-sm font-medium ${ location.pathname === "/dashboard/inventory"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                }` }
            >
              <i className="fas fa-boxes-stacked mr-2"></i>
              Inventario
            </Link>

            <Link
              to="/dashboard/inventory/categories"
              className={ `px-4 py-2 rounded-md text-sm font-medium ${ location.pathname === "/dashboard/inventory/categories"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                }` }
            >
              <i className="fas fa-tags mr-2"></i>
              Categorías
            </Link>

            <Link
              to="/dashboard/inventory/movements"
              className={ `px-4 py-2 rounded-md text-sm font-medium ${ location.pathname === "/dashboard/inventory/movements"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                }` }
            >
              <i className="fas fa-arrows-rotate mr-2"></i>
              Movimientos
            </Link>

            <Link
              to="/dashboard/inventory/alerts"
              className={ `px-4 py-2 rounded-md text-sm font-medium ${ location.pathname === "/dashboard/inventory/alerts"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                }` }
            >
              <i className="fas fa-triangle-exclamation mr-2"></i>
              Alertas
              { lowStockItems > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs font-medium rounded-full h-5 w-5 inline-flex items-center justify-center">
                  { lowStockItems }
                </span>
              ) }
            </Link>
          </div>
        </div>

        {/* Filtros */ }
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */ }
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={ searchTerm }
                  onChange={ ( e ) => setSearchTerm( e.target.value ) }
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg block w-full ps-2 p-2.5"
                  placeholder="Buscar por ítem, usuario..."
                />
              </div>
            </div>

            {/* Filtro por ítem */ }
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ítem
              </label>
              <select
                value={ selectedItemId }
                onChange={ ( e ) => setSelectedItemId( e.target.value ) }
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              >
                <option value="">Todos los ítems</option>
                { items.map( ( item ) => (
                  <option key={ item.id } value={ item.id }>
                    { item.name }
                  </option>
                ) ) }
              </select>
            </div>

            {/* Filtro por tipo de movimiento */ }
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de movimiento
              </label>
              <select
                value={ movementTypeFilter }
                onChange={ ( e ) =>
                  setMovementTypeFilter( e.target.value as MovementType | "" )
                }
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              >
                <option value="">Todos los tipos</option>
                { Object.values( MovementType ).map( ( type ) => (
                  <option key={ type } value={ type }>
                    { getMovementTypeText( type ) }
                  </option>
                ) ) }
              </select>
            </div>

            {/* Filtros de fecha */ }
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha inicial
              </label>
              <input
                type="date"
                value={ dateRangeFilter.startDate }
                onChange={ ( e ) =>
                  setDateRangeFilter( {
                    ...dateRangeFilter,
                    startDate: e.target.value,
                  } )
                }
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha final
              </label>
              <input
                type="date"
                value={ dateRangeFilter.endDate }
                onChange={ ( e ) =>
                  setDateRangeFilter( {
                    ...dateRangeFilter,
                    endDate: e.target.value,
                  } )
                }
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              />
            </div>
          </div>

          {/* Botón de reseteo */ }
          <div className="flex justify-end">
            <button
              onClick={ resetFilters }
              className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <i className="fas fa-redo-alt mr-2"></i>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Timeline de movimientos */ }
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        { loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="spinner-border text-indigo-500" role="status">
              <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
            </div>
          </div>
        ) : filteredMovements.length > 0 ? (
          <div className="p-6">
            <ol className="relative border-l border-gray-300 dark:border-gray-700">
              { visibleMovements.map( ( movement ) => (
                <li key={ movement.id } className="mb-10 ml-6">
                  <span
                    className={ `absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white dark:ring-gray-800 ${ getMovementTypeStyle(
                      movement.type
                    ) }` }
                  >
                    <i
                      className={ `fas ${ getMovementTypeIcon( movement.type ) }` }
                    ></i>
                  </span>

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={ `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${ getMovementTypeStyle(
                          movement.type
                        ) }` }
                      >
                        { getMovementTypeText( movement.type ) }
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        { movement.itemName }
                      </h3>
                      <time className="block mb-2 text-sm font-normal leading-none text-gray-500 dark:text-gray-400">
                        { formatDate( movement.createdAt ) }
                      </time>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Realizado por: { movement.createdByName }
                    </div>
                  </div>

                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                    { movement.type === MovementType.CONSUMED ||
                      movement.type === MovementType.ADDED ? (
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Cantidad anterior
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.previousQuantity }
                          </span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Cantidad
                          </span>
                          <span
                            className={ `font-bold ${ movement.type === MovementType.CONSUMED
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-green-600 dark:text-green-400"
                              }` }
                          >
                            { movement.type === MovementType.CONSUMED
                              ? "-"
                              : "+" }
                            { movement.quantity }
                          </span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Cantidad final
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.newQuantity }
                          </span>
                        </div>
                      </div>
                    ) : movement.type === MovementType.STATUS_CHANGE ? (
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Estado anterior
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.previousStatus }
                          </span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Nuevo estado
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.newStatus }
                          </span>
                        </div>
                      </div>
                    ) : movement.type === MovementType.TRANSFERRED ? (
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Ubicación anterior
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.location || "Sin ubicación" }
                          </span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            Nueva ubicación
                          </span>
                          <span className="text-gray-800 dark:text-white">
                            { movement.newLocation }
                          </span>
                        </div>
                      </div>
                    ) : null }

                    { movement.notes && (
                      <div className="mt-2">
                        <span className="block text-sm text-gray-500 dark:text-gray-400">
                          Notas
                        </span>
                        <p className="text-gray-800 dark:text-white">{ movement.notes }</p>
                      </div>
                    ) }
                  </div>
                </li>
              ) ) }
            </ol>

            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando { visibleMovements.length } de{" "}
                { filteredMovements.length } movimientos
              </p>
              { filteredMovements.length > visibleMovementsCount && (
                <button
                  onClick={ () =>
                    setVisibleMovementsCount(
                      ( prev ) => prev + MOVEMENTS_PAGE_SIZE
                    )
                  }
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Mostrar más (10)
                </button>
              ) }
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-history text-gray-500 text-3xl mb-2"></i>
            <p className="text-gray-600 dark:text-gray-400">
              No hay movimientos registrados o que coincidan con los filtros
              aplicados
            </p>
            { ( searchTerm ||
              selectedItemId ||
              movementTypeFilter ||
              dateRangeFilter.startDate ||
              dateRangeFilter.endDate ) && (
                <button
                  onClick={ resetFilters }
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                >
                  Limpiar filtros
                </button>
              ) }
          </div>
        ) }
      </div>
    </div>
  );
};

export default InventoryMovements;
