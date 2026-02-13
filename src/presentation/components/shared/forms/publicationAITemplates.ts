export type PublicationAITemplateId =
  | "general_notice"
  | "maintenance_notice"
  | "event_invite"
  | "payment_reminder";

export type PublicationAITemplate = {
  id: PublicationAITemplateId;
  label: string;
  objective: string;
  styleRules: string[];
};

export const PUBLICATION_AI_TEMPLATES: PublicationAITemplate[] = [
  {
    id: "general_notice",
    label: "Aviso General",
    objective: "Comunicar un aviso administrativo claro y directo.",
    styleRules: [
      "Explicar el motivo del aviso en las primeras líneas.",
      "Indicar acciones esperadas de los residentes.",
      "Cerrar con tono cordial y profesional.",
    ],
  },
  {
    id: "maintenance_notice",
    label: "Mantenimiento",
    objective: "Informar trabajos de mantenimiento y su impacto.",
    styleRules: [
      "Incluir zona/servicio afectado y ventana de tiempo.",
      "Resaltar recomendaciones prácticas para residentes.",
      "Mantener claridad operativa sin tecnicismos excesivos.",
    ],
  },
  {
    id: "event_invite",
    label: "Invitación a Evento",
    objective: "Invitar a un evento con mensaje breve y motivador.",
    styleRules: [
      "Indicar fecha, lugar y propósito en formato claro.",
      "Agregar una llamada a la acción simple.",
      "Conservar tono amable y cercano.",
    ],
  },
  {
    id: "payment_reminder",
    label: "Recordatorio de Pago",
    objective: "Recordar pagos pendientes con tono respetuoso.",
    styleRules: [
      "Evitar lenguaje coercitivo o amenazante.",
      "Incluir instrucción de contacto para aclaraciones.",
      "Mantener enfoque en cumplimiento y apoyo.",
    ],
  },
];

type BuildPromptInput = {
  template: PublicationAITemplate;
  idea: string;
  title?: string;
  tag?: string;
  sendTo?: string;
  author?: string;
};

export function buildPublicationDraftPrompt({
  template,
  idea,
  title,
  tag,
  sendTo,
  author,
}: BuildPromptInput): string {
  const audienceMap: Record<string, string> = {
    todos: "todos los residentes",
    propietario: "propietarios",
    inquilino: "inquilinos",
  };
  const audience = audienceMap[sendTo || ""] || "residentes";

  return [
    "Eres un redactor profesional para comunicaciones de condominios.",
    "Redacta una publicación breve y lista para enviar, en español.",
    "Criterios de salida:",
    "- Clara, concisa, profesional y amable.",
    "- Máximo 150-220 palabras.",
    "- Usar markdown simple (título, párrafos, lista breve si aplica).",
    "- No usar tablas markdown ni bloques de código.",
    "- No inventar datos ni fechas no proporcionadas.",
    "",
    `Plantilla seleccionada: ${template.label}`,
    `Objetivo: ${template.objective}`,
    "Reglas de estilo:",
    ...template.styleRules.map((rule) => `- ${rule}`),
    "",
    "Contexto:",
    `- Idea general: ${idea}`,
    `- Título sugerido: ${title || "No definido"}`,
    `- Etiqueta: ${tag || "No definida"}`,
    `- Público objetivo: ${audience}`,
    `- Autor/Firma: ${author || "Administración"}`,
    "",
    "Devuelve únicamente el contenido final en markdown.",
  ].join("\n");
}

