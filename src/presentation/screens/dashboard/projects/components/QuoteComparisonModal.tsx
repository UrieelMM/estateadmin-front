import React, { useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { ProjectQuote } from "../../../../../store/projectStore";
import moment from "moment";
import {
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/solid";

interface QuoteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: ProjectQuote[];
  onSelectQuote: (quoteId: string) => Promise<void>;
}

// Traducción de categorías para la interfaz
const CATEGORY_LABELS: Record<string, string> = {
  tecnico: "Técnico / Mano de obra",
  materiales: "Materiales",
  herramientas: "Herramientas y Equipamiento",
  transporte: "Transporte",
  consultoria: "Consultoría / Diseño",
  instalacion: "Instalación",
  otro: "Otro",
};

const QuoteComparisonModal: React.FC<QuoteComparisonModalProps> = ({
  isOpen,
  onClose,
  quotes,
  onSelectQuote,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Agrupar cotizaciones por categoría
  const quotesByCategory = useMemo(() => {
    const grouped: Record<string, ProjectQuote[]> = {};

    quotes.forEach((quote) => {
      const category = quote.category || "otro";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(quote);
    });

    return grouped;
  }, [quotes]);

  // Obtener solo las categorías que tienen cotizaciones
  const activeCategories = useMemo(() => {
    return Object.keys(quotesByCategory).filter(
      (category) => quotesByCategory[category].length >= 2
    );
  }, [quotesByCategory]);

  // Determinar la categoría activa para mostrar
  const currentCategory = useMemo(() => {
    // Si hay una categoría activa seleccionada, usarla
    if (activeCategory && quotesByCategory[activeCategory]?.length >= 2) {
      return activeCategory;
    }
    // Si no, usar la primera categoría que tenga al menos 2 cotizaciones
    if (activeCategories.length > 0) {
      return activeCategories[0];
    }
    return null;
  }, [activeCategory, activeCategories, quotesByCategory]);

  // Filtrar cotizaciones no vencidas y ordenarlas por precio para la categoría actual
  const validQuotes = useMemo(() => {
    if (!currentCategory) return [];

    return quotesByCategory[currentCategory]
      .filter((q) => !moment(q.validUntil).isBefore(moment(), "day"))
      .sort((a, b) => a.amount - b.amount);
  }, [currentCategory, quotesByCategory]);

  // Verificar si hay una cotización seleccionada en la categoría actual
  const hasSelectedQuote = useMemo(() => {
    if (!currentCategory) return false;
    return quotesByCategory[currentCategory].some((quote) => quote.isSelected);
  }, [currentCategory, quotesByCategory]);

  // Función para manejar la selección de una cotización
  const handleSelectQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      await onSelectQuote(quoteId);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener la cotización más económica
  const cheapestQuote = validQuotes.length > 0 ? validQuotes[0] : null;

  // Función para determinar si una cotización es la más económica
  const isCheapestQuote = (quote: ProjectQuote): boolean => {
    return cheapestQuote !== null && quote.id === cheapestQuote.id;
  };

  // Función para calcular diferencia de precios respecto a la más económica
  const calculatePriceDifference = (quote: ProjectQuote): string => {
    if (!cheapestQuote || quote.id === cheapestQuote.id) {
      return "";
    }

    const difference = quote.amount - cheapestQuote.amount;
    const percentageDiff = (difference / cheapestQuote.amount) * 100;

    return `+${percentageDiff.toFixed(1)}% (${difference.toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
      }
    )})`;
  };

  // Asignar un color según el rango de precio
  const getPricingColor = (quote: ProjectQuote): string => {
    if (!cheapestQuote) return "";

    if (quote.id === cheapestQuote.id) {
      return "text-green-600 dark:text-green-400";
    }

    const difference = quote.amount - cheapestQuote.amount;
    const percentageDiff = (difference / cheapestQuote.amount) * 100;

    if (percentageDiff <= 10) {
      return "text-yellow-600 dark:text-yellow-400";
    }
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-6xl w-full rounded-lg bg-white p-6 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
            <Dialog.Title className="text-lg font-medium border-b pb-3 mb-6 dark:border-gray-700 flex items-center">
              <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
              <span>Análisis Comparativo de Cotizaciones</span>
            </Dialog.Title>

            {activeCategories.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-8">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                  <DocumentCheckIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">
                  No hay cotizaciones para comparar
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  No hay suficientes cotizaciones válidas para comparar. Se
                  necesitan al menos 2 cotizaciones en la misma categoría.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border-l-4 border-indigo-500 dark:border-indigo-400">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ArrowTrendingDownIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                        Análisis inteligente de cotizaciones
                      </h3>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                        Compare cotizaciones lado a lado, visualice diferencias
                        de precios, fechas y condiciones para tomar la mejor
                        decisión. Las cotizaciones están organizadas por
                        categorías y destacamos la mejor opción en cada una.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selector de categoría */}
                {activeCategories.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                      Comparar cotizaciones de:
                    </span>
                    {activeCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          currentCategory === category
                            ? "bg-indigo-600 text-white dark:bg-indigo-500"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {CATEGORY_LABELS[category]} (
                        {quotesByCategory[category].length})
                      </button>
                    ))}
                  </div>
                )}

                {validQuotes.length === 0 && currentCategory ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay cotizaciones válidas para comparar en la categoría
                      "{CATEGORY_LABELS[currentCategory]}". Todas las
                      cotizaciones están expiradas.
                    </p>
                  </div>
                ) : (
                  currentCategory && (
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              currentCategory === "tecnico"
                                ? "#4361ee"
                                : currentCategory === "materiales"
                                ? "#f7b801"
                                : currentCategory === "herramientas"
                                ? "#ef476f"
                                : currentCategory === "transporte"
                                ? "#06d6a0"
                                : currentCategory === "consultoria"
                                ? "#118ab2"
                                : currentCategory === "instalacion"
                                ? "#7209b7"
                                : "#6c757d",
                          }}
                        ></span>
                        Comparando cotizaciones de:{" "}
                        <span className="ml-1 font-semibold">
                          {CATEGORY_LABELS[currentCategory]}
                        </span>
                      </h3>

                      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-32"
                              >
                                Criterio
                              </th>
                              {validQuotes.map((quote) => (
                                <th
                                  key={quote.id}
                                  scope="col"
                                  className={`px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  <div className="font-semibold truncate max-w-[200px]">
                                    {quote.providerName}
                                  </div>
                                  {isCheapestQuote(quote) && (
                                    <div className="mt-1 flex items-center">
                                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-medium flex items-center">
                                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                        Menor precio
                                      </span>
                                    </div>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {/* Monto */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium flex items-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                <BanknotesIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                Monto
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className={`text-base font-semibold ${getPricingColor(
                                      quote
                                    )}`}
                                  >
                                    $
                                    {quote.amount.toLocaleString("es-MX", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                  {calculatePriceDifference(quote) && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      {calculatePriceDifference(quote)}
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>

                            {/* Concepto */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Concepto
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className="truncate max-w-[200px]"
                                    title={quote.concept}
                                  >
                                    {quote.concept}
                                  </div>
                                </td>
                              ))}
                            </tr>

                            {/* Validez */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium flex items-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                Válido Hasta
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {moment(quote.validUntil).format(
                                    "DD/MM/YYYY"
                                  )}
                                </td>
                              ))}
                            </tr>

                            {/* Fechas de Entrega */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Fecha de Entrega
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {quote.deliveryDate
                                    ? moment(quote.deliveryDate).format(
                                        "DD/MM/YYYY"
                                      )
                                    : "No especificada"}
                                </td>
                              ))}
                            </tr>

                            {/* Fechas de Inicio */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Fecha de Inicio
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {quote.startDate
                                    ? moment(quote.startDate).format(
                                        "DD/MM/YYYY"
                                      )
                                    : "No especificada"}
                                </td>
                              ))}
                            </tr>

                            {/* Garantías */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Garantías
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className="truncate max-w-[200px]"
                                    title={quote.warranty || "No especificadas"}
                                  >
                                    {quote.warranty
                                      ? quote.warranty.length > 50
                                        ? quote.warranty.substring(0, 50) +
                                          "..."
                                        : quote.warranty
                                      : "No especificadas"}
                                  </div>
                                </td>
                              ))}
                            </tr>

                            {/* Archivos adjuntos */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Archivos
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {quote.fileUrls &&
                                  quote.fileUrls.length > 0 ? (
                                    <div className="flex items-center">
                                      <a
                                        href={quote.fileUrls[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                                      >
                                        {quote.fileUrls.length}{" "}
                                        {quote.fileUrls.length === 1
                                          ? "archivo"
                                          : "archivos"}
                                      </a>
                                    </div>
                                  ) : (
                                    "Sin archivos"
                                  )}
                                </td>
                              ))}
                            </tr>

                            {/* Estado */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Estado
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {quote.isSelected ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                      Seleccionada
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>

                            {/* Acciones */}
                            <tr>
                              <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700">
                                Acción
                              </td>
                              {validQuotes.map((quote) => (
                                <td
                                  key={quote.id}
                                  className={`px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                                    isCheapestQuote(quote)
                                      ? "bg-green-50 dark:bg-green-900/30"
                                      : ""
                                  }`}
                                >
                                  {quote.isSelected ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                                      Seleccionada
                                    </span>
                                  ) : !hasSelectedQuote ? (
                                    <button
                                      onClick={() =>
                                        handleSelectQuote(quote.id)
                                      }
                                      disabled={loading}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
                                    >
                                      {loading
                                        ? "Seleccionando..."
                                        : "Seleccionar"}
                                    </button>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      No disponible
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )}

                <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cómo elegir la mejor cotización?
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>El precio más bajo no siempre es la mejor opción.</li>
                    <li>
                      Considera la calidad, experiencia y garantías ofrecidas
                      por el proveedor.
                    </li>
                    <li>Revisa detalladamente qué incluye cada cotización.</li>
                    <li>
                      Puedes seleccionar una cotización diferente para cada
                      categoría de servicio o producto.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Cerrar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default QuoteComparisonModal;
