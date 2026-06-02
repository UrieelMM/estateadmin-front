import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export const INITIAL_SETUP_STRIPE_PENDING_KEY = "initial_setup_stripe_pending";

export type InitialSetupMode =
  | "none"
  | "wizard"
  | "condominium_payment";

type InitialSetupStatus = {
  requiresInitialSetup: boolean;
  initialStep: number;
  mode: InitialSetupMode;
  clientId: string | null;
  condominiumId: string | null;
};

type InitialSubscriptionPaymentStatus = {
  hasPaidSubscription: boolean;
  hasPendingSubscription: boolean;
};

const isSubscriptionInvoice = (data: Record<string, any>) => {
  const invoiceType = String(data.invoiceType || "").toLowerCase();
  const concept = String(data.concept || "").toLowerCase();
  return invoiceType === "subscription" || concept.includes("suscrip");
};

export const getInitialSubscriptionPaymentStatus = async (
  clientId: string,
  condominiumId: string,
): Promise<InitialSubscriptionPaymentStatus> => {
  const db = getFirestore();
  const invoicesRef = collection(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`,
  );

  const paidQuery = query(
    invoicesRef,
    where("paymentStatus", "==", "paid"),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  const paidSnap = await getDocs(paidQuery);
  const hasPaidSubscription = paidSnap.docs.some((invoiceDoc) =>
    isSubscriptionInvoice(invoiceDoc.data() || {}),
  );

  const pendingQuery = query(
    invoicesRef,
    where("paymentStatus", "in", ["pending", "overdue"]),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  const pendingSnap = await getDocs(pendingQuery);

  return {
    hasPaidSubscription,
    hasPendingSubscription: pendingSnap.docs.some((invoiceDoc) =>
      isSubscriptionInvoice(invoiceDoc.data() || {}),
    ),
  };
};

const NOT_REQUIRED: InitialSetupStatus = {
  requiresInitialSetup: false,
  initialStep: 1,
  mode: "none",
  clientId: null,
  condominiumId: null,
};

export const resolveInitialSetupStatus =
  async (): Promise<InitialSetupStatus> => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return NOT_REQUIRED;
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;
    if (!clientId) {
      return NOT_REQUIRED;
    }

    const db = getFirestore();
    const configDocRef = doc(db, "clients", clientId);
    const configDoc = await getDoc(configDocRef);
    const clientData = configDoc.exists() ? configDoc.data() || {} : {};
    const initialSetupCompleted = Boolean(
      configDoc.exists() && clientData.initialSetupCompleted,
    );
    // Flag a nivel cliente que marca pago inicial pendiente del primer
    // condominio (legacy). Después de pagar/redimir queda false. NO refleja
    // condominios agregados posteriormente.
    const hasSetupPaymentPending = Boolean(clientData.initialSetupPaymentPending);
    // Flag a nivel cliente seteado al redimir un cupón a nivel cliente para
    // el primer condominio. Útil para reconocer que el wizard inicial ya
    // está liquidado, pero NO debe usarse para dar por pagados condominios
    // agregados después (cada uno tiene su propia factura inicial).
    const clientCouponBypass = Boolean(clientData.initialSetupPaymentBypassed);
    const condominiumId = localStorage.getItem("condominiumId");

    // Bypass propio del condominio actual (caso: nuevo condominio agregado
    // a un cliente existente con cupón redimido).
    let condominiumCouponBypass = false;
    if (condominiumId) {
      try {
        const condominiumDoc = await getDoc(
          doc(db, `clients/${clientId}/condominiums/${condominiumId}`),
        );
        if (condominiumDoc.exists()) {
          condominiumCouponBypass = Boolean(
            condominiumDoc.data()?.initialSetupPaymentBypassed,
          );
        }
      } catch (error) {
        console.error(
          "Error al verificar bypass a nivel condominio:",
          error,
        );
      }
    }

    // IMPORTANTE: siempre consultamos el estado real de facturas del
    // condominio actual. Antes se saltaba este check cuando había
    // `clientCouponBypass`, lo que provocaba que condominios agregados
    // después de la configuración inicial (con su propia factura de
    // suscripción pendiente) se vieran como "ya pagados". Ahora el bypass
    // del cliente sirve solo para no forzar el wizard completo, no para
    // dar por bueno el pago del condominio actual.
    const subscriptionPaymentStatus = condominiumId
      ? await getInitialSubscriptionPaymentStatus(clientId, condominiumId)
      : { hasPaidSubscription: false, hasPendingSubscription: false };
    const hasPaidInitialSubscription =
      subscriptionPaymentStatus.hasPaidSubscription;
    const hasUnpaidInitialSubscription =
      subscriptionPaymentStatus.hasPendingSubscription;

    const hasPendingStripeCheckout = Boolean(
      sessionStorage.getItem(INITIAL_SETUP_STRIPE_PENDING_KEY),
    );

    // "Pagado/condonado" del condominio actual: requiere evidencia local
    // del condominio (bypass propio o factura suscripción pagada). El
    // bypass a nivel cliente NO cuenta por sí solo, salvo que no existan
    // facturas para este condominio (compatibilidad con clientes legacy
    // donde el primer condominio se redimió antes de existir el bypass
    // por condominio).
    const currentCondominiumHasInvoiceEvidence =
      hasPaidInitialSubscription || hasUnpaidInitialSubscription;
    const currentCondominiumPaid =
      condominiumCouponBypass ||
      hasPaidInitialSubscription ||
      (clientCouponBypass && !currentCondominiumHasInvoiceEvidence);

    const shouldOpenPaymentStep =
      hasSetupPaymentPending ||
      hasPendingStripeCheckout ||
      hasUnpaidInitialSubscription ||
      !currentCondominiumPaid;

    if (!initialSetupCompleted) {
      return {
        requiresInitialSetup: true,
        initialStep: shouldOpenPaymentStep ? 7 : 1,
        mode: "wizard",
        clientId,
        condominiumId,
      };
    }

    if (
      !currentCondominiumPaid ||
      hasSetupPaymentPending ||
      hasPendingStripeCheckout ||
      hasUnpaidInitialSubscription
    ) {
      // El wizard inicial ya está completo, pero el condominio actual tiene
      // factura inicial pendiente (típico cuando se agrega un condominio
      // adicional a un cliente existente). Mostramos el gate dedicado en
      // lugar del wizard completo.
      return {
        requiresInitialSetup: true,
        initialStep: 7,
        mode: "condominium_payment",
        clientId,
        condominiumId,
      };
    }

    return {
      requiresInitialSetup: false,
      initialStep: 1,
      mode: "none",
      clientId,
      condominiumId,
    };
  };
