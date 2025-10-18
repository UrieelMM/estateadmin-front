import { useEffect, useCallback, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../styles/tour.css";
import { auth } from "../firebase/firebase";
import { getIdTokenResult } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

export const useAppTour = () => {
  const [clientId, setClientId] = useState<string | null>(null);

  // Obtener el clientId del usuario autenticado
  useEffect(() => {
    const getClientId = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const tokenResult = await getIdTokenResult(currentUser);
          const id = tokenResult.claims.clientId as string;
          setClientId(id);
        }
      } catch (error) {
        console.error("Error al obtener clientId:", error);
      }
    };

    getClientId();
  }, []);

  // Función para verificar si el tour fue completado en Firebase
  const checkTourCompleted = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const clientDocRef = doc(db, "clients", clientId);
      const clientDoc = await getDoc(clientDocRef);
      
      if (clientDoc.exists()) {
        return clientDoc.data()?.appTourCompleted === true;
      }
      return false;
    } catch (error) {
      console.error("Error al verificar estado del tour:", error);
      return false;
    }
  }, [clientId]);

  // Función para marcar el tour como completado en Firebase
  const markTourCompleted = useCallback(async () => {
    if (!clientId) return;

    try {
      const clientDocRef = doc(db, "clients", clientId);
      await setDoc(clientDocRef, {
        appTourCompleted: true,
        appTourCompletedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error("Error al guardar estado del tour:", error);
    }
  }, [clientId]);

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      animate: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: false,
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      progressText: "{{current}} de {{total}}",
      steps: [
        {
          popover: {
            title: "¡Bienvenido a EstateAdmin!",
            description:
              "Te guiaremos por las principales funcionalidades del sistema para que puedas aprovechar al máximo todas las herramientas disponibles.",
          },
        },
        {
          element: "#nav-usuarios",
          popover: {
            title: "Sección de Usuarios",
            description:
              "Aquí puedes gestionar el registro de condóminos y ver toda la información de los residentes.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-finanzas",
          popover: {
            title: "Sección de Finanzas",
            description:
              "Administra ingresos, egresos, caja chica, cargos y genera reportes financieros completos.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-mantenimiento",
          popover: {
            title: "Sección de Mantenimiento ",
            description:
              "Gestiona reportes de mantenimiento, solicitudes y seguimiento de trabajos en el condominio.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-configuracion",
          popover: {
            title: "Configuración",
            description:
              "Aquí puedes configurar cuentas bancarias, revisar facturas por pagar, agregar nuevos usuarios administrativos y personalizar el sistema.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#novedades-guias",
          popover: {
            title: "Novedades y Guías",
            description:
              "Revisa constantemente esta sección para conocer nuevas funcionalidades, actualizaciones y guías que te ayudarán a conocer más.",
            side: "left",
            align: "start",
          },
        },
      ],
      onDestroyStarted: () => {
        // Marcar el tour como completado en Firebase
        markTourCompleted();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [markTourCompleted]);

  const resetTour = useCallback(async () => {
    if (!clientId) return;

    try {
      // Actualizar el estado del tour en el documento del cliente
      const clientDocRef = doc(db, "clients", clientId);
      await setDoc(clientDocRef, {
        appTourCompleted: false,
        appTourResetAt: new Date().toISOString(),
      }, { merge: true });
      startTour();
    } catch (error) {
      console.error("Error al reiniciar el tour:", error);
    }
  }, [clientId, startTour]);

  useEffect(() => {
    // Verificar si el usuario ya vio el tour en Firebase
    const checkAndStartTour = async () => {
      if (!clientId) return;

      const tourCompleted = await checkTourCompleted();

      if (!tourCompleted) {
        // Esperar un momento para que el DOM esté completamente cargado
        const timer = setTimeout(() => {
          startTour();
        }, 1000);

        return () => clearTimeout(timer);
      }
    };

    checkAndStartTour();
  }, [clientId, checkTourCompleted, startTour]);

  return { startTour, resetTour };
};
