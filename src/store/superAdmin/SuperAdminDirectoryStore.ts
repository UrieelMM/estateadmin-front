import { create } from "../createStore";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { getSuperAdminSessionToken } from "../../services/superAdminService";

type DirectoryState = {
  loading: boolean;
  error: string | null;
  clientNames: Record<string, string>;
  condominiumNames: Record<string, string>;
  fetchDirectory: () => Promise<void>;
};

const useSuperAdminDirectoryStore = create<DirectoryState>()((set) => ({
  loading: false,
  error: null,
  clientNames: {},
  condominiumNames: {},

  fetchDirectory: async () => {
    if (!getSuperAdminSessionToken()) {
      set({ error: "No tienes una sesión válida de Super Admin." });
      return;
    }

    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const clientsSnap = await getDocs(collection(db, "clients"));

      const clientNames: Record<string, string> = {};
      const condominiumNames: Record<string, string> = {};

      await Promise.all(
        clientsSnap.docs.map(async (clientDoc) => {
          const clientData = clientDoc.data() as any;
          const clientId = clientDoc.id;
          clientNames[clientId] =
            String(clientData.companyName || clientData.businessName || "Cliente");

          const condoSnap = await getDocs(
            collection(db, `clients/${clientId}/condominiums`)
          );

          condoSnap.docs.forEach((condoDoc) => {
            const condoData = condoDoc.data() as any;
            const key = `${clientId}__${condoDoc.id}`;
            condominiumNames[key] = String(
              condoData.name || condoData.number || "Condominio"
            );
          });
        })
      );

      set({
        loading: false,
        error: null,
        clientNames,
        condominiumNames,
      });
    } catch (error: any) {
      console.error("Error al cargar directorio de Super Admin:", error);
      set({
        loading: false,
        error: error?.message || "No se pudo cargar el directorio.",
      });
    }
  },
}));

export default useSuperAdminDirectoryStore;
