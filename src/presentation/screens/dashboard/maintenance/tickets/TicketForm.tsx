import React, { useState, useRef, useEffect } from "react";
import { useTicketsStore, Ticket } from "./ticketsStore";
import useProviderStore from "../../../../../store/providerStore";
import { useCommonAreasStore } from "../../../../../store/useCommonAreasStore";
import { usePersonalAdministrationStore } from "../../../../../store/PersonalAdministration";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import { useFileCompression } from "../../../../../hooks/useFileCompression";
import { componentStyles } from "./ticketFormStyles";

interface TicketFormProps {
  initialTicket?: Partial<Ticket>;
  onClose?: () => void;
}

const priorities = ["baja", "media", "alta"] as const;
const statuses = ["abierto", "en_progreso", "cerrado"] as const;
const tagOptions = [
  "Incidente",
  "Mantenimiento",
  "Sugerencia",
  "Otro",
] as const;

// Enhanced priority icons with better visuals
const priorityIcons = {
  baja: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  media: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 12h14"
      />
    </svg>
  ),
  alta: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 15l7-7 7 7"
      />
    </svg>
  ),
};

// Modern semantic colors for priority levels
const priorityColors = {
  baja: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  media:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  alta: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
};

// Enhanced tag icons for better visual hierarchy
const tagIcons = {
  Incidente: (
    <svg
      className="w-4 h-4 mr-1.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  Mantenimiento: (
    <svg
      className="w-4 h-4 mr-1.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Sugerencia: (
    <svg
      className="w-4 h-4 mr-1.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  Otro: (
    <svg
      className="w-4 h-4 mr-1.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// Status icons for better semantic representation
const statusIcons = {
  abierto: (
    <svg
      className="w-4 h-4 mr-1.5 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  en_progreso: (
    <svg
      className="w-4 h-4 mr-1.5 text-amber-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  cerrado: (
    <svg
      className="w-4 h-4 mr-1.5 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
};

// Form field component for consistent styling and behavior
const FormField = ({
  label,
  required,
  children,
  error,
  helpText,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  helpText?: string;
}) => (
  <div className={componentStyles.formGroup}>
    <label className={componentStyles.formLabel}>
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className={componentStyles.errorMessage}>{error}</p>}
    {helpText && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {helpText}
      </p>
    )}
  </div>
);

const TicketForm: React.FC<TicketFormProps> = ({ initialTicket, onClose }) => {
  const { createTicket, updateTicket, loading } = useTicketsStore();
  const { commonAreas, fetchCommonAreas } = useCommonAreasStore();
  const { employees } = usePersonalAdministrationStore();
  const { compressFile, isCompressing } = useFileCompression();

  // Estados principales del formulario con valores iniciales
  const [title, setTitle] = useState(initialTicket?.title || "");
  const [description, setDescription] = useState(
    initialTicket?.description || ""
  );
  const [priority, setPriority] = useState<(typeof priorities)[number]>(
    initialTicket?.priority || "media"
  );
  const [status, setStatus] = useState<(typeof statuses)[number]>(
    initialTicket?.status || "abierto"
  );
  const [assignedTo, setAssignedTo] = useState(initialTicket?.assignedTo || "");
  const [providerId, setProviderId] = useState(initialTicket?.providerId || "");
  const [tags, setTags] = useState<string[]>(initialTicket?.tags || []);
  const [commonAreaId, setCommonAreaId] = useState(
    initialTicket?.commonAreaId || ""
  );
  const [commonAreaName, setCommonAreaName] = useState(
    initialTicket?.commonAreaName || ""
  );

  // Estados adicionales
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Cargar proveedores y áreas comunes
  const { providers, fetchProviders } = useProviderStore();

  // Efecto para cargar datos y configurar el formulario
  useEffect(() => {
    fetchProviders();
    fetchCommonAreas();

    // Focus en el campo de título al cargar el componente para mejorar la UX
    if (titleInputRef.current && !initialTicket?.id) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line
  }, []);

  const isEdit = Boolean(initialTicket && initialTicket.id);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const processedFiles: File[] = [];

      for (const file of selectedFiles) {
        try {
          const processed = await compressFile(file);
          processedFiles.push(processed);
        } catch (error) {
          console.error("Error compressing file:", error);
          processedFiles.push(file);
        }
      }

      setFiles((prev) => {
        const combined = [...prev, ...processedFiles];
        return combined.slice(0, 5);
      });
      
      if (processedFiles.length > 0) {
        toast.success("Archivos procesados");
      }
    }
  };

  const handleCommonAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCommonAreaId(selectedId);

    if (selectedId) {
      const selectedArea = commonAreas.find((area) => area.uid === selectedId);
      if (selectedArea) {
        setCommonAreaName(selectedArea.name);
      }
    } else {
      setCommonAreaName("");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("media" as (typeof priorities)[number]);
    setStatus("abierto" as (typeof statuses)[number]);
    setAssignedTo("");
    setProviderId("");
    setTags([]);
    setCommonAreaId("");
    setCommonAreaName("");
    setFiles([]);
    setError(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (!title.trim()) {
      errors.title = "El título es obligatorio";
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = "La descripción es obligatoria";
      isValid = false;
    }

    if (tags.length === 0) {
      errors.tags = "Selecciona al menos un tag";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const userEmail = user ? user.email : "Usuario desconocido";
      const userName = user
        ? user.displayName || user.email
        : "Usuario desconocido";

      // Lógica inteligente para assignedTo:
      // 1. Si hay personal asignado, usar personal
      // 2. Si no hay personal pero sí proveedor, usar proveedor
      // 3. Si hay ambos, priorizar personal
      let finalAssignedTo = "";
      if (assignedTo) {
        // Hay personal asignado, usar personal
        finalAssignedTo = assignedTo;
      } else if (providerId) {
        // No hay personal pero sí proveedor, usar proveedor
        finalAssignedTo = providerId;
      }
      // Si no hay ni personal ni proveedor, queda vacío

      if (isEdit && initialTicket?.id) {
        await updateTicket(
          initialTicket.id,
          {
            title,
            description,
            priority,
            status,
            assignedTo: finalAssignedTo,
            tags,
            providerId,
            commonAreaId,
            commonAreaName,
            // Mantenemos los valores originales si existen
            folio: initialTicket.folio,
            createdBy:
              initialTicket.createdBy || userName || "Usuario desconocido",
            createdByEmail:
              initialTicket.createdByEmail ||
              userEmail ||
              "Usuario desconocido",
          },
          files
        );
      } else {
        // Generar ID EA-XXXXXXXX
        const randomId =
          "EA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        // auth, user, userEmail y userName ya están definidos arriba

        await createTicket(
          {
            title,
            description,
            priority,
            status,
            assignedTo: finalAssignedTo,
            tags,
            providerId,
            commonAreaId,
            commonAreaName,
            folio: randomId,
            createdBy: userName || "Usuario desconocido",
            createdByEmail: userEmail || "Usuario desconocido",
            history: [
              {
                date: new Date(),
                action: "created",
                status,
                user: userName || "Usuario desconocido",
                comment: `Ticket creado con folio: ${randomId}`,
              },
            ],
          },
          files
        );
      }
      resetForm();
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Error al guardar ticket:", err);
      let errorMsg = "Error al guardar el ticket";

      if (err.code === "auth/user-not-found" || err.code === "auth/null-user") {
        errorMsg = "Error de autenticación: Usuario no encontrado";
      } else if (err.code === "permission-denied") {
        errorMsg = "No tienes permisos para realizar esta acción";
      } else if (
        err.code === "storage/unauthorized" ||
        err.message?.includes("unauthorized")
      ) {
        errorMsg = "No tienes permisos para subir archivos";
      } else if (
        err.code === "storage/object-too-large" ||
        err.message?.includes("too large")
      ) {
        errorMsg = "El archivo es demasiado grande. El límite es de 15MB";
      } else if (err.message) {
        errorMsg = err.message;
      }

      // Mostrar mensaje de error en toast en lugar de en la interfaz
      toast.error(errorMsg);
    }
  };

  return (
    <form className={componentStyles.formContainer} onSubmit={handleSubmit}>
      {/* Form header */}
      <div className={componentStyles.formTitle}>
        {isEdit ? (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar Ticket
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nuevo Ticket
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-start">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Title field */}
      <FormField label="Título" required error={fieldErrors.title}>
        <input
          type="text"
          className={componentStyles.formInput}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) {
              setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.title;
                return newErrors;
              });
            }
          }}
          ref={titleInputRef}
          placeholder="Ej: Reparación de puerta principal"
        />
      </FormField>

      {/* Description field */}
      <FormField
        label="Descripción"
        required
        error={fieldErrors.description}
        helpText="Describe el problema o solicitud con el mayor detalle posible"
      >
        <textarea
          className={componentStyles.formTextarea}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (e.target.value.trim()) {
              setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.description;
                return newErrors;
              });
            }
          }}
          placeholder="Describe los detalles del ticket..."
        />
      </FormField>

      {/* Tags field */}
      <FormField label="Categoría" required error={fieldErrors.tags}>
        <div className="flex flex-wrap gap-2 mt-1">
          {tagOptions.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                tags.includes(tag)
                  ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                setTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag]
                );
                setFieldErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.tags;
                  return newErrors;
                });
              }}
            >
              {tags.includes(tag) ? (
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                tagIcons[tag as keyof typeof tagIcons]
              )}
              {tag}
            </button>
          ))}
        </div>
      </FormField>

      {/* Priority and Status fields - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority field */}
        <FormField label="Prioridad">
          <div className="flex space-x-2">
            {priorities.map((p) => (
              <button
                type="button"
                key={p}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md transition-all duration-200 border ${
                  priority === p
                    ? `${priorityColors[p]} border-2`
                    : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
                onClick={() => setPriority(p)}
              >
                {priorityIcons[p]}
                <span className="ml-1.5 font-medium text-sm capitalize">
                  {p}
                </span>
              </button>
            ))}
          </div>
        </FormField>
      </div>
      <div>
        {/* Status field */}
        <FormField label="Estado">
          <div className="relative">
            <select
              className={componentStyles.formSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as Ticket["status"])}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none pr-2">
              {statusIcons[status]}
            </div>
          </div>
        </FormField>
      </div>

      {/* Provider field */}
      <FormField
        label="Proveedor"
        helpText="Selecciona un proveedor si el ticket está relacionado con sus servicios"
      >
        <select
          className={componentStyles.formSelect}
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
        >
          <option value="">Sin proveedor</option>
          {providers.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
            </option>
          ))}
        </select>
      </FormField>

      {/* Common Area field - add after Provider field */}
      <FormField
        label="Área común"
        helpText="Selecciona un área común si el ticket está relacionado con ella"
      >
        <select
          className={componentStyles.formSelect}
          value={commonAreaId}
          onChange={handleCommonAreaChange}
        >
          <option value="">Seleccionar área común</option>
          {commonAreas.map((area) => (
            <option key={area.id} value={area.uid || area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </FormField>

      {/* Assigned To field */}
      <FormField
        label="Asignado a"
        helpText="Selecciona un miembro del personal para asignar el ticket"
      >
        <select
          className={componentStyles.formSelect}
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.personalInfo.firstName} {employee.personalInfo.lastName}{" "}
              - {employee.employmentInfo.position}
            </option>
          ))}
        </select>
      </FormField>

      {/* Attachments field */}
      <FormField
        label="Adjuntos"
        helpText={`${files.length}/5 archivos - Fotos, documentos u otros archivos relevantes`}
      >
        <div className="flex flex-col gap-2">
          <label
            className={`${componentStyles.fileUpload.button} ${
              files.length >= 5 || isCompressing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Añadir archivos
            <input
              type="file"
              className="hidden"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="*"
              disabled={files.length >= 5 || isCompressing}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1.5">
              {files.map((file, idx) => (
                <div key={idx} className={componentStyles.fileUpload.fileChip}>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    className={componentStyles.fileUpload.removeButton}
                    aria-label="Eliminar archivo"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormField>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onClose && (
          <button
            className={`${componentStyles.button.base} ${componentStyles.button.secondary}`}
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          className={`${componentStyles.button.base} ${componentStyles.button.primary}`}
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {isEdit ? "Guardar Cambios" : "Crear Ticket"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
