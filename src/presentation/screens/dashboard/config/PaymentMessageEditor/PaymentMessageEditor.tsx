import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import {
  CheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  BookOpenIcon,
  UsersIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../../store/useConfigStore";
import { useCondominiumStore } from "../../../../../store/useCondominiumStore";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import "react-quill/dist/quill.snow.css";
import "./quill-dark-mode.css";

// Tipos de documentos predefinidos
const DOCUMENT_TYPES = [
  {
    id: "reglamento",
    name: "Reglamento del Condominio",
    icon: <DocumentTextIcon className="h-6 w-6" />,
    description:
      "Documento oficial que establece las normas y regulaciones del condominio.",
  },
  {
    id: "manualConvivencia",
    name: "Manual de Convivencia",
    icon: <BookOpenIcon className="h-6 w-6" />,
    description:
      "Guía para la convivencia armónica entre los residentes del condominio.",
  },
  {
    id: "politicasAreaComun",
    name: "Políticas de Uso de Áreas Comunes",
    icon: <UsersIcon className="h-6 w-6" />,
    description:
      "Normativas específicas para el uso de espacios compartidos y áreas comunes.",
  },
];

const PaymentMessageEditor: React.FC = () => {
  const {
    paymentMessageInfo,
    updatePaymentMessageInfo,
    fetchPaymentMessageInfo,
    publicDocuments,
    fetchPublicDocuments,
    uploadPublicDocument,
    deletePublicDocument,
    uploading,
  } = useConfigStore();
  const { isDarkMode } = useTheme();

  // Obtener el condominio seleccionado
  const selectedCondominium = useCondominiumStore(
    (state: any) => state.selectedCondominium
  );
  const [paymentMessage, setPaymentMessage] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [dueDay, setDueDay] = useState<number>(10);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estado para la sección de documentos públicos
  const [activeTab, setActiveTab] = useState<"payment" | "documents">(
    "payment"
  );
  const [documentPreview, setDocumentPreview] = useState<{
    [key: string]: string;
  }>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Módulos de React-Quill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  // Configuración de React-Quill
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "color",
    "background",
  ];

  useEffect(() => {
    fetchPaymentMessageInfo();
    fetchPublicDocuments();
  }, [fetchPaymentMessageInfo, fetchPublicDocuments]);

  useEffect(() => {
    if (paymentMessageInfo) {
      setBankAccount(paymentMessageInfo.bankAccount || "");
      setBankName(paymentMessageInfo.bankName || "");
      setDueDay(paymentMessageInfo.dueDay || 10);
      setPaymentMessage(
        paymentMessageInfo.paymentMessage || getDefaultMessage()
      );
    }
  }, [paymentMessageInfo]);

  // Actualizar el mensaje cuando cambien los valores de los inputs
  useEffect(() => {
    // Verificamos que el mensaje ya esté cargado antes de actualizarlo
    if (paymentMessage) {
      updateMessagePlaceholders();
    }
  }, [bankName, bankAccount, dueDay]);

  // Generar vistas previas para PDFs
  useEffect(() => {
    // Limpiar vistas previas anteriores
    setDocumentPreview({});

    // Para cada documento que sea PDF, generar una vista previa
    Object.values(publicDocuments).forEach((doc) => {
      if (doc.fileUrl && doc.fileType === "application/pdf") {
        generatePdfThumbnail(doc.id, doc.fileUrl);
      }
    });
  }, [publicDocuments]);

  const generatePdfThumbnail = async (docId: string, _url: string) => {
    try {
      // Para PDFs, mostramos un componente personalizado
      setDocumentPreview((prev) => ({
        ...prev,
        [docId]: "pdf",
      }));
    } catch (error) {
      console.error("Error al generar vista previa del PDF:", error);
    }
  };

  const getDefaultMessage = () => {
    return `<h3>Información de Pago</h3>
<p>Estimado residente,</p>
<p>Le recordamos que los pagos deben realizarse a más tardar el día ${dueDay} de cada mes.</p>
<p><strong>Datos bancarios:</strong></p>
<ul>
  <li>Banco: ${bankName || "[Nombre del Banco]"}</li>
  <li>Cuenta: ${bankAccount || "[Número de Cuenta]"}</li>
</ul>
<p>Si tiene alguna pregunta o requiere asistencia, favor de contactar a la administración.</p>
<p>Gracias por su puntualidad.</p>`;
  };

  const updateMessagePlaceholders = () => {
    // Reemplaza las variables en el mensaje con los valores actuales
    let updatedMessage = paymentMessage;

    // Actualizamos los placeholders con expresiones regulares más precisas
    // para no afectar texto que el usuario haya ingresado manualmente

    // Actualiza el nombre del banco
    const bankNameRegex = /Banco:\s*(?:\[Nombre del Banco\]|[^\n<]+)/g;
    if (updatedMessage.match(bankNameRegex)) {
      updatedMessage = updatedMessage.replace(
        bankNameRegex,
        `Banco: ${bankName || "[Nombre del Banco]"}`
      );
    }

    // Actualiza el número de cuenta
    const bankAccountRegex = /Cuenta:\s*(?:\[Número de Cuenta\]|[^\n<]+)/g;
    if (updatedMessage.match(bankAccountRegex)) {
      updatedMessage = updatedMessage.replace(
        bankAccountRegex,
        `Cuenta: ${bankAccount || "[Número de Cuenta]"}`
      );
    }

    // Actualiza el día de vencimiento en el mensaje
    const dueDayRegex = /a más tardar el día \d+ de/g;
    if (updatedMessage.match(dueDayRegex)) {
      updatedMessage = updatedMessage.replace(
        dueDayRegex,
        `a más tardar el día ${dueDay} de`
      );
    }

    setPaymentMessage(updatedMessage);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Actualizar el mensaje con los valores actuales
      updateMessagePlaceholders();

      // Guardar en la colección especializada a través del store
      await updatePaymentMessageInfo({
        bankAccount,
        bankName,
        dueDay,
        paymentMessage,
      });

      toast.success("Mensaje de pago actualizado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el mensaje de pago");
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para manejar documentos públicos
  const handleUploadDocument = async (documentId: string, file: File) => {
    try {
      const docType = DOCUMENT_TYPES.find((d) => d.id === documentId);
      if (!docType) return;

      // Verificar si ya existe un documento
      const existingDoc = publicDocuments[documentId];
      if (existingDoc?.fileUrl) {
        setSelectedDocument({ id: documentId, name: docType.name });
        setSelectedFile(file);
        setReplaceModalOpen(true);
        return;
      }

      await uploadPublicDocument(
        documentId,
        file,
        docType.name,
        docType.description
      );
      toast.success("Documento subido correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al subir documento");
    }
  };

  const handleReplaceConfirm = async () => {
    if (!selectedDocument || !selectedFile) return;

    try {
      const docType = DOCUMENT_TYPES.find((d) => d.id === selectedDocument.id);
      if (!docType) return;

      await uploadPublicDocument(
        selectedDocument.id,
        selectedFile,
        docType.name,
        docType.description
      );
      toast.success("Documento reemplazado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al reemplazar documento");
    } finally {
      setReplaceModalOpen(false);
      setSelectedDocument(null);
      setSelectedFile(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const docType = DOCUMENT_TYPES.find((d) => d.id === documentId);
    if (!docType) return;

    setSelectedDocument({ id: documentId, name: docType.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;

    try {
      await deletePublicDocument(selectedDocument.id);
      toast.success("Documento eliminado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar documento");
    } finally {
      setDeleteModalOpen(false);
      setSelectedDocument(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <DocumentIcon className="h-10 w-10 text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <DocumentIcon className="h-10 w-10 text-blue-500" />;
    } else if (
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      fileType.includes("xls")
    ) {
      return <DocumentIcon className="h-10 w-10 text-green-500" />;
    } else if (
      fileType.includes("presentation") ||
      fileType.includes("powerpoint") ||
      fileType.includes("ppt")
    ) {
      return <DocumentIcon className="h-10 w-10 text-orange-500" />;
    } else {
      return <DocumentIcon className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-0 mb-6 overflow-hidden transition-colors duration-200">
      {/* Encabezado */}
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Configuración de Mensajes y Documentos
          </h2>
          {selectedCondominium && (
            <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium dark:bg-indigo-900 dark:text-indigo-200">
              {selectedCondominium.name}
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === "payment"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("payment")}
          >
            Mensaje de Pago
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === "documents"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            Documentos Públicos
          </button>
        </nav>
      </div>

      {activeTab === "payment" && (
        <div className="px-8 py-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Configure el mensaje personalizado que verán los residentes sobre la
            información de pago de sus cuotas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Nombre del Banco */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="bankName"
                className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2"
              >
                Nombre del Banco
              </label>
              <input
                type="text"
                id="bankName"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                }}
                className="w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 transition-colors duration-200"
                placeholder="Ej. BBVA"
              />
            </div>

            {/* Número de Cuenta */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="bankAccount"
                className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2"
              >
                Número de Cuenta
              </label>
              <input
                type="text"
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => {
                  setBankAccount(e.target.value);
                }}
                className="w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 transition-colors duration-200"
                placeholder="Ej. 0123456789"
              />
            </div>

            {/* Día de vencimiento */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm">
              <label
                htmlFor="dueDay"
                className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2"
              >
                Día límite de pago
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="dueDay"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => {
                    setDueDay(parseInt(e.target.value) || 10);
                  }}
                  className="w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 transition-colors duration-200"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  de cada mes
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-900 dark:text-gray-100 text-sm font-medium mb-2">
              Mensaje Personalizado
            </label>
            <div
              className={`payment-editor-container ${
                isDarkMode ? "dark" : ""
              } border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm`}
            >
              <ReactQuill
                theme="snow"
                value={paymentMessage}
                onChange={setPaymentMessage}
                modules={modules}
                formats={formats}
                className="min-h-[200px]"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Este mensaje se mostrará en los correos de cargos generados.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600  hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">&#8635;</span>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Guardar Mensaje
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="px-8 py-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Suba documentos importantes que los residentes del condominio podrán
            consultar a través del ChatBot de EstateAdmin.
          </p>

          <div className="grid gap-6 mb-6">
            {DOCUMENT_TYPES.map((docType) => {
              const document = publicDocuments[docType.id];
              const hasFile = document?.fileUrl;

              return (
                <div
                  key={docType.id}
                  className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-5 shadow-sm transition-all duration-200 ${
                    hasFile
                      ? "border-l-4 border-green-500 dark:border-green-400"
                      : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 p-2 rounded-md ${
                        hasFile
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-indigo-100 dark:bg-indigo-900"
                      }`}
                    >
                      {docType.icon}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {docType.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {docType.description}
                      </p>

                      {hasFile ? (
                        <div className="mt-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Vista previa / Icono del documento */}
                            <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                              {documentPreview[docType.id] === "pdf" ? (
                                <div className="flex flex-col items-center">
                                  <DocumentIcon className="h-16 w-16 text-red-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                                    PDF Document
                                  </span>
                                </div>
                              ) : documentPreview[docType.id] ? (
                                <img
                                  src={documentPreview[docType.id]}
                                  alt="Vista previa"
                                  className="h-32 object-contain rounded"
                                />
                              ) : (
                                getFileIcon(document.fileType)
                              )}
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 text-center">
                                {document.fileName ||
                                  document.fileUrl
                                    .split("/")
                                    .pop()
                                    ?.split("_")
                                    .slice(2)
                                    .join("_") ||
                                  "Documento"}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                ({formatFileSize(document.fileSize)})
                              </span>
                            </div>

                            {/* Información y acciones */}
                            <div className="flex-1">
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Información del documento
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Subido el{" "}
                                  {document.uploadedAt
                                    ? new Date(
                                        document.uploadedAt
                                      ).toLocaleDateString()
                                    : "Fecha no disponible"}
                                  ,{" "}
                                  {document.uploadedAt
                                    ? new Date(
                                        document.uploadedAt
                                      ).toLocaleTimeString()
                                    : ""}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                  Ver documento
                                </a>

                                <label
                                  htmlFor={`upload-replace-${docType.id}`}
                                  className={`
                                    inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium
                                    ${
                                      uploading[docType.id]
                                        ? "text-gray-400 dark:text-gray-500 cursor-wait bg-gray-100 dark:bg-gray-700"
                                        : "text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 cursor-pointer"
                                    }
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200
                                  `}
                                >
                                  {uploading[docType.id] ? (
                                    <>
                                      <span className="animate-spin mr-1">
                                        &#8635;
                                      </span>
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                                      Reemplazar
                                    </>
                                  )}
                                </label>
                                <input
                                  id={`upload-replace-${docType.id}`}
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUploadDocument(docType.id, file);
                                    }
                                    e.target.value = ""; // Reset input
                                  }}
                                  disabled={uploading[docType.id]}
                                />

                                <button
                                  onClick={() =>
                                    handleDeleteDocument(docType.id)
                                  }
                                  disabled={uploading[docType.id]}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-200"
                                >
                                  {uploading[docType.id] ? (
                                    <span className="animate-spin mr-1">
                                      &#8635;
                                    </span>
                                  ) : (
                                    <TrashIcon className="h-4 w-4 mr-1" />
                                  )}
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center">
                            <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mb-2" />
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              No hay documento cargado
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
                              Cargue un documento para que esté disponible para
                              los residentes
                            </p>

                            <label
                              htmlFor={`upload-${docType.id}`}
                              className={`
                                inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium 
                                ${
                                  uploading[docType.id]
                                    ? "text-gray-400 dark:text-gray-500 cursor-wait bg-gray-100 dark:bg-gray-700"
                                    : "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 cursor-pointer"
                                }
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200
                              `}
                            >
                              {uploading[docType.id] ? (
                                <>
                                  <span className="animate-spin mr-2">
                                    &#8635;
                                  </span>
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                  Subir documento
                                </>
                              )}
                            </label>
                            <input
                              id={`upload-${docType.id}`}
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadDocument(docType.id, file);
                                }
                                e.target.value = ""; // Reset input
                              }}
                              disabled={uploading[docType.id]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto ${
          deleteModalOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
          />
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => setDeleteModalOpen(false)}
              >
                <span className="sr-only">Cerrar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationCircleIcon
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                  Eliminar Documento
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ¿Estás seguro de que deseas eliminar el documento "
                    {selectedDocument?.name}"? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Reemplazo */}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto ${
          replaceModalOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
          />
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => setReplaceModalOpen(false)}
              >
                <span className="sr-only">Cerrar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationCircleIcon
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                  Reemplazar Documento
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ¿Estás seguro de que deseas reemplazar el documento "
                    {selectedDocument?.name}"? El documento actual será
                    eliminado.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 sm:ml-3 sm:w-auto"
                onClick={handleReplaceConfirm}
              >
                Reemplazar
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
                onClick={() => setReplaceModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMessageEditor;
