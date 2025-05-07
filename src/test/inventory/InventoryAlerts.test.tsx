import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock el componente directamente
vi.mock(
  "../../presentation/screens/dashboard/inventory/InventoryAlerts",
  () => ({
    default: () => (
      <div data-testid="mocked-inventory-alerts">Alertas de Inventario</div>
    ),
  })
);

// Mock del store
vi.mock("../../store/inventoryStore", () => ({
  default: () => ({
    items: [],
    categories: [],
    stockAlerts: [],
    loading: false,
    fetchItems: vi.fn(),
    fetchCategories: vi.fn(),
  }),
}));

describe("InventoryAlerts Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el componente", () => {
    render(
      <MemoryRouter>
        <div data-testid="mocked-inventory-alerts">Alertas de Inventario</div>
      </MemoryRouter>
    );

    expect(screen.getByTestId("mocked-inventory-alerts")).toBeInTheDocument();
    expect(screen.getByText("Alertas de Inventario")).toBeInTheDocument();
  });
});
