// usePaymentStore.ts

import { create } from "./createStore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import axios from "axios";
import * as Sentry from "@sentry/react";
import { syncWithAIContext } from "../services/aiContextService";

export type Charge = {
  id: string;
  concept: string;
  amount: number; // Monto pendiente a pagar (en pesos mexicanos, como float)
  month?: string;
  paid: boolean;
  invoiceRequired?: boolean;
  dueDate?: Date; // Para ordenar por fecha de vencimiento
  startAt?: string;
};

/**
 * Representa un pago de mantenimiento.
 * Los montos (amountPaid, amountPending, etc.) se capturan en pesos mexicanos
 * pero se enviarán al backend en centavos (int).
 */
export type MaintenancePayment = {
  email: string;
  numberCondominium: string;
  comments?: string;

  amountPaid: number; // en pesos
  amountPending: number; // en pesos

  file: File | File[] | null;
  chargeId?: string;
  month?: string;
  selectedCharges?: { chargeId: string; amount: number }[];
  creditBalance?: number;
  useCreditBalance?: boolean;
  paymentType?: string;

  // fecha de pago y cuenta financiera
  paymentDate?: string;
  financialAccountId?: string;

  // crédito utilizado (en pesos)
  creditUsed?: number;

  // Nuevo flag para indicar si es un pago no identificado
  isUnidentifiedPayment?: boolean;

  // Nuevo campo para indicar si el pago no identificado ya fue aplicado a un usuario
  appliedToUser?: boolean;

  // NUEVO: URL o valor del comprobante si ya existe
  attachmentPayment?: string;

  // ID del pago no identificado cuando se está aplicando
  id?: string;

  paymentGroupId?: string;

  startAts?: string[];
  startAt?: string;

  // Campos para conceptos de pago
  concepts?: string[];
};

type FinancialAccount = {
  id: string;
  name: string;
  type?: string;
};

type MaintenancePaymentState = {
  charges: Charge[];
  loading: boolean;
  error: string | null;
  userCreditBalance: number | null;

  financialAccounts: FinancialAccount[];
  fetchFinancialAccounts: () => Promise<void>;

  fetchUserCharges: (numberCondominium: string) => Promise<void>;
  addMaintenancePayment: (payment: MaintenancePayment) => Promise<void>;
  updateUnidentifiedPayment: (
    payment: MaintenancePayment,
    paymentId: string
  ) => Promise<void>;

  // NUEVO: Método separado para editar el pago no identificado
  editUnidentifiedPayment: (paymentId: string) => Promise<void>;
};

