type SeoRouteKey = "home" | "contact" | "ai";
type SeoVariant = "A" | "B";

type SeoCopy = {
  title: string;
  description: string;
  keywords: string;
};

const SEO_EXPERIMENTS: Record<SeoRouteKey, Record<SeoVariant, SeoCopy>> = {
  home: {
    A: {
      title: "Software Para Administración de Condominios | EstateAdmin",
      description:
        "Administra condominios en un solo sistema: cuotas de mantenimiento, cobranza, egresos, mantenimiento, inventario y comunicación con residentes.",
      keywords:
        "software para administracion de condominios, administracion de condominios, sistema de gestion de condominios, cuotas de mantenimiento, cobranza condominal, egresos de condominio, mantenimiento de condominios, app para administradores de condominios",
    },
    B: {
      title:
        "Sistema de Gestión de Condominios y Cobranza | EstateAdmin",
      description:
        "Reduce morosidad y ordena la operación de tu condominio con módulos de cobranza, egresos, mantenimiento, proyectos e inventario.",
      keywords:
        "sistema de gestion de condominios, software para condominios, reducir morosidad condominio, cobranza de cuotas condominales, control de egresos condominio, mantenimiento preventivo condominios",
    },
  },
  contact: {
    A: {
      title:
        "Demo de Software Para Administración de Condominios | EstateAdmin",
      description:
        "Solicita una demo de EstateAdmin. Mejora cobranza, control de cuotas de mantenimiento, egresos y operación diaria de tu condominio.",
      keywords:
        "demo administracion de condominios, contacto estateadmin, software para condominios, control de cuotas de mantenimiento, cobranza condominal",
    },
    B: {
      title: "Agenda una Demo Para Tu Condominio | EstateAdmin",
      description:
        "Habla con nuestro equipo y conoce cómo digitalizar finanzas, mantenimiento y comunicación en tu condominio.",
      keywords:
        "agendar demo condominio, plataforma de administracion condominio, software administradores de condominios, contacto software condominal",
    },
  },
  ai: {
    A: {
      title: "Inteligencia Artificial Para Condominios | EstateAdmin",
      description:
        "IA aplicada a la administración de condominios: reportes financieros ejecutivos, recomendaciones accionables y automatización operativa con trazabilidad.",
      keywords:
        "inteligencia artificial condominios, reportes financieros con ia, software para administracion de condominios, automatizacion condominal, analitica financiera condominios",
    },
    B: {
      title: "IA Para Mejorar la Administración de Condominios | EstateAdmin",
      description:
        "Acelera decisiones con reportes IA, análisis financiero y recomendaciones prácticas para mejorar cobranza y control operativo.",
      keywords:
        "ia para administracion de condominios, analisis de cobranza con ia, reportes ejecutivos condominio, automatizacion operativa condominal",
    },
  },
};

const rawVariant =
  (import.meta.env.VITE_SEO_VARIANT || "A").toString().trim().toUpperCase();

export const ACTIVE_SEO_VARIANT: SeoVariant =
  rawVariant === "B" ? "B" : "A";

export const getSeoExperimentCopy = (route: SeoRouteKey): SeoCopy =>
  SEO_EXPERIMENTS[route][ACTIVE_SEO_VARIANT];
