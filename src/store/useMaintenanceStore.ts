import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ticket } from "../presentation/screens/dashboard/maintenance/tickets/ticketsStore";
import moment from "moment";
import { useExpenseStore } from "./expenseStore";
import { emitDomainNotificationEvent } from "../services/notificationCenterService";

export type MaintenanceReport = {
  id?: string;
  fecha: Date;
  area: string;
  encargado: string;
  detalle: string;
  evidenciaUrl?: string;
};

export type MaintenanceReportFilters = {
  month?: number; // se espera un valor entre 1 y 12
  year?: number;
  area?: string;
};

// Nuevo tipo para contratos de mantenimiento
export type MaintenanceContract = {
  id?: string;
  providerName: string;
  serviceType: string;
  description: string;
  startDate: string;
  endDate: string;
  value: number; // Ahora almacenamos en centavos
  status: "active" | "pending" | "expired" | "cancelled";
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  contractFileUrl?: string; // URL del archivo del contrato
};

// Nuevo tipo para citas/visitas de mantenimiento
export type MaintenanceAppointment = {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "pending" | "completed" | "cancelled" | "in_progress";
  technician: string;
  contactPhone?: string;
  ticketId?: string;
  ticket?: Ticket;
  contractId?: string;
  contract?: MaintenanceContract;
  notes?: string;
  ticketFolio?: string;
};

// Nuevo tipo para costos de mantenimiento
export type MaintenanceCost = {
  id?: string;
  description: string;
  amount: number; // En centavos
  date: string;
  category: string; // Materiales, Mano de obra, Repuestos, Otros
  appointmentId?: string;
  appointment?: MaintenanceAppointment;
  ticketId?: string;
  ticket?: Ticket;
  contractId?: string;
  contract?: MaintenanceContract;
  budgetId?: string;
  invoiceNumber?: string;
  invoiceFile?: string;
  provider?: string;
  providerId?: string; // ID del proveedor
  financialAccountId?: string;
  expenseId?: string; // ID del egreso asociado
  status: "pending" | "paid" | "cancelled";
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
};

// Nuevo tipo para presupuestos de mantenimiento
export type MaintenanceBudget = {
  id?: string;
  title: string;
  description: string;
  amount: number; // En centavos
  startDate: string;
  endDate: string;
  year: number;
  month?: number;
  category: string;
  status: "active" | "completed" | "cancelled" | "expired";
  expenses: MaintenanceCost[];
  progress: number; // Porcentaje de presupuesto utilizado
  notes?: string;
};

type MaintenanceReportState = {
  reports: MaintenanceReport[];
  loading: boolean;
  error: string | null;
  lastFilters: MaintenanceReportFilters | null;
  // Obtiene los reportes, pudiendo aplicar filtros por año, mes y área
  fetchReports: (filters?: MaintenanceReportFilters) => Promise<void>;
  // Crea un reporte. Se espera el objeto report sin id y sin evidenciaUrl (que se completa al subir el archivo)
  createReport: (
    report: Omit<MaintenanceReport, "id" | "evidenciaUrl">,
    file?: File
  ) => Promise<void>;
  // Actualiza un reporte. Se puede enviar un nuevo archivo para reemplazar la evidencia
  updateReport: (
    reportId: string,
    data: Partial<Omit<MaintenanceReport, "id">>,
    file?: File
  ) => Promise<void>;
  // Elimina un reporte
  deleteReport: (reportId: string) => Promise<void>;
};

// Nuevo estado para contratos de mantenimiento
type MaintenanceContractState = {
  contracts: MaintenanceContract[];
  loading: boolean;
  error: string | null;
  fetchContracts: () => Promise<void>;
  createContract: (contract: MaintenanceContract, file?: File) => Promise<void>;
  updateContract: (
    contractId: string,
    data: Partial<MaintenanceContract>,
    file?: File
  ) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  getExpiringContracts: () => MaintenanceContract[];
};

// Nuevo estado para citas/visitas de mantenimiento
type MaintenanceAppointmentState = {
  appointments: MaintenanceAppointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (month?: number, year?: number) => Promise<void>;
  createAppointment: (appointment: MaintenanceAppointment) => Promise<void>;
  updateAppointment: (
    appointmentId: string,
    data: Partial<MaintenanceAppointment>
  ) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  getAppointmentsByTicket: (
    ticketId: string
  ) => Promise<MaintenanceAppointment[]>;
  convertTicketToAppointment: (
    ticketId: string,
    appointment: Partial<MaintenanceAppointment>
  ) => Promise<void>;
};

// Nuevo estado para costos de mantenimiento
type MaintenanceCostState = {
  costs: MaintenanceCost[];
  loading: boolean;
  error: string | null;
  lastFilters: {
    startDate?: string;
    endDate?: string;
    category?: string;
  } | null;
  fetchCosts: (filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }, options?: { rememberFilters?: boolean }) => Promise<void>;
  createCost: (cost: MaintenanceCost, file?: File) => Promise<void>;
  updateCost: (
    costId: string,
    data: Partial<MaintenanceCost>,
    file?: File
  ) => Promise<void>;
  deleteCost: (costId: string) => Promise<void>;
  getCostsByAppointment: (appointmentId: string) => Promise<MaintenanceCost[]>;
  getCostsByTicket: (ticketId: string) => Promise<MaintenanceCost[]>;
  getCostsByContract: (contractId: string) => Promise<MaintenanceCost[]>;
  getCostSummaryByCategory: (
    startDate?: string,
    endDate?: string
  ) => Promise<{ category: string; total: number }[]>;
  getCostSummaryByMonth: (
    year: number
  ) => Promise<{ month: number; total: number }[]>;
};

