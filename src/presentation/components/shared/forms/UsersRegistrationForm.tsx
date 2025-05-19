import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useCondominiumStore } from "../../../../store/useRegisterUserStore";
import { useCondominiumLimitsStore } from "../../../../store/useCondominiumLimitsStore";
import {
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon,
  TableCellsIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingRegister from "../loaders/LoadingRegister";

// Estilos CSS para animaciones
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulseHighlight {
    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
    70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-pulse-highlight {
    animation: pulseHighlight 2s infinite;
  }
`;

const UsersRegistrationForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message?: string;
    excelUserCount?: number;
  } | null>(null);
  const [limitInfo, setLimitInfo] = useState<{
    condominiumLimit: number;
    currentUserCount: number;
  }>({ condominiumLimit: 0, currentUserCount: 0 });

  const sendExcel = useCondominiumStore((state) => state.sendExcel);
  const {
    getCondominiumLimit,
    getCurrentUserCount,
    validateExcelUsers,
    isLoading: isValidating,
  } = useCondominiumLimitsStore();

  // Insertar estilos CSS de animación
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = animationStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Cargar límites al montar el componente
  useEffect(() => {
    const loadLimits = async () => {
      try {
        const limit = await getCondominiumLimit();
        const currentCount = await getCurrentUserCount();
        setLimitInfo({
          condominiumLimit: limit,
          currentUserCount: currentCount,
        });
      } catch (error) {
        toast.error("Error al cargar la información de límites");
      }
    };

    loadLimits();
  }, [getCondominiumLimit, getCurrentUserCount]);

  // Formatear tamaño del archivo
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Simular progreso de carga
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (file && uploadProgress < 100) {
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Cuando la carga llegue al 100%, habilitar el botón y mostrar resumen
      if (uploadProgress === 100 && file) {
        // Crear resumen con los límites actuales
        const excelUserCount = 1; // Asumimos al menos 1 usuario

        setValidationResult({
          isValid: true,
          message: `Se procesará el archivo y se importarán ${excelUserCount} registros.`,
          excelUserCount,
        });

        toast.success(
          `Archivo listo para importar: ${excelUserCount} usuarios`
        );
        setCurrentStep(2);
      }
    }

    return () => clearInterval(interval);
  }, [file, uploadProgress]);

  // Mostrar paso 2 con más detalles sobre los límites
  useEffect(() => {
    if (currentStep === 2 && validationResult?.isValid) {
      const loadDetails = async () => {
        try {
          const limit = await getCondominiumLimit();
          const currentCount = await getCurrentUserCount();

          setLimitInfo({
            condominiumLimit: limit,
            currentUserCount: currentCount,
          });
        } catch (error) {
          console.error("Error al cargar detalles:", error);
        }
      };

      loadDetails();
    }
  }, [currentStep, validationResult, getCondominiumLimit, getCurrentUserCount]);

  const handleRegisterCondominiums = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!file) {
      toast.error(
        "Por favor, selecciona un archivo para registrar los usuarios"
      );
      setLoading(false);
      return;
    }

    // Verificar si el resultado de validación existe y es válido
    if (!validationResult || validationResult.isValid === false) {
      toast.error(
        validationResult?.message || "El archivo no es válido para importar"
      );
      setLoading(false);
      return;
    }

    try {
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) {
        toast.error("No se encontró el ID del condominio");
        return;
      }
      await sendExcel(file);
      toast.success("Usuarios registrados correctamente");
      setFile(null);
      setFileName("");
      setFileSize("");
      setUploadProgress(0);
      setCurrentStep(1);
      setValidationResult(null);

      // Actualizar contador de usuarios tras registro exitoso
      const currentCount = await getCurrentUserCount();
      setLimitInfo((prev) => ({ ...prev, currentUserCount: currentCount }));
    } catch (error) {
      toast.error("Error al registrar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const dropzoneOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    } as any,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setFileSize(formatFileSize(selectedFile.size));
        setUploadProgress(10); // Iniciar la simulación de progreso
        setCurrentStep(1);
        setValidationResult(null);

        // Validar el archivo después de cargarlo
        try {
          const result = await validateExcelUsers(selectedFile);

          // Si el archivo no es válido (excede límites), mostrar mensaje y detener proceso
          if (!result.isValid) {
            toast.error(
              result.message || "El archivo excede los límites permitidos"
            );
            setValidationResult(result);
            setUploadProgress(100); // Completar el progreso para mostrar el mensaje de error
            setCurrentStep(2);
            return;
          }

          // Si es válido, continuar con el proceso normal
          setValidationResult(result);
        } catch (error) {
          toast.error("Error al validar el archivo Excel");
          setFile(null);
          setFileName("");
          setFileSize("");
          setUploadProgress(0);
        }
      }
    },
    onDropRejected: (fileRejections: any[]) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("El archivo excede el límite de 10MB");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Solo se aceptan archivos Excel (.xls, .xlsx)");
      } else {
        toast.error("Error al cargar el archivo");
      }
    },
    onDragEnter: () => {
      setIsDragActive(true);
    },
    onDragLeave: () => {
      setIsDragActive(false);
    },
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive: internalIsDragActive,
    open, // Añadir esta función explícitamente para abrir el selector de archivos
  } = useDropzone(dropzoneOptions);

  // Sincronizar el estado interno del dropzone con nuestro estado
  useEffect(() => {
    setIsDragActive(internalIsDragActive);
  }, [internalIsDragActive]);

  return (
    <div className="divide-gray-900/10 w-full shadow-md rounded-md px-8 py-6 dark:bg-gray-800 dark:text-gray-100 dark:shadow-2xl">
      {(loading || isValidating) && <LoadingRegister />}
      <form
        className="bg-white shadow-sm ring-1 w-full flex-col justify-center mx-auto ring-gray-900/5 sm:rounded-xl overflow-hidden dark:bg-gray-800"
        onSubmit={handleRegisterCondominiums}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registro de Condóminos
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Importa la lista de usuarios del condominio mediante un archivo
            Excel
          </p>

          {/* Información de límites */}
          <div className="mt-3 flex items-center text-sm">
            <InformationCircleIcon className="w-4 h-4 text-indigo-500 mr-1" />
            <span className="text-indigo-700 dark:text-indigo-300">
              {limitInfo.currentUserCount} de {limitInfo.condominiumLimit}{" "}
              usuarios permitidos registrados
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 dark:bg-gray-800 dark:text-gray-100">
          {/* Paso 1: Selección/Carga de archivo */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h4 className="text-md font-semibold">
                Selecciona tu archivo Excel
              </h4>
            </div>

            {/* Área de carga de archivo mejorada */}
            <div
              {...getRootProps()}
              className={`
                relative transition-all duration-300 
                p-6 border-2 border-dashed rounded-lg 
                flex flex-col items-center justify-center min-h-[200px]
                cursor-pointer
                ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${
                  file
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300"
                    : ""
                }
              `}
            >
              <input {...getInputProps()} />

              {!file ? (
                <>
                  <DocumentPlusIcon
                    className={`
                    w-16 h-16 mb-4 transition-colors
                    ${
                      isDragActive
                        ? "text-indigo-500"
                        : "text-gray-300 dark:text-gray-500"
                    }
                  `}
                  />

                  <div className="text-center space-y-2">
                    <p className="text-md font-medium text-gray-700 dark:text-gray-200">
                      {isDragActive
                        ? "¡Suelta el archivo aquí!"
                        : "Arrastra tu archivo Excel aquí o haz clic para seleccionar"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Formatos aceptados: .xls, .xlsx (máx. 10MB)
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 
                              border border-indigo-300 dark:border-indigo-500 rounded-md text-sm font-medium 
                              flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Usar la función open de react-dropzone para abrir el selector de archivos
                      open();
                    }}
                  >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <DocumentCheckIcon className="w-8 h-8 text-indigo-500 mr-2" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {fileName}
                        </p>
                        <p className="text-xs text-gray-500">{fileSize}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFileName("");
                        setFileSize("");
                        setUploadProgress(0);
                        setCurrentStep(1);
                        setValidationResult(null);
                      }}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      type="button"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {uploadProgress < 100 ? (
                    <div className="w-full">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right text-gray-500">
                        Procesando archivo...
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-sm text-indigo-700 dark:text-indigo-400">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Archivo listo para importar
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Información y ayuda */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start dark:bg-amber-900/20 dark:border-amber-800">
              <ExclamationCircleIcon className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Formato requerido
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Es importante que utilices la plantilla de ejemplo para
                  importar los usuarios.
                </p>
                <a
                  href="https://res.cloudinary.com/dz5tntwl1/raw/upload/v1710883105/template-registro-de-usuarios_yw3tih.xlsx"
                  className="mt-2 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  <TableCellsIcon className="w-3 h-3 mr-1 font-medium" />
                  Descargar plantilla de ejemplo
                </a>
              </div>
            </div>
          </div>

          {/* Paso 2: Confirmación (solo se muestra cuando se ha cargado un archivo y procesado) */}
          {currentStep === 2 && file && uploadProgress === 100 && (
            <div className="mb-6 animate-fadeIn border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm font-semibold">
                  2
                </span>
                <h4 className="text-md font-semibold">
                  {validationResult?.isValid
                    ? "Confirmar importación"
                    : "Error de validación"}
                </h4>
              </div>

              {validationResult?.isValid ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Archivo seleccionado:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {fileName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tamaño del archivo:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {fileSize}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usuarios a importar:
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {validationResult.excelUserCount} usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usuarios actuales:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {limitInfo.currentUserCount} usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Límite del plan:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {limitInfo.condominiumLimit} usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total después de importar:
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {limitInfo.currentUserCount +
                        (validationResult?.excelUserCount || 0)}{" "}
                      de {limitInfo.condominiumLimit} usuarios
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="flex items-start">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        No se puede importar este archivo
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {validationResult?.message ||
                          "El archivo excede los límites de usuarios permitidos."}
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Usuarios a importar:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {validationResult?.excelUserCount} usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Usuarios actuales:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {limitInfo.currentUserCount} usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Límite del plan:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {limitInfo.condominiumLimit} usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Total después de importar:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {limitInfo.currentUserCount +
                              (validationResult?.excelUserCount || 0)}{" "}
                            de {limitInfo.condominiumLimit} usuarios
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {validationResult?.isValid && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    Al importar, los usuarios serán agregados al sistema. Esta
                    acción no se puede deshacer.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-200 px-6 py-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            onClick={() => {
              setFile(null);
              setFileName("");
              setFileSize("");
              setUploadProgress(0);
              setCurrentStep(1);
              setValidationResult(null);
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            disabled={
              !file ||
              uploadProgress < 100 ||
              (validationResult !== null && validationResult.isValid === false)
            }
          >
            {file && uploadProgress < 100 ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                Procesando
              </>
            ) : (
              "Importar usuarios"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersRegistrationForm;
