// src/store/pettyCashStore.ts

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import moment from "moment";
import "moment/locale/es"; // Importar el locale español
import {
  getFirestore,
  collection,
  query,
  getDocs,
  setDoc,
  doc as createDoc,
  serverTimestamp,
  where,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useExpenseStore } from "./expenseStore";

// Configurar moment.js para usar el idioma español
moment.locale("es");

/**
 * Tipos de transacciones de caja chica
 */
export enum PettyCashTransactionType {
  EXPENSE = "expense", // Gasto
  REPLENISHMENT = "replenishment", // Reposición
  ADJUSTMENT = "adjustment", // Ajuste por Cierre
  INITIAL = "initial", // Saldo inicial
}

/**
 * Categorías de gastos de caja chica
 */
export enum PettyCashCategory {
  OFFICE_SUPPLIES = "office_supplies", // Papelería y artículos de oficina
  CLEANING = "cleaning", // Limpieza
  MAINTENANCE = "maintenance", // Mantenimiento menor
  TRANSPORT = "transport", // Transporte y mensajería
  FOOD = "food", // Alimentos y bebidas
  MISCELLANEOUS = "miscellaneous", // Varios
  OTHER = "other", // Otros gastos
}

/**
 * Estado de Cierre de caja chica
 */
export enum PettyCashAuditStatus {
  PENDING = "pending", // Pendiente de aprobar
  APPROVED = "approved", // Aprobado
  REJECTED = "rejected", // Rechazado
}

/**
 * Estructura para una transacción de caja chica
 */
export interface PettyCashTransaction {
  id: string;
  type: PettyCashTransactionType;
  amount: number; // En centavos
  category?: PettyCashCategory;
  description: string;
  expenseDate: string; // ISO format
  createdAt: string; // ISO format
  receiptUrl?: string;
  providerId?: string;
  provider?: {
    id: string;
    name: string;
  };
  sourceAccountId?: string; // Cuenta origen (reposiciones)
  auditId?: string; // Referencia al Cierre relacionado
  expenseId?: string; // Referencia al egreso registrado (si aplica)
  userId: string; // Usuario que realizó la transacción
  userName: string; // Nombre del usuario
  cashBoxId?: string; // ID de la caja a la que pertenece esta transacción
  previousCashBoxId?: string; // ID de la caja anterior (para transacciones iniciales)
}

/**
 * Estructura para un Cierre de caja chica
 */
export interface PettyCashAudit {
  id: string;
  date: string; // ISO format
  createdAt: string;
  physicalAmount: number; // Efectivo físico contado
  theoreticalAmount: number; // Saldo teórico según el sistema
  difference: number; // Diferencia (físico - teórico)
  notes?: string;
  status: PettyCashAuditStatus;
  userId: string;
  userName: string;
  approvedBy?: string;
  approvedAt?: string;
  adjustmentTransactionId?: string; // ID de la transacción de ajuste (si fue necesario)
  cashBoxPeriod?: string; // Periodo de la caja a la que pertenece el cierre
  cashBoxId?: string; // ID de la caja a la que pertenece el cierre
}

/**
 * Configuración de caja chica
 */
export interface PettyCashConfig {
  id?: string;
  initialAmount: number; // En centavos
  thresholdAmount: number; // En centavos
  accountId: string; // ID de la cuenta contable asociada
  accountName: string; // Nombre de la cuenta contable
  createdAt?: string; // ISO format
  updatedAt?: string; // ISO format
  active: boolean; // Si está activa
  period?: string; // Periodo de la caja (ej: "Enero 2025")
  startDate?: string; // Fecha de inicio del periodo
  endDate?: string; // Fecha de fin del periodo (cuando se finaliza)
  finalBalance?: number; // Saldo final en centavos cuando se cierra
  previousCashBoxId?: string; // Referencia a la caja anterior
  nextCashBoxId?: string; // Referencia a la siguiente caja
  notes?: string; // Notas sobre el cierre del periodo
}

/**
 * Datos para crear una transacción
 */
export interface PettyCashTransactionCreateInput {
  type: PettyCashTransactionType;
  amount: number; // En pesos (será convertido a centavos)
  category?: PettyCashCategory;
  description: string;
  expenseDate: string; // ISO format
  providerId?: string; // ID del proveedor
  sourceAccountId?: string; // ID de cuenta de origen (reposiciones)
  file?: File; // Archivo de comprobante
  auditId?: string;
  cashBoxId?: string; // ID de la caja a la que pertenece
  previousCashBoxId?: string; // ID de la caja anterior (solo para transacciones iniciales)
}

/**
 * Datos para crear un Cierre
 */
export interface PettyCashAuditCreateInput {
  date: string; // ISO format
  physicalAmount: number; // En pesos (será convertido a centavos)
  notes?: string;
}

/**
 * Estado del store de Caja Chica
 */
