import React, { useEffect, useMemo, useState } from "react";
import {
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  HashtagIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useChargeStore } from "../../../../../store/useChargeStore";
import useUserStore from "../../../../../store/UserDataStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { toast } from "react-hot-toast";
import { commonConcepts } from "../../../../../utils/commonConcepts";

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const inputBase =
  "block w-full rounded-lg border-0 bg-white py-2.5 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-400";

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  description,
  icon,
  children,
}: SectionCardProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <header className="flex items-start gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </header>
    <div className="space-y-4 px-4 py-4">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

const Field = ({ label, htmlFor, hint, children }: FieldProps) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
    >
      {label}
    </label>
    <div className="mt-1.5">{children}</div>
    {hint && (
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    )}
  </div>
);

interface ChargeTypeCardProps {
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ChargeTypeCard = ({
  active,
  title,
  description,
  icon,
  onClick,
}: ChargeTypeCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
      active
        ? "border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-500/10 dark:ring-indigo-500/40"
        : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10",
    )}
  >
    <span
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition",
        active
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      )}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          "text-sm font-semibold leading-tight",
          active
            ? "text-indigo-900 dark:text-indigo-100"
            : "text-gray-900 dark:text-gray-100",
        )}
      >
        {title}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
    {active && (
      <CheckCircleIcon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
    )}
  </button>
);

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startAt = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dueDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;

  return { startAt, dueDate };
};

