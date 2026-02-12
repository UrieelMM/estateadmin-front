import { create } from "./createStore";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import * as Sentry from "@sentry/react";
import { useCondominiumStore } from "./useCondominiumStore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

interface SupportTicket {
  ticketNumber: string;
  email: string;
  title: string;
  description: string;
  issueType: "bug" | "incident" | "question" | "request";
  priority: "low" | "medium" | "high";
  module: string;
  currentPath: string;
  userAgent: string;
  attachmentUrls: string[];
  status: "pending" | "in_progress" | "resolved";
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  condominiumId: string;
  clientId: string;
}

interface SupportTicketCreateInput {
  title: string;
  description: string;
  issueType: "bug" | "incident" | "question" | "request";
  priority: "low" | "medium" | "high";
  module: string;
  attachments?: File[];
  currentPath?: string;
}

interface SupportTicketsStore {
  createTicket: (
    ticket: SupportTicketCreateInput
  ) => Promise<{ ticketNumber: string }>;
}

const generateSupportTicketNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 16; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EA-SUPPORT-${randomPart}`;
};

const useSupportTicketsStore = create<SupportTicketsStore>()((_set) => ({
  createTicket: async (ticket) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      const db = getFirestore();
      const ticketsRef = collection(db, "supportTickets");
      const storage = getStorage();

      // Obtener el condominio y cliente actual
      const { selectedCondominium } = useCondominiumStore.getState();
      if (!selectedCondominium) throw new Error("No hay condominio seleccionado");

      const tokenResult = await user.getIdTokenResult();
      const clientId = tokenResult.claims.clientId as string;
      if (!clientId) throw new Error("No se encontró clientId en el token");

      const sanitizedFiles = (ticket.attachments || []).filter(
        (file) => file.type.startsWith("image/") && file.size > 0
      );

      const attachmentUrls = await Promise.all(
        sanitizedFiles.map(async (file) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `clients/${clientId}/condominiums/${selectedCondominium.id}/supportTickets/${user.uid}/${Date.now()}_${safeName}`;
          const fileRef = storageRef(storage, filePath);
          await uploadBytes(fileRef, file, {
            contentType: file.type,
          });
          return getDownloadURL(fileRef);
        })
      );

      const ticketNumber = generateSupportTicketNumber();

      const newTicket: SupportTicket = {
        ticketNumber,
        email: user.email || "",
        title: ticket.title,
        description: ticket.description,
        issueType: ticket.issueType,
        priority: ticket.priority,
        module: ticket.module,
        currentPath: ticket.currentPath || window.location.pathname,
        userAgent: navigator.userAgent,
        attachmentUrls,
        status: "pending",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        condominiumId: selectedCondominium.id,
        clientId: clientId,
      };

      await addDoc(ticketsRef, newTicket);
      return { ticketNumber };
    } catch (error) {
      console.error("Error al crear ticket de soporte:", error);
      Sentry.captureException(error);
      throw error;
    }
  },
}));

export default useSupportTicketsStore; 
