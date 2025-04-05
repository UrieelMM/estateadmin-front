import React from "react";
import { useClientPlanStore } from "../../store/clientPlanStore";
import ProtectedProFeature from "./ProtectedProFeature";
import { Link } from "react-router-dom";

/**
 * Componente que muestra las funciones Pro disponibles para el usuario
 */
const ProFeaturesList: React.FC = () => {
  const { plan, proFunctions, isLoading, error } = useClientPlanStore();

  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 shadow">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Cargando funciones pro...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900 p-4 shadow">
        <p className="text-red-500 dark:text-red-200 text-center">{error}</p>
      </div>
    );
  }

  // Si el usuario no es Pro o Enterprise, mostrar información para actualizar
  if (plan !== "Pro" && plan !== "Enterprise") {
    return (
      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900 p-4 shadow">
        <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-200 mb-2">
          Actualiza a un plan Pro
        </h3>
        <p className="text-indigo-600 dark:text-indigo-300 mb-4">
          Desbloquea funciones avanzadas como IA conversacional, reportes
          avanzados y más.
        </p>
        <a
          href="#"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Conocer más
        </a>
      </div>
    );
  }

  // Lista de todas las posibles funciones Pro
  const allProFeatures = [
    {
      id: "chatbot",
      name: "Asistente IA",
      description:
        "Asistente virtual inteligente para ayudarte con la administración",
      path: "/dashboard/ia/chatbot",
      icon: "🤖",
    },
    // Agregar más funciones Pro a medida que estén disponibles
  ];

  // Filtrar las funciones a las que el usuario tiene acceso
  const availableFeatures = allProFeatures.filter((feature) =>
    proFunctions.includes(feature.id)
  );

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Tus Funciones Pro
      </h3>

      {availableFeatures.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No tienes funciones Pro disponibles en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableFeatures.map((feature) => (
            <ProtectedProFeature key={feature.id} featureName={feature.id}>
              <Link
                to={feature.path}
                className="block p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <div>
                    <h4 className="font-medium text-indigo-700 dark:text-indigo-300">
                      {feature.name}
                    </h4>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            </ProtectedProFeature>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProFeaturesList;
