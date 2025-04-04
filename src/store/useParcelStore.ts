// publicationsStore.ts
import { create } from "./createStore";
import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";

type ParcelReception = {
  receptor: string;
  email: string;
  recipientName: string;
  dateReception: string;
  hourReception: string;
  comments?: string;
  file: File | File[] | null;
};

type ParcelState = {
  addParcelReception: (parcelReception: ParcelReception) => Promise<void>;
};

export const useParcelReceptionStore = create<ParcelState>()(() => ({
  addParcelReception: async (parcelReception) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;
    const condominiumId = localStorage.getItem("condominiumId");

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("condominiumId", condominiumId as string);
    formData.append("email", parcelReception.email);
    formData.append("receptor", parcelReception.receptor);
    formData.append("recipientName", parcelReception.recipientName);
    formData.append("dateReception", parcelReception.dateReception);
    formData.append("hourReception", parcelReception.hourReception);
    formData.append("comments", parcelReception.comments || "");
    formData.append("attachments", parcelReception.file as Blob);

    try {
      await axios.post(
        `${import.meta.env.VITE_URL_SERVER}/parcel/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      throw new Error("Error al enviar la publicación");
    }
  },
}));
