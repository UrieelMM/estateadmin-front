import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, InformationCircleIcon } from "@heroicons/react/20/solid";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { formatCentsToMXN, formatCurrency } from "../../../../utils/curreyncy";
import {
  OpeningCredit,
  openingCreditError,
  openingCreditService,
} from "../../../../services/openingCreditService";
import RecipientCombobox, { RecipientSortOrder } from "./RecipientCombobox";

const CANCEL_REASON_OPTIONS = [
  "Monto capturado incorrecto",
  "Departamento incorrecto",
  "Registro duplicado",
  "Otro",
];

const NON_UNIT_ROLES = new Set([
  "admin",
  "admin-assistant",
  "super-admin",
  "super-provider-admin",
  "security",
  "maintenance",
]);

const inputBase =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-400";

const labelBase =
  "block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400";

const userIdOf = (user: UserData) => (user as UserData & { id?: string }).id || user.uid || "";

const unitLabel = (user: { number?: string; tower?: string }) =>
  [user.tower ? `Torre ${String(user.tower).replace(/^torre\s*/i, "")}` : "", user.number || ""]
    .filter(Boolean)
    .join(" · ");

const Section = ({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <header className="flex items-start gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </header>
    <div className="space-y-4 px-4 py-4">{children}</div>
  </section>
);

interface OpeningCreditPanelProps {
  users: UserData[];
  sortOrder: RecipientSortOrder;
  onSortOrderChange: (value: RecipientSortOrder) => void;
  onClose: () => void;
}

const OpeningCreditPanel = ({
  users,
  sortOrder,
  onSortOrderChange,
  onClose,
}: OpeningCreditPanelProps) => {
  const [credits, setCredits] = useState<OpeningCredit[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadCredits = useCallback(async () => {
    setLoadingList(true);
    try {
      setCredits(await openingCreditService.list());
    } catch (error) {
      toast.error(openingCreditError(error));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadCredits();
  }, [loadCredits]);

  const activeCreditUserIds = useMemo(
    () => new Set(credits.filter((item) => item.status === "active").map((item) => item.userId)),
    [credits]
  );

  const unitUsers = useMemo(
    () => users.filter((user) => !NON_UNIT_ROLES.has(String(user.role || ""))),
    [users]
  );

  const selectedUser = unitUsers.find((user) => userIdOf(user) === userId);
  const parsedAmount = Number.parseFloat(amount.replace(/[$,\s]/g, ""));
  const canSave =
    !!userId &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !activeCreditUserIds.has(userId) &&
    !saving;

  const updateUserCredit = (targetUserId: string, totalCreditBalanceCents: number) => {
    useUserStore.setState((state) => ({
      condominiumsUsers: state.condominiumsUsers.map((user) =>
        userIdOf(user) === targetUserId
          ? { ...user, totalCreditBalance: totalCreditBalanceCents }
          : user
      ),
    }));
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const created = await openingCreditService.create({
        userId,
        amount: Math.round(parsedAmount * 100) / 100,
        cutoffDate: cutoffDate || undefined,
        notes: notes.trim() || undefined,
      });
      updateUserCredit(userId, created.totalCreditBalanceCents);
      toast.success(
        `Saldo a favor inicial de ${formatCurrency(created.amount)} registrado para ${created.numberCondominium || "el departamento"}.`
      );
      setUserId("");
      setAmount("");
      setCutoffDate("");
      setNotes("");
      await loadCredits();
    } catch (error) {
      toast.error(openingCreditError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (credit: OpeningCredit) => {
    if (!cancelReason) return;
    setCancelling(true);
    try {
      const result = await openingCreditService.cancel(credit.id, cancelReason);
      updateUserCredit(result.userId, result.totalCreditBalanceCents);
      toast.success("Saldo a favor inicial cancelado.");
      setCancelTargetId(null);
      setCancelReason("");
      await loadCredits();
    } catch (error) {
      toast.error(openingCreditError(error));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <div className="flex gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100">
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-indigo-500" />
            <div className="space-y-1">
              <p>
                Usa esta opción para el saldo a favor que el departamento ya tenía al comenzar a
                usar EstateAdmin. <strong>No se registra como un ingreso nuevo</strong> ni modifica
                el saldo de tus cuentas, porque ese dinero ya está incluido en el saldo inicial de
                bancos.
              </p>
              <p>
                El saldo se descuenta de los próximos cargos al registrar un pago identificado con
                la opción <strong>"Usar saldo a favor"</strong>.
              </p>
            </div>
          </div>

          <Section
            title="Departamento"
            description="Cada departamento puede tener un solo saldo a favor inicial activo."
            icon={<BuildingOffice2Icon className="h-4 w-4" />}
          >
            <RecipientCombobox
              users={unitUsers}
              value={userId}
              onChange={setUserId}
              sortOrder={sortOrder}
              onSortOrderChange={onSortOrderChange}
              getUserId={userIdOf}
              getDisabledReason={(user) =>
                activeCreditUserIds.has(userIdOf(user)) ? "(ya registrado)" : null
              }
            />
            {selectedUser && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Saldo a favor actual:{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCentsToMXN(Number(selectedUser.totalCreditBalance || 0))}
                </span>
              </p>
            )}
          </Section>

          <Section
            title="Saldo a favor"
            description="Monto según el estado de cuenta con el que iniciaste."
            icon={<WalletIcon className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="openingCreditAmount" className={labelBase}>
                  Monto <span className="text-rose-500">*</span>
                </label>
                <input
                  id="openingCreditAmount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$0.00"
                  className={`mt-1.5 ${inputBase}`}
                />
              </div>
              <div>
                <label htmlFor="openingCreditCutoff" className={labelBase}>
                  Fecha de corte{" "}
                  <span className="text-[10px] font-normal normal-case tracking-normal text-gray-400">
                    (opcional)
                  </span>
                </label>
                <input
                  id="openingCreditCutoff"
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className={`mt-1.5 ${inputBase}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="openingCreditNotes" className={labelBase}>
                Notas{" "}
                <span className="text-[10px] font-normal normal-case tracking-normal text-gray-400">
                  (opcional)
                </span>
              </label>
              <textarea
                id="openingCreditNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ej. Saldo según estado de cuenta de la administración anterior."
                className={`mt-1.5 ${inputBase}`}
              />
            </div>
          </Section>

          <Section
            title="Saldos a favor iniciales registrados"
            description="Solo puedes cancelar un saldo que todavía no se haya usado en pagos."
            icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          >
            {loadingList && credits.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : credits.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aún no hay saldos a favor iniciales registrados.
              </p>
            ) : (
              <ul className="-my-2 divide-y divide-gray-100 dark:divide-gray-800">
                {credits.map((credit) => (
                  <li key={credit.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {unitLabel(credit) || "—"}
                          <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                            {credit.userName}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {credit.cutoffDate
                            ? `Corte ${dayjs(credit.cutoffDate).format("DD/MM/YYYY")} · `
                            : ""}
                          Registrado por {credit.createdByName || "—"}
                          {credit.createdAt
                            ? ` el ${dayjs(credit.createdAt).format("DD/MM/YYYY HH:mm")}`
                            : ""}
                        </p>
                        {credit.notes && (
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            {credit.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(credit.amount)}
                        </span>
                        {credit.status === "active" ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Activo
                          </span>
                        ) : (
                          <span
                            title={credit.cancelReason}
                            className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          >
                            Cancelado
                          </span>
                        )}
                        {credit.status === "active" && cancelTargetId !== credit.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTargetId(credit.id);
                              setCancelReason("");
                            }}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:ring-amber-700 dark:hover:bg-amber-900/20"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    {cancelTargetId === credit.id && (
                      <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                        <p className="text-xs text-amber-900 dark:text-amber-100">
                          Se descontarán {formatCurrency(credit.amount)} del saldo a favor del
                          departamento.
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <select
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            disabled={cancelling}
                            className={`${inputBase} sm:flex-1`}
                          >
                            <option value="">Selecciona un motivo</option>
                            {CANCEL_REASON_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setCancelTargetId(null)}
                            disabled={cancelling}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
                          >
                            Volver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(credit)}
                            disabled={!cancelReason || cancelling}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancelling ? "Cancelando..." : "Confirmar cancelación"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="hidden text-[11px] text-gray-500 sm:block dark:text-gray-400">
          No se registra como ingreso ni cambia el saldo de bancos.
        </p>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <button
            type="button"
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? "Guardando…" : "Registrar saldo a favor"}
          </button>
        </div>
      </div>
    </>
  );
};

export default OpeningCreditPanel;
