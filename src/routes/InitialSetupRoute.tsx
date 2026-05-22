import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import InitialSetupSteps from "../presentation/screens/dashboard/InitialSetup/InitialSetupSteps";
import Loading from "../presentation/components/shared/loaders/Loading";
import { resolveInitialSetupStatus } from "./initialSetupStatus";

const InitialSetupRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requiresInitialSetup, setRequiresInitialSetup] = useState(true);
  const [initialStep, setInitialStep] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const checkInitialSetup = async () => {
      try {
        const status = await resolveInitialSetupStatus();
        if (!isMounted) return;
        setRequiresInitialSetup(status.requiresInitialSetup);
        setInitialStep(status.initialStep);
      } catch (error) {
        console.error("Error al verificar configuración inicial:", error);
        if (!isMounted) return;
        setRequiresInitialSetup(true);
        setInitialStep(7);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkInitialSetup();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (!requiresInitialSetup) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <InitialSetupSteps initialStep={initialStep} />;
};

export default InitialSetupRoute;
