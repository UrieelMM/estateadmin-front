// src/services/geminiService.ts (Ejemplo con SSE)
import { type ChatMessage } from "../store/useChatBotStore"; // Reutilizamos el tipo

// Interfaz ajustada para lo que se pasa a la función
interface StreamRequestPayload {
  history: Omit<ChatMessage, "id" | "timestamp">[];
  prompt: string;
  file?: File | null; // El archivo se pasa como objeto File
  clientId?: string;
  condominiumId?: string;
}

export type GeminiUsageMeta = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  estimated?: boolean;
  source?: string;
};

// Ya no se necesita fileToBase64
// async function fileToBase64(...) { ... }

export const streamGeminiResponse = async (
  payload: StreamRequestPayload, // La interfaz ya contempla el archivo como File
  callbacks: {
    onChunk: (chunk: string) => void;
    onError: (error: Error) => void;
    onComplete: () => void;
    onUsage?: (usage: GeminiUsageMeta) => void;
  }
): Promise<void> => {
  console.log("streamGeminiResponse - Received payload:", payload);

  const processSSEBlock = (rawBlock: string) => {
    const lines = rawBlock.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line) continue;
      if (line.startsWith("event:")) {
        eventName = line.substring(6).trim() || "message";
        continue;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.substring(5).trimStart());
      }
    }

    const data = dataLines.join("\n").trim();
    if (!data) return;

    let parsed: any = null;
    try {
      parsed = JSON.parse(data);
    } catch (_error) {
      parsed = null;
    }

    // Evento dedicado de usage (SSE "event: usage")
    if (eventName === "usage") {
      const usage = parsed?.usage;
      if (usage && typeof usage === "object") {
        callbacks.onUsage?.({
          inputTokens: Number(usage.inputTokens || usage.promptTokens || 0),
          outputTokens: Number(
            usage.outputTokens || usage.completionTokens || 0
          ),
          totalTokens: Number(usage.totalTokens || 0),
          model: usage.model || parsed?.model,
          estimated:
            typeof usage.estimated === "boolean" ? usage.estimated : undefined,
          source: usage.source || parsed?.source,
        });
      }
      return;
    }

    // Compatibilidad: usage embebido en mensajes estándar
    if (parsed && typeof parsed === "object") {
      if (parsed.usage && typeof parsed.usage === "object") {
        callbacks.onUsage?.({
          inputTokens: Number(
            parsed.usage.inputTokens || parsed.usage.promptTokens || 0
          ),
          outputTokens: Number(
            parsed.usage.outputTokens || parsed.usage.completionTokens || 0
          ),
          totalTokens: Number(parsed.usage.totalTokens || 0),
          model: parsed.usage.model || parsed.model,
          estimated:
            typeof parsed.usage.estimated === "boolean"
              ? parsed.usage.estimated
              : undefined,
          source: parsed.usage.source || parsed.source,
        });
      } else if (
        parsed.inputTokens != null ||
        parsed.outputTokens != null ||
        parsed.totalTokens != null
      ) {
        callbacks.onUsage?.({
          inputTokens: Number(parsed.inputTokens || 0),
          outputTokens: Number(parsed.outputTokens || 0),
          totalTokens: Number(parsed.totalTokens || 0),
          model: parsed.model,
          estimated:
            typeof parsed.estimated === "boolean" ? parsed.estimated : undefined,
          source: parsed.source,
        });
      }
    }

    // Contenido textual normal
    if (parsed && typeof parsed.text === "string") {
      callbacks.onChunk(parsed.text);
      return;
    }

    // Fallback para texto plano
    callbacks.onChunk(data);
  };

  try {
    // 1. Crear FormData
    const formData = new FormData();

    // 2. Añadir campos de texto
    formData.append("prompt", payload.prompt);
    // Serializar el historial como JSON string
    formData.append("history", JSON.stringify(payload.history));
    if (payload.clientId) {
      formData.append("clientId", payload.clientId);
    }
    if (payload.condominiumId) {
      formData.append("condominiumId", payload.condominiumId);
    }

    // 3. Añadir el archivo si existe
    if (payload.file) {
      console.log(
        "streamGeminiResponse - Appending file to FormData:",
        payload.file.name
      );
      // El backend espera el archivo en un campo llamado 'file'
      formData.append("file", payload.file);
    } else {
      console.log("streamGeminiResponse - No file to append.");
    }

    // Log para ver el FormData (limitado, no muestra el contenido binario)
    // console.log("streamGeminiResponse - FormData entries:");
    // for (let [key, value] of formData.entries()) {
    //     console.log(`${key}:`, value);
    // }

    // 4. Realizar la llamada fetch con FormData
    const response = await fetch(
      `${import.meta.env.VITE_URL_SERVER}/gemini/generate-stream`,
      {
        method: "POST",
        // NO establecer Content-Type, el navegador lo hará automáticamente
        // con el boundary correcto para multipart/form-data
        headers: {
          // Mantener Accept para indicar que esperamos un stream SSE
          Accept: "text/event-stream",
          // Añadir cabeceras de autenticación si son necesarias
          // 'Authorization': `Bearer ${token}`,
        },
        body: formData, // Enviar el objeto FormData
      }
    );

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMsg = errorBody.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error("La respuesta del stream está vacía.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const chunk = buffer.substring(0, boundary);
        buffer = buffer.substring(boundary + 2);
        try {
          processSSEBlock(chunk);
        } catch (e) {
          console.warn("Error procesando bloque SSE:", e, "Block:", chunk);
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) {
      try {
        processSSEBlock(buffer.trim());
      } catch (e) {
        console.warn("Error procesando bloque SSE final:", e, "Block:", buffer);
      }
    }
    callbacks.onComplete();
  } catch (error: any) {
    console.error("Error en streamGeminiResponse:", error);
    callbacks.onError(error);
  }
};
