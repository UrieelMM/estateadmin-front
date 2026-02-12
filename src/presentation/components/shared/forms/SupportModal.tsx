import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  BugAntIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PaperClipIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useSupportTicketsStore from "../../../../store/useSupportTicketsStore";
import useAuthStore from "../../../../store/AuthStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";
import toast from "react-hot-toast";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TicketType = "bug" | "incident" | "question" | "request";
type TicketPriority = "low" | "medium" | "high";

const ISSUE_TYPE_OPTIONS: {
  value: TicketType;
  label: string;
  help: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "bug",
    label: "Error tecnico",
    help: "Algo no funciona como deberia.",
    icon: BugAntIcon,
  },
  {
    value: "incident",
    label: "Incidente operativo",
    help: "Bloqueo o caida que afecta la operacion.",
    icon: ExclamationTriangleIcon,
  },
  {
    value: "question",
    label: "Duda",
    help: "Necesitas orientacion funcional del sistema.",
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    value: "request",
    label: "Mejora solicitada",
    help: "Propuesta o nueva funcionalidad.",
    icon: LightBulbIcon,
  },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const MODULE_OPTIONS = [
  "Dashboard",
  "Ingresos",
  "Egresos",
  "Caja Chica",
  "Mantenimiento",
  "Proyectos",
  "Inventario",
  "Reportes",
  "Configuracion",
  "Otro",
];

const MAX_IMAGES = 4;
const MAX_FILE_SIZE_MB = 8;

const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<TicketType>("bug");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [moduleName, setModuleName] = useState("Dashboard");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdTicketNumber, setCreatedTicketNumber] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { createTicket } = useSupportTicketsStore();
  const { user } = useAuthStore();
  const { compressFile, isCompressing } = useFileCompression({
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const previews = useMemo(
    () =>
      attachments.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [attachments]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setIssueType("bug");
      setPriority("medium");
      setModuleName("Dashboard");
      setAttachments([]);
      setShowSuccess(false);
      setProgress(0);
      setIsSubmitting(false);
      setCreatedTicketNumber("");
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (showSuccess) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (timer) clearInterval(timer);
            onClose();
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showSuccess, onClose]);

  const addFiles = async (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const imageFiles = Array.from(incomingFiles).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== incomingFiles.length) {
      toast.error("Solo se permiten imagenes.");
    }

    const oversized = imageFiles.find(
      (file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024
    );
    if (oversized) {
      toast.error(`Cada imagen debe pesar maximo ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const compressedFiles = await Promise.all(
      imageFiles.map(async (file) => {
        try {
          return await compressFile(file);
        } catch (_error) {
          return file;
        }
      })
    );

    const combined = [...attachments, ...compressedFiles];
    if (combined.length > MAX_IMAGES) {
      toast.error(`Puedes adjuntar hasta ${MAX_IMAGES} imagenes.`);
      return;
    }

    setAttachments(combined);
  };

  const removeAttachmentAt = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Completa titulo y descripcion.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createTicket({
        title: title.trim(),
        description: description.trim(),
        issueType,
        priority,
        module: moduleName,
        attachments,
        currentPath: window.location.pathname,
      });
      setCreatedTicketNumber(result.ticketNumber);
      setShowSuccess(true);
    } catch (_error) {
      toast.error("No se pudo enviar el ticket de soporte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-4 text-white dark:border-slate-700">
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-md p-1 text-white/90 transition-colors hover:bg-white/15"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <Dialog.Title as="h3" className="text-lg font-semibold">
                    {showSuccess
                      ? "Ticket enviado correctamente"
                      : "Contactar a Soporte"}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-white/90">
                    Describe el contexto del problema para agilizar el
                    diagnostico.
                  </p>
                </div>

                <div className="px-5 py-5">
                  {showSuccess ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Recibimos tu solicitud. Te responderemos al correo{" "}
                        <span className="font-medium">{user?.email || "-"}</span>.
                      </p>

                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-900/50 dark:bg-indigo-900/20">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                          Folio de seguimiento
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <code className="rounded bg-white/70 px-2 py-1 text-sm font-semibold text-indigo-800 dark:bg-slate-800 dark:text-indigo-200">
                            {createdTicketNumber}
                          </code>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!createdTicketNumber) return;
                              await navigator.clipboard.writeText(
                                createdTicketNumber
                              );
                              toast.success("Folio copiado.");
                            }}
                            className="rounded-md border border-indigo-300 bg-white px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-200 dark:hover:bg-slate-700"
                          >
                            Copiar folio
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-indigo-700/90 dark:text-indigo-300/90">
                          Guardalo para dar seguimiento a tu caso.
                        </p>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-2 rounded-full bg-indigo-600 transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Correo de contacto
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Modulo afectado
                          </label>
                          <select
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900/40"
                          >
                            {MODULE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Tipo de reporte
                        </p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {ISSUE_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const active = issueType === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setIssueType(option.value)}
                                className={`rounded-xl border p-3 text-left transition-colors ${
                                  active
                                    ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30"
                                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/70"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {option.label}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {option.help}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Prioridad
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {PRIORITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setPriority(option.value)}
                              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                priority === option.value
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Titulo
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={120}
                          placeholder="Ej. No puedo registrar un pago con transferencia"
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900/40"
                        />
                        <p className="mt-1 text-right text-xs text-slate-400">
                          {title.length}/120
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Descripcion detallada
                        </label>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={1200}
                          placeholder="Incluye que accion realizaste, que esperabas y que ocurrio."
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900/40"
                        />
                        <p className="mt-1 flex items-center justify-between text-xs text-slate-400">
                          <span>Tip: agrega pasos para reproducir el error.</span>
                          <span>{description.length}/1200</span>
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Evidencia (imagenes)
                        </p>

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            void addFiles(e.dataTransfer.files);
                          }}
                          className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                            dragOver
                              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
                              : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              void addFiles(e.target.files);
                            }}
                          />
                          <ArrowUpTrayIcon className="mx-auto h-5 w-5 text-slate-500 dark:text-slate-400" />
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                            Arrastra imagenes aqui o{" "}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
                            >
                              seleccionar archivos
                            </button>
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Maximo {MAX_IMAGES} imagenes, hasta {MAX_FILE_SIZE_MB}
                            MB cada una.
                          </p>
                        </div>

                        {previews.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {previews.map((preview, index) => (
                              <div
                                key={`${preview.file.name}-${index}`}
                                className="relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                              >
                                <img
                                  src={preview.url}
                                  alt={preview.file.name}
                                  className="h-24 w-full object-cover"
                                />
                                <div className="flex items-center justify-between px-2 py-1">
                                  <p className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                                    {preview.file.name}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeAttachmentAt(index)}
                                    className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700"
                                    aria-label="Quitar imagen"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                          onClick={onClose}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isCompressing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <PaperClipIcon className="h-4 w-4" />
                          {isSubmitting
                            ? "Enviando..."
                            : isCompressing
                            ? "Comprimiendo imagenes..."
                            : "Enviar ticket"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default SupportModal;
