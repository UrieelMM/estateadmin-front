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
  locations: string[];
  totalItems: number;
  filteredItems: number;
  onFilterChange: ( filters: Partial<InventoryFilters> ) => void;
  onResetFilters: () => void;
  lowStockCount: number;
}

const selectClass =
  "bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 cursor-pointer";

const FilterBar: React.FC<FilterBarProps> = ( {
  filters,
  categories,
  locations,
  totalItems,
  filteredItems,
  onFilterChange,
  onResetFilters,
  lowStockCount,
} ) => {
  // Estado local para el término de búsqueda (para evitar demasiadas actualizaciones)
  const [ searchTerm, setSearchTerm ] = useState( filters.search || "" );

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

  const getTypeLabel = ( type?: ItemType ) => {
    if ( !type ) return "";
    if ( type === ItemType.MACHINERY ) return "Maquinaria";
    if ( type === ItemType.SUPPLIES ) return "Insumos";
    if ( type === ItemType.TOOL ) return "Herramientas";
    return "Materiales";
  };

  const getStatusLabel = ( status?: ItemStatus ) => {
    if ( !status ) return "";
    if ( status === ItemStatus.ACTIVE ) return "Activo";
    if ( status === ItemStatus.INACTIVE ) return "Inactivo";
    if ( status === ItemStatus.MAINTENANCE ) return "En mantenimiento";
    return "Descontinuado";
  };

  const getCategoryLabel = ( categoryId?: string ) => {
    if ( !categoryId ) return "";
    return categories.find( ( category ) => category.id === categoryId )?.name || "";
  };

  const activeFilters = [
    filters.search
      ? {
        key: "search",
        label: `Búsqueda: ${ filters.search }`,
        onRemove: () => {
          setSearchTerm( "" );
          onFilterChange( { search: "" } );
        },
      }
      : null,
    filters.type
      ? {
        key: "type",
        label: `Tipo: ${ getTypeLabel( filters.type ) }`,
        onRemove: () => onFilterChange( { type: undefined } ),
      }
      : null,
    filters.category
      ? {
        key: "category",
        label: `Categoría: ${ getCategoryLabel( filters.category ) }`,
        onRemove: () => onFilterChange( { category: undefined } ),
      }
      : null,
    filters.status
      ? {
        key: "status",
        label: `Estado: ${ getStatusLabel( filters.status ) }`,
        onRemove: () => onFilterChange( { status: undefined } ),
      }
      : null,
    filters.location
      ? {
        key: "location",
        label: `Ubicación: ${ filters.location }`,
        onRemove: () => onFilterChange( { location: undefined } ),
      }
      : null,
    filters.lowStock
      ? {
        key: "lowStock",
        label: "Stock bajo",
        onRemove: () => onFilterChange( { lowStock: false } ),
      }
      : null,
  ].filter( Boolean ) as Array<{ key: string; label: string; onRemove: () => void; }>;

  // Manejar el cambio de filtros
  const handleFilterChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    const { name, value } = e.target;
    if ( name === "type" ) {
      onFilterChange( { type: value ? ( value as ItemType ) : undefined } );
      return;
    }
    if ( name === "status" ) {
      onFilterChange( { status: value ? ( value as ItemStatus ) : undefined } );
      return;
    }
    if ( name === "category" ) {
      onFilterChange( { category: value || undefined } );
      return;
    }
    if ( name === "location" ) {
      onFilterChange( { location: value || undefined } );
    }
  };

  // Manejar cambio de checkbox de stock bajo
  const handleLowStockChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    onFilterChange( { lowStock: e.target.checked } );
  };

  const hasActiveFilters =
    !!filters.search || !!filters.type || !!filters.status ||
    !!filters.category || !!filters.location || !!filters.lowStock;

  const handleResetFilters = () => {
    setSearchTerm( "" );
    onResetFilters();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* Barra de búsqueda */ }
        <div className="lg:w-1/3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <i className="fas fa-search text-gray-400 text-sm" />
            </div>
            <input
              type="text"
              value={ searchTerm }
              onChange={ ( e ) => setSearchTerm( e.target.value ) }
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 placeholder-gray-400"
              placeholder="Buscar en inventario..."
            />
            { searchTerm && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={ () => setSearchTerm( "" ) }
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              </div>
            ) }
          </div>
        </div>

        {/* Filtros de selección */ }
        <div className="flex flex-wrap lg:flex-nowrap gap-2">
          <select name="type" value={ filters.type || "" } onChange={ handleFilterChange } className={ selectClass }>
            <option value="">Todos los tipos</option>
            <option value={ ItemType.MACHINERY }>Maquinaria</option>
            <option value={ ItemType.SUPPLIES }>Insumos</option>
            <option value={ ItemType.TOOL }>Herramientas</option>
            <option value={ ItemType.MATERIAL }>Materiales</option>
          </select>

          <select name="category" value={ filters.category || "" } onChange={ handleFilterChange } className={ selectClass }>
            <option value="">Todas las categorías</option>
            { categories.map( ( category ) => (
              <option key={ category.id } value={ category.id }>{ category.name }</option>
            ) ) }
          </select>

          <select name="status" value={ filters.status || "" } onChange={ handleFilterChange } className={ selectClass }>
            <option value="">Todos los estados</option>
            <option value={ ItemStatus.ACTIVE }>Activo</option>
            <option value={ ItemStatus.INACTIVE }>Inactivo</option>
            <option value={ ItemStatus.MAINTENANCE }>En mantenimiento</option>
            <option value={ ItemStatus.DISCONTINUED }>Descontinuado</option>
          </select>

          <select name="location" value={ filters.location || "" } onChange={ handleFilterChange } className={ selectClass }>
            <option value="">Todas las ubicaciones</option>
            { locations.map( ( location ) => (
              <option key={ location } value={ location }>{ location }</option>
            ) ) }
          </select>
        </div>

        {/* Filtro de stock bajo y botón de reset */ }
        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                id="lowStockFilter"
                type="checkbox"
                checked={ filters.lowStock || false }
                onChange={ handleLowStockChange }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              Stock bajo
              { lowStockCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 inline-flex items-center justify-center">
                  { lowStockCount }
                </span>
              ) }
            </span>
          </label>

          <button
            onClick={ handleResetFilters }
            className={ `inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all duration-150 ${ hasActiveFilters
                ? "border-indigo-300 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
                : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-700/40 dark:hover:bg-gray-700"
              }` }
          >
            <i className="fas fa-redo-alt text-xs" />
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando{ " " }
          <span className="font-semibold text-gray-800 dark:text-gray-100">{ filteredItems }</span>{ " " }
          de{ " " }
          <span className="font-semibold text-gray-800 dark:text-gray-100">{ totalItems }</span>{ " " }
          ítems
        </p>

        { activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            { activeFilters.map( ( filter ) => (
              <button
                key={ filter.key }
                type="button"
                onClick={ filter.onRemove }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700"
                title="Quitar filtro"
              >
                { filter.label }
                <i className="fas fa-times text-[10px]" />
              </button>
            ) ) }
          </div>
        ) }
      </div>
    </div>
  );
};

export default FilterBar;
