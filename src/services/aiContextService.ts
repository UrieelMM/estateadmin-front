// src/services/aiContextService.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_URL_SERVER;

/**
 * Sincroniza el contexto de la aplicación con la API de IA
 */
export const syncWithAIContext = async (
  storeType: string,
  data: any,
  clientId: string,
  condominiumId: string
): Promise<boolean> => {
  try {
    // Adaptado para utilizar el nuevo formato de endpoint
    const payload = {
      text: getTextFromData(storeType, data),
      category: mapStoreTypeToCategory(storeType),
      clientId,
      condominiumId,
      metadata: data,
    };

    const response = await axios.post(
      `${API_BASE_URL}/ai-context/sync`,
      payload
    );

    if (response.data.success) {
      console.log(`[AI Context] Sincronización exitosa de ${storeType}`);
      return true;
    }

    console.warn(
      `[AI Context] Sincronización incompleta de ${storeType}:`,
      response.data
    );
    return false;
  } catch (error) {
    console.error(`[AI Context] Error sincronizando ${storeType}:`, error);
    return false;
  }
};

// Función auxiliar para generar un texto descriptivo según el tipo de datos
const getTextFromData = (storeType: string, data: any): string => {
  switch (storeType) {
    case "payment":
      return `Pago de mantenimiento realizado el ${formatDate(
        data.paymentDate || new Date()
      )} por $${formatAmount(data.amountPaid)} ${
        data.currency || "MXN"
      } correspondiente a ${
        data.concept || "cuota de mantenimiento"
      }. Referencia: ${data.paymentGroupId || "No especificada"}.`;
    case "expense":
      return `Gasto realizado el ${formatDate(
        data.date || new Date()
      )} por $${formatAmount(data.amount)} ${data.currency || "MXN"} a ${
        data.provider || "proveedor"
      } por ${data.concept || "concepto no especificado"}. Factura: ${
        data.invoiceNumber || "No especificada"
      }.`;
    case "charges":
      if (data.paid) {
        return `Cargo pagado de ${
          data.concept || "mantenimiento"
        } por $${formatAmount(data.amount)} ${
          data.currency || "MXN"
        } para el condómino ${
          data.condominoNombre || data.condominoNumero || "No especificado"
        }. Periodo: ${data.startAtFormatted || formatDate(data.startAt)} a ${
          data.dueDateFormatted || formatDate(data.dueDate)
        }.`;
      } else {
        return `Cargo pendiente de ${
          data.concept || "mantenimiento"
        } por $${formatAmount(data.amount)} ${
          data.currency || "MXN"
        } para el condómino ${
          data.condominoNombre || data.condominoNumero || "No especificado"
        }. Fecha límite de pago: ${
          data.dueDateFormatted || formatDate(data.dueDate)
        }.`;
      }
    case "charges-batch":
      return `Cargo masivo de ${
        data.concept || "mantenimiento"
      } generado para ${
        data.cantidadCondominios || "múltiples"
      } condóminos por un total de $${formatAmount(data.montoTotal)} ${
        data.currency || "MXN"
      }. Periodo: ${data.startAtFormatted || formatDate(data.startAt)} a ${
        data.dueDateFormatted || formatDate(data.dueDate)
      }.`;
    default:
      // Para otros tipos de datos, crear un texto genérico
      return `Sincronización de datos de tipo "${storeType}" realizada el ${formatDate(
        new Date()
      )}.`;
  }
};

// Función para mapear el storeType interno a las categorías del endpoint
const mapStoreTypeToCategory = (storeType: string): string => {
  switch (storeType) {
    case "payment":
      return "pagos";
    case "expense":
      return "egresos";
    case "charges":
    case "charges-batch":
      return "cargos";
    case "maintenance-reports":
      return "mantenimiento";
    case "maintenance-contracts":
      return "contratos";
    default:
      return storeType;
  }
};

// Función para formatear fechas
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "fecha no válida";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

