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

// Ya no se necesita fileToBase64
// async function fileToBase64(...) { ... }

export const streamGeminiResponse = async (
  payload: StreamRequestPayload, // La interfaz ya contempla el archivo como File
  callbacks: {
    onChunk: (chunk: string) => void;
    onError: (error: Error) => void;
    onComplete: () => void;
  }
): Promise<void> => {
  console.log("streamGeminiResponse - Received payload:", payload);

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
        if (chunk.startsWith("data: ")) {
          const data = chunk.substring(6).trim();
          if (data) {
            try {
              let textChunk = data;
              try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed.text === "string") {
                  textChunk = parsed.text;
                }
              } catch (parseError) {}
              callbacks.onChunk(textChunk);
            } catch (e) {
              console.warn("Error procesando chunk SSE:", e, "Data:", data);
            }
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.startsWith("data: ")) {
      const data = buffer.substring(6).trim();
      if (data) {
        try {
          let textChunk = data;
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.text === "string") {
              textChunk = parsed.text;
            }
          } catch (parseError) {}
          callbacks.onChunk(textChunk);
        } catch (e) {
          console.warn("Error procesando chunk final SSE:", e, "Data:", data);
        }
      }
    }
    callbacks.onComplete();
  } catch (error: any) {
    console.error("Error en streamGeminiResponse:", error);
    callbacks.onError(error);
  }
};
