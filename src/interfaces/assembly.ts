// ─── Assembly Presentation Types ───────────────────────────────────────────
// Modelo de datos para presentaciones de asamblea.
// El viewer público recibe datos en snapshot (capturados al publicar).

export type SlideType =
  | "cover"
  | "executive_summary"
  | "financial"
  | "financial_breakdown"
  | "collections"
  | "collections_top"
  | "maintenance"
  | "projects"
  | "comparison"
  | "agenda"
  | "agreements"
  | "custom_text";

// ── Common ─────────────────────────────────────────────────────────────────

/** Logo opcional (usado por el viewer en la esquina sup. derecha 170x170). */
export interface SlideLogoData {
  logoUrl?: string;
  /** Nombre del condominio (mostrado debajo del logo si aplica) */
  condoName?: string;
}

/** Rango de fechas seleccionado para la presentación (opcional). */
export interface AssemblyPeriod {
  /** ISO date "YYYY-MM-DD" */
  start: string;
  /** ISO date "YYYY-MM-DD" */
  end: string;
}

// ── Slide data types (snapshot — all values pre-fetched at publish time) ────

export interface CoverSlideData extends SlideLogoData {
  type: "cover";
  condoName: string;
  logoUrl?: string;
  title: string;
  subtitle: string;
  date: string; // assembly date ISO
  /** Texto descriptivo del periodo cubierto, ej. "01 ene – 31 ene 2026" */
  periodLabel?: string;
}

export interface ExecutiveSummarySlideData extends SlideLogoData {
  type: "executive_summary";
  period: string;
  kpis: {
    label: string;
    value: string;
    sublabel?: string;
    /** Variación versus periodo anterior, ej "+8.2%" o "-3%" */
    delta?: string;
    deltaPositive?: boolean;
    icon?: "income" | "expense" | "balance" | "pending" | "compliance" | "tickets" | "projects" | "units";
  }[];
  highlights?: string[];
}

