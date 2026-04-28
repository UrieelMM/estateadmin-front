import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  PhoneIcon,
  TruckIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import LoadingApp from "../../components/shared/loaders/LoadingApp";

const API_BASE = (
  import.meta.env.VITE_URL_SERVER ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

const DAY_NAMES_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDaysOfWeek(days?: number[]): string {
  if (!days || days.length === 0) return "—";
  const set = [...days].sort().join(",");
  if (set === "0,1,2,3,4,5,6") return "Todos los días";
  if (set === "1,2,3,4,5") return "Lun – Vie";
  if (set === "1,2,3,4,5,6") return "Lun – Sáb";
  if (set === "0,6") return "Fines de semana";
  return [...days]
    .sort()
    .map((d) => DAY_NAMES_ES[d])
    .join(" · ");
}

type ActionType = "check-in" | "check-out" | null;
type VisitStatus = "active" | "used" | "completed" | "expired" | "cancelled";

interface VisitPayload {
  id: string;
  visitType: "single" | "recurring";
  visitorName: string;
  visitorVehicle?: { plates?: string; description?: string } | null;

  // Programadas
  scheduledArrival?: string;
  scheduledDeparture?: string;
  scheduledArrivalAt?: any;
  scheduledDepartureAt?: any;

  // Reales (caseta)
  checkInAt?: any;
  checkOutAt?: any;

  // Booleans para UI
  needsCheckIn?: boolean;
  needsCheckOut?: boolean;
  isComplete?: boolean;

  recurrence?: {
    daysOfWeek: number[];
    dailyArrivalTime: string;
    dailyDepartureTime: string;
    startDate: any;
    endDate: any;
  } | null;

  status: VisitStatus;
  resident?: {
    userId: string;
    email?: string;
    departmentNumber?: string;
    tower?: string | null;
    phoneNumber?: string;
    name?: string | null;
    lastName?: string | null;
  };
  condominiumName?: string;
}

interface ValidateResponse {
  valid: boolean;
  reason?: string;
  action?: ActionType;
  requiresPin?: boolean;
  visit?: VisitPayload;
}

const formatTimestampLike = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?._seconds === "number") {
    return new Date(value._seconds * 1000).toLocaleString("es-MX");
  }
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleString("es-MX");
  }
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("es-MX");
  } catch (_e) {}
  return null;
};

