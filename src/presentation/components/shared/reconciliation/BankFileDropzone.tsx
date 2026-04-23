import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  BankFileDirection,
  ParseResult,
  ParseWarning,
  parseBankFile,
} from "../../../../services/reconciliation/bankFileParser";

type BankFileDropzoneProps = {
  direction: BankFileDirection;
  onConfirm: (parseResult: ParseResult, file: File) => void;
  disabled?: boolean;
  compact?: boolean;
  /**
   * Optional label override shown above the dropzone.
   */
  label?: string;
};

const ACCEPT = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".csv", ".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt", ".csv"],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function renderWarnings(items: ParseWarning[], tone: "warning" | "error") {
  if (!items.length) return null;
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  return (
    <ul className={`rounded-md border ${toneClass} p-3 text-xs space-y-1`}>
      {items.slice(0, 10).map((item, idx) => (
        <li key={`${item.code}-${idx}`} className="flex gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {item.message}
          </span>
        </li>
      ))}
      {items.length > 10 ? (
        <li className="italic text-[11px] pl-6">
          ...y {items.length - 10} aviso(s) más.
        </li>
      ) : null}
    </ul>
  );
}

const BankFileDropzone = ({
  direction,
  onConfirm,
  disabled,
  compact,
  label,
}: BankFileDropzoneProps) => {
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const onDrop = async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo supera los 20 MB permitidos.");
      return;
    }
    setParsing(true);
    try {
      const result = await parseBankFile(file, direction);
      setParseResult(result);
      setPendingFile(file);
      setModalOpen(true);
    } catch (error: any) {
      console.error("Error parsing bank file:", error);
      toast.error(error?.message || "No fue posible leer el archivo.");
    } finally {
      setParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: ACCEPT,
    disabled: disabled || parsing,
  });

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  const previewRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.slice(0, 10);
  }, [parseResult]);

  const confirm = () => {
    if (!parseResult || !pendingFile) return;
    onConfirm(parseResult, pendingFile);
    setModalOpen(false);
    setParseResult(null);
    setPendingFile(null);
  };

  const cancel = () => {
    setModalOpen(false);
    setParseResult(null);
    setPendingFile(null);
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={`w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          compact ? "p-4" : "p-6"
        } ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:bg-indigo-900/10"
        } ${disabled || parsing ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <ArrowUpTrayIcon className="h-8 w-8 text-indigo-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label ||
              (isDragActive
                ? "Suelta el archivo para analizarlo..."
                : "Arrastra aquí un archivo CSV, XLSX o XLS, o haz clic para elegirlo")}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Tamaño máximo 20 MB. Compatible con plantilla estándar y exportaciones bancarias.
          </p>
          {parsing ? (
            <p className="text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
              <span className="animate-pulse">●</span> Analizando archivo...
            </p>
          ) : null}
        </div>
      </div>

      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={cancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <Dialog.Title className="text-base font-semibold flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                        Previsualización del archivo
                      </Dialog.Title>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Revisa que los datos se hayan interpretado correctamente antes de
                        confirmar.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={cancel}
                      aria-label="Cerrar"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {parseResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <StatPill
                          label="Formato"
                          value={parseResult.fileKind.toUpperCase()}
                          icon={<TableCellsIcon className="h-4 w-4" />}
                        />
                        <StatPill
                          label="Filas válidas"
                          value={`${parseResult.stats.validRows}`}
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                        />
                        <StatPill
                          label="Filas omitidas"
                          value={`${parseResult.stats.skippedRows}`}
                          icon={<ExclamationTriangleIcon className="h-4 w-4" />}
                        />
                        <StatPill
                          label={direction === "income" ? "Abonos" : "Cargos"}
                          value={formatCurrency(parseResult.stats.totalAmount)}
                          icon={<DocumentArrowDownIcon className="h-4 w-4" />}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <div className="rounded border border-gray-200 dark:border-gray-700 p-3">
                          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                            Columnas detectadas
                          </p>
                          <ul className="space-y-0.5">
                            <li>Fecha: <MappingValue value={mappingLabel(parseResult, "date")} /></li>
                            <li>Descripción: <MappingValue value={mappingLabel(parseResult, "description")} /></li>
                            <li>Referencia: <MappingValue value={mappingLabel(parseResult, "reference")} /></li>
                            <li>Monto: <MappingValue value={mappingLabel(parseResult, "amount")} /></li>
                            <li>Cargo/Débito: <MappingValue value={mappingLabel(parseResult, "debit")} /></li>
                            <li>Abono/Crédito: <MappingValue value={mappingLabel(parseResult, "credit")} /></li>
                          </ul>
                        </div>
                        <div className="rounded border border-gray-200 dark:border-gray-700 p-3">
                          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                            Rango de fechas
                          </p>
                          <p>Desde: {formatDate(parseResult.stats.dateRange.from)}</p>
                          <p>Hasta: {formatDate(parseResult.stats.dateRange.to)}</p>
                          <p className="mt-2">
                            Delimitador:{" "}
                            <span className="font-mono">
                              {parseResult.delimiter || "auto"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {renderWarnings(parseResult.errors, "error")}
                      {renderWarnings(parseResult.warnings, "warning")}

                      <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="max-h-64 overflow-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                              <tr>
                                <th className="px-2 py-1 text-left font-medium">#</th>
                                <th className="px-2 py-1 text-left font-medium">Fecha</th>
                                <th className="px-2 py-1 text-left font-medium">Descripción</th>
                                <th className="px-2 py-1 text-left font-medium">Referencia</th>
                                <th className="px-2 py-1 text-right font-medium">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewRows.map((row) => (
                                <tr
                                  key={row.id}
                                  className="border-t border-gray-100 dark:border-gray-800"
                                >
                                  <td className="px-2 py-1">{row.rowIndex}</td>
                                  <td className="px-2 py-1">
                                    {row.date
                                      ? row.date.toLocaleDateString("es-MX")
                                      : "—"}
                                  </td>
                                  <td className="px-2 py-1 max-w-[220px] truncate">
                                    {row.description || "—"}
                                  </td>
                                  <td className="px-2 py-1 max-w-[120px] truncate">
                                    {row.reference || "—"}
                                  </td>
                                  <td className="px-2 py-1 text-right font-mono">
                                    {formatCurrency(row.amount)}
                                  </td>
                                </tr>
                              ))}
                              {!previewRows.length ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-3 py-4 text-center text-gray-500"
                                  >
                                    No se detectaron filas válidas.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          Se muestran hasta las primeras 10 filas. En total se importarán{" "}
                          <strong>{parseResult.rows.length}</strong> movimientos.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row-reverse gap-2">
                        <button
                          type="button"
                          onClick={confirm}
                          disabled={!parseResult.rows.length}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Importar {parseResult.rows.length} movimiento
                          {parseResult.rows.length === 1 ? "" : "s"}
                        </button>
                        <button
                          type="button"
                          onClick={cancel}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 p-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

function MappingValue({ value }: { value: string }) {
  if (!value) {
    return <span className="italic text-red-500">no detectada</span>;
  }
  return <span className="font-medium">{value}</span>;
}

function mappingLabel(
  parseResult: ParseResult,
  field: "date" | "description" | "reference" | "amount" | "debit" | "credit"
): string {
  const idx = parseResult.mapping[field];
  if (typeof idx !== "number" || idx < 0) return "";
  return parseResult.headers[idx] || `columna ${idx + 1}`;
}

export default BankFileDropzone;
