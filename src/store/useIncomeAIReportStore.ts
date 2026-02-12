import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import { streamGeminiResponse, type GeminiUsageMeta } from "../services/geminiService";
import {
  buildIncomeAIReportPrompt,
  INCOME_AI_REPORT_TEMPLATES,
  type IncomeAIReportTemplateId,
  type IncomeCanonicalMetrics,
} from "../presentation/screens/dashboard/financialIncome/Income/aiReportTemplates";
import {
  buildQuotaExceededMessage,
  consumeFeatureQuota,
  getFeatureQuotaStatus,
  recordFeatureUsage,
} from "../services/aiUsageTrackingService";

type GenerateIncomeAIReportPayload = {
  snapshot: unknown;
  canonical: IncomeCanonicalMetrics;
};

type IncomeAIReportState = {
  open: boolean;
  selectedTemplateId: IncomeAIReportTemplateId;
  customInstruction: string;
  report: string;
  isGenerating: boolean;
  error: string | null;
  quotaRemaining: number;
  quotaLimit: number;
  quotaResetAt: string | null;
  openModal: () => void;
  closeModal: () => void;
  setTemplate: (templateId: IncomeAIReportTemplateId) => void;
  setCustomInstruction: (value: string) => void;
  clearReport: () => void;
  generateReport: (payload: GenerateIncomeAIReportPayload) => Promise<void>;
  refreshQuotaStatus: () => Promise<void>;
};

const FEATURE_KEY = "income_report";

function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export const useIncomeAIReportStore = create<IncomeAIReportState>()(
  (set, get) => ({
    open: false,
    selectedTemplateId: "executive",
    customInstruction: "",
    report: "",
    isGenerating: false,
    error: null,
    quotaRemaining: 5,
    quotaLimit: 5,
    quotaResetAt: null,

    openModal: () => {
      set({ open: true });
      get().refreshQuotaStatus();
    },
    closeModal: () => set({ open: false }),
    setTemplate: (templateId) => set({ selectedTemplateId: templateId }),
    setCustomInstruction: (value) => set({ customInstruction: value }),
    clearReport: () => set({ report: "", error: null }),

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
        // No bloqueamos UI si falla consulta de cuota.
      }
    },

    generateReport: async ({ snapshot, canonical }) => {
      const { selectedTemplateId, customInstruction } = get();
      const template = INCOME_AI_REPORT_TEMPLATES.find(
        (item) => item.id === selectedTemplateId
      );

      if (!template) {
        set({ error: "Plantilla de reporte no válida." });
        return;
      }

      set({ isGenerating: true, error: null, report: "" });

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error("Usuario no autenticado");
        }

        const tokenResult = await getIdTokenResult(user);
        const claimClientId = tokenResult.claims["clientId"];
        const clientId = typeof claimClientId === "string" ? claimClientId : undefined;
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
          await get().refreshQuotaStatus();
          return;
        }

        const prompt = buildIncomeAIReportPrompt({
          template,
          canonical,
          snapshot,
          customInstruction: customInstruction.trim() || undefined,
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
              set((state) => ({ report: state.report + chunk }));
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
            onError: (errorStream) => {
              set({
                error:
                  errorStream.message ||
                  "No fue posible generar el reporte con IA.",
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
            error?.message || "No fue posible generar el reporte con IA.",
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
                  "No fue posible generar el reporte con IA.",
              });
            }
          }
        } catch (_trackingError) {
          // Evitar romper flujo de UI por fallos de tracking.
        }
      } finally {
        try {
          await get().refreshQuotaStatus();
        } catch (_error) {
          // no-op
        }
        set({ isGenerating: false });
      }
    },
  })
);
