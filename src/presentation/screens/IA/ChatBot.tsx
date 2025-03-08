import React, { useState, useEffect, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { model } from '../../../firebase/firebase';
import {
  PaperClipIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { usePaymentSummaryStore } from '../../../store/paymentSummaryStore';

/**
 * Tipo para cada mensaje en la UI.
 */
type LocalMessage = {
  sender: 'user' | 'bot';
  text: string;
};

/**
 * Estructura que Vertex AI espera:
 * { role: "user" | "model" | "function", parts: { text: string }[] }
 */
interface VertexAIMsg {
  role: 'user' | 'model' | 'function';
  parts: { text: string }[];
}

/**
 * Prompt base para el primer mensaje user
 * (la API de Vertex AI pide que el primer contenido sea "user").
 */
const BASE_PROMPT = `
Eres un asistente virtual especializado en la administración de condominios.
Tu función principal es ayudar a los usuarios con:
- Creación y consulta de pagos
- Creación y consulta de egresos
- Generación de balances generales
- Calendario de eventos
- Gestión de proveedores
- Reportes de mantenimiento

Responde únicamente sobre temas que tengan relación con la gestión de condominios 
y los puntos mencionados.
Si el usuario hace preguntas fuera de este ámbito 
(por ejemplo, temas personales o irrelevantes a la administración de condominios),
responde educadamente que no puedes atender esa consulta.

Responde siempre en español y de manera clara, breve y concisa.
Evita dar información contradictoria o inventada.
`;

/**
 * Convierte un archivo a Base64, para pasarlo a Vertex AI como inlineData.
 */
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

/**
 * ChatBot que inyecta los últimos 5 pagos en el primer prompt.
 */
const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1) Obtenemos la data del store
  const payments = usePaymentSummaryStore((s) => s.payments);

  // Auto-scroll cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Abre/cierra el chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Manejar el archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  // 2) Función para generar un resumen con los últimos 5 pagos
  function generateLast5PaymentsContext(): string {
    const last5 = payments.slice(0, 5); // o .slice(-5) si quieres los más recientes
    if (last5.length === 0) {
      return 'No hay pagos registrados en el store.';
    }
    // Crea una pequeña lista tipo:
    // - Pago #1: Condo 101, Monto pagado 500
    // - Pago #2: ...
    return `Estos son los últimos 5 pagos registrados:
${last5
  .map((p, index) => {
    return `Pago #${index + 1}: Condo ${p.numberCondominium}, Pagado: ${p.amountPaid}, Pendiente: ${p.amountPending}`;
  })
  .join('\n')}
---
`;
  }

  // Manejo del envío de mensaje (con streaming)
  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const userMessage: LocalMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Convertimos nuestro historial local a la forma VertexAIMsg
      let conversationHistory: VertexAIMsg[] = messages.map((msg) => {
        const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';
        return {
          role,
          parts: [{ text: msg.text }],
        };
      });

      // 3) Si está vacío, el primer mensaje user incluye
      //    BASE_PROMPT + el contexto de los 5 pagos + la pregunta del usuario
      if (conversationHistory.length === 0) {
        const last5Context = generateLast5PaymentsContext();
        const firstUserMsg: VertexAIMsg = {
          role: 'user',
          parts: [
            {
              text: `${BASE_PROMPT}\n\n${last5Context}\n${userMessage.text}`,
            },
          ],
        };
        conversationHistory = [firstUserMsg];
      } else {
        // Agregamos este turno normal
        conversationHistory.push({
          role: 'user',
          parts: [{ text: userMessage.text }],
        });
      }

      // Iniciamos el chat con streaming
      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 300,
        },
      });

      // Adjuntar PDF si existe
      let nextUserParts: any[] = [{ text: userMessage.text }];
      if (file) {
        const filePart = await fileToGenerativePart(file);
        nextUserParts.push(filePart);
      }

      // Llamada streaming
      const result = await chat.sendMessageStream(nextUserParts);

      // Mensaje vacío del bot
      let streamingMessage: LocalMessage = { sender: 'bot', text: '' };
      setMessages((prev) => [...prev, streamingMessage]);

      // Leer chunks
      for await (const chunk of result.stream) {
        streamingMessage.text += chunk.text();

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...streamingMessage };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error generando contenido:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Ocurrió un error al procesar tu solicitud.' },
      ]);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[999999]">
      {isOpen ? (
        <div className="flex flex-col w-80 h-[530px] bg-gray-800 text-gray-100 rounded-lg shadow-xl overflow-hidden border border-gray-600">
          {/* Header del chat */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-500 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-white dark:text-gray-100">EstateAdmin IA</h3>
            <button
              onClick={toggleChat}
              className="text-gray-100 text-2xl leading-none focus:outline-none"
            >
              &times;
            </button>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 p-4 overflow-y-auto border-indigo-300 ring-indigo-300 bg-white dark:bg-gray-800 text-gray-100 chat-container">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">Inicia una conversación</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-2 max-w-xs ${
                      msg.sender === 'user'
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-600 text-gray-100'
                    }`}
                  >
                    {/* Usuario: plain text, Bot: Markdown */}
                    {msg.sender === 'user' ? (
                      msg.text
                    ) : (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSend} className="flex flex-col border-t  border-indigo-300 dark:border-gray-600">
            <div className="flex items-center pl-2 bg-indigo-500 dark:bg-gray-700 gap-2">
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <PaperClipIcon className="h-6 w-6 text-gray-100 hover:text-gray-400" />
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 bg-indigo-500 dark:bg-gray-700 text-gray-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-2.5 py-2.5 bg-indigo-600 text-sm text-white font-semibold hover:bg-indigo-700 focus:outline-none"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className="bg-indigo-600 text-white p-3 shadow-xl rounded-full"
          style={{ zIndex: 999999 }}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default ChatBot;
