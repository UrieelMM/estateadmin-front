import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { usePettyCashStore } from "../../../../../store/pettyCashStore";
import { usePaymentStore } from "../../../../../store/usePaymentStore";
import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/solid";

// Componentes internos
import PettyCashDashboard from "./components/PettyCashDashboard";
import PettyCashExpenseForm from "./components/PettyCashExpenseForm";
import PettyCashAuditForm from "./components/PettyCashAuditForm";
import PettyCashReplenishForm from "./components/PettyCashReplenishForm";
import PettyCashSetupForm from "./components/PettyCashSetupForm";
import PettyCashTransactions from "./components/PettyCashTransactions";
import PettyCashAudits from "./components/PettyCashAudits";
import PettyCashHistory from "./components/PettyCashHistory";
import PettyCashFinalize from "./components/PettyCashFinalize";

/**
 * Componente principal para el módulo de Caja Chica
 * Integra todos los subcomponentes y el enrutamiento interno
 * Implementa rutas anidadas para evitar recargas completas de la página
 */
const PettyCash: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSubNavigation, setShowSubNavigation] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const { fetchConfig } = usePettyCashStore();
  const { fetchFinancialAccounts, financialAccounts } = usePaymentStore();

  // Efecto para cargar las cuentas financieras al inicio
  useEffect(() => {
    const preloadData = async () => {
      try {
        await fetchFinancialAccounts();
      } catch {
      } finally {
        // Evita que la pantalla quede bloqueada en loading si la precarga falla.
        setAccountsLoaded(true);
      }
    };

    preloadData();
  }, [fetchFinancialAccounts]);

  // Efecto para configurar navegación y cargar datos de caja chica
  useEffect(() => {
    // Determinar si mostrar la navegación secundaria
    // Solo se muestra cuando no estamos en la ruta principal o index
    const isPettyCashIndex =
      location.pathname === "/dashboard/pettycash" ||
      location.pathname === "/dashboard/pettycash/";
    setShowSubNavigation(!isPettyCashIndex);

    // Cargar la configuración al inicio
    fetchConfig();
  }, [location.pathname, fetchConfig]);

  // Renderizar spinner de carga mientras se cargan las cuentas financieras
  if (!accountsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Cargando cuentas financieras...
        </p>
      </div>
    );
  }

  // Función para navegar entre secciones sin perder el contexto
  const navigateToSection = (path: string) => {
    // Usamos navigate relativo para evitar recargas completas
    navigate(path, { replace: false });
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Navegación secundaria (volver atrás o a inicio) */}
      {showSubNavigation && (
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Volver
          </button>
          <button
            onClick={() => navigateToSection("")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <HomeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Inicio Caja Chica
          </button>
        </div>
      )}

      {/* Indicador de cuentas cargadas */}
      {financialAccounts.length > 0 && (
        <div className="hidden">
          {/* Este div no se muestra pero ayuda a mantener la referencia a las cuentas cargadas */}
          Cuentas cargadas: {financialAccounts.length}
        </div>
      )}

      {/* Implementación de rutas anidadas para evitar recargas completas */}
      <Routes>
        {/* Ruta principal (dashboard de caja chica) */}
        <Route index element={<PettyCashDashboard />} />

        {/* Configuración de caja chica */}
        <Route
          path="setup"
          element={
            <PettyCashSetupForm onSuccess={() => navigateToSection("")} />
          }
        />

        {/* Registro de gastos */}
        <Route path="expense" element={<PettyCashExpenseForm />} />

        {/* Cierre de caja */}
        <Route path="audit" element={<PettyCashAuditForm />} />

        {/* Reposición de fondos */}
        <Route path="replenish" element={<PettyCashReplenishForm />} />

        {/* Administración de Cierres */}
        <Route path="audits" element={<PettyCashAudits />} />

        {/* Listado de transacciones */}
        <Route path="transactions" element={<PettyCashTransactions />} />

        {/* Historial de cajas */}
        <Route path="history" element={<PettyCashHistory />} />

        {/* Finalizar caja actual y crear nueva */}
        <Route path="finalize" element={<PettyCashFinalize />} />

        {/* Redirección por defecto al dashboard */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </div>
  );
};

export default PettyCash;
