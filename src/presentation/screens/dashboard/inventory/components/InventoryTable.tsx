import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { InventoryItem, ItemStatus } from "../../../../../store/inventoryStore";
import TypeBadge from "./TypeBadge";
import StatusBadge from "./StatusBadge";

interface Column {
  id: string;
  label: string;
  sortable: boolean;
  render: (item: InventoryItem) => React.ReactNode;
}

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, status: ItemStatus) => void;
  onAddStock: (id: string) => void;
  onConsumeStock: (id: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onChangeStatus,
  onAddStock,
  onConsumeStock,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Definición de columnas
  const columns: Column[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nombre",
        sortable: true,
        render: (item) => (
          <Link
            to={`/dashboard/inventory/item/${item.id}`}
            className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {item.name}
          </Link>
        ),
      },
      {
        id: "type",
        label: "Tipo",
        sortable: true,
        render: (item) => <TypeBadge type={item.type} />,
      },
      {
        id: "categoryName",
        label: "Categoría",
        sortable: true,
        render: (item) => <span>{item.categoryName}</span>,
      },
      {
        id: "location",
        label: "Ubicación",
        sortable: true,
        render: (item) => <span>{item.location || "-"}</span>,
      },
      {
        id: "stock",
        label: "Stock",
        sortable: true,
        render: (item) => (
          <div className="flex items-center">
            <span
              className={`font-medium ${
                item.stock <= item.minStock
                  ? "text-red-500"
                  : item.stock <= item.minStock * 1.5
                  ? "text-yellow-600 dark:text-yellow-500"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              {item.stock}
            </span>
            {item.stock <= item.minStock && (
              <span className="ml-2 text-red-500">
                <i
                  className="fas fa-exclamation-triangle"
                  title="Stock bajo"
                ></i>
              </span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        label: "Estado",
        sortable: true,
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        id: "actions",
        label: "Acciones",
        sortable: false,
        render: (item) => (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              title="Editar"
            >
              <i className="fas fa-edit"></i>
            </button>

            <button
              onClick={() => onAddStock(item.id)}
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              title="Agregar stock"
            >
              <i className="fas fa-plus-circle"></i>
            </button>

            <button
              onClick={() => onConsumeStock(item.id)}
              className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
              title="Consumir stock"
              disabled={item.stock <= 0}
            >
              <i className="fas fa-minus-circle"></i>
            </button>

            <div className="relative group">
              <button
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                title="Más opciones"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <button
                  onClick={() =>
                    onChangeStatus(
                      item.id,
                      item.status === ItemStatus.ACTIVE
                        ? ItemStatus.INACTIVE
                        : ItemStatus.ACTIVE
                    )
                  }
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                >
                  {item.status === ItemStatus.ACTIVE ? "Desactivar" : "Activar"}
                </button>

                {item.status !== ItemStatus.MAINTENANCE && (
                  <button
                    onClick={() =>
                      onChangeStatus(item.id, ItemStatus.MAINTENANCE)
                    }
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                  >
                    Marcar en mantenimiento
                  </button>
                )}

                <button
                  onClick={() => onDelete(item.id)}
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700 w-full text-left"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onChangeStatus, onAddStock, onConsumeStock]
  );

  // Ordenamiento
  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortField as keyof InventoryItem];
      const bValue = b[sortField as keyof InventoryItem];

      if (aValue === undefined || bValue === undefined) return 0;

      // Comparación básica
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [items, sortField, sortDirection]);

  // Paginación
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Manejar click en cabecera para ordenar
  const handleSort = (fieldId: string) => {
    const column = columns.find((col) => col.id === fieldId);
    if (!column?.sortable) return;

    if (sortField === fieldId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(fieldId);
      setSortDirection("asc");
    }
  };

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="spinner-border text-indigo-500" role="status">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
          </div>
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="px-6 py-3"
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center">
                      {column.label}

                      {column.sortable && (
                        <span className="ml-1">
                          {sortField === column.id ? (
                            <i
                              className={`fa fa-sort-${
                                sortDirection === "asc" ? "up" : "down"
                              }`}
                            ></i>
                          ) : (
                            <i className="fa fa-sort text-gray-400 dark:text-gray-600"></i>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                  >
                    {columns.map((column) => (
                      <td key={`${item.id}-${column.id}`} className="px-6 py-4">
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-gray-600 dark:text-gray-400"
                  >
                    No se encontraron elementos en el inventario
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, items.length)} de{" "}
                {items.length} elementos
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Lógica para mostrar páginas alrededor de la actual
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageToShow}
                      onClick={() => setCurrentPage(pageToShow)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageToShow
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {pageToShow}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="itemsPerPage"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Items por página:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {[5, 10, 25, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryTable;
