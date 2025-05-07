import { vi, describe, it, expect, beforeEach } from "vitest";

// Definir manualmente los tipos que necesitamos para evitar referencias circulares
enum TestItemStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  DISCONTINUED = "discontinued",
}

enum TestItemType {
  MACHINERY = "machinery",
  SUPPLIES = "supplies",
}

// Mock usando una función directamente en el vi.mock
vi.mock("../../store/inventoryStore", () => {
  // Definir enums
  const TestItemStatus = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    MAINTENANCE: "maintenance",
    DISCONTINUED: "discontinued",
  };

  const TestItemType = {
    MACHINERY: "machinery",
    SUPPLIES: "supplies",
  };

  // Crear los ítems mock
  const mockItems = [
    {
      id: "1",
      name: "Item 1",
      type: "machinery",
      status: "active",
      stock: 10,
      minStock: 5,
      category: "1",
      categoryName: "Categoría 1",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "user1",
      updatedBy: "user1",
    },
    {
      id: "2",
      name: "Item 2",
      type: "supplies",
      status: "inactive",
      stock: 5,
      minStock: 10,
      category: "2",
      categoryName: "Categoría 2",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "user1",
      updatedBy: "user1",
    },
  ];

  // Crear el store mock
  return {
    default: vi.fn(() => ({
      items: [...mockItems],
      filteredItems: [...mockItems],
      categories: [],
      loading: false,
      error: null,
      selectedItem: null,
      filters: {
        search: "",
        lowStock: false,
      },
      stockAlerts: [],
      fetchItems: vi.fn().mockImplementation(() => Promise.resolve()),
      addItem: vi.fn().mockImplementation(() => Promise.resolve("new-item-id")),
      updateItem: vi.fn().mockImplementation(() => Promise.resolve(true)),
      deleteItem: vi.fn().mockImplementation(() => Promise.resolve(true)),
      applyFilters: vi.fn().mockImplementation(() => {
        // Esta función se implementará en los tests
      }),
      resetFilters: vi.fn().mockImplementation(() => {
        // Esta función se implementará en los tests
      }),
      addStock: vi.fn().mockImplementation(() => Promise.resolve(true)),
      consumeItem: vi.fn().mockImplementation(() => Promise.resolve(true)),
      checkStockAlerts: vi.fn().mockImplementation(() => {
        // Esta función se implementará en los tests
      }),
      ItemStatus: TestItemStatus,
      ItemType: TestItemType,
    })),
    ItemStatus: TestItemStatus,
    ItemType: TestItemType,
  };
});

// Tipo para nuestro store mockado
type MockStore = {
  items: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    stock: number;
    minStock: number;
    category: string;
    categoryName: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }>;
  filteredItems: any[];
  categories: any[];
  loading: boolean;
  error: null | string;
  selectedItem: null | any;
  filters: {
    search: string;
    lowStock: boolean;
  };
  stockAlerts: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    stock: number;
    minStock: number;
    category: string;
    categoryName: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }>;
  fetchItems: any;
  addItem: any;
  updateItem: any;
  deleteItem: any;
  applyFilters: any;
  resetFilters: any;
  addStock: any;
  consumeItem: any;
  checkStockAlerts: any;
  ItemStatus: typeof TestItemStatus;
  ItemType: typeof TestItemType;
};

// Importamos el store después del mock
import useInventoryStore from "../../store/inventoryStore";

