/**
 * CasetaDashboard.tsx
 *
 * Pantalla pública para el personal de caseta.
 * URL: /caseta/:clientId/:condominiumId
 *
 * Autenticación: PIN de 6 dígitos (el mismo configurado en el panel admin).
 * La sesión se guarda en sessionStorage — expira al cerrar el navegador.
 * Permite registrar entrada/salida manual (sin QR) confirmando con PIN.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  UserIcon,
  HomeIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowRightCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import LoadingApp from "../../components/shared/loaders/LoadingApp";

// ─── Constantes ────────────────────────────────────────────────────────────

const API_BASE = (
  import.meta.env.VITE_URL_SERVER ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

const SESSION_KEY = "caseta_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

// ─── Tipos ─────────────────────────────────────────────────────────────────

type VisitStatus = "active" | "used" | "completed" | "expired" | "cancelled";
type VisitType = "single" | "recurring";

interface VisitResident {
  name?: string | null;
  lastName?: string | null;
  email?: string;
  departmentNumber?: string;
  tower?: string | null;
  phoneNumber?: string;
}

interface Visit {
  id: string;
  visitType: VisitType;
  visitorName: string;
  visitorVehicle?: { plates?: string; description?: string } | null;
  arrivalAt?: any;
  departureAt?: any;
  arrivalAtLabel?: string;
  departureAtLabel?: string;
  recurrence?: {
    daysOfWeek: number[];
    dailyArrivalTime: string;
    dailyDepartureTime: string;
    startDate?: any;
    endDate?: any;
  } | null;
  resident: VisitResident;
  condominiumName?: string | null;
  status: VisitStatus;
  usedAt?: any;
  exitAt?: any;
  lastUsedAt?: any;
  lastExitAt?: any;
  createdAt?: any;
}

interface CasetaSession {
  clientId: string;
  condominiumId: string;
  pin: string;
  expiresAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toMs(value: any): number | null {
  if (!value) return null;
  if (typeof value?._seconds === "number") return value._seconds * 1000;
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

function toDate(value: any): Date | null {
  const ms = toMs(value);
  return ms !== null ? new Date(ms) : null;
}

function formatDate(value: any, withTime = true): string {
  const d = toDate(value);
  if (!d) return "—";
  return withTime
    ? d.toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : d.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function formatDays(days?: number[]): string {
  if (!days || days.length === 0) return "—";
  const sorted = [...days].sort().join(",");
  if (sorted === "0,1,2,3,4,5,6") return "Todos los días";
  if (sorted === "1,2,3,4,5") return "Lun – Vie";
  if (sorted === "1,2,3,4,5,6") return "Lun – Sáb";
  if (sorted === "0,6") return "Fines de semana";
  return [...days]
    .sort()
    .map((d) => DAY_NAMES[d])
    .join(" · ");
}

function statusLabel(s: VisitStatus): string {
  const map: Record<VisitStatus, string> = {
    active: "Activa",
    used: "En curso",
    completed: "Completada",
    expired: "Expirada",
    cancelled: "Cancelada",
  };
  return map[s] ?? s;
}

function statusColors(s: VisitStatus): string {
  const map: Record<VisitStatus, string> = {
    active: "bg-green-100 text-green-700 ring-green-200",
    used: "bg-blue-100 text-blue-700 ring-blue-200",
    completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    expired: "bg-gray-100 text-gray-600 ring-gray-200",
    cancelled: "bg-red-100 text-red-700 ring-red-200",
  };
  return map[s] ?? "bg-gray-100 text-gray-600 ring-gray-200";
}

function residentFullName(r?: VisitResident): string {
  if (!r) return "—";
  const full = [r.name, r.lastName].filter(Boolean).join(" ");
  return full || r.email || "—";
}

function saveSession(s: CasetaSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch (_) {}
}

function loadSession(): CasetaSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: CasetaSession = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Componentes de apoyo ──────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: VisitStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors(status)}`}
  >
    {statusLabel(status)}
  </span>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2 text-sm">
    <div className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</div>
    <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
    <span className="text-gray-900 break-words flex-1">{value}</span>
  </div>
);

// ─── Pantalla principal ────────────────────────────────────────────────────

const CasetaDashboard = () => {
  const { clientId = "", condominiumId = "" } = useParams<{
    clientId: string;
    condominiumId: string;
  }>();

  // ── Auth state ──
  const [session, setSession] = useState<CasetaSession | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ── Visits state ──
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [visitsError, setVisitsError] = useState<string | null>(null);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VisitStatus | "all">("all");
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Detail modal ──
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Restaurar sesión desde sessionStorage al montar
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.clientId === clientId && saved.condominiumId === condominiumId) {
      setSession(saved);
    }
  }, [clientId, condominiumId]);

  // Cargar visitas cuando hay sesión activa
  useEffect(() => {
    if (session) {
      fetchVisits(session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchVisits = useCallback(async (s: CasetaSession) => {
    setLoadingVisits(true);
    setVisitsError(null);
    try {
      const params = new URLSearchParams({
        clientId: s.clientId,
        condominiumId: s.condominiumId,
        pin: s.pin,
        limit: "400",
      });
      const res = await fetch(
        `${API_BASE}/scheduled-visits-caseta/dashboard/visits?${params.toString()}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data?.message || `Error ${res.status}`);
      }
      setVisits(data.visits ?? []);
    } catch (err: any) {
      setVisitsError(err?.message || "Error al cargar visitas");
    } finally {
      setLoadingVisits(false);
    }
  }, []);

  // ── PIN input handlers ──
  const handlePinDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const arr = pin.padEnd(6, " ").split("");
    arr[index] = digit || " ";
    const next = arr.join("").trimEnd();
    setPin(next);
    if (digit && index < 5) pinRefs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      e.preventDefault();
      setPin(pasted);
      pinRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleLogin = async () => {
    if (pin.replace(/\s/g, "").length !== 6) {
      setAuthError("Ingresa los 6 dígitos del PIN.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(
        `${API_BASE}/scheduled-visits-caseta/dashboard/validate-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, condominiumId, pin }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.valid) {
        throw new Error("PIN incorrecto. Intenta de nuevo.");
      }
      const newSession: CasetaSession = {
        clientId,
        condominiumId,
        pin,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      saveSession(newSession);
      setSession(newSession);
      setPin("");
    } catch (err: any) {
      setAuthError(err?.message || "Error al validar el PIN.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setVisits([]);
    setPin("");
    setSearch("");
    setFilterStatus("all");
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
  };

  // ── Filtrado client-side ──
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Filtro por status
      if (filterStatus !== "all" && v.status !== filterStatus) return false;

      // Búsqueda por nombre (visitante o residente)
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const resident = residentFullName(v.resident).toLowerCase();
        const matches =
          v.visitorName?.toLowerCase().includes(s) ||
          resident.includes(s) ||
          v.resident?.departmentNumber?.toLowerCase().includes(s) ||
          v.resident?.phoneNumber?.includes(s);
        if (!matches) return false;
      }

      // Filtros de fecha por arrivalAt
      const arrival = toDate(v.arrivalAt);
      if (arrival) {
        if (filterYear && String(arrival.getFullYear()) !== filterYear)
          return false;
        if (filterMonth && String(arrival.getMonth() + 1).padStart(2, "0") !== filterMonth)
          return false;
        if (filterDay && String(arrival.getDate()).padStart(2, "0") !== filterDay)
          return false;
      } else if (filterYear || filterMonth || filterDay) {
        return false;
      }

      return true;
    });
  }, [visits, search, filterStatus, filterDay, filterMonth, filterYear]);

  const hasActiveFilters =
    filterStatus !== "all" || filterDay || filterMonth || filterYear;

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
  };

  // ─── Render: pantalla de login ──────────────────────────────────────────
  if (!session) {
    return (
      <>
        <Helmet>
          <title>Acceso Caseta | EstateAdmin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-center">
              <div className="bg-white/15 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShieldCheckIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Acceso Caseta</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Ingresa tu PIN de 6 dígitos
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* PIN inputs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center text-sm text-gray-500 mb-4">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>PIN de acceso de caseta</span>
                </div>
                <div className="flex justify-center gap-2.5" onPaste={handlePinPaste}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        pinRefs.current[i] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={pin[i] || ""}
                      onChange={(e) => handlePinDigit(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className="w-11 h-14 text-center text-2xl font-mono rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{authError}</p>
                </motion.div>
              )}

              <button
                type="button"
                disabled={authLoading || pin.replace(/\s/g, "").length < 6}
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {authLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRightCircleIcon className="h-5 w-5" />
                )}
                {authLoading ? "Verificando..." : "Acceder"}
              </button>

              <p className="text-center text-xs text-gray-400">
                La sesión expira automáticamente después de 8 horas
              </p>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ─── Render: loading visitas ────────────────────────────────────────────
  if (loadingVisits && visits.length === 0) {
    return (
      <>
        <Helmet>
          <title>Caseta – Visitas | EstateAdmin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingApp />
        </div>
      </>
    );
  }

  // ─── Render: dashboard ──────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Caseta – Visitas | EstateAdmin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Topbar */}
        <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6" />
            <div>
              <p className="font-semibold text-sm leading-tight">Dashboard Caseta</p>
              <p className="text-indigo-200 text-xs">Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => session && fetchVisits(session)}
              disabled={loadingVisits}
              className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
              title="Actualizar"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${loadingVisits ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleLogout}
              className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por visitante, residente o depto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
            />
          </div>

          {/* Filtros toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                filtersOpen || hasActiveFilters
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-0.5 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar filtros
              </button>
            )}

            <span className="ml-auto text-xs text-gray-400">
              {filteredVisits.length} de {visits.length} visita
              {visits.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Panel de filtros */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Estado
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          ["all", "Todos"],
                          ["active", "Activas"],
                          ["used", "En curso"],
                          ["completed", "Completadas"],
                          ["expired", "Expiradas"],
                          ["cancelled", "Canceladas"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFilterStatus(val)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            filterStatus === val
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Fecha de llegada
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">
                          Día
                        </label>
                        <select
                          value={filterDay}
                          onChange={(e) => setFilterDay(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        >
                          <option value="">Todos</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (d) => (
                              <option
                                key={d}
                                value={String(d).padStart(2, "0")}
                              >
                                {d}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">
                          Mes
                        </label>
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        >
                          <option value="">Todos</option>
                          {[
                            "Ene",
                            "Feb",
                            "Mar",
                            "Abr",
                            "May",
                            "Jun",
                            "Jul",
                            "Ago",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dic",
                          ].map((m, i) => (
                            <option
                              key={i}
                              value={String(i + 1).padStart(2, "0")}
                            >
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">
                          Año
                        </label>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        >
                          <option value="">Todos</option>
                          {Array.from(
                            { length: 5 },
                            (_, i) => new Date().getFullYear() - 1 + i,
                          ).map((y) => (
                            <option key={y} value={String(y)}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {visitsError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{visitsError}</p>
              <button
                onClick={() => session && fetchVisits(session)}
                className="ml-auto text-xs text-red-600 underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Lista de visitas */}
          {filteredVisits.length === 0 && !loadingVisits ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
              <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {visits.length === 0
                  ? "No hay visitas registradas aún."
                  : "No hay visitas con los filtros seleccionados."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-indigo-600 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {filteredVisits.map((v) => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    onClick={() => setSelectedVisit(v)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedVisit && (
          <VisitDetailModal
            visit={selectedVisit}
            session={session}
            onClose={() => setSelectedVisit(null)}
            onRegistered={() => session && fetchVisits(session)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── VisitCard ─────────────────────────────────────────────────────────────

const VisitCard = ({
  visit,
  onClick,
}: {
  visit: Visit;
  onClick: () => void;
}) => {
  const arrival = toDate(visit.arrivalAt);
  const checkIn = toDate(visit.usedAt ?? visit.lastUsedAt);
  const checkOut = toDate(visit.exitAt ?? visit.lastExitAt);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Visitante */}
          <p className="font-semibold text-gray-900 text-sm truncate">
            {visit.visitorName || "—"}
          </p>
          {/* Residente */}
          <p className="text-xs text-gray-500 truncate mt-0.5">
            <span className="text-gray-400">Residente: </span>
            {residentFullName(visit.resident)}
            {visit.resident?.departmentNumber && (
              <span className="ml-1 text-gray-400">
                · Depto {visit.resident.departmentNumber}
                {visit.resident.tower ? ` T${visit.resident.tower}` : ""}
              </span>
            )}
          </p>
          {/* Fecha */}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
            <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
            {visit.visitType === "single" ? (
              <span>{arrival ? formatDate(visit.arrivalAt) : visit.arrivalAtLabel || "—"}</span>
            ) : (
              <span>
                {formatDays(visit.recurrence?.daysOfWeek)} ·{" "}
                {visit.recurrence?.dailyArrivalTime}–
                {visit.recurrence?.dailyDepartureTime}
              </span>
            )}
          </div>
          {/* Check-in / check-out */}
          {(checkIn || checkOut) && (
            <div className="flex items-center gap-3 mt-1.5">
              {checkIn && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                  {checkIn.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {checkOut && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
                  {checkOut.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
        <StatusBadge status={visit.status} />
      </div>
    </motion.button>
  );
};

// ─── VisitDetailModal ──────────────────────────────────────────────────────

type RegisterStep = "idle" | "confirm" | "submitting" | "success" | "error";

const VisitDetailModal = ({
  visit,
  session,
  onClose,
  onRegistered,
}: {
  visit: Visit;
  session: CasetaSession | null;
  onClose: () => void;
  onRegistered: () => void;
}) => {
  const checkIn = visit.usedAt ?? visit.lastUsedAt ?? null;
  const checkOut = visit.exitAt ?? visit.lastExitAt ?? null;

  // Determinar qué acciones están disponibles
  const isSingle = visit.visitType === "single";
  const canCheckIn =
    visit.status === "active" && (!isSingle || !checkIn);
  const canCheckOut =
    (visit.status === "used" || visit.status === "active") &&
    (!isSingle || (!!checkIn && !checkOut));
  const hasActions = canCheckIn || canCheckOut;

  // Estado del flujo de confirmación
  const [step, setStep] = useState<RegisterStep>("idle");
  const [actionType, setActionType] = useState<"check-in" | "check-out" | null>(null);
  const [actionPin, setActionPin] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const actionPinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resetAction = () => {
    setStep("idle");
    setActionType(null);
    setActionPin("");
    setActionError(null);
  };

  const handleInitAction = (type: "check-in" | "check-out") => {
    setActionType(type);
    setActionPin("");
    setActionError(null);
    setStep("confirm");
    // Focus al primer input del PIN con pequeño delay para la animación
    setTimeout(() => actionPinRefs.current[0]?.focus(), 80);
  };

  const handleActionPinDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const arr = actionPin.padEnd(6, " ").split("");
    arr[index] = digit || " ";
    const next = arr.join("").trimEnd();
    setActionPin(next);
    if (digit && index < 5) actionPinRefs.current[index + 1]?.focus();
  };

  const handleActionPinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !actionPin[index] && index > 0) {
      actionPinRefs.current[index - 1]?.focus();
    }
  };

  const handleActionPinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted) {
      e.preventDefault();
      setActionPin(pasted);
      actionPinRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmitAction = async () => {
    if (!session || !actionType) return;
    if (actionPin.replace(/\s/g, "").length !== 6) {
      setActionError("Ingresa los 6 dígitos del PIN.");
      return;
    }
    setStep("submitting");
    setActionError(null);
    try {
      const res = await fetch(
        `${API_BASE}/scheduled-visits-caseta/dashboard/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: session.clientId,
            condominiumId: session.condominiumId,
            pin: actionPin,
            visitId: visit.id,
            type: actionType,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data?.message || `Error ${res.status}`);
      }
      setStep("success");
      // Recargar lista de visitas después de 1.5 s y cerrar
      setTimeout(() => {
        onRegistered();
        onClose();
      }, 1500);
    } catch (err: any) {
      setActionError(err?.message || "Error al registrar.");
      setStep("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={step === "idle" ? onClose : undefined}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-bold text-white text-base">{visit.visitorName}</p>
            <p className="text-indigo-200 text-xs mt-0.5">Detalle de visita</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={visit.status} />
            <button
              type="button"
              onClick={step === "confirm" ? resetAction : onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Visitante */}
          <Section title="Visitante">
            <InfoRow
              icon={<UserIcon className="h-4 w-4" />}
              label="Nombre"
              value={visit.visitorName || "—"}
            />
            {visit.visitorVehicle &&
              (visit.visitorVehicle.plates ||
                visit.visitorVehicle.description) && (
                <InfoRow
                  icon={<span className="text-base">🚗</span>}
                  label="Vehículo"
                  value={[
                    visit.visitorVehicle.plates,
                    visit.visitorVehicle.description,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
          </Section>

          {/* Programado */}
          <Section
            title={
              visit.visitType === "recurring" ? "Visita recurrente" : "Visita única"
            }
          >
            {visit.visitType === "single" ? (
              <>
                <InfoRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Llegada"
                  value={visit.arrivalAtLabel || formatDate(visit.arrivalAt) || "—"}
                />
                <InfoRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Salida"
                  value={visit.departureAtLabel || formatDate(visit.departureAt) || "—"}
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon={<CalendarDaysIcon className="h-4 w-4" />}
                  label="Días"
                  value={formatDays(visit.recurrence?.daysOfWeek)}
                />
                <InfoRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Horario"
                  value={
                    visit.recurrence
                      ? `${visit.recurrence.dailyArrivalTime} – ${visit.recurrence.dailyDepartureTime}`
                      : "—"
                  }
                />
              </>
            )}
          </Section>

          {/* Registros caseta */}
          {(checkIn || checkOut) && (
            <Section title="Registros caseta">
              {checkIn && (
                <InfoRow
                  icon={<ArrowRightOnRectangleIcon className="h-4 w-4 text-green-600" />}
                  label="Entrada"
                  value={formatDate(checkIn)}
                />
              )}
              {checkOut && (
                <InfoRow
                  icon={<ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-500" />}
                  label="Salida"
                  value={formatDate(checkOut)}
                />
              )}
            </Section>
          )}

          {/* Residente */}
          <Section title="Residente">
            <InfoRow
              icon={<UserIcon className="h-4 w-4" />}
              label="Nombre"
              value={residentFullName(visit.resident)}
            />
            <InfoRow
              icon={<HomeIcon className="h-4 w-4" />}
              label="Depto"
              value={
                [
                  visit.resident?.tower ? `Torre ${visit.resident.tower}` : null,
                  visit.resident?.departmentNumber
                    ? `Depto ${visit.resident.departmentNumber}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
            />
            {visit.resident?.phoneNumber && (
              <InfoRow
                icon={<span className="text-base">📱</span>}
                label="Teléfono"
                value={visit.resident.phoneNumber}
              />
            )}
          </Section>

          {/* ── Sección de acciones manuales ── */}
          {hasActions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                <span>Registrar acceso manual</span>
                <span className="flex-1 border-t border-gray-200" />
              </div>

              <AnimatePresence mode="wait">
                {/* Paso 1: botones de acción */}
                {step === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      disabled={!canCheckIn}
                      onClick={() => handleInitAction("check-in")}
                      className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-green-400 bg-green-50 text-green-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-100 active:scale-95 transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="h-7 w-7" />
                      Registrar entrada
                    </button>
                    <button
                      type="button"
                      disabled={!canCheckOut}
                      onClick={() => handleInitAction("check-out")}
                      className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-red-400 bg-red-50 text-red-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <ArrowLeftOnRectangleIcon className="h-7 w-7" />
                      Registrar salida
                    </button>
                  </motion.div>
                )}

                {/* Paso 2: confirmar con PIN */}
                {(step === "confirm" || step === "submitting" || step === "error") && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-3"
                  >
                    {/* Banner de acción */}
                    <div
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                        actionType === "check-in"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {actionType === "check-in" ? (
                        <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                      )}
                      <span>
                        Confirmando{" "}
                        <strong>
                          {actionType === "check-in" ? "entrada" : "salida"}
                        </strong>{" "}
                        de <strong>{visit.visitorName}</strong>
                      </span>
                    </div>

                    {/* PIN */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Confirma con tu PIN de caseta
                      </p>
                      <div
                        className="flex justify-center gap-2"
                        onPaste={handleActionPinPaste}
                      >
                        {Array.from({ length: 6 }).map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => { actionPinRefs.current[i] = el; }}
                            type="tel"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={1}
                            value={actionPin[i] || ""}
                            onChange={(e) => handleActionPinDigit(i, e.target.value)}
                            onKeyDown={(e) => handleActionPinKeyDown(i, e)}
                            disabled={step === "submitting"}
                            className="w-10 h-12 text-center text-xl font-mono rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 outline-none transition-all disabled:opacity-50"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {step === "error" && actionError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{actionError}</span>
                      </motion.div>
                    )}

                    {/* Botones confirmar/cancelar */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={resetAction}
                        disabled={step === "submitting"}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitAction}
                        disabled={
                          step === "submitting" ||
                          actionPin.replace(/\s/g, "").length < 6
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
                          actionType === "check-in"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {step === "submitting" ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : actionType === "check-in" ? (
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        ) : (
                          <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                        )}
                        {step === "submitting"
                          ? "Registrando…"
                          : actionType === "check-in"
                          ? "Confirmar entrada"
                          : "Confirmar salida"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Paso 3: éxito */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-2 py-4"
                  >
                    <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    <p className="font-semibold text-green-700 text-base">
                      {actionType === "check-in"
                        ? "✅ Entrada registrada"
                        : "✅ Salida registrada"}
                    </p>
                    <p className="text-xs text-gray-500">Actualizando lista…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            Creada:{" "}
            {visit.createdAt ? formatDate(visit.createdAt, false) : "—"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
      {title}
    </h3>
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">{children}</div>
  </div>
);

export default CasetaDashboard;
