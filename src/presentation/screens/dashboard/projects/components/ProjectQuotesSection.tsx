import React, { useState, useMemo } from "react";
import {
  ProjectQuote,
  QuoteStatus,
  useProjectStore,
  QUOTE_CATEGORIES,
} from "../../../../../store/projectStore";
import moment from "moment";
import { toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import NewQuoteModal from "./NewQuoteModal";
import QuoteComparisonModal from "./QuoteComparisonModal";
import QuoteDetailModal from "./QuoteDetailModal";
import QuoteEditModal from "./QuoteEditModal";

interface ProjectQuotesSectionProps {
  projectId: string;
  projectName: string;
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

const ProjectQuotesSection: React.FC<ProjectQuotesSectionProps> = ({
  projectId,
  projectName,
}) => {
  const { projectQuotes, selectProjectQuote, loading } = useProjectStore();
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<ProjectQuote | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectingQuoteId, setSelectingQuoteId] = useState<string | null>(null);

  // Filtrar cotizaciones para este proyecto
  const quotes = projectQuotes.filter((quote) => quote.projectId === projectId);

  // Agrupar cotizaciones por categoría
  const quotesByCategory = useMemo(() => {
    const grouped: Record<string, ProjectQuote[]> = {};

    // Inicializar todas las categorías para asegurar que existan incluso si están vacías
    QUOTE_CATEGORIES.forEach((category) => {
      grouped[category] = [];
    });

    // Agrupar las cotizaciones por categoría
    quotes.forEach((quote) => {
      const category = quote.category || "otro";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(quote);
    });

    return grouped;
  }, [quotes]);

  // Determinar si se pueden agregar más cotizaciones por categoría
  const canAddMoreQuotesByCategory = useMemo(() => {
    const result: Record<string, boolean> = {};
    QUOTE_CATEGORIES.forEach((category) => {
      result[category] = (quotesByCategory[category]?.length || 0) < 5;
    });
    return result;
  }, [quotesByCategory]);

  // Función para obtener el label del estado en español
  const getStatusLabel = (status: QuoteStatus): string => {
    switch (status) {
      case QuoteStatus.PENDING:
        return "Pendiente";
      case QuoteStatus.APPROVED:
        return "Aprobada";
      case QuoteStatus.REJECTED:
        return "Rechazada";
      case QuoteStatus.SELECTED:
        return "Seleccionada";
      default:
        return "";
    }
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: QuoteStatus): string => {
    switch (status) {
      case QuoteStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case QuoteStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case QuoteStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case QuoteStatus.SELECTED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  // Función para seleccionar una cotización
  const handleSelectQuote = async (quoteId: string) => {
    setSelectingQuoteId(quoteId);
    try {
      await selectProjectQuote(quoteId);
      const selectError = useProjectStore.getState().error;
      if (selectError) {
        toast.error(selectError);
        return;
      }
      toast.success("Cotización seleccionada correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al seleccionar la cotización");
    } finally {
      setSelectingQuoteId(null);
    }
  };

  // Función para ver los detalles de una cotización
  const handleViewDetails = (quote: ProjectQuote) => {
    setSelectedQuote(quote);
    setIsDetailModalOpen(true);
  };

  // Función para editar una cotización
  const handleEditQuote = (quote: ProjectQuote) => {
    setSelectedQuote(quote);
    setIsEditModalOpen(true);
  };

  // Comprobar si la cotización está expirada
  const isQuoteExpired = (validUntil: string): boolean => {
    return moment(validUntil).isBefore(moment(), "day");
  };

  // Obtener solo las categorías que tienen cotizaciones
  const activeCategories = useMemo(() => {
    return QUOTE_CATEGORIES.filter(
      (category) => quotesByCategory[category]?.length > 0
    );
  }, [quotesByCategory]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Cotizaciones del Proyecto
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {quotes.length} cotizaciones en total
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Puedes registrar hasta 5 cotizaciones por categoria.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          {activeCategories.length >= 2 && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500"
              data-action="compare"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5"
                />
              </svg>
              Comparar Cotizaciones
            </button>
          )}

          <button
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Nueva Cotización
          </button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Aun no hay cotizaciones registradas para este proyecto.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Agrega cotizaciones para comparar proveedores y seleccionar la mejor
            opcion por categoria.
          </p>
          <button
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Agregar Cotización
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Opciones principales */}
          {quotes.length >= 2 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Analiza y compara cotizaciones
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visualiza lado a lado las diferentes opciones para tomar
                      la mejor decisión
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsComparisonModalOpen(true)}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  data-action="compare"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5"
                    />
                  </svg>
                  Abrir comparador de cotizaciones
                </button>
              </div>
            </div>
          )}

          {/* Filtros por categoría */}
          {activeCategories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
              <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                Filtrar por:
              </span>
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  activeCategory === null
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Todas
              </button>
              {activeCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    activeCategory === category
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {CATEGORY_LABELS[category]} (
                  {quotesByCategory[category].length})
                </button>
              ))}
            </div>
          )}

          {/* Secciones por categoría */}
          {QUOTE_CATEGORIES.map((category) => {
            // Mostrar solo la categoría activa o todas si no hay filtro
            if (activeCategory !== null && activeCategory !== category)
              return null;
            // No mostrar categorías vacías
            if (quotesByCategory[category].length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          category === "tecnico"
                            ? "#4361ee"
                            : category === "materiales"
                            ? "#f7b801"
                            : category === "herramientas"
                            ? "#ef476f"
                            : category === "transporte"
                            ? "#06d6a0"
                            : category === "consultoria"
                            ? "#118ab2"
                            : category === "instalacion"
                            ? "#7209b7"
                            : "#6c757d",
                      }}
                    ></span>
                    {CATEGORY_LABELS[category]}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({quotesByCategory[category].length} de 5 cotizaciones)
                    </span>
                  </h3>

                  {canAddMoreQuotesByCategory[category] && (
                    <button
                      onClick={() => setIsNewQuoteModalOpen(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      + Agregar cotización
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Proveedor
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Concepto
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Monto
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Válido Hasta
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Estado
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {quotesByCategory[category].map((quote) => {
                        const expired = isQuoteExpired(quote.validUntil);
                        const hasSelectedQuoteInCategory =
                          quotesByCategory[category]?.some((q) => q.isSelected) ||
                          false;

                        return (
                          <tr key={quote.id}>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {quote.providerName}
                              </div>
                              {quote.contactName && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Contacto: {quote.contactName}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-4">
                              <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                {quote.concept}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                $
                                {quote.amount.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm ${
                                  expired
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                {moment(quote.validUntil).format("DD/MM/YYYY")}
                                {expired && (
                                  <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                                    (Expirada)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  quote.status
                                )}`}
                              >
                                {getStatusLabel(quote.status)}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewDetails(quote)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title="Ver detalles"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={() => handleEditQuote(quote)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Editar cotización"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>

                                {quote.fileUrls &&
                                  quote.fileUrls.length > 0 && (
                                    <a
                                      href={quote.fileUrls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                      title="Descargar archivo"
                                    >
                                      <DocumentArrowDownIcon className="h-5 w-5" />
                                    </a>
                                  )}

                                {quote.status !== QuoteStatus.SELECTED &&
                                  !expired &&
                                  (
                                    <button
                                      onClick={() =>
                                        handleSelectQuote(quote.id)
                                      }
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                      title={
                                        selectingQuoteId === quote.id
                                          ? "Seleccionando cotizacion..."
                                          : hasSelectedQuoteInCategory
                                          ? "Reemplazar cotización seleccionada"
                                          : "Seleccionar cotización"
                                      }
                                      disabled={loading || selectingQuoteId === quote.id}
                                    >
                                      <CheckCircleIcon className="h-5 w-5" />
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <NewQuoteModal
        isOpen={isNewQuoteModalOpen}
        onClose={() => setIsNewQuoteModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
      />

      {selectedQuote && (
        <>
          <QuoteDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
          />

          <QuoteEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
          />
        </>
      )}

      {quotes.length >= 2 && (
        <QuoteComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          quotes={quotes}
          onSelectQuote={handleSelectQuote}
        />
      )}
    </div>
  );
};

export default ProjectQuotesSection;
