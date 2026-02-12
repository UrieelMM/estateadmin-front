import { create } from "../createStore";
import {
  collectionGroup,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export type AIUsageCondominiumRow = {
  key: string;
  clientId: string;
  condominiumId: string;
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
};

export type AIUsageFeatureRow = {
  feature: string;
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
};

type AIUsageAdminStoreState = {
  loading: boolean;
  error: string | null;
  totalRequests: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byCondominium: AIUsageCondominiumRow[];
  byFeature: AIUsageFeatureRow[];
  fetchOverview: (days?: number) => Promise<void>;
};

function toDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const useAIUsageAdminStore = create<AIUsageAdminStoreState>()((set) => ({
  loading: false,
  error: null,
  totalRequests: 0,
  totalTokens: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  byCondominium: [],
  byFeature: [],

  fetchOverview: async (days = 7) => {
    set({ loading: true, error: null });
    try {
      const db = getFirestore();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - Math.max(0, days - 1));
      const fromDateKey = toDateKey(fromDate);

      const q = query(
        collectionGroup(db, "aiUsageDaily"),
        where("dateKey", ">=", fromDateKey),
        orderBy("dateKey", "desc")
      );

      const snap = await getDocs(q);
      const condoMap = new Map<string, AIUsageCondominiumRow>();
      const featureMap = new Map<string, AIUsageFeatureRow>();

      let totalRequests = 0;
      let totalTokens = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const clientId = String(data.clientId || "");
        const condominiumId = String(data.condominiumId || "");
        const key = `${clientId}__${condominiumId}`;
        const requests = Number(data.totalRequests || 0);
        const tokens = Number(data.totalTokens || 0);
        const input = Number(data.totalInputTokens || 0);
        const output = Number(data.totalOutputTokens || 0);

        totalRequests += requests;
        totalTokens += tokens;
        totalInputTokens += input;
        totalOutputTokens += output;

        const currentCondo = condoMap.get(key) || {
          key,
          clientId,
          condominiumId,
          totalRequests: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
        currentCondo.totalRequests += requests;
        currentCondo.totalTokens += tokens;
        currentCondo.inputTokens += input;
        currentCondo.outputTokens += output;
        condoMap.set(key, currentCondo);

        const featureUsage = data.featureUsage || {};
        Object.keys(featureUsage).forEach((feature) => {
          const f = featureUsage[feature] || {};
          const fRequests = Number(f.requests || 0);
          const fTokens = Number(f.totalTokens || 0);
          const fInput = Number(f.inputTokens || 0);
          const fOutput = Number(f.outputTokens || 0);
          const currentFeature = featureMap.get(feature) || {
            feature,
            totalRequests: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
          };
          currentFeature.totalRequests += fRequests;
          currentFeature.totalTokens += fTokens;
          currentFeature.inputTokens += fInput;
          currentFeature.outputTokens += fOutput;
          featureMap.set(feature, currentFeature);
        });
      });

      set({
        loading: false,
        totalRequests,
        totalTokens,
        totalInputTokens,
        totalOutputTokens,
        byCondominium: Array.from(condoMap.values()).sort(
          (a, b) => b.totalTokens - a.totalTokens
        ),
        byFeature: Array.from(featureMap.values()).sort(
          (a, b) => b.totalTokens - a.totalTokens
        ),
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error?.message || "No se pudo cargar el consumo de IA.",
      });
    }
  },
}));

export default useAIUsageAdminStore;

