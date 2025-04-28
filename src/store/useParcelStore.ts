// publicationsStore.ts
import { create } from "./createStore";
import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getFirestore,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export type Parcel = {
  id: string;
  receptor: string;
  email: string;
  recipientName: string;
  dateReception: string;
  hourReception: string;
  comments?: string;
  status: "pending" | "delivered";
  attachmentUrl?: string;
  deliveryDate?: string;
  deliveryHour?: string;
  deliveryPerson?: string;
  deliveredTo?: string;
  deliveryNotes?: string;
  deliveryAttachmentUrl?: string;
};

type ParcelReception = {
  receptor: string;
  email: string;
  recipientName: string;
  dateReception: string;
  hourReception: string;
  comments?: string;
  file: File | File[] | null;
};

type ParcelDeliveryDetails = {
  deliveryPerson: string;
  deliveredTo: string;
  deliveryNotes?: string;
  deliveryFile?: File | null;
};

type ParcelState = {
  parcels: Parcel[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status: "all" | "pending" | "delivered";
    search: string;
  };
  getParcels: () => Promise<void>;
  getParcelById: (parcelId: string) => Promise<Parcel | null>;
  addParcelReception: (parcelReception: ParcelReception) => Promise<void>;
  markAsDelivered: (parcelId: string) => Promise<void>;
  updateDeliveryDetails: (
    parcelId: string,
    deliveryDetails: ParcelDeliveryDetails
  ) => Promise<void>;
  setFilters: (filters: Partial<ParcelState["filters"]>) => void;
};

