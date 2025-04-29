import { create } from "./createStore";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import * as Sentry from "@sentry/react";
import { useCondominiumStore } from "./useCondominiumStore";

interface SupportTicket {
  email: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  createdAt: any;
  updatedAt: any;
  condominiumId: string;
  clientId: string;
}

interface SupportTicketsStore {
  createTicket: (ticket: Omit<SupportTicket, "email" | "status" | "createdAt" | "updatedAt" | "condominiumId" | "clientId">) => Promise<void>;
}

const useSupportTicketsStore = create<SupportTicketsStore>()((_set) => ({
  createTicket: async (ticket) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      const db = getFirestore();
      const ticketsRef = collection(db, "supportTickets");

      // Obtener el condominio y cliente actual
      const { selectedCondominium } = useCondominiumStore.getState();
      if (!selectedCondominium) throw new Error("No hay condominio seleccionado");

      const tokenResult = await user.getIdTokenResult();
      const clientId = tokenResult.claims.clientId as string;

      const newTicket: SupportTicket = {
        ...ticket,
        email: user.email || "",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        condominiumId: selectedCondominium.id,
        clientId: clientId,
      };

      await addDoc(ticketsRef, newTicket);
    } catch (error) {
      console.error("Error al crear ticket de soporte:", error);
      Sentry.captureException(error);
      throw error;
    }
  },
}));

export default useSupportTicketsStore; 