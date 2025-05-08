// src/store/projectTaskStore.ts

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
  deleteDoc,
  orderBy,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// Define task status options
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed",
}

// Define task priority options
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Task interface
export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // Nombre del responsable
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  order: number;
  attachments?: string[]; // URLs of images or files
  notes?: string; // Additional notes
}

// Input for creating a new task
export interface ProjectTaskCreateInput {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // Nombre del responsable
  dueDate?: string;
  tags: string[];
  attachments?: string[];
  notes?: string;
}

// Store state interface
interface ProjectTaskState {
  tasks: ProjectTask[];
  loading: boolean;
  error: string | null;

  // Fetch all tasks for a project
  fetchProjectTasks: (projectId: string) => Promise<void>;

  // Add a new task
  addProjectTask: (data: ProjectTaskCreateInput) => Promise<string>;

  // Update an existing task
  updateProjectTask: (
    taskId: string,
    data: Partial<ProjectTaskCreateInput>
  ) => Promise<void>;

  // Delete a task
  deleteProjectTask: (taskId: string) => Promise<void>;

  // Update the status of a task (for drag and drop)
  updateTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
  ) => Promise<void>;

  // Reorder tasks within the same column
  reorderTasks: (
    projectId: string,
    status: TaskStatus,
    reorderedTaskIds: string[]
  ) => Promise<void>;
  
  // Upload attachments for a task
  uploadAttachments: (
    projectId: string, 
    taskId: string, 
    files: File[]
  ) => Promise<string[]>;
  
  // Delete attachment
  deleteAttachment: (
    projectId: string, 
    taskId: string, 
    attachmentUrl: string
  ) => Promise<void>;
}

