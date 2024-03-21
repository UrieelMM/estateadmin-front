// publicationsStore.ts
import { create } from "zustand";
import axios from "axios";
import { getAuth, getIdTokenResult } from "firebase/auth";

type Publication = {
  title: string;
  author: string;
  tags: string;
  content: string;
  file: File | null;
  sendTo: string;
  condominiumName: string;
  condominiumId: string;
};

type PublicationsState = {
  addPublication: (publication: Publication) => Promise<void>;
};

export const usePublicationStore = create<PublicationsState>(() => ({
  addPublication: async (publication) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    const tokenResult = await getIdTokenResult(user);
    const clientId = tokenResult.claims["clientId"] as string;

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("title", publication.title);
    formData.append("author", publication.author);
    formData.append("tags", publication.tags);
    formData.append("content", publication.content);
    formData.append("condominiumName", publication.condominiumName);
    formData.append("condominiumId", publication.condominiumId);
    formData.append("sendTo", publication.sendTo);
    formData.append("attachments", publication.file as Blob);

    try {
      await axios.post("https://5jm8tk3r-3000.usw3.devtunnels.ms/publications/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      throw new Error("Error al enviar la publicación");
    }
  },
}));
