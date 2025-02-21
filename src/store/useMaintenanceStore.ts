import { create } from 'zustand';
import { getAuth, getIdTokenResult } from 'firebase/auth';
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
  orderBy
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type MaintenanceReport = {
  id?: string;
  fecha: Date;
  area: string;
  encargado: string;
  detalle: string;
  evidenciaUrl?: string;
};

export type MaintenanceReportFilters = {
  month?: number;  // se espera un valor entre 1 y 12
  year?: number;
  area?: string;
};

type MaintenanceReportState = {
  reports: MaintenanceReport[];
  loading: boolean;
  error: string | null;
  // Obtiene los reportes, pudiendo aplicar filtros por año, mes y área
  fetchReports: (filters?: MaintenanceReportFilters) => Promise<void>;
  // Crea un reporte. Se espera el objeto report sin id y sin evidenciaUrl (que se completa al subir el archivo)
  createReport: (
    report: Omit<MaintenanceReport, 'id' | 'evidenciaUrl'>,
    file?: File
  ) => Promise<void>;
  // Actualiza un reporte. Se puede enviar un nuevo archivo para reemplazar la evidencia
  updateReport: (
    reportId: string,
    data: Partial<Omit<MaintenanceReport, 'id'>>,
    file?: File
  ) => Promise<void>;
  // Elimina un reporte
  deleteReport: (reportId: string) => Promise<void>;
};

export const useMaintenanceReportStore = create<MaintenanceReportState>((set, get) => ({
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
      const reportsRef = collection(db, 'clients', clientId, 'condominiums', condominiumId, 'maintenanceReports');

      const constraints: any[] = [];
      if (filters) {
        if (filters.area) {
          constraints.push(where('area', '==', filters.area));
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
          constraints.push(where('fecha', '>=', start));
          constraints.push(where('fecha', '<=', end));
        }
      }

      let q;
      if (constraints.length > 0) {
        q = query(reportsRef, ...constraints, orderBy('fecha', 'desc'));
      } else {
        q = query(reportsRef, orderBy('fecha', 'desc'));
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
          evidenciaUrl: data.evidenciaUrl || '',
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

      let evidenciaUrl = '';
      if (file) {
        // Se sube el archivo PDF y se obtiene la URL pública
        const storageRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/maintenanceReports/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        evidenciaUrl = await getDownloadURL(storageRef);
      }

      const reportData = {
        ...report,
        evidenciaUrl,
      };

      const reportsRef = collection(db, 'clients', clientId, 'condominiums', condominiumId, 'maintenanceReports');
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

      let evidenciaUrl = data.evidenciaUrl || '';
      if (file) {
        const storageRef = ref(
          storage,
          `clients/${clientId}/condominiums/${condominiumId}/maintenanceReports/${Date.now()}_${file.name}`
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
        'clients',
        clientId,
        'condominiums',
        condominiumId,
        'maintenanceReports',
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
        'clients',
        clientId,
        'condominiums',
        condominiumId,
        'maintenanceReports',
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
}));