// Conviertes un monto en pesos mexicanos (float) a un entero en centavos
function toCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100);
}

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const usePaymentStore = create<MaintenancePaymentState>()(
  (set, get) => ({
    charges: [],
    loading: false,
    error: null,
    userCreditBalance: null,

    financialAccounts: [],
    fetchFinancialAccounts: async () => {
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
        const accRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
        );
        const snap = await getDocs(accRef);
        const accounts: FinancialAccount[] = snap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Sin nombre",
          type: doc.data().type || null,
        }));

        set({ financialAccounts: accounts, loading: false, error: null });
      } catch (error: any) {
        Sentry.captureException(error);
        set({
          error: error.message || "Error al obtener cuentas financieras",
          loading: false,
        });
      }
    },

    fetchUserCharges: async (numberCondominium) => {
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
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );
        const userQuery = query(
          usersRef,
          where("number", "==", numberCondominium)
        );
        const userSnap = await getDocs(userQuery);
        if (userSnap.empty) {
          throw new Error(
            `No se encontró un usuario con el número ${numberCondominium}`
          );
        }
        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();

        // Actualizar el saldo a favor
        set({ userCreditBalance: userData.totalCreditBalance || null });

        // Obtener los cargos no pagados
        const chargesRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users/${userDoc.id}/charges`
        );
        const chargesQuery = query(chargesRef, where("paid", "==", false));
        const chargesSnap = await getDocs(chargesQuery);

        const newCharges: Charge[] = chargesSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          let monthLabel = "";
          let dueDate: Date | undefined;
          let startAtStr = "";

          // Procesar startAt
          if (data.startAt) {
            let d: Date;
            if (data.startAt.toDate) {
              d = data.startAt.toDate();
            } else {
              d = new Date(data.startAt.replace(" ", "T"));
            }
            const year = d.getFullYear();
            const monthIndex = d.getMonth();
            const monthName = MONTH_NAMES_ES[monthIndex] || "";
            monthLabel = `${monthName} ${year}`;
            // Formatear startAt a "YYYY-MM-DD HH:mm"
            startAtStr = d.toISOString().slice(0, 16).replace("T", " ");
          }

          // Procesar dueDate
          if (data.dueDate) {
            dueDate = data.dueDate.toDate
              ? data.dueDate.toDate()
              : new Date(data.dueDate.replace(" ", "T"));
          }

          return {
            id: docSnap.id,
            concept: data.concept ?? "",
            amount: data.amount ?? 0,
            month: monthLabel,
            paid: data.paid ?? false,
            invoiceRequired: data.invoiceRequired ?? false,
            dueDate,
            startAt: startAtStr, // Se incluye startAt formateado
          };
        });

        set({ charges: newCharges, loading: false, error: null });
      } catch (error: any) {
        Sentry.captureException(error);
        set({
          error: error.message || "Error al obtener cargos",
          loading: false,
        });
      }
    },

    updateUnidentifiedPayment: async (payment, paymentId) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        const formData = new FormData();
        formData.append("paymentId", paymentId);
        formData.append("clientId", clientId);
        formData.append("numberCondominium", payment.numberCondominium || "");
        formData.append("condominiumId", condominiumId);
        formData.append("isUnidentifiedPayment", JSON.stringify(true));
        formData.append("appliedToUser", JSON.stringify(true));
        formData.append("amountPaid", "0");
        formData.append(
          "amountPending",
          String(toCents(payment.amountPending))
        );
        formData.append("paymentGroupId", payment.paymentGroupId || "");
        formData.append("paymentType", payment.paymentType || "");
        formData.append("creditUsed", "0");
        formData.append("paymentDate", payment.paymentDate || "");
        formData.append("financialAccountId", payment.financialAccountId || "");
        formData.append("attachmentPayment", payment.attachmentPayment || "");

        // POST al endpoint de pagos no identificados para actualizar
        await axios.post(
          `${
            import.meta.env.VITE_URL_SERVER
          }/maintenance-fees/create-unidentified`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        throw error;
      }
    },

    addMaintenancePayment: async (payment) => {
      set({ loading: true, error: null });
      try {
        if (!payment.paymentType) {
          throw new Error("El campo tipo de pago es obligatorio.");
        }

        // Formatear la fecha de pago al formato correcto
        let formattedPaymentDate = payment.paymentDate;
        if (payment.paymentDate) {
          const date = new Date(payment.paymentDate);
          if (!isNaN(date.getTime())) {
            // Asegurar que la hora sea 00:00:00
            date.setHours(0, 0, 0, 0);
            formattedPaymentDate = date
              .toISOString()
              .slice(0, 16)
              .replace("T", " ");
          }
        }

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Armamos el formData inicial
        const formData = new FormData();
        formData.append("clientId", clientId);
        formData.append("email", payment.email || "");
        formData.append("numberCondominium", payment.numberCondominium || "");
        formData.append("condominiumId", condominiumId);
        formData.append("comments", payment.comments || "");

        // Convertir a centavos
        const amountPaidCents = toCents(payment.amountPaid);
        const amountPendingCents = toCents(payment.amountPending);
        formData.append("amountPaid", String(amountPaidCents));
        formData.append("amountPending", String(amountPendingCents));

        const paymentGroupId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
        formData.append("paymentGroupId", paymentGroupId);

        formData.append(
          "useCreditBalance",
          payment.useCreditBalance ? "true" : "false"
        );
        formData.append("paymentType", payment.paymentType || "");
        formData.append(
          "creditUsed",
          payment.creditUsed ? String(toCents(payment.creditUsed)) : "0"
        );

        formData.append("paymentDate", formattedPaymentDate || "");
        formData.append("financialAccountId", payment.financialAccountId || "");

        // --- OJO: Aquí quitamos la línea que siempre ponía la URL de attachmentPayment ---
        //    formData.append("attachmentPayment", payment.attachmentPayment || "");

        // -----------------------------------------
        // CASO: PAGO NO IDENTIFICADO
        // -----------------------------------------
        if (payment.isUnidentifiedPayment) {
          formData.append("isUnidentifiedPayment", JSON.stringify(true));

          // Si existe un attachmentPayment (URL) y NO hay archivo, lo enviamos
          if (payment.attachmentPayment && !payment.file) {
            formData.append("attachmentPayment", payment.attachmentPayment);
          }

          // Determinar si es CREAR vs ACTUALIZAR
          if (payment.appliedToUser === true) {
            formData.set("amountPaid", "0");
            formData.set("appliedToUser", "true");
          } else {
            formData.append(
              "appliedToUser",
              JSON.stringify(payment.appliedToUser)
            );
          }

          if (payment.month) {
            formData.append("month", payment.month);
          }
          // NUEVO: Enviar la propiedad startAt(s) desde el componente
          if (payment.startAts) {
            formData.append("startAts", JSON.stringify(payment.startAts));
          } else if (payment.startAt) {
            formData.append("startAt", payment.startAt);
          }

          // Si subieron un archivo a "file", se adjunta como attachments
          if (payment.file) {
            if (Array.isArray(payment.file)) {
              formData.append("attachments", payment.file[0]);
            } else {
              formData.append("attachments", payment.file);
            }
          }

          // POST al endpoint de pagos NO identificados
          await axios.post(
            `${
              import.meta.env.VITE_URL_SERVER
            }/maintenance-fees/create-unidentified`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          set({ loading: false, error: null });
          return;
        }

        // -----------------------------------------
        // CASO: PAGO IDENTIFICADO (LÓGICA ORIGINAL)
        // -----------------------------------------
        const { charges } = get();

        // Multipago
        if (payment.selectedCharges && payment.selectedCharges.length > 0) {
          const totalSelectedCents = payment.selectedCharges.reduce(
            (sum, sc) => sum + toCents(sc.amount),
            0
          );

          if (!payment.useCreditBalance) {
            if (totalSelectedCents !== amountPaidCents) {
              throw new Error(
                "El monto abonado debe coincidir con la suma de los cargos asignados."
              );
            }
          }
          formData.append("creditBalance", "0");

          const enrichedSelected = payment.selectedCharges
            .map((sc) => {
              const foundCharge = charges.find((c) => c.id === sc.chargeId);
              const dueDateNum = foundCharge?.dueDate
                ? foundCharge.dueDate.getTime()
                : 0;
              return {
                ...sc,
                amount: toCents(sc.amount),
                dueDate: dueDateNum,
              };
            })
            .sort((a, b) => a.dueDate - b.dueDate);

          formData.append(
            "chargeAssignments",
            JSON.stringify(enrichedSelected)
          );
        }
        // Cargo único
        else if (payment.chargeId) {
          formData.append("chargeId", payment.chargeId);
          const foundCharge = charges.find((c) => c.id === payment.chargeId);
          if (foundCharge) {
            const chargeCents = toCents(foundCharge.amount);
            if (!payment.useCreditBalance && amountPaidCents > chargeCents) {
              const creditBalanceCents = amountPaidCents - chargeCents;
              payment.creditBalance = creditBalanceCents / 100;
              formData.append("creditBalance", String(creditBalanceCents));
            }
          }
        }

        if (payment.month) {
          formData.append("month", payment.month);
        }
        // NUEVO: Enviar la propiedad startAt(s) desde el componente
        if (payment.startAts) {
          formData.append("startAts", JSON.stringify(payment.startAts));
        } else if (payment.startAt) {
          formData.append("startAt", payment.startAt);
        }

        // Si existe un attachmentPayment y NO hay archivo, lo enviamos
        if (payment.attachmentPayment && !payment.file) {
          formData.append("attachmentPayment", payment.attachmentPayment);
        }

        // Si subieron un archivo a "file", se adjunta como attachments
        if (payment.file) {
          if (Array.isArray(payment.file)) {
            formData.append("attachments", payment.file[0]);
          } else {
            formData.append("attachments", payment.file);
          }
        }

        // POST al endpoint de pagos identificados
        await axios.post(
          `${import.meta.env.VITE_URL_SERVER}/maintenance-fees/create`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        // Si es un pago NO identificado que se está aplicando, llamamos updateUnidentifiedPayment
        if (payment.isUnidentifiedPayment && payment.id) {
          await get().updateUnidentifiedPayment(payment, payment.id);
        }

        // Recargar cargos asociados al usuario
        await get().fetchUserCharges(payment.numberCondominium);

        // MEJORADO: Sincronizar con el contexto de IA con detalles enriquecidos
        try {
          // Obtener información del condómino desde Firestore
          const db = getFirestore();
          const usersRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users`
          );
          const userQuery = query(
            usersRef,
            where("number", "==", payment.numberCondominium)
          );
          const userSnap = await getDocs(userQuery);

          let condominoInfo = {};
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            condominoInfo = {
              condominoNombre: userData.name || "No disponible",
              condominoEmail: userData.email || "No disponible",
              condominoNumero: userData.number || payment.numberCondominium,
              condominoTelefono: userData.phone || "No disponible",
              condominoTipo: userData.type || "Propietario",
            };
          }

          // Obtener detalles de los conceptos pagados
          let conceptosDetallados = "";
          let conceptosPagados: Array<{
            concepto: string;
            monto: number;
            mes: string;
          }> = [];

          if (payment.selectedCharges && payment.selectedCharges.length > 0) {
            const { charges } = get();

            // Asegurarnos de que los cargos estén disponibles
            if (charges && charges.length > 0) {
              conceptosPagados = payment.selectedCharges.map((sc) => {
                // Buscar el cargo correspondiente por ID
                const foundCharge = charges.find((c) => c.id === sc.chargeId);

                // Si encontramos el cargo, obtener su concepto
                if (foundCharge && foundCharge.concept) {
                  return {
                    concepto: foundCharge.concept,
                    monto: sc.amount,
                    mes: foundCharge.month || "No especificado",
                  };
                }

                // Si no lo encontramos o no tiene concepto, usar "Desconocido"
                console.warn(
                  `Cargo no encontrado o sin concepto: ${sc.chargeId}`
                );
                return {
                  concepto: "Desconocido",
                  monto: sc.amount,
                  mes: "No especificado",
                };
              });

              // Generar descripción detallada de los conceptos
              conceptosDetallados = conceptosPagados
                .map(
                  (cp) =>
                    `${cp.concepto} (${cp.mes}): $${cp.monto.toLocaleString(
                      "es-MX",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                )
                .join(", ");
            } else {
              console.warn("No se encontraron cargos para el usuario");

              // Si no hay cargos, usar los IDs al menos
              conceptosPagados = payment.selectedCharges.map((sc) => ({
                concepto:
                  payment.concepts?.find(
                    (_, i) => i === payment.selectedCharges?.indexOf(sc)
                  ) || "Desconocido",
                monto: sc.amount,
                mes: "No especificado",
              }));

              conceptosDetallados = conceptosPagados
                .map(
                  (cp) =>
                    `${
                      cp.concepto
                    } (No especificado): $${cp.monto.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                )
                .join(", ");
            }
          } else if (payment.chargeId) {
            const { charges } = get();
            const foundCharge = charges.find((c) => c.id === payment.chargeId);
            if (foundCharge) {
              conceptosPagados = [
                {
                  concepto: foundCharge.concept,
                  monto: foundCharge.amount,
                  mes: foundCharge.month || "No especificado",
                },
              ];
              conceptosDetallados = foundCharge.concept;
            }
          }

          // Registrar para debugging
          console.log("Cargos disponibles:", charges);
          console.log("Cargos seleccionados:", payment.selectedCharges);
          console.log("Conceptos obtenidos:", conceptosPagados);

          // Obtener el concepto principal del pago
          let conceptoPrincipal = "Cuota de mantenimiento";

          // Si hay conceptos especificados explícitamente en el formulario
          if (
            payment.concepts &&
            payment.concepts.length > 0 &&
            payment.concepts[0]
          ) {
            conceptoPrincipal = payment.concepts[0];
          }
          // Si no, buscar en los cargos seleccionados
          else if (conceptosPagados.length > 0) {
            if (conceptosPagados.length === 1) {
              // Si solo hay un concepto, usamos ese
              conceptoPrincipal = conceptosPagados[0].concepto;
            } else {
              // Si hay múltiples conceptos pero todos son iguales
              const todosIguales = conceptosPagados.every(
                (c) => c.concepto === conceptosPagados[0].concepto
              );
              if (todosIguales) {
                conceptoPrincipal = conceptosPagados[0].concepto;
              } else {
                // Si hay diferentes conceptos, crear una lista resumida
                const conceptosUnicos = [
                  ...new Set(conceptosPagados.map((c) => c.concepto)),
                ].filter((c) => c !== "Desconocido");
                if (conceptosUnicos.length > 0) {
                  if (conceptosUnicos.length === 1) {
                    conceptoPrincipal = conceptosUnicos[0];
                  } else if (conceptosUnicos.length <= 3) {
                    conceptoPrincipal = conceptosUnicos.join(", ");
                  } else {
                    conceptoPrincipal = `${conceptosUnicos
                      .slice(0, 2)
                      .join(", ")} y otros conceptos`;
                  }
                } else {
                  conceptoPrincipal = "Pago de múltiples conceptos";
                }
              }
            }
          }
          // Si es un pago no identificado y no hay concepto, mantener el predeterminado

          // Obtener información de la cuenta financiera
          let cuentaFinanciera = "No especificada";
          if (payment.financialAccountId) {
            const cuenta = get().financialAccounts.find(
              (a) => a.id === payment.financialAccountId
            );
            if (cuenta) {
              cuentaFinanciera = cuenta.name;
            }
          }

          const paymentData = {
            // Datos básicos del pago
            paymentDate: formattedPaymentDate,
            amountPaid: payment.amountPaid,
            concept: conceptoPrincipal,
            conceptosDetallados: conceptosDetallados || "No especificado",
            paymentGroupId: formData.get("paymentGroupId"),
            paymentType: payment.paymentType,
            currency: "MXN",
            usedCredit: payment.useCreditBalance ? payment.creditUsed : 0,
            comments: payment.comments,

            // Datos del condómino
            ...condominoInfo,

            // Datos financieros adicionales
            numeroCondominio: payment.numberCondominium,
            cuentaFinanciera,
            fechaRegistro: new Date().toISOString(),

            // Detalles de los conceptos pagados
            conceptosPagados:
              conceptosPagados.length > 0 ? conceptosPagados : undefined,
            detalleConceptos: conceptosDetallados || undefined,

            // Datos de pago adicionales
            isUnidentifiedPayment: payment.isUnidentifiedPayment || false,
            aplazado: false,
          };

          await syncWithAIContext(
            "payment",
            paymentData,
            clientId,
            condominiumId
          );
        } catch (syncError) {
          // Solo registrar el error, no afecta el flujo principal
          console.error("[AI Context] Error al sincronizar pago:", syncError);
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        Sentry.captureException(error);
        set({
          loading: false,
          error: error.message || "Error al registrar el pago/cargo",
        });
      }
    },

    // NUEVA FUNCIÓN para editar el pago no identificado con el NUEVO endpoint
    editUnidentifiedPayment: async (paymentId: string) => {
      set({ loading: true, error: null });
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const tokenResult = await getIdTokenResult(user);
        const clientId = tokenResult.claims["clientId"] as string;
        const condominiumId = localStorage.getItem("condominiumId");
        if (!condominiumId) throw new Error("Condominio no seleccionado");

        // Construimos los datos requeridos por el nuevo endpoint
        const data = {
          paymentId,
          clientId,
          condominiumId,
        };

        // PATCH al nuevo endpoint que sólo edita pagos no identificados
        await axios.patch(
          `${
            import.meta.env.VITE_URL_SERVER
          }/maintenance-fees/edit-unidentified`,
          data
        );

        // Listo. Si deseas, podrías refrescar algo aquí, pero no es obligatorio
        set({ loading: false, error: null });
      } catch (error: any) {
        Sentry.captureException(error);
        set({
          loading: false,
          error: error.message || "Error al editar el pago no identificado",
        });
        throw error;
      }
    },
  })
);
