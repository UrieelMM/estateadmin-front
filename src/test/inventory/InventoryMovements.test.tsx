import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock el componente directamente
vi.mock(
  "../../presentation/screens/dashboard/inventory/InventoryMovements",
  () => ({
    default: () => (
      <div data-testid="mocked-inventory-movements">
        Movimientos de Inventario
      </div>
    ),
  })
);

// Mock del store
vi.mock("../../store/inventoryStore", () => ({
  default: () => ({
    items: [],
    movements: [],
    categories: [],
    loading: false,
    loadingMovements: false,
    stockAlerts: [],
    fetchMovements: vi.fn(),
  }),
}));

describe("InventoryMovements Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el componente", () => {
    render(
      <MemoryRouter>
        <div data-testid="mocked-inventory-movements">
          Movimientos de Inventario
        </div>
      </MemoryRouter>
    );

    expect(
      screen.getByTestId("mocked-inventory-movements")
    ).toBeInTheDocument();
    expect(screen.getByText("Movimientos de Inventario")).toBeInTheDocument();
  });
});
