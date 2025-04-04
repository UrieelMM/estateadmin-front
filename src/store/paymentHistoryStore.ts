// paymentHistoryStore.ts

import { create } from "./createStore";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
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

// Se agregó la propiedad opcional creditUsed
export interface PaymentRecord {
  id: string;
  numberCondominium: string;
  month: string; // "YYYY-MM"
  amountPaid: number; // en pesos, float
  amountPending: number; // en pesos, float
  creditBalance: number; // en pesos, float
  creditUsed?: number; // NUEVO: crédito utilizado (en pesos, float)
  concept: string;
  paymentDate?: string;
  referenceAmount: number; // Monto original del cargo que no se modifica con los pagos
}

type PaymentHistoryState = {
  payments: PaymentRecord[];
  detailed: Record<string, PaymentRecord[]>;
  detailedByConcept: Record<string, Record<string, PaymentRecord[]>>;
  loading: boolean;
  error: string | null;
  selectedYear: string;

  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureBase64: string;

  // NUEVAS propiedades para saldo actual y monto pendiente
  currentCreditBalance: number;
  pendingAmount: number;

  fetchPayments: (selectedNumber: string, year?: string) => Promise<void>;
  setSelectedYear: (year: string) => void;
};

// Conviertes un valor (entero en centavos) a float en pesos
function centsToPesos(value: any): number {
  // Aseguramos parsear a entero
  const intVal = parseInt(value, 10);
  if (isNaN(intVal)) return 0;
  return intVal / 100; // ejemplo: 25520 => 255.20
}

// Convierte un Timestamp de Firestore a string en español
function timestampToSpanishString(ts: Timestamp): string {
  const d = ts.toDate();
  const day = d.getDate();
  const year = d.getFullYear();
  const monthName = d.toLocaleString("es-MX", { month: "long" });
  return `${day} de ${monthName} de ${year}`;
}

export const usePaymentHistoryStore = create<PaymentHistoryState>()((set) => ({
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
  currentCreditBalance: 0,
  pendingAmount: 0,

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
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", loading: false });
        return;
      }

      const db = getFirestore();

      // 1. Obtener datos de la administradora
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

      // 2. Buscar el usuario (condómino)
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
      const userData = userDoc.data();
      const userId = userDoc.id;
      // Se obtiene el saldo a favor actual directamente del usuario
      const currentCreditBalance = parseFloat(
        userData.totalCreditBalance || "0"
      );

      // 3. Cargar todos los cargos
      const chargesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges`
      );
      const chargesSnapshot = await getDocs(chargesRef);

      // Calcular el monto total de cargos usando referenceAmount
      let pendingAmount = 0;
      chargesSnapshot.docs.forEach((chargeDoc) => {
        const chargeData = chargeDoc.data();
        pendingAmount += centsToPesos(chargeData.referenceAmount || 0);
      });

      const yearToCheck = year || new Date().getFullYear().toString();
      const paymentRecords: PaymentRecord[] = [];

      // 4. Primero procesamos los cargos
      const chargesByMonth: Record<string, number> = {}; // Para almacenar la suma de referenceAmount por mes

      for (const chargeDoc of chargesSnapshot.docs) {
        const chargeData = chargeDoc.data();
        if (!chargeData.startAt || typeof chargeData.startAt !== "string")
          continue;
        if (!chargeData.startAt.startsWith(yearToCheck)) continue;

        // "YYYY-MM"
        const monthValue = chargeData.startAt.substring(0, 7);

        // Sumamos el referenceAmount al mes correspondiente
        if (!chargesByMonth[monthValue]) {
          chargesByMonth[monthValue] = 0;
        }
        chargesByMonth[monthValue] += centsToPesos(chargeData.referenceAmount);
      }

      // 5. Ahora procesamos los pagos
      for (const chargeDoc of chargesSnapshot.docs) {
        const chargeData = chargeDoc.data();
        if (!chargeData.startAt || typeof chargeData.startAt !== "string")
          continue;
        if (!chargeData.startAt.startsWith(yearToCheck)) continue;

        const monthValue = chargeData.startAt.substring(0, 7);
        const paymentsRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userId}/charges/${chargeDoc.id}/payments`
        );
        const paymentsSnapshot = await getDocs(paymentsRef);

        // Si no hay pagos, crear un registro con el cargo original
        if (paymentsSnapshot.empty) {
          const record: PaymentRecord = {
            id: chargeDoc.id,
            numberCondominium: selectedNumber,
            month: monthValue,
            amountPaid: 0,
            amountPending: centsToPesos(chargeData.amount),
            creditBalance: 0,
            creditUsed: 0,
            concept: chargeData.concept || "Sin concepto",
            referenceAmount: chargesByMonth[monthValue], // Usamos el total de cargos del mes
          };
          paymentRecords.push(record);
          continue;
        }

        // Si hay pagos, procesar cada uno
        paymentsSnapshot.forEach((paymentDoc) => {
          const paymentData = paymentDoc.data();

          let finalDateStr = "";
          if (paymentData.paymentDate) {
            if ((paymentData.paymentDate as any).toDate) {
              finalDateStr = timestampToSpanishString(
                paymentData.paymentDate as Timestamp
              );
            } else if (typeof paymentData.paymentDate === "string") {
              finalDateStr = paymentData.paymentDate;
            }
          }

          const record: PaymentRecord = {
            id: paymentDoc.id,
            numberCondominium: selectedNumber,
            month: monthValue,
            amountPaid: centsToPesos(paymentData.amountPaid),
            amountPending: centsToPesos(paymentData.amountPending),
            creditBalance: centsToPesos(paymentData.creditBalance),
            creditUsed: paymentData.creditUsed
              ? centsToPesos(paymentData.creditUsed)
              : 0,
            concept: chargeData.concept || "Sin concepto",
            paymentDate: finalDateStr,
            referenceAmount: chargesByMonth[monthValue], // Usamos el total de cargos del mes
          };

          paymentRecords.push(record);
        });
      }

      // 6. Agrupar por mes
      const detailed: Record<string, PaymentRecord[]> = {};
      paymentRecords.forEach((pr) => {
        const key = pr.month || "Desconocido";
        if (!detailed[key]) {
          detailed[key] = [];
        }
        detailed[key].push(pr);
      });
      // Forzar 12 meses
      for (let i = 1; i <= 12; i++) {
        const m = i.toString().padStart(2, "0");
        const key = `${yearToCheck}-${m}`;
        if (!detailed[key]) {
          detailed[key] = [];
        }
      }

      // 7. Agrupar por concepto
      const detailedByConcept: Record<
        string,
        Record<string, PaymentRecord[]>
      > = {};
      const conceptsSet = new Set<string>();
      paymentRecords.forEach((pr) => conceptsSet.add(pr.concept));

      conceptsSet.forEach((concept) => {
        detailedByConcept[concept] = {};
        for (let i = 1; i <= 12; i++) {
          const m = i.toString().padStart(2, "0");
          const key = `${yearToCheck}-${m}`;
          detailedByConcept[concept][key] = [];
        }
      });

      paymentRecords.forEach((pr) => {
        if (!detailedByConcept[pr.concept][pr.month]) {
          detailedByConcept[pr.concept][pr.month] = [];
        }
        detailedByConcept[pr.concept][pr.month].push(pr);
      });

      // 8. Setear estado incluyendo el saldo actual y el monto pendiente
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
        currentCreditBalance,
        pendingAmount,
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