export const useParcelReceptionStore = create<ParcelState>()((set, get) => ({
  parcels: [],
  isLoading: false,
  error: null,
  filters: {
    status: "all",
    search: "",
  },

  getParcels: async () => {
    set({ isLoading: true, error: null });

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        set({ error: "Usuario no autenticado", isLoading: false });
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", isLoading: false });
        return;
      }

      const db = getFirestore();
      const parcelsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/parcelReceptions`
      );

      const snapshot = await getDocs(parcelsRef);

      if (snapshot.empty) {
        set({ parcels: [], isLoading: false });
        return;
      }

      const parcels = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convertir Timestamp de Firestore a string si existe
        const dateReception = data.dateReception || "";
        const deliveryDate = data.deliveryDate || "";

        return {
          id: doc.id,
          receptor: data.receptor || "",
          email: data.email || "",
          recipientName: data.recipientName || "",
          dateReception:
            typeof dateReception === "string"
              ? dateReception
              : dateReception.toDate().toISOString().split("T")[0],
          hourReception: data.hourReception || "",
          comments: data.comments || "",
          status: data.status || "pending",
          attachmentUrl: data.attachmentUrl || "",
          deliveryDate:
            typeof deliveryDate === "string"
              ? deliveryDate
              : deliveryDate?.toDate?.()?.toISOString?.()?.split("T")[0] || "",
          deliveryHour: data.deliveryHour || "",
          deliveryPerson: data.deliveryPerson || "",
          deliveredTo: data.deliveredTo || "",
          deliveryNotes: data.deliveryNotes || "",
          deliveryAttachmentUrl: data.deliveryAttachmentUrl || "",
        } as Parcel;
      });

      set({ parcels, isLoading: false });
    } catch (error) {
      console.error("Error al obtener paquetes:", error);
      set({ error: "Error al obtener los paquetes", isLoading: false });
      toast.error("Error al obtener los paquetes");
    }
  },

  getParcelById: async (parcelId) => {
    try {
      set({ isLoading: true, error: null });

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        set({ error: "Usuario no autenticado", isLoading: false });
        return null;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", isLoading: false });
        return null;
      }

      const db = getFirestore();
      const parcelRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/parcelReceptions/${parcelId}`
      );

      const docSnap = await getDoc(parcelRef);

      if (!docSnap.exists()) {
        set({ error: "Paquete no encontrado", isLoading: false });
        return null;
      }

      const data = docSnap.data();

      // Convertir Timestamp de Firestore a string si existe
      const dateReception = data.dateReception || "";
      const deliveryDate = data.deliveryDate || "";

      const parcel = {
        id: parcelId,
        receptor: data.receptor || "",
        email: data.email || "",
        recipientName: data.recipientName || "",
        dateReception:
          typeof dateReception === "string"
            ? dateReception
            : dateReception.toDate().toISOString().split("T")[0],
        hourReception: data.hourReception || "",
        comments: data.comments || "",
        status: data.status || "pending",
        attachmentUrl: data.attachmentUrl || "",
        deliveryDate:
          typeof deliveryDate === "string"
            ? deliveryDate
            : deliveryDate?.toDate?.()?.toISOString?.()?.split("T")[0] || "",
        deliveryHour: data.deliveryHour || "",
        deliveryPerson: data.deliveryPerson || "",
        deliveredTo: data.deliveredTo || "",
        deliveryNotes: data.deliveryNotes || "",
        deliveryAttachmentUrl: data.deliveryAttachmentUrl || "",
      } as Parcel;

      set({ isLoading: false });
      return parcel;
    } catch (error) {
      console.error("Error al obtener paquete:", error);
      set({ error: "Error al obtener paquete", isLoading: false });
      return null;
    }
  },

  addParcelReception: async (parcelReception) => {
    set({ isLoading: true, error: null });

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        set({ error: "Usuario no autenticado", isLoading: false });
        toast.error("Usuario no autenticado");
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", isLoading: false });
        toast.error("Condominio no seleccionado");
        return;
      }

      // Construimos el FormData con todos los datos
      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("condominiumId", condominiumId as string);
      formData.append("email", parcelReception.email);
      formData.append("receptor", parcelReception.receptor);
      formData.append("recipientName", parcelReception.recipientName);
      formData.append("dateReception", parcelReception.dateReception);
      formData.append("hourReception", parcelReception.hourReception);
      formData.append("comments", parcelReception.comments || "");

      // Adjuntar el archivo si existe
      if (parcelReception.file) {
        formData.append("attachments", parcelReception.file as Blob);
      }

      // Actualizar la lista de paquetes después de agregar uno nuevo
      await get().getParcels();
      set({ isLoading: false });
      toast.success("Paquete registrado correctamente");
    } catch (error) {
      console.error("Error al enviar el paquete:", error);
      set({ error: "Error al registrar el paquete", isLoading: false });
      toast.error("Error al registrar el paquete");
    }
  },

  markAsDelivered: async (parcelId) => {
    set({ isLoading: true, error: null });

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        set({ error: "Usuario no autenticado", isLoading: false });
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", isLoading: false });
        return;
      }

      const today = new Date();
      const deliveryDate = today.toISOString().split("T")[0];
      const deliveryHour = today.toTimeString().split(" ")[0].substring(0, 5);

      const db = getFirestore();
      const parcelRef = doc(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/parcelReceptions`,
        parcelId
      );

      await updateDoc(parcelRef, {
        status: "delivered",
        deliveryDate,
        deliveryHour,
        updatedAt: Timestamp.now(),
      });

      // Actualizar el estado local para reflejar el cambio
      const updatedParcels = get().parcels.map((parcel) =>
        parcel.id === parcelId
          ? {
              ...parcel,
              status: "delivered" as const,
              deliveryDate,
              deliveryHour,
            }
          : parcel
      );

      set({ parcels: updatedParcels, isLoading: false });
      toast.success("Paquete marcado como entregado");
    } catch (error) {
      console.error("Error al marcar el paquete como entregado:", error);
      set({ error: "Error al actualizar el paquete", isLoading: false });
      toast.error("Error al actualizar el paquete");
    }
  },

  updateDeliveryDetails: async (parcelId, deliveryDetails) => {
    set({ isLoading: true, error: null });

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        set({ error: "Usuario no autenticado", isLoading: false });
        toast.error("Usuario no autenticado");
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!condominiumId) {
        set({ error: "Condominio no seleccionado", isLoading: false });
        toast.error("Condominio no seleccionado");
        return;
      }

      // Construir formData con todos los detalles
      const formData = new FormData();
      formData.append("parcelId", parcelId);
      formData.append("clientId", clientId);
      formData.append("condominiumId", condominiumId as string);
      formData.append("status", "delivered");
      formData.append("deliveryPerson", deliveryDetails.deliveryPerson);
      formData.append("deliveredTo", deliveryDetails.deliveredTo);
      formData.append("deliveryNotes", deliveryDetails.deliveryNotes || "");

      // Fecha y hora actuales para la entrega
      const today = new Date();
      const deliveryDate = today.toISOString().split("T")[0];
      const deliveryHour = today.toTimeString().split(" ")[0].substring(0, 5);

      formData.append("deliveryDate", deliveryDate);
      formData.append("deliveryHour", deliveryHour);

      // Adjuntar el archivo de evidencia si existe
      if (deliveryDetails.deliveryFile) {
        formData.append(
          "deliveryAttachments",
          deliveryDetails.deliveryFile as Blob
        );
      }

      // Enviar todo en una sola petición
      await axios.put(
        `${import.meta.env.VITE_URL_SERVER}/parcel/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Actualizar el estado local
      set({ isLoading: false });

      // Recargar para obtener la información actualizada
      await get().getParcels();

      toast.success("Detalles de entrega actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar detalles de entrega:", error);
      set({
        error: "Error al actualizar detalles de entrega",
        isLoading: false,
      });
      toast.error("Error al actualizar detalles de entrega");
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },
}));
