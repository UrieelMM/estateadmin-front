// ─── Search Index ────────────────────────────────────────────────────────────
// Static index of every navigable destination in the dashboard.
// Each item carries enough metadata for fuzzy matching and grouped display.

export interface SearchItem {
  id: string;
  title: string;
  section: string;       // top-level group label
  subsection?: string;   // optional mid-level label
  breadcrumb: string;    // full readable path
  href: string;
  keywords?: string[];
}

export const SEARCH_INDEX: SearchItem[] = [
  // ─── Inicio ────────────────────────────────────────────────────────────────
  {
    id: "home",
    title: "Inicio",
    section: "General",
    breadcrumb: "Inicio",
    href: "/dashboard/home",
    keywords: ["home", "principal", "dashboard", "panel"],
  },

  // ─── Usuarios ──────────────────────────────────────────────────────────────
  {
    id: "users-registration",
    title: "Registro de condominos",
    section: "Usuarios",
    breadcrumb: "Usuarios › Registro de condominos",
    href: "/dashboard/users-registration",
    keywords: ["registro", "condómino", "nuevo usuario", "alta"],
  },
  {
    id: "users-list",
    title: "Condominos",
    section: "Usuarios",
    breadcrumb: "Usuarios › Condominos",
    href: "/dashboard/users",
    keywords: ["condóminos", "residentes", "lista", "directorio"],
  },

  // ─── Finanzas › Ingresos ───────────────────────────────────────────────────
  {
    id: "income-summary",
    title: "Resumen de ingresos",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Resumen",
    href: "/dashboard/income/summary",
    keywords: ["ingresos", "resumen", "pagos", "cobros"],
  },
  {
    id: "income-account-summary",
    title: "Resumen por cuenta",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Resumen por cuenta",
    href: "/dashboard/income/account-summary",
    keywords: ["cuenta bancaria", "resumen", "ingresos"],
  },
  {
    id: "income-maintenance",
    title: "Mantenimiento (Ingresos)",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Mantenimiento",
    href: "/dashboard/income/maintenance",
    keywords: ["mantenimiento", "cuota", "ingresos", "pago mantenimiento"],
  },
  {
    id: "income-towers",
    title: "Torres",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Torres",
    href: "/dashboard/income/towers",
    keywords: ["torres", "edificios", "ingresos por torre"],
  },
  {
    id: "income-by-condominium",
    title: "Historial por condómino",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Historial por condómino",
    href: "/dashboard/income/by-condominium",
    keywords: ["historial", "condómino", "pagos", "historial de pagos"],
  },
  {
    id: "income-delinquency",
    title: "Morosidad",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Morosidad",
    href: "/dashboard/income/delinquency",
    keywords: ["morosidad", "morosos", "deudores", "adeudos", "delinquency"],
  },
  {
    id: "income-unidentified",
    title: "Pagos no identificados",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Pagos no identificados",
    href: "/dashboard/income/unidentified",
    keywords: ["no identificados", "depósitos", "sin referencia"],
  },
  {
    id: "income-history",
    title: "Historial de pagos",
    section: "Finanzas",
    subsection: "Ingresos",
    breadcrumb: "Finanzas › Ingresos › Historial",
    href: "/dashboard/income/history",
    keywords: ["historial", "todos los pagos", "log pagos"],
  },

  // ─── Finanzas › Egresos ────────────────────────────────────────────────────
  {
    id: "expenses-summary",
    title: "Resumen de egresos",
    section: "Finanzas",
    subsection: "Egresos",
    breadcrumb: "Finanzas › Egresos › Resumen",
    href: "/dashboard/expenses/summary",
    keywords: ["egresos", "gastos", "resumen", "salidas"],
  },
  {
    id: "expenses-history",
    title: "Historial de egresos",
    section: "Finanzas",
    subsection: "Egresos",
    breadcrumb: "Finanzas › Egresos › Historial",
    href: "/dashboard/expenses/history",
    keywords: ["egresos", "historial", "gastos", "facturas"],
  },
  {
    id: "expenses-providers",
    title: "Egresos por proveedor",
    section: "Finanzas",
    subsection: "Egresos",
    breadcrumb: "Finanzas › Egresos › Por proveedor",
    href: "/dashboard/expenses/by-provider",
    keywords: ["proveedor", "egresos", "gastos proveedor"],
  },

  // ─── Finanzas › Caja Chica ─────────────────────────────────────────────────
  {
    id: "pettycash",
    title: "Caja Chica",
    section: "Finanzas",
    subsection: "Caja Chica",
    breadcrumb: "Finanzas › Caja Chica",
    href: "/dashboard/pettycash/dashboard",
    keywords: ["caja chica", "efectivo", "gastos menores", "petty cash"],
  },

  // ─── Finanzas › Conciliación ───────────────────────────────────────────────
  {
    id: "reconciliation-income",
    title: "Conciliación de ingresos",
    section: "Finanzas",
    subsection: "Conciliación",
    breadcrumb: "Finanzas › Conciliación › Ingresos",
    href: "/dashboard/reconciliation/income",
    keywords: ["conciliación", "ingresos", "banco", "conciliar"],
  },
  {
    id: "reconciliation-expenses",
    title: "Conciliación de egresos",
    section: "Finanzas",
    subsection: "Conciliación",
    breadcrumb: "Finanzas › Conciliación › Egresos",
    href: "/dashboard/reconciliation/expenses",
    keywords: ["conciliación", "egresos", "banco", "gastos"],
  },
  {
    id: "reconciliation-history",
    title: "Historial de conciliaciones",
    section: "Finanzas",
    subsection: "Conciliación",
    breadcrumb: "Finanzas › Conciliación › Historial",
    href: "/dashboard/reconciliation/history",
    keywords: ["conciliación", "historial", "registro"],
  },

  // ─── Finanzas › Balance ────────────────────────────────────────────────────
  {
    id: "balance-summary",
    title: "Balance general",
    section: "Finanzas",
    subsection: "Balance",
    breadcrumb: "Finanzas › Balance General",
    href: "/dashboard/balance/summary",
    keywords: ["balance", "general", "estado financiero", "resumen financiero"],
  },

  // ─── Finanzas › Cargos ─────────────────────────────────────────────────────
  {
    id: "charges",
    title: "Cargos",
    section: "Finanzas",
    subsection: "Cargos",
    breadcrumb: "Finanzas › Cargos",
    href: "/dashboard/charges",
    keywords: ["cargos", "cobros", "multas", "extras"],
  },

  // ─── Finanzas › Recibos y Comprobantes ────────────────────────────────────
  {
    id: "receipts-vouchers",
    title: "Facturas por condómino",
    section: "Finanzas",
    subsection: "Recibos y Comprobantes",
    breadcrumb: "Finanzas › Recibos y Comprobantes › Facturas",
    href: "/dashboard/receipts-and-invoices/vouchers",
    keywords: ["facturas", "recibos", "condómino", "comprobantes"],
  },
  {
    id: "receipts-download",
    title: "Descargar recibos y comprobantes",
    section: "Finanzas",
    subsection: "Recibos y Comprobantes",
    breadcrumb: "Finanzas › Recibos y Comprobantes › Descargar",
    href: "/dashboard/receipts-and-invoices/download",
    keywords: ["descargar", "recibos", "comprobantes", "PDF"],
  },

  // ─── Finanzas › Proyectos ──────────────────────────────────────────────────
  {
    id: "projects",
    title: "Proyectos",
    section: "Finanzas",
    subsection: "Proyectos",
    breadcrumb: "Finanzas › Proyectos",
    href: "/dashboard/projects",
    keywords: ["proyectos", "obras", "presupuesto", "planeación"],
  },

  // ─── Comunidad ─────────────────────────────────────────────────────────────
  {
    id: "common-areas",
    title: "Áreas comunes",
    section: "Comunidad",
    breadcrumb: "Comunidad › Áreas comunes",
    href: "/dashboard/common-areas",
    keywords: ["áreas comunes", "salon", "gym", "alberca", "reservas"],
  },
  {
    id: "calendar",
    title: "Calendario",
    section: "Comunidad",
    breadcrumb: "Comunidad › Calendario",
    href: "/dashboard/calendar",
    keywords: ["calendario", "eventos", "agenda"],
  },
  {
    id: "publications",
    title: "Publicaciones",
    section: "Comunidad",
    breadcrumb: "Comunidad › Publicaciones",
    href: "/dashboard/publications",
    keywords: ["publicaciones", "avisos", "noticias", "comunicados"],
  },
  {
    id: "scheduled-visits",
    title: "Visitas",
    section: "Comunidad",
    breadcrumb: "Comunidad › Visitas",
    href: "/dashboard/scheduled-visits",
    keywords: ["visitas", "visitantes", "acceso", "invitados"],
  },

  // ─── Paquetería ────────────────────────────────────────────────────────────
  {
    id: "parcel-reception",
    title: "Paquetería",
    section: "Paquetería",
    breadcrumb: "Paquetería",
    href: "/dashboard/parcel-reception",
    keywords: ["paquetería", "paquetes", "envíos", "mensajería", "recepción"],
  },

  // ─── Mantenimiento ─────────────────────────────────────────────────────────
  {
    id: "maintenance-dashboard",
    title: "Dashboard de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Dashboard",
    href: "/dashboard/maintenance-reports/dashboard",
    keywords: ["mantenimiento", "dashboard", "resumen", "KPIs"],
  },
  {
    id: "maintenance-reports",
    title: "Reportes de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Reportes",
    href: "/dashboard/maintenance-reports/reports",
    keywords: ["reportes", "mantenimiento", "fallas", "incidencias"],
  },
  {
    id: "maintenance-tickets",
    title: "Tickets de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Tickets",
    href: "/dashboard/maintenance-reports/tickets",
    keywords: ["tickets", "solicitudes", "mantenimiento", "reporte"],
  },
  {
    id: "maintenance-appointments",
    title: "Citas de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Citas",
    href: "/dashboard/maintenance-reports/appointments",
    keywords: ["citas", "agenda", "visitas técnicas", "programadas"],
  },
  {
    id: "maintenance-contracts",
    title: "Contratos de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Contratos",
    href: "/dashboard/maintenance-reports/contracts",
    keywords: ["contratos", "proveedores", "mantenimiento", "acuerdos"],
  },
  {
    id: "maintenance-costs",
    title: "Costos de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › Costos",
    href: "/dashboard/maintenance-reports/costs",
    keywords: ["costos", "gastos", "mantenimiento", "presupuesto"],
  },
  {
    id: "maintenance-app",
    title: "App de mantenimiento",
    section: "Mantenimiento",
    breadcrumb: "Mantenimiento › App",
    href: "/dashboard/maintenance-reports/app",
    keywords: ["app", "móvil", "aplicación", "mantenimiento"],
  },

  // ─── Proveedores ───────────────────────────────────────────────────────────
  {
    id: "providers",
    title: "Proveedores",
    section: "Proveedores",
    breadcrumb: "Proveedores",
    href: "/dashboard/providers",
    keywords: ["proveedores", "empresas", "contratistas", "servicios"],
  },

  // ─── Inventario ────────────────────────────────────────────────────────────
  {
    id: "inventory",
    title: "Inventario",
    section: "Inventario",
    breadcrumb: "Inventario",
    href: "/dashboard/inventory/items",
    keywords: ["inventario", "activos", "bienes", "equipos", "herramientas"],
  },

  // ─── Personal ──────────────────────────────────────────────────────────────
  {
    id: "personal-employees",
    title: "Personal — Empleados",
    section: "Personal",
    breadcrumb: "Personal › Empleados",
    href: "/dashboard/personal-administration/staff",
    keywords: ["personal", "empleados", "staff", "trabajadores"],
  },
  {
    id: "personal-schedule",
    title: "Asistencia y horarios",
    section: "Personal",
    breadcrumb: "Personal › Asistencia",
    href: "/dashboard/personal-administration/attendance",
    keywords: ["asistencia", "horarios", "checador", "entradas", "salidas"],
  },
  {
    id: "personal-tickets",
    title: "Tickets de personal",
    section: "Personal",
    breadcrumb: "Personal › Tickets",
    href: "/dashboard/personal-administration/tickets",
    keywords: ["tickets", "personal", "incidencias", "solicitudes"],
  },
  {
    id: "personal-evaluations",
    title: "Evaluaciones de desempeño",
    section: "Personal",
    breadcrumb: "Personal › Evaluaciones",
    href: "/dashboard/personal-administration/evaluations",
    keywords: ["evaluaciones", "desempeño", "calificaciones", "performance"],
  },
  {
    id: "personal-activity",
    title: "Bitácora de actividad",
    section: "Personal",
    breadcrumb: "Personal › Bitácora",
    href: "/dashboard/personal-administration/activity-log",
    keywords: ["bitácora", "actividad", "log", "registro"],
  },
  {
    id: "personal-reports",
    title: "Reportes de personal",
    section: "Personal",
    breadcrumb: "Personal › Reportes",
    href: "/dashboard/personal-administration/reports",
    keywords: ["reportes", "personal", "nómina", "resúmenes"],
  },
  {
    id: "personal-audit",
    title: "Auditoría de personal",
    section: "Personal",
    breadcrumb: "Personal › Auditoría",
    href: "/dashboard/personal-administration/audit",
    keywords: ["auditoría", "personal", "log", "historial"],
  },

  // ─── Asambleas ─────────────────────────────────────────────────────────────
  {
    id: "asambleas",
    title: "Asambleas",
    section: "Asambleas",
    breadcrumb: "Asambleas",
    href: "/dashboard/asambleas",
    keywords: ["asambleas", "juntas", "reuniones", "actas", "votaciones"],
  },

  // ─── Configuración ─────────────────────────────────────────────────────────
  {
    id: "config-general",
    title: "Configuración general",
    section: "Configuración",
    breadcrumb: "Configuración › General",
    href: "/dashboard/client-config/general",
    keywords: ["configuración", "empresa", "general", "datos", "logo"],
  },
  {
    id: "config-payments",
    title: "Pagos y Facturas",
    section: "Configuración",
    breadcrumb: "Configuración › Pagos y Facturas",
    href: "/dashboard/client-config/payments-invoices",
    keywords: ["pagos", "facturas", "configuración", "facturación"],
  },
  {
    id: "config-accounts",
    title: "Cuentas Bancarias",
    section: "Configuración",
    breadcrumb: "Configuración › Cuentas Bancarias",
    href: "/dashboard/client-config/bank-accounts",
    keywords: ["cuentas bancarias", "banco", "CLABE", "configuración"],
  },
  {
    id: "config-documents",
    title: "Documentos y mensajes",
    section: "Configuración",
    breadcrumb: "Configuración › Documentos",
    href: "/dashboard/client-config/messages-documents",
    keywords: ["documentos", "mensajes", "plantilla", "recibo", "pago"],
  },
  {
    id: "config-users",
    title: "Administradores",
    section: "Configuración",
    breadcrumb: "Configuración › Administradores",
    href: "/dashboard/client-config/administrators",
    keywords: ["administradores", "usuarios", "acceso", "roles", "permisos"],
  },
  {
    id: "config-audit",
    title: "Auditoría",
    section: "Configuración",
    breadcrumb: "Configuración › Auditoría",
    href: "/dashboard/client-config/audit-log",
    keywords: ["auditoría", "log", "historial", "cambios", "trazabilidad"],
  },
  {
    id: "config-committee",
    title: "Comité y Reportes",
    section: "Configuración",
    breadcrumb: "Configuración › Comité y Reportes",
    href: "/dashboard/client-config/committee-reports",
    keywords: ["comité", "reportes", "junta directiva", "administración"],
  },
  {
    id: "config-assistant",
    title: "Asistente IA",
    section: "Configuración",
    breadcrumb: "Configuración › Asistente IA",
    href: "/dashboard/client-config/assistant",
    keywords: ["IA", "inteligencia artificial", "asistente", "chatbot", "GPT"],
  },
];
