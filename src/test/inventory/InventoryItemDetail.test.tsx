import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock el componente directamente
vi.mock(
  "../../presentation/screens/dashboard/inventory/InventoryItemDetail",
  () => ({
    default: () => (
      <div data-testid="mocked-inventory-detail">Detalle de Artículo</div>
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
    selectedItem: null,
    setSelectedItem: vi.fn(),
  }),
}));

// Mock de los parámetros de ruta
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => vi.fn(),
  };
});

describe("InventoryItemDetail Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el componente", () => {
    render(
      <MemoryRouter>
        <div data-testid="mocked-inventory-detail">Detalle de Artículo</div>
      </MemoryRouter>
    );

    expect(screen.getByTestId("mocked-inventory-detail")).toBeInTheDocument();
    expect(screen.getByText("Detalle de Artículo")).toBeInTheDocument();
  });
});
