import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from "firebase/firestore";
import {
  getStorageMode,
  loadSnapshotFromStorage,
  SnapshotRef,
} from "./reconciliationStorage";

/**
 * Overwrites a Firestore subcollection with the provided items, using batched
 * writes to stay within Firestore limits. Retained for legacy sessions that
 * were saved with `storageMode === "subcollections_v1"`.
 */
export async function replaceSubcollectionDocs(
  parentPath: string,
  subcollectionName: string,
  items: Record<string, any>[]
) {
  const db = getFirestore();
  const subRef = collection(db, `${parentPath}/${subcollectionName}`);
  const existingSnap = await getDocs(subRef);
  const existingDocs = existingSnap.docs;

  for (let i = 0; i < existingDocs.length; i += 400) {
    const batch = writeBatch(db);
    existingDocs.slice(i, i + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }

  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db);
    items.slice(i, i + 400).forEach((item) => {
      const newRef = doc(subRef);
      batch.set(newRef, item);
    });
    await batch.commit();
  }
}

export async function loadSubcollectionDocs(
  parentPath: string,
  subcollectionName: string
) {
  const db = getFirestore();
  const subRef = collection(db, `${parentPath}/${subcollectionName}`);
  const snap = await getDocs(subRef);
  return snap.docs.map((item) => item.data());
}

/**
 * Loads movements for a reconciliation session regardless of how they were
 * persisted:
 * - `storage_v2` → download the JSON snapshot from Firebase Storage.
 * - `subcollections_v1` → read `bankMovements` / `internalMovements` subcollections.
 * - `inline_v0` → use the arrays embedded in the Firestore document.
 *
 * This is what keeps backward compatibility transparent for drafts or
 * completed sessions created before the Storage-based migration.
 */
export async function hydrateDraftData(
  parentPath: string,
  firestoreData: Record<string, any>
): Promise<{
  bankMovements: Record<string, any>[];
  internalMovements: Record<string, any>[];
}> {
  const mode = getStorageMode(firestoreData);
  if (mode === "storage_v2" && firestoreData.snapshotRef?.path) {
    const snapshot = await loadSnapshotFromStorage<
      Record<string, any>,
      Record<string, any>
    >(firestoreData.snapshotRef as SnapshotRef);
    return {
      bankMovements: Array.isArray(snapshot.bankMovements)
        ? snapshot.bankMovements
        : [],
      internalMovements: Array.isArray(snapshot.internalMovements)
        ? snapshot.internalMovements
        : [],
    };
  }
  if (mode === "inline_v0") {
    return {
      bankMovements: Array.isArray(firestoreData.bankMovements)
        ? firestoreData.bankMovements
        : [],
      internalMovements: Array.isArray(firestoreData.internalPayments)
        ? firestoreData.internalPayments
        : Array.isArray(firestoreData.internalExpenses)
        ? firestoreData.internalExpenses
        : [],
    };
  }
  // subcollections_v1 or unknown (treat as legacy subcollections).
  const [bankRows, internalRows] = await Promise.all([
    loadSubcollectionDocs(parentPath, "bankMovements"),
    loadSubcollectionDocs(parentPath, "internalMovements"),
  ]);
  return { bankMovements: bankRows, internalMovements: internalRows };
}
