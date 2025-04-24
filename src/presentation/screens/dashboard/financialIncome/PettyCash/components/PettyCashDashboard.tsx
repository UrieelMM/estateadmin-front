import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LightBulbIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";
import moment from "moment";
import {
  usePettyCashStore,
  PettyCashTransactionType,
} from "../../../../../../store/pettyCashStore";
import { usePaymentStore } from "../../../../../../store/usePaymentStore";

const PettyCashDashboard: React.FC = () => {
  // Hook de navegación para redireccionar a la página de configuración
  const navigate = useNavigate();
  const {
    config,
    currentBalance,
    transactions,
    fetchConfig,
    fetchTransactions,
  } = usePettyCashStore();

  const { fetchFinancialAccounts, financialAccounts } = usePaymentStore();
  const [loading, setLoading] = useState(true);
  const [noAccount, setNoAccount] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ya no necesitamos el estado del modal, usamos navegación directa

  // Usamos useState en lugar de useRef para manejar el estado de inicialización
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [_shouldShowSetup, setShouldShowSetup] = useState<boolean>(false);

  // Efecto para la inicialización inicial y carga de datos
  useEffect(() => {
    // Función para cargar los datos necesarios
    const loadInitialData = async () => {
      if (isInitialized) return; // Evitar múltiples inicializaciones

      setLoading(true);
      setShouldShowSetup(false); // Reiniciar el estado

      try {
        // 1. Cargar cuentas financieras
        await fetchFinancialAccounts();

        // 2. Verificar si existe configuración de caja chica
        const configData = await fetchConfig();

        // 3. Si hay configuración, ya está listo
        if (configData) {
          setNoAccount(false);
          setShouldShowSetup(false);
          await fetchTransactions();
          setIsInitialized(true);
          return;
        }

        // 4. Si no hay configuración, verificar si existe una cuenta adecuada

        // Buscar una cuenta de caja chica activa
        const hasCashAccount = financialAccounts.some(
          (account) =>
            (account.name.toLowerCase().includes("caja chica") ||
              account.name.toLowerCase().includes("cajachica")) &&
            account.type &&
            (account.type.toLowerCase() === "efectivo" ||
              account.type.toLowerCase() === "cash")
        );

        if (hasCashAccount) {
          console.log("✅ Se encontró una cuenta de Caja Chica válida");
          setShouldShowSetup(true); // Mostrar opción de configuración
          setNoAccount(false); // No mostrar mensaje de crear cuenta
        } else {
          console.log("❌ No se encontró ninguna cuenta de Caja Chica válida");
          setNoAccount(true); // Mostrar mensaje de crear cuenta
        }

        // 5. Establecer como inicializado
        setIsInitialized(true);
      } catch (error) {
        console.error("Error durante la inicialización de Caja Chica:", error);
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar carga de datos
    loadInitialData();
  }, [fetchFinancialAccounts, fetchConfig, fetchTransactions]);

  // Efecto secundario cuando cambian las cuentas (después de inicialización)
  useEffect(() => {
    if (!isInitialized) return;

    // Verificar si existe una cuenta de caja chica entre las cuentas actuales
    const hasCashAccount = financialAccounts.some(
      (account) =>
        (account.name.toLowerCase().includes("caja chica") ||
          account.name.toLowerCase().includes("cajachica")) &&
        account.type &&
        (account.type.toLowerCase() === "efectivo" ||
          account.type.toLowerCase() === "cash")
    );

    setNoAccount(!hasCashAccount);
  }, [financialAccounts, isInitialized]);

  // Si no hay configuración y no hay cuenta de caja chica, mostrar mensaje para crear cuenta
  if (noAccount) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
        <div className="flex items-center mb-4 text-yellow-500">
          <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
          <h2 className="text-xl font-semibold">Configuración requerida</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Para utilizar el módulo de Caja Chica, primero debes crear una cuenta
          financiera de tipo "Efectivo" con el nombre "Caja Chica".
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate("/dashboard/financialAccounts")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Ir a Cuentas Financieras
          </button>
          <button
            onClick={() => navigate("setup")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Configurar de todos modos
          </button>
        </div>
      </div>
    );
  }

  // Si está cargando, mostrar estado de carga
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 flex justify-center items-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Si no hay configuración, mostrar pantalla de configuración inicial
  if (!config) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
        <div className="flex items-center mb-4 text-indigo-500">
          <LightBulbIcon className="h-8 w-8 mr-3" />
          <h2 className="text-xl font-semibold">Configuración inicial</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          El módulo de Caja Chica no ha sido configurado. Para iniciar, primero
          debes establecer el monto inicial.
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => navigate("setup")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Configurar Caja Chica
          </button>
        </div>
      </div>
    );
  }

  // Dashboard principal cuando ya hay configuración
  const latestTransactions = transactions.slice(0, 5); // Implementar obtención del último Cierre

  const getStatusColor = () => {
    if (currentBalance <= 0)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (currentBalance < config.thresholdAmount / 100)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden"
      >
        {/* Cabecera con saldo y acciones rápidas */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Caja Chica
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cuenta: {config.accountName || "Caja Chica"}
              </p>
            </div>

            <div className="mt-3 md:mt-0 flex flex-col items-end">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Saldo disponible
              </span>
              <div className="flex items-center">
                <span
                  className={`text-xl font-bold ${
                    currentBalance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-800 dark:text-white"
                  }`}
                >
                  $
                  {currentBalance.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor()}`}
                >
                  {currentBalance <= 0
                    ? "Sin fondos"
                    : currentBalance < config.thresholdAmount / 100
                    ? "Bajo mínimo"
                    : "Saludable"}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mínimo recomendado: $
                {(config.thresholdAmount / 100).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex justify-end">
            <div className="relative inline-block text-left">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                Acciones
                <svg
                  className="-mr-1 ml-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 focus:outline-none">
                  <div className="py-1">
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("expense");
                        setIsMenuOpen(false);
                      }}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-indigo-700 dark:text-indigo-400" />
                      <span>Registrar Gasto</span>
                    </button>

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("audit");
                        setIsMenuOpen(false);
                      }}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-emerald-700 dark:text-emerald-400" />
                      <span>Realizar Cierre</span>
                    </button>

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("replenish");
                        setIsMenuOpen(false);
                      }}
                    >
                      <BanknotesIcon className="h-5 w-5 mr-2 text-amber-700 dark:text-amber-400" />
                      <span>Reponer Fondos</span>
                    </button>

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("audits");
                        setIsMenuOpen(false);
                      }}
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400" />
                      <span>Administrar Cierres</span>
                    </button>

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("history");
                        setIsMenuOpen(false);
                      }}
                    >
                      <ClockIcon className="h-5 w-5 mr-2 text-purple-700 dark:text-purple-400" />
                      <span>Historial de Cajas</span>
                    </button>

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        navigate("finalize");
                        setIsMenuOpen(false);
                      }}
                    >
                      <ArrowUturnRightIcon className="h-5 w-5 mr-2 text-teal-700 dark:text-teal-400" />
                      <span>Finalizar Caja</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información resumida */}
        <div className="p-6">
          {/* Alertas si aplica */}
          {currentBalance < config.thresholdAmount / 100 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Saldo bajo mínimo recomendado</p>
                <p className="text-sm mt-1">
                  El saldo actual está por debajo del mínimo configurado de $
                  {(config.thresholdAmount / 100).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                  . Considera hacer una reposición de fondos.
                </p>
              </div>
            </div>
          )}

          {/* Nota sobre periodo actual */}
          {config?.period && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Periodo actual:{" "}
                    <span className="font-bold">{config.period}</span>
                  </p>
                  {config.startDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Inicio: {moment(config.startDate).format("DD/MM/YYYY")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Últimas transacciones */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Movimientos Recientes
            </h3>

            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Fecha
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Descripción
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Tipo
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {latestTransactions.length > 0 ? (
                    latestTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {moment(transaction.date).format("DD/MM/YYYY")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.type ===
                              PettyCashTransactionType.EXPENSE
                                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                : transaction.type ===
                                  PettyCashTransactionType.REPLENISHMENT
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                : transaction.type ===
                                  PettyCashTransactionType.INITIAL
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}
                          >
                            {transaction.type ===
                            PettyCashTransactionType.EXPENSE
                              ? "Gasto"
                              : transaction.type ===
                                PettyCashTransactionType.REPLENISHMENT
                              ? "Reposición"
                              : transaction.type ===
                                PettyCashTransactionType.INITIAL
                              ? "Saldo Inicial"
                              : "Ajuste"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                            transaction.type ===
                            PettyCashTransactionType.EXPENSE
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {transaction.type === PettyCashTransactionType.EXPENSE
                            ? "-"
                            : "+"}
                          $
                          {(transaction.amount / 100).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400"
                      >
                        No hay transacciones recientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {latestTransactions.length > 0 && (
              <div className="mt-3 text-right">
                <button
                  onClick={() => navigate("transactions")}
                  className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  Ver todas las transacciones →
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PettyCashDashboard;
