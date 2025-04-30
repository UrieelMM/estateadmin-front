import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  LightBulbIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import { usePettyCashStore } from "../../../../../../store/pettyCashStore";
import { usePaymentStore } from "../../../../../../store/usePaymentStore";

// Objeto con los nombres de los meses en español
const spanishMonths: Record<number, string> = {
  0: "Enero",
  1: "Febrero",
  2: "Marzo",
  3: "Abril",
  4: "Mayo",
  5: "Junio",
  6: "Julio",
  7: "Agosto",
  8: "Septiembre",
  9: "Octubre",
  10: "Noviembre",
  11: "Diciembre"
};

// Asegurar que moment use el idioma español
moment.locale("es");

const PettyCashSetupForm: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  // Hook para navegación programatica
  const navigate = useNavigate();
  const { setupPettyCash, loading, error: storeError } = usePettyCashStore();
  const { financialAccounts, fetchFinancialAccounts } = usePaymentStore();

  // Estados del formulario
  const [initialAmount, setInitialAmount] = useState("");
  const [thresholdAmount, setThresholdAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [periodName, setPeriodName] = useState(
    `Caja Chica ${spanishMonths[new Date().getMonth()]} ${new Date().getFullYear()}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar las cuentas financieras
    fetchFinancialAccounts();
  }, [fetchFinancialAccounts]);

  // Filtrar solo cuentas de efectivo activas
  const cashAccounts = financialAccounts.filter(
    (account) =>
      account.type &&
      (account.type.toLowerCase() === "efectivo" ||
        account.type.toLowerCase() === "cash")
  );

  // Buscar automáticamente la cuenta de Caja Chica
  useEffect(() => {
    if (cashAccounts.length > 0 && !accountId) {
      const pettyCashAccount = cashAccounts.find(
        (account) =>
          account.name.toLowerCase().includes("caja chica") ||
          account.name.toLowerCase().includes("cajachica")
      );

      if (pettyCashAccount) {
        setAccountId(pettyCashAccount.id || "");
      }
    }
  }, [cashAccounts, accountId]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validaciones
      if (
        !initialAmount ||
        !thresholdAmount ||
        !accountId ||
        !periodName.trim()
      ) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      const initialValue = parseFloat(initialAmount);
      const thresholdValue = parseFloat(thresholdAmount);

      if (isNaN(initialValue) || initialValue <= 0) {
        throw new Error("El monto inicial debe ser un número mayor que cero");
      }

      if (isNaN(thresholdValue) || thresholdValue <= 0) {
        throw new Error("El monto mínimo debe ser un número mayor que cero");
      }

      if (thresholdValue >= initialValue) {
        throw new Error("El monto mínimo debe ser menor que el monto inicial");
      }

      // Obtener el nombre de la cuenta seleccionada
      const selectedAccount = financialAccounts.find(
        (acc) => acc.id === accountId
      );
      if (!selectedAccount) {
        throw new Error("La cuenta seleccionada no es válida");
      }

      // Configurar la caja chica
      await setupPettyCash({
        initialAmount: initialValue,
        thresholdAmount: thresholdValue,
        accountId,
        accountName: selectedAccount.name,
        active: true,
        period: periodName,
        startDate: new Date().toISOString(), // Añadimos la fecha de inicio
      });

      // Marcar como exitoso
      setSuccess(true);

      // Redirigir al dashboard tras un breve retraso
      setTimeout(() => {
        try {
          // Primero intentar usar el callback si se provee
          if (onSuccess) {
            onSuccess();
          } else {
            // Usar el navigate para manejar la navegación del lado del cliente
            // sin forzar una recarga completa (SPA behavior)
            navigate("/dashboard/pettycash", {
              replace: true,
              // Evitar que se recargue la página
              state: { fromSetup: true },
            });
          }
        } catch (err) {
          console.error("Error en la navegación:", err);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al configurar la caja chica");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <LightBulbIcon className="h-6 w-6 text-indigo-500 mr-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Configuración Inicial de Caja Chica
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-9">
          Configura los parámetros iniciales para comenzar a usar el módulo de
          Caja Chica
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mensajes de éxito o error */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <p>
              ¡Caja chica configurada correctamente! El módulo está listo para
              usarse.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center">
            <XMarkIcon className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {storeError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center">
            <XMarkIcon className="h-5 w-5 mr-2" />
            <p>{storeError}</p>
          </div>
        )}

        {/* Explicación del módulo */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            La Caja Chica es un fondo fijo de dinero en efectivo destinado a
            cubrir gastos menores. Para configurarla, necesitas especificar el
            monto inicial (el dinero con el que inicias), un umbral mínimo (para
            recibir alertas cuando el saldo sea bajo) y seleccionar la cuenta
            financiera de tipo efectivo que usarás para este fin.
          </p>
        </div>

        {/* Nombre del periodo */}
        <div>
          <label
            htmlFor="periodName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Nombre del periodo *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              id="periodName"
              name="periodName"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              required
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ej: Caja Chica Enero 2025"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Nombre o identificador para este periodo de caja chica
          </p>
        </div>

        {/* Selector de cuenta */}
        <div>
          <label
            htmlFor="accountId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Cuenta de efectivo *
          </label>
          <select
            id="accountId"
            name="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">-- Seleccionar cuenta --</option>
            {cashAccounts.length > 0 ? (
              cashAccounts.map((account) => (
                <option key={account.id} value={account.id || ""}>
                  {account.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No hay cuentas de efectivo disponibles
              </option>
            )}
          </select>
          {cashAccounts.length === 0 && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              No hay cuentas de efectivo disponibles. Primero debes crear una
              cuenta de tipo "Efectivo".
            </p>
          )}
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="initialAmount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monto inicial (MXN) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <input
                type="number"
                id="initialAmount"
                name="initialAmount"
                step="0.01"
                min="0.01"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                required
                className="block w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="1000.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Monto con el que inicia la caja chica (dinero físico disponible)
            </p>
          </div>

          <div>
            <label
              htmlFor="thresholdAmount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monto mínimo (MXN) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <input
                type="number"
                id="thresholdAmount"
                name="thresholdAmount"
                step="0.01"
                min="0.01"
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(e.target.value)}
                required
                className="block w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="200.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Umbral para recibir alertas cuando el saldo sea bajo
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash", { replace: true })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading || cashAccounts.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Configurando...
              </>
            ) : (
              "Configurar Caja Chica"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PettyCashSetupForm;
