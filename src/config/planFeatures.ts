import { PlanType } from "../store/usePlanStore";

/**
 * Interfaz para definir una característica Pro
 */
export interface FeatureConfig {
  key: string; // Clave única para identificar la feature
  displayName: string; // Nombre mostrado al usuario
  description: string; // Descripción corta de la feature
}

/**
 * Lista de todas las características Pro disponibles
 * Agregar aquí nuevas características para mantenerlas centralizadas
 */
export const PRO_FEATURES: FeatureConfig[] = [
  {
    key: "chatBot",
    displayName: "Asistente IA",
    description:
      "Asistente virtual potenciado por IA para resolver consultas sobre tu condominio",
  },
  // Nuevas características se pueden agregar aquí
  // {
  //   key: "financialAI",
  //   displayName: "Análisis Financiero IA",
  //   description: "Análisis predictivo de gastos y recomendaciones para optimizar finanzas"
  // },
];

/**
 * Configuración de características por plan
 * Esto define qué características están disponibles en cada tipo de plan
 */
export const PLAN_FEATURES: Record<PlanType, Record<string, boolean>> = {
  basic: {
    // Todas las características básicas están habilitadas por defecto
    // Las características Pro están deshabilitadas
    chatBot: false,
    // Agregar nuevas características aquí con valor false
  },
  pro: {
    // Todas las características básicas y Pro están habilitadas
    chatBot: true,
    // Agregar nuevas características aquí con valor true
  },
};

/**
 * Obtiene la configuración completa de una característica por su clave
 */
export const getFeatureConfig = (
  featureKey: string
): FeatureConfig | undefined => {
  return PRO_FEATURES.find((feature) => feature.key === featureKey);
};
