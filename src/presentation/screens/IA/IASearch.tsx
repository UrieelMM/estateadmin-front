// src/presentation/screens/IA/IASearch.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import AIResponseModal from "./AIResponseModal";
import { getAuth, getIdTokenResult } from "firebase/auth";
import {
  searchWithFile,
  generateAIResponse,
} from "../../../services/aiContextService";

interface AISearchProps {
  context?: "income" | "expenses" | "balance";
}

const AISearch: React.FC<AISearchProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_isFocused, setIsFocused] = useState(false);

  // Determinar el filtro automáticamente basado en el contexto
  const getContextFilter = (): string | undefined => {
    if (!context) {
      return undefined;
    }

    switch (context) {
      case "income":
        return "payment";
      case "expenses":
        return "expense";
      case "balance":
        return "all"; // Para balance, mostrar todo - incluye cargos, pagos y gastos
      default:
        return undefined;
    }
  };

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      // Simulamos procesamiento del archivo
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  // Reemplaza la función handleSearch por esta:
  const handleSearch = async () => {
    if (!query.trim() && !file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      if (!clientId || !condominiumId) {
        throw new Error("No se pudo obtener clientId o condominiumId");
      }

      // Preparar filtro basado en el contexto
      let filter = undefined;
      const contextFilter = getContextFilter();
      if (contextFilter && contextFilter !== "all") {
        filter = {
          storeType: { $eq: contextFilter },
        };
      }

      let searchResults;

      // Si hay un archivo, usar la función especial para archivos
      if (file) {
        searchResults = await searchWithFile(
          query,
          file,
          clientId,
          condominiumId
        );

        setResponse({
          text: searchResults.text || `Respuesta para: ${query}`,
          source: "AI Context API",
          results: searchResults.results || [],
        });
      } else {
        // Usar el nuevo endpoint generate para obtener respuestas de la IA
        searchResults = await generateAIResponse(
          query,
          clientId,
          condominiumId,
          filter,
          5 // maxContextItems: número de resultados máximos
        );

        setResponse({
          text:
            searchResults.text ||
            `No se pudo generar una respuesta para: ${query}`,
          source: "AI Context API",
          results: searchResults.contextItems || [],
        });
      }

      setShowResponse(true);
      setIsProcessing(false);
    } catch (error: any) {
      setError(error.message || "Error al procesar la consulta");
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      if (isOpen) {
        handleSearch();
      } else {
        setIsOpen(true);
      }
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Input con borde animado */}
      <div className="relative group">
        {/* Borde animado */}
        <div
          className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full opacity-70 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-rotate"
          style={{
            backgroundSize: "200% 200%",
          }}
        ></div>

        {/* Input */}
        <div className="relative flex items-center bg-white/30 dark:bg-gray-800/50 backdrop-blur-sm rounded-full pl-2 pr-1 py-1 transition-all group-hover:bg-white/20 dark:group-hover:bg-gray-800/70 border border-white/10 dark:border-gray-700/50">
          <SparklesIcon className="h-4 w-4 text-white ml-1 mr-2" />
          <input
            type="text"
            value={isOpen ? query : ""}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Pregunta a la IA..."
            className="w-32 md:w-40 py-1 bg-transparent border-none outline-none text-white text-sm placeholder-white/70"
          />
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors ml-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Menu desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-4">
              <div className="relative">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-300 ml-3" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pregunta a la IA de EstateAdmin..."
                    className="w-full p-3 bg-transparent outline-none text-gray-800 dark:text-gray-100"
                    disabled={isProcessing}
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="mr-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selector de archivos */}
              <div
                onClick={handleFileClick}
                className="mt-4 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg p-4 cursor-pointer bg-indigo-50 dark:bg-indigo-900/30 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                />

                {file ? (
                  <FilePreview file={file} onRemove={handleRemoveFile} />
                ) : (
                  <div className="flex flex-col items-center justify-center text-indigo-500 dark:text-indigo-300">
                    <ArrowUpTrayIcon className="h-6 w-6 mb-2" />
                    <p className="text-sm text-center">
                      Arrastra un archivo o haz clic para subir
                    </p>
                    <p className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
                      PDF, Word, Excel, CSV, TXT
                    </p>
                  </div>
                )}
              </div>

              {/* Información del filtro actual */}
              <div className="mt-4 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {context === "income" &&
                    "Filtrando resultados de: Ingresos y Pagos"}
                  {context === "expenses" && "Filtrando resultados de: Egresos"}
                  {context === "balance" &&
                    "Filtrando resultados de: Balance General"}
                  {!context && "Sin filtro de contexto aplicado"}
                </p>
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Botón de búsqueda */}
              <motion.button
                onClick={handleSearch}
                disabled={isProcessing || (!query.trim() && !file)}
                className={`mt-4 w-full py-2.5 px-4 rounded-lg flex items-center justify-center text-white font-medium transition-all ${
                  isProcessing || (!query.trim() && !file)
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <ProcessingAnimation />
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    <span>Consultar IA</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de respuesta */}
      <AIResponseModal
        isOpen={showResponse}
        onClose={() => setShowResponse(false)}
        response={response}
      />
    </div>
  );
};

// Interfaz para el componente FilePreview
interface FilePreviewProps {
  file: File;
  onRemove: (e: React.MouseEvent) => void;
}

// Componente para mostrar la previsualización del archivo
const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  // Función para obtener el icono adecuado según el tipo de archivo
  const getFileIcon = () => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
      case "csv":
        return "📊";
      case "txt":
        return "📃";
      default:
        return "📁";
    }
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-xl mr-2">{getFileIcon()}</span>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        title="Eliminar archivo"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Componente para mostrar la animación de procesamiento
const ProcessingAnimation = () => {
  return (
    <div className="flex items-center space-x-2">
      <div
        className="w-2 h-2 rounded-full bg-white animate-pulse"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-2 h-2 rounded-full bg-white animate-pulse"
        style={{ animationDelay: "300ms" }}
      ></div>
      <div
        className="w-2 h-2 rounded-full bg-white animate-pulse"
        style={{ animationDelay: "600ms" }}
      ></div>
    </div>
  );
};

export default AISearch;
