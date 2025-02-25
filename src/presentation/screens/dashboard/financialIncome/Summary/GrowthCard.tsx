// src/components/paymentSummary/GrowthCard.tsx
import React from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";

/** Función utilitaria para concatenar clases CSS */
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

export type GrowthCardProps = {
  title: string;
  current: number;
  previous: number;
};

const GrowthCard: React.FC<GrowthCardProps> = ({ title, current, previous }) => {
  let changeDisplay = "N/A";
  let changeType: "increase" | "decrease" = "increase";

  if (previous !== 0) {
    const change = ((current - previous) / previous) * 100;
    changeDisplay = Math.abs(change).toFixed(2) + "%";
    changeType = change >= 0 ? "increase" : "decrease";
  }

  return (
    <div className="px-4 py-5 sm:p-6">
      <dt className="text-base font-normal text-gray-900">{title}</dt>
      <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
        <div className="flex items-baseline text-xl font-semibold text-indigo-600">
          {"$" +
            current.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          <span className="ml-2 text-sm font-medium text-gray-500">
            -{" "}
            {"$" +
              previous.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </span>
        </div>
        <div
          className={classNames(
            changeType === "increase"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800",
            "inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0"
          )}
        >
          {changeType === "increase" ? (
            <ArrowUpIcon
              aria-hidden="true"
              className="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-green-500"
            />
          ) : (
            <ArrowDownIcon
              aria-hidden="true"
              className="-ml-1 mr-0.5 h-5 w-5 shrink-0 self-center text-red-500"
            />
          )}
          <span className="sr-only">
            {changeType === "increase" ? "Increased" : "Decreased"} by{" "}
          </span>
          {changeDisplay}
        </div>
      </dd>
    </div>
  );
};

export default React.memo(GrowthCard);
