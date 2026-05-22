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

type InitialSetupStatus = {
  requiresInitialSetup: boolean;
  initialStep: number;
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

export const resolveInitialSetupStatus =
  async (): Promise<InitialSetupStatus> => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return { requiresInitialSetup: false, initialStep: 1 };
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;
    if (!clientId) {
      return { requiresInitialSetup: false, initialStep: 1 };
    }

    const db = getFirestore();
    const configDocRef = doc(db, "clients", clientId);
    const configDoc = await getDoc(configDocRef);
    const clientData = configDoc.exists() ? configDoc.data() || {} : {};
    const initialSetupCompleted = Boolean(
      configDoc.exists() && clientData.initialSetupCompleted,
    );
    const hasGiftCouponBypass = Boolean(clientData.initialSetupPaymentBypassed);
    const hasSetupPaymentPending = Boolean(clientData.initialSetupPaymentPending);
    const condominiumId = localStorage.getItem("condominiumId");
    const hasPendingStripeCheckout =
      !hasGiftCouponBypass &&
      Boolean(sessionStorage.getItem(INITIAL_SETUP_STRIPE_PENDING_KEY));
    const subscriptionPaymentStatus =
      condominiumId && !hasGiftCouponBypass
        ? await getInitialSubscriptionPaymentStatus(clientId, condominiumId)
        : { hasPaidSubscription: false, hasPendingSubscription: false };
    const hasPaidInitialSubscription =
      subscriptionPaymentStatus.hasPaidSubscription;
    const hasUnpaidInitialSubscription =
      subscriptionPaymentStatus.hasPendingSubscription;
    const hasInitialSetupPaymentAccess =
      hasGiftCouponBypass || hasPaidInitialSubscription;
    const shouldOpenPaymentStep =
      hasSetupPaymentPending ||
      hasPendingStripeCheckout ||
      hasUnpaidInitialSubscription;

    if (!initialSetupCompleted) {
      return {
        requiresInitialSetup: true,
        initialStep: shouldOpenPaymentStep ? 7 : 1,
      };
    }

    if (
      !hasInitialSetupPaymentAccess ||
      hasSetupPaymentPending ||
      hasPendingStripeCheckout ||
      hasUnpaidInitialSubscription
    ) {
      return { requiresInitialSetup: true, initialStep: 7 };
    }

    return { requiresInitialSetup: false, initialStep: 1 };
  };
