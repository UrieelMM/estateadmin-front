import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export type AIUsageFeature = "income_report" | string;

const WINDOW_MS = 24 * 60 * 60 * 1000;
const FEATURE_LIMITS: Record<string, number> = {
  income_report: 5,
  publication_draft: 5,
};

type ConsumeQuotaInput = {
  clientId: string;
  condominiumId: string;
  feature: AIUsageFeature;
};

export type ConsumeQuotaResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
};

type RecordUsageInput = {
  clientId: string;
  condominiumId: string;
  feature: AIUsageFeature;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimated: boolean;
  model?: string;
  status: "success" | "error";
  errorMessage?: string;
};

function getDateKey(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getLimitByFeature(feature: AIUsageFeature): number {
  return FEATURE_LIMITS[feature] || 5;
}

function buildFriendlyResetLabel(resetAtIso: string): string {
  const date = new Date(resetAtIso);
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function consumeFeatureQuota({
  clientId,
  condominiumId,
  feature,
}: ConsumeQuotaInput): Promise<ConsumeQuotaResult> {
  const db = getFirestore();
  const limit = getLimitByFeature(feature);
  const quotaRef = doc(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/aiUsageQuota/${feature}`
  );

  return runTransaction(db, async (tx) => {
    const now = Date.now();
    const snap = await tx.get(quotaRef);

    let windowStartAtMs = now;
    let count = 0;

    if (snap.exists()) {
      const data = snap.data() as any;
      const existingWindowStart =
        data.windowStartAt?.toMillis?.() ||
        new Date(data.windowStartAt || now).getTime();
      const existingCount =
        typeof data.count === "number" && Number.isFinite(data.count)
          ? data.count
          : 0;

      if (now < existingWindowStart + WINDOW_MS) {
        windowStartAtMs = existingWindowStart;
        count = existingCount;
      }
    }

    const resetAtMs = windowStartAtMs + WINDOW_MS;
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt: new Date(resetAtMs).toISOString(),
      };
    }

    const nextCount = count + 1;
    tx.set(
      quotaRef,
      {
        clientId,
        condominiumId,
        feature,
        limit,
        count: nextCount,
        windowStartAt: new Date(windowStartAtMs),
        resetAt: new Date(resetAtMs),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      allowed: true,
      remaining: Math.max(0, limit - nextCount),
      limit,
      resetAt: new Date(resetAtMs).toISOString(),
    };
  });
}

export async function getFeatureQuotaStatus({
  clientId,
  condominiumId,
  feature,
}: ConsumeQuotaInput): Promise<ConsumeQuotaResult> {
  const db = getFirestore();
  const limit = getLimitByFeature(feature);
  const quotaRef = doc(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/aiUsageQuota/${feature}`
  );
  const snap = await getDoc(quotaRef);
  const now = Date.now();

  if (!snap.exists()) {
    const resetAt = new Date(now + WINDOW_MS).toISOString();
    return { allowed: true, remaining: limit, limit, resetAt };
  }

  const data = snap.data() as any;
  const windowStartAtMs =
    data.windowStartAt?.toMillis?.() || new Date(data.windowStartAt || now).getTime();
  const resetAtMs = windowStartAtMs + WINDOW_MS;

  if (now >= resetAtMs) {
    const resetAt = new Date(now + WINDOW_MS).toISOString();
    return { allowed: true, remaining: limit, limit, resetAt };
  }

  const count =
    typeof data.count === "number" && Number.isFinite(data.count) ? data.count : 0;
  const remaining = Math.max(0, limit - count);
  return {
    allowed: count < limit,
    remaining,
    limit,
    resetAt: new Date(resetAtMs).toISOString(),
  };
}

export async function recordFeatureUsage({
  clientId,
  condominiumId,
  feature,
  inputTokens,
  outputTokens,
  totalTokens,
  estimated,
  model,
  status,
  errorMessage,
}: RecordUsageInput): Promise<void> {
  const db = getFirestore();
  const dateKey = getDateKey();
  const dailyRef = doc(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/aiUsageDaily/${dateKey}`
  );
  const eventsRef = collection(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/aiUsageEvents`
  );

  await setDoc(
    dailyRef,
    {
      clientId,
      condominiumId,
      dateKey,
      featureUsage: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(dailyRef, {
    totalRequests: increment(1),
    totalInputTokens: increment(inputTokens),
    totalOutputTokens: increment(outputTokens),
    totalTokens: increment(totalTokens),
    [`featureUsage.${feature}.requests`]: increment(1),
    [`featureUsage.${feature}.inputTokens`]: increment(inputTokens),
    [`featureUsage.${feature}.outputTokens`]: increment(outputTokens),
    [`featureUsage.${feature}.totalTokens`]: increment(totalTokens),
    [`featureUsage.${feature}.lastStatus`]: status,
    [`featureUsage.${feature}.updatedAt`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(eventsRef, {
    clientId,
    condominiumId,
    feature,
    inputTokens,
    outputTokens,
    totalTokens,
    estimated,
    model: model || "unknown",
    status,
    errorMessage: errorMessage || "",
    createdAt: serverTimestamp(),
    dateKey,
  });
}

export function buildQuotaExceededMessage(resetAtIso: string, limit: number): string {
  const resetLabel = buildFriendlyResetLabel(resetAtIso);
  return `Alcanzaste el límite temporal de ${limit} reportes en 24 horas para este condominio. Podrás generar uno nuevo después de ${resetLabel}.`;
}
