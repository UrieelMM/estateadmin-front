import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock completo del store original con sus constantes
vi.mock("../../store/inventoryStore", () => {
  return {
    default: vi.fn(() => mockState),
    ItemStatus: {
      ACTIVE: "active",
      INACTIVE: "inactive",
      MAINTENANCE: "maintenance",
      DISCONTINUED: "discontinued",
    },
    ItemType: {
      MACHINERY: "machinery",
      SUPPLIES: "supplies",
    },
    MovementType: {
      CREATED: "created",
      UPDATED: "updated",
      CONSUMED: "consumed",
      TRANSFERRED: "transferred",
      ADDED: "added",
      REMOVED: "removed",
      MAINTENANCE: "maintenance",
      STATUS_CHANGE: "status_change",
    },
  };
});

// Datos mock para simular el estado de la tienda
const item = {
  id: "1",
  name: "Taladro Eléctrico",
  description:
    "Taladro eléctrico de alta potencia para trabajos de construcción",
  type: "machinery",
  status: "active",
  stock: 10,
  minStock: 3,
  price: 1500,
  category: "1",
  categoryName: "Herramientas",
  location: "Almacén principal",
  serialNumber: "XYZ123",
  model: "DW-123",
  brand: "DeWalt",
  supplier: "Ferretería El Martillo",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "user1",
  updatedBy: "user1",
};

const movement = {
  id: "mov1",
  itemId: "1",
  itemName: "Taladro Eléctrico",
  type: "added",
  quantity: 10,
  createdAt: new Date(),
  createdBy: "user1",
  createdByName: "Admin",
  notes: "Inventario inicial",
};

// Mock de los parámetros de ruta
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => vi.fn(),
  };
});

// Estado mock para nuestros tests
const mockState = {
  items: [item],
  filteredItems: [],
  categories: [
    { id: "1", name: "Herramientas" },
    { id: "2", name: "Materiales" },
  ],
  movements: [movement],
  loading: false,
  loadingMovements: false,
  error: null,
  selectedItem: item,
  filters: {
    search: "",
    lowStock: false,
  },
  stockAlerts: [],
  fetchItems: vi.fn().mockResolvedValue(undefined),
  fetchMovements: vi.fn().mockResolvedValue(undefined),
  addStock: vi.fn().mockResolvedValue(true),
  consumeItem: vi.fn().mockResolvedValue(true),
  updateItem: vi.fn().mockResolvedValue(true),
  changeItemStatus: vi.fn().mockResolvedValue(true),
  setSelectedItem: vi.fn((newItem) => {
    mockState.selectedItem = newItem;
  }),
};

// Ahora importamos el componente después de los mocks
import InventoryItemDetail from "../../presentation/screens/dashboard/inventory/InventoryItemDetail";

describe("InventoryItemDetail Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Aseguramos que el item esté seleccionado al inicio de cada test
    mockState.selectedItem = item;
  });

  it("debe cargar y mostrar los detalles del ítem correctamente", async () => {
    render(
      <MemoryRouter initialEntries={["/inventory/1"]}>
        <Routes>
          <Route path="/inventory/:id" element={<InventoryItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // Verificar que se muestra el título del ítem (como encabezado h1)
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /Taladro Eléctrico/i, level: 1 })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText(/Herramientas/i)).toBeInTheDocument();
    expect(screen.getByText(/Almacén principal/i)).toBeInTheDocument();
    expect(screen.getByText(/DeWalt/i)).toBeInTheDocument();
    expect(screen.getByText(/DW-123/i)).toBeInTheDocument();
  });

  it("debe mostrar los movimientos de inventario del ítem", async () => {
    render(
      <MemoryRouter initialEntries={["/inventory/1"]}>
        <Routes>
          <Route path="/inventory/:id" element={<InventoryItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // Verificar que se muestra la sección de movimientos
    await waitFor(
      () => {
        expect(screen.getByText(/Movimientos recientes/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verificar que se muestra el movimiento
    expect(screen.getByText(/Inventario inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });
});
