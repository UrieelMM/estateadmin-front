import { getFunctions, httpsCallable } from "firebase/functions";

// Manejo de sesión de Super Admin
let superAdminSessionToken: string | null = null;
let sessionExpiryTime: number | null = null;

// Set para evitar operaciones duplicadas
const pendingOperations = new Set<string>();

// Control de renovación de sesión
let sessionValidationTimer: NodeJS.Timeout | null = null;
let isValidatingSession = false;

/**
 * Inicializa una sesión de Super Admin verificando permisos con Cloud Functions
 */
export const initializeSuperAdminSession = async (): Promise<boolean> => {
  try {
    const functions = getFunctions();
    const verifySuperAdmin = httpsCallable(functions, "verifySuperAdminAccess");

    // Enviar información de contexto para auditoría
    const response = await verifySuperAdmin({
      ip: await fetch("https://api.ipify.org?format=json")
        .then((r) => r.json())
        .then((data) => data.ip)
        .catch(() => "unknown"),
      userAgent: navigator.userAgent,
    });

    // Almacenar el token de sesión (solo en memoria, no en localStorage por seguridad)
    const data = response.data as { sessionToken: string; expiresAt: number };
    superAdminSessionToken = data.sessionToken;
    sessionExpiryTime = data.expiresAt;

    // Configurar un temporizador para validar periódicamente la sesión
    startSessionValidationTimer();

    return true;
  } catch (error: any) {
    console.error("Error al inicializar sesión de Super Admin:", error);
    // Extraer mensaje de error de Firebase Functions
    let errorMessage = "Error de verificación de permisos";

    if (error?.customData?.serverResponse) {
      try {
        const serverError = JSON.parse(error.customData.serverResponse);
        if (serverError?.error?.message) {
          errorMessage = serverError.error.message;
        } else if (serverError?.error?.status) {
          if (serverError.error.status === "PERMISSION_DENIED") {
            errorMessage =
              "No tienes permisos suficientes para acceder al panel de Super Admin";
          } else if (serverError.error.status === "UNAUTHENTICATED") {
            errorMessage =
              "Tu sesión ha expirado. Por favor, inicia sesión nuevamente";
          }
        }
      } catch (parseError) {
        console.error("Error al analizar respuesta del servidor:", parseError);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Si hay un error, limpiar la sesión
    clearSessionData();
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene el token de sesión actual si es válido
 */
export const getSuperAdminSessionToken = (): string | null => {
  if (!superAdminSessionToken || !sessionExpiryTime) {
    return null;
  }

  // Verificar si la sesión ha expirado
  if (Date.now() > sessionExpiryTime) {
    clearSessionData();
    return null;
  }

  return superAdminSessionToken;
};

/**
 * Valida la sesión actual contra la Cloud Function
 */
export const validateSession = async (): Promise<boolean> => {
  if (!superAdminSessionToken || isValidatingSession) {
    return false;
  }

  try {
    isValidatingSession = true;

    const functions = getFunctions();
    const validateSuperAdminSession = httpsCallable(
      functions,
      "validateSuperAdminSession"
    );

    const response = await validateSuperAdminSession({
      sessionToken: superAdminSessionToken,
    });

    const data = response.data as { valid: boolean; expiresAt: number };

    if (data.valid) {
      // Actualizar el tiempo de expiración
      sessionExpiryTime = data.expiresAt;
      return true;
    }

    // Si no es válida, limpiar la sesión
    clearSessionData();
    return false;
  } catch (error) {
    console.error("Error al validar sesión:", error);
    clearSessionData();
    return false;
  } finally {
    isValidatingSession = false;
  }
};

/**
 * Ejecuta una operación de Super Admin a través de la Cloud Function
 */
export const executeSuperAdminOperation = async (
  operation: string,
  targetId: string,
  payload: any
): Promise<any> => {
  const sessionToken = getSuperAdminSessionToken();

  if (!sessionToken) {
    throw new Error("Sesión de Super Admin inválida o expirada");
  }

  // Crear un identificador único para la operación para evitar duplicados
  const operationId = `${operation}-${targetId}-${Date.now()}`;

  // Verificar si la operación ya está en progreso
  if (pendingOperations.has(operationId)) {
    throw new Error("La operación ya está en progreso");
  }

  try {
    // Marcar la operación como en progreso
    pendingOperations.add(operationId);

    const functions = getFunctions();
    const superAdminOperation = httpsCallable(functions, "superAdminOperation");

    const response = await superAdminOperation({
      sessionToken,
      operation,
      targetId,
      payload,
      requestId: operationId, // Enviar ID único para seguimiento en logs
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error al ejecutar operación ${operation}:`, error);

    // Extraer mensaje de error de Firebase Functions
    let errorMessage = `Error al realizar la operación: ${operation}`;

    if (error?.customData?.serverResponse) {
      try {
        const serverError = JSON.parse(error.customData.serverResponse);
        if (serverError?.error?.message) {
          errorMessage = serverError.error.message;
        }
      } catch (parseError) {
        console.error("Error al analizar respuesta del servidor:", parseError);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Para ciertos errores, invalidar la sesión
    if (
      errorMessage.includes("Sesión inválida") ||
      errorMessage.includes("No tienes permisos") ||
      error?.customData?.httpStatus === 403
    ) {
      clearSessionData();
    }

    throw new Error(errorMessage);
  } finally {
    // Eliminar la operación de las pendientes
    pendingOperations.delete(operationId);
  }
};

/**
 * Cierra la sesión de Super Admin
 */
export const clearSuperAdminSession = (): void => {
  clearSessionData();
};

// Funciones auxiliares
const clearSessionData = (): void => {
  superAdminSessionToken = null;
  sessionExpiryTime = null;

  // Limpiar el timer de validación
  if (sessionValidationTimer) {
    clearInterval(sessionValidationTimer);
    sessionValidationTimer = null;
  }
};

const startSessionValidationTimer = (): void => {
  // Limpiar timer existente si hay uno
  if (sessionValidationTimer) {
    clearInterval(sessionValidationTimer);
  }

  // Validar la sesión cada 10 minutos
  sessionValidationTimer = setInterval(async () => {
    if (superAdminSessionToken && sessionExpiryTime && !isValidatingSession) {
      // Solo validar si la sesión no expira en los próximos 20 minutos
      const twentyMinutesFromNow = Date.now() + 20 * 60 * 1000;

      if (sessionExpiryTime < twentyMinutesFromNow) {
        await validateSession();
      }
    } else if (!superAdminSessionToken) {
      // Si no hay token activo, detener el timer
      clearSessionData();
    }
  }, 10 * 60 * 1000); // 10 minutos
};
