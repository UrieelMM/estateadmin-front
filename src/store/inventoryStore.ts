import { create } from "./createStore";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Tipos de item
export enum ItemType {
  MACHINERY = "machinery", // Maquinaria (bombas, motos, herramientas eléctricas)
  SUPPLIES = "supplies", // Insumos fungibles (focos, material de limpieza)
}

// Estado del item
export enum ItemStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  DISCONTINUED = "discontinued",
}

// Categorías de inventario
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // Para subcategorías
}

// Estructura para los items de inventario
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  category: string; // ID de la categoría
  categoryName: string; // Nombre para mostrar
  location?: string;
  status: ItemStatus;
  stock: number;
  minStock: number; // Para alertas de stock bajo
  price?: number;
  purchaseDate?: Date;
  expirationDate?: Date;
  serialNumber?: string;
  model?: string;
  brand?: string;
  supplier?: string;
  notes?: string;
  images?: string[]; // URLs a imágenes
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Movimientos de inventario (audit log)
export enum MovementType {
  CREATED = "created",
  UPDATED = "updated",
  CONSUMED = "consumed", // Consumo o uso del ítem
  TRANSFERRED = "transferred", // Traslado a otra ubicación
  ADDED = "added", // Agregado al stock
  REMOVED = "removed", // Eliminado del stock
  MAINTENANCE = "maintenance", // Enviado a mantenimiento
  STATUS_CHANGE = "status_change", // Cambio de estado
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity?: number;
  previousQuantity?: number;
  newQuantity?: number;
  previousStatus?: ItemStatus;
  newStatus?: ItemStatus;
  location?: string;
  newLocation?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

// Interfaz para filtros
export interface InventoryFilters {
  search: string;
  type?: ItemType;
  category?: string;
  status?: ItemStatus;
  location?: string;
  lowStock?: boolean; // Items con stock bajo
}

// Store principal de inventario
interface InventoryStore {
  // Estado
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  categories: Category[];
  movements: InventoryMovement[];
  loading: boolean;
  loadingMovements: boolean;
  error: string | null;
  selectedItem: InventoryItem | null;
  filters: InventoryFilters;
  stockAlerts: InventoryItem[];

  // Métodos para items
  fetchItems: () => Promise<void>;
  addItem: (
    item: Omit<
      InventoryItem,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >
  ) => Promise<string | null>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  setSelectedItem: (item: InventoryItem | null) => void;

  // Métodos para categorías
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<string | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Movimientos de inventario
  fetchMovements: (itemId?: string) => Promise<void>;
  addMovement: (
    movement: Omit<
      InventoryMovement,
      "id" | "createdAt" | "createdBy" | "createdByName"
    >
  ) => Promise<boolean>;

  // Operaciones específicas de inventario
  consumeItem: (
    itemId: string,
    quantity: number,
    notes?: string
  ) => Promise<boolean>;
  addStock: (
    itemId: string,
    quantity: number,
    notes?: string
  ) => Promise<boolean>;
  transferItem: (
    itemId: string,
    newLocation: string,
    notes?: string
  ) => Promise<boolean>;
  changeItemStatus: (
    itemId: string,
    newStatus: ItemStatus,
    notes?: string
  ) => Promise<boolean>;

  // Filtrado
  applyFilters: (filters: Partial<InventoryFilters>) => void;
  resetFilters: () => void;

