import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { NOTIFICATION_EVENT_CATALOG } from "../config/notificationEventsCatalog";
import {
  DomainNotificationEventInput,
  NotificationChannel,
  NotificationTargetAudience,
  NotificationEventDoc,
  NotificationQueueDoc,
  UserNotificationDoc,
} from "../types/notifications";

type NotificationDispatchMode = "client" | "server";

const MAX_BATCH_SIZE = 400;
const LOCAL_DEDUPE_WINDOW_MS = 15 * 1000;
const localEventThrottle = new Map<string, number>();
const NOTIFICATION_DISPATCH_MODE = ((import.meta.env
  .VITE_NOTIFICATION_DISPATCH_MODE as string) || "client")
  .toLowerCase()
  .trim() as NotificationDispatchMode;

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  if (arr.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const shouldSkipByLocalDedupe = (dedupeScopeKey: string): boolean => {
  const now = Date.now();
  const lastSentAt = localEventThrottle.get(dedupeScopeKey) || 0;
  if (now - lastSentAt < LOCAL_DEDUPE_WINDOW_MS) {
    return true;
  }
  localEventThrottle.set(dedupeScopeKey, now);
  return false;
};

const sanitizeAudience = (
  inputAudience: NotificationTargetAudience | undefined,
  eventType: DomainNotificationEventInput["eventType"]
): NotificationTargetAudience => {
  if (inputAudience) return inputAudience;
  return NOTIFICATION_EVENT_CATALOG[eventType].defaultAudience;
};

const resolveRecipientIds = async (
  clientId: string,
  condominiumId: string,
  fallbackUserId: string,
  audience: NotificationTargetAudience
): Promise<string[]> => {
  const db = getFirestore();
  const usersRef = collection(
    db,
    `clients/${clientId}/condominiums/${condominiumId}/users`
  );

  if (audience.scope === "specific_users") {
    const explicitIds = (audience.userIds || []).filter(Boolean);
    return explicitIds.length > 0 ? Array.from(new Set(explicitIds)) : [fallbackUserId];
  }

  const q =
    audience.scope === "admins"
      ? query(usersRef, where("role", "==", "admin"))
      : query(usersRef, where("role", "in", ["admin", "admin-assistant"]));

  const snapshot = await getDocs(q);
  const recipients = snapshot.docs
    .map((snap) => String(snap.data().uid || snap.id || ""))
    .filter(Boolean);

  if (recipients.length === 0) {
    return [fallbackUserId];
  }

  return Array.from(new Set(recipients));
};

export const emitDomainNotificationEvent = async (
  input: DomainNotificationEventInput
): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const tokenResult = await getIdTokenResult(user);
    const claimClientId = tokenResult.claims["clientId"] as string;
    const localCondominiumId = localStorage.getItem("condominiumId");
    const clientId = input.context?.clientId || claimClientId;
    const condominiumId = input.context?.condominiumId || localCondominiumId;

    if (!clientId || !condominiumId) return;

    const dedupeScopeKey = `${clientId}:${condominiumId}:${input.dedupeKey}`;
    if (shouldSkipByLocalDedupe(dedupeScopeKey)) return;

    const audience = sanitizeAudience(input.audience, input.eventType);
    const channels: NotificationChannel[] = input.channels?.length
      ? input.channels
      : ["in_app"];
    const createdByName = user.displayName || user.email || "Usuario";

    const db = getFirestore();
    const eventsRef = collection(
      db,
      `clients/${clientId}/condominiums/${condominiumId}/notificationEvents`
    );

    const eventDoc: NotificationEventDoc = {
      eventType: input.eventType,
      module: input.module,
      priority: input.priority,
      title: input.title,
      body: input.body,
      dedupeKey: input.dedupeKey,
      channels,
      audience,
      entityId: input.entityId || "",
      entityType: input.entityType || "",
      metadata: input.metadata || {},
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByName,
      status:
        NOTIFICATION_DISPATCH_MODE === "server"
          ? "pending_dispatch"
          : "emitted",
      clientId,
      condominiumId,
    };

    const eventRef = await addDoc(eventsRef, eventDoc);

    if (NOTIFICATION_DISPATCH_MODE === "server") {
      // En modo server, el backend (Cloud Function trigger/scheduler)
      // se encarga de queue + entrega in-app.
      return;
    }

    const recipients = await resolveRecipientIds(
      clientId,
      condominiumId,
      user.uid,
      audience
    );

    const queueRef = await addDoc(
      collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/notificationQueue`
      ),
      {
        sourceEventId: eventRef.id,
        eventType: input.eventType,
        module: input.module,
        priority: input.priority,
        channels,
        status: "dispatched",
        dedupeKey: input.dedupeKey,
        recipientsCount: recipients.length,
        recipients,
        createdAt: serverTimestamp(),
        dispatchedAt: serverTimestamp(),
        dispatchedBy: user.uid,
        clientId,
        condominiumId,
      } as NotificationQueueDoc
    );

    const recipientChunks = chunkArray(recipients, MAX_BATCH_SIZE);

    for (const recipientChunk of recipientChunks) {
      const batch = writeBatch(db);
      recipientChunk.forEach((recipientId) => {
        const notificationRef = doc(
          collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users/${recipientId}/notifications`
          )
        );
        batch.set(notificationRef, {
          title: input.title,
          body: input.body,
          module: input.module,
          eventType: input.eventType,
          priority: input.priority,
          read: false,
          readAt: null,
          entityId: input.entityId || "",
          entityType: input.entityType || "",
          metadata: input.metadata || {},
          sourceEventId: eventRef.id,
          sourceQueueId: queueRef.id,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          clientId,
          condominiumId,
        } as UserNotificationDoc);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error("Error emitiendo evento de notificación:", error);
  }
};
