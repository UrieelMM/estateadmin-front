import { useEffect, useState } from "react";
import { useConfigStore } from "../store/useConfigStore";

export const useMaintenanceAppAccess = () => {
  const hasMaintenanceApp = useConfigStore((state) => state.hasMaintenanceApp);
  const checkMaintenanceAppAccess = useConfigStore(
    (state) => state.checkMaintenanceAppAccess
  );
  const [loadingMaintenanceAccess, setLoadingMaintenanceAccess] =
    useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAccess = async () => {
      try {
        setLoadingMaintenanceAccess(true);
        await checkMaintenanceAppAccess();
      } finally {
        if (mounted) {
          setLoadingMaintenanceAccess(false);
        }
      }
    };
    checkAccess();
    return () => {
      mounted = false;
    };
  }, [checkMaintenanceAppAccess]);

  return {
    hasMaintenanceApp,
    loadingMaintenanceAccess,
  };
};

