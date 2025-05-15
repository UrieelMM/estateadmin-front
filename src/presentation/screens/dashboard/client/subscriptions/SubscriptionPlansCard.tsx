import React from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { SubscriptionPlan } from "../../../../store/useClientInvoicesStore";

interface SubscriptionPlansCardProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (priceId: string) => void;
  currentPriceId?: string;
}

const formatCurrency = (amount: number, currency: string = "MXN") => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

const SubscriptionPlansCard: React.FC<SubscriptionPlansCardProps> = ({
  plans,
  onSelectPlan,
  currentPriceId,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative border rounded-lg p-6 hover:shadow-md transition-shadow
            ${
              plan.priceId === currentPriceId
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
            className={`mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium
              ${
                plan.priceId === currentPriceId
                  ? "bg-indigo-200 text-indigo-800 cursor-default"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            onClick={() => onSelectPlan(plan.priceId)}
            disabled={plan.priceId === currentPriceId}
          >
            {plan.priceId === currentPriceId
              ? "Plan actual"
              : "Seleccionar plan"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionPlansCard;
