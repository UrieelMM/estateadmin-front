import axios from "axios";

const DEFAULT_TIMEOUT_MS = 120000; // hasta 2 minutos: reindex puede ser pesado

const getServerBaseUrl = (): string => {
  const value = String(import.meta.env.VITE_URL_SERVER || "").trim();
  if (!value) {
    throw new Error("VITE_URL_SERVER no está configurado");
  }
  return value.replace(/\/$/, "");
};

const buildUrl = (path: string): string => `${getServerBaseUrl()}${path}`;

const buildHeaders = (idToken: string) => ({
  Authorization: `Bearer ${idToken}`,
  "Content-Type": "application/json",
});

export type KnowledgeBaseStats = {
  totalChunks: number;
  publicationChunks: number;
  documentChunks: number;
  publicationsCount: number;
  documentsCount: number;
  lastIndexedAt?: { _seconds?: number; seconds?: number } | null;
};

export type ReindexResult = {
  clientId: string;
  condominiumId: string;
  publicationsIndexed: number;
  publicationChunksCreated: number;
  documentsIndexed: number;
  documentChunksCreated: number;
  errors: string[];
  durationMs: number;
};

export type AskResult = {
  answer: string;
  relevantCount: number;
  threshold: number;
  results: Array<{
    text: string;
    source: "publication" | "document";
    sourceId: string;
    sourceName: string;
    distance: number;
  }>;
};

export const knowledgeBaseService = {
  async getStats(
    params: { clientId: string; condominiumId: string },
    idToken: string,
  ): Promise<KnowledgeBaseStats> {
    const res = await axios.get<KnowledgeBaseStats>(
      buildUrl("/whatsapp-chat-bot/knowledge-base/stats"),
      {
        headers: buildHeaders(idToken),
        params,
        timeout: 30000,
      },
    );
    return res.data;
  },

  async reindex(
    payload: { clientId: string; condominiumId: string },
    idToken: string,
  ): Promise<ReindexResult> {
    const res = await axios.post<ReindexResult>(
      buildUrl("/whatsapp-chat-bot/knowledge-base/reindex"),
      payload,
      {
        headers: buildHeaders(idToken),
        timeout: DEFAULT_TIMEOUT_MS,
      },
    );
    return res.data;
  },

  async clear(
    payload: { clientId: string; condominiumId: string },
    idToken: string,
  ): Promise<{ deleted: number }> {
    const res = await axios.post<{ deleted: number }>(
      buildUrl("/whatsapp-chat-bot/knowledge-base/clear"),
      payload,
      {
        headers: buildHeaders(idToken),
        timeout: 60000,
      },
    );
    return res.data;
  },

  async ask(
    payload: {
      clientId: string;
      condominiumId: string;
      question: string;
      topK?: number;
    },
    idToken: string,
  ): Promise<AskResult> {
    const res = await axios.post<AskResult>(
      buildUrl("/whatsapp-chat-bot/knowledge-base/ask"),
      payload,
      {
        headers: buildHeaders(idToken),
        timeout: 30000,
      },
    );
    return res.data;
  },

  /**
   * Sincroniza el knowledge base con el estado actual de un documento.
   * Llamar inmediatamente después de subir/borrar un PDF para purgar la
   * info anterior del RAG.
   */
  async syncDocument(
    payload: {
      clientId: string;
      condominiumId: string;
      docKey: string;
      action?: "upsert" | "delete";
    },
    idToken: string,
  ): Promise<{
    action: "upsert" | "delete";
    docKey: string;
    chunksCreated?: number;
    deleted?: number;
  }> {
    const res = await axios.post(
      buildUrl("/whatsapp-chat-bot/knowledge-base/sync-document"),
      payload,
      {
        headers: buildHeaders(idToken),
        timeout: 60000,
      },
    );
    return res.data;
  },
};