const ScheduledVisitPublic = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const clientId = searchParams.get("clientId") || "";
  const condominiumId = searchParams.get("condominiumId") || "";

  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [visit, setVisit] = useState<VisitPayload | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<ActionType>(null);
  const [requiresPin, setRequiresPin] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<"check-in" | "check-out" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  // Refs por dígito para mover focus automático
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const seoHead = (
    <Helmet>
      <title>Validación de visita | EstateAdmin</title>
      <meta
        name="description"
        content="Validación de QR de visita en caseta."
      />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  const validateQR = async () => {
    setLoading(true);
    setValidationError(null);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (!qrId) throw new Error("ID de QR no válido");
      if (!token) throw new Error("Token de acceso faltante en el enlace");
      if (!API_BASE) throw new Error("URL del backend no configurada");

      const params = new URLSearchParams({ token });
      if (clientId) params.set("clientId", clientId);
      if (condominiumId) params.set("condominiumId", condominiumId);

      const url = `${API_BASE}/scheduled-visits-qr/${encodeURIComponent(
        qrId,
      )}?${params.toString()}`;
      const response = await fetch(url, { method: "GET" });
      const payload = (await response.json().catch(() => ({}))) as
        | ValidateResponse
        | Record<string, any>;

      if (!response.ok || (payload as ValidateResponse).valid === false) {
        const reason =
          (payload as any)?.reason ||
          (payload as any)?.message ||
          `Error ${response.status}`;
        throw new Error(reason);
      }

      const v = (payload as ValidateResponse).visit;
      if (!v) throw new Error("Respuesta del servidor incompleta");
      setVisit(v);
      setSuggestedAction((payload as ValidateResponse).action ?? null);
      setRequiresPin(!!(payload as ValidateResponse).requiresPin);
    } catch (err: any) {
      console.error("Error validating QR:", err);
      setValidationError(err?.message || "Error al validar el QR");
      setVisit(null);
      setSuggestedAction(null);
      setRequiresPin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrId, token, clientId, condominiumId]);

  const handlePinDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1); // último char numérico
    const arr = pin.padEnd(6, " ").split("");
    arr[index] = digit || " ";
    const next = arr.join("").trimEnd();
    setPin(next);
    if (digit && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
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
      const focusIdx = Math.min(pasted.length, 5);
      pinRefs.current[focusIdx]?.focus();
    }
  };

  const submitRegister = async (type: "check-in" | "check-out") => {
    if (!qrId) return;
    if (requiresPin && pin.length !== 6) {
      setActionError("Ingresa los 6 dígitos del PIN.");
      return;
    }

    setSubmitting(type);
    setActionError(null);
    setActionSuccess(null);

    try {
      const body: Record<string, string> = { token, type };
      if (clientId) body.clientId = clientId;
      if (condominiumId) body.condominiumId = condominiumId;
      if (requiresPin) body.pin = pin;

      const response = await fetch(
        `${API_BASE}/scheduled-visits-qr/${encodeURIComponent(qrId)}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok === false) {
        const reason =
          payload?.reason ||
          payload?.message ||
          `Error ${response.status}`;
        throw new Error(reason);
      }

      setActionSuccess(
        type === "check-in"
          ? "✅ Entrada registrada exitosamente"
          : "✅ Salida registrada exitosamente",
      );
      setPin("");
      // Re-validar para refrescar estado y siguiente acción sugerida
      await validateQR();
    } catch (err: any) {
      console.error("Error registering:", err);
      setActionError(err?.message || "Error al registrar");
    } finally {
      setSubmitting(null);
    }
  };

  const residentName = useMemo(() => {
    if (!visit?.resident) return "—";
    const full = [visit.resident.name, visit.resident.lastName]
      .filter(Boolean)
      .join(" ");
    return full || visit.resident.email || "—";
  }, [visit]);

  if (loading) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <LoadingApp />
        </div>
      </>
    );
  }

  if (validationError && !visit) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
          >
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              QR no válido
            </h1>
            <p className="text-gray-600 mb-6">{validationError}</p>
            <button
              onClick={validateQR}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reintentar
            </button>
            <p className="text-xs text-gray-500 mt-6">
              Si el problema persiste, contacte a la administración.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  if (!visit) return null;

  const isSingle = visit.visitType === "single";
  const checkInValue = visit.checkInAt ?? null;
  const checkOutValue = visit.checkOutAt ?? null;

  // Decisiones de UI: si el backend mandó booleans, los usamos.
  // Si no, fallback a inferencia desde checkInAt/checkOutAt.
  const canCheckIn =
    typeof visit.needsCheckIn === "boolean"
      ? visit.needsCheckIn
      : visit.status === "active" && (!isSingle || !checkInValue);

  const canCheckOut =
    typeof visit.needsCheckOut === "boolean"
      ? visit.needsCheckOut
      : (visit.status === "used" || visit.status === "active") &&
        (!isSingle || (!!checkInValue && !checkOutValue));

  const noActionsAvailable = !canCheckIn && !canCheckOut;

  return (
    <>
      {seoHead}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start sm:items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 text-center">
            <div className="bg-white/15 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold">Validación de visita</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {visit.condominiumName || "Caseta de acceso"}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Estado */}
            <div className="flex items-center justify-center">
              <StatusBadge status={visit.status} />
            </div>

            {/* Acción sugerida */}
            {suggestedAction && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                <p className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">
                  Siguiente acción
                </p>
                <p className="text-sm text-indigo-900 font-medium">
                  {suggestedAction === "check-in"
                    ? "Registrar entrada"
                    : "Registrar salida"}
                </p>
              </div>
            )}

            {/* Mensajes */}
            {actionSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center"
              >
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm font-medium">
                  {actionSuccess}
                </p>
              </motion.div>
            )}
            {actionError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center"
              >
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">{actionError}</p>
              </motion.div>
            )}

            {/* Visitante */}
            <Section title="Visitante">
              <Row
                icon={<UserIcon className="h-4 w-4" />}
                label="Nombre"
                value={visit.visitorName || "—"}
              />
              {visit.visitorVehicle &&
                (visit.visitorVehicle.plates ||
                  visit.visitorVehicle.description) && (
                  <Row
                    icon={<TruckIcon className="h-4 w-4" />}
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
            <Section title="Programado">
              {isSingle ? (
                <>
                  <Row
                    icon={<ClockIcon className="h-4 w-4" />}
                    label="Llegada"
                    value={
                      visit.scheduledArrival ||
                      formatTimestampLike(visit.scheduledArrivalAt) ||
                      "—"
                    }
                  />
                  <Row
                    icon={<ClockIcon className="h-4 w-4" />}
                    label="Salida"
                    value={
                      visit.scheduledDeparture ||
                      formatTimestampLike(visit.scheduledDepartureAt) ||
                      "—"
                    }
                  />
                </>
              ) : (
                <>
                  <Row
                    icon={<ClockIcon className="h-4 w-4" />}
                    label="Días"
                    value={formatDaysOfWeek(visit.recurrence?.daysOfWeek)}
                  />
                  <Row
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

            {/* Real (caseta) */}
            {(checkInValue || checkOutValue) && (
              <Section title="Registros (caseta)">
                {checkInValue && (
                  <Row
                    icon={
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-green-600" />
                    }
                    label="Entrada"
                    value={formatTimestampLike(checkInValue) || "—"}
                  />
                )}
                {checkOutValue && (
                  <Row
                    icon={
                      <ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                    }
                    label="Salida"
                    value={formatTimestampLike(checkOutValue) || "—"}
                  />
                )}
              </Section>
            )}

            {/* Residente */}
            <Section title="Residente">
              <Row
                icon={<UserIcon className="h-4 w-4" />}
                label="Nombre"
                value={residentName}
              />
              <Row
                icon={<HomeIcon className="h-4 w-4" />}
                label="Departamento"
                value={
                  [
                    visit.resident?.tower
                      ? `Torre ${visit.resident.tower}`
                      : null,
                    visit.resident?.departmentNumber
                      ? `Depto ${visit.resident.departmentNumber}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              {visit.resident?.phoneNumber && (
                <Row
                  icon={<PhoneIcon className="h-4 w-4" />}
                  label="Teléfono"
                  value={visit.resident.phoneNumber}
                />
              )}
            </Section>

            {/* PIN — solo si el condo lo requiere y hay una acción posible */}
            {requiresPin && !noActionsAvailable && (
              <Section title="PIN de caseta">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Ingresa el PIN de 6 dígitos del condominio</span>
                </div>
                <div
                  className="flex justify-center gap-2"
                  onPaste={handlePinPaste}
                >
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
                      onChange={(e) =>
                        handlePinDigitChange(i, e.target.value)
                      }
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className="w-10 h-12 text-center text-xl font-mono rounded-md border-0 bg-white ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-gray-900"
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Acciones */}
            {!noActionsAvailable ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canCheckIn || submitting !== null}
                  onClick={() => submitRegister("check-in")}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-100 transition-colors"
                >
                  {submitting === "check-in" ? (
                    <ArrowPathIcon className="h-6 w-6 animate-spin mb-1" />
                  ) : (
                    <ArrowRightOnRectangleIcon className="h-6 w-6 mb-1" />
                  )}
                  Registrar entrada
                </button>
                <button
                  type="button"
                  disabled={!canCheckOut || submitting !== null}
                  onClick={() => submitRegister("check-out")}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-red-500 bg-red-50 text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100 transition-colors"
                >
                  {submitting === "check-out" ? (
                    <ArrowPathIcon className="h-6 w-6 animate-spin mb-1" />
                  ) : (
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mb-1" />
                  )}
                  Registrar salida
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  {visit.isComplete
                    ? "Esta visita ya completó entrada y salida."
                    : `Esta visita ya no admite registros (${statusLabelEs(
                        visit.status,
                      )}).`}
                </p>
              </div>
            )}

            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Estate Admin · {new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

const StatusBadge = ({ status }: { status: VisitStatus }) => {
  const colorMap: Record<VisitStatus, string> = {
    active: "bg-green-100 text-green-700 ring-green-200",
    used: "bg-blue-100 text-blue-700 ring-blue-200",
    completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    expired: "bg-gray-100 text-gray-700 ring-gray-200",
    cancelled: "bg-red-100 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${colorMap[status]}`}
    >
      {statusLabelEs(status)}
    </span>
  );
};

const statusLabelEs = (status: VisitStatus): string => {
  switch (status) {
    case "active":
      return "Activa";
    case "used":
      return "En curso";
    case "completed":
      return "Completada";
    case "expired":
      return "Expirada";
    case "cancelled":
      return "Cancelada";
  }
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section>
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
      {title}
    </h3>
    <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm">
      {children}
    </div>
  </section>
);

const Row = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div className="flex-1 grid grid-cols-3 gap-2">
      <span className="col-span-1 text-gray-500">{label}</span>
      <span className="col-span-2 text-gray-900 break-words">{value}</span>
    </div>
  </div>
);

export default ScheduledVisitPublic;
