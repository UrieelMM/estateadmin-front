import { create } from "zustand";
import { produce } from "immer"; // Para mutaciones inmutables más sencillas
import { streamGeminiResponse } from "../services/geminiService"; // Importamos el servicio

// --- Tipos ---

export type ChatMessageSender = "user" | "bot";

export interface ChatMessage {
  id: string; // Identificador único para cada mensaje (útil para React keys)
  sender: ChatMessageSender;
  text: string;
  timestamp: number; // Para ordenar y mostrar la hora
}

// Estructura del historial para enviar al backend
export interface HistoryMessage {
  role: ChatMessageSender;
  parts: { text: string }[];
}

interface ChatBotState {
  isOpen: boolean;
  messages: ChatMessage[];
  input: string;
  file: File | null;
  isLoading: boolean;
  error: string | null;
  clientId: string | null; // Para pasar al backend
  condominiumId: string | null; // Para pasar al backend
}

interface ChatBotActions {
  toggleChat: () => void;
  setInput: (input: string) => void;
  setFile: (file: File | null) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage; // Devuelve el mensaje añadido
  updateLastBotMessage: (chunk: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void; // Para reiniciar la conversación
  sendMessage: (basePrompt: string, contextPrompt: string) => Promise<void>; // Acción principal
  initializeContext: (clientId: string, condominiumId: string) => void; // Para guardar IDs
}

// --- Store ---

const initialState: ChatBotState = {
  isOpen: false,
  messages: [],
  input: "",
  file: null,
  isLoading: false,
  error: null,
  clientId: null,
  condominiumId: null,
};

export const useChatBotStore = create<ChatBotState & ChatBotActions>()(
  (set, get) => ({
    ...initialState,

    initializeContext: (clientId, condominiumId) =>
      set({ clientId, condominiumId }),

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

    setInput: (input) => set({ input }),

    setFile: (file) => set({ file }),

    addMessage: (message) => {
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      set(
        produce((draft: ChatBotState) => {
          draft.messages.push(newMessage);
        })
      );
      return newMessage;
    },

    updateLastBotMessage: (chunk) => {
      set(
        produce((draft: ChatBotState) => {
          const lastMessage = draft.messages[draft.messages.length - 1];
          if (lastMessage && lastMessage.sender === "bot") {
            lastMessage.text += chunk;
          }
        })
      );
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    clearChat: () =>
      set(
        produce((draft: ChatBotState) => {
          draft.messages = [];
          draft.input = "";
          draft.file = null;
          draft.isLoading = false;
          draft.error = null;
        })
      ),

    // Acción principal para enviar mensaje
    sendMessage: async (basePrompt, contextPrompt) => {
      const {
        input,
        file,
        messages,
        addMessage,
        setLoading,
        setError,
        updateLastBotMessage,
        clientId,
        condominiumId,
      } = get();

      if (!input.trim() && !file) {
        setError("Por favor escribe un mensaje o adjunta un archivo.");
        return;
      }

      setLoading(true);
      setError(null);

      const userMessageText = input;
      addMessage({ sender: "user", text: userMessageText });
      set({ input: "" });

      const historyForBackend: Omit<ChatMessage, "id" | "timestamp">[] =
        messages
          .slice(0, -1) // Excluir el mensaje del usuario actual y el mensaje vacío del bot
          .filter((msg) => msg.sender === "user" || msg.sender === "bot") // Asegurar solo user/bot
          .map(({ sender, text }) => ({ sender, text })); // Mapear al formato simple

      const botMessage = addMessage({ sender: "bot", text: "" });

      let currentMessageText = userMessageText;
      if (historyForBackend.length === 0) {
        currentMessageText = `${basePrompt}\n\n${contextPrompt}\n\n${userMessageText}`;
      } else {
        currentMessageText = `${contextPrompt}\n\n${userMessageText}`;
      }

      try {
        await streamGeminiResponse(
          {
            history: historyForBackend,
            prompt: currentMessageText,
            file: file,
            clientId: clientId ?? undefined,
            condominiumId: condominiumId ?? undefined,
          },
          {
            onChunk: (chunk) => {
              updateLastBotMessage(chunk);
            },
            onError: (err) => {
              console.error("Error en stream:", err);
              setError(err.message || "Error recibiendo la respuesta.");
              updateLastBotMessage(`\n\n--- Error: ${err.message} ---`);
            },
            onComplete: () => {
              console.log("Stream completo.");
            },
          }
        );
      } catch (err: any) {
        console.error("Error llamando a streamGeminiResponse:", err);
        setError(err.message || "Ocurrió un error al procesar tu solicitud.");
        set(
          produce((draft: ChatBotState) => {
            if (
              draft.messages[draft.messages.length - 1]?.id === botMessage.id
            ) {
              draft.messages[
                draft.messages.length - 1
              ].text = `Lo siento, ocurrió un error: ${
                err.message || "Intenta de nuevo más tarde."
              }`;
            }
          })
        );
      } finally {
        setLoading(false);
        set({ file: null });
      }
    },
  })
);

// Opcional: Selector para obtener solo el estado sin las acciones
export const useChatBotState = () => useChatBotStore((state) => state);
