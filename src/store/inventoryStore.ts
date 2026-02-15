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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import toast from "react-hot-toast";
import { writeAuditLog } from "../services/auditService";

// Tipos de item
export enum ItemType {
  MACHINERY = "machinery", // Maquinaria (bombas, motos, herramientas eléctricas)
  SUPPLIES = "supplies", // Insumos fungibles (focos, material de limpieza)
  TOOL = "tool", // Herramientas
  MATERIAL = "material", // Materiales
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
  managedByMaintenanceApp?: boolean; // Si puede ser administrado por usuarios de la app de mantenimiento
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Interfaz extendida para permitir archivos File en las imágenes al crear/actualizar
export interface InventoryItemFormData
  extends Omit<
    InventoryItem,
    "images" | "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {
  images?: Array<string | File>;
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
  addItem: (item: InventoryItemFormData) => Promise<string | null>;
  updateItem: (
    id: string,
    updates: Partial<InventoryItemFormData>
  ) => Promise<boolean>;
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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const itemsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
      );

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
      console.error("Error al cargar items:", error);
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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const itemsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
      );

      // Obtener el nombre de la categoría
      const categoriesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );
      const categoryRef = doc(categoriesRef, item.category);
      const categorySnapshot = await getDoc(categoryRef);
      const categoryName = categorySnapshot.exists()
        ? categorySnapshot.data().name
        : "Categoría desconocida";

      const now = new Date();

      // Preparamos el item para Firestore, asegurándonos que no haya valores undefined
      // Asegurándonos de mantener la compatibilidad con la interfaz InventoryItem
      const newItem: Omit<InventoryItem, "id"> = {
        name: item.name || "",
        description: item.description || "",
        type: item.type,
        category: item.category,
        categoryName,
        location: item.location || "",
        status: item.status,
        stock: item.stock || 0,
        minStock: item.minStock || 0,
        price: item.price, // Mantenemos undefined si no existe, para compatibilidad con el tipo
        purchaseDate: item.purchaseDate, // Mantenemos undefined si no existe
        expirationDate: item.expirationDate, // Mantenemos undefined si no existe
        serialNumber: item.serialNumber || "",
        model: item.model || "",
        brand: item.brand || "",
        supplier: item.supplier || "",
        notes: item.notes || "",
        images: [], // Inicializamos con array vacío, luego añadiremos las URLs
        managedByMaintenanceApp: item.managedByMaintenanceApp || false,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        updatedBy: user.uid,
      };

      // Para Firestore, convertimos undefined a null
      const firestoreItem: Record<string, any> = { ...newItem };
      if (firestoreItem.price === undefined) firestoreItem.price = null;
      if (firestoreItem.purchaseDate === undefined)
        firestoreItem.purchaseDate = null;
      if (firestoreItem.expirationDate === undefined)
        firestoreItem.expirationDate = null;

      // Crear el documento primero para obtener el ID
      console.log("Creando documento de inventario...");
      const docRef = await addDoc(itemsRef, firestoreItem);
      const itemId = docRef.id;
      console.log("Item guardado con ID:", itemId);

      // Si hay archivos de imagen, los subimos a Storage
      const imageUrls: string[] = [];
      if (item.images && item.images.length > 0) {
        console.log(`Subiendo ${item.images.length} imágenes al Storage...`);
        const storage = getStorage();

        try {
          // Subir cada imagen y obtener la URL
          const imageUploads = item.images.map(async (imageFile, index) => {
            // Si ya es una URL (string), lo añadimos directamente
            if (typeof imageFile === "string") {
              return imageFile;
            }

            // Si es un archivo, lo subimos
            if (imageFile instanceof File) {
              const basePath = `clients/${clientId}/condominiums/${condominiumId}/inventory_items/${itemId}`;
              const imagePath = `${basePath}/${index}_${Date.now()}_${
                imageFile.name
              }`;
              const imageRef = storageRef(storage, imagePath);

              // Subir el archivo
              await uploadBytes(imageRef, imageFile);

              // Obtener la URL pública
              const downloadUrl = await getDownloadURL(imageRef);
              console.log(`Imagen ${index} subida. URL:`, downloadUrl);
              return downloadUrl;
            }

            return null;
          });

          // Esperar a que todas las imágenes se suban
          const uploadedUrls = await Promise.all(imageUploads);
          // Filtrar posibles valores null y añadir a imageUrls
          imageUrls.push(
            ...(uploadedUrls.filter((url) => url !== null) as string[])
          );
        } catch (error: any) {
          console.error("Error al subir imágenes:", error);

          // Mostrar error específico según el código de error
          if (error.code === "storage/unauthorized") {
            toast.error("No tienes permisos para subir archivos al inventario");
          } else if (error.code === "storage/object-too-large") {
            toast.error(
              "Una o más imágenes son demasiado grandes. El límite es de 15MB"
            );
          } else if (error.code === "storage/retry-limit-exceeded") {
            toast.error("Error de conexión al intentar subir las imágenes");
          } else {
            toast.error(
              `Error al subir imágenes: ${error.message || "Error desconocido"}`
            );
          }

          // Lanzamos el error sin usar toast.error otra vez en el siguiente catch
          set({ error: error.message || "Error desconocido" });
          return null;
        }
      }

      // Actualizar el documento con las URLs de las imágenes
      if (imageUrls.length > 0) {
        console.log("Actualizando documento con URLs de imágenes:", imageUrls);
        const itemRef = doc(itemsRef, itemId);
        await updateDoc(itemRef, {
          images: imageUrls,
        });

        // Actualizar también nuestro objeto newItem
        newItem.images = imageUrls;
      }

      // Creamos el objeto con ID para actualizar el estado
      const addedItem: InventoryItem = {
        ...newItem,
        id: itemId,
      };

      // Registrar movimiento de creación
      await get().addMovement({
        itemId: itemId,
        itemName: item.name,
        type: MovementType.CREATED,
        newQuantity: item.stock,
        newStatus: item.status,
        notes: "Elemento creado en el inventario",
      });

      await writeAuditLog({
        module: "Inventario",
        entityType: "inventory_item",
        entityId: itemId,
        action: "create",
        summary: `Se creó el ítem de inventario ${item.name}`,
        after: {
          name: item.name,
          category: item.category,
          status: item.status,
          stock: item.stock,
          minStock: item.minStock,
        },
      });

      set((state) => ({
        items: [addedItem, ...state.items],
        filteredItems: [addedItem, ...state.filteredItems],
      }));

      // Verificar alertas de stock
      get().checkStockAlerts();

      return itemId;
    } catch (error: any) {
      console.error("Error al añadir item:", error);

      // Verificar si ya se mostró un toast desde el bloque catch interno
      if (error.code && error.code.startsWith("storage/")) {
        // Si es un error de storage, ya se mostró un toast en el catch interno
        set({ error: (error as Error).message });
      } else {
        // Para otros tipos de errores, mostrar toast
        if (!toast.error) {
          set({ error: (error as Error).message });
        } else {
          toast.error(
            `Error al añadir item: ${error.message || "Error desconocido"}`
          );
        }
      }

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
      const itemsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
      );
      const itemRef = doc(itemsRef, id);

      // Obtener el item actual para comparar cambios
      const oldItem = get().items.find((item) => item.id === id);
      if (!oldItem) {
        throw new Error("Item no encontrado");
      }

      // Si se actualiza la categoría, obtener el nuevo nombre
      let categoryName = oldItem.categoryName;
      if (updates.category && updates.category !== oldItem.category) {
        const categoriesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
        );
        const categoryRef = doc(categoriesRef, updates.category);
        const categorySnapshot = await getDoc(categoryRef);
        if (categorySnapshot.exists()) {
          categoryName = categorySnapshot.data().name;
          updates.categoryName = categoryName;
        }
      }

      // Crear una copia de las actualizaciones para trabajar con ella
      const updatedItem: Record<string, any> = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: user.uid,
      };

      // Si hay nuevas imágenes para subir
      if (updates.images && Array.isArray(updates.images)) {
        const imageUrls: string[] = [];

        // Filtrar imágenes que ya son URLs (existentes) y archivos nuevos
        const existingUrls = updates.images.filter(
          (img) => typeof img === "string"
        ) as string[];
        const newImages = updates.images.filter(
          (img) => img instanceof File
        ) as File[];

        // Añadir URLs existentes directamente
        imageUrls.push(...existingUrls);

        // Subir nuevas imágenes si las hay
        if (newImages.length > 0) {
          console.log(`Subiendo ${newImages.length} imágenes nuevas...`);
          const storage = getStorage();

          try {
            const imageUploads = newImages.map(async (imageFile, index) => {
              const basePath = `clients/${clientId}/condominiums/${condominiumId}/inventory_items/${id}`;
              const imagePath = `${basePath}/${index}_${Date.now()}_${
                imageFile.name
              }`;
              const imageRef = storageRef(storage, imagePath);

              // Subir el archivo
              await uploadBytes(imageRef, imageFile);

              // Obtener la URL pública
              return await getDownloadURL(imageRef);
            });

            // Esperar a que todas las imágenes se suban
            const newUrls = await Promise.all(imageUploads);
            imageUrls.push(...newUrls);
          } catch (error: any) {
            console.error("Error al subir imágenes:", error);

            // Mostrar error específico según el código de error
            if (error.code === "storage/unauthorized") {
              toast.error(
                "No tienes permisos para subir archivos al inventario"
              );
            } else if (error.code === "storage/object-too-large") {
              toast.error(
                "Una o más imágenes son demasiado grandes. El límite es de 15MB"
              );
            } else if (error.code === "storage/retry-limit-exceeded") {
              toast.error("Error de conexión al intentar subir las imágenes");
            } else {
              toast.error(
                `Error al subir imágenes: ${
                  error.message || "Error desconocido"
                }`
              );
            }

            // Lanzamos el error sin usar toast.error otra vez en el siguiente catch
            set({ error: error.message || "Error desconocido" });
            return false;
          }
        }

        // Actualizar la propiedad images con todas las URLs
        if (imageUrls.length > 0) {
          updatedItem.images = imageUrls;
        }
      }

      // Eliminar propiedades que no deben ir a Firestore
      delete updatedItem._id; // Por si acaso viene del front

      // Actualizar el documento en Firestore
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

      await writeAuditLog({
        module: "Inventario",
        entityType: "inventory_item",
        entityId: id,
        action: "update",
        summary: `Se actualizó el ítem ${oldItem.name}`,
        before: {
          name: oldItem.name,
          status: oldItem.status,
          stock: oldItem.stock,
          location: oldItem.location || "",
          category: oldItem.category,
        },
        after: {
          name: updatedItem.name || oldItem.name,
          status: updatedItem.status || oldItem.status,
          stock:
            typeof updatedItem.stock === "number"
              ? updatedItem.stock
              : oldItem.stock,
          location:
            typeof updatedItem.location === "string"
              ? updatedItem.location
              : oldItem.location || "",
          category: updatedItem.category || oldItem.category,
        },
      });

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
    } catch (error: any) {
      console.error("Error al actualizar item:", error);

      // Verificar si ya se mostró un toast desde el bloque catch interno
      if (error.code && error.code.startsWith("storage/")) {
        // Si es un error de storage, ya se mostró un toast en el catch interno
        set({ error: (error as Error).message });
      } else {
        // Para otros tipos de errores, mostrar toast
        if (!toast.error) {
          set({ error: (error as Error).message });
        } else {
          toast.error(
            `Error al actualizar item: ${error.message || "Error desconocido"}`
          );
        }
      }

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

      // Verificar si hay movimientos asociados a este ítem
      const movementsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_movements`
      );
      const q = query(movementsRef, where("itemId", "==", id));
      const movementsSnapshot = await getDocs(q);

      const item = get().items.find((item) => item.id === id);
      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Si hay movimientos, solo lo inactivamos
      if (!movementsSnapshot.empty) {
        const itemsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
        );
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

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: id,
          action: "update",
          summary: `Se inactivó el ítem ${item.name} por movimientos asociados`,
          before: { status: item.status },
          after: { status: ItemStatus.INACTIVE },
          metadata: { reason: "has_associated_movements" },
        });
      } else {
        // Si no hay movimientos, eliminamos el ítem
        const itemsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
        );
        const itemRef = doc(itemsRef, id);

        await deleteDoc(itemRef);

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          filteredItems: state.filteredItems.filter((item) => item.id !== id),
        }));

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: id,
          action: "delete",
          summary: `Se eliminó el ítem ${item.name}`,
          before: {
            name: item.name,
            status: item.status,
            stock: item.stock,
            category: item.category,
          },
        });
      }

      // Verificar alertas de stock
      get().checkStockAlerts();

      return true;
    } catch (error: any) {
      console.error("Error al eliminar item:", error);

      // Mostrar notificación amigable al usuario
      if (!toast.error) {
        set({ error: (error as Error).message });
      } else {
        toast.error(
          `Error al eliminar item: ${error.message || "Error desconocido"}`
        );
      }

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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const categoriesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );

      const snapshot = await getDocs(categoriesRef);
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      set({ categories });
    } catch (error) {
      console.error("Error al cargar categorías:", error);
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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const categoriesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );

      console.log(
        "Intentando guardar categoría en:",
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );
      const docRef = await addDoc(categoriesRef, category);
      const addedCategory = { id: docRef.id, ...category };

      set((state) => ({
        categories: [...state.categories, addedCategory],
      }));

      await writeAuditLog({
        module: "Inventario",
        entityType: "inventory_category",
        entityId: docRef.id,
        action: "create",
        summary: `Se creó la categoría ${category.name}`,
        after: {
          name: category.name,
          description: category.description || "",
          parentId: category.parentId || "",
        },
      });

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
      // Corregir la ruta para acceder directamente a categories
      const categoriesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );
      const categoryRef = doc(categoriesRef, id);

      await updateDoc(categoryRef, updates);

      // Si se actualiza el nombre de la categoría, actualizamos todos los items que la usan
      if (updates.name) {
        const oldCategory = get().categories.find((cat) => cat.id === id);
        if (oldCategory && oldCategory.name !== updates.name) {
          const itemsRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
          );
          const q = query(itemsRef, where("category", "==", id));
          const itemsSnapshot = await getDocs(q);

          // Actualizar el nombre de la categoría en cada ítem
          const batch = itemsSnapshot.docs.map(async (itemDoc) => {
            const itemRef = doc(itemsRef, itemDoc.id);
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

      const oldCategory = get().categories.find((category) => category.id === id);
      await writeAuditLog({
        module: "Inventario",
        entityType: "inventory_category",
        entityId: id,
        action: "update",
        summary: `Se actualizó la categoría ${updates.name || oldCategory?.name || id}`,
        before: oldCategory
          ? {
              name: oldCategory.name,
              description: oldCategory.description || "",
              parentId: oldCategory.parentId || "",
            }
          : null,
        after: {
          name: updates.name || oldCategory?.name || "",
          description: updates.description || oldCategory?.description || "",
          parentId: updates.parentId || oldCategory?.parentId || "",
        },
      });

      return true;
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
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
        `clients/${clientId}/condominiums/${condominiumId}/inventory_items`
      );
      const q = query(itemsRef, where("category", "==", id));
      const itemsSnapshot = await getDocs(q);

      if (!itemsSnapshot.empty) {
        throw new Error(
          "No se puede eliminar la categoría porque hay ítems asociados"
        );
      }

      // Corregir la ruta para acceder directamente a categories
      const categoriesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_categories`
      );
      const categoryRef = doc(categoriesRef, id);

      await deleteDoc(categoryRef);

      const categoryToDelete = get().categories.find((category) => category.id === id);

      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
      }));

      await writeAuditLog({
        module: "Inventario",
        entityType: "inventory_category",
        entityId: id,
        action: "delete",
        summary: `Se eliminó la categoría ${categoryToDelete?.name || id}`,
        before: categoryToDelete
          ? {
              name: categoryToDelete.name,
              description: categoryToDelete.description || "",
              parentId: categoryToDelete.parentId || "",
            }
          : null,
      });

      return true;
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const movementsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_movements`
      );

      console.log("Buscando movimientos para itemId:", itemId);

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
      console.log(`Se encontraron ${snapshot.docs.length} movimientos`);

      const movements = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Datos del movimiento:", data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        };
      }) as InventoryMovement[];

      console.log("Movimientos procesados:", movements);
      set({ movements });
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
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
      // Corregimos la estructura para que sea una colección válida (número impar de segmentos)
      const movementsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/inventory_movements`
      );

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
      console.error("Error al añadir movimiento:", error);
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

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: itemId,
          action: "update",
          summary: `Consumo de inventario en ${item.name}`,
          before: {
            stock: item.stock,
            status: item.status,
          },
          after: {
            stock: newStock,
            status: item.status,
          },
          metadata: {
            operation: "consume_item",
            quantity,
            notes: notes || "",
          },
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error al consumir item:", error);

      // Mostrar notificación amigable al usuario
      if (toast.error) {
        toast.error(
          `Error al consumir item: ${error.message || "Error desconocido"}`
        );
      }

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

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: itemId,
          action: "update",
          summary: `Reposición de stock en ${item.name}`,
          before: {
            stock: item.stock,
            status: item.status,
          },
          after: {
            stock: newStock,
            status: item.status,
          },
          metadata: {
            operation: "add_stock",
            quantity,
            notes: notes || "",
          },
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error al añadir stock:", error);

      // Mostrar notificación amigable al usuario
      if (toast.error) {
        toast.error(
          `Error al añadir stock: ${error.message || "Error desconocido"}`
        );
      }

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

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: itemId,
          action: "update",
          summary: `Traslado de ubicación de ${item.name}`,
          before: {
            location: item.location || "",
            status: item.status,
          },
          after: {
            location: newLocation,
            status: item.status,
          },
          metadata: {
            operation: "transfer_item",
            notes: notes || "",
          },
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error al transferir item:", error);

      // Mostrar notificación amigable al usuario
      if (toast.error) {
        toast.error(
          `Error al transferir item: ${error.message || "Error desconocido"}`
        );
      }

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

        await writeAuditLog({
          module: "Inventario",
          entityType: "inventory_item",
          entityId: itemId,
          action: "update",
          summary: `Cambio de estado de ${item.name}`,
          before: {
            status: item.status,
            stock: item.stock,
          },
          after: {
            status: newStatus,
            stock: item.stock,
          },
          metadata: {
            operation: "change_item_status",
            notes: notes || "",
          },
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error al cambiar estado del item:", error);

      // Mostrar notificación amigable al usuario
      if (toast.error) {
        toast.error(
          `Error al cambiar estado: ${error.message || "Error desconocido"}`
        );
      }

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
