import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import {
  knowledgeBaseService,
  KnowledgeBaseStats,
  ReindexResult,
  AskResult,
} from "../services/knowledgeBaseService";

type TenantContext = {
  clientId: string;
  condominiumId: string;
  idToken: string;
};

const resolveTenantContext = async (): Promise<TenantContext> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const tokenResult = await getIdTokenResult(user);
  const clientId = String(tokenResult.claims["clientId"] || "").trim();
  const condominiumClaim = String(
    tokenResult.claims["condominiumId"] || "",
  ).trim();
  const condominiumStorage = String(
    localStorage.getItem("condominiumId") || "",
  ).trim();
  const condominiumId = condominiumClaim || condominiumStorage;

  if (!clientId || !condominiumId) {
    throw new Error("No se pudo resolver el contexto del condominio");
  }

  const idToken = await user.getIdToken();
  return { clientId, condominiumId, idToken };
};

type KnowledgeBaseState = {
  stats: KnowledgeBaseStats | null;
  lastReindex: ReindexResult | null;
  askResult: AskResult | null;
  loadingStats: boolean;
  reindexing: boolean;
  clearing: boolean;
  asking: boolean;
  error: string | null;
  fetchStats: () => Promise<KnowledgeBaseStats>;
  reindex: () => Promise<ReindexResult>;
  clear: () => Promise<{ deleted: number }>;
  ask: (question: string, topK?: number) => Promise<AskResult>;
  clearError: () => void;
};

const extractMessage = (err: any): string => {
  if (!err) return "Error desconocido";
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Ocurrió un error al comunicarse con el servidor."
  );
};

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()((set) => ({
  stats: null,
  lastReindex: null,
  askResult: null,
  loadingStats: false,
  reindexing: false,
  clearing: false,
  asking: false,
  error: null,

  fetchStats: async () => {
    set({ loadingStats: true, error: null });
    try {
      const ctx = await resolveTenantContext();
      const stats = await knowledgeBaseService.getStats(
        { clientId: ctx.clientId, condominiumId: ctx.condominiumId },
        ctx.idToken,
      );
      set({ stats, loadingStats: false });
      return stats;
    } catch (err) {
      const message = extractMessage(err);
      set({ loadingStats: false, error: message });
      throw new Error(message);
    }
  },

  reindex: async () => {
    set({ reindexing: true, error: null });
    try {
      const ctx = await resolveTenantContext();
      const result = await knowledgeBaseService.reindex(
        { clientId: ctx.clientId, condominiumId: ctx.condominiumId },
        ctx.idToken,
      );
      // Refrescamos stats al finalizar
      try {
        const stats = await knowledgeBaseService.getStats(
          { clientId: ctx.clientId, condominiumId: ctx.condominiumId },
          ctx.idToken,
        );
        set({ stats });
      } catch {
        // No bloqueante
      }
      set({ lastReindex: result, reindexing: false });
      return result;
    } catch (err) {
      const message = extractMessage(err);
      set({ reindexing: false, error: message });
      throw new Error(message);
    }
  },

  clear: async () => {
    set({ clearing: true, error: null });
    try {
      const ctx = await resolveTenantContext();
      const result = await knowledgeBaseService.clear(
        { clientId: ctx.clientId, condominiumId: ctx.condominiumId },
        ctx.idToken,
      );
      try {
        const stats = await knowledgeBaseService.getStats(
          { clientId: ctx.clientId, condominiumId: ctx.condominiumId },
          ctx.idToken,
        );
        set({ stats });
      } catch {
        // No bloqueante
      }
      set({ clearing: false });
      return result;
    } catch (err) {
      const message = extractMessage(err);
      set({ clearing: false, error: message });
      throw new Error(message);
    }
  },

  ask: async (question, topK) => {
    set({ asking: true, error: null });
    try {
      const ctx = await resolveTenantContext();
      const askResult = await knowledgeBaseService.ask(
        {
          clientId: ctx.clientId,
          condominiumId: ctx.condominiumId,
          question,
          topK,
        },
        ctx.idToken,
      );
      set({ askResult, asking: false });
      return askResult;
    } catch (err) {
      const message = extractMessage(err);
      set({ asking: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
