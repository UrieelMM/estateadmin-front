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

// Enumeración para el estado de las cotizaciones
export enum QuoteStatus {
  PENDING = "pending", // Pendiente de revisión
  APPROVED = "approved", // Aprobada pero no seleccionada
  REJECTED = "rejected", // Rechazada
  SELECTED = "selected", // Seleccionada para el proyecto
}

// Etiquetas para los cargos del proyecto
export const PROJECT_EXPENSE_TAGS = [
  "labor", // Mano de obra
  "materials", // Materiales
  "equipment", // Equipamiento
  "tools", // Herramientas
  "transportation", // Transporte
  "permits", // Permisos y licencias
  "consulting", // Consultoría
  "design", // Diseño
  "maintenance", // Mantenimiento
  "other", // Otros
];

/**
 * Tipos de datos para un proyecto
 */
export interface Project {
  id: string; // ID del documento en Firestore
  name: string; // Nombre del proyecto
  description: string; // Descripción detallada
  initialBudget: number; // Presupuesto inicial en centavos
  startDate: string; // Fecha de inicio
  endDate: string; // Fecha de término estimada
  status: ProjectStatus; // Estado actual
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización
  currentBudget?: number; // Presupuesto actual (restante) en centavos
  completedAt?: string; // Fecha real de finalización
}

/**
 * Datos para crear un proyecto.
 */
export interface ProjectCreateInput {
  name: string;
  description: string;
  initialBudget: number; // En pesos, se convertirá a centavos
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  status: ProjectStatus;
}

/**
 * Tipos de datos para un gasto de proyecto
 */
export interface ProjectExpense {
  id: string; // ID del documento en Firestore
  projectId: string; // ID del proyecto asociado
  folio: string; // "EA-xxxxxx"
  amount: number; // Monto del egreso en centavos
  concept: string; // Concepto
  tags: string[]; // Etiquetas del gasto (mano de obra, materiales, etc.)
  paymentType: string; // Tipo de pago (efectivo, transferencia, etc.)
  expenseDate: string; // Fecha del egreso (ej: "2025-06-30 14:00")
  registerDate: string; // Fecha/hora en que se registra
  invoiceUrl?: string; // URL o referencia al archivo de factura/recibo
  description?: string; // Descripción opcional
  financialAccountId: string; // ID de la cuenta financiera
  providerId?: string; // ID del proveedor (opcional)
}

/**
 * Datos para crear un gasto de proyecto.
 */
export interface ProjectExpenseCreateInput {
  projectId: string;
  amount: number; // En pesos, se convertirá a centavos
  concept: string;
  tags: string[];
  paymentType: string;
  expenseDate: string; // "YYYY-MM-DD HH:mm"
  description?: string;
  file?: File; // Comprobante, factura, etc.
  financialAccountId: string;
  providerId?: string;
}

/**
 * Tipos de datos para una cotización de proyecto
 */
export interface ProjectQuote {
  id: string; // ID del documento en Firestore
  projectId: string; // ID del proyecto asociado
  providerName: string; // Nombre del proveedor
  amount: number; // Monto de la cotización en centavos
  description: string; // Descripción detallada
  validUntil: string; // Fecha hasta la que es válida la cotización
  status: QuoteStatus; // Estado de la cotización
  isSelected: boolean; // Indica si esta cotización fue la seleccionada
  contactName?: string; // Nombre del contacto
  contactEmail?: string; // Email del contacto
  contactPhone?: string; // Teléfono del contacto
  notes?: string; // Notas adicionales
  fileUrls?: string[]; // URLs de los archivos adjuntos
  createdAt: string; // Fecha de creación
  concept: string; // Concepto o título de la cotización
  category: string; // Categoría de la cotización (técnico, materiales, herramientas, etc.)
  deliveryDate?: string; // Fecha de entrega estimada
  startDate?: string; // Fecha en que puede iniciar el trabajo
  warranty?: string; // Garantías ofrecidas
  termsAndConditions?: string; // Términos y condiciones especiales
}

