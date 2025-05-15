import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import useClientInvoicesStore from "../../../store/useClientInvoicesStore";
import LoadingApp from "../../components/shared/loaders/LoadingApp";

const SubscriptionSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkPaymentStatus, fetchSubscriptionInfo } =
    useClientInvoicesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          setIsSuccess(false);
          setMessage("No se encontró información de la sesión de pago");
          return;
        }

        // Verificar el estado de la sesión
        const result = await checkPaymentStatus(sessionId);

        if (result.status === "paid" || result.status === "active") {
          setIsSuccess(true);
          setMessage(
            "Tu suscripción se ha activado con éxito. ¡Gracias por tu pago!"
          );

          // Actualizar información de suscripción
          await fetchSubscriptionInfo();
        } else {
          setIsSuccess(false);
          setMessage(
            "La suscripción no pudo completarse. Por favor, inténtalo de nuevo."
          );
        }
      } catch (error: any) {
        console.error("Error al verificar el estado del pago:", error);
        setIsSuccess(false);
        setMessage(error.message || "Error al verificar el estado del pago");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [searchParams, checkPaymentStatus, fetchSubscriptionInfo]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <LoadingApp />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Verificando el estado de tu suscripción...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="text-center">
          {isSuccess ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          )}
          <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
            {isSuccess ? "¡Suscripción Activada!" : "Error en la Suscripción"}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        {isSuccess && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-300">
              Tu suscripción está ahora activa. Puedes gestionar tu suscripción
              desde el panel principal.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continuar al Panel Principal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
