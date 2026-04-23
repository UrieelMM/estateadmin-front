import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getBytes,
} from "firebase/storage";

export type SnapshotDirection = "income" | "expenses";

export type SnapshotRef = {
  /** Always `"storage_v2"`. Used to distinguish from legacy subcollection storage. */
  schema: "storage_v2";
  /** Semantic version of the snapshot format. Bump when the shape changes. */
  version: number;
  /** Full path within the configured storage bucket. */
  path: string;
  /** Download URL generated at upload time (convenient but not required for reads). */
  fileUrl: string;
  /** Byte size of the uploaded snapshot. */
  size: number;
  /** Simple hash for integrity verification. */
  checksum: string;
  /** When the snapshot was uploaded. */
  uploadedAt: string;
  /** Counts for a quick preview without downloading the whole file. */
  counts: {
    bankMovements: number;
    internalMovements: number;
  };
};

export type ReconciliationSnapshotPayload<TBank, TInternal> = {
  schema: "storage_v2";
  version: number;
  generatedAt: string;
  type: SnapshotDirection;
  sessionId: string;
  summary: Record<string, any>;
  bankMovements: TBank[];
  internalMovements: TInternal[];
};

/**
 * Computes a fast, non-cryptographic checksum. Enough for detecting accidental
 * corruption without the weight of SubtleCrypto and async hashing.
 */
function fastHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}

function buildSnapshotPath(
  clientId: string,
  condominiumId: string,
  direction: SnapshotDirection,
  sessionId: string
): string {
  return `clients/${clientId}/condominiums/${condominiumId}/reconciliations/${direction}/${sessionId}/snapshot.json`;
}

/**
 * Serializes any Date or Firestore Timestamp-like value into ISO strings so
 * the resulting JSON is self-contained and portable.
 */
function sanitizeForSnapshot(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object" && value !== null) {
    if (typeof (value as any).toDate === "function") {
      try {
        return (value as any).toDate().toISOString();
      } catch {
        return null;
      }
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeForSnapshot);
    }
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.reduce<Record<string, unknown>>((acc, [key, entry]) => {
      acc[key] = sanitizeForSnapshot(entry);
      return acc;
    }, {});
  }
  return value;
}

/**
 * Uploads a full reconciliation snapshot (bank movements + internal movements
 * + summary) to Firebase Storage as a single JSON file.
 *
 * This avoids Firestore's 1MB-per-document hard limit for reconciliations
 * with thousands of movements and keeps everything in a single, integral file.
 */
export async function saveSnapshotToStorage<TBank, TInternal>(params: {
  clientId: string;
  condominiumId: string;
  direction: SnapshotDirection;
  sessionId: string;
  summary: Record<string, any>;
  bankMovements: TBank[];
  internalMovements: TInternal[];
}): Promise<SnapshotRef> {
  const payload: ReconciliationSnapshotPayload<TBank, TInternal> = {
    schema: "storage_v2",
    version: 1,
    generatedAt: new Date().toISOString(),
    type: params.direction,
    sessionId: params.sessionId,
    summary: (sanitizeForSnapshot(params.summary) as Record<string, any>) || {},
    bankMovements: sanitizeForSnapshot(params.bankMovements) as TBank[],
    internalMovements: sanitizeForSnapshot(params.internalMovements) as TInternal[],
  };

  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  const storage = getStorage();
  const path = buildSnapshotPath(
    params.clientId,
    params.condominiumId,
    params.direction,
    params.sessionId
  );
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, bytes, {
    contentType: "application/json",
    cacheControl: "private, max-age=0, must-revalidate",
    customMetadata: {
      schema: "storage_v2",
      direction: params.direction,
      sessionId: params.sessionId,
      bankCount: String(params.bankMovements.length),
      internalCount: String(params.internalMovements.length),
    },
  });
  const fileUrl = await getDownloadURL(fileRef);

  return {
    schema: "storage_v2",
    version: 1,
    path,
    fileUrl,
    size: bytes.byteLength,
    checksum: fastHash(json),
    uploadedAt: payload.generatedAt,
    counts: {
      bankMovements: params.bankMovements.length,
      internalMovements: params.internalMovements.length,
    },
  };
}

/**
 * Reads a snapshot back from Storage. Uses getBytes which does not require
 * a CORS-enabled download URL and works under strict security rules.
 */
export async function loadSnapshotFromStorage<TBank, TInternal>(
  snapshotRef: SnapshotRef
): Promise<ReconciliationSnapshotPayload<TBank, TInternal>> {
  const storage = getStorage();
  const fileRef = ref(storage, snapshotRef.path);
  const bytes = await getBytes(fileRef);
  const json = new TextDecoder().decode(bytes);
  const payload = JSON.parse(json) as ReconciliationSnapshotPayload<
    TBank,
    TInternal
  >;
  return payload;
}

/**
 * Deletes a previously saved snapshot. Used when a reconciliation is
 * discarded or replaced.
 */
export async function deleteSnapshotFromStorage(
  snapshotRef: Pick<SnapshotRef, "path">
): Promise<void> {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, snapshotRef.path);
    await deleteObject(fileRef);
  } catch (error: any) {
    // Swallow "object-not-found" errors: idempotent deletion.
    if (error?.code !== "storage/object-not-found") throw error;
  }
}

/**
 * Determines whether a given Firestore document refers to a snapshot stored in
 * Firebase Storage (new scheme) vs. the legacy subcollection-based storage.
 */
export function getStorageMode(
  firestoreData: Record<string, any> | null | undefined
): "storage_v2" | "subcollections_v1" | "inline_v0" | "unknown" {
  if (!firestoreData) return "unknown";
  const mode = firestoreData.storageMode;
  if (mode === "storage_v2") return "storage_v2";
  if (mode === "subcollections_v1") return "subcollections_v1";
  // Legacy: no storageMode but raw arrays embedded.
  if (
    Array.isArray(firestoreData.bankMovements) ||
    Array.isArray(firestoreData.internalPayments) ||
    Array.isArray(firestoreData.internalExpenses)
  ) {
    return "inline_v0";
  }
  return "unknown";
}