  // Alertas
  checkStockAlerts: () => void;
}

const useInventoryStore = create<InventoryStore>()((set, get) => ({
  items: [],
  filteredItems: [],
  categories: [],
  movements: [],
  loading: false,
  loadingMovements: false,
  error: null,
  selectedItem: null,
  filters: {
    search: "",
    lowStock: false,
  },
  stockAlerts: [],

  // Método para obtener los ítems del inventario
  fetchItems: async () => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const itemsRef = collection(inventoryDoc, "items");

      const q = query(itemsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
      })) as InventoryItem[];

      set({
        items,
        filteredItems: items,
      });

      // Verificar alertas de stock
      get().checkStockAlerts();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  // Método para añadir un ítem al inventario
  addItem: async (item) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const itemsRef = collection(inventoryDoc, "items");

      // Obtener el nombre de la categoría
      const categoriesRef = collection(inventoryDoc, "categories");
      const categoryRef = doc(categoriesRef, item.category);
      const categorySnapshot = await getDoc(categoryRef);
      const categoryName = categorySnapshot.exists()
        ? categorySnapshot.data().name
        : "Categoría desconocida";

      const now = new Date();
      const newItem = {
        ...item,
        categoryName,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        updatedBy: user.uid,
      };

      const docRef = await addDoc(itemsRef, newItem);
      const addedItem = { id: docRef.id, ...newItem };

      // Registrar movimiento de creación
      await get().addMovement({
        itemId: docRef.id,
        itemName: item.name,
        type: MovementType.CREATED,
        newQuantity: item.stock,
        newStatus: item.status,
        notes: "Elemento creado en el inventario",
      });

      set((state) => ({
        items: [addedItem, ...state.items],
        filteredItems: [addedItem, ...state.filteredItems],
      }));

      // Verificar alertas de stock
      get().checkStockAlerts();

      return docRef.id;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // Método para actualizar un ítem del inventario
  updateItem: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const itemsRef = collection(inventoryDoc, "items");
      const itemRef = doc(itemsRef, id);

      // Obtener el item actual para comparar cambios
      const oldItem = get().items.find((item) => item.id === id);
      if (!oldItem) {
        throw new Error("Item no encontrado");
      }

      // Si se actualiza la categoría, obtener el nuevo nombre
      let categoryName = oldItem.categoryName;
      if (updates.category && updates.category !== oldItem.category) {
        const categoriesRef = collection(inventoryDoc, "categories");
        const categoryRef = doc(categoriesRef, updates.category);
        const categorySnapshot = await getDoc(categoryRef);
        if (categorySnapshot.exists()) {
          categoryName = categorySnapshot.data().name;
          updates.categoryName = categoryName;
        }
      }

      const updatedItem = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: user.uid,
      };

      await updateDoc(itemRef, updatedItem);

      // Registrar cambios importantes en el log de movimientos
      if (updates.stock !== undefined && updates.stock !== oldItem.stock) {
        await get().addMovement({
          itemId: id,
          itemName: oldItem.name,
          type: MovementType.UPDATED,
          previousQuantity: oldItem.stock,
          newQuantity: updates.stock,
          notes: "Actualización manual de stock",
        });
      }

      if (updates.status !== undefined && updates.status !== oldItem.status) {
        await get().addMovement({
          itemId: id,
          itemName: oldItem.name,
          type: MovementType.STATUS_CHANGE,
          previousStatus: oldItem.status,
          newStatus: updates.status,
          notes: "Cambio de estado del item",
        });
      }

