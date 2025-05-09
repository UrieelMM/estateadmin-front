import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  setDoc,
  doc as createDoc,
  updateDoc,
  where,
  orderBy,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// Enum para el tipo de planificación
export enum PlanningType {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  BIANNUAL = "biannual",
  ANNUAL = "annual",
}

// Enum para el estado de la planificación
export enum PlanningStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Enum para el estado de la tarea
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Enum para la prioridad de la tarea
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Interfaz para el documento de planificación
export interface Planning {
  id: string; // ID del documento
  title: string; // Título de la planificación
  description: string; // Descripción detallada
  type: PlanningType; // Tipo de planificación (mensual, trimestral, etc.)
  status: PlanningStatus; // Estado actual
  startDate: string; // Fecha de inicio
  endDate: string; // Fecha de fin
  progress: number; // Porcentaje de avance (0-100)
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización
  createdBy: string; // ID del usuario que creó
  assignedTo: string[]; // IDs de usuarios asignados
  tags: string[]; // Etiquetas
  budget?: number; // Presupuesto en centavos (opcional)
}

// Interfaz para las tareas de la planificación
export interface PlanningTask {
  id: string; // ID del documento
  planningId: string; // ID de la planificación a la que pertenece
  title: string; // Título de la tarea
  description: string; // Descripción detallada
  status: TaskStatus; // Estado actual
  priority: TaskPriority; // Prioridad
  startDate: string; // Fecha de inicio
  dueDate: string; // Fecha límite
  completedDate?: string; // Fecha de finalización (opcional)
  assignedTo: string[]; // IDs de usuarios asignados
  progress: number; // Porcentaje de avance (0-100)
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización
  parentTaskId?: string; // ID de la tarea padre (para subtareas)
  order: number; // Orden para mostrar
}

// Interfaz para los documentos de la planificación
export interface PlanningDocument {
  id: string; // ID del documento
  planningId: string; // ID de la planificación a la que pertenece
  taskId?: string; // ID de la tarea a la que pertenece (opcional)
  name: string; // Nombre del documento
  description?: string; // Descripción opcional
  fileUrl: string; // URL del archivo
  fileType: string; // Tipo de archivo (mime type)
  fileSize: number; // Tamaño del archivo en bytes
  uploadedAt: string; // Fecha de subida
  uploadedBy: string; // ID del usuario que subió
}

// Interfaz para los comentarios
export interface PlanningComment {
  id: string; // ID del comentario
  planningId: string; // ID de la planificación
  taskId?: string; // ID de la tarea (opcional)
  text: string; // Texto del comentario
  createdAt: string; // Fecha de creación
  createdBy: string; // ID del usuario que creó
  updatedAt?: string; // Fecha de actualización (si fue editado)
}

// Datos para crear una planificación
export interface PlanningCreateInput {
  title: string;
  description: string;
  type: PlanningType;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  assignedTo: string[];
  tags: string[];
  budget?: number; // En pesos
}

// Datos para crear una tarea
export interface TaskCreateInput {
  planningId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  startDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  assignedTo: string[];
  parentTaskId?: string;
}

// Datos para subir un documento
export interface DocumentUploadInput {
  planningId: string;
  taskId?: string;
  name: string;
  description?: string;
  file: File;
}

// Estado del store
interface PlanningState {
  plannings: Planning[]; // Lista de planificaciones
  currentPlanning: Planning | null; // Planificación actual seleccionada
  tasks: PlanningTask[]; // Tareas de la planificación actual
  documents: PlanningDocument[]; // Documentos de la planificación actual
  comments: PlanningComment[]; // Comentarios de la planificación actual
  loading: boolean; // Indicador de carga
  error: string | null; // Mensaje de error

  // Métodos para planificaciones
  fetchPlannings: () => Promise<void>;
  fetchPlanningById: (planningId: string) => Promise<void>;
  addPlanning: (data: PlanningCreateInput) => Promise<string | null>;
  updatePlanning: (
    planningId: string,
    data: Partial<PlanningCreateInput>
  ) => Promise<void>;
  deletePlanning: (planningId: string) => Promise<void>;
  updatePlanningStatus: (
    planningId: string,
    status: PlanningStatus
  ) => Promise<void>;