/**
 * Datos para crear una cotización de proyecto.
 */
export interface ProjectQuoteCreateInput {
  projectId: string;
  providerName: string;
  amount: number; // En pesos, se convertirá a centavos
  description: string;
  validUntil: string; // "YYYY-MM-DD"
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  files?: File[]; // Archivos adjuntos
  concept: string; // Concepto o título de la cotización
  category: string; // Categoría de la cotización
  deliveryDate?: string; // Fecha de entrega estimada
  startDate?: string; // Fecha en que puede iniciar el trabajo
  warranty?: string; // Garantías ofrecidas
  termsAndConditions?: string; // Términos y condiciones especiales
}

// Categorías predefinidas para cotizaciones
export const QUOTE_CATEGORIES = [
  "tecnico", // Servicios técnicos/mano de obra
  "materiales", // Materiales de construcción
  "herramientas", // Herramientas y equipamiento
  "transporte", // Servicios de transporte
  "consultoria", // Servicios de consultoría/diseño
  "instalacion", // Servicios de instalación
  "otro", // Otros servicios o productos
];

interface ProjectState {
  projects: Project[];
  projectExpenses: ProjectExpense[];
  projectQuotes: ProjectQuote[];
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
  fetchProjectExpenses: (
    projectId: string,
    options?: { silent?: boolean }
  ) => Promise<void>;

  /**
   * fetchProjectQuotes: Carga todas las cotizaciones asociadas a un proyecto.
   */
  fetchProjectQuotes: (
    projectId: string,
    options?: { silent?: boolean }
  ) => Promise<void>;

  /**
   * addProject: Crea un nuevo proyecto.
   */
  addProject: (data: ProjectCreateInput) => Promise<string | null>;

  /**
   * updateProject: Actualiza un proyecto existente.
   */
  updateProject: (
    projectId: string,
    data: Partial<ProjectCreateInput>
  ) => Promise<void>;

  /**
   * deleteProject: Elimina un proyecto.
   */
  deleteProject: (projectId: string) => Promise<void>;

  /**
   * addProjectExpense: Crea un nuevo gasto asociado a un proyecto.
   */
  addProjectExpense: (data: ProjectExpenseCreateInput) => Promise<void>;

  /**
   * addProjectQuote: Añade una nueva cotización al proyecto.
   */
  addProjectQuote: (data: ProjectQuoteCreateInput) => Promise<string | null>;

  /**
   * updateProjectQuote: Actualiza una cotización existente.
   */
  updateProjectQuote: (
    quoteId: string,
    data: Partial<ProjectQuoteCreateInput>
  ) => Promise<void>;

  /**
   * deleteProjectQuote: Elimina una cotización.
   */
  deleteProjectQuote: (quoteId: string) => Promise<void>;

  /**
   * selectProjectQuote: Marca una cotización como seleccionada y rechaza las demás.
   */
  selectProjectQuote: (quoteId: string) => Promise<void>;

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
  projectQuotes: [],
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

