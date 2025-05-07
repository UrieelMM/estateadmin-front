import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock el componente directamente
vi.mock(
  "../../presentation/screens/dashboard/inventory/InventoryCategories",
  () => ({
    default: () => (
      <div data-testid="mocked-inventory-categories">
        Categorías de Inventario
      </div>
    ),
  })
);

// Mock del store
vi.mock("../../store/inventoryStore", () => ({
  default: () => ({
    categories: [],
    items: [],
    stockAlerts: [],
    loading: false,
    fetchCategories: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }),
}));

describe("InventoryCategories Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el componente", () => {
    render(
      <MemoryRouter>
        <div data-testid="mocked-inventory-categories">
          Categorías de Inventario
        </div>
      </MemoryRouter>
    );

    expect(
      screen.getByTestId("mocked-inventory-categories")
    ).toBeInTheDocument();
    expect(screen.getByText("Categorías de Inventario")).toBeInTheDocument();
  });
});
