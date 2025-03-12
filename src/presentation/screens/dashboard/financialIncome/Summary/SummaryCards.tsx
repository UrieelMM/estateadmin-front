// src/components/paymentSummary/SummaryCards.tsx
import React from "react";
import { Card } from "@heroui/react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { shallow } from "zustand/shallow";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon } from "@heroicons/react/24/solid";


const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <InformationCircleIcon className="w-5 h-5 text-default-500 cursor-pointer" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: "tween", stiffness: 20, damping: 20 }}
            style={{width: "200px", height:"50px"}}
            className="absolute top-[20px] right-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 text-xs p-1 rounded z-10 w-16 whitespace-normal break-words flex text-center items-center shadow-[0_0_15px_rgba(79,70,229,0.3),0_0_250px_#8093e87b,0_0_100px_#c2abe6c5] dark:shadow-[0_0_50px_rgba(79,70,229,0.5),0_0_10px_#8093e8ac,0_0_100px_#c2abe6c1] cursor-pointer"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCards: React.FC = React.memo(() => {
  // totalIncome ya incluye el initialBalance de todas las cuentas,
  // y monthlyStats se calcula a partir de los payments (saldo a favor sin el initialBalance).
  const { totalIncome, totalPending, monthlyStats } = usePaymentSummaryStore(
    (state) => ({
      totalIncome: state.totalIncome,
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
    }),
    shallow
  );

  // Se calcula el saldo a favor global a partir de monthlyStats
  const totalCreditGlobal = monthlyStats.reduce(
    (acc, stat) => acc + stat.saldo,
    0
  );

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Estadísticas anuales generales</h2>
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        {/* Total ingresos: se muestra la suma de los pagos + initialBalance (almacenado en totalIncome) más el saldo a favor global */}
        <Card className="p-4 shadow-md rounded-md relative">
          <div className="absolute top-2 right-2">
            <Tooltip text="Suma de pagos, saldo inicial y saldo a favor global." />
          </div>
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total ingresos:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalIncome + totalCreditGlobal)}
            </span>
          </div>
        </Card>

        {/* Total pendiente */}
        <Card className="p-4 shadow-md rounded-md relative">
          <div className="absolute top-2 right-2">
            <Tooltip text="Monto total de pagos pendientes." />
          </div>
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total pendiente:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalPending)}
            </span>
          </div>
        </Card>

        {/* Total saldo a favor */}
        <Card className="p-4 shadow-md rounded-md relative">
          <div className="absolute top-2 right-2">
            <Tooltip text="Saldo a favor global basado en los pagos mensuales." />
          </div>
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-default-500">
              Total saldo a favor:
            </span>
            <span className="text-2xl font-semibold text-default-700">
              {formatCurrency(totalCreditGlobal)}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
});

export default SummaryCards;
