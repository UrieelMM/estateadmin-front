import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InventoryItem, ItemStatus } from "../../../../../store/inventoryStore";
import TypeBadge from "./TypeBadge";
import StatusBadge from "./StatusBadge";
import { formatCurrencyInventory } from "../../../../../utils/curreyncy";
import { createPortal } from "react-dom";

interface Column {
  id: string;
  label: string;
  sortable: boolean;
  render: ( item: InventoryItem ) => React.ReactNode;
  align?: "left" | "center";
}

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: ( item: InventoryItem ) => void;
  onDelete: ( id: string ) => void;
  onChangeStatus: ( id: string, status: ItemStatus ) => void;
  onAddStock: ( id: string ) => void;
  onConsumeStock: ( id: string ) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ( {
  items,
  loading,
  onEdit,
  onDelete,
  onChangeStatus,
  onAddStock,
  onConsumeStock,
} ) => {
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ itemsPerPage, setItemsPerPage ] = useState( 10 );
  const [ sortField, setSortField ] = useState<string>( "name" );
  const [ sortDirection, setSortDirection ] = useState<"asc" | "desc">( "asc" );
  const [ actionMenu, setActionMenu ] = useState<{
    itemId: string;
    top: number;
    left: number;
    width: number;
  } | null>( null );

  useEffect( () => {
    const handleOutsideClick = ( event: MouseEvent ) => {
      const target = event.target as HTMLElement | null;
      if ( !target ) return;
      if ( target.closest( "[data-action-menu-root='true']" ) ) return;
      setActionMenu( null );
    };
    const handleEscape = ( event: KeyboardEvent ) => {
      if ( event.key === "Escape" ) {
        setActionMenu( null );
      }
    };
    const handleScroll = () => {
      setActionMenu( null );
    };
    document.addEventListener( "click", handleOutsideClick );
    document.addEventListener( "keydown", handleEscape );
    window.addEventListener( "scroll", handleScroll, true );
    return () => {
      document.removeEventListener( "click", handleOutsideClick );
      document.removeEventListener( "keydown", handleEscape );
      window.removeEventListener( "scroll", handleScroll, true );
    };
  }, [] );

  // Definición de columnas
  const columns: Column[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nombre",
        sortable: true,
        render: ( item ) => (
          <Link
            to={ `/dashboard/inventory/item/${ item.id }` }
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            { item.name }
          </Link>
        ),
      },
      {
        id: "type",
        label: "Tipo",
        sortable: true,
        render: ( item ) => <TypeBadge type={ item.type } />,
      },
      {
        id: "categoryName",
        label: "Categoría",
        sortable: true,
        render: ( item ) => (
          <span className="text-gray-600 dark:text-gray-400">{ item.categoryName }</span>
        ),
      },
      {
        id: "location",
        label: "Ubicación",
        sortable: true,
        render: ( item ) => (
          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
            { item.location ? (
              <>
                <i className="fas fa-map-marker-alt text-gray-400 text-xs" />
                { item.location }
              </>
            ) : (
              <span className="text-gray-400">—</span>
            ) }
          </span>
        ),
      },
      {
        id: "stock",
        label: "Stock",
        sortable: true,
        render: ( item ) => {
          const isLow = item.stock <= item.minStock;
          const isWarning = !isLow && item.stock <= item.minStock * 1.5;
          const pct = Math.min( 100, item.minStock > 0 ? ( item.stock / ( item.minStock * 2 ) ) * 100 : 100 );
          return (
            <div className="flex flex-col gap-1 min-w-[70px]">
              <div className="flex items-center gap-1.5">
                <span className={ `font-bold text-sm ${ isLow ? "text-red-500" : isWarning ? "text-amber-500" : "text-gray-800 dark:text-white" }` }>
                  { item.stock }
                </span>
                { isLow && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/40">
                    <i className="fas fa-exclamation text-red-500 text-[9px]" title="Stock bajo" />
                  </span>
                ) }
              </div>
              <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                <div
                  className={ `h-full rounded-full transition-all ${ isLow ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-500" }` }
                  style={ { width: `${ pct }%` } }
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "price",
        label: "Precio",
        sortable: true,
        render: ( item ) => (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            { formatCurrencyInventory( item.price ) }
          </span>
        ),
      },
      {
        id: "status",
        label: "Estado",
        sortable: true,
        render: ( item ) => <StatusBadge status={ item.status } />,
      },
      {
        id: "actions",
        label: "Acciones",
        sortable: false,
        align: "center",
        render: ( item ) => (
          <div
            className="relative inline-flex justify-center"
            data-action-menu-root="true"
          >
            <button
              type="button"
              onClick={ ( event ) => {
                event.stopPropagation();
                const button = event.currentTarget as HTMLButtonElement;
                const rect = button.getBoundingClientRect();
                const menuWidth = Math.min( 220, Math.max( 180, window.innerWidth - 16 ) );
                const menuHeight = 220;
                const top =
                  rect.bottom + menuHeight > window.innerHeight
                    ? Math.max( 8, rect.top - menuHeight )
                    : rect.bottom + 6;
                const idealLeft = rect.right - menuWidth;
                const maxLeft = Math.max( 8, window.innerWidth - menuWidth - 8 );
                const left = Math.min( Math.max( 8, idealLeft ), maxLeft );
                setActionMenu( ( current ) =>
                  current?.itemId === item.id
                    ? null
                    : { itemId: item.id, top, left, width: menuWidth }
                );
              } }
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/70"
              title="Abrir acciones"
            >
              <span className="text-lg leading-none">⋯</span>
            </button>
          </div>
        ),
      },
    ],
    [ onEdit, onDelete, onChangeStatus, onAddStock, onConsumeStock ]
  );

  // Ordenamiento
  const sortedItems = useMemo( () => {
    if ( !sortField ) return items;

    return [ ...items ].sort( ( a, b ) => {
      const aValue = a[ sortField as keyof InventoryItem ];
      const bValue = b[ sortField as keyof InventoryItem ];

      if ( aValue === undefined || bValue === undefined ) return 0;

      // Comparación básica
      if ( typeof aValue === "string" && typeof bValue === "string" ) {
        return sortDirection === "asc"
          ? aValue.localeCompare( bValue )
          : bValue.localeCompare( aValue );
      } else if ( typeof aValue === "number" && typeof bValue === "number" ) {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    } );
  }, [ items, sortField, sortDirection ] );

  // Paginación
  const paginatedItems = useMemo( () => {
    const startIndex = ( currentPage - 1 ) * itemsPerPage;
    return sortedItems.slice( startIndex, startIndex + itemsPerPage );
  }, [ sortedItems, currentPage, itemsPerPage ] );

  const totalPages = Math.ceil( items.length / itemsPerPage );

  useEffect( () => {
    if ( totalPages === 0 && currentPage !== 1 ) {
      setCurrentPage( 1 );
      return;
    }
    if ( totalPages > 0 && currentPage > totalPages ) {
      setCurrentPage( totalPages );
    }
  }, [ currentPage, totalPages ] );

  // Manejar click en cabecera para ordenar
  const handleSort = ( fieldId: string ) => {
    const column = columns.find( ( col ) => col.id === fieldId );
    if ( !column?.sortable ) return;

    if ( sortField === fieldId ) {
      setSortDirection( ( prev ) => ( prev === "asc" ? "desc" : "asc" ) );
    } else {
      setSortField( fieldId );
      setSortDirection( "asc" );
    }
  };

  if ( loading ) {
    return (
      <div className="flex flex-col items-center justify-center h-52 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
            { columns.map( ( column ) => (
              <th
                key={ column.id }
                scope="col"
                className={ `px-5 py-3.5 text-xs font-semibold uppercase tracking-wider first:rounded-tl-xl last:rounded-tr-xl ${ column.align === "center" ? "text-center" : "text-left" } ${ column.sortable ? "cursor-pointer hover:bg-white/10 transition-colors select-none" : ""
                  }` }
                onClick={ () => handleSort( column.id ) }
              >
                <div className={ `flex items-center gap-1.5 ${ column.align === "center" ? "justify-center" : "" }` }>
                  { column.label }
                  { column.sortable && (
                    <span className="opacity-70">
                      { sortField === column.id ? (
                        <i className={ `fa fa-sort-${ sortDirection === "asc" ? "up" : "down" } text-white` } />
                      ) : (
                        <i className="fa fa-sort text-white/50" />
                      ) }
                    </span>
                  ) }
                </div>
              </th>
            ) ) }
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          { paginatedItems.length > 0 ? (
            paginatedItems.map( ( item, idx ) => (
              <tr
                key={ item.id }
                className={ `group transition-colors duration-100 ${ idx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50/60 dark:bg-gray-800/60"
                  } hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20` }
              >
                { columns.map( ( column ) => (
                  <td
                    key={ `${ item.id }-${ column.id }` }
                    className={ `px-5 py-3.5 ${ column.align === "center" ? "text-center" : "" }` }
                  >
                    { column.render( item ) }
                  </td>
                ) ) }
              </tr>
            ) )
          ) : (
            <tr>
              <td colSpan={ columns.length } className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fas fa-boxes-stacked text-2xl text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-600 dark:text-gray-400">Sin resultados</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No se encontraron elementos en el inventario</p>
                </div>
              </td>
            </tr>
          ) }
        </tbody>
      </table>

      { actionMenu &&
        createPortal(
          <div
            className="fixed z-[120] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden"
            style={ { top: actionMenu.top, left: actionMenu.left, width: actionMenu.width } }
            data-action-menu-root="true"
          >
            { ( () => {
              const menuItem = items.find( ( entry ) => entry.id === actionMenu.itemId );
              if ( !menuItem ) return null;
              return (
                <>
                  <button
                    type="button"
                    onClick={ () => {
                      onAddStock( menuItem.id );
                      setActionMenu( null );
                    } }
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                  >
                    <i className="fas fa-plus mr-2 text-emerald-500" />
                    Añadir stock
                  </button>
                  <button
                    type="button"
                    onClick={ () => {
                      onConsumeStock( menuItem.id );
                      setActionMenu( null );
                    } }
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                  >
                    <i className="fas fa-minus mr-2 text-amber-500" />
                    Consumir stock
                  </button>
                  <button
                    type="button"
                    onClick={ () => {
                      onEdit( menuItem );
                      setActionMenu( null );
                    } }
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                  >
                    <i className="fas fa-pen mr-2 text-indigo-500" />
                    Editar ítem
                  </button>
                  <button
                    type="button"
                    onClick={ () => {
                      onChangeStatus(
                        menuItem.id,
                        menuItem.status === ItemStatus.ACTIVE
                          ? ItemStatus.INACTIVE
                          : ItemStatus.ACTIVE
                      );
                      setActionMenu( null );
                    } }
                    className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                  >
                    <i className="fas fa-power-off mr-2 text-slate-500" />
                    { menuItem.status === ItemStatus.ACTIVE
                      ? "Marcar como inactivo"
                      : "Marcar como activo" }
                  </button>
                  <button
                    type="button"
                    onClick={ () => {
                      onDelete( menuItem.id );
                      setActionMenu( null );
                    } }
                    className="w-full px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    <i className="fas fa-trash mr-2" />
                    Eliminar ítem
                  </button>
                </>
              );
            } )() }
          </div>,
          document.body
        ) }

      {/* Paginación */ }
      { totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando{ " " }
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              { ( currentPage - 1 ) * itemsPerPage + 1 }–{ Math.min( currentPage * itemsPerPage, items.length ) }
            </span>{ " " }
            de{ " " }
            <span className="font-semibold text-gray-700 dark:text-gray-300">{ items.length }</span>{ " " }
            elementos
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={ () => setCurrentPage( ( prev ) => Math.max( prev - 1, 1 ) ) }
              disabled={ currentPage === 1 }
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-left text-xs" />
            </button>

            { Array.from( { length: Math.min( 5, totalPages ) }, ( _, i ) => {
              // Lógica para mostrar páginas alrededor de la actual
              let pageToShow;
              if ( totalPages <= 5 ) {
                pageToShow = i + 1;
              } else if ( currentPage <= 3 ) {
                pageToShow = i + 1;
              } else if ( currentPage >= totalPages - 2 ) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }

              return (
                <button
                  key={ pageToShow }
                  onClick={ () => setCurrentPage( pageToShow ) }
                  className={ `w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${ currentPage === pageToShow
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                    }` }
                >
                  { pageToShow }
                </button>
              );
            } ) }

            <button
              onClick={ () => setCurrentPage( ( prev ) => Math.min( prev + 1, totalPages ) ) }
              disabled={ currentPage === totalPages }
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-right text-xs" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-500 dark:text-gray-400">
              Por página:
            </label>
            <select
              id="itemsPerPage"
              value={ itemsPerPage }
              onChange={ ( e ) => {
                setItemsPerPage( Number( e.target.value ) );
                setCurrentPage( 1 );
              } }
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              { [ 5, 10, 25, 50 ].map( ( value ) => (
                <option key={ value } value={ value }>{ value }</option>
              ) ) }
            </select>
          </div>
        </div>
      ) }
    </div>
  );
};

export default InventoryTable;
