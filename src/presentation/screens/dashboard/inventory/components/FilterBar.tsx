import React, { useState, useEffect } from "react";
import {
  ItemStatus,
  ItemType,
  Category,
  InventoryFilters,
} from "../../../../../store/inventoryStore";

interface FilterBarProps {
  filters: InventoryFilters;
  categories: Category[];
  onFilterChange: ( filters: Partial<InventoryFilters> ) => void;
  onResetFilters: () => void;
  lowStockCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ( {
  filters,
  categories,
  onFilterChange,
  onResetFilters,
  lowStockCount,
} ) => {
  // Estado local para el término de búsqueda (para evitar demasiadas actualizaciones)
  const [ searchTerm, setSearchTerm ] = useState( filters.search || "" );

  // Ubicaciones únicas extraídas de otros componentes
  const [ locations, setLocations ] = useState<string[]>( [] );

  // Actualizar el término de búsqueda después de un tiempo de inactividad
  useEffect( () => {
    const timeoutId = setTimeout( () => {
      if ( searchTerm !== filters.search ) {
        onFilterChange( { search: searchTerm } );
      }
    }, 300 ); // 300ms de debounce

    return () => {
      clearTimeout( timeoutId );
    };
  }, [ searchTerm, filters.search, onFilterChange ] );

  // Simulación de obtener ubicaciones únicas - en una aplicación real, estas vendrían del store
  useEffect( () => {
    // Aquí normalmente obtendrías ubicaciones únicas de los ítems
    setLocations( [
      "Almacén principal",
      "Oficina",
      "Bodega",
      "Taller",
      "Exteriores",
    ] );
  }, [] );

  // Manejar el cambio de filtros
  const handleFilterChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    const { name, value } = e.target;

    if ( value === "" ) {
      // Si se selecciona "Todos", eliminamos ese filtro
      const newFilters = { ...filters };
      delete newFilters[ name as keyof InventoryFilters ];
      onFilterChange( newFilters );
    } else if ( name === "type" ) {
      onFilterChange( { type: value as ItemType } );
    } else if ( name === "status" ) {
      onFilterChange( { status: value as ItemStatus } );
    } else {
      onFilterChange( { [ name ]: value } );
    }
  };

  // Manejar cambio de checkbox de stock bajo
  const handleLowStockChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    onFilterChange( { lowStock: e.target.checked } );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
        {/* Barra de búsqueda */ }
        <div className="lg:w-1/3">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={ searchTerm }
              onChange={ ( e ) => setSearchTerm( e.target.value ) }
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg block w-full ps-2 p-2.5 placeholder-gray-400"
              placeholder="Buscar en inventario..."
            />
            { searchTerm && (
              <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                <button
                  onClick={ () => setSearchTerm( "" ) }
                  className="text-gray-400 hover:text-gray-800 dark:hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) }
          </div>
        </div>

        {/* Filtros de selección */ }
        <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-4">
          <select
            name="type"
            value={ filters.type || "" }
            onChange={ handleFilterChange }
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-2.5"
          >
            <option value="">Todos los tipos</option>
            <option value={ ItemType.MACHINERY }>Maquinaria</option>
            <option value={ ItemType.SUPPLIES }>Insumos</option>
            <option value={ ItemType.TOOL }>Herramientas</option>
            <option value={ ItemType.MATERIAL }>Materiales</option>
          </select>

          <select
            name="category"
            value={ filters.category || "" }
            onChange={ handleFilterChange }
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-2.5"
          >
            <option value="">Todas las categorías</option>
            { categories.map( ( category ) => (
              <option key={ category.id } value={ category.id }>
                { category.name }
              </option>
            ) ) }
          </select>

          <select
            name="status"
            value={ filters.status || "" }
            onChange={ handleFilterChange }
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-2.5"
          >
            <option value="">Todos los estados</option>
            <option value={ ItemStatus.ACTIVE }>Activo</option>
            <option value={ ItemStatus.INACTIVE }>Inactivo</option>
            <option value={ ItemStatus.MAINTENANCE }>En mantenimiento</option>
            <option value={ ItemStatus.DISCONTINUED }>Descontinuado</option>
          </select>

          <select
            name="location"
            value={ filters.location || "" }
            onChange={ handleFilterChange }
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-2.5"
          >
            <option value="">Todas las ubicaciones</option>
            { locations.map( ( location ) => (
              <option key={ location } value={ location }>
                { location }
              </option>
            ) ) }
          </select>
        </div>

        {/* Filtro de stock bajo y botón de reset */ }
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              id="lowStockFilter"
              type="checkbox"
              checked={ filters.lowStock || false }
              onChange={ handleLowStockChange }
              className="w-4 h-4 border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="lowStockFilter"
              className="text-sm text-gray-800 dark:text-gray-100 flex items-center border-gray-200 dark:border-gray-600"
            >
              Stock bajo
              { lowStockCount > 0 && (
                <span className="ml-2 bg-red-600 text-gray-100 dark:bg-red-600  dark:text-gray-100 text-xs font-medium rounded-full h-5 px-2 inline-flex items-center justify-center">
                  { lowStockCount }
                </span>
              ) }
            </label>
          </div>

          <button
            onClick={ onResetFilters }
            className="text-gray-800 border-gray-300 ring-1 ring-gray-200 dark:ring-gray-600 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 dark:focus:ring-gray-500 font-medium rounded-lg text-sm px-4 py-2"
          >
            <i className="fas fa-redo-alt mr-2"></i>
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
