import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import { streamGeminiResponse, type GeminiUsageMeta } from "../services/geminiService";
import {
  buildQuotaExceededMessage,
  consumeFeatureQuota,
  getFeatureQuotaStatus,
  recordFeatureUsage,
} from "../services/aiUsageTrackingService";
import {
  buildPublicationDraftPrompt,
  PUBLICATION_AI_TEMPLATES,
  type PublicationAITemplateId,
} from "../presentation/components/shared/forms/publicationAITemplates";

type GeneratePublicationDraftInput = {
  idea: string;
  title?: string;
  tag?: string;
  sendTo?: string;
  author?: string;
};

type PublicationAIState = {
  selectedTemplateId: PublicationAITemplateId;
  draft: string;
  isGenerating: boolean;
  error: string | null;
  quotaRemaining: number;
  quotaLimit: number;
  quotaResetAt: string | null;
  setTemplate: (templateId: PublicationAITemplateId) => void;
  clearDraft: () => void;
  refreshQuotaStatus: () => Promise<void>;
  generateDraft: (input: GeneratePublicationDraftInput) => Promise<void>;
};

const FEATURE_KEY = "publication_draft";

function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export const usePublicationAIStore = create<PublicationAIState>()((set, get) => ({
  selectedTemplateId: "general_notice",
  draft: "",
  isGenerating: false,
  error: null,
  quotaRemaining: 5,
  quotaLimit: 5,
  quotaResetAt: null,

  setTemplate: (templateId) => set({ selectedTemplateId: templateId }),
  clearDraft: () => set({ draft: "", error: null }),

  refreshQuotaStatus: async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const tokenResult = await getIdTokenResult(user);
      const claimClientId = tokenResult.claims["clientId"];
      const clientId =
        typeof claimClientId === "string" ? claimClientId : undefined;
      const condominiumId = localStorage.getItem("condominiumId") || undefined;
      if (!clientId || !condominiumId) return;

      const quota = await getFeatureQuotaStatus({
        clientId,
        condominiumId,
        feature: FEATURE_KEY,
      });
      set({
        quotaRemaining: quota.remaining,
        quotaLimit: quota.limit,
        quotaResetAt: quota.resetAt,
      });
    } catch (_error) {
      // No bloqueamos UX.
    }
  },

  generateDraft: async (input) => {
    set({ isGenerating: true, error: null, draft: "" });

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const claimClientId = tokenResult.claims["clientId"];
      const clientId =
        typeof claimClientId === "string" ? claimClientId : undefined;
      const condominiumId = localStorage.getItem("condominiumId") || undefined;
      if (!clientId || !condominiumId) {
        throw new Error("No se pudo identificar cliente/condominio.");
      }

      const quota = await consumeFeatureQuota({
        clientId,
        condominiumId,
        feature: FEATURE_KEY,
      });

      set({
        quotaRemaining: quota.remaining,
        quotaLimit: quota.limit,
        quotaResetAt: quota.resetAt,
      });

      if (!quota.allowed) {
        set({
          error: buildQuotaExceededMessage(quota.resetAt, quota.limit),
          isGenerating: false,
        });
        return;
      }

      const selectedTemplate = PUBLICATION_AI_TEMPLATES.find(
        (template) => template.id === get().selectedTemplateId
      );
      if (!selectedTemplate) {
        throw new Error("Plantilla IA no válida.");
      }
      const prompt = buildPublicationDraftPrompt({
        template: selectedTemplate,
        ...input,
      });
      let usageMeta: GeminiUsageMeta = {};
      let generatedText = "";

      await streamGeminiResponse(
        {
          history: [],
          prompt,
          clientId,
          condominiumId,
        },
        {
          onChunk: (chunk) => {
            if (chunk === "[DONE]") return;
            generatedText += chunk;
            set((state) => ({ draft: state.draft + chunk }));
          },
          onUsage: (usage) => {
            usageMeta = {
              inputTokens:
                (usageMeta.inputTokens || 0) + (usage.inputTokens || 0),
              outputTokens:
                (usageMeta.outputTokens || 0) + (usage.outputTokens || 0),
              totalTokens:
                (usageMeta.totalTokens || 0) + (usage.totalTokens || 0),
              model: usage.model || usageMeta.model,
              estimated:
                typeof usage.estimated === "boolean"
                  ? usage.estimated
                  : usageMeta.estimated,
              source: usage.source || usageMeta.source,
            };
          },
          onError: (streamError) => {
            set({
              error:
                streamError.message ||
                "No fue posible generar el borrador con IA.",
            });
          },
          onComplete: () => undefined,
        }
      );

      const finalInputTokens =
        usageMeta.inputTokens && usageMeta.inputTokens > 0
          ? usageMeta.inputTokens
          : estimateTokenCount(prompt);
      const finalOutputTokens =
        usageMeta.outputTokens && usageMeta.outputTokens > 0
          ? usageMeta.outputTokens
          : estimateTokenCount(generatedText);
      const finalTotalTokens =
        usageMeta.totalTokens && usageMeta.totalTokens > 0
          ? usageMeta.totalTokens
          : finalInputTokens + finalOutputTokens;
      const estimated =
        typeof usageMeta.estimated === "boolean"
          ? usageMeta.estimated
          : !usageMeta.totalTokens || usageMeta.totalTokens <= 0;

      await recordFeatureUsage({
        clientId,
        condominiumId,
        feature: FEATURE_KEY,
        inputTokens: finalInputTokens,
        outputTokens: finalOutputTokens,
        totalTokens: finalTotalTokens,
        estimated,
        model: usageMeta.model,
        status: get().error ? "error" : "success",
        errorMessage: get().error || undefined,
      });

      await get().refreshQuotaStatus();
    } catch (error: any) {
      set({
        error:
          error?.message || "No fue posible generar el borrador con IA.",
      });

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const tokenResult = await getIdTokenResult(user);
          const claimClientId = tokenResult.claims["clientId"];
          const clientId =
            typeof claimClientId === "string" ? claimClientId : undefined;
          const condominiumId =
            localStorage.getItem("condominiumId") || undefined;
          if (clientId && condominiumId) {
            await recordFeatureUsage({
              clientId,
              condominiumId,
              feature: FEATURE_KEY,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              estimated: true,
              status: "error",
              errorMessage:
                error?.message ||
                "No fue posible generar el borrador con IA.",
            });
          }
        }
      } catch (_trackingError) {
        // no-op
      }
    } finally {
      set({ isGenerating: false });
    }
  },
}));