interface PettyCashState {
  config: PettyCashConfig | null;
  transactions: PettyCashTransaction[];
  audits: PettyCashAudit[];
  currentBalance: number; // Saldo actual en pesos
  loading: boolean;
  error: string | null;

  // Función para cargar la configuración
  fetchConfig: () => Promise<PettyCashConfig | null>;

  // Función para crear la configuración inicial
  setupPettyCash: (data: Partial<PettyCashConfig>) => Promise<void>;

  // Función para actualizar la configuración
  updateConfig: (data: Partial<PettyCashConfig>) => Promise<void>;

  // Función para cargar transacciones
  fetchTransactions: (filter?: {
    startDate?: string;
    endDate?: string;
    type?: PettyCashTransactionType;
  }) => Promise<void>;

  // Función para cargar Cierres
  fetchAudits: (filter?: {
    startDate?: string;
    endDate?: string;
    status?: PettyCashAuditStatus;
  }) => Promise<void>;

  // Función para registrar una transacción
  addTransaction: (data: PettyCashTransactionCreateInput) => Promise<string>;

  // Función para crear un Cierre
  createAudit: (data: PettyCashAuditCreateInput) => Promise<string>;

  // Función para aprobar un Cierre
  approveAudit: (auditId: string, createAdjustment: boolean) => Promise<void>;

  // Función para rechazar un Cierre
  rejectAudit: (auditId: string, reason: string) => Promise<void>;

  // Función para reponer fondos
  replenishFunds: (
    amount: number,
    description: string,
    date: string,
    sourceAccountId?: string
  ) => Promise<void>;

  // Función para calcular el saldo actual
  calculateBalance: () => number;

  // Función para finalizar la caja actual y crear una nueva
  finalizeCashBoxAndCreateNew: (
    periodName: string,
    notes?: string,
    newPeriodName?: string
  ) => Promise<string>;

  // Función para listar las cajas chica históricas
  fetchHistoricalCashBoxes: () => Promise<PettyCashConfig[]>;

  // Función para cargar una caja histórica específica
  loadHistoricalCashBox: (cashBoxId: string) => Promise<void>;
}

// Función para convertir centavos (enteros) a pesos (float)
function centsToPesos(value: number): number {
  return value / 100;
}

// Función para convertir pesos (float) a centavos (enteros)
function pesosToCents(value: number): number {
  return Math.round(value * 100);
}

// Función para generar un folio único
async function generateUniqueId(): Promise<string> {
  const randomNumbers = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `PC-${randomNumbers}`;
}

// Normaliza valores de fecha (Timestamp/Date/string) a ISO
function toIsoDate(value: any): string | undefined {
  if (!value) return undefined;

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date.toISOString()
      : undefined;
  }

  return undefined;
}