      if (
        updates.location !== undefined &&
        updates.location !== oldItem.location
      ) {
        await get().addMovement({
          itemId: id,
          itemName: oldItem.name,
          type: MovementType.TRANSFERRED,
          location: oldItem.location,
          newLocation: updates.location,
          notes: "Cambio de ubicación",
        });
      }

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
        filteredItems: state.filteredItems.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
      }));

      // Verificar alertas de stock
      get().checkStockAlerts();

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Método para eliminar un ítem del inventario (o marcarlo como inactivo)
  deleteItem: async (id) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );

      // Verificar si hay movimientos asociados a este ítem
      const movementsRef = collection(inventoryDoc, "movements");
      const q = query(movementsRef, where("itemId", "==", id));
      const movementsSnapshot = await getDocs(q);

      const item = get().items.find((item) => item.id === id);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Si hay movimientos, solo lo inactivamos
      if (!movementsSnapshot.empty) {
        const itemsRef = collection(inventoryDoc, "items");
        const itemRef = doc(itemsRef, id);

        await updateDoc(itemRef, {
          status: ItemStatus.INACTIVE,
          updatedAt: new Date(),
          updatedBy: user.uid,
        });

        // Registrar cambio de estado
        await get().addMovement({
          itemId: id,
          itemName: item.name,
          type: MovementType.STATUS_CHANGE,
          previousStatus: item.status,
          newStatus: ItemStatus.INACTIVE,
          notes:
            "Item inactivado (no puede ser eliminado por tener movimientos asociados)",
        });

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, status: ItemStatus.INACTIVE, updatedAt: new Date() }
              : item
          ),
          filteredItems: state.filteredItems.map((item) =>
            item.id === id
              ? { ...item, status: ItemStatus.INACTIVE, updatedAt: new Date() }
              : item
          ),
        }));
      } else {
        // Si no hay movimientos, eliminamos el ítem
        const itemsRef = collection(inventoryDoc, "items");
        const itemRef = doc(itemsRef, id);

        await deleteDoc(itemRef);

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          filteredItems: state.filteredItems.filter((item) => item.id !== id),
        }));
      }

      // Verificar alertas de stock
      get().checkStockAlerts();

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedItem: (item) => {
    set({ selectedItem: item });
  },

  // Métodos para categorías
  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const categoriesRef = collection(inventoryDoc, "categories");

      const snapshot = await getDocs(categoriesRef);
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      set({ categories });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addCategory: async (category) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const categoriesRef = collection(inventoryDoc, "categories");

      console.log(
        "Intentando guardar categoría en:",
        `clients/${clientId}/condominiums/${condominiumId}/inventory/data/categories`
      );
      const docRef = await addDoc(categoriesRef, category);
      const addedCategory = { id: docRef.id, ...category };

      set((state) => ({
        categories: [...state.categories, addedCategory],
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error en addCategory:", error);
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const categoryRef = doc(collection(inventoryDoc, "categories"), id);

      await updateDoc(categoryRef, updates);

      // Si se actualiza el nombre de la categoría, actualizamos todos los items que la usan
      if (updates.name) {
        const oldCategory = get().categories.find((cat) => cat.id === id);
        if (oldCategory && oldCategory.name !== updates.name) {
          const itemsRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/inventory/items`
          );
          const q = query(itemsRef, where("category", "==", id));
          const itemsSnapshot = await getDocs(q);

          // Actualizar el nombre de la categoría en cada ítem
          const batch = itemsSnapshot.docs.map(async (itemDoc) => {
            const itemRef = doc(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/inventory/items`,
              itemDoc.id
            );
            await updateDoc(itemRef, {
              categoryName: updates.name,
              updatedAt: new Date(),
              updatedBy: user.uid,
            });
          });

          await Promise.all(batch);

          // Actualizar los items en el estado local
          set((state) => ({
            items: state.items.map((item) =>
              item.category === id
                ? {
                    ...item,
                    categoryName: updates.name as string,
                    updatedAt: new Date(),
                  }
                : item
            ),
            filteredItems: state.filteredItems.map((item) =>
              item.category === id
                ? {
                    ...item,
                    categoryName: updates.name as string,
                    updatedAt: new Date(),
                  }
                : item
            ),
          }));
        }
      }

      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, ...updates } : category
        ),
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ loading: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();

      // Verificar si hay ítems usando esta categoría
      const itemsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory/items`
      );
      const q = query(itemsRef, where("category", "==", id));
      const itemsSnapshot = await getDocs(q);

      if (!itemsSnapshot.empty) {
        throw new Error(
          "No se puede eliminar la categoría porque hay ítems asociados"
        );
      }

      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const categoryRef = doc(collection(inventoryDoc, "categories"), id);

      await deleteDoc(categoryRef);

      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Métodos para movimientos
  fetchMovements: async (itemId) => {
    try {
      set({ loadingMovements: true, error: null });
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const movementsRef = collection(inventoryDoc, "movements");

      let q = query(movementsRef, orderBy("createdAt", "desc"));

      // Si se proporciona un ID de ítem, filtramos por ese ítem
      if (itemId) {
        q = query(
          movementsRef,
          where("itemId", "==", itemId),
          orderBy("createdAt", "desc")
        );
      }

      const snapshot = await getDocs(q);
      const movements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as InventoryMovement[];

      set({ movements });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loadingMovements: false });
    }
  },

  addMovement: async (movement) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        throw new Error("Condominio no seleccionado");
      }

      const db = getFirestore();
      // Usamos doc para inventory para que sea un documento y no una colección
      const inventoryDoc = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory`,
        "data"
      );
      const movementsRef = collection(inventoryDoc, "movements");

      // Obtener el nombre del usuario
      const userDisplayName =
        user.displayName || user.email || "Usuario desconocido";

      const newMovement = {
        ...movement,
        createdAt: new Date(),
        createdBy: user.uid,
        createdByName: userDisplayName,
      };

      const docRef = await addDoc(movementsRef, newMovement);
      const addedMovement = { id: docRef.id, ...newMovement };

      set((state) => ({
        movements: [addedMovement, ...state.movements],
      }));

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Operaciones específicas de inventario
  consumeItem: async (itemId, quantity, notes) => {
    try {
      set({ loading: true, error: null });
      const item = get().items.find((item) => item.id === itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Validar que haya suficiente stock
      if (item.stock < quantity) {
        throw new Error("No hay suficiente stock para consumir");
      }

      // Actualizar el stock
      const newStock = item.stock - quantity;
      const updated = await get().updateItem(itemId, { stock: newStock });

      if (updated) {
        // Registrar el movimiento de consumo
        await get().addMovement({
          itemId,
          itemName: item.name,
          type: MovementType.CONSUMED,
          quantity,
          previousQuantity: item.stock,
          newQuantity: newStock,
          notes: notes || `Consumo de ${quantity} unidades`,
        });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  addStock: async (itemId, quantity, notes) => {
    try {
      set({ loading: true, error: null });
      const item = get().items.find((item) => item.id === itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Actualizar el stock
      const newStock = item.stock + quantity;
      const updated = await get().updateItem(itemId, { stock: newStock });

      if (updated) {
        // Registrar el movimiento de adición de stock
        await get().addMovement({
          itemId,
          itemName: item.name,
          type: MovementType.ADDED,
          quantity,
          previousQuantity: item.stock,
          newQuantity: newStock,
          notes: notes || `Adición de ${quantity} unidades al stock`,
        });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  transferItem: async (itemId, newLocation, notes) => {
    try {
      set({ loading: true, error: null });
      const item = get().items.find((item) => item.id === itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Actualizar la ubicación
      const updated = await get().updateItem(itemId, { location: newLocation });

      if (updated) {
        // Registrar el movimiento de traslado
        await get().addMovement({
          itemId,
          itemName: item.name,
          type: MovementType.TRANSFERRED,
          location: item.location,
          newLocation,
          notes: notes || `Traslado a ${newLocation}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  changeItemStatus: async (itemId, newStatus, notes) => {
    try {
      set({ loading: true, error: null });
      const item = get().items.find((item) => item.id === itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Actualizar el estado
      const updated = await get().updateItem(itemId, { status: newStatus });

      if (updated) {
        // Registrar el cambio de estado
        await get().addMovement({
          itemId,
          itemName: item.name,
          type: MovementType.STATUS_CHANGE,
          previousStatus: item.status,
          newStatus,
          notes: notes || `Cambio de estado a ${newStatus}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Filtrado
  applyFilters: (newFilters) => {
    const currentFilters = get().filters;

    // Actualizar los filtros actuales con los nuevos
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
    };

    const { items } = get();
    let filtered = [...items];

    // Aplicar los filtros
    if (updatedFilters.search) {
      const searchTerm = updatedFilters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.categoryName.toLowerCase().includes(searchTerm) ||
          item.location?.toLowerCase().includes(searchTerm)
      );
    }

    if (updatedFilters.type) {
      filtered = filtered.filter((item) => item.type === updatedFilters.type);
    }

    if (updatedFilters.category) {
      filtered = filtered.filter(
        (item) => item.category === updatedFilters.category
      );
    }

    if (updatedFilters.status) {
      filtered = filtered.filter(
        (item) => item.status === updatedFilters.status
      );
    }

    if (updatedFilters.location) {
      filtered = filtered.filter(
        (item) => item.location === updatedFilters.location
      );
    }

    if (updatedFilters.lowStock) {
      filtered = filtered.filter((item) => item.stock <= item.minStock);
    }

    set({
      filters: updatedFilters,
      filteredItems: filtered,
    });
  },

  resetFilters: () => {
    set({
      filters: {
        search: "",
        lowStock: false,
      },
      filteredItems: get().items,
    });
  },

  // Control de alertas
  checkStockAlerts: () => {
    const { items } = get();
    const alerts = items.filter(
      (item) => item.status === ItemStatus.ACTIVE && item.stock <= item.minStock
    );

    set({ stockAlerts: alerts });
  },
}));

export default useInventoryStore;
