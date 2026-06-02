import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import InitialSetupSteps from "../presentation/screens/dashboard/InitialSetup/InitialSetupSteps";
import Loading from "../presentation/components/shared/loaders/Loading";
import {
  resolveInitialSetupStatus,
  type InitialSetupMode,
} from "./initialSetupStatus";
import { auth } from "../firebase/firebase";

const InitialSetupRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requiresInitialSetup, setRequiresInitialSetup] = useState(true);
  const [initialStep, setInitialStep] = useState(1);
  const [mode, setMode] = useState<InitialSetupMode>("wizard");

  // Esperamos a que la sesión de Firebase esté lista antes de evaluar el
  // estado de configuración inicial. Al recargar la página, `currentUser`
  // puede aún ser `null` durante el primer render.
  useEffect(() => {
    let isMounted = true;

    const checkInitialSetup = async () => {
      try {
        const status = await resolveInitialSetupStatus();
        if (!isMounted) return;
        setRequiresInitialSetup(status.requiresInitialSetup);
        setInitialStep(status.initialStep);
        setMode(status.mode);
      } catch (error) {
        console.error("Error al verificar configuración inicial:", error);
        if (!isMounted) return;
        setRequiresInitialSetup(true);
        setInitialStep(7);
        setMode("wizard");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      checkInitialSetup();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  // Si solo falta el pago del condominio actual, el gate dedicado se monta
  // desde LayoutDashboard. Mandamos al home y el layout decide qué mostrar.
  if (mode === "condominium_payment" || !requiresInitialSetup) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <InitialSetupSteps initialStep={initialStep} />;
};

export default InitialSetupRoute;
