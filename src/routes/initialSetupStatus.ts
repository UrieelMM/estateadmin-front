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

export type InitialSubscriptionPaymentStatus = {
  hasPaidSubscription: boolean;
  /** True solo si la PRIMERA factura de suscripción sigue pendiente/vencida. */
  hasPendingSubscription: boolean;
  hasUnpaidFirstSubscription: boolean;
  firstSubscriptionInvoiceSettled: boolean;
  hasAnySubscriptionInvoice: boolean;
};

export const isSubscriptionInvoice = (data: Record<string, any>) => {
  const invoiceType = String(data.invoiceType || "").toLowerCase();
  const concept = String(data.concept || "").toLowerCase();
  return invoiceType === "subscription" || concept.includes("suscrip");
};

/** La primera factura ya fue pagada, condonada por cupón u otro motivo válido. */
export const isSubscriptionInvoiceSettled = (data: Record<string, any>) => {
  const status = String(data.paymentStatus || "").toLowerCase();
  if (status === "paid") return true;
  if (Boolean(data.waivedByCoupon)) return true;
  if (
    status === "canceled" &&
    (data.waivedReason || data.waivedCoupon || data.waivedByCoupon)
  ) {
    return true;
  }
  return false;
};

const getSubscriptionInvoicesAsc = async (
  clientId: string,
  condominiumId: string,
) => {
  const db = getFirestore();
  const invoicesRef = collection(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/invoicesGenerated`,
  );
  const snap = await getDocs(
    query(invoicesRef, orderBy("createdAt", "asc"), limit(100)),
  );
  return snap.docs.filter((invoiceDoc) =>
    isSubscriptionInvoice(invoiceDoc.data() || {}),
  );
};

export const fetchFirstPendingSubscriptionInvoice = async (
  clientId: string,
  condominiumId: string,
): Promise<{ id: string; data: Record<string, any> } | null> => {
  const subscriptionDocs = await getSubscriptionInvoicesAsc(
    clientId,
    condominiumId,
  );
  if (!subscriptionDocs.length) return null;

  const firstDoc = subscriptionDocs[0];
  const data = firstDoc.data() || {};
  if (isSubscriptionInvoiceSettled(data)) return null;

  const status = String(data.paymentStatus || "").toLowerCase();
  if (status === "pending" || status === "overdue") {
    return { id: firstDoc.id, data };
  }

  return null;
};

export const getInitialSubscriptionPaymentStatus = async (
  clientId: string,
  condominiumId: string,
): Promise<InitialSubscriptionPaymentStatus> => {
  const subscriptionDocs = await getSubscriptionInvoicesAsc(
    clientId,
    condominiumId,
  );

  if (!subscriptionDocs.length) {
    return {
      hasPaidSubscription: false,
      hasPendingSubscription: false,
      hasUnpaidFirstSubscription: false,
      firstSubscriptionInvoiceSettled: false,
      hasAnySubscriptionInvoice: false,
    };
  }

  const firstData = subscriptionDocs[0].data() || {};
  const firstSubscriptionInvoiceSettled =
    isSubscriptionInvoiceSettled(firstData);
  const firstStatus = String(firstData.paymentStatus || "").toLowerCase();
  const hasUnpaidFirstSubscription =
    !firstSubscriptionInvoiceSettled &&
    (firstStatus === "pending" || firstStatus === "overdue");

  const hasPaidSubscription = subscriptionDocs.some(
    (invoiceDoc) =>
      String((invoiceDoc.data() || {}).paymentStatus || "").toLowerCase() ===
      "paid",
  );

  return {
    hasPaidSubscription,
    hasPendingSubscription: hasUnpaidFirstSubscription,
    hasUnpaidFirstSubscription,
    firstSubscriptionInvoiceSettled,
    hasAnySubscriptionInvoice: true,
  };
};

const EMPTY_SUBSCRIPTION_STATUS: InitialSubscriptionPaymentStatus = {
  hasPaidSubscription: false,
  hasPendingSubscription: false,
  hasUnpaidFirstSubscription: false,
  firstSubscriptionInvoiceSettled: false,
  hasAnySubscriptionInvoice: false,
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
    const hasSetupPaymentPending = Boolean(clientData.initialSetupPaymentPending);
    const clientCouponBypass = Boolean(clientData.initialSetupPaymentBypassed);
    const condominiumId = localStorage.getItem("condominiumId");

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

    const subscriptionPaymentStatus = condominiumId
      ? await getInitialSubscriptionPaymentStatus(clientId, condominiumId)
      : EMPTY_SUBSCRIPTION_STATUS;

    const hasPaidInitialSubscription =
      subscriptionPaymentStatus.hasPaidSubscription;
    const hasUnpaidFirstSubscription =
      subscriptionPaymentStatus.hasUnpaidFirstSubscription;
    const firstSubscriptionSettled =
      subscriptionPaymentStatus.firstSubscriptionInvoiceSettled;
    const hasAnySubscriptionInvoice =
      subscriptionPaymentStatus.hasAnySubscriptionInvoice;

    const hasPendingStripeCheckout = Boolean(
      sessionStorage.getItem(INITIAL_SETUP_STRIPE_PENDING_KEY),
    );

    const currentCondominiumPaid =
      condominiumCouponBypass ||
      hasPaidInitialSubscription ||
      firstSubscriptionSettled ||
      (clientCouponBypass && !hasAnySubscriptionInvoice);

    const shouldOpenPaymentStep =
      hasSetupPaymentPending ||
      hasPendingStripeCheckout ||
      hasUnpaidFirstSubscription ||
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
      hasUnpaidFirstSubscription
    ) {
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