// Nuevo estado para presupuestos de mantenimiento
type MaintenanceBudgetState = {
  budgets: MaintenanceBudget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: (year?: number) => Promise<void>;
  createBudget: (budget: MaintenanceBudget) => Promise<void>;
  updateBudget: (
    budgetId: string,
    data: Partial<MaintenanceBudget>
  ) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  calculateBudgetProgress: (budgetId: string) => Promise<void>;
  getBudgetSummary: (
    year: number
  ) => Promise<
    { category: string; budgeted: number; spent: number; remaining: number }[]
  >;
};

function isWithinNext24Hours(date: string, time: string): boolean {
  if (!date || !time) return false;
  const appointmentMoment = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm", true);
  if (!appointmentMoment.isValid()) return false;
  const now = moment();
  const diffHours = appointmentMoment.diff(now, "hours", true);
  return diffHours >= 0 && diffHours <= 24;
}

export const useMaintenanceReportStore = create<MaintenanceReportState>()(
  (set, get) => ({
    reports: [],
    loading: false,
    error: null,
    lastFilters: null,

    fetchReports: async (filters) => {
      set({ loading: true, error: null, lastFilters: filters || null });
      try {
        // Se obtiene el condominiumId guardado en localStorage
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const reportsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceReports"
        );

        const constraints: any[] = [];
        if (filters) {
          if (filters.area) {
            constraints.push(where("area", "==", filters.area));
          }
          if (filters.year) {
            let start: Date;
            let end: Date;
            if (filters.month) {
              // Filtrado por mes y año
              start = new Date(filters.year, filters.month - 1, 1, 0, 0, 0, 0);
              end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
            } else {
              // Filtrado solo por año
              start = new Date(filters.year, 0, 1, 0, 0, 0, 0);
              end = new Date(filters.year, 11, 31, 23, 59, 59, 999);
            }
            constraints.push(where("fecha", ">=", start));
            constraints.push(where("fecha", "<=", end));
          }
        }

        let q;
        if (constraints.length > 0) {
          q = query(reportsRef, ...constraints, orderBy("fecha", "desc"));
        } else {
          q = query(reportsRef, orderBy("fecha", "desc"));
        }

        const querySnapshot = await getDocs(q);
        const reports: MaintenanceReport[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          reports.push({
            id: docSnap.id,
            fecha: data.fecha.toDate ? data.fecha.toDate() : data.fecha,
            area: data.area,
            encargado: data.encargado,
            detalle: data.detalle,
            evidenciaUrl: data.evidenciaUrl || "",
          });
        });

        set({ reports, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createReport: async (report, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        let evidenciaUrl = "";
        if (file) {
          // Se sube el archivo PDF y se obtiene la URL pública
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/maintenanceReports/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          evidenciaUrl = await getDownloadURL(storageRef);
        }

        const reportData = {
          ...report,
          evidenciaUrl,
        };

        const reportsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceReports"
        );
        await addDoc(reportsRef, reportData);

        set({ loading: false });
        // Se refrescan los reportes respetando filtros
        await get().fetchReports(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateReport: async (reportId, data, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        let evidenciaUrl = data.evidenciaUrl || "";
        if (file) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/maintenanceReports/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          evidenciaUrl = await getDownloadURL(storageRef);
        }

        const updateData = {
          ...data,
          evidenciaUrl,
        };

        const reportDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceReports",
          reportId
        );
        await updateDoc(reportDocRef, updateData);

        set({ loading: false });
        await get().fetchReports(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteReport: async (reportId) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const reportDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceReports",
          reportId
        );
        await deleteDoc(reportDocRef);

        set({ loading: false });
        await get().fetchReports(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },
  })
);

// Nuevo store para contratos de mantenimiento
export const useMaintenanceContractStore = create<MaintenanceContractState>()(
  (set, get) => ({
    contracts: [],
    loading: false,
    error: null,

    fetchContracts: async () => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const contractsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceContracts"
        );

        const q = query(contractsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const contracts: MaintenanceContract[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          contracts.push({
            id: docSnap.id,
            providerName: data.providerName,
            serviceType: data.serviceType,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            value: data.value,
            status: data.status,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            notes: data.notes,
            contractFileUrl: data.contractFileUrl,
          });
        });

        // Actualizar automáticamente el estado basado en las fechas
        const today = new Date();
        const updatedContracts = contracts.map((contract) => {
          const endDate = new Date(contract.endDate);
          if (contract.status !== "cancelled" && endDate < today) {
            return {
              ...contract,
              status: "expired" as
                | "active"
                | "pending"
                | "expired"
                | "cancelled",
            };
          }
          return contract;
        });

        set({ contracts: updatedContracts, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createContract: async (contract, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        // Si se proporciona un archivo, lo subimos a Firebase Storage
        let contractFileUrl = "";
        if (file) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/providers/contracts/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          contractFileUrl = await getDownloadURL(storageRef);
        }

        // Crear el objeto de contrato con la URL del archivo si existe
        const contractData = {
          ...contract,
          contractFileUrl,
        };

        const contractsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceContracts"
        );

        await addDoc(contractsRef, contractData);
        set({ loading: false });
        await get().fetchContracts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateContract: async (contractId, data, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        // Si se proporciona un archivo, lo subimos y actualizamos la URL
        let updateData = { ...data };
        if (file) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/providers/contracts/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const contractFileUrl = await getDownloadURL(storageRef);
          updateData.contractFileUrl = contractFileUrl;
        }

        const contractDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceContracts",
          contractId
        );

        await updateDoc(contractDocRef, updateData);
        set({ loading: false });
        await get().fetchContracts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteContract: async (contractId) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const contractDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceContracts",
          contractId
        );

        await deleteDoc(contractDocRef);
        set({ loading: false });
        await get().fetchContracts();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    // Nueva función para obtener contratos próximos a vencer (30 días)
    getExpiringContracts: () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      return get().contracts.filter((contract) => {
        const endDate = new Date(contract.endDate);
        return (
          contract.status === "active" &&
          endDate > today &&
          endDate <= thirtyDaysFromNow
        );
      });
    },
  })
);