      // Cargar gastos una sola vez para evitar consultas N+1 por proyecto
      const expensesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/expenses`
      );
      const expensesSnap = await getDocs(expensesRef);
      const totalExpensesByProject: Record<string, number> = {};
      expensesSnap.docs.forEach((expenseDoc) => {
        const expenseData = expenseDoc.data();
        const projectId = expenseData.projectId;
        const amount =
          typeof expenseData.amount === "number" ? expenseData.amount : 0;
        if (typeof projectId !== "string" || !projectId) return;
        totalExpensesByProject[projectId] =
          (totalExpensesByProject[projectId] || 0) + amount;
      });

      const projects: Project[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const initialBudgetCents =
          typeof data.initialBudget === "number" ? data.initialBudget : 0;
        const projectExpensesCents = totalExpensesByProject[docSnap.id] || 0;

        const project: Project = {
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          initialBudget: centsToPesos(initialBudgetCents),
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          status: (data.status as ProjectStatus) || ProjectStatus.IN_PROGRESS,
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
          completedAt: data.completedAt || undefined,
        };

        const currentBudgetCents = initialBudgetCents - projectExpensesCents;
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
    const { currentProject } = get();
    const isSameProject = currentProject?.id === projectId;
    set({
      loading: true,
      error: null,
      currentProject: isSameProject ? currentProject : null,
      projectExpenses: isSameProject ? get().projectExpenses : [],
      projectQuotes: isSameProject ? get().projectQuotes : [],
    });
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
        status: (data.status as ProjectStatus) || ProjectStatus.IN_PROGRESS,
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

      set({ currentProject: project, error: null });

      // Cargar datos relacionados en modo silencioso para mantener la transición consistente
      await Promise.all([
        get().fetchProjectExpenses(projectId, { silent: true }),
        get().fetchProjectQuotes(projectId, { silent: true }),
      ]);

      set({ loading: false });
    } catch (error: any) {
      console.error("Error al cargar proyecto:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar proyecto",
      });
    }
  },

  fetchProjectExpenses: async (
    projectId: string,
    options?: { silent?: boolean }
  ) => {
    const silent = options?.silent ?? false;
    if (silent) {
      set({ error: null });
    } else {
      set({ loading: true, error: null });
    }
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
      const q = query(
        expensesRef,
        where("projectId", "==", projectId),
        orderBy("expenseDate", "desc")
      );
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

      if (silent) {
        set({ projectExpenses: expenses, error: null });
      } else {
        set({ projectExpenses: expenses, loading: false, error: null });
      }
    } catch (error: any) {
      console.error("Error al cargar gastos del proyecto:", error);
      if (silent) {
        set({ error: error.message || "Error al cargar gastos del proyecto" });
      } else {
        set({
          loading: false,
          error: error.message || "Error al cargar gastos del proyecto",
        });
      }
    }
  },

  fetchProjectQuotes: async (
    projectId: string,
    options?: { silent?: boolean }
  ) => {
    const silent = options?.silent ?? false;
    if (silent) {
      set({ error: null });
    } else {
      set({ loading: true, error: null });
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const quotesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/quotes`
      );
      const q = query(quotesRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const quotes: ProjectQuote[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          projectId: data.projectId || "",
          providerName: data.providerName || "",
          amount: centsToPesos(data.amount),
          description: data.description || "",
          validUntil: data.validUntil || "",
          status: (data.status as QuoteStatus) || QuoteStatus.PENDING,
          isSelected: data.isSelected || false,
          contactName: data.contactName || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          notes: data.notes || "",
          fileUrls: data.fileUrls || [],
          createdAt: data.createdAt || "",
          concept: data.concept || "",
          category: data.category || "otro", // Default a "otro" si no está definido
          deliveryDate: data.deliveryDate || undefined,
          startDate: data.startDate || undefined,
          warranty: data.warranty || undefined,
          termsAndConditions: data.termsAndConditions || undefined,
        };
      });

      if (silent) {
        set({ projectQuotes: quotes, error: null });
      } else {
        set({ projectQuotes: quotes, loading: false, error: null });
      }
    } catch (error: any) {
      console.error("Error al cargar cotizaciones del proyecto:", error);
      if (silent) {
        set({
          error: error.message || "Error al cargar cotizaciones del proyecto",
        });
      } else {
        set({
          loading: false,
          error: error.message || "Error al cargar cotizaciones del proyecto",
        });
      }
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

  updateProject: async (
    projectId: string,
    data: Partial<ProjectCreateInput>
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
      const projectRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}`
      );

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Copiar solo los campos proporcionados
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.initialBudget !== undefined)
        updateData.initialBudget = Math.round(data.initialBudget * 100);
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.status !== undefined) {
        updateData.status = data.status;
        const existingProject =
          get().projects.find((project) => project.id === projectId) ||
          get().currentProject;
        const statusChanged = existingProject?.status !== data.status;

        if (
          statusChanged &&
          (data.status === ProjectStatus.COMPLETED ||
            data.status === ProjectStatus.CANCELLED)
        ) {
          updateData.completedAt = new Date().toISOString();
        } else if (statusChanged && data.status === ProjectStatus.IN_PROGRESS) {
          updateData.completedAt = "";
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
        throw new Error(
          "No se puede eliminar un proyecto con gastos asociados. Elimine primero los gastos."
        );
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

  addProjectQuote: async (data: ProjectQuoteCreateInput) => {
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
      const quotesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${data.projectId}/quotes`
      );

      // Verificar si ya existen 5 cotizaciones para este proyecto y categoría
      const countQuery = query(
        quotesRef,
        where("category", "==", data.category)
      );
      const countSnap = await getDocs(countQuery);

      if (countSnap.size >= 5) {
        throw new Error(
          `Ya se han registrado 5 cotizaciones para la categoría ${data.category}. No se pueden agregar más.`
        );
      }

      // Convertir el monto a centavos (el monto viene en pesos, multiplicamos por 100)
      const amountCents = Math.round(data.amount * 100);

      // Crear el documento de la cotización
      const quoteData: any = {
        projectId: data.projectId,
        providerName: data.providerName,
        amount: amountCents,
        description: data.description,
        validUntil: data.validUntil,
        status: QuoteStatus.PENDING,
        isSelected: false,
        contactName: data.contactName || "",
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        notes: data.notes || "",
        createdAt: new Date().toISOString(),
        concept: data.concept,
        category: data.category,
      };

      // Agregar campos opcionales solo si tienen valor para evitar valores undefined
      if (data.deliveryDate) {
        quoteData.deliveryDate = data.deliveryDate;
      }

      if (data.startDate) {
        quoteData.startDate = data.startDate;
      }

      if (data.warranty) {
        quoteData.warranty = data.warranty;
      }

      if (data.termsAndConditions) {
        quoteData.termsAndConditions = data.termsAndConditions;
      }

      // Procesar y subir archivos si existen
      const fileUrls: string[] = [];

      if (data.files && data.files.length > 0) {
        const storage = getStorage();

        for (const file of data.files) {
          const fileRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/projects/${
              data.projectId
            }/quotes/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          fileUrls.push(downloadUrl);
        }
      }

      // Agregar URLs de los archivos si existen
      if (fileUrls.length > 0) {
        quoteData.fileUrls = fileUrls;
      }

      // Crear documento con ID automático de Firestore
      const newDocRef = createDoc(quotesRef);
      quoteData.id = newDocRef.id;

      // Guardar en Firestore
      await setDoc(newDocRef, quoteData);

      // Actualizar la lista de cotizaciones del proyecto
      await get().fetchProjectQuotes(data.projectId);

      return newDocRef.id;
    } catch (error: any) {
      console.error("Error al crear cotización:", error);
      set({ error: error.message || "Error al registrar la cotización" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProjectQuote: async (
    quoteId: string,
    data: Partial<ProjectQuoteCreateInput>
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

      // Obtener el proyecto ID de las cotizaciones existentes
      const { projectQuotes } = get();
      const quote = projectQuotes.find((q) => q.id === quoteId);

      if (!quote) {
        throw new Error("Cotización no encontrada");
      }

      const projectId = quote.projectId;

      const db = getFirestore();
      const quoteRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/quotes/${quoteId}`
      );

      const updateData: any = {};

      // Copiar solo los campos proporcionados
      if (data.providerName !== undefined)
        updateData.providerName = data.providerName;
      if (data.amount !== undefined)
        updateData.amount = Math.round(data.amount * 100);
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.validUntil !== undefined)
        updateData.validUntil = data.validUntil;
      if (data.contactName !== undefined)
        updateData.contactName = data.contactName || "";
      if (data.contactEmail !== undefined)
        updateData.contactEmail = data.contactEmail || "";
      if (data.contactPhone !== undefined)
        updateData.contactPhone = data.contactPhone || "";
      if (data.notes !== undefined) updateData.notes = data.notes || "";
      if (data.concept !== undefined) updateData.concept = data.concept;
      if (data.category !== undefined) updateData.category = data.category;

      // Manejar campos adicionales, asegurando que no se envíen valores undefined
      if (data.deliveryDate !== undefined) {
        updateData.deliveryDate = data.deliveryDate || "";
      }

      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate || "";
      }

      if (data.warranty !== undefined) {
        updateData.warranty = data.warranty || "";
      }

      if (data.termsAndConditions !== undefined) {
        updateData.termsAndConditions = data.termsAndConditions || "";
      }

      // Procesar y subir nuevos archivos si existen
      if (data.files && data.files.length > 0) {
        const storage = getStorage();
        const fileUrls: string[] = [...(quote.fileUrls || [])];

        for (const file of data.files) {
          const fileRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/quotes/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          fileUrls.push(downloadUrl);
        }

        updateData.fileUrls = fileUrls;
      }

      // Actualizar en Firestore
      await updateDoc(quoteRef, updateData);

      // Actualizar la lista de cotizaciones del proyecto
      await get().fetchProjectQuotes(projectId);
    } catch (error: any) {
      console.error("Error al actualizar cotización:", error);
      set({ error: error.message || "Error al actualizar la cotización" });
    } finally {
      set({ loading: false });
    }
  },

  deleteProjectQuote: async (quoteId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener el proyecto ID de las cotizaciones existentes
      const { projectQuotes } = get();
      const quote = projectQuotes.find((q) => q.id === quoteId);

      if (!quote) {
        throw new Error("Cotización no encontrada");
      }

      const projectId = quote.projectId;

      const db = getFirestore();
      const quoteRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/quotes/${quoteId}`
      );

      // Eliminar la cotización
      await deleteDoc(quoteRef);

      // Actualizar la lista de cotizaciones del proyecto
      await get().fetchProjectQuotes(projectId);
    } catch (error: any) {
      console.error("Error al eliminar cotización:", error);
      set({ error: error.message || "Error al eliminar la cotización" });
    } finally {
      set({ loading: false });
    }
  },

  selectProjectQuote: async (quoteId: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      // Obtener el proyecto ID y la categoría de la cotización seleccionada
      const { projectQuotes } = get();
      const quote = projectQuotes.find((q) => q.id === quoteId);

      if (!quote) {
        throw new Error("Cotización no encontrada");
      }

      const projectId = quote.projectId;
      const category = quote.category;

      const db = getFirestore();

      // Actualizar solo las cotizaciones de la misma categoría
      for (const q of projectQuotes) {
        if (q.projectId === projectId && q.category === category) {
          const qRef = createDoc(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/projects/${projectId}/quotes/${q.id}`
          );

          if (q.id === quoteId) {
            // Esta es la cotización a seleccionar
            await updateDoc(qRef, {
              isSelected: true,
              status: QuoteStatus.SELECTED,
            });
          } else {
            // Las demás de la misma categoría se marcan como no seleccionadas
            // Si ya estaban en estado SELECTED, cambiarlas a APPROVED
            if (q.status === QuoteStatus.SELECTED) {
              await updateDoc(qRef, {
                isSelected: false,
                status: QuoteStatus.APPROVED,
              });
            } else {
              await updateDoc(qRef, {
                isSelected: false,
              });
            }
          }
        }
      }

      // Actualizar la lista de cotizaciones del proyecto
      await get().fetchProjectQuotes(projectId);
    } catch (error: any) {
      console.error("Error al seleccionar cotización:", error);
      set({ error: error.message || "Error al seleccionar la cotización" });
    } finally {
      set({ loading: false });
    }
  },
}));