// Función para formatear montos con separador de miles
const formatAmount = (amount: number): string => {
  if (typeof amount !== "number") return "0";
  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Busca información contextual relevante basada en una consulta
 */
export const searchAIContext = async (
  query: string,
  clientId: string,
  condominiumId: string
): Promise<any[]> => {
  try {
    // Mantiene compatibilidad con implementación anterior
    const response = await axios.get(`${API_BASE_URL}/ai-context/search`, {
      params: {
        query,
        clientId,
        condominiumId,
      },
    });

    if (response.data && response.data.results) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error("[AI Context] Error al buscar contexto:", error);
    return [];
  }
};

/**
 * Sube un archivo y realiza una consulta contextual
 */
export const searchWithFile = async (
  query: string,
  file: File,
  clientId: string,
  condominiumId: string
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("query", query);
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("condominiumId", condominiumId);

    const response = await axios.post(
      `${API_BASE_URL}/ai-context/search-with-file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[AI Context] Error en búsqueda con archivo:", error);
    throw error;
  }
};

/**
 * Enriquece una consulta de usuario con información contextual relevante
 */
export const enrichPromptWithContext = async (
  userQuery: string,
  basePrompt: string,
  contextPrompt: string,
  clientId: string,
  condominiumId: string
): Promise<string> => {
  try {
    // Obtener contexto relevante
    const relevantContext = await searchAIContext(
      userQuery,
      clientId,
      condominiumId
    );

    // Si no hay contexto relevante, devolver el prompt original
    if (!relevantContext.length) {
      return `${basePrompt}\n\n${contextPrompt}\n\n${userQuery}`;
    }

    // Crear un prompt enriquecido
    let enrichedPrompt = `${basePrompt}\n\n`;

    // Agregar sección de contexto
    enrichedPrompt +=
      "Contexto del sistema (usa esta información para responder):\n";

    // Organizar contexto por tipos
    const contextByType: Record<string, any[]> = {};

    relevantContext.forEach((item) => {
      const storeType = item.metadata?.storeType || "general";
      if (!contextByType[storeType]) {
        contextByType[storeType] = [];
      }
      contextByType[storeType].push(item.metadata);
    });

    // Agregar cada tipo de contexto
    Object.entries(contextByType).forEach(([type, items]) => {
      enrichedPrompt += `\n[${type}]:\n`;
      items.forEach((item, i) => {
        // Limitar datos para no exceder tokens
        const cleanItem = { ...item };
        delete cleanItem.storeType; // Ya incluido en el encabezado
        delete cleanItem.timestamp; // No relevante para el usuario

        enrichedPrompt += `${JSON.stringify(cleanItem, null, 2)}\n`;

        // Separador entre items excepto el último
        if (i < items.length - 1) {
          enrichedPrompt += "---\n";
        }
      });
    });

    // Agregar el resto del prompt
    enrichedPrompt += `\n\n${contextPrompt}\n\n${userQuery}`;

    return enrichedPrompt;
  } catch (error) {
    console.error("[AI Context] Error al enriquecer prompt:", error);
    // Devolver prompt original si hay error
    return `${basePrompt}\n\n${contextPrompt}\n\n${userQuery}`;
  }
};

/**
 * Genera una respuesta basada en una consulta usando el contexto y la IA
 */
export const generateAIResponse = async (
  prompt: string,
  clientId: string,
  condominiumId: string,
  filter?: { storeType: { $eq: string } },
  maxContextItems?: number,
  stream: boolean = false
): Promise<any> => {
  try {
    // Adaptado para usar el nuevo endpoint /query
    const payload = {
      prompt,
      clientId,
      condominiumId,
      category: filter?.storeType?.$eq
        ? mapStoreTypeToCategory(filter.storeType.$eq)
        : undefined,
      maxResults: maxContextItems || 5,
      stream,
    };

    const response = await axios.post(
      `${API_BASE_URL}/ai-context/query`,
      payload
    );

    // Adaptar la respuesta al formato que espera la aplicación
    const adaptedResponse = {
      text:
        response.data.response ||
        response.data.answer ||
        response.data.text ||
        "",
      contextItems:
        response.data.relevantContext ||
        response.data.results ||
        response.data.contextItems ||
        [],
    };

    return adaptedResponse;
  } catch (error) {
    console.error("[AI Context] Error al generar respuesta:", error);
    throw error;
  }
};
