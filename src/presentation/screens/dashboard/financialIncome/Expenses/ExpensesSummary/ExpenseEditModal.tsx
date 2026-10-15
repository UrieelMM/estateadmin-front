import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { ExpenseRecord } from "../../../../../../store/expenseSummaryStore";
import useExpenseEditStore from "../../../../../../store/useExpenseEditStore";
import type { ExpenseEditCommitResponse } from "../../../../../../services/expenseEditService";
import { useFileCompression } from "../../../../../../hooks/useFileCompression";

const EDIT_REASON_OPTIONS = [
  "Monto capturado incorrectamente",
  "Ajuste al monto de la factura final",
  "Corrección de la descripción",
  "Comprobante faltante o incorrecto",
  "Otro",
];

const MAX_AMOUNT = 10000000;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toCents = (value: number) => Math.round(value * 100);

const parseAmount = (raw: string): number | null => {
  const normalized = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

interface ExpenseEditModalProps {
  expense: ExpenseRecord;
  accountName: string;
  onClose: () => void;
  onEdited: (result: ExpenseEditCommitResponse) => void | Promise<void>;
  onRequestReversal: () => void;
}

const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  expense,
  accountName,
  onClose,
  onEdited,
  onRequestReversal,
}) => {
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const { compressFile, isCompressing } = useFileCompression();
  const {
    eligibility,
    eligibilityLoading,
    commitLoading,
    error,
    loadExpenseEditEligibility,
    commitExpenseEdit,
    reset,
  } = useExpenseEditStore((state) => ({
    eligibility: state.eligibility,
    eligibilityLoading: state.eligibilityLoading,
    commitLoading: state.commitLoading,
    error: state.error,
    loadExpenseEditEligibility: state.loadExpenseEditEligibility,
    commitExpenseEdit: state.commitExpenseEdit,
    reset: state.reset,
  }));

  useEffect(() => {
    reset();
    loadExpenseEditEligibility(expense.id).catch(() => undefined);
    return () => reset();
  }, [expense.id, loadExpenseEditEligibility, reset]);

  const current = eligibility?.expense;
  useEffect(() => {
    if (!current) return;
    setAmountInput(current.amount.toFixed(2));
    setDescription(current.description || "");
  }, [current]);

  const editable = Boolean(eligibility?.editable);
  const amountEditable = Boolean(eligibility?.amountEditable);
  const busy = commitLoading || isCompressing;
  const parsedAmount = parseAmount(amountInput);
  const amountError =
    amountEditable && current
      ? parsedAmount === null
        ? "Ingresa un monto válido con máximo 2 decimales."
        : parsedAmount <= 0
          ? "El monto debe ser mayor a cero."
          : parsedAmount > MAX_AMOUNT
            ? "El monto excede el máximo permitido."
            : null
      : null;

  const changes = useMemo(() => {
    if (!current) return { amount: false, description: false, file: false };
    return {
      amount:
        amountEditable &&
        parsedAmount !== null &&
        toCents(parsedAmount) !== toCents(current.amount),
      description: description.trim() !== (current.description || "").trim(),
      file: Boolean(file),
    };
  }, [current, amountEditable, parsedAmount, description, file]);
  const hasChanges = changes.amount || changes.description || changes.file;
  const notesRequired = reason === "Otro";

  const canSubmit =
    editable &&
    hasChanges &&
    !amountError &&
    reason.trim().length > 0 &&
    (!notesRequired || notes.trim().length > 0) &&
    !eligibilityLoading &&
    !busy;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      toast.error("El comprobante debe ser PDF, JPG o PNG.");
      return;
    }
    let processed = selected;
    try {
      processed = await compressFile(selected);
    } catch {
      processed = selected;
    }
    if (processed.size > MAX_FILE_BYTES) {
      toast.error("El comprobante no puede pesar más de 10 MB.");
      return;
    }
    setFile(processed);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !current) return;
    let result: ExpenseEditCommitResponse;
    try {
      result = await commitExpenseEdit({
        expenseId: expense.id,
        expectedAmount: current.amount,
        amount: changes.amount && parsedAmount !== null ? parsedAmount : undefined,
        description: changes.description ? description.trim() : undefined,
        file: changes.file ? file : null,
        reason,
        notes,
      });
    } catch (commitError) {
      toast.error(
        commitError instanceof Error ? commitError.message : "No se pudo editar el egreso."
      );
      return;
    }
    toast.success(`Egreso ${result.expenseFolio || expense.folio} actualizado.`);
    await onEdited(result);
  };

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-800/60";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200";
  const invoiceUrl = current?.invoiceUrl || expense.invoiceUrl || "";

  return createPortal(
    <div className="fixed inset-0 z-[1300] bg-gray-900/60" onClick={handleClose}>
      <div className="flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div
          className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar egreso
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Los cambios quedan registrados en la bitácora con el motivo y el
                administrador que los realizó.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={handleClose}
              disabled={busy}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Para evitar inconsistencias solo puedes editar el monto y la
                  descripción. Si necesitas cambiar fecha, cuenta o concepto,
                  revierte el egreso y captúralo de nuevo.
                </p>
                <button
                  type="button"
                  onClick={onRequestReversal}
                  disabled={busy}
                  className="mt-2 inline-flex items-center rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/40"
                >
                  <ArrowUturnLeftIcon className="mr-1.5 h-4 w-4" />
                  Revertir en su lugar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            {[
              ["Folio", expense.folio || "N/A"],
              ["Concepto", current?.concept || expense.concept || "N/A"],
              [
                "Fecha del egreso",
                expense.expenseDate ? dayjs(expense.expenseDate).format("DD/MM/YYYY") : "N/A",
              ],
              ["Cuenta financiera", accountName || "N/A"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{label} (no editable)</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>

          {eligibilityLoading && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Consultando el estado actual del egreso...
            </p>
          )}
          {eligibility?.lockReason && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {eligibility.lockReason}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="expense-edit-amount">
                Monto
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                  $
                </span>
                <input
                  id="expense-edit-amount"
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={!amountEditable || busy}
                  className={`${inputClass} pl-7`}
                />
              </div>
              {current && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Monto actual: {formatCurrency(current.amount)}
                  {changes.amount && parsedAmount !== null
                    ? ` → nuevo: ${formatCurrency(parsedAmount)}`
                    : ""}
                </p>
              )}
              {amountError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{amountError}</p>
              )}
            </div>

            <div>
              <span className={labelClass}>Comprobante</span>
              <div className="flex flex-wrap items-center gap-2">
                {invoiceUrl && (
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    Ver actual
                  </a>
                )}
                <label
                  className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200 ${
                    !editable || busy
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <PaperClipIcon className="mr-1 h-4 w-4" />
                  {invoiceUrl ? "Reemplazar" : "Adjuntar"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={!editable || busy}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {isCompressing && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Procesando archivo...
                </p>
              )}
              {file && (
                <p className="mt-1 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={busy}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Quitar
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClass} htmlFor="expense-edit-description">
              Descripción
            </label>
            <textarea
              id="expense-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={!editable || busy}
              className={inputClass}
            />
          </div>

          <div className="mt-3">
            <label className={labelClass} htmlFor="expense-edit-reason">
              Motivo de la edición <span className="text-red-500">*</span>
            </label>
            <select
              id="expense-edit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              disabled={!editable || busy}
            >
              <option value="">Selecciona un motivo</option>
              {EDIT_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className={labelClass} htmlFor="expense-edit-notes">
              Notas {notesRequired ? <span className="text-red-500">*</span> : "(opcional)"}
            </label>
            <textarea
              id="expense-edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              disabled={!editable || busy}
              placeholder="Explica brevemente por qué se corrige el egreso."
              className={inputClass}
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {commitLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpenseEditModal;
