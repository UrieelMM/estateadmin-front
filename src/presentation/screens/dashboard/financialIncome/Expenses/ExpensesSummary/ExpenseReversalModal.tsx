import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { ExpenseRecord } from "../../../../../../store/expenseSummaryStore";
import useExpenseReversalStore from "../../../../../../store/useExpenseReversalStore";

const REVERSAL_REASON_OPTIONS = [
  "Monto de egreso incorrecto",
  "Fecha de egreso incorrecta",
  "Concepto o proveedor incorrecto",
  "Cuenta financiera incorrecta",
  "Registro duplicado",
  "Otro",
];

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface ExpenseReversalModalProps {
  expense: ExpenseRecord;
  accountName: string;
  onClose: () => void;
  onReversed: () => void | Promise<void>;
}

const ExpenseReversalModal: React.FC<ExpenseReversalModalProps> = ({
  expense,
  accountName,
  onClose,
  onReversed,
}) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const {
    preview,
    previewLoading,
    commitLoading,
    error,
    previewExpenseReversal,
    commitExpenseReversal,
    reset,
  } = useExpenseReversalStore((state) => ({
    preview: state.preview,
    previewLoading: state.previewLoading,
    commitLoading: state.commitLoading,
    error: state.error,
    previewExpenseReversal: state.previewExpenseReversal,
    commitExpenseReversal: state.commitExpenseReversal,
    reset: state.reset,
  }));

  useEffect(() => {
    reset();
    previewExpenseReversal(expense.id).catch(() => undefined);
    return () => reset();
  }, [expense.id, previewExpenseReversal, reset]);

  const handleClose = () => {
    if (commitLoading) return;
    onClose();
  };

  const canSubmit =
    Boolean(preview?.operationId) &&
    reason.trim().length > 0 &&
    confirmText.trim().toUpperCase() === "REVERTIR" &&
    !previewLoading &&
    !commitLoading;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      const result = await commitExpenseReversal({
        expenseId: expense.id,
        reason,
        notes,
      });
      toast.success(
        `Egreso ${result.expenseFolio || expense.folio} revertido. Ya puedes registrarlo de nuevo con los datos correctos.`
      );
    } catch (commitError) {
      toast.error(
        commitError instanceof Error ? commitError.message : "No se pudo revertir el egreso."
      );
      return;
    }
    await onReversed();
  };

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

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
                Revertir egreso
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                El egreso se cancela y deja de contar en reportes y saldos. Queda
                archivado y auditado. Después puedes registrarlo de nuevo con los
                datos correctos.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={handleClose}
              disabled={commitLoading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            {[
              ["Folio", expense.folio || "N/A"],
              ["Monto", formatCurrency(expense.amount)],
              ["Concepto", expense.concept || "N/A"],
              [
                "Fecha del egreso",
                expense.expenseDate
                  ? dayjs(expense.expenseDate).format("DD/MM/YYYY")
                  : "N/A",
              ],
              ["Cuenta financiera", accountName || "N/A"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-700 dark:bg-indigo-900/20">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              Validación previa
            </p>
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200">
              {previewLoading
                ? "Validando que el egreso pueda revertirse..."
                : preview?.operationId
                  ? `Listo para confirmar. Operación: ${preview.operationId}`
                  : "No se puede revertir este egreso."}
            </p>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Motivo de la reversa <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              disabled={commitLoading}
            >
              <option value="">Selecciona un motivo</option>
              {REVERSAL_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={commitLoading}
              placeholder="Explica brevemente qué estaba mal en el registro."
              className={inputClass}
            />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Confirmación de seguridad
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={commitLoading}
              placeholder='Escribe "REVERTIR" para confirmar'
              className={inputClass}
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={commitLoading}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {commitLoading ? "Revirtiendo..." : "Confirmar reversa"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpenseReversalModal;
