import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import { usePettyCashStore } from "../../../../../../store/pettyCashStore";
import { useFinancialAccountsStore } from "../../../../../../store/useAccountsStore";

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

moment.locale("es");

const PettyCashReplenishForm: React.FC = () => {
  const navigate = useNavigate();
  const {
    replenishFunds,
    currentBalance,
    fetchConfig,
    fetchTransactions,
    config,
    loading,
    error: storeError,
  } = usePettyCashStore();

  const { accounts, fetchAccounts } = useFinancialAccountsStore();

  // Estados del formulario
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState(
    `Reposición de fondos a caja chica - ${spanishMonths[new Date().getMonth()]} ${new Date().getFullYear()}`
  );
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      await fetchAccounts();
      await fetchConfig();
      await fetchTransactions();

      // Inicializar la descripción con un valor predeterminado
      setDescription(
        `Reposición de fondos a caja chica - ${spanishMonths[new Date().getMonth()]} ${new Date().getFullYear()}`
      );
    };

    loadData();
  }, [fetchConfig, fetchTransactions, fetchAccounts]);

  // Filtrar solo cuentas activas que no sean la caja chica
  const availableAccounts = accounts.filter(
    (account) => account.active && (!config || account.id !== config.accountId)
  );

  // Sugerir un monto de reposición (diferencia hasta el monto inicial)
  const getSuggestedAmount = () => {
    if (!config) return 0;
    const initialAmount = config.initialAmount / 100; // Convertir de centavos a pesos
    return Math.max(0, initialAmount - currentBalance);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validaciones
      if (!amount || !description || !date) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("El monto debe ser un número mayor que cero");
      }

      // Reponer fondos
      await replenishFunds(
        amountValue,
        description,
        moment(date).format("YYYY-MM-DDTHH:mm:ss"),
        sourceAccountId || undefined
      );

      const sourceAccountName = accounts.find(
        (account) => account.id === sourceAccountId
      )?.name;
      const formattedAmount = amountValue.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      if (sourceAccountName) {
        setSuccessMessage(
          `Reposición registrada: se sumó $${formattedAmount} a Caja Chica y se descontó $${formattedAmount} de ${sourceAccountName}.`
        );
      } else {
        setSuccessMessage(
          `Reposición registrada: se sumó $${formattedAmount} a Caja Chica.`
        );
      }

      // Limpiar formulario
      setAmount("");
      setDescription(
        `Reposición de fondos a caja chica - ${spanishMonths[new Date().getMonth()]} ${new Date().getFullYear()}`
      );
      setSuccess(true);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al reponer fondos");
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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Reposición de Fondos
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash")}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registra una reposición de efectivo a la caja chica
        </p>
        <div className="flex items-center mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            Saldo actual:
          </span>
          <span
            className={`font-semibold ${
              currentBalance < (config?.thresholdAmount || 0) / 100
                ? "text-amber-600 dark:text-amber-400"
                : "text-gray-800 dark:text-white"
            }`}
          >
            $
            {currentBalance.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mensajes de éxito o error */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <p>{successMessage || "Reposición registrada correctamente"}</p>
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

        {/* Banner informativo */}
        <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <BanknotesIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Acerca de la reposición de fondos</p>
            <p className="mt-1">
              La reposición agrega efectivo a la caja chica. Para completar el
              proceso:
            </p>
            <ol className="list-decimal list-inside mt-1 ml-2">
              <li>Registra la reposición en este formulario</li>
              <li>
                Realiza un retiro físico de la cuenta bancaria seleccionada
              </li>
              <li>Deposita el efectivo en la caja chica</li>
            </ol>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monto (MXN) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            {config && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(getSuggestedAmount().toString())}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Sugerir monto para reponer al saldo inicial ($
                  {(config.initialAmount / 100).toFixed(2)})
                </button>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fecha *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={moment().format("YYYY-MM-DD")}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="sourceAccount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Cuenta de origen (opcional)
            </label>
            <select
              id="sourceAccount"
              name="sourceAccount"
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">-- Seleccionar cuenta --</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selecciona la cuenta bancaria de donde provienen los fondos
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Describe el motivo de la reposición"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash", { replace: true })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300  dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Procesando...
              </>
            ) : (
              "Reponer Fondos"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PettyCashReplenishForm;
