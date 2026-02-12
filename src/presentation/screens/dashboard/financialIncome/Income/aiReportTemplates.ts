export type IncomeAIReportTemplateId =
  | "executive"
  | "collections"
  | "risk"
  | "committee";

export interface IncomeAIReportTemplate {
  id: IncomeAIReportTemplateId;
  label: string;
  shortLabel: string;
  description: string;
  objective: string;
  decisionFocus: string;
  keyQuestions: string[];
  requiredOutputs: string[];
  provenStrategies: string[];
}

export interface IncomeCanonicalMetrics {
  montoAbonado: number;
  totalCargos: number;
  saldo: number;
  saldoInicialHistorico: number;
  totalEgresosPeriodo: number;
  flujoNetoPeriodo: number;
  saldoActualConsolidado: number;
  ingresosPeriodo: number;
  totalCondominios: number;
  selectedYear: string;
}

const formatFixed = (value: number) => value.toFixed(2);

export const INCOME_AI_REPORT_TEMPLATES: IncomeAIReportTemplate[] = [
  {
    id: "executive",
    label: "Reporte Ejecutivo",
    shortLabel: "Ejecutivo",
    description: "Visión integral para dirección con foco en KPIs y decisiones.",
    objective:
      "Entregar una lectura clara de desempeño financiero y acciones inmediatas.",
    decisionFocus: "Salud financiera global, estabilidad de flujo y control de desviaciones.",
    keyQuestions: [
      "¿El condominio está fortaleciendo o erosionando su posición de caja?",
      "¿Qué desvíos requieren decisión del comité esta semana?",
      "¿Cuáles son las 3 prioridades de ejecución más rentables?",
    ],
    requiredOutputs: [
      "Resumen ejecutivo orientado a decisión",
      "Diagnóstico de salud financiera por riesgo",
      "Plan de acción priorizado con impacto esperado",
    ],
    provenStrategies: [
      "Segmentación de cartera por riesgo y capacidad de pago",
      "Recordatorios multicanal con cadencia definida",
      "Bonos por pronto pago y recargos por mora consistentes",
      "Acuerdos de regularización con seguimiento semanal",
    ],
  },
  {
    id: "collections",
    label: "Reporte de Cobranza",
    shortLabel: "Cobranza",
    description:
      "Profundiza en montos pendientes, avance de recaudación y recuperación.",
    objective:
      "Priorizar acciones para elevar cobranza y reducir cuentas pendientes.",
    decisionFocus: "Recuperación de cartera y aceleración de flujo de cobro.",
    keyQuestions: [
      "¿Qué proporción de cartera es recuperable en 30 días?",
      "¿Qué acciones de cobranza tienen mayor ROI operativo?",
      "¿Qué segmentos concentran el mayor riesgo de incobrabilidad?",
    ],
    requiredOutputs: [
      "Mapa de cartera con priorización de recuperación",
      "Estrategia escalonada de cobranza (contacto, convenio, escalamiento)",
      "Metas quincenales con indicadores de seguimiento",
    ],
    provenStrategies: [
      "Scoring de cobranza por antigüedad, monto y recurrencia",
      "Campañas de recuperación por cohortes de deuda",
      "Promesas de pago con verificación y reintento automatizado",
      "Escalamiento temprano de cuentas de alto riesgo",
    ],
  },
  {
    id: "risk",
    label: "Reporte de Riesgo",
    shortLabel: "Riesgo",
    description:
      "Identifica alertas operativas y financieras con priorización accionable.",
    objective:
      "Reducir exposición financiera mediante controles y mitigaciones concretas.",
    decisionFocus: "Riesgo de liquidez, morosidad material y volatilidad de ejecución.",
    keyQuestions: [
      "¿Qué riesgos pueden comprometer la operación en el corto plazo?",
      "¿Qué señales tempranas ya muestran deterioro?",
      "¿Qué controles deben implantarse de inmediato?",
    ],
    requiredOutputs: [
      "Matriz de riesgos con severidad y probabilidad",
      "Alertas tempranas y gatillos de intervención",
      "Controles y dueños operativos por riesgo",
    ],
    provenStrategies: [
      "Límites de exposición por rubro y alerta preventiva",
      "Revisión semanal de desviaciones contra presupuesto",
      "Semáforos de liquidez con umbrales de acción",
      "Planes de contingencia para cartera crítica",
    ],
  },
  {
    id: "committee",
    label: "Reporte para Comité",
    shortLabel: "Comité",
    description:
      "Formato orientado a presentación para comité con decisiones sugeridas.",
    objective:
      "Facilitar lectura rápida para aprobación de medidas y seguimiento.",
    decisionFocus: "Aprobación de medidas y trazabilidad de acuerdos.",
    keyQuestions: [
      "¿Qué decisiones requieren aprobación formal del comité?",
      "¿Qué trade-offs financieros existen entre alternativas?",
      "¿Qué compromisos y fechas deben quedar aprobados?",
    ],
    requiredOutputs: [
      "Resumen para lectura en comité",
      "Opciones con pros/contras e impacto estimado",
      "Acuerdos sugeridos con responsables y fecha objetivo",
    ],
    provenStrategies: [
      "Tablero de decisiones con responsables y fecha compromiso",
      "Priorización por impacto financiero y esfuerzo operativo",
      "Seguimiento quincenal de acuerdos con KPIs de cierre",
      "Comparativo contra prácticas exitosas del sector condominial",
    ],
  },
];

