import { useEffect, useCallback, useState } from "react";
import { driver, DriveStep, AllowedButtons, Config } from "driver.js";
import "driver.js/dist/driver.css";
import "../styles/tour.css";
import { auth } from "../firebase/firebase";
import { getIdTokenResult } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

export type TutorialType = "welcome" | "finance" | "community" | "operations";

export const useTutorials = () => {
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

  // Helper para expandir menús
  const expandMenu = (menuId: string) => {
    // Intentamos buscar primero el ID de escritorio, si no existe (móvil), buscamos el normal si existiera
    // Nota: Los IDs principales (#nav-usuarios etc) también deberíamos asegurarnos que son únicos o usar el de escritorio
    // Por ahora asumimos que los principales son únicos o que el querySelector pilla el visible.
    // Pero para ser seguros, sería ideal prefijar también los categorías principales.
    // Sin embargo, para no romper todo el Layout ahora, usaremos los selectores existentes para categorías padres,
    // y asumiremos que el desktop es el target principal.
    
    // Si queremos soportar móvil y desktop, necesitaríamos detectar si es móvil.
    // Por simplicidad, asumiremos Desktop para el tour (width >= 1024px o similar).
    
    const button = document.querySelector(menuId) as HTMLButtonElement;
    if (button && button.getAttribute('aria-expanded') !== 'true') {
      button.click();
    }
  };

  // Helper para cerrar todos los menús, con opción de exclusión
  const closeAllMenus = (exceptIds: string[] = []) => {
    const menuIds = [
      "#nav-usuarios",
      "#nav-finanzas", 
      "#nav-comunidad",
    ];
    
    menuIds.forEach(id => {
       if (exceptIds.includes(id)) return;

       const button = document.querySelector(id) as HTMLButtonElement;
       if (button && button.getAttribute('aria-expanded') === 'true') {
         button.click();
       }
    });
  };

  const getStepsForTutorial = (type: TutorialType): DriveStep[] => {
    // Función auxiliar para IDs de items
    // Asumimos Desktop por defecto para los selectores del tour
    const getSubId = (name: string) => `#nav-sub-desktop-${name}`;

    switch (type) {
      case "welcome":
        return [
          {
            popover: {
              title: "¡Bienvenido a EstateAdmin!",
              description:
                "Te guiaremos por las principales funcionalidades del sistema para que puedas aprovechar al máximo todas las herramientas disponibles.",
            },
          },
          {
            element: "#nav-usuarios",
            onHighlightStarted: () => {
                closeAllMenus(["#nav-usuarios"]);
                expandMenu("#nav-usuarios");
            },
            popover: {
              title: "Gestión de Residentes",
              description:
                "Administra el padrón de condóminos, registra nuevas familias y gestiona el acceso de usuarios al sistema.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#nav-finanzas",
            onHighlightStarted: () => {
                closeAllMenus(["#nav-finanzas"]);
                expandMenu("#nav-finanzas");
            },
            popover: {
              title: "Control Financiero",
              description:
                "El corazón de la administración. Gestiona cuotas, ingresos extraordinarios, egresos y mantén las cuentas claras.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#nav-mantenimiento",
            onHighlightStarted: () => closeAllMenus(),
            popover: {
              title: "Mantenimiento",
              description:
                "Da seguimiento a los trabajos realizados, incidencias reportadas y planes de mantenimiento preventivo.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#nav-configuracion",
            onHighlightStarted: () => closeAllMenus(),
            popover: {
              title: "Configuración Global",
              description:
                "Ajusta los parámetros del condominio, cuentas bancarias y preferencias del sistema.",
              side: "right",
              align: "start",
            },
          },
        ];
      case "finance":
        return [
          {
             popover: {
              title: "Módulo de Finanzas",
              description: "Profundicemos en las herramientas financieras para una administración transparente y eficiente.",
             }
          },
          {
            element: "#nav-finanzas",
            onHighlightStarted: () => expandMenu("#nav-finanzas"),
            popover: {
              title: "Menú Financiero",
              description: "Este menú contiene todas las herramientas contables.",
               side: "right",
               align: "start",
            }
          },
          {
            element: getSubId("ingresos"),
            onHighlightStarted: () => expandMenu("#nav-finanzas"),
            popover: {
              title: "Ingresos",
              description: "Registra pagos de mantenimiento, cuotas extraordinarias y genera recibos para los residentes.",
              side: "right",
              align: "start",
            },
          },
           {
            element: getSubId("caja-chica"),
            onHighlightStarted: () => expandMenu("#nav-finanzas"),
            popover: {
              title: "Caja Chica",
              description: "Controla el flujo de efectivo diario para gastos menores, con arqueos y reposiciones.",
              side: "right",
              align: "start",
            },
          },
          {
             element: getSubId("egresos"),
             onHighlightStarted: () => expandMenu("#nav-finanzas"),
             popover: {
               title: "Egresos",
               description: "Registra y categoriza cada gasto del condominio, asociando facturas y comprobantes.",
               side: "right",
               align: "start",
             }
          },
          {
            element: getSubId("cargos"),
            onHighlightStarted: () => expandMenu("#nav-finanzas"),
            popover: {
              title: "Cargos",
              description: "Configura y asigna cargos recurrentes o únicos a las unidades privativas.",
              side: "right",
              align: "start",
            },
          },
           {
            element: getSubId("proyectos"),
            onHighlightStarted: () => expandMenu("#nav-finanzas"),
            popover: {
              title: "Proyectos",
              description: "Gestiona presupuestos y fondos específicos para mejoras o proyectos especiales del condominio.",
              side: "right",
              align: "start",
            },
          }
        ];
      case "community":
        return [
          {
             popover: {
              title: "Comunidad y Áreas Comunes",
              description: "Herramientas para mejorar la convivencia y el uso de las instalaciones.",
             }
          },
          {
            element: "#nav-comunidad",
            onHighlightStarted: () => expandMenu("#nav-comunidad"),
            popover: {
              title: "Menú Comunidad",
              description: "Gestiona todo lo relacionado con la vida en comunidad y amenidades.",
              side: "right",
              align: "start",
            },
          },
          {
            // "Áreas comunes" -> normalized "areas-comunes"
            element: getSubId("areas-comunes"),
            onHighlightStarted: () => expandMenu("#nav-comunidad"),
            popover: {
              title: "Áreas Comunes",
              description: "Define las amenidades (alberca, gimnasio, salón), sus reglas de uso, aforos y horarios.",
              side: "right",
              align: "start",
            },
          },
          {
             element: getSubId("calendario"),
             onHighlightStarted: () => expandMenu("#nav-comunidad"),
             popover: {
               title: "Calendario",
               description: "Visualiza y gestiona las reservas de amenidades, eventos del condominio y mantenimientos.",
               side: "right",
               align: "start",
             }
          },
          {
             element: getSubId("publicaciones"),
             onHighlightStarted: () => expandMenu("#nav-comunidad"),
             popover: {
               title: "Publicaciones",
               description: "Crea comunicados oficiales, noticias o avisos importantes para toda la comunidad.",
               side: "right",
               align: "start",
             }
          }
        ];
      case "operations":
        return [
           {
             popover: {
              title: "Operaciones y Servicios",
              description: "Todo lo necesario para el funcionamiento diario del condominio.",
             }
          },
          {
            element: "#nav-mantenimiento",
            popover: {
              title: "Reportes",
              description: "Atiende las solicitudes de los residentes y asigna trabajos al personal de mantenimiento.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#nav-proveedores",
            popover: {
              title: "Directorio de Proveedores",
              description: "Mantén una agenda actualizada de contratistas y servicios externos con sus datos de contacto.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#nav-inventario",
            popover: {
              title: "Inventario de Activos",
              description: "Lleva el control de herramientas, insumos y mobiliario propiedad del condominio.",
              side: "right",
              align: "start",
            },
          },
           {
            element: "#nav-personal",
            popover: {
              title: "Gestión de Personal",
              description: "Administra la información de los empleados, horarios y asignaciones.",
              side: "right",
              align: "start",
            },
          }
        ];
      default:
        return [];
    }
  };

  const startTutorial = useCallback((type: TutorialType) => {
    // Cerrar cualquier menú expandido para asegurar consistencia
    closeAllMenus();

    const steps = getStepsForTutorial(type);
    
    // Usamos 'let' para que driverObj esté disponible en el closure de onDestroyStarted
    let driverObj: any;

    const driverConfig: Config = {
      showProgress: true,
      showButtons: ["next", "previous", "close"] as AllowedButtons[],
      animate: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: false,
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      progressText: "{{current}} de {{total}}",
      steps: steps,
      onDestroyStarted: () => {
        if (type === "welcome") {
           markTourCompleted();
        }
        // Forzamos la destrucción para asegurar que se cierre
        if (driverObj) {
            driverObj.destroy();
        }
      },
    };

    driverObj = driver(driverConfig);
    driverObj.drive();
  }, [markTourCompleted]);

  // Exponer una función específica para iniciar el tour de bienvenida automáticamente
  const checkAndStartWelcomeTour = useCallback(async () => {
      if (!clientId) return;

      const tourCompleted = await checkTourCompleted();

      if (!tourCompleted) {
        // Pequeño delay para asegurar renderizado
        const timer = setTimeout(() => {
          startTutorial("welcome");
        }, 1000);
        return () => clearTimeout(timer);
      }
  }, [clientId, checkTourCompleted, startTutorial]);

  // Hook de efecto para el inicio automático solo del welcome tour
  useEffect(() => {
    checkAndStartWelcomeTour();
  }, [checkAndStartWelcomeTour]);


  const resetWelcomeTour = useCallback(async () => {
    if (!clientId) return;

    try {
      const clientDocRef = doc(db, "clients", clientId);
      await setDoc(clientDocRef, {
        appTourCompleted: false,
        appTourResetAt: new Date().toISOString(),
      }, { merge: true });
      startTutorial("welcome");
    } catch (error) {
      console.error("Error al reiniciar el tour:", error);
    }
  }, [clientId, startTutorial]);

  return { startTutorial, resetWelcomeTour };
};
