import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircleIcon } from "@heroicons/react/24/solid";

const SubscriptionCancelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
            Suscripción Cancelada
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Has cancelado el proceso de suscripción. No te preocupes, no se ha
            realizado ningún cargo.
          </p>
        </div>

        <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Si tuviste algún problema durante el proceso o tienes preguntas
            sobre nuestros planes, no dudes en contactar a nuestro equipo de
            soporte.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage;