export const buildIncomeAIReportPrompt = (params: {
  template: IncomeAIReportTemplate;
  canonical: IncomeCanonicalMetrics;
  snapshot: unknown;
  customInstruction?: string;
}) => {
  const { template, canonical, snapshot, customInstruction } = params;

  const canonicalBlock = {
    montoAbonado: formatFixed(canonical.montoAbonado),
    ingresosPeriodo: formatFixed(canonical.ingresosPeriodo),
    totalCargos: formatFixed(canonical.totalCargos),
    totalEgresosPeriodo: formatFixed(canonical.totalEgresosPeriodo),
    flujoNetoPeriodo: formatFixed(canonical.flujoNetoPeriodo),
    saldo: formatFixed(canonical.saldo),
    saldoInicialHistorico: formatFixed(canonical.saldoInicialHistorico),
    saldoActualConsolidado: formatFixed(canonical.saldoActualConsolidado),
    totalCondominios: canonical.totalCondominios,
    yearFilter: canonical.selectedYear || "all",
  };

  return [
    "Actúa como analista financiero senior especializado en condominios.",
    `Plantilla seleccionada: ${template.label}.`,
    `Objetivo: ${template.objective}.`,
    `Enfoque de decisión: ${template.decisionFocus}.`,
    `Preguntas clave a resolver: ${template.keyQuestions.join(" | ")}.`,
    `Entregables obligatorios: ${template.requiredOutputs.join(" | ")}.`,
    `Estrategias probadas a considerar: ${template.provenStrategies.join(" | ")}.`,
    "",
    "REGLAS ESTRICTAS:",
    "1) Usa VALORES_CANONICOS como fuente oficial para montos principales.",
    "2) No recalcule ni reemplace esos montos con otros obtenidos del detalle.",
    "3) Muestra todos los importes en formato monetario con símbolo $, por ejemplo: $12,500.00.",
    "4) Si existe inconsistencia entre detalle y valores canónicos, indícalo explícitamente.",
    "5) No inventes datos faltantes.",
    "6) Trata saldoInicialHistorico como saldo de arranque (no como ingreso del período).",
    "7) El saldoActualConsolidado se interpreta como saldo inicial histórico + flujo neto del período.",
    "8) Enfoca el análisis en finanzas globales y tendencias agregadas; NO listes todos los condominos.",
    "9) Solo incluye condominos específicos por excepción material (alto adeudo o riesgo significativo), máximo 5 casos.",
    "10) Si incluyes tabla, debe estar en Markdown válido con encabezado y separador por filas (multilínea).",
    "11) No incluyas IDs internos de base de datos (pagos, usuarios, cargos, cuentas o documentos).",
    "12) Las recomendaciones deben basarse en tácticas probadas en administración condominial y finanzas operativas.",
    "13) Incluye al menos 3 estrategias con referencia de por qué suelen funcionar (mecanismo de impacto).",
    "14) Cuando uses benchmarking, exprésalo como patrones/percentiles del sector de forma anonimizada; no inventes cifras exactas no presentes en datos.",
    "15) Para cada recomendación, agrega KPI de seguimiento, meta sugerida y horizonte de ejecución.",
    "",
    "FORMATO DE SALIDA OBLIGATORIO:",
    "1) Resumen ejecutivo (5-8 líneas).",
    "2) Indicadores clave.",
    "3) Hallazgos relevantes (mínimo 5).",
    "4) Riesgos/alertas con prioridad (alta/media/baja).",
    "5) Recomendaciones accionables por horizonte (0-30, 31-90, 90+ días) con: acción, impacto esperado, KPI y responsable sugerido.",
    "6) Conclusión corta para comité.",
    "",
    customInstruction
      ? `INSTRUCCIÓN_ADICIONAL_USUARIO: ${customInstruction}`
      : "",
    "",
    "VALORES_CANONICOS:",
    JSON.stringify(canonicalBlock),
    "",
    "DATOS_DETALLE_JSON:",
    JSON.stringify(snapshot),
  ]
    .filter(Boolean)
    .join("\n");
};