// Nuevo store para citas/visitas de mantenimiento
export const useMaintenanceAppointmentStore =
  create<MaintenanceAppointmentState>()((set, get) => ({
    appointments: [],
    loading: false,
    error: null,

    fetchAppointments: async (month, year) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const appointmentsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments"
        );

        let constraints: any[] = [];

        if (month !== undefined && year !== undefined) {
          // Filtrar por mes y año
          const startDate = moment(new Date(year, month - 1, 1)).format(
            "YYYY-MM-DD"
          );
          const endDate = moment(new Date(year, month, 0)).format("YYYY-MM-DD");

          constraints.push(where("date", ">=", startDate));
          constraints.push(where("date", "<=", endDate));
        }

        let q;
        if (constraints.length > 0) {
          q = query(
            appointmentsRef,
            ...constraints,
            orderBy("date", "asc"),
            orderBy("time", "asc")
          );
        } else {
          q = query(
            appointmentsRef,
            orderBy("date", "asc"),
            orderBy("time", "asc")
          );
        }

        const querySnapshot = await getDocs(q);

        const appointments: MaintenanceAppointment[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const appointment: MaintenanceAppointment = {
            id: docSnap.id,
            title: data.title,
            description: data.description,
            date: data.date,
            time: data.time,
            location: data.location,
            status: data.status,
            technician: data.technician,
            contactPhone: data.contactPhone || "",
            ticketId: data.ticketId || "",
            ticketFolio: data.ticketFolio || "",
            contractId: data.contractId || "",
            notes: data.notes || "",
          };

          // Si hay un ticketId, obtenemos los datos del ticket
          if (data.ticketId) {
            try {
              const ticketDocRef = doc(
                db,
                "clients",
                clientId,
                "condominiums",
                condominiumId,
                "ticketsMaintenance", // Colección correcta
                data.ticketId
              );
              const ticketSnap = await getDoc(ticketDocRef);

              if (ticketSnap.exists()) {
                const ticketData = ticketSnap.data();
                appointment.ticket = {
                  id: ticketSnap.id,
                  ...ticketData,
                } as Ticket;

                // Asegurar que tenemos el folio
                if (!appointment.ticketFolio && ticketData.folio) {
                  appointment.ticketFolio = ticketData.folio;
                }
              }
            } catch (error) {
              console.error("Error al obtener ticket asociado:", error);
            }
          }

          // Si hay un contractId, obtenemos los datos del contrato
          if (data.contractId) {
            try {
              const contractDocRef = doc(
                db,
                "clients",
                clientId,
                "condominiums",
                condominiumId,
                "maintenanceContracts",
                data.contractId
              );
              const contractSnap = await getDoc(contractDocRef);

              if (contractSnap.exists()) {
                appointment.contract = {
                  id: contractSnap.id,
                  ...contractSnap.data(),
                } as MaintenanceContract;
              }
            } catch (error) {
              console.error("Error al obtener contrato asociado:", error);
            }
          }

          appointments.push(appointment);
        }

        set({ appointments, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createAppointment: async (appointment) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const appointmentsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments"
        );

        // Creamos una copia del appointment eliminando propiedades complejas
        const appointmentData = { ...appointment };
        delete appointmentData.ticket;
        delete appointmentData.contract;

        const createdRef = await addDoc(appointmentsRef, appointmentData);

        if (
          appointmentData.status !== "completed" &&
          appointmentData.status !== "cancelled" &&
          isWithinNext24Hours(appointmentData.date, appointmentData.time)
        ) {
          void emitDomainNotificationEvent({
            eventType: "maintenance.appointment_24h",
            module: "maintenance",
            priority: "medium",
            dedupeKey: `maintenance:appointment_24h:${createdRef.id}:${appointmentData.date}`,
            entityId: createdRef.id,
            entityType: "maintenance_appointment",
            title: "Visita de mantenimiento en menos de 24h",
            body: `La visita "${appointmentData.title}" está programada para ${appointmentData.date} ${appointmentData.time}.`,
            metadata: {
              appointmentId: createdRef.id,
              title: appointmentData.title,
              date: appointmentData.date,
              time: appointmentData.time,
              location: appointmentData.location || "",
              technician: appointmentData.technician || "",
              ticketId: appointmentData.ticketId || "",
            },
          });
        }
        set({ loading: false });
        await get().fetchAppointments();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateAppointment: async (appointmentId, data) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const appointmentDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments",
          appointmentId
        );

        const previousAppointment = get().appointments.find(
          (appointment) => appointment.id === appointmentId
        );

        // Creamos una copia del data eliminando propiedades complejas
        const updateData = { ...data };
        delete updateData.ticket;
        delete updateData.contract;

        await updateDoc(appointmentDocRef, updateData);

        const nextDate = (updateData.date as string) || previousAppointment?.date || "";
        const nextTime = (updateData.time as string) || previousAppointment?.time || "";
        const nextStatus =
          (updateData.status as MaintenanceAppointment["status"]) ||
          previousAppointment?.status ||
          "pending";
        const nextTitle = (updateData.title as string) || previousAppointment?.title || "";
        const nextLocation =
          (updateData.location as string) || previousAppointment?.location || "";
        const nextTechnician =
          (updateData.technician as string) || previousAppointment?.technician || "";
        const nextTicketId =
          (updateData.ticketId as string) || previousAppointment?.ticketId || "";

        if (
          nextStatus !== "completed" &&
          nextStatus !== "cancelled" &&
          isWithinNext24Hours(nextDate, nextTime)
        ) {
          void emitDomainNotificationEvent({
            eventType: "maintenance.appointment_24h",
            module: "maintenance",
            priority: "medium",
            dedupeKey: `maintenance:appointment_24h:${appointmentId}:${nextDate}`,
            entityId: appointmentId,
            entityType: "maintenance_appointment",
            title: "Visita de mantenimiento en menos de 24h",
            body: `La visita "${nextTitle}" está programada para ${nextDate} ${nextTime}.`,
            metadata: {
              appointmentId,
              title: nextTitle,
              date: nextDate,
              time: nextTime,
              location: nextLocation,
              technician: nextTechnician,
              ticketId: nextTicketId,
            },
          });
        }
        set({ loading: false });
        await get().fetchAppointments();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteAppointment: async (appointmentId) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const appointmentDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments",
          appointmentId
        );

        await deleteDoc(appointmentDocRef);
        set({ loading: false });
        await get().fetchAppointments();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getAppointmentsByTicket: async (ticketId) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const appointmentsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments"
        );

        const q = query(appointmentsRef, where("ticketId", "==", ticketId));
        const querySnapshot = await getDocs(q);

        const appointments: MaintenanceAppointment[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          appointments.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            date: data.date,
            time: data.time,
            location: data.location,
            status: data.status,
            technician: data.technician,
            contactPhone: data.contactPhone || "",
            ticketId: data.ticketId || "",
            ticketFolio: data.ticketFolio || "",
            contractId: data.contractId || "",
            notes: data.notes || "",
          });
        });

        return appointments;
      } catch (error: any) {
        console.error("Error al obtener citas por ticketId:", error);
        return [];
      }
    },

    convertTicketToAppointment: async (ticketId, appointmentData) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Obtener datos del ticket - CORREGIDO: ahora usamos "ticketsMaintenance" en lugar de "tickets"
        const ticketDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "ticketsMaintenance", // Colección correcta
          ticketId
        );
        const ticketSnap = await getDoc(ticketDocRef);

        if (!ticketSnap.exists()) {
          throw new Error("El ticket no existe");
        }

        const ticketData = ticketSnap.data();

        // Crear cita basada en el ticket
        const appointmentsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceAppointments"
        );

        const newAppointment = {
          title: appointmentData.title || `Visita: ${ticketData.title}`,
          description: appointmentData.description || ticketData.description,
          date: appointmentData.date || moment().format("YYYY-MM-DD"),
          time: appointmentData.time || "10:00",
          location: appointmentData.location || ticketData.location || "",
          status: appointmentData.status || "pending",
          technician: appointmentData.technician || "",
          contactPhone:
            appointmentData.contactPhone || ticketData.contactPhone || "",
          ticketId: ticketId,
          ticketFolio: ticketData.folio || "",
          contractId: appointmentData.contractId || "",
          notes: appointmentData.notes || "",
        };

        await addDoc(appointmentsRef, newAppointment);

        // Actualizar el ticket para indicar que tiene una cita programada
        await updateDoc(ticketDocRef, {
          hasAppointment: true,
          lastUpdated: Timestamp.now(),
        });

        set({ loading: false });
        await get().fetchAppointments();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },
  }));

