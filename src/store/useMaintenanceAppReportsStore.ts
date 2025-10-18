import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import * as Sentry from "@sentry/react";

export interface MaintenanceAppReport {
  id?: string;
  condominiumId: string;
  condominiumName: string;
  createdAt: Timestamp;
  description: string;
  employeeId: string;
  employeeName: string;
  endDate: Timestamp;
  maintenanceUserId: string;
  maintenanceUserName: string;
  mediaUrls: string[];
  reportType: string;
  startDate: Timestamp;
  supervisor: string;
  title: string;
  updatedAt: Timestamp;
}

interface MaintenanceAppReportsStore {
  reports: MaintenanceAppReport[];
  loading: boolean;
  error: string | null;
  fetchReports: (condominiumId?: string) => Promise<void>;
  getReportsByDateRange: (
    startDate: Date,
    endDate: Date
  ) => MaintenanceAppReport[];
}

export const useMaintenanceAppReportsStore =
  create<MaintenanceAppReportsStore>()((set, get) => ({
    reports: [],
    loading: false,
    error: null,

    fetchReports: async (condominiumId?: string) => {
      try {
        set({ loading: true, error: null });
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          set({ error: "Usuario no autenticado", loading: false });
          return;
        }

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;

        if (!clientId) {
          set({ error: "No se pudo obtener el clientId", loading: false });
          return;
        }

        // Get condominiumId from parameter or localStorage
        const targetCondominiumId =
          condominiumId || localStorage.getItem("condominiumId");

        if (!targetCondominiumId) {
          set({ error: "No hay condominio seleccionado", loading: false });
          return;
        }

        const db = getFirestore();

        // Path: clients/{clientId}/condominiums/{condominiumId}/reportsMaintenanceApp
        const reportsRef = collection(
          db,
          "clients",
          clientId,
          "condominiums",
          targetCondominiumId,
          "reportsMaintenanceApp"
        );

        // Query ordered by createdAt descending
        const q = query(reportsRef, orderBy("createdAt", "desc"));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          set({ reports: [], loading: false });
          return;
        }

        const reports: MaintenanceAppReport[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as MaintenanceAppReport)
        );

        set({ reports, loading: false });
      } catch (error) {
        console.error("Error al obtener reportes de mantenimiento:", error);
        Sentry.captureException(error);
        set({
          error:
            "No se pudieron cargar los reportes. Por favor, inténtelo de nuevo más tarde.",
          loading: false,
        });
      }
    },

    getReportsByDateRange: (startDate: Date, endDate: Date) => {
      const { reports } = get();

      return reports.filter((report) => {
        const reportDate = report.createdAt.toDate();
        return reportDate >= startDate && reportDate <= endDate;
      });
    },
  }));
