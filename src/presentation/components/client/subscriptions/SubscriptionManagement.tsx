import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  PencilIcon,
  XCircleIcon,
  CheckIcon,
  ArrowPathIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";
import useClientInvoicesStore from "../../../../store/useClientInvoicesStore";
import LoadingApp from "../../shared/loaders/LoadingApp";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  trialing:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  past_due:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  incomplete: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  incomplete_expired:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const formatStatus = (status: string) => {
  switch (status) {
    case "active":
      return "Activa";
    case "trialing":
      return "Periodo de prueba";
    case "past_due":
      return "Pago atrasado";
    case "incomplete":
      return "Incompleta";
    case "incomplete_expired":
      return "Expirada";
    case "unpaid":
      return "No pagada";
    case "canceled":
      return "Cancelada";
    default:
      return status;
  }
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-MX");
  } catch (error) {
    return "Fecha inválida";
  }
};

const formatCurrency = (
  amount: number | undefined,
  currency: string = "MXN"
) => {
  if (amount === undefined) return "N/A";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

interface SubscriptionManagementProps {
  onStartSubscription?: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  onStartSubscription,
}) => {
  const {
    subscriptionInfo,
    loading,
    fetchSubscriptionInfo,
    listSubscriptionPlans,
    availablePlans,
    updateSubscription,
    cancelSubscription,
  } = useClientInvoicesStore();

  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar si existe un subscriptionId en localStorage antes de intentar obtener info
        const hasSubscriptionId = Boolean(
          localStorage.getItem("subscriptionId")
        );

        if (hasSubscriptionId) {
          // Solo cargar información de suscripción si tenemos un ID
          await fetchSubscriptionInfo();
        }

        // Siempre intentar cargar planes disponibles
        await listSubscriptionPlans();
      } catch (error) {
        console.error("Error al cargar datos de suscripción:", error);
      }
    };

    loadData();
  }, [fetchSubscriptionInfo, listSubscriptionPlans]);

  // Función para cambiar de plan
  const handleChangePlan = async (newPriceId: string) => {
    if (!subscriptionInfo) {
      toast.error("No hay información de suscripción disponible");
      return;
    }

    try {
      await updateSubscription(subscriptionInfo.id, newPriceId);
      setShowPlansModal(false);
    } catch (error) {
      console.error("Error al cambiar de plan:", error);
    }
  };

  // Función para cancelar suscripción
  const handleCancelSubscription = async () => {
    if (!subscriptionInfo) {
      toast.error("No hay información de suscripción disponible");
      return;
    }

    try {
      await cancelSubscription(subscriptionInfo.id, cancelImmediately);
      setShowCancelModal(false);
      setCancelImmediately(false);
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);
    }
  };

  // Función para seleccionar una factura con plan
  const handleStartSubscription = () => {
    if (onStartSubscription) {
      onStartSubscription();
    } else {
      toast.error("Función no disponible");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingApp />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <ClockIcon className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
        Información de Suscripción
      </h2>

      {subscriptionInfo ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Estado:
              </p>
              <div>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[subscriptionInfo.status] ||
                    statusColors.pending
                  }`}
                >
                  {formatStatus(subscriptionInfo.status)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Plan actual:
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-200">
                {subscriptionInfo.planName || "Plan básico"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatCurrency(subscriptionInfo.planAmount)} / mes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Fecha de inicio:
              </p>
              <p className="text-gray-900 dark:text-gray-200">
                {formatDate(subscriptionInfo.startDate)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Próxima renovación:
              </p>
              <p className="text-gray-900 dark:text-gray-200">
                {formatDate(subscriptionInfo.currentPeriodEnd)}
              </p>
            </div>
          </div>

          {subscriptionInfo.cancelAtPeriodEnd && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                La suscripción está programada para cancelarse al final del
                período actual.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
              onClick={() => setShowPlansModal(true)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Cambiar plan
            </button>

            {!subscriptionInfo.cancelAtPeriodEnd && (
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600"
                onClick={() => setShowCancelModal(true)}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Cancelar suscripción
              </button>
            )}

            {subscriptionInfo.cancelAtPeriodEnd && (
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600"
                onClick={() =>
                  updateSubscription(subscriptionInfo.id, undefined, false)
                }
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reactivar suscripción
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No tienes una suscripción activa actualmente.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            onClick={handleStartSubscription}
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Iniciar suscripción
          </button>
        </div>
      )}

      {/* Modal para cambiar de plan */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowPlansModal(false)}
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                      Selecciona un plan
                    </h3>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingApp />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {availablePlans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow
                              ${
                                plan.priceId === subscriptionInfo?.priceId
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-gray-200 dark:border-gray-700"
                              }
                              ${plan.isPopular ? "ring-2 ring-indigo-500" : ""}
                            `}
                          >
                            {plan.isPopular && (
                              <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                                Popular
                              </div>
                            )}
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {plan.name}
                            </h4>
                            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                              {formatCurrency(plan.amount, plan.currency)}
                              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                /{plan.interval === "month" ? "mes" : "año"}
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {plan.description}
                            </p>

                            {plan.features && plan.features.length > 0 && (
                              <ul className="mt-4 space-y-2">
                                {plan.features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {feature}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <button
                              className={`mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium
                                ${
                                  plan.priceId === subscriptionInfo?.priceId
                                    ? "bg-indigo-200 text-indigo-800 cursor-default"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                } 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                              onClick={() => handleChangePlan(plan.priceId)}
                              disabled={
                                plan.priceId === subscriptionInfo?.priceId
                              }
                            >
                              {plan.priceId === subscriptionInfo?.priceId
                                ? "Plan actual"
                                : "Seleccionar plan"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Cancelar suscripción
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ¿Estás seguro de que deseas cancelar tu suscripción?
                      </p>

                      <div className="mt-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-indigo-600"
                            name="cancelOption"
                            checked={!cancelImmediately}
                            onChange={() => setCancelImmediately(false)}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Cancelar al final del período actual (recomendado)
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                          Podrás seguir usando el servicio hasta{" "}
                          {formatDate(subscriptionInfo?.currentPeriodEnd)}
                        </p>
                      </div>

                      <div className="mt-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-red-600"
                            name="cancelOption"
                            checked={cancelImmediately}
                            onChange={() => setCancelImmediately(true)}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Cancelar inmediatamente
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                          Perderás acceso al servicio de inmediato y no
                          recibirás reembolso por el tiempo restante.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={handleCancelSubscription}
                  >
                    Confirmar cancelación
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
                    onClick={() => setShowCancelModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