// Nuevo store para costos de mantenimiento
export const useMaintenanceCostStore = create<MaintenanceCostState>()(
  (set, get) => ({
    costs: [],
    loading: false,
    error: null,
    lastFilters: null,

    fetchCosts: async (filters, options) => {
      const rememberFilters = options?.rememberFilters ?? true;
      const nextState: {
        loading: boolean;
        error: string | null;
        lastFilters?: {
          startDate?: string;
          endDate?: string;
          category?: string;
        } | null;
      } = { loading: true, error: null };
      if (rememberFilters) {
        nextState.lastFilters = filters || null;
      }
      set(nextState);
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        let constraints: any[] = [];

        // Aplicar filtros si existen
        if (filters) {
          if (filters.startDate) {
            constraints.push(where("date", ">=", filters.startDate));
          }
          if (filters.endDate) {
            constraints.push(where("date", "<=", filters.endDate));
          }
          if (filters.category) {
            constraints.push(where("category", "==", filters.category));
          }
        }

        let q;
        if (constraints.length > 0) {
          q = query(costsRef, ...constraints, orderBy("date", "desc"));
        } else {
          q = query(costsRef, orderBy("date", "desc"));
        }

        const querySnapshot = await getDocs(q);

        const costs: MaintenanceCost[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const cost: MaintenanceCost = {
            id: docSnap.id,
            description: data.description,
            amount: data.amount,
            date: data.date,
            category: data.category,
            appointmentId: data.appointmentId || "",
            ticketId: data.ticketId || "",
            contractId: data.contractId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceFile: data.invoiceFile || "",
            provider: data.provider || "",
            expenseId: data.expenseId || "",
            status: data.status,
            paymentDate: data.paymentDate || "",
            paymentMethod: data.paymentMethod || "",
            notes: data.notes || "",
          };

          // Si hay un appointmentId, obtenemos los datos de la cita
          if (data.appointmentId) {
            try {
              const appointmentDocRef = doc(
                db,
                "clients",
                clientId,
                "condominiums",
                condominiumId,
                "maintenanceAppointments",
                data.appointmentId
              );
              const appointmentSnap = await getDoc(appointmentDocRef);

              if (appointmentSnap.exists()) {
                cost.appointment = {
                  id: appointmentSnap.id,
                  ...appointmentSnap.data(),
                } as MaintenanceAppointment;
              }
            } catch (error) {
              console.error("Error al obtener cita asociada:", error);
            }
          }

          // Si hay un ticketId, obtenemos los datos del ticket
          if (data.ticketId) {
            try {
              const ticketDocRef = doc(
                db,
                "clients",
                clientId,
                "condominiums",
                condominiumId,
                "ticketsMaintenance",
                data.ticketId
              );
              const ticketSnap = await getDoc(ticketDocRef);

              if (ticketSnap.exists()) {
                cost.ticket = {
                  id: ticketSnap.id,
                  ...ticketSnap.data(),
                } as Ticket;
              }
            } catch (error) {
              console.error("Error al obtener ticket asociado:", error);
            }
          }

          // Si hay un contractId, obtenemos los datos del contrato
          if (data.contractId) {
            try {
              const contractDocRef = doc(
                db,
                "clients",
                clientId,
                "condominiums",
                condominiumId,
                "maintenanceContracts",
                data.contractId
              );
              const contractSnap = await getDoc(contractDocRef);

              if (contractSnap.exists()) {
                cost.contract = {
                  id: contractSnap.id,
                  ...contractSnap.data(),
                } as MaintenanceContract;
              }
            } catch (error) {
              console.error("Error al obtener contrato asociado:", error);
            }
          }

          costs.push(cost);
        }

        set({ costs, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createCost: async (cost, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        // Si se proporciona un archivo de factura, lo subimos
        let invoiceFile = "";
        if (file) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/maintenance/invoices/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          invoiceFile = await getDownloadURL(storageRef);
        }

        // Crear el objeto de costo con la URL del archivo si existe
        const costData = {
          ...cost,
          invoiceFile,
        };

        // Eliminar objetos complejos antes de guardar en Firestore
        const costToSave = { ...costData };
        delete costToSave.appointment;
        delete costToSave.ticket;
        delete costToSave.contract;

        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        // Registrar también como un egreso general antes de crear el costo
        const expenseId = await registerMaintenanceCostAsExpense(
          costData,
          file,
          invoiceFile
        );

        if (expenseId) {
          costToSave.expenseId = expenseId;
        }

        // Guardar en la colección de maintenanceCosts
        try {
          await addDoc(costsRef, costToSave);
        } catch (error) {
          if (expenseId) {
            try {
              const expenseStore = useExpenseStore.getState();
              await expenseStore.deleteExpense(expenseId);
            } catch (cleanupError) {
              console.error(
                "Error al revertir egreso tras fallo al guardar costo:",
                cleanupError
              );
            }
          }
          throw error;
        }

        // Si este costo está vinculado a un presupuesto, actualizar el progreso del presupuesto
        if (cost.budgetId) {
          const budgetStore = useMaintenanceBudgetStore.getState();
          await budgetStore.calculateBudgetProgress(cost.budgetId);
        }

        set({ loading: false });
        await get().fetchCosts(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateCost: async (costId, data, file) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const storage = getStorage();

        // Si se proporciona un archivo, lo subimos y actualizamos la URL
        let updateData = { ...data };
        if (file) {
          const storageRef = ref(
            storage,
            `clients/${clientId}/condominiums/${condominiumId}/maintenance/invoices/${Date.now()}_${
              file.name
            }`
          );
          await uploadBytes(storageRef, file);
          const invoiceFile = await getDownloadURL(storageRef);
          updateData.invoiceFile = invoiceFile;
        }

        // Eliminar objetos complejos antes de guardar en Firestore
        delete updateData.appointment;
        delete updateData.ticket;
        delete updateData.contract;

        const costDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts",
          costId
        );

        // Obtener datos completos antes de actualizar para registrar como egreso
        const currentCostDoc = await getDoc(costDocRef);
        if (!currentCostDoc.exists()) {
          throw new Error("El costo no existe");
        }

        const currentCost = currentCostDoc.data() as MaintenanceCost;
        const updatedCost = { ...currentCost, ...updateData, id: costId };
        const invoiceUrl = updateData.invoiceFile || currentCost.invoiceFile;

        // Registrar como un egreso general (actualiza si existe o crea nuevo)
        const expenseId = await registerMaintenanceCostAsExpense(
          updatedCost,
          file,
          invoiceUrl,
          currentCost.expenseId
        );

        if (expenseId && expenseId !== currentCost.expenseId) {
          updateData.expenseId = expenseId;
        }

        await updateDoc(costDocRef, updateData);

        // Si hay un budgetId, actualizar el progreso del presupuesto
        const costDoc = await getDoc(costDocRef);
        if (costDoc.exists() && costDoc.data().budgetId) {
          const budgetStore = useMaintenanceBudgetStore.getState();
          await budgetStore.calculateBudgetProgress(costDoc.data().budgetId);
        }

        set({ loading: false });
        await get().fetchCosts(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteCost: async (costId) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Obtener el documento antes de eliminarlo para ver si tiene budgetId
        const costDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts",
          costId
        );

        const costDoc = await getDoc(costDocRef);
        const budgetId = costDoc.exists() ? costDoc.data().budgetId : null;
        const expenseId = costDoc.exists() ? costDoc.data().expenseId : null;

        if (expenseId) {
          const expenseStore = useExpenseStore.getState();
          await expenseStore.deleteExpense(expenseId);
        }

        await deleteDoc(costDocRef);

        // Si había un presupuesto asociado, actualizar su progreso
        if (budgetId) {
          const budgetStore = useMaintenanceBudgetStore.getState();
          await budgetStore.calculateBudgetProgress(budgetId);
        }

        set({ loading: false });
        await get().fetchCosts(get().lastFilters || undefined);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getCostsByAppointment: async (appointmentId) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        const q = query(costsRef, where("appointmentId", "==", appointmentId));
        const querySnapshot = await getDocs(q);

        const costs: MaintenanceCost[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          costs.push({
            id: docSnap.id,
            description: data.description,
            amount: data.amount,
            date: data.date,
            category: data.category,
            appointmentId: data.appointmentId || "",
            ticketId: data.ticketId || "",
            contractId: data.contractId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceFile: data.invoiceFile || "",
            provider: data.provider || "",
            expenseId: data.expenseId || "",
            status: data.status,
            paymentDate: data.paymentDate || "",
            paymentMethod: data.paymentMethod || "",
            notes: data.notes || "",
          });
        });

        return costs;
      } catch (error: any) {
        console.error("Error al obtener costos por appointmentId:", error);
        return [];
      }
    },

    getCostsByTicket: async (ticketId) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        const q = query(costsRef, where("ticketId", "==", ticketId));
        const querySnapshot = await getDocs(q);

        const costs: MaintenanceCost[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          costs.push({
            id: docSnap.id,
            description: data.description,
            amount: data.amount,
            date: data.date,
            category: data.category,
            appointmentId: data.appointmentId || "",
            ticketId: data.ticketId || "",
            contractId: data.contractId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceFile: data.invoiceFile || "",
            provider: data.provider || "",
            expenseId: data.expenseId || "",
            status: data.status,
            paymentDate: data.paymentDate || "",
            paymentMethod: data.paymentMethod || "",
            notes: data.notes || "",
          });
        });

        return costs;
      } catch (error: any) {
        console.error("Error al obtener costos por ticketId:", error);
        return [];
      }
    },

    getCostsByContract: async (contractId) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        const q = query(costsRef, where("contractId", "==", contractId));
        const querySnapshot = await getDocs(q);

        const costs: MaintenanceCost[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          costs.push({
            id: docSnap.id,
            description: data.description,
            amount: data.amount,
            date: data.date,
            category: data.category,
            appointmentId: data.appointmentId || "",
            ticketId: data.ticketId || "",
            contractId: data.contractId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceFile: data.invoiceFile || "",
            provider: data.provider || "",
            expenseId: data.expenseId || "",
            status: data.status,
            paymentDate: data.paymentDate || "",
            paymentMethod: data.paymentMethod || "",
            notes: data.notes || "",
          });
        });

        return costs;
      } catch (error: any) {
        console.error("Error al obtener costos por contractId:", error);
        return [];
      }
    },

    getCostSummaryByCategory: async (startDate, endDate) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }

        // Si no hay fechas, establecer periodo del año actual
        if (!startDate) {
          const currentYear = new Date().getFullYear();
          startDate = `${currentYear}-01-01`;
        }

        if (!endDate) {
          const currentYear = new Date().getFullYear();
          endDate = `${currentYear}-12-31`;
        }

        // Obtener todos los costos en el rango de fechas
        await get().fetchCosts({ startDate, endDate }, { rememberFilters: false });
        const costs = get().costs;

        // Agrupar por categoría y sumar
        const categorySummary: Record<string, number> = {};
        costs.forEach((cost) => {
          if (!categorySummary[cost.category]) {
            categorySummary[cost.category] = 0;
          }
          categorySummary[cost.category] += cost.amount;
        });

        // Convertir a array para retornar
        return Object.entries(categorySummary).map(([category, total]) => ({
          category,
          total,
        }));
      } catch (error: any) {
        console.error("Error al obtener resumen por categoría:", error);
        return [];
      }
    },

    getCostSummaryByMonth: async (year) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }

        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // Obtener todos los costos del año
        await get().fetchCosts({ startDate, endDate }, { rememberFilters: false });
        const costs = get().costs;

        // Inicializar resumen para los 12 meses
        const monthSummary: Record<number, number> = {};
        for (let i = 1; i <= 12; i++) {
          monthSummary[i] = 0;
        }

        // Agrupar por mes y sumar
        costs.forEach((cost) => {
          const costDate = new Date(cost.date);
          const month = costDate.getMonth() + 1; // getMonth() es 0-indexed

          if (costDate.getFullYear() === year) {
            monthSummary[month] += cost.amount;
          }
        });

        // Convertir a array para retornar
        return Object.entries(monthSummary).map(([monthStr, total]) => ({
          month: parseInt(monthStr),
          total,
        }));
      } catch (error: any) {
        console.error("Error al obtener resumen por mes:", error);
        return [];
      }
    },
  })
);

