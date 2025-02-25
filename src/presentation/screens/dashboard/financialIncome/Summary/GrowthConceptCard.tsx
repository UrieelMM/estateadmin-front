// src/components/paymentSummary/GrowthConceptCard.tsx
import React, { useMemo } from "react";
import type { PaymentRecord } from "../../../../../store/paymentSummaryStore";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

type GrowthRowProps = {
  label: string;
  current: number;
  previous: number;
};

const GrowthRow: React.FC<GrowthRowProps> = React.memo(({ label, current, previous }) => {
  let changeDisplay = "N/A";
  let changeType: "increase" | "decrease" = "increase";

  if (previous !== 0) {
    const change = ((current - previous) / previous) * 100;
    changeDisplay = Math.abs(change).toFixed(2) + "%";
    changeType = change >= 0 ? "increase" : "decrease";
  }

  return (
    <div className="flex items-baseline justify-between">
      <div className="text-sm font-normal text-gray-900">{label}</div>
      <div className="flex items-center">
        <div className="text-lg font-semibold text-indigo-600">
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
            "inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ml-4"
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
      </div>
    </div>
  );
});

type GrowthConceptCardProps = {
  concept: string;
  records: PaymentRecord[];
  maxMonth?: number;
};

const GrowthConceptCard: React.FC<GrowthConceptCardProps> = React.memo(
  ({ concept, records, maxMonth }) => {
    // Definir los meses base (no cambia, por lo que se memoriza)
    const monthKeys = useMemo(
      () => ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
      []
    );

    // Calcular los datos agrupados por mes; se recalcula solo cuando 'records' o 'maxMonth' cambian
    const dataByMonth = useMemo(() => {
      return monthKeys
        .filter((m) => (maxMonth ? parseInt(m) <= maxMonth : true))
        .map((m) => {
          const recs = records.filter((r) => r.month === m);
          return {
            month: m,
            paid: recs.reduce((sum, r) => sum + r.amountPaid, 0),
            pending: recs.reduce((sum, r) => sum + r.amountPending, 0),
            saldo: recs.reduce((sum, r) => sum + r.creditBalance, 0),
          };
        })
        .filter((item) => item.paid !== 0 || item.pending !== 0 || item.saldo !== 0);
    }, [monthKeys, maxMonth, records]);

    // Si no hay al menos dos meses con datos, mostramos un mensaje informativo
    if (dataByMonth.length < 2) {
      return (
        <div className="px-2 py-3 sm:p-6 bg-white shadow rounded-lg w-full lg:w-[49%]">
          <h4 className="text-base font-semibold text-gray-900">{concept}</h4>
          <p className="mt-1 text-sm text-gray-500">
            No hay suficientes datos para calcular crecimiento.
          </p>
        </div>
      );
    }

    // Obtener el penúltimo y el último mes con datos
    const previousData = dataByMonth[dataByMonth.length - 2];
    const currentData = dataByMonth[dataByMonth.length - 1];

    return (
      <div className="px-2 py-3 sm:p-6 bg-white shadow rounded-lg w-full lg:w-[49%]">
        <h4 className="text-base font-semibold text-gray-900 mb-4">{concept}</h4>
        <div className="space-y-4">
          <GrowthRow
            label="Monto abonado"
            current={currentData.paid}
            previous={previousData.paid}
          />
          <GrowthRow
            label="Monto pendiente"
            current={currentData.pending}
            previous={previousData.pending}
          />
          <GrowthRow
            label="Saldo a favor"
            current={currentData.saldo}
            previous={previousData.saldo}
          />
        </div>
      </div>
    );
  }
);

export default React.memo(GrowthConceptCard);
