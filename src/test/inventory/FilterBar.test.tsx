import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import FilterBar from "../../presentation/screens/dashboard/inventory/components/FilterBar";
import { InventoryFilters } from "../../store/inventoryStore";

// Mock de las categorías
const mockCategories = [
  { id: "1", name: "Categoría 1" },
  { id: "2", name: "Categoría 2" },
];

// Mock de los filtros iniciales
const mockFilters: InventoryFilters = {
  search: "",
  type: undefined,
  category: undefined,
  status: undefined,
  location: undefined,
  lowStock: false,
};

describe("FilterBar Component", () => {
  const mockOnFilterChange = vi.fn();
  const mockOnResetFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente todos los elementos", () => {
    render(
      <FilterBar
        filters={mockFilters}
        categories={mockCategories}
        onFilterChange={mockOnFilterChange}
        onResetFilters={mockOnResetFilters}
        lowStockCount={0}
      />
    );

    // Verificar que los elementos principales estén presentes
    expect(
      screen.getByPlaceholderText("Buscar en inventario...")
    ).toBeInTheDocument();
    expect(screen.getByText("Todos los tipos")).toBeInTheDocument();
    expect(screen.getByText("Todas las categorías")).toBeInTheDocument();
    expect(screen.getByText("Todos los estados")).toBeInTheDocument();
    expect(screen.getByText("Todas las ubicaciones")).toBeInTheDocument();
    expect(screen.getByText("Stock bajo")).toBeInTheDocument();
    expect(screen.getByText("Limpiar filtros")).toBeInTheDocument();
  });

  it("maneja correctamente el reset de filtros", () => {
    render(
      <FilterBar
        filters={mockFilters}
        categories={mockCategories}
        onFilterChange={mockOnFilterChange}
        onResetFilters={mockOnResetFilters}
        lowStockCount={0}
      />
    );

    const resetButton = screen.getByText("Limpiar filtros");
    fireEvent.click(resetButton);

    expect(mockOnResetFilters).toHaveBeenCalled();
  });

  it("muestra el contador de stock bajo cuando es mayor que 0", () => {
    render(
      <FilterBar
        filters={mockFilters}
        categories={mockCategories}
        onFilterChange={mockOnFilterChange}
        onResetFilters={mockOnResetFilters}
        lowStockCount={5}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