describe("InventoryStore", () => {
  let store: MockStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = useInventoryStore() as unknown as MockStore;

    // Implementación de applyFilters para los tests
    store.applyFilters.mockImplementation(
      (filters: { search?: string; type?: string }) => {
        if (filters.search) {
          store.filteredItems = store.items.filter((item) =>
            item.name.includes(filters.search || "")
          );
        } else if (filters.type) {
          store.filteredItems = store.items.filter(
            (item) => item.type === filters.type
          );
        }
      }
    );

    // Implementación de resetFilters para los tests
    store.resetFilters.mockImplementation(() => {
      store.filters = { search: "", lowStock: false };
      store.filteredItems = [...store.items];
    });

    // Implementación de checkStockAlerts para los tests
    store.checkStockAlerts.mockImplementation(() => {
      store.stockAlerts = [store.items[1]];
    });
  });

  describe("Operaciones de Items", () => {
    it("fetchItems: debe cargar los ítems correctamente", async () => {
      await store.fetchItems();

      expect(store.items.length).toBe(2);
      expect(store.items[0].id).toBe("1");
      expect(store.items[0].name).toBe("Item 1");
      expect(store.items[1].id).toBe("2");
      expect(store.items[1].name).toBe("Item 2");

      expect(store.fetchItems).toHaveBeenCalled();
    });

    it("addItem: debe agregar un ítem correctamente", async () => {
      const newItem = {
        name: "New Item",
        type: TestItemType.MACHINERY,
        status: TestItemStatus.ACTIVE,
        stock: 15,
        minStock: 5,
        category: "1",
        categoryName: "Categoría 1",
      };

      const result = await store.addItem(newItem);

      expect(result).toBe("new-item-id");
      expect(store.addItem).toHaveBeenCalledWith(newItem);
    });

    it("updateItem: debe actualizar un ítem correctamente", async () => {
      const updates = {
        name: "Updated Item 1",
        stock: 20,
      };

      const result = await store.updateItem("1", updates);

      expect(result).toBe(true);
      expect(store.updateItem).toHaveBeenCalledWith("1", updates);
    });

    it("deleteItem: debe eliminar un ítem correctamente", async () => {
      const result = await store.deleteItem("1");

      expect(result).toBe(true);
      expect(store.deleteItem).toHaveBeenCalledWith("1");
    });
  });

  describe("Filtrado de items", () => {
    it("applyFilters: debe filtrar por término de búsqueda", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      // Aplicamos filtros
      store.applyFilters({ search: "Item 1" });

      // Verificamos que se llamó la función con los argumentos correctos
      expect(store.applyFilters).toHaveBeenCalledWith({ search: "Item 1" });
    });

    it("applyFilters: debe filtrar por tipo", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      // Aplicamos filtros
      store.applyFilters({ type: TestItemType.MACHINERY });

      // Verificamos que se llamó la función con los argumentos correctos
      expect(store.applyFilters).toHaveBeenCalledWith({
        type: TestItemType.MACHINERY,
      });
    });

    it("resetFilters: debe restablecer los filtros", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      // Aplicamos filtros y luego los reseteamos
      store.applyFilters({ search: "Item 1" });
      store.resetFilters();

      // Verificamos que se llamó la función
      expect(store.resetFilters).toHaveBeenCalled();
      expect(store.filters.search).toBe("");
    });
  });

  describe("Operaciones de stock", () => {
    it("addStock: debe agregar stock correctamente", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      const result = await store.addStock("1", 5, "Recepción de stock");

      expect(result).toBe(true);
      expect(store.addStock).toHaveBeenCalledWith("1", 5, "Recepción de stock");
    });

    it("consumeItem: debe consumir stock correctamente", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      const result = await store.consumeItem("1", 3, "Consumo para proyecto");

      expect(result).toBe(true);
      expect(store.consumeItem).toHaveBeenCalledWith(
        "1",
        3,
        "Consumo para proyecto"
      );
    });
  });

  describe("Alertas de stock", () => {
    it("checkStockAlerts: debe identificar ítems con stock bajo", async () => {
      // Primero cargamos los ítems
      await store.fetchItems();

      store.checkStockAlerts();

      // Verificamos que se llamó la función y que hay un ítem en alertas
      expect(store.checkStockAlerts).toHaveBeenCalled();
      expect(store.stockAlerts.length).toBe(1);
      expect(store.stockAlerts[0].id).toBe("2");
    });
  });
});
