// paymentHistoryStore.ts

import { create } from "zustand";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Función auxiliar para convertir una URL de imagen a base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

export interface PaymentRecord {
  id: string;
  numberCondominium: string;
  month: string; // se espera formato "YYYY-MM"
  amountPaid: number;
  amountPending: number;
  creditBalance: number;
  concept: string; // Nuevo campo para capturar el concepto
}

type PaymentHistoryState = {
  payments: PaymentRecord[];
  detailed: Record<string, PaymentRecord[]>; // agrupados por mes (clave: "YYYY-MM")
  detailedByConcept: Record<string, Record<string, PaymentRecord[]>>; // agrupados por concepto -> mes
  loading: boolean;
  error: string | null;
  selectedYear: string;

  // Datos de la empresa administradora (tomados de clients/${clientId})
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;

  // Logo y firma en base64
  logoBase64: string;
  signatureBase64: string;

  fetchPayments: (selectedNumber: string, year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
};

export const usePaymentHistoryStore = create<PaymentHistoryState>((set) => ({
  payments: [],
  detailed: {},
  detailedByConcept: {},
  loading: false,
  error: null,
  selectedYear: new Date().getFullYear().toString(),
  adminCompany: "",
  adminPhone: "",
  adminEmail: "",
  logoBase64: "",
  signatureBase64: "",

  fetchPayments: async (selectedNumber: string, year?: string) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        set({ error: "Usuario no autenticado", loading: false });
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;

      // Se obtiene el condominiumId guardado en localStorage
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      const db = getFirestore();

      // 1. Obtener datos de la empresa administradora (clients/${clientId})
      const clientDocRef = doc(db, "clients", clientId);
      const clientDocSnap = await getDoc(clientDocRef);

      let adminCompany = "";
      let adminPhone = "";
      let adminEmail = "";
      let logoBase64 = "";
      let signatureBase64 = "";

      if (clientDocSnap.exists()) {
        const clientData = clientDocSnap.data();
        adminCompany = clientData.companyName || "";
        adminPhone = clientData.phoneNumber || "";
        adminEmail = clientData.email || "";

        const logoUrl = clientData.logoReports || "";
        const signUrl = clientData.signReports || "";

        if (logoUrl) {
          logoBase64 = await getBase64FromUrl(logoUrl);
        }
        if (signUrl) {
          signatureBase64 = await getBase64FromUrl(signUrl);
        }
      }

      // 2. Buscar el usuario (condómino) por su número
      const usersRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users`
      );
      const userQuery = query(usersRef, where("number", "==", selectedNumber));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        set({ error: "Usuario no encontrado", loading: false });
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id;

      const paymentRecords: PaymentRecord[] = [];

      // 3. Consultar la colección de charges del usuario
      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
      );
      const chargesSnapshot = await getDocs(chargesRef);

      const yearToCheck = year || new Date().getFullYear().toString();

      // 4. Recorrer cada charge y consultar la subcolección payments
      for (const chargeDoc of chargesSnapshot.docs) {
        const chargeData = chargeDoc.data();

        // Filtramos únicamente los charges que tengan startAt perteneciente al año seleccionado
        if (!chargeData.startAt || typeof chargeData.startAt !== "string") continue;
        if (!chargeData.startAt.startsWith(yearToCheck)) continue;

        // Extraer el mes en formato "YYYY-MM"
        const monthValue = chargeData.startAt.substring(0, 7);

        // Subcolección payments
        const paymentsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges/${chargeDoc.id}/payments`
        );
        const paymentsSnapshot = await getDocs(paymentsRef);

        paymentsSnapshot.forEach((paymentDoc) => {
          const paymentData = paymentDoc.data();
          const record: PaymentRecord = {
            id: paymentDoc.id,
            numberCondominium: selectedNumber,
            month: monthValue,
            amountPaid: parseFloat(paymentData.amountPaid) || 0,
            amountPending: parseFloat(paymentData.amountPending) || 0,
            creditBalance: parseFloat(paymentData.creditBalance) || 0,
            concept: chargeData.concept || "Sin concepto",
          };
          paymentRecords.push(record);
        });
      }

      // 5. Agrupar los registros por mes (clave: "YYYY-MM")
      const detailed: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.month || "Desconocido";
        if (!detailed[key]) {
          detailed[key] = [];
        }
        detailed[key].push(pr);
      });

      // Asegurar 12 meses en detailed, incluso si no hay datos
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        const key = `${yearToCheck}-${m}`;
        if (!detailed[key]) {
          detailed[key] = [];
        }
      }

      // 6. Generar estructura adicional agrupada por concepto y por mes
      const detailedByConcept: Record<string, Record<string, PaymentRecord[]>> = {};

      // Todos los conceptos distintos
      const conceptsSet = new Set<string>();
      paymentRecords.forEach((pr) => {
        conceptsSet.add(pr.concept);
      });

      // Inicializar cada concepto con sus 12 meses
      conceptsSet.forEach((concept) => {
        detailedByConcept[concept] = {};
        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, "0");
          const key = `${yearToCheck}-${m}`;
          detailedByConcept[concept][key] = [];
        }
      });

      // Llenar con los registros correspondientes
      paymentRecords.forEach((pr) => {
        if (!detailedByConcept[pr.concept][pr.month]) {
          detailedByConcept[pr.concept][pr.month] = [];
        }
        detailedByConcept[pr.concept][pr.month].push(pr);
      });

      // 7. Actualizar el estado
      set({
        payments: paymentRecords,
        detailed,
        detailedByConcept,
        loading: false,
        adminCompany,
        adminPhone,
        adminEmail,
        logoBase64,
        signatureBase64,
      });
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      set({
        error: error.message || "Error fetching payments",
        loading: false,
      });
    }
  },

  setSelectedYear: (year: string) => set({ selectedYear: year }),
}));
