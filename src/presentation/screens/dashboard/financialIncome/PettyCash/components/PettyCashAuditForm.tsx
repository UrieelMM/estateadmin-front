import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalculatorIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import { usePettyCashStore } from "../../../../../../store/pettyCashStore";

moment.locale("es");

// Componente Tooltip reutilizable
const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-indigo-500 cursor-pointer" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: "tween", stiffness: 20, damping: 20 }}
            className="absolute top-[20px] right-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 text-xs p-2 rounded z-10 w-64 whitespace-normal break-words shadow-[0_0_10px_rgba(79,70,229,0.3),0_0_50px_#8093e87b,0_0_10px_#c2abe6c5] dark:shadow-[0_0_10px_rgba(79,70,229,0.3),0_0_10px_#8093e8ac,0_0_50px_#c2abe6c1]"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PettyCashAuditForm: React.FC = () => {
  const navigate = useNavigate();
  const {
    createAudit,
    currentBalance,
    fetchConfig,
    fetchTransactions,
    loading,
    error: storeError,
  } = usePettyCashStore();

  // Estados del formulario
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [physicalAmount, setPhysicalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [theoreticalAmount, setTheoreticalAmount] = useState(0);
  const [difference, setDifference] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      await fetchConfig();
      await fetchTransactions();
      setTheoreticalAmount(currentBalance);
    };

    loadData();
  }, [fetchConfig, fetchTransactions]);

  // Actualizar diferencia cuando cambia el monto físico o teórico
  useEffect(() => {
    const physicalValue = parseFloat(physicalAmount) || 0;
    setDifference(physicalValue - theoreticalAmount);
  }, [physicalAmount, theoreticalAmount]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validaciones
      if (!physicalAmount) {
        throw new Error("Por favor ingresa el monto físico contado");
      }

      const physicalValue = parseFloat(physicalAmount);
      if (isNaN(physicalValue) || physicalValue < 0) {
        throw new Error(
          "El monto físico debe ser un número mayor o igual a cero"
        );
      }

      // Crear Cierre
      await createAudit({
        date: moment(date).format("YYYY-MM-DDTHH:mm:ss"),
        physicalAmount: physicalValue,
        notes: notes.trim() || undefined,
      });

      // Limpiar formulario
      setPhysicalAmount("");
      setNotes("");
      setSuccess(true);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al registrar el Cierre");
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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Cierre de Caja Chica
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registra el conteo físico del efectivo para reconciliar con el
              saldo del sistema
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash")}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mensajes de éxito o error */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <p>Cierre registrado correctamente</p>
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

        {/* Información del saldo teórico */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalculatorIcon className="h-6 w-6 text-indigo-500 mr-2" />
              <div className="flex items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Saldo según el sistema:
                </span>
                <div className="ml-2">
                  <Tooltip text="Este es el saldo calculado automáticamente por el sistema, basado en la suma de todos los ingresos menos todos los gastos registrados desde el último cierre." />
                </div>
              </div>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              $
              {theoreticalAmount.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Es lo que el sistema calcula que deberías tener en efectivo, basado
            en los movimientos registrados.
          </p>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fecha de Cierre *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={moment().format("YYYY-MM-DD")}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label
                htmlFor="physicalAmount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Dinero en efectivo actual (MXN) *
              </label>
              <div className="ml-2">
                <Tooltip text="Ingresa la cantidad exacta de dinero que encuentras al contar físicamente el efectivo disponible en la caja chica en este momento. Esta cantidad se comparará con el saldo teórico del sistema." />
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <input
                type="number"
                id="physicalAmount"
                name="physicalAmount"
                step="0.01"
                min="0"
                value={physicalAmount}
                onChange={(e) => setPhysicalAmount(e.target.value)}
                required
                className="block w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
                aria-describedby="physicalAmount-help"
              />
            </div>
            <p
              id="physicalAmount-help"
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Ingresa la cantidad total de dinero con el que cuentas físicamente
              en este momento.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Resultado del Cierre
              </h3>

              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Dinero en efectivo contado:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  $
                  {parseFloat(physicalAmount || "0").toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Saldo según sistema:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  $
                  {theoreticalAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Diferencia:
                </span>
                <span
                  className={`font-bold ${
                    difference === 0
                      ? "text-gray-900 dark:text-white"
                      : difference > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  $
                  {difference.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {difference !== 0 && (
                    <span className="ml-2 text-xs">
                      ({difference > 0 ? "sobrante" : "faltante"})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Notas y observaciones
            </label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Anota cualquier observación relevante del Cierre"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Si existe diferencia, por favor explica la posible causa.
            </p>
          </div>
        </div>

        {/* Información sobre la aprobación */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center">
            <BanknotesIcon className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Este Cierre quedará pendiente de aprobación. Una vez aprobado, se
              podrá realizar un ajuste automático para conciliar la diferencia
              si es necesario.
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
            disabled={isSubmitting || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Procesando...
              </>
            ) : (
              "Registrar Cierre"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PettyCashAuditForm;