// Nuevo store para presupuestos de mantenimiento
export const useMaintenanceBudgetStore = create<MaintenanceBudgetState>()(
  (set, get) => ({
    budgets: [],
    loading: false,
    error: null,

    fetchBudgets: async (year) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();
        const budgetsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceBudgets"
        );

        let q;
        if (year) {
          q = query(
            budgetsRef,
            where("year", "==", year),
            orderBy("startDate", "asc")
          );
        } else {
          q = query(budgetsRef, orderBy("startDate", "asc"));
        }

        const querySnapshot = await getDocs(q);

        const budgets: MaintenanceBudget[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();

          // Obtener los gastos asociados a este presupuesto
          const costsRef = collection(
            db,
            "clients",
            clientId,
            "condominiums",
            condominiumId,
            "maintenanceCosts"
          );

          const costsQuery = query(
            costsRef,
            where("budgetId", "==", docSnap.id)
          );
          const costsSnapshot = await getDocs(costsQuery);

          const expenses: MaintenanceCost[] = [];
          let totalExpenses = 0;

          costsSnapshot.forEach((costDoc) => {
            const costData = costDoc.data();
            expenses.push({
              id: costDoc.id,
              description: costData.description,
              amount: costData.amount,
              date: costData.date,
              category: costData.category,
              status: costData.status,
              appointmentId: costData.appointmentId || "",
              ticketId: costData.ticketId || "",
              contractId: costData.contractId || "",
              provider: costData.provider || "",
              expenseId: costData.expenseId || "",
              notes: costData.notes || "",
            });

            totalExpenses += costData.amount;
          });

          // Calcular progreso
          const progress =
            data.amount > 0
              ? Math.min(100, (totalExpenses / data.amount) * 100)
              : 0;

          budgets.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            amount: data.amount,
            startDate: data.startDate,
            endDate: data.endDate,
            year: data.year,
            month: data.month || null,
            category: data.category,
            status: data.status,
            expenses: expenses,
            progress: progress,
            notes: data.notes || "",
          });
        }

        set({ budgets, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    createBudget: async (budget) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Eliminar las expenses antes de guardar
        const { expenses, ...budgetToSave } = budget;

        // Asegurar progreso inicial
        budgetToSave.progress = 0;

        const budgetsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceBudgets"
        );

        await addDoc(budgetsRef, budgetToSave);
        set({ loading: false });
        await get().fetchBudgets();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateBudget: async (budgetId, data) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Eliminar las expenses antes de guardar
        const updateData = { ...data };
        delete updateData.expenses;

        const budgetDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceBudgets",
          budgetId
        );

        await updateDoc(budgetDocRef, updateData);

        // Si se cambió el monto del presupuesto, recalcular el progreso
        if (data.amount !== undefined) {
          await get().calculateBudgetProgress(budgetId);
        }

        set({ loading: false });
        await get().fetchBudgets();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteBudget: async (budgetId) => {
      set({ loading: true, error: null });
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          set({ error: "Condominio no seleccionado", loading: false });
          return;
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Primero verificamos si hay costos asociados a este presupuesto
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        const costsQuery = query(costsRef, where("budgetId", "==", budgetId));
        const costsSnapshot = await getDocs(costsQuery);

        // Si hay costos, actualizar su budgetId a null
        const batch = writeBatch(db);
        costsSnapshot.forEach((doc) => {
          const costDocRef = doc.ref;
          batch.update(costDocRef, { budgetId: null });
        });

        // Eliminar el presupuesto
        const budgetDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceBudgets",
          budgetId
        );

        batch.delete(budgetDocRef);

        // Ejecutar el batch
        await batch.commit();

        set({ loading: false });
        await get().fetchBudgets();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    calculateBudgetProgress: async (budgetId) => {
      try {
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        if (!clientId) throw new Error("clientId no disponible en el token");

        const db = getFirestore();

        // Obtener el presupuesto
        const budgetDocRef = doc(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceBudgets",
          budgetId
        );

        const budgetDoc = await getDoc(budgetDocRef);
        if (!budgetDoc.exists()) {
          throw new Error("El presupuesto no existe");
        }

        const budgetData = budgetDoc.data();
        const budgetAmount = budgetData.amount;

        // Obtener todos los costos asociados
        const costsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          condominiumId,
          "maintenanceCosts"
        );

        const costsQuery = query(costsRef, where("budgetId", "==", budgetId));
        const costsSnapshot = await getDocs(costsQuery);

        let totalExpenses = 0;
        costsSnapshot.forEach((doc) => {
          totalExpenses += doc.data().amount;
        });

        // Calcular el progreso y actualizar
        const progress =
          budgetAmount > 0
            ? Math.min(100, (totalExpenses / budgetAmount) * 100)
            : 0;

        await updateDoc(budgetDocRef, { progress });

        // Actualizar el estado si el presupuesto está completado o excedido
        if (progress >= 100 && budgetData.status === "active") {
          await updateDoc(budgetDocRef, { status: "completed" });
        }
      } catch (error: any) {
        console.error("Error al calcular progreso del presupuesto:", error);
      }
    },

    getBudgetSummary: async (year) => {
      try {
        // Cargar los presupuestos del año
        await get().fetchBudgets(year);
        const budgets = get().budgets;

        // Agrupar por categoría
        const categorySummary: Record<
          string,
          { budgeted: number; spent: number; remaining: number }
        > = {};

        budgets.forEach((budget) => {
          if (!categorySummary[budget.category]) {
            categorySummary[budget.category] = {
              budgeted: 0,
              spent: 0,
              remaining: 0,
            };
          }

          // Sumar presupuesto
          categorySummary[budget.category].budgeted += budget.amount;

          // Calcular gastos
          const totalExpenses = budget.expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );
          categorySummary[budget.category].spent += totalExpenses;

          // Calcular restante
          categorySummary[budget.category].remaining =
            categorySummary[budget.category].budgeted -
            categorySummary[budget.category].spent;
        });

        // Convertir a array para retornar
        return Object.entries(categorySummary).map(([category, values]) => ({
          category,
          budgeted: values.budgeted,
          spent: values.spent,
          remaining: values.remaining,
        }));
      } catch (error: any) {
        console.error("Error al obtener resumen de presupuestos:", error);
        return [];
      }
    },
  })
);

