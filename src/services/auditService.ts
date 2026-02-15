import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "toggle"
  | "save_draft"
  | "complete"
  | "import"
  | "manual_match"
  | "auto_match"
  | "other";

type AuditPayload = {
  module: string;
  entityType: string;
  entityId?: string;
  action: AuditAction;
  summary: string;
  metadata?: Record<string, any>;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
};

const MAX_JSON_LENGTH = 8000;

function sanitizeObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object") return null;
  const json = JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === "string" && currentValue.length > 500) {
      return `${currentValue.slice(0, 500)}...`;
    }
    return currentValue;
  });
  if (!json) return null;
  const trimmed =
    json.length > MAX_JSON_LENGTH
      ? `${json.slice(0, MAX_JSON_LENGTH)}...`
      : json;
  return JSON.parse(trimmed);
}

export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tokenResult = await getIdTokenResult(currentUser);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");
    if (!clientId || !condominiumId) return;

    const db = getFirestore();
    await addDoc(
      collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/auditLogs`
      ),
      {
        module: payload.module,
        entityType: payload.entityType,
        entityId: payload.entityId || "",
        action: payload.action,
        summary: payload.summary,
        metadata: sanitizeObject(payload.metadata || {}),
        before: sanitizeObject(payload.before || null),
        after: sanitizeObject(payload.after || null),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        performedBy: {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          role:
            (tokenResult.claims["role"] as string) ||
            (tokenResult.claims["userRole"] as string) ||
            "",
        },
        source: "web_app",
      }
    );
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}
