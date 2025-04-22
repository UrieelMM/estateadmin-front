import { useState, useEffect } from "react";
import PublicationsForm from "../../../components/shared/forms/PublicationsForm";
import { usePublicationStore } from "../../../../store/usePublicationStore";
import { getRandomIndigoTone } from "../../../../utils/generateColor";

// Iconos
import {
  PlusIcon,
  CalendarIcon,
  UserCircleIcon,
  TagIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  BellIcon,
  SparklesIcon,
  MegaphoneIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";

const Publications = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Usar un Set para manejar múltiples cards expandidas de forma independiente
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { publications, loadPublications, hasMore } = usePublicationStore(
    (state) => ({
      publications: state.publications,
      loadPublications: state.loadPublications,
      hasMore: state.hasMore,
    })
  );

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const onClose = () => {
    setIsOpen(!isOpen);
  };

  // Función para truncar HTML manteniendo las etiquetas
  const truncateHtml = (html: string, maxLength: number = 180) => {
    // Si el contenido es corto, devolverlo sin cambios
    const textContent = html.replace(/<[^>]*>/g, "");
    if (textContent.length <= maxLength) return html;

    // Crear un elemento DOM temporal para manipular el HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let result = "";
    let textLength = 0;
    let isTruncated = false;

    // Función recursiva para recorrer los nodos
    const processNode = (node: Node) => {
      if (isTruncated) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const remainingLength = maxLength - textLength;
        if (remainingLength <= 0) {
          isTruncated = true;
          return;
        }

        const text = node.textContent || "";
        if (textLength + text.length <= maxLength) {
          textLength += text.length;
          result += text;
        } else {
          result += text.substring(0, remainingLength) + "...";
          textLength = maxLength;
          isTruncated = true;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        result += `<${tagName}`;

        // Añadir atributos
        Array.from(element.attributes).forEach((attr) => {
          result += ` ${attr.name}="${attr.value}"`;
        });

        if (element.childNodes.length === 0) {
          result += " />";
          return;
        }

        result += ">";

        // Procesar nodos hijos
        Array.from(element.childNodes).forEach((child) => {
          processNode(child);
        });

        if (!isTruncated) {
          result += `</${tagName}>`;
        } else {
          // Si se truncó dentro de este elemento, cerrarlo
          result += `</${tagName}>`;
        }
      }
    };

    // Procesar todos los nodos del div temporal
    Array.from(tempDiv.childNodes).forEach((node) => {
      processNode(node);
    });

    return result;
  };

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  // Mapeo de etiquetas a colores e iconos
  const tagStyles = {
    notificacion: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-800 dark:text-blue-200",
      icon: BellIcon,
    },
    evento: {
      bg: "bg-green-100 dark:bg-green-900",
      text: "text-green-800 dark:text-green-200",
      icon: SparklesIcon,
    },
    anuncio: {
      bg: "bg-amber-100 dark:bg-amber-900",
      text: "text-amber-800 dark:text-amber-200",
      icon: MegaphoneIcon,
    },
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm rounded-br-lg rounded-bl-lg mb-6 transition-all duration-200 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Publicaciones
            </h1>
          </div>
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg  shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 active:scale-95"
          >
            <PlusIcon className="w-5 h-5 mr-1.5" />
            <span>Nueva publicación</span>
          </button>
        </div>
      </header>

      {/* Formulario de Publicaciones */}
      <PublicationsForm onClose={onClose} isOpen={isOpen} />

      {/* Contenido principal */}
      <div className="container mx-auto px-4 pb-12">
        {publications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-6 rounded-full mb-4">
              <DocumentTextIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2">
              No hay publicaciones aún
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Crea tu primera publicación haciendo clic en el botón "Nueva
              publicación"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {publications.map((publication, index) => {
              // Determinar estilo de etiqueta
              const tagKey = publication.tags as keyof typeof tagStyles;
              const tagStyle = tagStyles[tagKey] || {
                bg: "bg-gray-100 dark:bg-gray-800",
                text: "text-gray-800 dark:text-gray-200",
                icon: TagIcon,
              };

              return (
                <div
                  key={index}
                  className="self-start flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  {/* Encabezado de la publicación */}
                  <div className="px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-white font-bold ${getRandomIndigoTone()}`}
                        >
                          {publication.author[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {publication.title}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <UserCircleIcon className="w-4 h-4 mr-1" />
                            {publication.author}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tagStyle.bg} ${tagStyle.text}`}
                      >
                        <tagStyle.icon className="w-3.5 h-3.5 mr-1" />
                        {publication.tags.charAt(0).toUpperCase() +
                          publication.tags.slice(1)}
                      </span>
                    </div>
                    {publication.createdAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(publication.createdAt)}
                      </p>
                    )}
                  </div>

                  {/* Contenido de la publicación */}
                  <div className="px-6 py-4">
                    <div
                      className={
                        "text-gray-700 dark:text-gray-300 text-sm leading-relaxed publication-content transition-all duration-300 " +
                        (expandedCards.has(index)
                          ? "max-h-96 overflow-auto"
                          : "max-h-24 overflow-hidden")
                      }
                      dangerouslySetInnerHTML={{
                        __html: expandedCards.has(index)
                          ? publication.content
                          : truncateHtml(publication.content),
                      }}
                    />
                  </div>

                  {/* Footer con acciones */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    {publication.condominiumName && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Para:{" "}
                        {publication.sendTo === "todos"
                          ? "Todos los residentes"
                          : publication.sendTo}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setExpandedCards((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(index)) {
                            newSet.delete(index);
                          } else {
                            newSet.add(index);
                          }
                          return newSet;
                        });
                      }}
                      className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center"
                    >
                      {expandedCards.has(index) ? (
                        <>
                          Ver menos
                          <ChevronDownIcon className="w-4 h-4 ml-1 transform rotate-180 transition-transform" />
                        </>
                      ) : (
                        <>
                          Ver completo
                          <EyeIcon className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botón cargar más */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              className="group relative px-6 py-1.5 text-sm bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
              onClick={() => loadPublications(true)}
            >
              <span className="flex items-center">
                <span>Cargar más publicaciones</span>
                <ChevronDownIcon className="w-4 h-4 ml-2 group-hover:translate-y-1 transition-transform duration-200" />
              </span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Publications;
