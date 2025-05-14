import { create } from "./createStore";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Función auxiliar para convertir una URL de imagen a base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

// Función para obtener el usuario actual y su token
async function getCurrentUserAndToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const tokenResult = await getIdTokenResult(user);
  const clientId = tokenResult.claims["clientId"] as string;
  if (!clientId) throw new Error("No se encontró clientId en los claims");

  const condominiumId = localStorage.getItem("condominiumId");
  if (!condominiumId) throw new Error("Condominio no seleccionado");

  return { user, clientId, condominiumId };
}

interface SignaturesState {
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureBase64: string;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchSignatures: () => Promise<void>;
}

export const useSignaturesStore = create<SignaturesState>()((set, get) => ({
  adminCompany: "",
  adminPhone: "",
  adminEmail: "",
  logoBase64: "",
  signatureBase64: "",
  loading: false,
  error: null,
  initialized: false,

  fetchSignatures: async () => {
    // Si ya tenemos las firmas cargadas y no hay error, no es necesario volver a cargarlas
    if (get().initialized && !get().error && get().signatureBase64) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const { clientId } = await getCurrentUserAndToken();
      const db = getFirestore();

      // Obtener datos de la administradora
      const clientDocRef = doc(db, "clients", clientId);
      const clientDocSnap = await getDoc(clientDocRef);

      let adminCompany = "";
      let adminPhone = "";
      let adminEmail = "";
      let logoBase64 = "";
      let signatureBase64 = "";

      if (clientDocSnap.exists()) {
        const clientData = clientDocSnap.data();
        adminCompany = clientData.companyName || "";
        adminPhone = clientData.phoneNumber || "";
        adminEmail = clientData.email || "";

        const logoUrl = clientData.logoReports || "";
        const signUrl = clientData.signatureUrl || "";

        console.log("URL de firma:", signUrl); // Log para depuración

        if (logoUrl) {
          logoBase64 = await getBase64FromUrl(logoUrl);
        }
        if (signUrl) {
          signatureBase64 = await getBase64FromUrl(signUrl);
        }
      }

      set({
        adminCompany,
        adminPhone,
        adminEmail,
        logoBase64,
        signatureBase64,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      console.error("Error al cargar firmas:", error);
      set({
        error: error.message || "Error al cargar firmas",
        loading: false,
      });
    }
  },
}));
