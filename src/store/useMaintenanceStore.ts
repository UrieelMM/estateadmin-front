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
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ticket } from "../presentation/screens/dashboard/maintenance/tickets/ticketsStore";
import moment from "moment";

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

type MaintenanceReportState = {
  reports: MaintenanceReport[];
  loading: boolean;
  error: string | null;
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

export const useMaintenanceReportStore = create<MaintenanceReportState>()(
  (set, get) => ({
    reports: [],
    loading: false,
    error: null,

    fetchReports: async (filters) => {
      set({ loading: true, error: null });
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
        // Se refrescan los reportes
        await get().fetchReports();
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
        await get().fetchReports();
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
        await get().fetchReports();
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

        await addDoc(appointmentsRef, appointmentData);
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

        // Creamos una copia del data eliminando propiedades complejas
        const updateData = { ...data };
        delete updateData.ticket;
        delete updateData.contract;

        await updateDoc(appointmentDocRef, updateData);
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
