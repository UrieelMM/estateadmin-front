import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/es";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import {
  usePettyCashStore,
  PettyCashConfig,
} from "../../../../../../store/pettyCashStore";
import { formatCurrency } from "../../../../../../utils/curreyncy";

const PettyCashHistory: React.FC = () => {
  const navigate = useNavigate();
  const [historicalCashBoxes, setHistoricalCashBoxes] = useState<
    PettyCashConfig[]
  >([]);
  const [selectedCashBox, setSelectedCashBox] =
    useState<PettyCashConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { fetchHistoricalCashBoxes, loadHistoricalCashBox } =
    usePettyCashStore();

  useEffect(() => {
    loadHistoricalCashBoxes();
  }, []);

  const loadHistoricalCashBoxes = async () => {
    setLoading(true);
    try {
      const cashBoxes = await fetchHistoricalCashBoxes();
      setHistoricalCashBoxes(cashBoxes);
    } catch (err: any) {
      setError(err.message || "Error al cargar el historial de cajas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cashBox: PettyCashConfig) => {
    setSelectedCashBox(cashBox);
    setShowDetailsModal(true);
  };

  const handleLoadCashBox = async (cashBoxId: string) => {
    setLoading(true);
    try {
      await loadHistoricalCashBox(cashBoxId);
      // Redirigir a la pantalla de transacciones históricas
      navigate("/dashboard/pettycash/transactions");
    } catch (err: any) {
      setError(err.message || "Error al cargar la caja histórica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex mb-2 justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Historial de Cajas Chica
          </h2>
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pettycash")}
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Volver
            </button>
          </div>
        </div>
        <div className="flex justify-end items-center">
          <button
            onClick={loadHistoricalCashBoxes}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : historicalCashBoxes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sin historial
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              No hay cajas chica históricas. El historial se creará cuando
              finalices el periodo actual y crees una nueva caja.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Periodo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Fechas
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Inicial
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Final
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {historicalCashBoxes.map((cashBox) => (
                  <tr
                    key={cashBox.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                        {cashBox.period || "Sin periodo"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {cashBox.startDate && cashBox.endDate ? (
                        <>
                          <span>
                            {moment(cashBox.startDate).format("DD/MM/YYYY")}
                          </span>
                          <span className="mx-2">-</span>
                          <span>
                            {moment(cashBox.endDate).format("DD/MM/YYYY")}
                          </span>
                        </>
                      ) : (
                        "Fechas no disponibles"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(cashBox.initialAmount / 100)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {cashBox.finalBalance !== undefined
                        ? formatCurrency(cashBox.finalBalance / 100)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleViewDetails(cashBox)}
                          className="text-indigo-700 bg-indigo-50 rounded-md text-sm px-1 py-2 hover:text-indigo-900 dark:text-indigo-700 dark:hover:text-indigo-800"
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => handleLoadCashBox(cashBox.id!)}
                          className="text-emerald-700 bg-emerald-50 rounded-md text-sm px-1 py-2 hover:text-emerald-900 dark:text-emerald-700 dark:hover:text-emerald-800"
                        >
                          Ver Transacciones
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailsModal && selectedCashBox && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Detalles de Caja Chica: {selectedCashBox.period}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información General
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fecha de Inicio
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedCashBox.startDate
                            ? moment(selectedCashBox.startDate).format(
                                "DD/MM/YYYY"
                              )
                            : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fecha de Cierre
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedCashBox.endDate
                            ? moment(selectedCashBox.endDate).format(
                                "DD/MM/YYYY"
                              )
                            : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cuenta Asociada
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedCashBox.accountName || "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Umbral Mínimo
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(
                            selectedCashBox.thresholdAmount / 100
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información Financiera
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Saldo Inicial
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(selectedCashBox.initialAmount / 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Saldo Final
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedCashBox.finalBalance
                            ? formatCurrency(selectedCashBox.finalBalance / 100)
                            : "No disponible"}
                        </p>
                      </div>
                      {selectedCashBox.finalBalance &&
                        selectedCashBox.initialAmount && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Variación
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                selectedCashBox.finalBalance -
                                  selectedCashBox.initialAmount >
                                0
                                  ? "text-green-600 dark:text-green-400"
                                  : selectedCashBox.finalBalance -
                                      selectedCashBox.initialAmount <
                                    0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {formatCurrency(
                                (selectedCashBox.finalBalance -
                                  selectedCashBox.initialAmount) /
                                  100
                              )}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {selectedCashBox.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCashBox.notes}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleLoadCashBox(selectedCashBox.id!)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    Ver Transacciones
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PettyCashHistory;
