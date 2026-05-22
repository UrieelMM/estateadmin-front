import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  SparklesIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useKnowledgeBaseStore } from "../../../../../store/useKnowledgeBaseStore";

const formatDate = (
  ts?: { _seconds?: number; seconds?: number } | null,
): string => {
  if (!ts) return "Nunca";
  const seconds = (ts._seconds ?? ts.seconds ?? 0) as number;
  if (!seconds) return "Nunca";
  return new Date(seconds * 1000).toLocaleString("es-MX");
};

const KnowledgeBaseSettings = () => {
  const {
    stats,
    lastReindex,
    askResult,
    loadingStats,
    reindexing,
    clearing,
    asking,
    error,
    fetchStats,
    reindex,
    clear,
    ask,
    clearError,
  } = useKnowledgeBaseStore();

  const [question, setQuestion] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [showFragments, setShowFragments] = useState(false);

  useEffect(() => {
    fetchStats().catch(() => undefined);
  }, [fetchStats]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleReindex = async () => {
    const toastId = toast.loading(
      "Reindexando base de conocimiento... esto puede tomar varios minutos.",
    );
    try {
      const result = await reindex();
      toast.dismiss(toastId);
      if (result.errors.length > 0) {
        toast(`Reindex completado con ${result.errors.length} advertencias.`, {
          icon: "⚠️",
        });
      } else {
        toast.success("Reindex completado correctamente.");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e?.message || "Error en la reindexación.");
    }
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    setConfirmClear(false);
    try {
      const result = await clear();
      toast.success(
        `Base de conocimiento vaciada (${result.deleted} fragmentos eliminados).`,
      );
    } catch (e: any) {
      toast.error(e?.message || "Error al vaciar la base.");
    }
  };

  const handleAsk = async () => {
    if (question.trim().length < 4) {
      toast.error("Escribe una pregunta más completa.");
      return;
    }
    try {
      setShowFragments(false);
      await ask(question.trim(), 5);
    } catch (e: any) {
      toast.error(e?.message || "Error al consultar el asistente.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header informativo */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/40">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Asistente del condominio (RAG)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Esta base de conocimiento alimenta la opción{" "}
              <strong className="text-indigo-700 dark:text-indigo-300">
                "🤖 Preguntar al asistente"
              </strong>{" "}
              del chatbot de WhatsApp. Los residentes podrán hacer preguntas
              libres y el bot responderá con base en el reglamento, manual de
              convivencia, políticas de áreas comunes y publicaciones del
              condominio.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Las nuevas publicaciones se indexan automáticamente al
              publicarse. Si actualizas el reglamento u otros PDFs, usa el botón
              <strong> "Reindexar todo"</strong> para refrescar la base.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<SparklesIcon className="h-5 w-5" />}
          label="Fragmentos totales"
          value={stats?.totalChunks ?? "—"}
          loading={loadingStats}
          color="indigo"
        />
        <StatCard
          icon={<DocumentTextIcon className="h-5 w-5" />}
          label="Documentos indexados"
          value={`${stats?.documentsCount ?? "—"} (${
            stats?.documentChunks ?? 0
          } chunks)`}
          loading={loadingStats}
          color="purple"
        />
        <StatCard
          icon={<MegaphoneIcon className="h-5 w-5" />}
          label="Publicaciones indexadas"
          value={`${stats?.publicationsCount ?? "—"} (${
            stats?.publicationChunks ?? 0
          } chunks)`}
          loading={loadingStats}
          color="blue"
        />
        <StatCard
          icon={<ArrowPathIcon className="h-5 w-5" />}
          label="Última indexación"
          value={formatDate(stats?.lastIndexedAt)}
          loading={loadingStats}
          color="emerald"
          small
        />
      </div>

      {/* Acciones */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 text-indigo-500" />
          Mantenimiento de la base
        </h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing || clearing}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {reindexing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Reindexando...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-5 w-5" />
                Reindexar todo
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => fetchStats().catch(() => undefined)}
            disabled={loadingStats || reindexing}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium rounded-xl border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-60"
          >
            {loadingStats ? "Actualizando..." : "Refrescar estadísticas"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing || reindexing}
            className={`px-4 py-3 font-medium rounded-xl border transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              confirmClear
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                : "bg-white hover:bg-red-50 text-red-600 border-red-200 dark:bg-gray-800 dark:hover:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
            }`}
          >
            {clearing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Vaciando...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5" />
                {confirmClear ? "Confirmar vaciado" : "Vaciar base"}
              </>
            )}
          </button>
        </div>
        {confirmClear && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">
            ⚠️ Haz clic de nuevo para confirmar. Esto eliminará todos los
            fragmentos indexados. Luego deberás reindexar.
          </p>
        )}
      </div>

      {/* Resultado del último reindex */}
      {lastReindex && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            Resultado del último reindex
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <ResultStat label="Publicaciones" value={lastReindex.publicationsIndexed} />
            <ResultStat
              label="Chunks de publicaciones"
              value={lastReindex.publicationChunksCreated}
            />
            <ResultStat label="Documentos" value={lastReindex.documentsIndexed} />
            <ResultStat
              label="Chunks de documentos"
              value={lastReindex.documentChunksCreated}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Duración: {(lastReindex.durationMs / 1000).toFixed(1)}s
          </p>
          {lastReindex.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Advertencias ({lastReindex.errors.length})
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-32 overflow-y-auto">
                {lastReindex.errors.map((e, i) => (
                  <li key={i} className="break-words">
                    • {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Banco de pruebas */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <PaperAirplaneIcon className="h-5 w-5 text-indigo-500" />
          Probar el asistente
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Escribe una pregunta como lo haría un residente desde WhatsApp. Verás
          los fragmentos más relevantes que el bot usaría para responder.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !asking) handleAsk();
            }}
            placeholder="Ej: ¿se pueden tener mascotas grandes?"
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {asking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Buscando...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4" />
                Probar
              </>
            )}
          </button>
        </div>

        {askResult && (
          <div className="mt-5 space-y-4">
            {/* Respuesta que recibiría el residente — vista de chat */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                    Respuesta que recibiría el residente en WhatsApp
                  </p>
                  {askResult.relevantCount === 0 ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      ⚠️ No se encontró información suficientemente relevante
                      (umbral &lt; {askResult.threshold}).
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Basado en {askResult.relevantCount} fragmento
                      {askResult.relevantCount === 1 ? "" : "s"} relevante
                      {askResult.relevantCount === 1 ? "" : "s"}.
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-12 p-4 bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {askResult.answer}
                </p>
              </div>
            </div>

            {/* Toggle de detalles: fragmentos usados */}
            {askResult.results.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowFragments((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Ver fragmentos analizados ({askResult.results.length})
                  </span>
                  {showFragments ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>

                {showFragments && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Distancia COSINE: <strong>menor = más relevante</strong>.
                      Solo fragmentos con distancia &lt; {askResult.threshold}{" "}
                      se usan para generar la respuesta.
                    </p>
                    {askResult.results.map((r, i) => {
                      const isUsed = r.distance < askResult.threshold;
                      return (
                        <div
                          key={i}
                          className={`p-4 border rounded-xl ${
                            isUsed
                              ? "bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800/40"
                              : "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 opacity-70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2 text-xs flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold ${
                                  r.source === "document"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                }`}
                              >
                                {r.source === "document"
                                  ? "Documento"
                                  : "Publicación"}
                              </span>
                              {isUsed ? (
                                <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  ✓ Usado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-400">
                                  Descartado
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-gray-500 dark:text-gray-400">
                              distancia: {r.distance.toFixed(3)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {r.sourceName}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
                            {r.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helpers visuales ─────────────────────────────────────────────────────

type StatCardColor = "indigo" | "purple" | "blue" | "emerald";

const colorMap: Record<StatCardColor, string> = {
  indigo:
    "from-indigo-500 to-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
  purple:
    "from-purple-500 to-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  blue:
    "from-blue-500 to-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  emerald:
    "from-emerald-500 to-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
};

const StatCard = ({
  icon,
  label,
  value,
  loading,
  color,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  color: StatCardColor;
  small?: boolean;
}) => {
  const tones = colorMap[color];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${tones
            .split(" ")
            .filter((c) => c.startsWith("bg-"))
            .join(" ")}`}
        >
          <span
            className={tones
              .split(" ")
              .filter((c) => c.startsWith("text-"))
              .join(" ")}
          >
            {icon}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
      </div>
      {loading ? (
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <p
          className={`font-bold text-gray-900 dark:text-gray-100 ${
            small ? "text-base" : "text-2xl"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
};

const ResultStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
      {value}
    </p>
  </div>
);

export default KnowledgeBaseSettings;