function normalizeAccountName(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function resolvePettyCashAccountId(
  clientId: string,
  condominiumId: string,
  configuredAccountId?: string
): Promise<string | null> {
  if (configuredAccountId) return configuredAccountId;

  const db = getFirestore();
  const accountsRef = collection(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
  );
  const accountsSnap = await getDocs(accountsRef);
  for (const accountDoc of accountsSnap.docs) {
    const accountData = accountDoc.data();
    const normalizedName = normalizeAccountName(accountData.name || "");
    if (normalizedName.includes("cajachica")) {
      return accountDoc.id;
    }
  }

  return null;
}

async function adjustFinancialAccountBalance(
  clientId: string,
  condominiumId: string,
  accountId: string,
  deltaAmountPesos: number
): Promise<void> {
  const db = getFirestore();
  const accountRef = createDoc(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/financialAccounts/${accountId}`
  );
  const accountSnap = await getDoc(accountRef);
  if (!accountSnap.exists()) {
    throw new Error("Cuenta financiera no encontrada para ajustar saldo.");
  }

  const accountData = accountSnap.data();
  const currentBalance = Number(accountData.initialBalance || 0);
  const nextBalance = roundTo2(currentBalance + deltaAmountPesos);

  await updateDoc(accountRef, {
    initialBalance: nextBalance,
    updatedAt: serverTimestamp(),
  });
}

// Función para obtener el usuario actual y su token
async function getCurrentUserAndToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const tokenResult = await getIdTokenResult(user);
  const clientId = tokenResult.claims["clientId"] as string;
  if (!clientId) throw new Error("No se encontró clientId en los claims");

  const condominiumId = localStorage.getItem("condominiumId");
  if (!condominiumId) throw new Error("Condominio no seleccionado");

  return { user, clientId, condominiumId };
}

// Implementación del store
export const usePettyCashStore = create<PettyCashState>()((set, get) => ({
  config: null,
  transactions: [],
  audits: [],
  currentBalance: 0,
  loading: false,
  error: null,

  // Cargar la configuración de caja chica
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();
      const configRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig`
      );

      // Buscar la configuración activa
      const q = query(configRef, where("active", "==", true));
      const snap = await getDocs(q);

      if (snap.empty) {
        set({ config: null, loading: false });
        return null;
      }

      const configData = snap.docs[0].data();
      const createdAt = toIsoDate(configData.createdAt) || new Date().toISOString();
      const updatedAt = toIsoDate(configData.updatedAt) || createdAt;
      const startDate = toIsoDate(configData.startDate) || createdAt;
      const endDate = toIsoDate(configData.endDate);
      const config: PettyCashConfig = {
        id: snap.docs[0].id,
        initialAmount: configData.initialAmount,
        thresholdAmount: configData.thresholdAmount,
        accountId: configData.accountId,
        accountName: configData.accountName || "",
        createdAt,
        updatedAt,
        active:
          typeof configData.active === "boolean" ? configData.active : true,
        period: configData.period || "",
        startDate,
        endDate,
        previousCashBoxId: configData.previousCashBoxId,
        nextCashBoxId: configData.nextCashBoxId,
        finalBalance: configData.finalBalance,
        notes: configData.notes,
      };

      set({ config, loading: false });

      // Cargar transacciones para calcular saldo
      await get().fetchTransactions();

      return config;
    } catch (error: any) {
      console.error("Error al cargar configuración de caja chica:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar configuración de caja chica",
      });
      return null;
    }
  },

  // Configurar la caja chica por primera vez
  setupPettyCash: async (data: Partial<PettyCashConfig>) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();

      // Verificar si ya existe configuración
      const existing = await get().fetchConfig();
      if (existing) {
        throw new Error("La caja chica ya está configurada");
      }

      // Preparar el periodo si no se proporciona
      let period = data.period;
      if (!period) {
        const monthYear = moment().format("MMMM YYYY");
        period = `Caja Chica ${
          monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
        }`;
      }

      // Crear la configuración
      const configRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig`
      );

      let resolvedInitialAmount = Number(data.initialAmount || 0);
      if (data.accountId) {
        const accountRef = createDoc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/financialAccounts/${data.accountId}`
        );
        const accountSnap = await getDoc(accountRef);
        if (accountSnap.exists()) {
          const accountData = accountSnap.data();
          const accountInitialBalance = Number(accountData.initialBalance);
          if (Number.isFinite(accountInitialBalance)) {
            resolvedInitialAmount = accountInitialBalance;
          }
        }
      }

      const configData: PettyCashConfig = {
        initialAmount: pesosToCents(resolvedInitialAmount),
        thresholdAmount: pesosToCents(data.thresholdAmount || 0),
        accountId: data.accountId || "",
        accountName: data.accountName || "",
        active: true,
        period: period,
        startDate: data.startDate || new Date().toISOString(),
      };

      const docRef = await addDoc(configRef, {
        ...configData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Crear la transacción inicial
      const transactionsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
      );

      const initialTransaction: PettyCashTransaction = {
        id: await generateUniqueId(),
        type: PettyCashTransactionType.INITIAL,
        amount: configData.initialAmount,
        description: "Saldo inicial de caja chica",
        expenseDate: configData.startDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || "Usuario",
        cashBoxId: docRef.id, // Asignar a la caja recién creada
      };

      await setDoc(createDoc(transactionsRef), initialTransaction);

      // Actualizar estado
      set({
        config: { ...configData, id: docRef.id },
        loading: false,
      });

      // Cargar transacciones
      await get().fetchTransactions();
    } catch (error: any) {
      console.error("Error al configurar caja chica:", error);
      set({
        loading: false,
        error: error.message || "Error al configurar caja chica",
      });
    }
  },

  // Actualizar la configuración de caja chica
  updateConfig: async (data: Partial<PettyCashConfig>) => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();
      const currentConfig = get().config;

      if (!currentConfig || !currentConfig.id) {
        throw new Error("No hay configuración de caja chica para actualizar");
      }

      const db = getFirestore();
      const configDocRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig/${currentConfig.id}`
      );

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (data.thresholdAmount !== undefined) {
        updateData.thresholdAmount = pesosToCents(data.thresholdAmount);
      }

      if (data.accountId !== undefined) {
        updateData.accountId = data.accountId;
      }

      if (data.accountName !== undefined) {
        updateData.accountName = data.accountName;
      }

      if (data.active !== undefined) {
        updateData.active = data.active;
      }

      await updateDoc(configDocRef, updateData);

      // Actualizar estado
      set({
        config: { ...currentConfig, ...data },
        loading: false,
      });
    } catch (error: any) {
      console.error("Error al actualizar configuración:", error);
      set({
        loading: false,
        error: error.message || "Error al actualizar configuración",
      });
    }
  },

  // Cargar transacciones
  fetchTransactions: async (filter) => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();
      const currentConfig = get().config;

      const db = getFirestore();
      const transactionsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
      );

      let q = query(transactionsRef);

      // Aplicar filtro por caja actual si existe configuración
      if (currentConfig && currentConfig.id) {
        // Filtramos por las transacciones de la caja actual o iniciales transferidas de cajas anteriores
        q = query(q, where("cashBoxId", "==", currentConfig.id));
      }

      // Aplicar filtros adicionales si existen
      if (filter) {
        if (filter.startDate && filter.endDate) {
          q = query(
            q,
            where("expenseDate", ">=", filter.startDate),
            where("expenseDate", "<=", filter.endDate)
          );
        }

        if (filter.type) {
          q = query(q, where("type", "==", filter.type));
        }
      }

      const snap = await getDocs(q);

      if (snap.empty) {
        set({ transactions: [], loading: false });
        return;
      }

      const transactions: PettyCashTransaction[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          expenseDate: data.expenseDate,
          createdAt: data.createdAt,
          receiptUrl: data.receiptUrl,
          providerId: data.providerId || data.provider?.id,
          provider: data.provider,
          sourceAccountId: data.sourceAccountId,
          auditId: data.auditId,
          expenseId: data.expenseId,
          userId: data.userId,
          userName: data.userName,
          cashBoxId: data.cashBoxId,
          previousCashBoxId: data.previousCashBoxId,
        };
      });

      // Ordenar por fecha (más reciente primero)
      transactions.sort(
        (a, b) =>
          new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      );

      set({ transactions, loading: false });

      // Calcular saldo actual
      const balance = get().calculateBalance();
      set({ currentBalance: balance });
    } catch (error: any) {
      console.error("Error al cargar transacciones:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar transacciones",
      });
    }
  },

  // Cargar Cierres
  fetchAudits: async (filter) => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();
      const auditsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashAudits`
      );

      let q = query(auditsRef);

      // Aplicar filtros si existen
      if (filter) {
        if (filter.startDate && filter.endDate) {
          q = query(
            q,
            where("date", ">=", filter.startDate),
            where("date", "<=", filter.endDate)
          );
        }

        if (filter.status) {
          q = query(q, where("status", "==", filter.status));
        }
      }

      const snap = await getDocs(q);

      if (snap.empty) {
        set({ audits: [], loading: false });
        return;
      }

      const currentConfig = get().config;
      let audits: PettyCashAudit[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          createdAt: data.createdAt,
          physicalAmount: data.physicalAmount,
          theoreticalAmount: data.theoreticalAmount,
          difference: data.difference,
          notes: data.notes,
          status: data.status,
          userId: data.userId,
          userName: data.userName,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          adjustmentTransactionId: data.adjustmentTransactionId,
          cashBoxPeriod: data.cashBoxPeriod,
          cashBoxId: data.cashBoxId,
        };
      });

      // Filtrar por la caja actual para evitar mezclar cierres de otros periodos.
      if (currentConfig?.id) {
        audits = audits.filter((audit) => {
          if (audit.cashBoxId) return audit.cashBoxId === currentConfig.id;
          if (audit.cashBoxPeriod && currentConfig.period) {
            return audit.cashBoxPeriod === currentConfig.period;
          }
          return false;
        });
      }

      // Ordenar por fecha (más reciente primero)
      audits.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      set({ audits, loading: false });
    } catch (error: any) {
      console.error("Error al cargar Cierres:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar Cierres",
      });
    }
  },

  // Registrar una transacción
  addTransaction: async (data: PettyCashTransactionCreateInput) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      // Validar que exista configuración
      const config = get().config;
      if (!config) {
        throw new Error("La caja chica no está configurada");
      }

      // Si es un gasto, verificar que hay saldo suficiente
      if (data.type === PettyCashTransactionType.EXPENSE) {
        const currentBalance = get().calculateBalance();
        if (data.amount > currentBalance) {
          throw new Error("Saldo insuficiente en caja chica");
        }
      }

      const db = getFirestore();
      const transactionsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
      );

      // Generar ID único
      const transactionId = await generateUniqueId();

      // Subir comprobante si existe
      let receiptUrl = "";
      if (data.file) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/petty-cash/${transactionId}/${data.file.name}`
        );
        await uploadBytes(fileRef, data.file);
        receiptUrl = await getDownloadURL(fileRef);
      }

      // Crear objeto de transacción base sin campos undefined
      const transaction: any = {
        id: transactionId,
        type: data.type,
        amount: pesosToCents(data.amount),
        description: data.description,
        expenseDate: data.expenseDate,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || "Usuario",
        cashBoxId: config.id, // Asignar el ID de la caja actual
      };

      // Añadir campos opcionales solo si tienen valor definido
      if (data.category !== undefined) {
        transaction.category = data.category;
      }

      if (receiptUrl) {
        transaction.receiptUrl = receiptUrl;
      }

      if (data.providerId) {
        transaction.providerId = data.providerId;
      }

      if (data.sourceAccountId) {
        transaction.sourceAccountId = data.sourceAccountId;
      }

      if (data.auditId) {
        transaction.auditId = data.auditId;
      }

      let createdExpenseId: string | undefined;
      let originalWriteError: any;

      // Si es un gasto, creamos primero el egreso para evitar transacciones
      // huérfanas en caja chica cuando falla el registro contable.
      if (data.type === PettyCashTransactionType.EXPENSE) {
        const expenseStore = useExpenseStore.getState();
        const categoryMap: Record<string, string> = {
          [PettyCashCategory.OFFICE_SUPPLIES]: "Papelería",
          [PettyCashCategory.CLEANING]: "Limpieza",
          [PettyCashCategory.TRANSPORT]: "Mensajería y Transporte",
          [PettyCashCategory.FOOD]: "Alimentos",
          [PettyCashCategory.MISCELLANEOUS]: "Varios",
        };

        const conceptName =
          data.category && categoryMap[data.category]
            ? categoryMap[data.category]
            : data.category || "Gasto de caja chica";

        const expenseData: any = {
          amount: data.amount,
          concept: conceptName,
          paymentType: "Efectivo",
          expenseDate: data.expenseDate,
          description: `Gasto de caja chica: ${data.description}`,
          financialAccountId: config.accountId,
          providerId: data.providerId,
        };

        if (data.file) {
          expenseData.file = data.file;
        }

        createdExpenseId = await expenseStore.addExpense(expenseData);
        transaction.expenseId = createdExpenseId;
      }

      // Añadir el ID de la caja anterior si se proporciona (solo para transacciones iniciales)
      if (data.previousCashBoxId) {
        transaction.previousCashBoxId = data.previousCashBoxId;
      }

      let createdTransactionRef: ReturnType<typeof createDoc> | null = null;

      // Guardar en Firestore
      try {
        const docRef = createDoc(transactionsRef);
        await setDoc(docRef, transaction);
        createdTransactionRef = docRef;
      } catch (writeError: any) {
        originalWriteError = writeError;

        // Compensación: si ya se creó egreso pero falló transacción de caja.
        if (createdExpenseId) {
          try {
            const expenseRef = createDoc(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/expenses/${createdExpenseId}`
            );
            await deleteDoc(expenseRef);
          } catch (rollbackError: any) {
            console.error(
              "No se pudo revertir el egreso tras fallo de transacción de caja chica:",
              rollbackError
            );
          }
        }

        throw originalWriteError;
      }

      // Ajustar saldos de cuentas financieras cuando aplica (sin tocar cálculos globales).
      // - Gasto: resta en cuenta de caja chica.
      // - Reposición: suma en caja chica y, si existe cuenta origen, resta en cuenta origen.
      try {
        const resolvedPettyCashAccountId = await resolvePettyCashAccountId(
          clientId,
          condominiumId,
          config.accountId
        );
        const movementAmount = Number(data.amount || 0);

        if (
          movementAmount > 0 &&
          data.type === PettyCashTransactionType.EXPENSE &&
          resolvedPettyCashAccountId
        ) {
          await adjustFinancialAccountBalance(
            clientId,
            condominiumId,
            resolvedPettyCashAccountId,
            -movementAmount
          );
        }

        if (movementAmount > 0 && data.type === PettyCashTransactionType.REPLENISHMENT) {
          if (resolvedPettyCashAccountId) {
            await adjustFinancialAccountBalance(
              clientId,
              condominiumId,
              resolvedPettyCashAccountId,
              movementAmount
            );
          }

          if (data.sourceAccountId) {
            await adjustFinancialAccountBalance(
              clientId,
              condominiumId,
              data.sourceAccountId,
              -movementAmount
            );
          }
        }
      } catch (accountBalanceError: any) {
        // Compensación: revertir transacción/egreso si falla ajuste de saldos.
        if (createdTransactionRef) {
          try {
            await deleteDoc(createdTransactionRef);
          } catch (rollbackTransactionError) {
            console.error(
              "No se pudo revertir transacción de caja chica tras fallo de saldo:",
              rollbackTransactionError
            );
          }
        }

        if (createdExpenseId) {
          try {
            const expenseRef = createDoc(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/expenses/${createdExpenseId}`
            );
            await deleteDoc(expenseRef);
          } catch (rollbackExpenseError) {
            console.error(
              "No se pudo revertir egreso tras fallo de ajuste de saldo:",
              rollbackExpenseError
            );
          }
        }

        throw accountBalanceError;
      }

      // Actualizar estado
      await get().fetchTransactions();

      return transactionId;
    } catch (error: any) {
      console.error("Error al registrar transacción:", error);
      set({
        loading: false,
        error: error.message || "Error al registrar transacción",
      });
      throw error;
    }
  },

  // Crear un Cierre
  createAudit: async (data: PettyCashAuditCreateInput) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      // Calcular el saldo teórico
      const theoreticalAmount = get().calculateBalance();

      // Convertir el monto físico a centavos
      const physicalAmountCents = pesosToCents(data.physicalAmount);

      // Calcular la diferencia
      const differenceCents =
        physicalAmountCents - pesosToCents(theoreticalAmount);

      const db = getFirestore();
      const auditsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashAudits`
      );

      // Obtener el periodo de la caja actual
      const currentConfig = get().config;
      const cashBoxPeriod = currentConfig?.period || "Sin periodo";

      // Crear objeto base de Cierre sin campos undefined
      const audit: any = {
        id: "", // Se asignará después
        date: data.date,
        createdAt: new Date().toISOString(),
        physicalAmount: physicalAmountCents,
        theoreticalAmount: pesosToCents(theoreticalAmount),
        difference: differenceCents,
        status: PettyCashAuditStatus.PENDING,
        userId: user.uid,
        userName: user.displayName || user.email || "Usuario",
        cashBoxPeriod: cashBoxPeriod,
        cashBoxId: currentConfig?.id,
      };

      // Añadir campos opcionales solo si tienen valor
      if (data.notes) {
        audit.notes = data.notes;
      }

      // Guardar en Firestore
      const docRef = await addDoc(auditsRef, audit);
      audit.id = docRef.id;

      // Actualizar estado
      await get().fetchAudits();

      return docRef.id;
    } catch (error: any) {
      console.error("Error al crear Cierre:", error);
      set({
        loading: false,
        error: error.message || "Error al crear Cierre",
      });
      throw error;
    }
  },

  // Aprobar un Cierre
  approveAudit: async (auditId: string, createAdjustment: boolean) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();

      // Obtener el Cierre
      const auditRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashAudits/${auditId}`
      );

      // Buscar el Cierre en el estado
      const audit = get().audits.find((a) => a.id === auditId);
      if (!audit) {
        throw new Error("Cierre no encontrado");
      }

      const currentConfig = get().config;
      if (currentConfig?.id) {
        const belongsToCurrentCashBox = audit.cashBoxId
          ? audit.cashBoxId === currentConfig.id
          : audit.cashBoxPeriod === currentConfig.period;

        if (!belongsToCurrentCashBox) {
          throw new Error("El cierre no pertenece a la caja activa");
        }
      }

      // Si hay diferencia y se debe crear ajuste
      let adjustmentTransactionId = undefined;
      if (createAdjustment && audit.difference !== 0) {
        // Crear transacción de ajuste
        const transactionData: PettyCashTransactionCreateInput = {
          type: PettyCashTransactionType.ADJUSTMENT,
          amount: centsToPesos(audit.difference),
          description:
            audit.difference > 0
              ? "Ajuste positivo por Cierre de caja"
              : "Ajuste negativo por Cierre de caja",
          expenseDate: new Date().toISOString(),
          auditId: auditId,
        };

        adjustmentTransactionId = await get().addTransaction(transactionData);
      }

      // Preparar objeto de actualización sin campos undefined
      const updateData: any = {
        status: PettyCashAuditStatus.APPROVED,
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      };

      // Añadir el ID de la transacción de ajuste solo si existe
      if (adjustmentTransactionId) {
        updateData.adjustmentTransactionId = adjustmentTransactionId;
      }

      // Actualizar el Cierre
      await updateDoc(auditRef, updateData);

      // Actualizar estado
      await get().fetchAudits();
      await get().fetchTransactions();
    } catch (error: any) {
      console.error("Error al aprobar Cierre:", error);
      set({
        loading: false,
        error: error.message || "Error al aprobar Cierre",
      });
    }
  },

  // Rechazar un Cierre
  rejectAudit: async (auditId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();

      // Obtener el Cierre
      const auditRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashAudits/${auditId}`
      );

      // Validar que el cierre pertenezca a la caja activa
      const audit = get().audits.find((a) => a.id === auditId);
      if (!audit) {
        throw new Error("Cierre no encontrado");
      }

      const currentConfig = get().config;
      if (currentConfig?.id) {
        const belongsToCurrentCashBox = audit.cashBoxId
          ? audit.cashBoxId === currentConfig.id
          : audit.cashBoxPeriod === currentConfig.period;

        if (!belongsToCurrentCashBox) {
          throw new Error("El cierre no pertenece a la caja activa");
        }
      }

      // Actualizar el Cierre
      await updateDoc(auditRef, {
        status: PettyCashAuditStatus.REJECTED,
        notes: reason,
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      });

      // Actualizar estado
      await get().fetchAudits();
    } catch (error: any) {
      console.error("Error al rechazar Cierre:", error);
      set({
        loading: false,
        error: error.message || "Error al rechazar Cierre",
      });
    }
  },

  // Reponer fondos
  replenishFunds: async (
    amount: number,
    description: string,
    date: string,
    sourceAccountId?: string
  ) => {
    set({ loading: true, error: null });
    try {
      // Registrar la transacción de reposición
      await get().addTransaction({
        type: PettyCashTransactionType.REPLENISHMENT,
        amount,
        description,
        expenseDate: date,
        sourceAccountId,
      });

      // Actualizar estado
      await get().fetchTransactions();
    } catch (error: any) {
      console.error("Error al reponer fondos:", error);
      set({
        loading: false,
        error: error.message || "Error al reponer fondos",
      });
    }
  },

  // Calcular el saldo actual
  calculateBalance: () => {
    const transactions = get().transactions;
    const currentConfig = get().config;

    if (!currentConfig || !transactions.length) {
      return 0;
    }

    // Ordenar transacciones por fecha (más recientes primero)
    const sortedTransactions = [...transactions].sort(
      (a, b) =>
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );

    // Filtrar transacciones de la caja actual
    const currentCashBoxTransactions = sortedTransactions.filter(
      (tx) => tx.cashBoxId === currentConfig.id
    );

    let balance = 0;

    // Procesar cada transacción para calcular el saldo
    for (const tx of currentCashBoxTransactions) {
      const amountInPesos = centsToPesos(tx.amount);

      if (tx.type === PettyCashTransactionType.EXPENSE) {
        balance -= Math.abs(amountInPesos);
        continue;
      }

      if (tx.type === PettyCashTransactionType.ADJUSTMENT) {
        // Ajustes conservan el signo guardado en la transacción.
        balance += amountInPesos;
        continue;
      }

      // INITIAL y REPLENISHMENT siempre suman al fondo.
      balance += Math.abs(amountInPesos);
    }

    return balance;
  },

  // Finalizar caja actual y crear una nueva
  finalizeCashBoxAndCreateNew: async (
    periodName: string,
    notes?: string,
    newPeriodName?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const { user, clientId, condominiumId } = await getCurrentUserAndToken();

      // Verificar que exista una caja activa
      const currentConfig = get().config;
      if (!currentConfig) {
        throw new Error("No hay configuración de caja chica activa");
      }

      // Validar que se proporcione un nombre de periodo
      if (!newPeriodName) {
        throw new Error("Debe proporcionar un nombre para el nuevo periodo");
      }

      // Calcular el saldo final
      const finalBalanceAmount = get().calculateBalance();
      const finalBalanceCents = pesosToCents(finalBalanceAmount);

      // Obtener fecha actual
      const now = new Date();
      const endDate = now.toISOString();

      const db = getFirestore();

      // 1. Actualizar la configuración actual como inactiva
      const currentConfigRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig/${currentConfig.id}`
      );

      // Preparar datos de actualización para la caja actual
      const updateData: any = {
        active: false,
        endDate,
        finalBalance: finalBalanceCents,
        updatedAt: serverTimestamp(),
      };

      // Asignar periodo si no existe
      if (!currentConfig.period) {
        updateData.period = periodName;
      }

      // Asignar las notas de cierre solo si existen
      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(currentConfigRef, updateData);

      // 2. Crear nueva configuración de caja chica
      const configRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig`
      );

      // Crear la nueva configuración
      const newConfigData: any = {
        initialAmount: finalBalanceCents, // Saldo final de la caja anterior
        thresholdAmount: currentConfig.thresholdAmount,
        accountId: currentConfig.accountId,
        accountName: currentConfig.accountName,
        active: true,
        period: newPeriodName,
        startDate: endDate,
        previousCashBoxId: currentConfig.id,
        createdAt: serverTimestamp(),
      };

      const newConfigDocRef = await addDoc(configRef, newConfigData);

      // 3. Actualizar la caja anterior con referencia a la nueva
      await updateDoc(currentConfigRef, {
        nextCashBoxId: newConfigDocRef.id,
      });

      // 4. Crear transacción inicial en la nueva caja
      const transactionsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
      );

      const initialTransaction: any = {
        id: await generateUniqueId(),
        type: PettyCashTransactionType.INITIAL,
        amount: finalBalanceCents,
        description: `Saldo inicial (transferido de caja anterior ${
          currentConfig.period || "sin periodo"
        })`,
        expenseDate: endDate,
        createdAt: endDate,
        userId: user.uid,
        userName: user.displayName || user.email || "Usuario",
        cashBoxId: newConfigDocRef.id, // Asignar a la nueva caja
        previousCashBoxId: currentConfig.id,
      };

      await setDoc(createDoc(transactionsRef), initialTransaction);

      // 5. Cargar la nueva configuración
      const newConfig = {
        ...newConfigData,
        id: newConfigDocRef.id,
        createdAt: endDate,
      };

      set({
        config: newConfig,
        loading: false,
      });

      // 6. Cargar transacciones de la nueva caja
      await get().fetchTransactions();

      return newConfigDocRef.id;
    } catch (error: any) {
      console.error("Error al finalizar caja y crear nueva:", error);
      set({
        loading: false,
        error: error.message || "Error al finalizar caja y crear nueva",
      });
      throw error;
    }
  },

  // Listar las cajas históricas
  fetchHistoricalCashBoxes: async () => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();
      const configRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig`
      );

      // Consultar todas las cajas ordenadas por fecha de creación descendente
      const q = query(configRef, where("active", "==", false));
      const snap = await getDocs(q);

      if (snap.empty) {
        set({ loading: false });
        return [];
      }

      const cashBoxes: PettyCashConfig[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          initialAmount: data.initialAmount,
          thresholdAmount: data.thresholdAmount,
          accountId: data.accountId,
          accountName: data.accountName || "",
          period: data.period || "Sin periodo",
          startDate: data.startDate,
          endDate: data.endDate,
          finalBalance: data.finalBalance,
          createdAt: data.createdAt?.toDate?.()
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()
            ? data.updatedAt.toDate().toISOString()
            : undefined,
          active: false,
          previousCashBoxId: data.previousCashBoxId,
          nextCashBoxId: data.nextCashBoxId,
          notes: data.notes,
        };
      });

      // Ordenar por fecha de fin (más reciente primero)
      cashBoxes.sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });

      set({ loading: false });
      return cashBoxes;
    } catch (error: any) {
      console.error("Error al cargar cajas históricas:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar cajas históricas",
      });
      return [];
    }
  },

  // Cargar una caja histórica para ver sus transacciones y audits
  loadHistoricalCashBox: async (cashBoxId) => {
    set({ loading: true, error: null });
    try {
      const { clientId, condominiumId } = await getCurrentUserAndToken();

      const db = getFirestore();

      // 1. Cargar la configuración de la caja histórica
      const configRef = createDoc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashConfig/${cashBoxId}`
      );

      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        throw new Error("Caja histórica no encontrada");
      }

      const configData = configSnap.data();
      const config: PettyCashConfig = {
        id: configSnap.id,
        initialAmount: configData.initialAmount,
        thresholdAmount: configData.thresholdAmount,
        accountId: configData.accountId,
        accountName: configData.accountName || "",
        period: configData.period || "Sin periodo",
        startDate: configData.startDate,
        endDate: configData.endDate,
        finalBalance: configData.finalBalance,
        createdAt: configData.createdAt?.toDate?.()
          ? configData.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        updatedAt: configData.updatedAt?.toDate?.()
          ? configData.updatedAt.toDate().toISOString()
          : undefined,
        active: false,
        previousCashBoxId: configData.previousCashBoxId,
        nextCashBoxId: configData.nextCashBoxId,
        notes: configData.notes,
      };

      // 2. Cargar transacciones de esta caja histórica usando cashBoxId
      const transactionsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashTransactions`
      );

      // Utilizamos cashBoxId como criterio principal de filtrado
      const q = query(transactionsRef, where("cashBoxId", "==", cashBoxId));

      const transactionsSnap = await getDocs(q);

      const transactions: PettyCashTransaction[] = transactionsSnap.docs.map(
        (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            amount: data.amount,
            category: data.category,
            description: data.description,
            expenseDate: data.expenseDate,
            createdAt: data.createdAt,
            receiptUrl: data.receiptUrl,
            providerId: data.providerId || data.provider?.id,
            provider: data.provider,
            sourceAccountId: data.sourceAccountId,
            auditId: data.auditId,
            expenseId: data.expenseId,
            userId: data.userId,
            userName: data.userName,
            cashBoxId: data.cashBoxId,
            previousCashBoxId: data.previousCashBoxId,
          };
        }
      );

      // 3. Cargar audits de esta caja histórica
      const auditsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/pettyCashAudits`
      );

      // Primero intentamos por cashBoxId (modelo nuevo).
      let auditsSnap = await getDocs(
        query(auditsRef, where("cashBoxId", "==", cashBoxId))
      );

      // Compatibilidad con cierres legacy sin cashBoxId.
      if (auditsSnap.empty && config.startDate && config.endDate) {
        const fallbackQuery = query(
          auditsRef,
          where("date", ">=", config.startDate),
          where("date", "<=", config.endDate)
        );
        auditsSnap = await getDocs(fallbackQuery);
      }

      const audits: PettyCashAudit[] = auditsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          createdAt: data.createdAt,
          physicalAmount: data.physicalAmount,
          theoreticalAmount: data.theoreticalAmount,
          difference: data.difference,
          status: data.status || PettyCashAuditStatus.PENDING,
          notes: data.notes,
          userId: data.userId,
          userName: data.userName,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          adjustmentTransactionId: data.adjustmentTransactionId,
          cashBoxPeriod: data.cashBoxPeriod,
          cashBoxId: data.cashBoxId || cashBoxId,
        };
      });

      // Actualizar el estado
      set({
        config,
        transactions,
        audits,
        loading: false,
        currentBalance: centsToPesos(config.finalBalance || 0),
      });
    } catch (error: any) {
      console.error("Error al cargar caja histórica:", error);
      set({
        loading: false,
        error: error.message || "Error al cargar caja histórica",
      });
    }
  },
}));
