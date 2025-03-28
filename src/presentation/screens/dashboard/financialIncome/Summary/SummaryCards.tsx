// src/components/paymentSummary/SummaryCards.tsx
import React from "react";
import { Card } from "@heroui/react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { shallow } from "zustand/shallow";
import { motion, AnimatePresence } from "framer-motion";
import {
  BanknotesIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <InformationCircleIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: "tween", stiffness: 20, damping: 20 }}
            style={{ width: "200px", height: "50px" }}
            className="absolute top-[20px] right-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs p-1 rounded z-10 w-16 whitespace-normal break-words flex text-center items-center shadow-[0_0_15px_rgba(79,70,229,0.3),0_0_250px_#8093e87b,0_0_100px_#c2abe6c5] dark:shadow-[0_0_50px_rgba(79,70,229,0.5),0_0_10px_#8093e8ac,0_0_100px_#c2abe6c1] cursor-pointer"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCards: React.FC = React.memo(() => {
  const { payments } = usePaymentSummaryStore(
    (state) => ({
      totalIncome: state.totalIncome,
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
      payments: state.payments,
    }),
    shallow
  );

  // Calcular el total de cargos (suma de referenceAmount)
  const totalCharges = payments.reduce(
    (acc, payment) => acc + payment.referenceAmount,
    0
  );

  // Calcular el total de monto abonado (pagos + crédito usado + saldo disponible)
  const totalPaid = payments.reduce(
    (acc, payment) => acc + payment.amountPaid,
    0
  );
  const totalCreditUsed = payments.reduce(
    (acc, payment) => acc + (payment.creditUsed || 0),
    0
  );
  const totalCreditBalance = payments.reduce(
    (acc, payment) => acc + payment.creditBalance,
    0
  );
  const totalPaidWithCredit =
    totalPaid +
    (totalCreditBalance > 0 ? totalCreditBalance : 0) -
    totalCreditUsed;

  // Calcular el saldo (diferencia entre cargos y monto abonado)
  const balance = totalCharges - totalPaidWithCredit;

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <h2 className="text-xl font-bold mb-4 dark:text-white">
        Estadísticas anuales generales
      </h2>
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        {/* Total ingresos */}
        <Card
          className="group relative flex flex-row items-center p-4 rounded-lg  
                     transition-all duration-200 ease-in-out
                     bg-white dark:bg-gray-800
                     cursor-pointer
                     shadow-lg hover:shadow-m h-32 hover:bg-gray-50 dark:hover:bg-transparent"
        >
          <div
            className="bg-[#8093E8] dark:bg-[#687fe4]
                         flex h-12 w-12 items-center justify-center rounded-lg 
                         shadow-lg group-hover:scale-110 transition-transform duration-200 shrink-0"
          >
            <BanknotesIcon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 ml-4">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white ">
                Monto Abonado
              </h3>
              <div className="absolute top-4 right-4">
                <Tooltip text="Suma total de pagos incluyendo crédito usado y saldo disponible." />
              </div>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {formatCurrency(totalPaidWithCredit)}
            </p>
          </div>
        </Card>

        {/* Total cargos */}
        <Card
          className="group relative flex flex-row items-center p-4 rounded-lg
                     transition-all duration-200 ease-in-out
                    gray-100 dark:bg-gray-800
                     cursor-pointer
                     shadow-lg hover:shadow-md hover:bg-gray-50 dark:hover:bg-transparent"
        >
          <div
            className="bg-[#8093E8] dark:bg-[#687fe4]
                         flex h-12 w-12 items-center justify-center rounded-lg 
                         shadow-lg group-hover:scale-110 transition-transform duration-200 shrink-0"
          >
            <ExclamationCircleIcon
              className="h-6 w-6 text-white"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 ml-4">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Cargos
              </h3>
              <div className="absolute top-4 right-4">
                <Tooltip text="Total de cargos generados." />
              </div>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {formatCurrency(totalCharges)}
            </p>
          </div>
        </Card>

        {/* Saldo */}
        <Card
          className="group relative flex flex-row items-center p-4 rounded-lg
                     transition-all duration-200 ease-in-out
                     bg-white dark:bg-gray-800
                     cursor-pointer
                     shadow-lg hover:shadow-md hover:bg-gray-50 dark:hover:bg-transparent"
        >
          <div
            className="bg-[#8093E8] dark:bg-[#687fe4]
                         flex h-12 w-12 items-center justify-center rounded-lg 
                         shadow-lg group-hover:scale-110 transition-transform duration-200 shrink-0"
          >
            <ArrowTrendingUpIcon
              className="h-6 w-6 text-white"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 ml-4">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Saldo
              </h3>
              <div className="absolute top-4 right-4">
                <Tooltip text="Diferencia entre cargos y monto abonado." />
              </div>
            </div>
            <p
              className={`mt-1 text-2xl font-semibold ${
                balance < 0
                  ? "text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {balance < 0
                ? `+${formatCurrency(Math.abs(balance))}`
                : formatCurrency(balance)}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
});

export default SummaryCards;