// Función auxiliar para registrar un costo de mantenimiento como un egreso
async function registerMaintenanceCostAsExpense(
  cost: MaintenanceCost,
  file?: File,
  invoiceUrl?: string,
  existingExpenseId?: string
): Promise<string | null> {
  const expenseStore = useExpenseStore.getState();

  // Construir un concepto descriptivo para el egreso
  let concept = `Mantenimiento - ${cost.category}`;

  // Añadir información adicional si está relacionado con ticket, cita o contrato
  if (cost.ticketId) {
    concept += ` - Ticket relacionado`;
  } else if (cost.appointmentId) {
    concept += ` - Visita relacionada`;
  } else if (cost.contractId) {
    concept += ` - Contrato relacionado`;
  }

  // Convertir fecha a formato esperado por expenseStore (YYYY-MM-DD HH:mm)
  const formattedDate = moment(cost.date).format("YYYY-MM-DD HH:mm");

  // Configurar los datos para el registro del egreso
  const expenseData = {
    amount: cost.amount / 100, // El expense store espera pesos, no centavos
    concept,
    paymentType: cost.paymentMethod || "Efectivo", // Usar el método de pago si existe, o "Efectivo" por defecto
    expenseDate: formattedDate,
    description: `${
      cost.description || cost.notes || ""
    } - Ref: Costo de mantenimiento`,
    file: invoiceUrl ? undefined : file, // Solo pasar el archivo si no tenemos ya una URL
    invoiceUrl, // Usar URL existente si se proporciona
    financialAccountId: cost.financialAccountId || "",
    providerId: cost.providerId, // Usar el ID del proveedor si existe
  };

  if (existingExpenseId) {
    await expenseStore.updateExpense(existingExpenseId, expenseData);
    return existingExpenseId;
  }

  const newExpenseId = await expenseStore.addExpense(expenseData);
  return newExpenseId;
}
