import { create } from "./createStore";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter as firestoreStartAfter,
  updateDoc,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { centsToPesos } from "../utils/curreyncy";

export interface PaymentVoucher {
  id: string;
  condominiumName: string;
  createdAt: any;
  departmentNumber: string;
  email: string;
  originalPhoneNumber: string;
  paymentProofUrl: string;
  phoneNumber: string;
  selectedChargeIds: string[];
  status: string;
  uploadedBy: string;
  userId: string;
  userName?: string;
  userLastName?: string;
  userEmail?: string;
  charges?: {
    concept: string;
    startAt: string;
    amount: number;
    chargeAmountReference?: number;
  }[];
}

export type PaymentVouchersState = {
  vouchers: PaymentVoucher[];
  loading: boolean;
  error: string | null;
  lastVoucherDoc: any | null;
  totalVouchers: number;
  pageSize?: number;
  startAfter?: any;
  filters?: { status?: string };

  fetchVouchers: (
    pageSize?: number,
    startAfter?: any,
    filters?: { status?: string }
  ) => Promise<number>;
  applyVoucher: (voucherId: string) => Promise<void>;
};

// Variable de caché para resultados de paginación
const vouchersCache: Record<
  string,
  { vouchers: PaymentVoucher[]; lastDoc: any }
> = {};

// Verificar si se debe ignorar el caché según localStorage
const shouldSkipCache = () => {
  const lastInvalidation = localStorage.getItem("vouchers_cache_invalidation");
  if (!lastInvalidation) return false;

  // Si se ha invalidado el caché en los últimos 5 segundos, ignorarlo
  const invalidationTime = parseInt(lastInvalidation, 10);
  const now = Date.now();
  return now - invalidationTime < 5000; // 5 segundos
};

export const usePaymentVouchersStore = create<PaymentVouchersState>()(
  (set, get) => ({
    vouchers: [],
    loading: false,
    error: null,
    lastVoucherDoc: null,
    totalVouchers: 0,

    fetchVouchers: async (
      pageSize = 20,
      startAfter = null,
      filters = {}
    ): Promise<number> => {
      set({ loading: true });
      try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuario no autenticado");
        }
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }

        // Generar llave para caché basada en filtros y cursor
        const cacheKey = JSON.stringify({
          filters,
          startAfter: startAfter ? startAfter.id : "first",
        });

        // Verificar si debemos ignorar el caché por completo (por una recarga forzada)
        const forceReload = shouldSkipCache();

        // Usar caché solo si no se aplican filtros y no estamos forzando recarga
        if (!forceReload && !filters.status && vouchersCache[cacheKey]) {
          const cached = vouchersCache[cacheKey];
          set({
            vouchers: cached.vouchers,
            lastVoucherDoc: cached.lastDoc,
            loading: false,
            totalVouchers: cached.vouchers.length,
          });
          return cached.vouchers.length;
        }

        // Si se solicita forzar recarga, limpiar todo el caché
        if (forceReload) {
          Object.keys(vouchersCache).forEach((key) => {
            delete vouchersCache[key];
          });
        }

        // Consulta base
        const vouchersQuery = query(
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/paymentsVouchers`
          ),
          orderBy("createdAt", "desc"),
          ...(startAfter ? [firestoreStartAfter(startAfter)] : []),
          limit(pageSize)
        );

        const vouchersSnapshot = await getDocs(vouchersQuery);
        let vouchers: PaymentVoucher[] = [];
        let lastDoc: any = null;

        // Procesar cada voucher
        for (const docSnap of vouchersSnapshot.docs) {
          const data = docSnap.data();

          // Obtener información del usuario
          const userDoc = await getDoc(
            doc(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/users/${data.userId}`
            )
          );
          const userData = userDoc.data();

          // Obtener información de los cargos
          const charges = await Promise.all(
            data.selectedChargeIds.map(async (chargeId: string) => {
              const chargeDoc = await getDoc(
                doc(
                  db,
                  `clients/${clientId}/condominiums/${condominiumId}/users/${data.userId}/charges/${chargeId}`
                )
              );
              const chargeData = chargeDoc.data();
              return {
                concept: chargeData?.concept || "Desconocido",
                startAt: chargeData?.startAt || "",
                amount: centsToPesos(chargeData?.amount || 0),
                chargeAmountReference: centsToPesos(
                  chargeData?.chargeAmountReference || chargeData?.amount || 0
                ),
              };
            })
          );

          const voucher: PaymentVoucher = {
            id: docSnap.id,
            condominiumName: data.condominiumName,
            createdAt: data.createdAt,
            departmentNumber: data.departmentNumber,
            email: data.email,
            originalPhoneNumber: data.originalPhoneNumber,
            paymentProofUrl: data.paymentProofUrl,
            phoneNumber: data.phoneNumber,
            selectedChargeIds: data.selectedChargeIds,
            status: data.status,
            uploadedBy: data.uploadedBy,
            userId: data.userId,
            userName: userData?.name,
            userLastName: userData?.lastName,
            userEmail: userData?.email,
            charges,
          };

          // Aplicar filtros
          if (filters.status && voucher.status !== filters.status) {
            continue;
          }

          vouchers.push(voucher);
          lastDoc = docSnap;
        }

        // Guardar en caché solo si no se aplican filtros y no forzamos recarga
        if (!forceReload && !filters.status) {
          vouchersCache[cacheKey] = {
            vouchers,
            lastDoc,
          };
        }

        set({
          vouchers,
          lastVoucherDoc: lastDoc,
          loading: false,
          totalVouchers: vouchers.length,
        });

        return vouchers.length;
      } catch (error: any) {
        console.error("Error fetching payment vouchers:", error);
        set({
          error: error.message || "Error fetching payment vouchers",
          loading: false,
        });
        return 0;
      }
    },

    applyVoucher: async (voucherId: string): Promise<void> => {
      try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuario no autenticado");
        }
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) {
          throw new Error("Condominio no seleccionado");
        }

        const voucherRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/paymentsVouchers/${voucherId}`
        );

        await updateDoc(voucherRef, {
          status: "applied",
          appliedAt: new Date().toISOString(),
          appliedBy: user.uid,
        });

        // Limpiar caché para forzar recarga
        Object.keys(vouchersCache).forEach((key) => {
          delete vouchersCache[key];
        });

        // Marcar invalidación en localStorage
        localStorage.setItem(
          "vouchers_cache_invalidation",
          Date.now().toString()
        );

        // Recargar los vouchers
        await get().fetchVouchers();
      } catch (error: any) {
        console.error("Error applying voucher:", error);
        throw error;
      }
    },
  })
);
