import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import {
  usePettyCashStore,
  PettyCashTransactionType,
} from "../../../../../../store/pettyCashStore";

moment.locale("es");

const PettyCashTransactions: React.FC = () => {
  const navigate = useNavigate();
  const {
    transactions,
    fetchTransactions,
    loading,
    error: storeError,
  } = usePettyCashStore();

  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
  const [selectedTypes, setSelectedTypes] = useState<
    PettyCashTransactionType[]
  >([]);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: moment().startOf("month").format("YYYY-MM-DD"),
    endDate: moment().endOf("month").format("YYYY-MM-DD"),
  });

  useEffect(() => {
    // Cargar transacciones
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    // Aplicar filtros a las transacciones
    let filtered = [...transactions];

    // Filtrar por tipo
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((tx) => selectedTypes.includes(tx.type));
    }

    // Filtrar por rango de fechas
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter((tx) => {
        const txDate = moment(tx.expenseDate).format("YYYY-MM-DD");
        return txDate >= dateRange.startDate && txDate <= dateRange.endDate;
      });
    }

    // Ordenar por fecha (más reciente primero)
    filtered.sort(
      (a, b) =>
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );

    setFilteredTransactions(filtered);
  }, [transactions, selectedTypes, dateRange]);

  // Manejar cambios en la selección de tipos
  const handleTypeChange = (type: PettyCashTransactionType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Manejar cambios en el rango de fechas
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // Abrir el comprobante en una nueva pestaña
  const openPreview = (url: string) => {
    // Abrir la URL en una nueva pestaña del navegador
    window.open(url, "_blank");
  };

  // Formato para el tipo de transacción
  const getTransactionTypeLabel = (type: PettyCashTransactionType) => {
    switch (type) {
      case PettyCashTransactionType.EXPENSE:
        return {
          label: "Gasto",
          class: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        };
      case PettyCashTransactionType.REPLENISHMENT:
        return {
          label: "Reposición",
          class:
            "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
        };
      case PettyCashTransactionType.INITIAL:
        return {
          label: "Saldo Inicial",
          class:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
        };
      case PettyCashTransactionType.ADJUSTMENT:
        return {
          label: "Ajuste",
          class:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        };
      default:
        return {
          label: "Desconocido",
          class:
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
    }
  };

  // Formato para la categoría
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "office_supplies":
        return "Suministro de Papelería";
      case "cleaning":
        return "Limpieza";
      case "maintenance":
        return "Mantenimiento menor";
      case "transport":
        return "Transporte y mensajería";
      case "food":
        return "Alimentos y bebidas";
      case "other":
        return "Otros gastos";
      default:
        return "N/A";
    }
  };

  // Exportar transacciones a Excel (simulación)
  const exportToExcel = () => {
    alert(
      "Funcionalidad de exportación a Excel no implementada en esta versión"
    );
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
          <div className="flex flex-col sm:flex-row sm:items-center mb-3 md:mb-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Transacciones de Caja Chica
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash")}
            className="mt-2 sm:mt-0 sm:ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-end md:items-center">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por tipo
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(PettyCashTransactionType).map((type) => {
                const typeInfo = getTransactionTypeLabel(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition ${
                      selectedTypes.includes(type)
                        ? typeInfo.class
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {typeInfo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por fecha inicio */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Desde
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro por fecha fin */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Hasta
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Mensaje de carga */}
      {loading && (
        <div className="p-8 flex justify-center">
          <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Mensaje de error */}
      {storeError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 m-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{storeError}</p>
        </div>
      )}

      {/* Tabla de transacciones */}
      {!loading && !storeError && (
        <div className="overflow-x-auto">
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
                  Tipo
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Categoría
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Descripción
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Monto
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Comprobante
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const typeInfo = getTransactionTypeLabel(transaction.type);
                  return (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {moment(transaction.expenseDate).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeInfo.class}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {transaction.category
                          ? getCategoryLabel(transaction.category)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {transaction.description}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                          transaction.type === PettyCashTransactionType.EXPENSE
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {transaction.receiptUrl ? (
                          <button
                            onClick={() => openPreview(transaction.receiptUrl!)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay transacciones que coincidan con los filtros
                    seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Ya no se muestra el modal porque ahora abrimos los comprobantes en una nueva pestaña */}
    </motion.div>
  );
};

export default PettyCashTransactions;
