import React, {
  useEffect,
  useRef,
  FormEvent,
  useCallback,
  ChangeEvent,
  memo,
} from "react";
import ReactMarkdown from "react-markdown";
// import { model } from "../../../firebase/firebase"; // Ya no se usa
import {
  PaperClipIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { usePaymentSummaryStore } from "../../../store/paymentSummaryStore";
import ProtectedProFeature from "../../../components/ProFeature/ProtectedProFeature";
import { useClientPlanStore } from "../../../store/clientPlanStore";
import { useChatBotStore, ChatMessage } from "../../../store/useChatBotStore"; // Importar tipo ChatMessage

// BASE_PROMPT podría moverse a una constante global o configuración si se prefiere
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

// Ya no se necesita fileToGenerativePart aquí, se maneja en el servicio

// --- Componente de UI Separado y Memoizado --- //

interface ChatBotUIProps {
  isOpen: boolean;
  messages: ChatMessage[];
  input: string;
  file: File | null;
  isLoading: boolean;
  error: string | null;
  toggleChat: () => void;
  setInput: (value: string) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSend: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Envolver ChatBotUI con React.memo
const ChatBotUI: React.FC<ChatBotUIProps> = memo(
  ({
    isOpen,
    messages,
    input,
    file,
    isLoading,
    error,
    toggleChat,
    setInput,
    handleFileChange,
    handleSend,
    fileInputRef,
    messagesEndRef,
  }) => {
    console.log("Rendering ChatBotUI"); // Añadir log para depuración
    return (
      <div className="fixed bottom-4 right-4 z-[9]">
        {isOpen ? (
          <div className="flex flex-col w-80 h-[530px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-500 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-white dark:text-gray-100">
                Asistente IA
              </h3>
              <button
                onClick={toggleChat}
                className="text-gray-100 text-2xl leading-none hover:text-gray-300 focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto chat-container">
              {messages.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center italic">
                  Inicia una conversación o haz una pregunta.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg py-2 px-3 max-w-[85%] break-words ${
                      msg.sender === "user"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      msg.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="mb-1 last:mb-0" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc list-inside pl-2 mb-1"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal list-inside pl-2 mb-1"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="mb-0.5" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900 border-t border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 text-xs flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Formulario */}
            <form
              onSubmit={handleSend}
              className="flex flex-col border-t border-gray-300 dark:border-gray-600"
            >
              {file && (
                <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 truncate">
                  Archivo: {file.name}
                </div>
              )}
              <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 gap-2">
                <input
                  type="file"
                  id="fileInput"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="Adjuntar archivo (PDF, DOC, TXT)"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isLoading ? "Procesando..." : "Escribe tu mensaje..."
                  }
                  disabled={isLoading}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input?.trim() && !file)}
                  className="px-3 py-1.5 bg-indigo-600 text-sm text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={toggleChat}
            className="bg-indigo-600 text-white p-3 shadow-xl rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            style={{ zIndex: 999999 }}
            title="Abrir Asistente IA"
          >
            <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-white" />
          </button>
        )}
      </div>
    );
  }
);

/**
 * Mensaje de función Pro no disponible
 * (Sin cambios)
 */
const UpgradePlanMessage: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-[9]">
      <div className="bg-indigo-600 text-white p-3 shadow-xl rounded-full cursor-not-allowed">
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-white opacity-50" />
      </div>
      <div className="absolute top-0 right-0 transform -translate-y-full mb-2 bg-gray-800 text-white text-xs p-2 rounded shadow-lg">
        Función Pro. Actualiza tu plan para acceder.
      </div>
    </div>
  );
};

/**
 * ChatBot refactorizado para usar Zustand.
 */
const ChatBot: React.FC = () => {
  // Seleccionar estado granularmente
  const state = useChatBotStore(
    useCallback(
      (s) => ({
        isOpen: s.isOpen,
        messages: s.messages,
        input: s.input,
        file: s.file,
        isLoading: s.isLoading,
        error: s.error,
      }),
      []
    )
  );

  const { clientId, condominiumId } = useClientPlanStore(
    useCallback(
      (s) => ({ clientId: s.clientId, condominiumId: s.condominiumId }),
      []
    )
  );
  const payments = usePaymentSummaryStore(useCallback((s) => s.payments, []));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seleccionar acciones fuera del componente para referencias estables
  const actions = useChatBotStore.getState();
  const stableSetInput = actions.setInput;
  const stableSetFile = actions.setFile;
  const stableToggleChat = actions.toggleChat;
  const stableSendMessage = actions.sendMessage;
  const stableInitializeContext = actions.initializeContext;

  // --- Callbacks estables --- //
  const initializeContext = useCallback(() => {
    if (clientId && condominiumId) {
      stableInitializeContext(clientId, condominiumId);
    }
  }, [clientId, condominiumId]);

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const generateLast5PaymentsContext = useCallback((): string => {
    const last5 = payments.slice(0, 5);
    if (last5.length === 0) {
      return "Contexto: No hay pagos recientes registrados.";
    }
    return `Contexto de últimos pagos registrados:
${last5
  .map((p, index) => {
    return `- Pago ${index + 1}: Condo ${p.numberCondominium}, Pagado: ${
      p.amountPaid
    }, Pendiente: ${p.amountPending}`;
  })
  .join("\n")}
---`;
  }, [payments]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        stableSetFile(e.target.files[0]);
      } else {
        stableSetFile(null);
      }
    },
    [] // Las acciones estables no necesitan ir aquí
  );

  const handleSend = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Log para ver el estado del archivo ANTES de enviar
      console.log(
        "handleSend - File state from store:",
        useChatBotStore.getState().file
      );
      const contextPrompt = generateLast5PaymentsContext();
      await stableSendMessage(BASE_PROMPT, contextPrompt);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [generateLast5PaymentsContext] // Dependencia estableSendMessage se obtiene fuera
  );

  return (
    <ProtectedProFeature
      featureName="chatbot"
      fallback={<UpgradePlanMessage />}
    >
      <ChatBotUI
        isOpen={state.isOpen}
        messages={state.messages}
        input={state.input}
        file={state.file}
        isLoading={state.isLoading}
        error={state.error}
        toggleChat={stableToggleChat}
        setInput={stableSetInput}
        handleFileChange={handleFileChange}
        handleSend={handleSend}
        fileInputRef={fileInputRef}
        messagesEndRef={messagesEndRef}
      />
    </ProtectedProFeature>
  );
};

export default ChatBot;
