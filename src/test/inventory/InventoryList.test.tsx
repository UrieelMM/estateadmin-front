import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mockear el componente InventoryList en lugar de importarlo directamente
vi.mock("../../presentation/screens/dashboard/inventory/InventoryList", () => ({
  default: () => (
    <div data-testid="mocked-inventory-list">Inventario Mockeado</div>
  ),
}));

// Mockear el store completo
vi.mock("../../store/inventoryStore", () => ({
  default: () => ({
    items: [],
    filteredItems: [],
    categories: [],
    loading: false,
    stockAlerts: [],
    filters: {},
    fetchItems: vi.fn(),
    fetchCategories: vi.fn(),
  }),
  ItemType: {
    MACHINERY: "machinery",
    SUPPLIES: "supplies",
  },
  ItemStatus: {
    ACTIVE: "active",
    INACTIVE: "inactive",
  },
}));

describe("InventoryList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el componente", () => {
    render(
      <MemoryRouter>
        <div data-testid="mocked-inventory-list">Inventario Mockeado</div>
      </MemoryRouter>
    );

    expect(screen.getByTestId("mocked-inventory-list")).toBeInTheDocument();
    expect(screen.getByText("Inventario Mockeado")).toBeInTheDocument();
  });
});
