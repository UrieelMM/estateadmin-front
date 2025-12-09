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
        maxWidth = 200; // Firmas más pequeñas y optimizadas
        maxHeight = 100;
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
      const quality = isLogo ? 0.8 : 0.5; // 80% para logos, 50% para firmas (mayor compresión)
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
  signatureUrl: string;
  signatureBase64: string;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchSignatures: (force?: boolean) => Promise<void>;
  ensureSignaturesLoaded: () => Promise<boolean>;
  isSignatureAvailable: () => boolean;
  retryCount: number;
}

export const useSignaturesStore = create<SignaturesState>()((set, get) => ({
  adminCompany: "",
  adminPhone: "",
  adminEmail: "",
  logoBase64: "",
  signatureUrl: "",
  signatureBase64: "",
  loading: false,
  error: null,
  initialized: false,
  retryCount: 0,

  fetchSignatures: async (force: boolean = false) => {
    const state = get();

    // Si ya tenemos las firmas cargadas, no es necesario volver a cargarlas (a menos que sea forzado)
    if (!force && state.initialized && !state.error && state.signatureBase64) {
      return;
    }

    // Evitar múltiples llamadas concurrentes
    if (state.loading) {
      return;
    }

    set({ loading: true, error: null });

    const maxRetries = 3;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
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
        let signatureUrl = "";
        let signatureBase64 = "";

        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          adminCompany = clientData.companyName || "";
          adminPhone = clientData.phoneNumber || "";
          adminEmail = clientData.email || "";

          const logoUrl = clientData.logoReports || "";
          const signUrl = clientData.signatureUrl || "";
          signatureUrl = signUrl;

          // Cargar logo si existe
          if (logoUrl) {
            try {
              logoBase64 = await getBase64FromUrl(logoUrl, true);
            } catch (logoError) {
              console.warn("Error al cargar logo:", logoError);
              // No es crítico si el logo falla
            }
          }

          // Cargar firma si existe
          if (signUrl) {
            try {
              signatureBase64 = await getBase64FromUrl(signUrl, false);
              // Validar que la firma se cargó correctamente
            } catch (signError) {
              console.warn(
                `Error al cargar firma (intento ${
                  currentRetry + 1
                }/${maxRetries}):`,
                signError
              );
              if (currentRetry < maxRetries - 1) {
                currentRetry++;
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo antes del retry
                continue;
              } else {
                console.warn(
                  "No se pudo cargar la firma después de los reintentos. Se continuará sin firma optimizada."
                );
                signatureBase64 = ""; // Fallback a vacío, pero permitimos continuar para guardar signatureUrl
              }
            }
          }
        }

        // Si llegamos aquí, la carga fue exitosa (o con fallbacks)
        set({
          adminCompany,
          adminPhone,
          adminEmail,
          logoBase64,
          signatureUrl,
          signatureBase64,
          loading: false,
          initialized: true,
          error: null,
          retryCount: currentRetry,
        });
        return;
      } catch (error: any) {
        // Error CRÍTICO (ej. Firestore falló, no hay usuario, etc) - Detiene todo
        console.error(
          `Error crítico al cargar datos (intento ${currentRetry + 1}/${maxRetries}):`,
          error
        );

        if (currentRetry < maxRetries - 1) {
          currentRetry++;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2 segundos antes del retry
        } else {
          // Último intento falló
          set({
            error:
              error.message ||
              "Error al cargar firmas después de múltiples intentos",
            loading: false,
            retryCount: currentRetry + 1,
          });
          throw error;
        }
      }
    }
  },

  ensureSignaturesLoaded: async (): Promise<boolean> => {
    const state = get();

    // Si ya están cargadas correctamente, retornar true
    if (state.initialized && !state.error && state.signatureBase64) {
      return true;
    }

    // Si está cargando, esperar hasta que termine
    if (state.loading) {
      // Esperar hasta que termine la carga (máximo 10 segundos)
      let attempts = 0;
      const maxAttempts = 50; // 50 * 200ms = 10 segundos

      while (get().loading && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }
    }

    // Si después de esperar aún no están cargadas, intentar cargarlas
    if (!get().initialized || get().error || !get().signatureBase64) {
      try {
        await get().fetchSignatures(true); // Forzar recarga
        return (
          get().initialized && !get().error && Boolean(get().signatureBase64)
        );
      } catch (error) {
        return false;
      }
    }

    return true;
  },

  isSignatureAvailable: (): boolean => {
    const state = get();
    return state.initialized && !state.error && Boolean(state.signatureBase64);
  },
}));