export const useProjectTaskStore = create<ProjectTaskState>()((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchProjectTasks: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const tasksRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks`
      );

      // Query tasks ordered by status and then by order
      const q = query(tasksRef, orderBy("status"), orderBy("order"));

      const snap = await getDocs(q);

      const tasks: ProjectTask[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assignedTo: data.assignedTo || [],
          dueDate: data.dueDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || [],
          order: data.order || 0,
        };
      });

      set({ tasks, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar tareas:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar tareas",
      });
    }
  },

  addProjectTask: async (data: ProjectTaskCreateInput) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();

      // Get current tasks with the same status to determine order
      const tasksRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${data.projectId}/tasks`
      );

      const statusQuery = query(tasksRef, where("status", "==", data.status));

      const statusSnap = await getDocs(statusQuery);
      const tasksInStatus = statusSnap.docs.length;

      // Create a new task document reference
      const newTaskRef = createDoc(tasksRef);

      const timestamp = new Date().toISOString();

      // Create the task data
      const taskData: Omit<ProjectTask, "id"> = {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo || "",
        dueDate: data.dueDate,
        createdAt: timestamp,
        updatedAt: timestamp,
        tags: data.tags || [],
        order: tasksInStatus, // Place at the end of the column
      };

      // Save the task
      await setDoc(newTaskRef, taskData);

      // Update local state
      await get().fetchProjectTasks(data.projectId);

      set({ loading: false, error: null });
      return newTaskRef.id;
    } catch (error: any) {
      console.error("Error al crear tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al crear la tarea",
      });
      return "";
    }
  },

  updateProjectTask: async (
    taskId: string,
    data: Partial<ProjectTaskCreateInput>
  ) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Find the project ID from the local tasks
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const projectId = task.projectId;

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
      );

      // Update the task
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(taskRef, updateData);

      // Refresh tasks
      await get().fetchProjectTasks(projectId);

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al actualizar tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar la tarea",
      });
    }
  },

  deleteProjectTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Find the project ID from the local tasks
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const projectId = task.projectId;

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
      );

      // Delete the task
      await deleteDoc(taskRef);

      // Refresh tasks
      await get().fetchProjectTasks(projectId);

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al eliminar tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar la tarea",
      });
    }
  },

  updateTaskStatus: async (
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
  ) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Find the task in local state
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");

      const projectId = task.projectId;

      const db = getFirestore();
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
      );

      // Update status and order
      await updateDoc(taskRef, {
        status: newStatus,
        order: newOrder,
        updatedAt: new Date().toISOString(),
      });

      // Refresh tasks
      await get().fetchProjectTasks(projectId);

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al actualizar estado de tarea:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar estado de tarea",
      });
    }
  },

  reorderTasks: async (
    projectId: string,
    _status: TaskStatus,
    reorderedTaskIds: string[]
  ) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();

      // Update each task with its new order
      const updatePromises = reorderedTaskIds.map((taskId, index) => {
        const taskRef = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
        );

        return updateDoc(taskRef, {
          order: index,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(updatePromises);

      // Refresh tasks
      await get().fetchProjectTasks(projectId);

      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al reordenar tareas:", error);
      set({
        loading: false,
        error: error.message || "Error al reordenar tareas",
      });
    }
  },
  
  uploadAttachments: async (projectId: string, taskId: string, files: File[]) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const storage = getStorage();
      const db = getFirestore();
      
      // Prepare the base path for storage
      const basePath = `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}/attachments`;
      
      // Upload all files and collect their download URLs
      const uploadPromises = files.map(async (file) => {
        // Create a unique file name with timestamp and original name
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${basePath}/${fileName}`;
        
        // Upload file to Storage
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, file);
        
        // Get the download URL
        return await getDownloadURL(fileRef);
      });
      
      // Wait for all uploads to complete
      const downloadURLs = await Promise.all(uploadPromises);
      
      // Get current task to append new attachments
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");
      
      // Update task with new attachment URLs
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
      );
      
      // Combine existing attachments with new ones
      const existingAttachments = task.attachments || [];
      const allAttachments = [...existingAttachments, ...downloadURLs];
      
      await updateDoc(taskRef, {
        attachments: allAttachments,
        updatedAt: new Date().toISOString(),
      });
      
      // Refresh tasks
      await get().fetchProjectTasks(projectId);
      
      set({ loading: false, error: null });
      return downloadURLs;
    } catch (error: any) {
      console.error("Error al subir archivos adjuntos:", error);
      set({
        loading: false,
        error: error.message || "Error al subir archivos adjuntos",
      });
      return [];
    }
  },
  
  deleteAttachment: async (projectId: string, taskId: string, attachmentUrl: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const storage = getStorage();
      const db = getFirestore();
      
      // Get the file reference from the URL
      // The URL format is like: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[encodedFilePath]?token=[token]
      const decodedUrl = decodeURIComponent(attachmentUrl);
      const filePathMatch = decodedUrl.match(/o\/([^?]+)/);
      
      if (filePathMatch && filePathMatch[1]) {
        const filePath = filePathMatch[1];
        try {
          // Delete the file from storage
          const fileRef = storageRef(storage, filePath);
          await deleteObject(fileRef);
        } catch (deleteError) {
          console.warn("Error al eliminar archivo de storage, continuando con la eliminación de referencia:", deleteError);
          // Continue even if storage deletion fails (file might be already deleted)
        }
      }
      
      // Get current task to remove the attachment URL
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Tarea no encontrada");
      
      // Filter out the deleted attachment URL
      const updatedAttachments = (task.attachments || []).filter(
        (url) => url !== attachmentUrl
      );
      
      // Update task document
      const taskRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/tasks/${taskId}`
      );
      
      await updateDoc(taskRef, {
        attachments: updatedAttachments,
        updatedAt: new Date().toISOString(),
      });
      
      // Refresh tasks
      await get().fetchProjectTasks(projectId);
      
      set({ loading: false, error: null });
    } catch (error: any) {
      console.error("Error al eliminar archivo adjunto:", error);
      set({
        loading: false,
        error: error.message || "Error al eliminar archivo adjunto",
      });
    }
  },
}));