  // Métodos para tareas
  fetchTasks: (planningId: string) => Promise<void>;
  addTask: (data: TaskCreateInput) => Promise<string | null>;
  updateTask: (taskId: string, data: Partial<TaskCreateInput>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Métodos para documentos
  fetchDocuments: (planningId: string, taskId?: string) => Promise<void>;
  uploadDocument: (data: DocumentUploadInput) => Promise<string | null>;
  deleteDocument: (documentId: string) => Promise<void>;

  // Métodos para comentarios
  fetchComments: (planningId: string, taskId?: string) => Promise<void>;
  addComment: (
    planningId: string,
    text: string,
    taskId?: string
  ) => Promise<void>;
  updateComment: (commentId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

// Función para convertir centavos a pesos
function centsToPesos(value: any): number {
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

// Función para calcular el progreso de una planificación basado en sus tareas
function calculatePlanningProgress(tasks: PlanningTask[]): number {
  if (!tasks.length) return 0;

  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / tasks.length);
}

export const usePlanningStore = create<PlanningState>()((set, get) => ({
  plannings: [],
  currentPlanning: null,
  tasks: [],
  documents: [],
  comments: [],
  loading: false,
  error: null,

  // Método para cargar todas las planificaciones
  fetchPlannings: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const planningsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning`
      );
      const q = query(planningsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const plannings: Planning[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          type: data.type as PlanningType,
          status: data.status as PlanningStatus,
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          progress: data.progress || 0,
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
          createdBy: data.createdBy || "",
          assignedTo: data.assignedTo || [],
          tags: data.tags || [],
          budget: data.budget ? centsToPesos(data.budget) : undefined,
        };
      });

      set({ plannings, loading: false });
    } catch (error: any) {
      console.error("Error al cargar planificaciones:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar planificaciones",
      });
    }
  },

  // Método para cargar una planificación por ID
  fetchPlanningById: async (planningId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const planningRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}`
      );
      const docSnap = await getDoc(planningRef);

      if (!docSnap.exists()) {
        throw new Error("Planificación no encontrada");
      }

      const data = docSnap.data();
      const planning: Planning = {
        id: docSnap.id,
        title: data.title || "",
        description: data.description || "",
        type: data.type as PlanningType,
        status: data.status as PlanningStatus,
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        progress: data.progress || 0,
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
        createdBy: data.createdBy || "",
        assignedTo: data.assignedTo || [],
        tags: data.tags || [],
        budget: data.budget ? centsToPesos(data.budget) : undefined,
      };

      set({ currentPlanning: planning, loading: false });

      // Cargar las tareas asociadas a esta planificación
      await get().fetchTasks(planningId);

      // Cargar los documentos asociados a esta planificación
      await get().fetchDocuments(planningId);

      // Cargar los comentarios asociados a esta planificación
      await get().fetchComments(planningId);
    } catch (error: any) {
      console.error("Error al cargar planificación:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar planificación",
      });
    }
  },

  // Método para crear una nueva planificación
  addPlanning: async (data: PlanningCreateInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const planningsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning`
      );

      // Convertir el presupuesto a centavos si existe
      const budgetCents = data.budget
        ? Math.round(data.budget * 100)
        : undefined;

      const now = new Date().toISOString();

      // Crear el documento de planificación
      const planningData: any = {
        title: data.title,
        description: data.description,
        type: data.type,
        status: PlanningStatus.DRAFT,
        startDate: data.startDate,
        endDate: data.endDate,
        progress: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        assignedTo: data.assignedTo,
        tags: data.tags,
      };

      // Agregar presupuesto si existe
      if (budgetCents !== undefined) {
        planningData.budget = budgetCents;
      }

      // Crear documento con ID automático
      const newDocRef = createDoc(planningsRef);

      // Guardar en Firestore
      await setDoc(newDocRef, planningData);

      // Actualizar la lista de planificaciones
      await get().fetchPlannings();

      return newDocRef.id;
    } catch (error: any) {
      console.error("Error al crear planificación:", error);
      set({
        loading: false,
        error: error.message || "Error al registrar la planificación",
      });
      return null;
    }
  },

  // Método para actualizar una planificación
  updatePlanning: async (
    planningId: string,
    data: Partial<PlanningCreateInput>
  ) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const planningRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}`
      );

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Copiar solo los campos proporcionados
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.assignedTo !== undefined)
        updateData.assignedTo = data.assignedTo;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.budget !== undefined)
        updateData.budget = Math.round(data.budget * 100);

      // Actualizar en Firestore
      await updateDoc(planningRef, updateData);

      // Actualizar la lista de planificaciones
      await get().fetchPlannings();

      // Si estamos viendo esta planificación actualmente, actualizarla
      const { currentPlanning } = get();
      if (currentPlanning && currentPlanning.id === planningId) {
        await get().fetchPlanningById(planningId);
      }
    } catch (error: any) {
      console.error("Error al actualizar planificación:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar la planificación",
      });
    }
  },

  // Método para eliminar una planificación
  deletePlanning: async (planningId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();

      // Primero eliminar todas las tareas asociadas
      const tasksRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/tasks`
      );
      const tasksSnap = await getDocs(tasksRef);

      for (const taskDoc of tasksSnap.docs) {
        await deleteDoc(taskDoc.ref);
      }

      // Luego eliminar todos los documentos asociados
      const docsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/documents`
      );
      const docsSnap = await getDocs(docsRef);

      // Storage para eliminar archivos
      const storage = getStorage();

      for (const docRef of docsSnap.docs) {
        const docData = docRef.data();

        // Eliminar el archivo de storage si existe
        if (docData.fileUrl) {
          try {
            // Extraer la ruta del storage de la URL
            const fileRef = ref(storage, docData.fileUrl);
            await deleteObject(fileRef);
          } catch (fileError) {
            console.error("Error al eliminar archivo:", fileError);
          }
        }

        // Eliminar el documento
        await deleteDoc(docRef.ref);
      }

      // Eliminar los comentarios
      const commentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/comments`
      );
      const commentsSnap = await getDocs(commentsRef);

      for (const commentDoc of commentsSnap.docs) {
        await deleteDoc(commentDoc.ref);
      }

      // Finalmente eliminar la planificación
      const planningRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}`
      );

      await deleteDoc(planningRef);

      // Actualizar la lista de planificaciones
      await get().fetchPlannings();

      // Si estábamos viendo esta planificación, limpiar la planificación actual
      const { currentPlanning } = get();
      if (currentPlanning && currentPlanning.id === planningId) {
        set({
          currentPlanning: null,
          tasks: [],
          documents: [],
          comments: [],
        });
      }
    } catch (error: any) {
      console.error("Error al eliminar planificación:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar la planificación",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Método para cargar las tareas de una planificación
  fetchTasks: async (planningId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const tasksRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/tasks`
      );
      const q = query(tasksRef, orderBy("order", "asc"));
      const snap = await getDocs(q);

      const tasks: PlanningTask[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          planningId: planningId,
          title: data.title || "",
          description: data.description || "",
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          startDate: data.startDate || "",
          dueDate: data.dueDate || "",
          completedDate: data.completedDate || undefined,
          assignedTo: data.assignedTo || [],
          progress: data.progress || 0,
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
          parentTaskId: data.parentTaskId || undefined,
          order: data.order || 0,
        };
      });

      set({ tasks, loading: false });

      // Actualizar el progreso general de la planificación
      const progress = calculatePlanningProgress(tasks);

      // Si hay un cambio en el progreso, actualizarlo en Firestore
      const { currentPlanning } = get();
      if (currentPlanning && currentPlanning.progress !== progress) {
        const db = getFirestore();
        const planningRef = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}`
        );

        await updateDoc(planningRef, {
          progress,
          updatedAt: new Date().toISOString(),
        });

        // Actualizar currentPlanning con el nuevo progreso
        set({
          currentPlanning: {
            ...currentPlanning,
            progress,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error: any) {
      console.error("Error al cargar tareas:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar tareas",
      });
    }
  },

  // Método para añadir una tarea
  addTask: async (data: TaskCreateInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const tasksRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${data.planningId}/tasks`
      );

      const now = new Date().toISOString();

      // Obtener el máximo orden actual para añadir la tarea al final
      const q = query(
        tasksRef,
        orderBy("order", "desc"),
        where("parentTaskId", "==", data.parentTaskId || null)
      );
      const snap = await getDocs(q);
      const maxOrder = snap.docs.length > 0 ? snap.docs[0].data().order + 1 : 0;

      // Crear el documento de tarea
      const taskData: any = {
        planningId: data.planningId,
        title: data.title,
        description: data.description,
        status: TaskStatus.PENDING,
        priority: data.priority,
        startDate: data.startDate,
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
        progress: 0,
        createdAt: now,
        updatedAt: now,
        order: maxOrder,
      };

      // Agregar parentTaskId si existe
      if (data.parentTaskId) {
        taskData.parentTaskId = data.parentTaskId;
      }

      // Crear documento con ID automático
      const newDocRef = createDoc(tasksRef);

      // Guardar en Firestore
      await setDoc(newDocRef, taskData);

      // Actualizar la lista de tareas
      await get().fetchTasks(data.planningId);

      return newDocRef.id;
    } catch (error: any) {
      console.error("Error al crear tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al registrar la tarea",
      });
      return null;
    }
  },

  // Método para actualizar una tarea
  updateTask: async (taskId: string, data: Partial<TaskCreateInput>) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la planningId de las tareas actuales
      const { tasks } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${task.planningId}/tasks/${taskId}`
      );

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Copiar solo los campos proporcionados
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.assignedTo !== undefined)
        updateData.assignedTo = data.assignedTo;

      // Actualizar en Firestore
      await updateDoc(taskRef, updateData);

      // Actualizar la lista de tareas
      await get().fetchTasks(task.planningId);
    } catch (error: any) {
      console.error("Error al actualizar tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar la tarea",
      });
    }
  },

  // Método para actualizar el estado de una tarea
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la planningId de las tareas actuales
      const { tasks } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${task.planningId}/tasks/${taskId}`
      );

      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      // Si se completa la tarea, actualizar la fecha de finalización y el progreso
      if (status === TaskStatus.COMPLETED) {
        updateData.completedDate = new Date().toISOString();
        updateData.progress = 100;
      } else if (status === TaskStatus.IN_PROGRESS) {
        // Si está en progreso y tenía 0% o 100%, ajustar al 50%
        if (task.progress === 0 || task.progress === 100) {
          updateData.progress = 50;
        }
      } else if (status === TaskStatus.PENDING) {
        // Si vuelve a pendiente, resetear progreso
        updateData.progress = 0;
        updateData.completedDate = null;
      }

      // Actualizar en Firestore
      await updateDoc(taskRef, updateData);

      // Actualizar la lista de tareas
      await get().fetchTasks(task.planningId);
    } catch (error: any) {
      console.error("Error al actualizar estado de tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar el estado de la tarea",
      });
    }
  },

  // Método para actualizar el progreso de una tarea
  updateTaskProgress: async (taskId: string, progress: number) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la planningId de las tareas actuales
      const { tasks } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${task.planningId}/tasks/${taskId}`
      );

      const updateData: any = {
        progress,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar estado basado en progreso
      if (progress === 100 && task.status !== TaskStatus.COMPLETED) {
        updateData.status = TaskStatus.COMPLETED;
        updateData.completedDate = new Date().toISOString();
      } else if (
        progress > 0 &&
        progress < 100 &&
        task.status !== TaskStatus.IN_PROGRESS
      ) {
        updateData.status = TaskStatus.IN_PROGRESS;
      } else if (progress === 0 && task.status !== TaskStatus.PENDING) {
        updateData.status = TaskStatus.PENDING;
        updateData.completedDate = null;
      }

      // Actualizar en Firestore
      await updateDoc(taskRef, updateData);

      // Actualizar la lista de tareas
      await get().fetchTasks(task.planningId);
    } catch (error: any) {
      console.error("Error al actualizar progreso de tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar el progreso de la tarea",
      });
    }
  },

  // Método para eliminar una tarea
  deleteTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la planningId de las tareas actuales
      const { tasks } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const db = getFirestore();

      // Eliminar todas las subtareas primero
      const subTasksToDelete = tasks.filter((t) => t.parentTaskId === taskId);

      for (const subTask of subTasksToDelete) {
        const subTaskRef = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/planning/${task.planningId}/tasks/${subTask.id}`
        );
        await deleteDoc(subTaskRef);
      }

      // Ahora eliminar la tarea principal
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${task.planningId}/tasks/${taskId}`
      );

      await deleteDoc(taskRef);

      // Actualizar la lista de tareas
      await get().fetchTasks(task.planningId);
    } catch (error: any) {
      console.error("Error al eliminar tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar la tarea",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Método para cargar documentos
  fetchDocuments: async (planningId: string, taskId?: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const documentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/documents`
      );

      let q;
      if (taskId) {
        q = query(
          documentsRef,
          where("taskId", "==", taskId),
          orderBy("uploadedAt", "desc")
        );
      } else {
        q = query(documentsRef, orderBy("uploadedAt", "desc"));
      }

      const snap = await getDocs(q);

      const documents: PlanningDocument[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          planningId: planningId,
          taskId: data.taskId || undefined,
          name: data.name || "",
          description: data.description || "",
          fileUrl: data.fileUrl || "",
          fileType: data.fileType || "",
          fileSize: data.fileSize || 0,
          uploadedAt: data.uploadedAt || "",
          uploadedBy: data.uploadedBy || "",
        };
      });

      set({ documents, loading: false });
    } catch (error: any) {
      console.error("Error al cargar documentos:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar documentos",
      });
    }
  },

  // Método para subir un documento
  uploadDocument: async (data: DocumentUploadInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const storage = getStorage();
      const db = getFirestore();

      // Crear ruta en Storage
      let storagePath = `clients/${clientId}/condominiums/${condominiumId}/planning/${data.planningId}`;
      if (data.taskId) {
        storagePath += `/tasks/${data.taskId}`;
      }
      storagePath += `/${data.file.name}`;

      const fileRef = ref(storage, storagePath);

      // Subir archivo
      await uploadBytes(fileRef, data.file);

      // Obtener URL pública
      const fileUrl = await getDownloadURL(fileRef);

      const documentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${data.planningId}/documents`
      );

      const now = new Date().toISOString();

      // Crear documento
      const documentData: any = {
        planningId: data.planningId,
        name: data.name,
        fileUrl: fileUrl,
        fileType: data.file.type,
        fileSize: data.file.size,
        uploadedAt: now,
        uploadedBy: user.uid,
      };

      if (data.taskId) {
        documentData.taskId = data.taskId;
      }

      if (data.description) {
        documentData.description = data.description;
      }

      // Crear documento con ID automático
      const newDocRef = createDoc(documentsRef);

      // Guardar en Firestore
      await setDoc(newDocRef, documentData);

      // Actualizar la lista de documentos
      await get().fetchDocuments(data.planningId, data.taskId);

      return newDocRef.id;
    } catch (error: any) {
      console.error("Error al subir documento:", error);
      set({
        loading: false,
        error: error.message || "Error al subir el documento",
      });
      return null;
    }
  },

  // Método para eliminar un documento
  deleteDocument: async (documentId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la planningId del documento actual
      const { documents } = get();
      const document = documents.find((d) => d.id === documentId);
      if (!document) throw new Error("Documento no encontrado");

      const db = getFirestore();
      const storage = getStorage();

      // Eliminar archivo de Storage
      if (document.fileUrl) {
        try {
          const fileRef = ref(storage, document.fileUrl);
          await deleteObject(fileRef);
        } catch (fileError) {
          console.error("Error al eliminar archivo:", fileError);
        }
      }

      // Eliminar documento de Firestore
      const documentRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${document.planningId}/documents/${documentId}`
      );

      await deleteDoc(documentRef);

      // Actualizar la lista de documentos
      await get().fetchDocuments(document.planningId, document.taskId);
    } catch (error: any) {
      console.error("Error al eliminar documento:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar el documento",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Método para cargar comentarios
  fetchComments: async (planningId: string, taskId?: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const commentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/comments`
      );

      let q;
      if (taskId) {
        q = query(
          commentsRef,
          where("taskId", "==", taskId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(commentsRef, orderBy("createdAt", "desc"));
      }

      const snap = await getDocs(q);

      const comments: PlanningComment[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          planningId: planningId,
          taskId: data.taskId || undefined,
          text: data.text || "",
          createdAt: data.createdAt || "",
          createdBy: data.createdBy || "",
          updatedAt: data.updatedAt || undefined,
        };
      });

      set({ comments, loading: false });
    } catch (error: any) {
      console.error("Error al cargar comentarios:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar comentarios",
      });
    }
  },

  // Método para añadir un comentario
  addComment: async (planningId: string, text: string, taskId?: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const commentsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}/comments`
      );

      const now = new Date().toISOString();

      // Crear documento de comentario
      const commentData: any = {
        planningId: planningId,
        text: text,
        createdAt: now,
        createdBy: user.uid,
      };

      if (taskId) {
        commentData.taskId = taskId;
      }

      // Crear documento con ID automático
      const newDocRef = createDoc(commentsRef);

      // Guardar en Firestore
      await setDoc(newDocRef, commentData);

      // Actualizar la lista de comentarios
      await get().fetchComments(planningId, taskId);
    } catch (error: any) {
      console.error("Error al añadir comentario:", error);
      set({
        loading: false,
        error: error.message || "Error al añadir el comentario",
      });
    }
  },

  // Método para actualizar un comentario
  updateComment: async (commentId: string, text: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la información del comentario
      const { comments } = get();
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) throw new Error("Comentario no encontrado");

      // Verificar que el usuario sea el autor del comentario
      if (comment.createdBy !== user.uid) {
        throw new Error("No tienes permiso para editar este comentario");
      }

      const db = getFirestore();
      const commentRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${comment.planningId}/comments/${commentId}`
      );

      const now = new Date().toISOString();

      // Actualizar el comentario
      await updateDoc(commentRef, {
        text: text,
        updatedAt: now,
      });

      // Actualizar la lista de comentarios
      await get().fetchComments(comment.planningId, comment.taskId);
    } catch (error: any) {
      console.error("Error al actualizar comentario:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar el comentario",
      });
    }
  },

  // Método para eliminar un comentario
  deleteComment: async (commentId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener la información del comentario
      const { comments } = get();
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) throw new Error("Comentario no encontrado");

      // Verificar que el usuario sea el autor del comentario
      if (comment.createdBy !== user.uid) {
        throw new Error("No tienes permiso para eliminar este comentario");
      }

      const db = getFirestore();
      const commentRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${comment.planningId}/comments/${commentId}`
      );

      // Eliminar el comentario
      await deleteDoc(commentRef);

      // Actualizar la lista de comentarios
      await get().fetchComments(comment.planningId, comment.taskId);
    } catch (error: any) {
      console.error("Error al eliminar comentario:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar el comentario",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Método para actualizar el estado de una planificación
  updatePlanningStatus: async (planningId: string, status: PlanningStatus) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const planningRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/planning/${planningId}`
      );

      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar en Firestore
      await updateDoc(planningRef, updateData);

      // Actualizar la lista de planificaciones
      await get().fetchPlannings();

      // Si estamos viendo esta planificación actualmente, actualizarla
      const { currentPlanning } = get();
      if (currentPlanning && currentPlanning.id === planningId) {
        set({
          currentPlanning: {
            ...currentPlanning,
            status,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error: any) {
      console.error("Error al actualizar estado de planificación:", error);
      set({
        loading: false,
        error:
          error.message || "Error al actualizar el estado de la planificación",
      });
    } finally {
      set({ loading: false });
    }
  },
}));