export interface FinancialSlideData extends SlideLogoData {
  type: "financial";
  period: string; // "Enero – Junio 2025"
  totalIncome: number;       // pesos
  totalExpenses: number;     // pesos
  balance: number;           // pesos
  totalPending: number;      // pesos (cuotas pendientes)
  initialBalance?: number;   // saldo inicial cuentas
  finalBalance?: number;     // saldo final estimado
  monthlyStats: { month: string; income: number; expenses: number }[];
  /** Comparativa con periodo anterior (mismo lapso) */
  previousPeriod?: {
    label: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
}

export interface FinancialBreakdownSlideData extends SlideLogoData {
  type: "financial_breakdown";
  period: string;
  /** Top conceptos de ingreso del periodo */
  topIncomeConcepts: { concept: string; amount: number; percentage: number }[];
  /** Top conceptos de egreso del periodo */
  topExpenseConcepts: { concept: string; amount: number; percentage: number }[];
  /** Distribución por método de pago (ingresos) */
  paymentMethods?: { method: string; amount: number }[];
  totalIncome: number;
  totalExpenses: number;
}

export interface CollectionsSlideData extends SlideLogoData {
  type: "collections";
  period: string;
  complianceRate: number;    // 0–100
  delinquencyRate: number;   // 0–100
  totalUnits: number;
  paidUnits: number;
  pendingUnits: number;
  pendingAmount: number;     // pesos
  monthlyCompliance?: { month: string; complianceRate: number }[];
  previousPeriod?: {
    label: string;
    complianceRate: number;
    pendingAmount: number;
  };
}

export interface CollectionsTopSlideData extends SlideLogoData {
  type: "collections_top";
  period: string;
  /** Top condominios morosos (anonimizable). */
  topDebtors: {
    /** "A-101" o "Unidad #N" si anonimizado */
    label: string;
    pendingAmount: number;
    monthsBehind?: number;
  }[];
  /** Si se anonimiza la lista para no mostrar números reales */
  anonymized: boolean;
}

export interface MaintenanceSlideData extends SlideLogoData {
  type: "maintenance";
  period: string;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  totalTickets: number;
  /** Promedio de horas a resolución de los cerrados en el periodo */
  avgResolutionHours?: number;
  /** Top tickets por prioridad alta */
  highPriorityTickets?: number;
  /** Top áreas con tickets */
  topAreas?: { area: string; count: number }[];
  /** Tickets recientes destacados (máx 5) */
  highlights?: { folio: string; title: string; status: string; priority?: string }[];
}

export interface ProjectsSlideData extends SlideLogoData {
  type: "projects";
  /** IDs de proyectos seleccionados por el admin (si vacío = todos los activos) */
  selectedProjectIds?: string[];
  projects: {
    id?: string;
    name: string;
    description?: string;
    status: string;
    progress: number;   // 0–100
    budget: number;     // pesos
    spent: number;      // pesos
    startDate?: string;
    endDate?: string;
    expensesCount?: number;
    quotesCount?: number;
    /** Historial detallado de gastos (top items) */
    topExpenses?: { concept: string; amount: number; date: string }[];
  }[];
}

export interface ComparisonSlideData extends SlideLogoData {
  type: "comparison";
  /** "Enero 2026" */
  currentLabel: string;
  /** "Enero 2025" o "Diciembre 2025" según rango */
  previousLabel: string;
  comparisonType: "monthly" | "period";
  metrics: {
    label: string;
    current: number;
    previous: number;
    /** "currency" | "percent" | "number" */
    format: "currency" | "percent" | "number";
    /** true si "más" es mejor (ingresos), false si "menos" es mejor (egresos, morosidad) */
    higherIsBetter: boolean;
  }[];
}

export interface AgendaSlideData extends SlideLogoData {
  type: "agenda";
  title: string;
  items: { number?: string; text: string }[];
}

export interface AgreementsSlideData extends SlideLogoData {
  type: "agreements";
  title: string;
  /** Acuerdos previos: cada uno con fecha y descripción */
  previousAgreements: {
    date?: string;
    text: string;
    status?: "cumplido" | "pendiente" | "en_progreso";
  }[];
}

export interface CustomTextSlideData extends SlideLogoData {
  type: "custom_text";
  title: string;
  body: string;
  tag?: string;
}

export type AssemblySlideData =
  | CoverSlideData
  | ExecutiveSummarySlideData
  | FinancialSlideData
  | FinancialBreakdownSlideData
  | CollectionsSlideData
  | CollectionsTopSlideData
  | MaintenanceSlideData
  | ProjectsSlideData
  | ComparisonSlideData
  | AgendaSlideData
  | AgreementsSlideData
  | CustomTextSlideData;

// ── Draft config (used in builder before data is fetched) ──────────────────

export interface SlideConfigDraft {
  /** local uuid for drag/drop keys */
  localId: string;
  type: SlideType;
  /** override label shown in builder */
  label?: string;
  // custom_text only
  customTitle?: string;
  customBody?: string;
  customTag?: string;
  // projects: si está vacío usa todos los activos
  selectedProjectIds?: string[];
  // collections_top
  anonymized?: boolean;
  topDebtorsLimit?: number;
  // agenda
  agendaTitle?: string;
  agendaItems?: { number?: string; text: string }[];
  // agreements
  agreementsTitle?: string;
  previousAgreements?: {
    date?: string;
    text: string;
    status?: "cumplido" | "pendiente" | "en_progreso";
  }[];
  // comparison
  comparisonType?: "monthly" | "period";
}

export const SLIDE_TYPE_META: Record<
  SlideType,
  { label: string; description: string; icon: string }
> = {
  cover: {
    label: "Portada",
    description: "Slide de bienvenida con nombre del condominio y fecha",
    icon: "fa-solid fa-image",
  },
  executive_summary: {
    label: "Resumen Ejecutivo",
    description: "KPIs clave del periodo en un solo vistazo",
    icon: "fa-solid fa-gauge-high",
  },
  financial: {
    label: "Resumen Financiero",
    description: "Ingresos, egresos, balance y gráfica mensual",
    icon: "fa-solid fa-chart-line",
  },
  financial_breakdown: {
    label: "Detalle Financiero",
    description: "Top conceptos de ingreso/egreso y métodos de pago",
    icon: "fa-solid fa-chart-pie",
  },
  collections: {
    label: "Estado de Cobros",
    description: "Porcentaje de cumplimiento de pago y unidades morosas",
    icon: "fa-solid fa-circle-dollar-to-slot",
  },
  collections_top: {
    label: "Top Morosos",
    description: "Lista de unidades con mayor adeudo (anonimizable)",
    icon: "fa-solid fa-list-ol",
  },
  maintenance: {
    label: "Mantenimiento",
    description: "Resumen de tickets abiertos, en progreso y cerrados",
    icon: "fa-solid fa-wrench",
  },
  projects: {
    label: "Proyectos",
    description: "Estado y avance presupuestario (selecciona cuáles mostrar)",
    icon: "fa-solid fa-diagram-project",
  },
  comparison: {
    label: "Comparativa",
    description: "Compara el periodo actual contra el anterior equivalente",
    icon: "fa-solid fa-arrows-left-right",
  },
  agenda: {
    label: "Orden del Día",
    description: "Lista de puntos a tratar en la asamblea",
    icon: "fa-solid fa-list-check",
  },
  agreements: {
    label: "Acuerdos Previos",
    description: "Acuerdos de asambleas anteriores y su seguimiento",
    icon: "fa-solid fa-handshake",
  },
  custom_text: {
    label: "Comunicado",
    description: "Texto libre para anuncios, acuerdos o avisos",
    icon: "fa-solid fa-bullhorn",
  },
};

// ── Presentation entity (stored in Firestore) ──────────────────────────────

export interface AssemblyPresentation {
  id?: string;
  clientId: string;
  condominiumId: string;
  condominiumName: string;
  title: string;
  /** Fecha en que se realiza la asamblea (ISO YYYY-MM-DD) */
  assemblyDate: string;
  /** Periodo de datos a mostrar (por ejemplo "01 ene → 31 ene 2026"). Opcional. */
  period?: AssemblyPeriod;
  /** Logo personalizado a usar en cada slide (subido por el admin) */
  logoUrl?: string;
  status: "draft" | "published";
  createdBy: string;
  createdAt: string;            // ISO string
  updatedAt: string;            // ISO string
  slides: AssemblySlideData[];
  /** Draft slide order — saved separately from the snapshot */
  draftSlides: SlideConfigDraft[];
}
