import { create } from "./createStore";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { db, storage } from "../firebase/firebase";
import { centsToPesos } from "../utils/curreyncy";

// Helper function to safely convert date strings to Date objects
const safeDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;

  const momentDate = moment(dateValue);
  if (momentDate.isValid()) {
    return momentDate.toDate();
  }

  // If invalid, return current date as fallback
  console.warn(
    `Invalid date value: ${dateValue}, using current date as fallback`
  );
  return new Date();
};

// Helper function for optional dates (returns undefined if invalid)
const safeOptionalDate = (dateValue: any): Date | undefined => {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;

  const momentDate = moment(dateValue);
  if (momentDate.isValid()) {
    return momentDate.toDate();
  }

  console.warn(
    `Invalid optional date value: ${dateValue}, returning undefined`
  );
  return undefined;
};

// Helper function to safely convert Firestore timestamps to Date objects
const safeFirestoreDate = (firestoreDate: any): Date => {
  if (!firestoreDate) return new Date();
  if (firestoreDate.toDate && typeof firestoreDate.toDate === "function") {
    return firestoreDate.toDate();
  }
  return safeDate(firestoreDate);
};

// Helper function to ensure no undefined values are sent to Firestore
const sanitizeForFirestore = (obj: any): any => {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Skip undefined values completely
      continue;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      sanitized[key] = sanitizeForFirestore(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Interfaces
export interface PersonalDocument {
  id: string;
  type:
    | "INE"
    | "contrato"
    | "NSS"
    | "RFC"
    | "examen_medico"
    | "capacitacion"
    | "otro";
  name: string;
  url: string;
  expirationDate?: Date;
  uploadDate: Date;
}

export interface PersonalProfile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: Date;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  employmentInfo: {
    employeeNumber: string;
    position:
      | "vigilante"
      | "conserje"
      | "jardinero"
      | "limpieza"
      | "mantenimiento"
      | "administrador";
    area: string;
    startDate: Date;
    contractType: "tiempo_completo" | "medio_tiempo" | "temporal" | "por_horas";
    salary: number;
    status: "activo" | "inactivo" | "suspendido" | "vacaciones";
    pin: string; // PIN de 4 dígitos para asistencia
  };
  photo?: string;
  documents: PersonalDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkShift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: "regular" | "nocturno" | "guardia" | "extra";
  status: "programado" | "completado" | "ausente" | "tardanza";
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  criteria: {
    punctuality: number; // 1-5
    taskCompletion: number; // 1-5
    residentRelations: number; // 1-5
    teamwork: number; // 1-5
    initiative: number; // 1-5;
  };
  overallScore: number;
  comments: string;
  improvementAreas: string[];
  goals: string[];
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  type: "rondin" | "mantenimiento" | "incidente" | "ticket" | "otro";
  description: string;
  area: string;
  timestamp: Date;
  evidence?: {
    photos: string[];
    documents: string[];
  };
  relatedModules?: {
    maintenanceId?: string;
    incidentId?: string;
    ticketId?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  type: "check-in" | "check-out";
  timestamp: Date;
  method: "qr" | "manual";
  qrId?: string;
}

export interface PersonalAdministrationState {
  // Personal
  employees: PersonalProfile[];
  selectedEmployee: PersonalProfile | null;

  // Turnos y asistencia
  shifts: WorkShift[];
  currentWeekShifts: WorkShift[];
  attendanceRecords: AttendanceRecord[];

  // Evaluaciones
  evaluations: PerformanceEvaluation[];

  // Bitácora
  activityLogs: ActivityLog[];

  // QR de asistencia
  activeQR: {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    active: boolean;
  } | null;

  // UI States
  loading: boolean;
  error: string | null;

  // Filtros y búsqueda
  filters: {
    position?: string;
    status?: string;
    area?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  searchTerm: string;
}

export interface PersonalAdministrationActions {
  // Personal CRUD
  addEmployee: (
    employee: Omit<PersonalProfile, "id" | "createdAt" | "updatedAt">,
    photoFile?: File
  ) => Promise<void>;
  updateEmployee: (
    id: string,
    updates: Partial<PersonalProfile>,
    photoFile?: File
  ) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => PersonalProfile | undefined;
  setSelectedEmployee: (employee: PersonalProfile | null) => void;
  fetchEmployees: () => Promise<void>;

  // Documentos
  addDocument: (
    employeeId: string,
    document: Omit<PersonalDocument, "id" | "uploadDate">,
    file?: File
  ) => Promise<void>;
  updateDocument: (
    employeeId: string,
    documentId: string,
    updates: Partial<PersonalDocument>
  ) => Promise<void>;
  deleteDocument: (employeeId: string, documentId: string) => Promise<void>;
  getExpiringDocuments: (
    days?: number
  ) => { employee: PersonalProfile; document: PersonalDocument }[];

  // Turnos y asistencia
  createShift: (shift: Omit<WorkShift, "id">) => void;
  updateShift: (id: string, updates: Partial<WorkShift>) => void;
  deleteShift: (id: string) => void;
  checkIn: (shiftId: string) => void;
  checkOut: (shiftId: string) => void;
  generateWeeklySchedule: (startDate: Date, employees: string[]) => void;
  getAttendanceReport: (
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) => WorkShift[];

  // Registros de asistencia
  fetchAttendanceRecords: (startDate?: Date, endDate?: Date) => Promise<void>;
  getAttendanceForEmployee: (
    employeeId: string,
    date: Date
  ) => AttendanceRecord[];
  getAttendanceForDay: (date: Date) => AttendanceRecord[];

  // QR Code para check-in/check-out
  generateAttendanceQR: () => Promise<string>;
  processQRCheckIn: (
    qrId: string,
    employeeNumber: string,
    pin: string
  ) => Promise<boolean>;
  processQRCheckOut: (
    qrId: string,
    employeeNumber: string,
    pin: string
  ) => Promise<boolean>;
  getQRAttendanceData: (qrId: string) => Promise<any>;
  getActiveQR: () => Promise<void>;
  deactivateQR: (qrId: string) => Promise<void>;

  // Evaluaciones
  createEvaluation: (
    evaluation: Omit<PerformanceEvaluation, "id" | "createdAt">
  ) => void;
  updateEvaluation: (
    id: string,
    updates: Partial<PerformanceEvaluation>
  ) => void;
  deleteEvaluation: (id: string) => void;
  getEmployeeEvaluations: (employeeId: string) => PerformanceEvaluation[];

  // Bitácora
  addActivityLog: (log: Omit<ActivityLog, "id">) => void;
  getActivityLogs: (
    employeeId?: string,
    type?: string,
    startDate?: Date,
    endDate?: Date
  ) => ActivityLog[];

  // Reportes
  generateAttendanceReport: (startDate: Date, endDate: Date) => any;
  generatePerformanceReport: (employeeId?: string) => any;

  // Filtros y búsqueda
  setFilters: (
    filters: Partial<PersonalAdministrationState["filters"]>
  ) => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;

  // Utilidades
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredEmployees: () => PersonalProfile[];

  // Firebase paths
  getEmployeesCollectionPath: (
    clientId: string,
    condominiumId: string
  ) => string;
  getEmployeeStoragePath: (
    clientId: string,
    condominiumId: string,
    employeeId: string
  ) => string;
}

export type PersonalAdministrationStore = PersonalAdministrationState &
  PersonalAdministrationActions;

export const usePersonalAdministrationStore =
  create<PersonalAdministrationStore>()((set, get) => ({
    // Estado inicial
    employees: [],
    selectedEmployee: null,
    shifts: [],
    currentWeekShifts: [],
    attendanceRecords: [],
    evaluations: [],
    activityLogs: [],
    activeQR: null,
    loading: false,
    error: null,
    filters: {},
    searchTerm: "",

    // Firebase paths helpers
    getEmployeesCollectionPath: (clientId: string, condominiumId: string) => {
      return `clients/${clientId}/condominiums/${condominiumId}/employees`;
    },

    getEmployeeStoragePath: (
      clientId: string,
      condominiumId: string,
      employeeId: string
    ) => {
      return `clients/${clientId}/condominiums/${condominiumId}/employees/${employeeId}`;
    },

    // Fetch employees from Firestore
    fetchEmployees: async () => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeesRef = collection(db, collectionPath);
        const querySnapshot = await getDocs(employeesRef);

        const employees: PersonalProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          employees.push({
            ...data,
            id: doc.id,
            createdAt: safeFirestoreDate(data.createdAt),
            updatedAt: safeFirestoreDate(data.updatedAt),
            personalInfo: {
              firstName: data.personalInfo?.firstName || "",
              lastName: data.personalInfo?.lastName || "",
              email: data.personalInfo?.email || "",
              phone: data.personalInfo?.phone || "",
              address: data.personalInfo?.address || "",
              birthDate: safeFirestoreDate(data.personalInfo?.birthDate),
              emergencyContact: {
                name: data.personalInfo?.emergencyContact?.name || "",
                phone: data.personalInfo?.emergencyContact?.phone || "",
                relationship:
                  data.personalInfo?.emergencyContact?.relationship || "",
              },
            },
            employmentInfo: {
              employeeNumber: data.employmentInfo?.employeeNumber || "",
              position: data.employmentInfo?.position || "vigilante",
              area: data.employmentInfo?.area || "",
              startDate: safeFirestoreDate(data.employmentInfo?.startDate),
              contractType:
                data.employmentInfo?.contractType || "tiempo_completo",
              salary: centsToPesos(data.employmentInfo?.salary || 0), // Convertir de centavos a pesos
              status: data.employmentInfo?.status || "activo",
              pin: data.employmentInfo?.pin || "",
            },
            photo: data.photo || "",
            documents: Array.isArray(data.documents)
              ? data.documents.map((doc: any) => ({
                  ...doc,
                  uploadDate: safeFirestoreDate(doc.uploadDate),
                  expirationDate: safeOptionalDate(doc.expirationDate),
                }))
              : [],
          } as PersonalProfile);
        });

        set({ employees, loading: false });
      } catch (error) {
        console.error("Error fetching employees:", error);
        set({ error: "Error al cargar empleados", loading: false });
      }
    },

    // Personal CRUD
    addEmployee: async (employeeData, photoFile) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeesRef = collection(db, collectionPath);

        // Subir foto si se proporciona
        let photoUrl = employeeData.photo || "";
        if (photoFile) {
          const storagePath = `clients/${clientId}/condominiums/${condominiumId}/employees/photos/${uuidv4()}_${
            photoFile.name
          }`;
          const storageRef = ref(storage, storagePath);

          const snapshot = await uploadBytes(storageRef, photoFile);
          photoUrl = await getDownloadURL(snapshot.ref);
        }

        // Preparar datos del empleado evitando valores undefined
        const newEmployee = {
          personalInfo: {
            firstName: employeeData.personalInfo.firstName || "",
            lastName: employeeData.personalInfo.lastName || "",
            email: employeeData.personalInfo.email || "",
            phone: employeeData.personalInfo.phone || "",
            address: employeeData.personalInfo.address || "",
            birthDate: safeDate(employeeData.personalInfo.birthDate),
            emergencyContact: {
              name: employeeData.personalInfo.emergencyContact?.name || "",
              phone: employeeData.personalInfo.emergencyContact?.phone || "",
              relationship:
                employeeData.personalInfo.emergencyContact?.relationship || "",
            },
          },
          employmentInfo: {
            employeeNumber: employeeData.employmentInfo.employeeNumber || "",
            position: employeeData.employmentInfo.position || "vigilante",
            area: employeeData.employmentInfo.area || "",
            startDate: safeDate(employeeData.employmentInfo.startDate),
            contractType:
              employeeData.employmentInfo.contractType || "tiempo_completo",
            salary: Math.round((employeeData.employmentInfo.salary || 0) * 100), // Convertir a centavos
            status: employeeData.employmentInfo.status || "activo",
            pin: employeeData.employmentInfo.pin || "",
          },
          photo: photoUrl,
          documents: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Sanitizar datos para Firestore
        const sanitizedEmployee = sanitizeForFirestore(newEmployee);

        const docRef = await addDoc(employeesRef, sanitizedEmployee);

        const employeeWithId: PersonalProfile = {
          ...newEmployee,
          id: docRef.id,
          employmentInfo: {
            ...newEmployee.employmentInfo,
            salary: centsToPesos(newEmployee.employmentInfo.salary), // Convertir de vuelta a pesos para el estado
          },
        };

        set((state) => ({
          employees: [...state.employees, employeeWithId],
          loading: false,
        }));

        get().addActivityLog({
          employeeId: docRef.id,
          type: "otro",
          description: `Nuevo empleado registrado: ${employeeData.personalInfo.firstName} ${employeeData.personalInfo.lastName}`,
          area: employeeData.employmentInfo.area || "Sin área",
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error adding employee:", error);
        set({ error: "Error al agregar empleado", loading: false });
      }
    },

    updateEmployee: async (id, updates, photoFile) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeeRef = doc(db, collectionPath, id);

        // Subir nueva foto si se proporciona
        let photoUrl = updates.photo;
        if (photoFile) {
          const storagePath = `clients/${clientId}/condominiums/${condominiumId}/employees/photos/${uuidv4()}_${
            photoFile.name
          }`;
          const storageRef = ref(storage, storagePath);

          const snapshot = await uploadBytes(storageRef, photoFile);
          photoUrl = await getDownloadURL(snapshot.ref);
        }

        // Preparar datos de actualización evitando valores undefined
        const updateData: any = {
          updatedAt: new Date(),
        };

        // Manejar información personal
        if (updates.personalInfo) {
          updateData.personalInfo = {};

          if (updates.personalInfo.firstName !== undefined) {
            updateData.personalInfo.firstName =
              updates.personalInfo.firstName || "";
          }
          if (updates.personalInfo.lastName !== undefined) {
            updateData.personalInfo.lastName =
              updates.personalInfo.lastName || "";
          }
          if (updates.personalInfo.email !== undefined) {
            updateData.personalInfo.email = updates.personalInfo.email || "";
          }
          if (updates.personalInfo.phone !== undefined) {
            updateData.personalInfo.phone = updates.personalInfo.phone || "";
          }
          if (updates.personalInfo.address !== undefined) {
            updateData.personalInfo.address =
              updates.personalInfo.address || "";
          }
          if (updates.personalInfo.birthDate !== undefined) {
            updateData.personalInfo.birthDate = safeDate(
              updates.personalInfo.birthDate
            );
          }
          if (updates.personalInfo.emergencyContact) {
            updateData.personalInfo.emergencyContact = {
              name: updates.personalInfo.emergencyContact.name || "",
              phone: updates.personalInfo.emergencyContact.phone || "",
              relationship:
                updates.personalInfo.emergencyContact.relationship || "",
            };
          }
        }

        // Manejar información laboral
        if (updates.employmentInfo) {
          updateData.employmentInfo = {};

          if (updates.employmentInfo.employeeNumber !== undefined) {
            updateData.employmentInfo.employeeNumber =
              updates.employmentInfo.employeeNumber || "";
          }
          if (updates.employmentInfo.position !== undefined) {
            updateData.employmentInfo.position =
              updates.employmentInfo.position || "vigilante";
          }
          if (updates.employmentInfo.area !== undefined) {
            updateData.employmentInfo.area = updates.employmentInfo.area || "";
          }
          if (updates.employmentInfo.startDate !== undefined) {
            updateData.employmentInfo.startDate = safeDate(
              updates.employmentInfo.startDate
            );
          }
          if (updates.employmentInfo.contractType !== undefined) {
            updateData.employmentInfo.contractType =
              updates.employmentInfo.contractType || "tiempo_completo";
          }
          if (updates.employmentInfo.salary !== undefined) {
            updateData.employmentInfo.salary = Math.round(
              (updates.employmentInfo.salary || 0) * 100
            ); // Convertir a centavos
          }
          if (updates.employmentInfo.status !== undefined) {
            updateData.employmentInfo.status =
              updates.employmentInfo.status || "activo";
          }
          if (updates.employmentInfo.pin !== undefined) {
            updateData.employmentInfo.pin = updates.employmentInfo.pin || "";
          }
        }

        // Manejar foto
        if (photoUrl !== undefined) {
          updateData.photo = photoUrl || "";
        }

        // Sanitizar datos para Firestore
        const sanitizedUpdateData = sanitizeForFirestore(updateData);

        await updateDoc(employeeRef, sanitizedUpdateData);

        // Preparar datos para el estado local (convertir salario de vuelta a pesos)
        const stateUpdateData = { ...updateData };
        if (stateUpdateData.employmentInfo?.salary !== undefined) {
          stateUpdateData.employmentInfo.salary = centsToPesos(
            stateUpdateData.employmentInfo.salary
          );
        }

        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...stateUpdateData } : emp
          ),
          selectedEmployee:
            state.selectedEmployee?.id === id
              ? { ...state.selectedEmployee, ...stateUpdateData }
              : state.selectedEmployee,
          loading: false,
        }));
      } catch (error) {
        console.error("Error updating employee:", error);
        set({ error: "Error al actualizar empleado", loading: false });
      }
    },

    deleteEmployee: async (id) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeeRef = doc(db, collectionPath, id);

        // Delete employee documents from storage
        const employee = get().employees.find((emp) => emp.id === id);
        if (employee?.documents) {
          for (const document of employee.documents) {
            if (document.url) {
              try {
                const storageRef = ref(storage, document.url);
                await deleteObject(storageRef);
              } catch (error) {
                console.warn("Error deleting document from storage:", error);
              }
            }
          }
        }

        await deleteDoc(employeeRef);

        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
          selectedEmployee:
            state.selectedEmployee?.id === id ? null : state.selectedEmployee,
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting employee:", error);
        set({ error: "Error al eliminar empleado", loading: false });
      }
    },

    getEmployee: (id) => {
      const { employees } = get();
      return employees.find((emp) => emp.id === id);
    },

    setSelectedEmployee: (employee) => {
      set({ selectedEmployee: employee });
    },

    // Documentos
    addDocument: async (employeeId, documentData, file) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        let documentUrl = documentData.url;

        // Upload file to storage if provided
        if (file) {
          const storagePath = get().getEmployeeStoragePath(
            clientId,
            condominiumId,
            employeeId
          );
          const fileName = `${uuidv4()}_${file.name}`;
          const storageRef = ref(storage, `${storagePath}/${fileName}`);

          const snapshot = await uploadBytes(storageRef, file);
          documentUrl = await getDownloadURL(snapshot.ref);
        }

        const newDocument: PersonalDocument = {
          id: uuidv4(),
          type: documentData.type,
          name: documentData.name || "",
          url: documentUrl,
          uploadDate: new Date(),
          expirationDate: safeOptionalDate(documentData.expirationDate),
        };

        // Sanitizar el documento para Firestore
        const sanitizedDocument = sanitizeForFirestore(newDocument);

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeeRef = doc(db, collectionPath, employeeId);
        const employeeDoc = await getDoc(employeeRef);

        if (employeeDoc.exists()) {
          const currentDocuments = employeeDoc.data().documents || [];
          await updateDoc(employeeRef, {
            documents: [...currentDocuments, sanitizedDocument],
            updatedAt: new Date(),
          });

          set((state) => ({
            employees: state.employees.map((emp) =>
              emp.id === employeeId
                ? {
                    ...emp,
                    documents: [...emp.documents, sanitizedDocument],
                    updatedAt: new Date(),
                  }
                : emp
            ),
            loading: false,
          }));

          get().addActivityLog({
            employeeId,
            type: "otro",
            description: `Documento agregado: ${documentData.name}`,
            area: "Recursos Humanos",
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Error adding document:", error);
        set({ error: "Error al agregar documento", loading: false });
      }
    },

    updateDocument: async (employeeId, documentId, updates) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeeRef = doc(db, collectionPath, employeeId);
        const employeeDoc = await getDoc(employeeRef);

        if (employeeDoc.exists()) {
          const currentDocuments = employeeDoc.data().documents || [];
          const updatedDocuments = currentDocuments.map((doc: any) =>
            doc.id === documentId ? { ...doc, ...updates } : doc
          );

          await updateDoc(employeeRef, {
            documents: updatedDocuments,
            updatedAt: new Date(),
          });

          set((state) => ({
            employees: state.employees.map((emp) =>
              emp.id === employeeId
                ? {
                    ...emp,
                    documents: emp.documents.map((doc) =>
                      doc.id === documentId ? { ...doc, ...updates } : doc
                    ),
                    updatedAt: new Date(),
                  }
                : emp
            ),
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Error updating document:", error);
        set({ error: "Error al actualizar documento", loading: false });
      }
    },

    deleteDocument: async (employeeId, documentId) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Find and delete file from storage
        const employee = get().employees.find((emp) => emp.id === employeeId);
        const document = employee?.documents.find(
          (doc) => doc.id === documentId
        );

        if (document?.url) {
          try {
            const storageRef = ref(storage, document.url);
            await deleteObject(storageRef);
          } catch (error) {
            console.warn("Error deleting document from storage:", error);
          }
        }

        const collectionPath = get().getEmployeesCollectionPath(
          clientId,
          condominiumId
        );
        const employeeRef = doc(db, collectionPath, employeeId);
        const employeeDoc = await getDoc(employeeRef);

        if (employeeDoc.exists()) {
          const currentDocuments = employeeDoc.data().documents || [];
          const filteredDocuments = currentDocuments.filter(
            (doc: any) => doc.id !== documentId
          );

          await updateDoc(employeeRef, {
            documents: filteredDocuments,
            updatedAt: new Date(),
          });

          set((state) => ({
            employees: state.employees.map((emp) =>
              emp.id === employeeId
                ? {
                    ...emp,
                    documents: emp.documents.filter(
                      (doc) => doc.id !== documentId
                    ),
                    updatedAt: new Date(),
                  }
                : emp
            ),
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        set({ error: "Error al eliminar documento", loading: false });
      }
    },

    getExpiringDocuments: (days = 30) => {
      const { employees } = get();
      const expiringDocs: {
        employee: PersonalProfile;
        document: PersonalDocument;
      }[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      employees.forEach((employee) => {
        employee.documents.forEach((document) => {
          if (
            document.expirationDate &&
            document.expirationDate <= cutoffDate
          ) {
            expiringDocs.push({ employee, document });
          }
        });
      });

      return expiringDocs;
    },

    // Turnos y asistencia
    createShift: (shiftData) => {
      const newShift: WorkShift = {
        ...shiftData,
        id: uuidv4(),
        date: safeDate(shiftData.date),
        checkInTime: shiftData.checkInTime
          ? safeOptionalDate(shiftData.checkInTime)
          : undefined,
        checkOutTime: shiftData.checkOutTime
          ? safeOptionalDate(shiftData.checkOutTime)
          : undefined,
      };

      set((state) => ({
        shifts: [...state.shifts, newShift],
      }));

      get().addActivityLog({
        employeeId: shiftData.employeeId,
        type: "otro",
        description: `Turno programado: ${shiftData.startTime} - ${shiftData.endTime}`,
        area: "Recursos Humanos",
        timestamp: new Date(),
      });
    },

    updateShift: (id, updates) => {
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift.id === id ? { ...shift, ...updates } : shift
        ),
      }));
    },

    deleteShift: (id) => {
      set((state) => ({
        shifts: state.shifts.filter((shift) => shift.id !== id),
      }));
    },

    checkIn: (shiftId) => {
      get().updateShift(shiftId, {
        checkInTime: new Date(),
        status: "completado",
      });
    },

    checkOut: (shiftId) => {
      get().updateShift(shiftId, {
        checkOutTime: new Date(),
      });
    },

    generateWeeklySchedule: (startDate, employeeIds) => {
      const shifts: WorkShift[] = [];
      const days = 7;
      const baseDate = moment(startDate);

      for (let day = 0; day < days; day++) {
        const shiftDate = baseDate.clone().add(day, "days").toDate();

        employeeIds.forEach((employeeId) => {
          const shift: WorkShift = {
            id: uuidv4(),
            employeeId,
            date: shiftDate,
            startTime: "08:00",
            endTime: "16:00",
            type: "regular",
            status: "programado",
          };
          shifts.push(shift);
        });
      }

      set((state) => ({
        shifts: [...state.shifts, ...shifts],
        currentWeekShifts: shifts,
      }));
    },

    getAttendanceReport: (employeeId, startDate, endDate) => {
      const { shifts } = get();
      const start = moment(startDate);
      const end = moment(endDate);

      return shifts.filter((shift) => {
        const shiftDate = moment(shift.date);
        return (
          shift.employeeId === employeeId &&
          shiftDate.isSameOrAfter(start, "day") &&
          shiftDate.isSameOrBefore(end, "day")
        );
      });
    },

    // Evaluaciones
    createEvaluation: (evaluationData) => {
      const overallScore =
        Object.values(evaluationData.criteria).reduce(
          (sum, score) => sum + score,
          0
        ) / 5;

      const newEvaluation: PerformanceEvaluation = {
        ...evaluationData,
        id: uuidv4(),
        overallScore,
        period: {
          startDate: safeDate(evaluationData.period.startDate),
          endDate: safeDate(evaluationData.period.endDate),
        },
        createdAt: new Date(),
      };

      set((state) => ({
        evaluations: [...state.evaluations, newEvaluation],
      }));

      get().addActivityLog({
        employeeId: evaluationData.employeeId,
        type: "otro",
        description: `Nueva evaluación de desempeño registrada (Puntuación: ${overallScore.toFixed(
          1
        )}/5)`,
        area: "Recursos Humanos",
        timestamp: new Date(),
      });
    },

    updateEvaluation: (id, updates) => {
      set((state) => ({
        evaluations: state.evaluations.map((evaluation) =>
          evaluation.id === id ? { ...evaluation, ...updates } : evaluation
        ),
      }));
    },

    deleteEvaluation: (id) => {
      set((state) => ({
        evaluations: state.evaluations.filter(
          (evaluation) => evaluation.id !== id
        ),
      }));
    },

    getEmployeeEvaluations: (employeeId) => {
      const { evaluations } = get();
      return evaluations.filter(
        (evaluation) => evaluation.employeeId === employeeId
      );
    },

    // Bitácora
    addActivityLog: (logData) => {
      const newLog: ActivityLog = {
        ...logData,
        id: uuidv4(),
      };

      set((state) => ({
        activityLogs: [...state.activityLogs, newLog],
      }));
    },

    getActivityLogs: (employeeId, type, startDate, endDate) => {
      const { activityLogs } = get();
      return activityLogs.filter((log) => {
        const matchesEmployee = !employeeId || log.employeeId === employeeId;
        const matchesType = !type || log.type === type;

        let matchesStartDate = true;
        let matchesEndDate = true;

        if (startDate) {
          const start = moment(startDate);
          const logDate = moment(log.timestamp);
          matchesStartDate = logDate.isSameOrAfter(start, "day");
        }

        if (endDate) {
          const end = moment(endDate);
          const logDate = moment(log.timestamp);
          matchesEndDate = logDate.isSameOrBefore(end, "day");
        }

        return (
          matchesEmployee && matchesType && matchesStartDate && matchesEndDate
        );
      });
    },

    // Reportes
    generateAttendanceReport: (startDate, endDate) => {
      const { shifts, employees } = get();
      const start = moment(startDate);
      const end = moment(endDate);

      const filteredShifts = shifts.filter((shift) => {
        const shiftDate = moment(shift.date);
        return (
          shiftDate.isSameOrAfter(start, "day") &&
          shiftDate.isSameOrBefore(end, "day")
        );
      });

      const reportData = employees.map((employee) => {
        const employeeShifts = filteredShifts.filter(
          (shift) => shift.employeeId === employee.id
        );

        const completedShifts = employeeShifts.filter(
          (shift) => shift.status === "completado"
        ).length;
        const absentShifts = employeeShifts.filter(
          (shift) => shift.status === "ausente"
        ).length;
        const lateShifts = employeeShifts.filter(
          (shift) => shift.status === "tardanza"
        ).length;

        return {
          employee,
          totalShifts: employeeShifts.length,
          completedShifts,
          absentShifts,
          lateShifts,
          attendanceRate:
            employeeShifts.length > 0
              ? (completedShifts / employeeShifts.length) * 100
              : 0,
        };
      });

      return reportData;
    },

    generatePerformanceReport: (employeeId) => {
      const { evaluations, employees } = get();
      const filteredEvaluations = employeeId
        ? evaluations.filter(
            (evaluation) => evaluation.employeeId === employeeId
          )
        : evaluations;

      if (employeeId) {
        const employee = employees.find((emp) => emp.id === employeeId);
        const employeeEvaluations = filteredEvaluations;

        if (employeeEvaluations.length === 0) return null;

        const averageScore =
          employeeEvaluations.reduce(
            (sum, evaluation) => sum + evaluation.overallScore,
            0
          ) / employeeEvaluations.length;

        return {
          employee,
          evaluations: employeeEvaluations,
          averageScore,
          totalEvaluations: employeeEvaluations.length,
        };
      } else {
        return employees.map((employee) => {
          const employeeEvaluations = filteredEvaluations.filter(
            (evaluation) => evaluation.employeeId === employee.id
          );

          const averageScore =
            employeeEvaluations.length > 0
              ? employeeEvaluations.reduce(
                  (sum, evaluation) => sum + evaluation.overallScore,
                  0
                ) / employeeEvaluations.length
              : 0;

          return {
            employee,
            averageScore,
            totalEvaluations: employeeEvaluations.length,
          };
        });
      }
    },

    // Filtros y búsqueda
    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      }));
    },

    setSearchTerm: (term) => {
      set({ searchTerm: term });
    },

    clearFilters: () => {
      set({ filters: {}, searchTerm: "" });
    },

    // Utilidades
    setLoading: (loading) => {
      set({ loading });
    },

    setError: (error) => {
      set({ error });
    },

    getFilteredEmployees: () => {
      const { employees, filters, searchTerm } = get();

      return employees.filter((employee) => {
        const matchesSearch =
          !searchTerm ||
          employee.personalInfo.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.personalInfo.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.personalInfo.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.employmentInfo.position
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesPosition =
          !filters.position ||
          employee.employmentInfo.position === filters.position;
        const matchesStatus =
          !filters.status || employee.employmentInfo.status === filters.status;
        const matchesArea =
          !filters.area || employee.employmentInfo.area === filters.area;

        return matchesSearch && matchesPosition && matchesStatus && matchesArea;
      });
    },

    // QR Code para check-in/check-out
    generateAttendanceQR: async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Desactivar QR anterior si existe
        const currentActiveQR = get().activeQR;
        if (currentActiveQR) {
          await get().deactivateQR(currentActiveQR.id);
        }

        // Crear documento QR en Firestore
        const qrRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR`
        );

        // Calcular fecha de expiración: 15 días a partir de ahora
        const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const createdAt = new Date();

        const qrData = {
          clientId,
          condominiumId,
          createdAt,
          expiresAt,
          active: true,
          type: "attendance",
          createdBy: user.uid,
        };

        const docRef = await addDoc(qrRef, qrData);

        // Actualizar con el ID del documento
        await updateDoc(docRef, { qrId: docRef.id });

        // Actualizar estado local
        set({
          activeQR: {
            id: docRef.id,
            expiresAt,
            createdAt,
            active: true,
          },
        });

        return docRef.id;
      } catch (error) {
        console.error("Error generating attendance QR:", error);
        throw error;
      }
    },

    getActiveQR: async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId || !condominiumId) return;

        // Buscar QR activo
        const qrRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR`
        );
        const q = query(qrRef, where("active", "==", true));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Ordenar por createdAt en memoria y tomar el más reciente
          const qrDocs = querySnapshot.docs
            .map((doc) => ({ doc, data: doc.data() }))
            .sort((a, b) => {
              const aDate = safeFirestoreDate(a.data.createdAt);
              const bDate = safeFirestoreDate(b.data.createdAt);
              return bDate.getTime() - aDate.getTime();
            });

          if (qrDocs.length > 0) {
            const { doc: qrDoc, data: qrData } = qrDocs[0];

            // Verificar si no ha expirado
            const expiresAt = safeFirestoreDate(qrData.expiresAt);
            const now = new Date();

            if (expiresAt > now) {
              set({
                activeQR: {
                  id: qrDoc.id,
                  expiresAt,
                  createdAt: safeFirestoreDate(qrData.createdAt),
                  active: true,
                },
              });
            } else {
              // QR expirado, desactivar
              await updateDoc(qrDoc.ref, { active: false });
              set({ activeQR: null });
            }
          }
        } else {
          set({ activeQR: null });
        }
      } catch (error) {
        console.error("Error getting active QR:", error);
      }
    },

    deactivateQR: async (qrId: string) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const qrRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR`,
          qrId
        );
        await updateDoc(qrRef, { active: false });

        set({ activeQR: null });
      } catch (error) {
        console.error("Error deactivating QR:", error);
        throw error;
      }
    },

    processQRCheckIn: async (
      qrId: string,
      employeeNumber: string,
      pin: string
    ) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Verificar QR válido
        const qrRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR`,
          qrId
        );
        const qrDoc = await getDoc(qrRef);

        if (!qrDoc.exists()) {
          throw new Error("Código QR no válido");
        }

        const qrData = qrDoc.data();
        if (!qrData.active || new Date() > qrData.expiresAt.toDate()) {
          throw new Error("Código QR expirado");
        }

        // Buscar empleado por número
        const employees = get().employees;
        const employee = employees.find(
          (emp) =>
            emp.employmentInfo.employeeNumber === employeeNumber &&
            emp.employmentInfo.pin === pin
        );

        if (!employee) {
          throw new Error("Número de empleado o PIN incorrecto");
        }

        // Buscar turno activo para hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayShifts = get().shifts.filter((shift) => {
          const shiftDate = new Date(shift.date);
          return (
            shiftDate >= today &&
            shiftDate < tomorrow &&
            shift.employeeId === employee.id &&
            shift.status === "programado"
          );
        });

        if (todayShifts.length === 0) {
          throw new Error("No hay turnos programados para hoy");
        }

        // Hacer check-in en el primer turno programado
        const shift = todayShifts[0];
        get().updateShift(shift.id, {
          checkInTime: new Date(),
          status: "completado",
        });

        // Registrar en bitácora de asistencia
        const attendanceRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendance`
        );
        await addDoc(attendanceRef, {
          employeeId: employee.id,
          employeeNumber: employee.employmentInfo.employeeNumber,
          employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          type: "check-in",
          timestamp: new Date(),
          shiftId: shift.id,
          method: "qr",
        });

        // Registrar en bitácora general
        get().addActivityLog({
          employeeId: employee.id,
          type: "otro",
          description: `Check-in realizado vía QR - ${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          area: employee.employmentInfo.area,
          timestamp: new Date(),
        });

        return true;
      } catch (error) {
        console.error("Error processing QR check-in:", error);
        throw error;
      }
    },

    processQRCheckOut: async (
      qrId: string,
      employeeNumber: string,
      pin: string
    ) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Verificar QR válido
        const qrRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR`,
          qrId
        );
        const qrDoc = await getDoc(qrRef);

        if (!qrDoc.exists()) {
          throw new Error("Código QR no válido");
        }

        const qrData = qrDoc.data();
        if (!qrData.active || new Date() > qrData.expiresAt.toDate()) {
          throw new Error("Código QR expirado");
        }

        // Buscar empleado por número y PIN
        const employees = get().employees;
        const employee = employees.find(
          (emp) =>
            emp.employmentInfo.employeeNumber === employeeNumber &&
            emp.employmentInfo.pin === pin
        );

        if (!employee) {
          throw new Error("Número de empleado o PIN incorrecto");
        }

        // Buscar turno activo para hoy que ya tenga check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeShifts = get().shifts.filter((shift) => {
          const shiftDate = new Date(shift.date);
          return (
            shiftDate >= today &&
            shiftDate < tomorrow &&
            shift.employeeId === employee.id &&
            shift.status === "completado" &&
            shift.checkInTime &&
            !shift.checkOutTime
          );
        });

        if (activeShifts.length === 0) {
          throw new Error("No hay turnos activos para hacer check-out");
        }

        // Hacer check-out en el primer turno activo
        const shift = activeShifts[0];
        get().updateShift(shift.id, {
          checkOutTime: new Date(),
        });

        // Registrar en bitácora de asistencia
        const attendanceRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendance`
        );
        await addDoc(attendanceRef, {
          employeeId: employee.id,
          employeeNumber: employee.employmentInfo.employeeNumber,
          employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          type: "check-out",
          timestamp: new Date(),
          shiftId: shift.id,
          method: "qr",
        });

        // Registrar en bitácora general
        get().addActivityLog({
          employeeId: employee.id,
          type: "otro",
          description: `Check-out realizado vía QR - ${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          area: employee.employmentInfo.area,
          timestamp: new Date(),
        });

        return true;
      } catch (error) {
        console.error("Error processing QR check-out:", error);
        throw error;
      }
    },

    getQRAttendanceData: async (qrId: string) => {
      try {
        // Esta función será llamada desde una página pública
        // Retorna información básica para mostrar el formulario de check-in/out
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/attendance-qr/${qrId}`
        );

        if (!response.ok) {
          throw new Error("QR no válido o expirado");
        }

        return await response.json();
      } catch (error) {
        console.error("Error getting QR attendance data:", error);
        throw error;
      }
    },

    // Registros de asistencia
    fetchAttendanceRecords: async (startDate?: Date, endDate?: Date) => {
      try {
        set({ loading: true, error: null });

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");

        if (!clientId) throw new Error("No se encontró clientId en los claims");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const attendanceRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendance`
        );

        let q = query(attendanceRef, orderBy("timestamp", "desc"));

        // Aplicar filtros de fecha si se proporcionan
        if (startDate && endDate) {
          q = query(
            attendanceRef,
            where("timestamp", ">=", startDate),
            where("timestamp", "<=", endDate),
            orderBy("timestamp", "desc")
          );
        }

        const querySnapshot = await getDocs(q);
        const attendanceRecords: AttendanceRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          attendanceRecords.push({
            id: doc.id,
            employeeId: data.employeeId || "",
            employeeNumber: data.employeeNumber || "",
            employeeName: data.employeeName || "",
            type: data.type || "check-in",
            timestamp: safeFirestoreDate(data.timestamp),
            method: data.method || "manual",
            qrId: data.qrId,
          });
        });

        set({ attendanceRecords, loading: false });
      } catch (error) {
        console.error("Error fetching attendance records:", error);
        set({
          error: "Error al obtener registros de asistencia",
          loading: false,
        });
      }
    },

    getAttendanceForEmployee: (employeeId: string, date: Date) => {
      const { attendanceRecords } = get();
      return attendanceRecords.filter(
        (record) =>
          record.employeeId === employeeId &&
          record.timestamp.toDateString() === date.toDateString()
      );
    },

    getAttendanceForDay: (date: Date) => {
      const { attendanceRecords } = get();
      return attendanceRecords.filter(
        (record) => record.timestamp.toDateString() === date.toDateString()
      );
    },
  }));
