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
  
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
  }
  
  @keyframes orbit-reverse {
    from { transform: rotate(0deg) translateX(175px) rotate(0deg); }
    to { transform: rotate(-360deg) translateX(175px) rotate(360deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes shimmer-slow {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-pulse-highlight {
    animation: pulseHighlight 2s infinite;
  }
  
  .animate-orbit {
    animation: orbit 20s linear infinite;
  }
  
  .animate-orbit-reverse {
    animation: orbit-reverse 25s linear infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .shimmer-effect-slow {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    background-size: 1000px 100%;
    animation: shimmer-slow 4s ease-in-out infinite;
  }
`;

const UsersRegistrationForm = () => {
  const [ file, setFile ] = useState<File | null>( null );
  const [ fileName, setFileName ] = useState( "" );
  const [ fileSize, setFileSize ] = useState( "" );
  const [ loading, setLoading ] = useState( false );
  const [ uploadProgress, setUploadProgress ] = useState( 0 );
  const [ currentStep, setCurrentStep ] = useState( 1 );
  const [ isDragActive, setIsDragActive ] = useState( false );
  const [ validationResult, setValidationResult ] = useState<{
    isValid: boolean;
    message?: string;
    excelUserCount?: number;
  } | null>( null );
  const [ isColumnsGuideOpen, setIsColumnsGuideOpen ] = useState( false );
  const [ limitInfo, setLimitInfo ] = useState<{
    condominiumLimit: number;
    currentUserCount: number;
  }>( { condominiumLimit: 0, currentUserCount: 0 } );

  const excelColumnsGuide = [
    {
      column: "name",
      description: "Nombre del condómino.",
      required: true,
      example: "Juan",
    },
    {
      column: "lastName",
      description: "Apellido del condómino.",
      required: false,
      example: "Pérez",
    },
    {
      column: "email",
      description: "Correo electrónico del condómino.",
      required: false,
      example: "juan@correo.com",
    },
    {
      column: "role",
      description: "Rol del usuario en el sistema.",
      required: false,
      example: "condomino",
    },
    {
      column: "CP",
      description: "Código postal.",
      required: false,
      example: "43816",
    },
    {
      column: "address",
      description: "Dirección del condómino.",
      required: false,
      example: "Av. Principal 123",
    },
    {
      column: "country",
      description: "País.",
      required: false,
      example: "México",
    },
    {
      column: "city",
      description: "Ciudad.",
      required: false,
      example: "Ciudad de México",
    },
    {
      column: "state",
      description: "Estado.",
      required: false,
      example: "Ciudad de México",
    },
    {
      column: "number",
      description: "Número de casa/departamento.",
      required: false,
      example: "A-101",
    },
    {
      column: "tower",
      description: "Torre o bloque al que pertenece.",
      required: false,
      example: "B",
    },
    {
      column: "busisnessName",
      description: "Razón social (si aplica para facturación).",
      required: false,
      example: "Servicios ABC SA de CV",
    },
    {
      column: "taxResidence",
      description: "Dirección fiscal.",
      required: false,
      example: "Calle Fiscal 456",
    },
    {
      column: "taxRegime",
      description: "Régimen fiscal.",
      required: false,
      example: "601",
    },
    {
      column: "departament",
      description: "Departamento (texto libre).",
      required: false,
      example: "Depto 4",
    },
    {
      column: "photoURL",
      description: "URL pública de foto de perfil.",
      required: false,
      example: "https://...",
    },
    {
      column: "RFC",
      description: "RFC para facturación.",
      required: false,
      example: "PEPJ8001019Q8",
    },
    {
      column: "phone",
      description: "Teléfono de contacto.",
      required: false,
      example: "5512345678",
    },
  ];

  const sendExcel = useCondominiumStore( ( state ) => state.sendExcel );
  const {
    getCondominiumLimit,
    getCurrentUserCount,
    validateExcelUsers,
    isLoading: isValidating,
  } = useCondominiumLimitsStore();

  // Insertar estilos CSS de animación
  useEffect( () => {
    const styleElement = document.createElement( "style" );
    styleElement.innerHTML = animationStyles;
    document.head.appendChild( styleElement );

    return () => {
      document.head.removeChild( styleElement );
    };
  }, [] );

  // Cargar límites al montar el componente
  useEffect( () => {
    const loadLimits = async () => {
      try {
        const limit = await getCondominiumLimit();
        const currentCount = await getCurrentUserCount();
        setLimitInfo( {
          condominiumLimit: limit,
          currentUserCount: currentCount,
        } );
      } catch ( error ) {
        toast.error( "Error al cargar la información de límites" );
      }
    };

    loadLimits();
  }, [ getCondominiumLimit, getCurrentUserCount ] );

  // Formatear tamaño del archivo
  const formatFileSize = ( size: number ): string => {
    if ( size < 1024 ) return `${ size } bytes`;
    if ( size < 1024 * 1024 ) return `${ ( size / 1024 ).toFixed( 1 ) } KB`;
    return `${ ( size / ( 1024 * 1024 ) ).toFixed( 1 ) } MB`;
  };

  // Simular progreso de carga
  useEffect( () => {
    let interval: NodeJS.Timeout;
    if ( file && uploadProgress < 100 ) {
      interval = setInterval( () => {
        setUploadProgress( ( prev ) => {
          if ( prev >= 90 ) {
            clearInterval( interval );
            return 100;
          }
          return prev + 10;
        } );
      }, 200 );

      // Cuando la carga llegue al 100%, habilitar el botón y mostrar resumen
      if ( uploadProgress === 100 && file ) {
        // Crear resumen con los límites actuales
        const excelUserCount = 1; // Asumimos al menos 1 usuario

        setValidationResult( {
          isValid: true,
          message: `Se procesará el archivo y se importarán ${ excelUserCount } registros.`,
          excelUserCount,
        } );

        toast.success(
          `Archivo listo para importar: ${ excelUserCount } usuarios`
        );
        setCurrentStep( 2 );
      }
    }

    return () => clearInterval( interval );
  }, [ file, uploadProgress ] );

  // Mostrar paso 2 con más detalles sobre los límites
  useEffect( () => {
    if ( currentStep === 2 && validationResult?.isValid ) {
      const loadDetails = async () => {
        try {
          const limit = await getCondominiumLimit();
          const currentCount = await getCurrentUserCount();

          setLimitInfo( {
            condominiumLimit: limit,
            currentUserCount: currentCount,
          } );
        } catch ( error ) {
          console.error( "Error al cargar detalles:", error );
        }
      };

      loadDetails();
    }
  }, [ currentStep, validationResult, getCondominiumLimit, getCurrentUserCount ] );

  const handleRegisterCondominiums = async ( event: React.FormEvent ) => {
    event.preventDefault();
    setLoading( true );

    if ( !file ) {
      toast.error(
        "Por favor, selecciona un archivo para registrar los usuarios"
      );
      setLoading( false );
      return;
    }

    // Verificar si el resultado de validación existe y es válido
    if ( !validationResult || validationResult.isValid === false ) {
      toast.error(
        validationResult?.message || "El archivo no es válido para importar"
      );
      setLoading( false );
      return;
    }

    try {
      const condominiumId = localStorage.getItem( "condominiumId" );
      if ( !condominiumId ) {
        toast.error( "No se encontró el ID del condominio" );
        return;
      }
      await sendExcel( file );
      toast.success( "Usuarios registrados correctamente" );
      setFile( null );
      setFileName( "" );
      setFileSize( "" );
      setUploadProgress( 0 );
      setCurrentStep( 1 );
      setValidationResult( null );

      // Actualizar contador de usuarios tras registro exitoso
      const currentCount = await getCurrentUserCount();
      setLimitInfo( ( prev ) => ( { ...prev, currentUserCount: currentCount } ) );
    } catch ( error ) {
      toast.error( "Error al registrar los usuarios" );
    } finally {
      setLoading( false );
    }
  };

  const dropzoneOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accept: {
      "application/vnd.ms-excel": [ ".xls" ],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    } as any,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: async ( acceptedFiles: File[] ) => {
      if ( acceptedFiles.length > 0 ) {
        const selectedFile = acceptedFiles[ 0 ];
        setFile( selectedFile );
        setFileName( selectedFile.name );
        setFileSize( formatFileSize( selectedFile.size ) );
        setUploadProgress( 10 ); // Iniciar la simulación de progreso
        setCurrentStep( 1 );
        setValidationResult( null );

        // Validar el archivo después de cargarlo
        try {
          const result = await validateExcelUsers( selectedFile );

          // Si el archivo no es válido (excede límites), mostrar mensaje y detener proceso
          if ( !result.isValid ) {
            toast.error(
              result.message || "El archivo excede los límites permitidos"
            );
            setValidationResult( result );
            setUploadProgress( 100 ); // Completar el progreso para mostrar el mensaje de error
            setCurrentStep( 2 );
            return;
          }

          // Si es válido, continuar con el proceso normal
          setValidationResult( result );
        } catch ( error ) {
          toast.error( "Error al validar el archivo Excel" );
          setFile( null );
          setFileName( "" );
          setFileSize( "" );
          setUploadProgress( 0 );
        }
      }
    },
    onDropRejected: ( fileRejections: any[] ) => {
      const error = fileRejections[ 0 ]?.errors[ 0 ];
      if ( error?.code === "file-too-large" ) {
        toast.error( "El archivo excede el límite de 10MB" );
      } else if ( error?.code === "file-invalid-type" ) {
        toast.error( "Solo se aceptan archivos Excel (.xls, .xlsx)" );
      } else {
        toast.error( "Error al cargar el archivo" );
      }
    },
    onDragEnter: () => {
      setIsDragActive( true );
    },
    onDragLeave: () => {
      setIsDragActive( false );
    },
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive: internalIsDragActive,
    open, // Añadir esta función explícitamente para abrir el selector de archivos
  } = useDropzone( dropzoneOptions );

  // Sincronizar el estado interno del dropzone con nuestro estado
  useEffect( () => {
    setIsDragActive( internalIsDragActive );
  }, [ internalIsDragActive ] );

  return (
    <div className="divide-gray-900/10 w-full shadow-md rounded-md px-8 py-6 dark:bg-gray-800 dark:text-gray-100 dark:shadow-2xl">
      { ( loading || isValidating ) && <LoadingRegister /> }
      <form
        className="bg-white shadow-sm ring-1 w-full flex-col justify-center mx-auto ring-gray-900/5 sm:rounded-xl overflow-hidden dark:bg-gray-800"
        onSubmit={ handleRegisterCondominiums }
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registro de Condóminos
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Importa la lista de usuarios del condominio mediante un archivo
            Excel
          </p>

          {/* Información de límites */ }
          <div className="mt-3 flex items-center text-sm">
            <InformationCircleIcon className="w-4 h-4 text-indigo-500 mr-1" />
            <span className="text-indigo-700 dark:text-indigo-300">
              { limitInfo.currentUserCount } de { limitInfo.condominiumLimit }{ " " }
              usuarios permitidos registrados
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 dark:bg-gray-800 dark:text-gray-100">
          {/* Paso 1: Selección/Carga de archivo */ }
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h4 className="text-md font-semibold">
                Selecciona tu archivo Excel
              </h4>
            </div>

            {/* Área de carga de archivo mejorada con animaciones */ }
            <div
              { ...getRootProps() }
              className={ `
                relative transition-all duration-500 overflow-hidden
                p-8 border-2 border-dashed rounded-2xl 
                flex flex-col items-center justify-center min-h-[280px]
                cursor-pointer group
                ${ isDragActive
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-pink-900/20 scale-105 shadow-2xl"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                }
                ${ file
                  ? "bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/30 dark:via-blue-900/20 dark:to-cyan-900/20 border-indigo-400 shadow-xl"
                  : "hover:shadow-lg"
                }
              `}
            >
              <input { ...getInputProps() } />

              {/* Iconos orbitales - solo cuando NO hay archivo */ }
              { !file && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Centro de órbita */ }
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Órbita 1 */ }
                    <div className="animate-orbit">
                      <TableCellsIcon className="w-6 h-6 text-indigo-400 dark:text-indigo-500 opacity-60" />
                    </div>
                    {/* Órbita 2 */ }
                    <div
                      className="animate-orbit"
                      style={ { animationDelay: "-5s" } }
                    >
                      <DocumentCheckIcon className="w-5 h-5 text-purple-400 dark:text-purple-500 opacity-50" />
                    </div>
                    {/* Órbita 3 */ }
                    <div
                      className="animate-orbit"
                      style={ { animationDelay: "-10s" } }
                    >
                      <ArrowUpTrayIcon className="w-5 h-5 text-pink-400 dark:text-pink-500 opacity-50" />
                    </div>
                    {/* Órbita 4 */ }
                    <div
                      className="animate-orbit"
                      style={ { animationDelay: "-15s" } }
                    >
                      <CheckCircleIcon className="w-4 h-4 text-cyan-400 dark:text-cyan-500 opacity-40" />
                    </div>

                    {/* Órbita inversa 1 */ }
                    <div className="animate-orbit-reverse">
                      <DocumentPlusIcon className="w-6 h-6 text-blue-400 dark:text-blue-500 opacity-50" />
                    </div>
                    {/* Órbita inversa 2 */ }
                    <div
                      className="animate-orbit-reverse"
                      style={ { animationDelay: "-8s" } }
                    >
                      <TableCellsIcon className="w-5 h-5 text-indigo-300 dark:text-indigo-600 opacity-40" />
                    </div>
                    {/* Órbita inversa 3 */ }
                    <div
                      className="animate-orbit-reverse"
                      style={ { animationDelay: "-16s" } }
                    >
                      <DocumentCheckIcon className="w-4 h-4 text-purple-300 dark:text-purple-600 opacity-35" />
                    </div>
                  </div>
                </div>
              ) }

              { !file ? (
                <>
                  {/* Icono central con animación flotante */ }
                  <div className="relative z-10 animate-float">
                    <div className="relative">
                      {/* Glow effect */ }
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse-glow"></div>

                      <DocumentPlusIcon
                        className={ `
                        relative w-20 h-20 mb-4 transition-all duration-500
                        ${ isDragActive
                            ? "text-indigo-600 dark:text-indigo-400 scale-110"
                            : "text-indigo-400 dark:text-indigo-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:scale-105"
                          }
                      `}
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-3 relative z-10">
                    <p className="text-lg font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                      { isDragActive
                        ? "¡Suelta el archivo aquí!"
                        : "Arrastra tu archivo Excel aquí" }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      o haz clic para seleccionar
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                        .xls
                      </span>
                      <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                        .xlsx
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>máx. 10MB</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="relative mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                              rounded-xl text-sm font-semibold overflow-hidden
                              flex items-center shadow-lg hover:shadow-xl
                              transform transition-all duration-300
                              group/btn z-10"
                    onClick={ ( e ) => {
                      e.stopPropagation();
                      open();
                    } }
                  >
                    <div className="absolute inset-0 shimmer-effect-slow"></div>
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Seleccionar archivo</span>
                  </button>
                </>
              ) : (
                <div className="w-full relative z-10 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-md opacity-50 animate-pulse"></div>
                        <DocumentCheckIcon className="relative w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          { fileName }
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          { fileSize }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={ ( e ) => {
                        e.stopPropagation();
                        setFile( null );
                        setFileName( "" );
                        setFileSize( "" );
                        setUploadProgress( 0 );
                        setCurrentStep( 1 );
                        setValidationResult( null );
                      } }
                      className="text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110 hover:rotate-90"
                      type="button"
                    >
                      <XCircleIcon className="w-7 h-7" />
                    </button>
                  </div>

                  { uploadProgress < 100 ? (
                    <div className="w-full space-y-2">
                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                          style={ { width: `${ uploadProgress }%` } }
                        >
                          <div className="absolute inset-0 shimmer-effect"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <svg
                            className="animate-spin h-3 w-3"
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
                          Procesando archivo...
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          { uploadProgress }%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-lg">
                      <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600 dark:text-green-400 animate-bounce" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Archivo listo para importar
                      </span>
                    </div>
                  ) }
                </div>
              ) }
            </div>

            {/* Información y ayuda con diseño mejorado */ }
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl flex items-start dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <ExclamationCircleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-100 font-semibold mb-1">
                  📋 Formato requerido
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                  Es importante que utilices la plantilla de ejemplo para
                  importar los usuarios.
                </p>
                <p className="text-xs text-gray-500 mb-4 dark:text-gray-400">
                  <strong>Importante:</strong> para el registro masivo, únicamente la columna
                  <strong> name / nombre</strong> es obligatoria. El resto de
                  campos son opcionales.
                </p>
                <button
                  type="button"
                  onClick={ () => setIsColumnsGuideOpen( true ) }
                  className="mb-4 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 mr-2 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                  ¿Cómo funciona cada columna del Excel?
                </button>
                <a
                  href="https://res.cloudinary.com/dz5tntwl1/raw/upload/v1772080563/OmniPixel/plantilla_ejemplo_g7mtmu.xlsx"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <TableCellsIcon className="w-4 h-4 mr-2" />
                  Descargar plantilla de ejemplo
                </a>
              </div>
            </div>
          </div>

          {/* Paso 2: Confirmación (solo se muestra cuando se ha cargado un archivo y procesado) */ }
          { currentStep === 2 && file && uploadProgress === 100 && (
            <div className="mb-6 animate-fadeIn border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm font-semibold">
                  2
                </span>
                <h4 className="text-md font-semibold">
                  { validationResult?.isValid
                    ? "Confirmar importación"
                    : "Error de validación" }
                </h4>
              </div>

              { validationResult?.isValid ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Archivo seleccionado:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      { fileName }
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tamaño del archivo:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      { fileSize }
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usuarios a importar:
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      { validationResult.excelUserCount } usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usuarios actuales:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      { limitInfo.currentUserCount } usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Límite del plan:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      { limitInfo.condominiumLimit } usuarios
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total después de importar:
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      { limitInfo.currentUserCount +
                        ( validationResult?.excelUserCount || 0 ) }{ " " }
                      de { limitInfo.condominiumLimit } usuarios
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
                        { validationResult?.message ||
                          "El archivo excede los límites de usuarios permitidos." }
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Usuarios a importar:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            { validationResult?.excelUserCount } usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Usuarios actuales:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            { limitInfo.currentUserCount } usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Límite del plan:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            { limitInfo.condominiumLimit } usuarios
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Total después de importar:
                          </span>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            { limitInfo.currentUserCount +
                              ( validationResult?.excelUserCount || 0 ) }{ " " }
                            de { limitInfo.condominiumLimit } usuarios
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) }

              { validationResult?.isValid && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    Al importar, los usuarios serán agregados al sistema. Esta
                    acción no se puede deshacer.
                  </p>
                </div>
              ) }
            </div>
          ) }
        </div>

        {/* Botones de acción */ }
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-200 px-6 py-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            onClick={ () => {
              setFile( null );
              setFileName( "" );
              setFileSize( "" );
              setUploadProgress( 0 );
              setCurrentStep( 1 );
              setValidationResult( null );
            } }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="relative px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none overflow-hidden group"
            disabled={
              !file ||
              uploadProgress < 100 ||
              ( validationResult !== null && validationResult.isValid === false )
            }
          >
            <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity"></div>
            { file && uploadProgress < 100 ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white relative z-10"
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
                <span className="relative z-10">Procesando</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5 mr-2 relative z-10 group-hover:animate-bounce" />
                <span className="relative z-10">Importar usuarios</span>
              </>
            ) }
          </button>
        </div>
      </form>

      { isColumnsGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white dark:border-gray-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                  Como Funciona
                </p>
                <h4 className="text-lg font-bold">
                  Guía de columnas para importación masiva
                </h4>
                <p className="mt-1 text-sm text-indigo-100">
                  Para un registro correcto, solo <strong>name</strong> es obligatorio.
                </p>
              </div>
              <button
                type="button"
                onClick={ () => setIsColumnsGuideOpen( false ) }
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
                aria-label="Cerrar guía"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-5 py-4">
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                Recomendación: usa la plantilla oficial y no cambies los nombres
                de los encabezados.
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Columna
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        ¿Qué dato va?
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ejemplo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Requerido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    { excelColumnsGuide.map( ( item ) => (
                      <tr key={ item.column }>
                        <td className="px-3 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          { item.column }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                          { item.description }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          { item.example }
                        </td>
                        <td className="px-3 py-2 text-sm">
                          { item.required ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              No
                            </span>
                          ) }
                        </td>
                      </tr>
                    ) ) }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
};

export default UsersRegistrationForm;
