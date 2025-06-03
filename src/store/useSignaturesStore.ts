import { create } from "./createStore";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Función auxiliar para convertir una URL de imagen a base64 con optimización
async function getBase64FromUrl(
  url: string,
  isLogo: boolean = false
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Crear canvas para redimensionar y comprimir
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      // Establecer dimensiones máximas según el tipo de imagen
      let maxWidth, maxHeight;
      if (isLogo) {
        maxWidth = 400; // Logos pueden ser un poco más grandes
        maxHeight = 400;
      } else {
        maxWidth = 300; // Firmas más pequeñas
        maxHeight = 150;
      }

      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Configurar canvas con las nuevas dimensiones
      canvas.width = width;
      canvas.height = height;

      // Fondo blanco para imágenes con transparencia
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      // Dibujar la imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a base64 con compresión JPEG (más eficiente)
      const quality = isLogo ? 0.8 : 0.7; // 80% para logos, 70% para firmas
      const base64 = canvas.toDataURL("image/jpeg", quality);
      resolve(base64);
    };

    img.onerror = () => {
      // Fallback: usar el método original si hay error con la optimización
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    };

    // Crear URL del blob para cargar en la imagen
    const objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
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
          logoBase64 = await getBase64FromUrl(logoUrl, true);
        }
        if (signUrl) {
          signatureBase64 = await getBase64FromUrl(signUrl, false);
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
