import { getAuth, getIdTokenResult } from "firebase/auth";
import { create } from "./createStore";
import { streamGeminiResponse } from "../services/geminiService";
import {
  buildIncomeAIReportPrompt,
  INCOME_AI_REPORT_TEMPLATES,
  type IncomeAIReportTemplateId,
  type IncomeCanonicalMetrics,
} from "../presentation/screens/dashboard/financialIncome/Income/aiReportTemplates";

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
  openModal: () => void;
  closeModal: () => void;
  setTemplate: (templateId: IncomeAIReportTemplateId) => void;
  setCustomInstruction: (value: string) => void;
  clearReport: () => void;
  generateReport: (payload: GenerateIncomeAIReportPayload) => Promise<void>;
};

export const useIncomeAIReportStore = create<IncomeAIReportState>()(
  (set, get) => ({
    open: false,
    selectedTemplateId: "executive",
    customInstruction: "",
    report: "",
    isGenerating: false,
    error: null,

    openModal: () => set({ open: true }),
    closeModal: () => set({ open: false }),
    setTemplate: (templateId) => set({ selectedTemplateId: templateId }),
    setCustomInstruction: (value) => set({ customInstruction: value }),
    clearReport: () => set({ report: "", error: null }),

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

        const prompt = buildIncomeAIReportPrompt({
          template,
          canonical,
          snapshot,
          customInstruction: customInstruction.trim() || undefined,
        });

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
              set((state) => ({ report: state.report + chunk }));
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
      } catch (error: any) {
        set({
          error:
            error?.message || "No fue posible generar el reporte con IA.",
        });
      } finally {
        set({ isGenerating: false });
      }
    },
  })
);

