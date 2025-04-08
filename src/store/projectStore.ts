// src/store/projectStore.ts

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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Enumeración para el estado del proyecto
export enum ProjectStatus {
  IN_PROGRESS = "in_progress",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

// Etiquetas para los cargos del proyecto
export const PROJECT_EXPENSE_TAGS = [
  "labor",              // Mano de obra
  "materials",          // Materiales
  "equipment",          // Equipamiento
  "tools",              // Herramientas
  "transportation",     // Transporte
  "permits",            // Permisos y licencias
  "consulting",         // Consultoría
  "design",             // Diseño
  "maintenance",        // Mantenimiento
  "other",              // Otros
];

/**
 * Tipos de datos para un proyecto
 */
export interface Project {
  id: string;                   // ID del documento en Firestore
  name: string;                 // Nombre del proyecto
  description: string;          // Descripción detallada
  initialBudget: number;        // Presupuesto inicial en centavos
  startDate: string;            // Fecha de inicio
  endDate: string;              // Fecha de término estimada
  status: ProjectStatus;        // Estado actual
  createdAt: string;            // Fecha de creación
  updatedAt: string;            // Fecha de última actualización
  currentBudget?: number;       // Presupuesto actual (restante) en centavos
  completedAt?: string;         // Fecha real de finalización
}

/**
 * Datos para crear un proyecto.
 */
export interface ProjectCreateInput {
  name: string;
  description: string;
  initialBudget: number;        // En pesos, se convertirá a centavos
  startDate: string;            // "YYYY-MM-DD"
  endDate: string;              // "YYYY-MM-DD"
  status: ProjectStatus;
}

/**
 * Tipos de datos para un gasto de proyecto
 */
export interface ProjectExpense {
  id: string;                   // ID del documento en Firestore
  projectId: string;            // ID del proyecto asociado
  folio: string;                // "EA-xxxxxx"
  amount: number;               // Monto del egreso en centavos
  concept: string;              // Concepto
  tags: string[];               // Etiquetas del gasto (mano de obra, materiales, etc.)
  paymentType: string;          // Tipo de pago (efectivo, transferencia, etc.)
  expenseDate: string;          // Fecha del egreso (ej: "2025-06-30 14:00")
  registerDate: string;         // Fecha/hora en que se registra
  invoiceUrl?: string;          // URL o referencia al archivo de factura/recibo
  description?: string;         // Descripción opcional
  financialAccountId: string;   // ID de la cuenta financiera
  providerId?: string;          // ID del proveedor (opcional)
}

/**
 * Datos para crear un gasto de proyecto.
 */
export interface ProjectExpenseCreateInput {
  projectId: string;
  amount: number;               // En pesos, se convertirá a centavos
  concept: string;
  tags: string[];
  paymentType: string;
  expenseDate: string;          // "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File;                  // Comprobante, factura, etc.
  financialAccountId: string;
  providerId?: string;
}

interface ProjectState {
  projects: Project[];
  projectExpenses: ProjectExpense[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  /**
   * fetchProjects: Carga todos los proyectos de un condominio.
   */
  fetchProjects: (condominiumId: string) => Promise<void>;
  
  /**
   * fetchProjectById: Carga un proyecto específico por su ID.
   */
  fetchProjectById: (projectId: string) => Promise<void>;
  
  /**
   * fetchProjectExpenses: Carga todos los gastos asociados a un proyecto.
   */
  fetchProjectExpenses: (projectId: string) => Promise<void>;
  
  /**
   * addProject: Crea un nuevo proyecto.
   */
  addProject: (data: ProjectCreateInput) => Promise<string | null>;
  
  /**
   * updateProject: Actualiza un proyecto existente.
   */
  updateProject: (projectId: string, data: Partial<ProjectCreateInput>) => Promise<void>;
  
  /**
   * deleteProject: Elimina un proyecto.
   */
  deleteProject: (projectId: string) => Promise<void>;
  
  /**
   * addProjectExpense: Crea un nuevo gasto asociado a un proyecto.
   */
  addProjectExpense: (data: ProjectExpenseCreateInput) => Promise<void>;
  
  /**
   * refreshProjects: Actualiza la lista de proyectos.
   */
  refreshProjects: () => Promise<void>;
}

// Función para convertir centavos (enteros) a pesos (float)
function centsToPesos(value: any): number {
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100;
}

// Función para generar un folio único
async function generateUniqueFolio(): Promise<string> {
  const randomNumbers = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `EA-${randomNumbers}`;
}

// Función para calcular el presupuesto actual basado en los gastos
async function calculateCurrentBudget(
  db: any,
  clientId: string,
  condominiumId: string,
  projectId: string,
  initialBudget: number
): Promise<number> {
  try {
    const expensesRef = collection(
      db,
      `clients/${clientId}/condominiums/${condominiumId}/expenses`
    );
    const q = query(expensesRef, where("projectId", "==", projectId));
    const snap = await getDocs(q);
    
    let totalExpenses = 0;
    snap.docs.forEach((doc) => {
      totalExpenses += doc.data().amount || 0;
    });
    
    // El presupuesto actual es el inicial menos los gastos
    return initialBudget - totalExpenses;
  } catch (error) {
    console.error("Error al calcular presupuesto actual:", error);
    return initialBudget;
  }
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  projectExpenses: [],
  currentProject: null,
  loading: false,
  error: null,

  refreshProjects: async () => {
    const condominiumId = localStorage.getItem("condominiumId");
    if (condominiumId) {
      await get().fetchProjects(condominiumId);
    }
  },

  fetchProjects: async (condominiumId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const projectsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects`
      );
      const q = query(projectsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const projects: Project[] = [];
      
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const project: Project = {
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          initialBudget: centsToPesos(data.initialBudget),
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          status: data.status as ProjectStatus || ProjectStatus.IN_PROGRESS,
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
          completedAt: data.completedAt || undefined,
        };
        
        // Calcular presupuesto actual
        const currentBudgetCents = await calculateCurrentBudget(
          db,
          clientId,
          condominiumId,
          docSnap.id,
          data.initialBudget
        );
        project.currentBudget = centsToPesos(currentBudgetCents);
        
        projects.push(project);
      }

      set({ projects, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar proyectos:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar proyectos",
      });
    }
  },

  fetchProjectById: async (projectId: string) => {
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
      const projectRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}`
      );
      
      const docSnap = await getDoc(projectRef);
      
      if (!docSnap.exists()) {
        throw new Error("Proyecto no encontrado");
      }
      
      const data = docSnap.data();
      const project: Project = {
        id: docSnap.id,
        name: data.name || "",
        description: data.description || "",
        initialBudget: centsToPesos(data.initialBudget),
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        status: data.status as ProjectStatus || ProjectStatus.IN_PROGRESS,
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
        completedAt: data.completedAt || undefined,
      };
      
      // Calcular presupuesto actual
      const currentBudgetCents = await calculateCurrentBudget(
        db,
        clientId,
        condominiumId,
        projectId,
        data.initialBudget
      );
      project.currentBudget = centsToPesos(currentBudgetCents);
      
      set({ currentProject: project, loading: false, error: null });
      
      // Cargar los gastos asociados a este proyecto
      await get().fetchProjectExpenses(projectId);
    } catch (error: any) {
      console.error("Error al cargar proyecto:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar proyecto",
      });
    }
  },

  fetchProjectExpenses: async (projectId: string) => {
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
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
      const q = query(expensesRef, where("projectId", "==", projectId), orderBy("expenseDate", "desc"));
      const snap = await getDocs(q);

      const expenses: ProjectExpense[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          projectId: data.projectId || "",
          folio: data.folio || "",
          amount: centsToPesos(data.amount),
          concept: data.concept || "",
          tags: data.tags || [],
          paymentType: data.paymentType || "",
          expenseDate: data.expenseDate || "",
          registerDate: data.registerDate || "",
          invoiceUrl: data.invoiceUrl || undefined,
          description: data.description || "",
          financialAccountId: data.financialAccountId || "",
          providerId: data.providerId || undefined,
        };
      });

      set({ projectExpenses: expenses, loading: false, error: null });
    } catch (error: any) {
      console.error("Error al cargar gastos del proyecto:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar gastos del proyecto",
      });
    }
  },

  addProject: async (data: ProjectCreateInput) => {
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
      const projectsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects`
      );

      // Convertir el monto a centavos (el monto viene en pesos, multiplicamos por 100)
      const initialBudgetCents = Math.round(data.initialBudget * 100);

      const now = new Date().toISOString();
      
      // Crear el documento del proyecto
      const projectData: Project = {
        id: "", // Se llenará con el ID de Firestore
        name: data.name,
        description: data.description,
        initialBudget: initialBudgetCents,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        createdAt: now,
        updatedAt: now,
        currentBudget: initialBudgetCents,
      };

      // Crear documento con ID automático de Firestore
      const newDocRef = createDoc(projectsRef);
      projectData.id = newDocRef.id;

      // Guardar en Firestore
      await setDoc(newDocRef, projectData);

      // Actualizar la lista de proyectos
      await get().refreshProjects();
      
      return newDocRef.id;
    } catch (error: any) {
      console.error("Error al crear proyecto:", error);
      set({ error: error.message || "Error al registrar el proyecto" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProject: async (projectId: string, data: Partial<ProjectCreateInput>) => {
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
      const projectRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}`
      );

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Copiar solo los campos proporcionados
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.initialBudget !== undefined) updateData.initialBudget = Math.round(data.initialBudget * 100);
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === ProjectStatus.COMPLETED) {
          updateData.completedAt = new Date().toISOString();
        }
      }

      // Actualizar en Firestore
      await updateDoc(projectRef, updateData);

      // Actualizar la lista de proyectos
      await get().refreshProjects();
      
      // Si estamos viendo este proyecto actualmente, actualizarlo
      const { currentProject } = get();
      if (currentProject && currentProject.id === projectId) {
        await get().fetchProjectById(projectId);
      }
    } catch (error: any) {
      console.error("Error al actualizar proyecto:", error);
      set({ error: error.message || "Error al actualizar el proyecto" });
    } finally {
      set({ loading: false });
    }
  },

  deleteProject: async (projectId: string) => {
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
      const projectRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}`
      );

      // Primero verificar si hay gastos asociados a este proyecto
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
      const q = query(expensesRef, where("projectId", "==", projectId));
      const snap = await getDocs(q);

      if (snap.docs.length > 0) {
        throw new Error("No se puede eliminar un proyecto con gastos asociados. Elimine primero los gastos.");
      }

      // Eliminar el proyecto
      await deleteDoc(projectRef);

      // Actualizar la lista de proyectos
      await get().refreshProjects();
      
      // Si estábamos viendo este proyecto, limpiar el proyecto actual
      const { currentProject } = get();
      if (currentProject && currentProject.id === projectId) {
        set({ currentProject: null });
      }
    } catch (error: any) {
      console.error("Error al eliminar proyecto:", error);
      set({ error: error.message || "Error al eliminar el proyecto" });
    } finally {
      set({ loading: false });
    }
  },

  addProjectExpense: async (data: ProjectExpenseCreateInput) => {
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
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );

      // Generar folio único
      const folio = await generateUniqueFolio();

      // Convertir el monto a centavos (el monto viene en pesos, multiplicamos por 100)
      const amountCents = Math.round(data.amount * 100);

      // Crear el documento del gasto
      const expenseData: any = {
        projectId: data.projectId,
        folio,
        amount: amountCents,
        concept: data.concept,
        tags: data.tags,
        paymentType: data.paymentType,
        expenseDate: data.expenseDate,
        registerDate: new Date().toISOString(),
        description: data.description || "",
        financialAccountId: data.financialAccountId,
      };

      // Solo agregar providerId si existe
      if (data.providerId) {
        expenseData.providerId = data.providerId;
      }

      // Subir archivo si existe
      let invoiceUrl = "";
      if (data.file) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/expenses/${folio}/${data.file.name}`
        );
        await uploadBytes(fileRef, data.file);
        invoiceUrl = await getDownloadURL(fileRef);
      }

      // Agregar URL del archivo si existe
      if (invoiceUrl) {
        expenseData.invoiceUrl = invoiceUrl;
      }

      // Crear documento con ID automático de Firestore
      const newDocRef = createDoc(expensesRef);
      expenseData.id = newDocRef.id;

      // Guardar en Firestore
      await setDoc(newDocRef, expenseData);

      // Actualizar la lista de gastos del proyecto
      await get().fetchProjectExpenses(data.projectId);
      
      // Actualizar el proyecto actual para reflejar el nuevo presupuesto
      const { currentProject } = get();
      if (currentProject && currentProject.id === data.projectId) {
        await get().fetchProjectById(data.projectId);
      }
    } catch (error: any) {
      console.error("Error al crear gasto del proyecto:", error);
      set({ error: error.message || "Error al registrar el gasto" });
    } finally {
      set({ loading: false });
    }
  },
}));