const ChargeForm = () => {
  const { createChargeForOne, createChargeForAll, loading, error } =
    useChargeStore();
  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers,
  );
  const fetchSummary = usePaymentSummaryStore((state) => state.fetchSummary);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  const [chargeType, setChargeType] = useState<"individual" | "all">(
    "individual",
  );
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [concept, setConcept] = useState<string>("Cuota de mantenimiento");
  const [amount, setAmount] = useState<number>(0);
  const [amountDisplay, setAmountDisplay] = useState<string>("");

  const [_generatedAt] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });
  const [startAt, setStartAt] = useState<string>(
    () => getCurrentMonthDateRange().startAt,
  );
  const [dueDate, setDueDate] = useState<string>(
    () => getCurrentMonthDateRange().dueDate,
  );
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  const chargeableUsers = useMemo(
    () =>
      condominiumsUsers.filter(
        (user) =>
          user.role !== "admin" &&
          user.role !== "super-admin" &&
          user.role !== "security",
      ),
    [condominiumsUsers],
  );

  const selectedUserLabel = useMemo(() => {
    const user = chargeableUsers.find((u) => u.uid === selectedUser);
    if (!user) return "";
    return `${user.number || "-"} ${user.name || ""}`.trim();
  }, [chargeableUsers, selectedUser]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "—";
    const parsed = new Date(`${dateString}T12:00:00`);
    if (isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const validateForm = (): boolean => {
    if (chargeType === "individual" && !selectedUser) {
      toast.error("Debe seleccionar un usuario");
      return false;
    }

    if (!concept) {
      toast.error("El concepto es obligatorio");
      return false;
    }

    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }

    if (!startAt) {
      toast.error("La fecha de inicio es obligatoria");
      return false;
    }

    if (!dueDate) {
      toast.error("La fecha límite es obligatoria");
      return false;
    }

    if (startAt && dueDate && new Date(startAt) > new Date(dueDate)) {
      toast.error("La fecha límite debe ser posterior a la fecha de inicio");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formatDateTime = (dateString: string, isDueDate: boolean): string => {
      return `${dateString} ${isDueDate ? "23:59" : "00:00"}`;
    };

    const formattedStartAt = formatDateTime(startAt, false);
    const formattedDueDate = formatDateTime(dueDate, true);

    const options = {
      concept,
      amount,
      startAt: formattedStartAt,
      dueDate: formattedDueDate,
      paid,
    };

    try {
      if (chargeType === "individual") {
        await createChargeForOne(selectedUser, options);
        toast.success("Cargo creado para el usuario seleccionado");
      } else {
        await createChargeForAll(options);
        toast.success("Cargo creado para todos los usuarios");
      }

      await fetchSummary();

      const currentMonthRange = getCurrentMonthDateRange();
      setConcept("Cuota de mantenimiento");
      setAmount(0);
      setAmountDisplay("");
      setStartAt(currentMonthRange.startAt);
      setDueDate(currentMonthRange.dueDate);
      setPaid(false);
      setSelectedUser("");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el cargo");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const num = parseFloat(rawValue.replace(/[^0-9.]/g, "")) || 0;
    setAmount(num);
    setAmountDisplay(rawValue);
  };

  const summaryScopeLabel =
    chargeType === "individual"
      ? selectedUserLabel || "Sin condómino"
      : `Todos los condóminos (${chargeableUsers.length})`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-800 dark:bg-gray-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-5 sm:px-6 dark:from-indigo-700 dark:via-indigo-800 dark:to-violet-900">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight text-white">
              Asignar cargo
            </h2>
            <p className="mt-0.5 text-xs text-indigo-100">
              Crea un cargo de mantenimiento para un condómino o para todo el
              condominio.
            </p>
          </div>
        </div>
      </div>

      {error && toast.error(error)}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <SectionCard
            title="Alcance del cargo"
            description="Define si el cargo aplica a una unidad o a todos los condóminos."
            icon={<UserGroupIcon className="h-4 w-4" />}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <ChargeTypeCard
                active={chargeType === "individual"}
                title="Individual"
                description="Un solo condómino recibe este cargo."
                icon={<UserIcon className="h-4 w-4" />}
                onClick={() => setChargeType("individual")}
              />
              <ChargeTypeCard
                active={chargeType === "all"}
                title="Todos los condóminos"
                description={`Se aplicará a ${chargeableUsers.length} unidades.`}
                icon={<UserGroupIcon className="h-4 w-4" />}
                onClick={() => setChargeType("all")}
              />
            </div>

            {chargeType === "individual" && (
              <Field
                label="Condómino"
                htmlFor="selectedUser"
                hint="Selecciona la unidad que recibirá el cargo."
              >
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="selectedUser"
                    className={`${inputBase} cursor-pointer appearance-none pl-9 pr-10`}
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Selecciona un condómino</option>
                    {chargeableUsers.map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.number} {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUserLabel && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                    <HashtagIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Cargo para:{" "}
                      <strong className="font-semibold">
                        {selectedUserLabel}
                      </strong>
                    </span>
                  </div>
                )}
              </Field>
            )}

            {chargeType === "all" && (
              <p className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-3 text-xs leading-relaxed text-indigo-800 dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
                Este cargo se generará para{" "}
                <strong className="font-semibold">
                  {chargeableUsers.length} condóminos
                </strong>{" "}
                activos en el condominio actual.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Detalle del cargo"
            description="Concepto y monto a cobrar."
            icon={<CurrencyDollarIcon className="h-4 w-4" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Concepto" htmlFor="concept">
                <div className="relative">
                  <ClipboardIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="concept"
                    className={`${inputBase} cursor-pointer appearance-none pl-9 pr-10`}
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                  >
                    {commonConcepts.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Monto" htmlFor="amount">
                <div className="relative">
                  <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="amount"
                    type="text"
                    className={`${inputBase} pl-9`}
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    onFocus={() => setAmountDisplay(amount.toString())}
                    onBlur={() => {
                      if (amount > 0) {
                        setAmountDisplay(formatCurrency(amount));
                      } else {
                        setAmountDisplay("");
                      }
                    }}
                    placeholder="$0.00"
                    min="0"
                  />
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Vigencia y estado"
            description="Periodo del cargo y si ya se considera pagado."
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Fecha de inicio"
                htmlFor="startAt"
                hint="Primer día en que aplica el cargo."
              >
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="startAt"
                    type="date"
                    className={`${inputBase} cursor-pointer pl-9`}
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
              </Field>

              <Field
                label="Fecha límite de pago"
                htmlFor="dueDate"
                hint="Último día para liquidar sin recargos."
              >
                <div className="relative">
                  <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="dueDate"
                    type="date"
                    className={`${inputBase} cursor-pointer pl-9`}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Estado de pago">
              <button
                type="button"
                onClick={() => setPaid((prev) => !prev)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                  paid
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/20"
                    : "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-900/20",
                )}
              >
                <div className="flex items-center gap-2.5">
                  {paid ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        paid
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-amber-800 dark:text-amber-200",
                      )}
                    >
                      {paid ? "Marcado como pagado" : "Pendiente de pago"}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {paid
                        ? "El cargo se registrará ya cubierto."
                        : "El condómino deberá liquidarlo después."}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition",
                    paid ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      paid && "translate-x-5",
                    )}
                  />
                </div>
              </button>
            </Field>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="min-w-0">
            {amount > 0 || concept ? (
              <>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {summaryScopeLabel}
                  {amount > 0 && (
                    <>
                      <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                        ·
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(amount)}
                      </span>
                    </>
                  )}
                  {concept && (
                    <>
                      <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                        ·
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {concept}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  {formatShortDate(startAt)} → {formatShortDate(dueDate)}
                  <span className="mx-1.5">·</span>
                  {paid ? "Pagado" : "Pendiente"}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Completa el formulario para revisar el resumen del cargo.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Guardar cargo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChargeForm;
