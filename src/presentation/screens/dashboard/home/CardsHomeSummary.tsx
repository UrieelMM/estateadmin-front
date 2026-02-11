import React, { useEffect, useState } from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  UserIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";
import { usePaymentSummaryStore } from "../../../../store/paymentSummaryStore";
import { useExpenseSummaryStore } from "../../../../store/expenseSummaryStore";
import { Card } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { shallow } from "zustand/shallow";
import useUserStore from "../../../../store/UserDataStore";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";

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
            className="absolute top-[22px] right-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 text-xs p-2 rounded-lg z-10 w-52 whitespace-normal break-words border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CardsHomeSummary: React.FC = () => {
  const { monthlyStats, fetchSummary, shouldFetchData, selectedYear, loading } =
    usePaymentSummaryStore(
      (state) => ({
        monthlyStats: state.monthlyStats,
        fetchSummary: state.fetchSummary,
        shouldFetchData: state.shouldFetchData,
        selectedYear: state.selectedYear,
        loading: state.loading,
      }),
      shallow
    );

  const {
    monthlyStats: expenseMonthlyStats,
    fetchSummary: fetchExpenseSummary,
    shouldFetchData: shouldFetchExpenseData,
  } = useExpenseSummaryStore(
    (state) => ({
      monthlyStats: state.monthlyStats,
      fetchSummary: state.fetchSummary,
      shouldFetchData: state.shouldFetchData,
    }),
    shallow
  );

  // Estados para datos de usuarios
  const [hasCondominiumId, setHasCondominiumId] = useState<boolean>(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState<boolean>(false);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [condominiumInfo, setCondominiumInfo] = useState<{ name: string }>({
    name: "",
  });
  const [adminUsersCount, setAdminUsersCount] = useState<number>(0);

  // Acceder a los stores de usuarios y condominios
  const {
    condominiumsUsers,
    adminUsers,
    fetchCondominiumsUsers,
    fetchAdminUsers,
  } = useUserStore(
    (state) => ({
      condominiumsUsers: state.condominiumsUsers,
      adminUsers: state.adminUsers,
      fetchCondominiumsUsers: state.fetchCondominiumsUsers,
      fetchAdminUsers: state.fetchAdminUsers,
    }),
    shallow
  );

  const selectedCondominium = useCondominiumStore(
    (state) => state.selectedCondominium
  );

  // Verificar si tenemos condominiumId
  useEffect(() => {
    const checkCondominiumId = () => {
      const condominiumId = localStorage.getItem("condominiumId");
      const hasId = !!condominiumId;
      setHasCondominiumId(hasId);
      return hasId;
    };

    // Verificar inmediatamente
    if (checkCondominiumId()) {
      return; // Ya tenemos el ID, no es necesario el intervalo
    }

    // Si no hay ID, configurar un intervalo para verificar cada 1 segundo
    const intervalId = setInterval(() => {
      if (checkCondominiumId()) {
        clearInterval(intervalId); // Limpiar el intervalo cuando encontramos el ID
      }
    }, 1000);

    // Limpiar el intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadDataIfNeeded = async () => {
      // No intentar cargar si no hay condominiumId
      if (!hasCondominiumId) {
        return;
      }

      try {
        // Si no se ha intentado cargar datos, o si es necesario actualizar
        if (
          !dataFetchAttempted ||
          shouldFetchData(selectedYear) ||
          shouldFetchExpenseData(selectedYear)
        ) {
          setLocalLoading(true);

          // Fetch both payment and expense data
          await Promise.all([
            fetchSummary(selectedYear),
            fetchExpenseSummary(selectedYear),
            fetchCondominiumsUsers(),
            fetchAdminUsers(),
          ]);

          setDataFetchAttempted(true);
          setLocalLoading(false);
        }
      } catch (error) {
        console.error("Error al cargar datos del resumen:", error);
        setLocalLoading(false);
      }
    };

    loadDataIfNeeded();
  }, [
    fetchSummary,
    fetchExpenseSummary,
    fetchCondominiumsUsers,
    fetchAdminUsers,
    shouldFetchData,
    shouldFetchExpenseData,
    selectedYear,
    hasCondominiumId,
    dataFetchAttempted,
  ]);

  // Actualizar contadores de usuarios
  useEffect(() => {
    setUserCount(condominiumsUsers.length);
    setAdminUsersCount(adminUsers.length);
    if (selectedCondominium) {
      setCondominiumInfo({ name: selectedCondominium.name });
    }
  }, [condominiumsUsers, adminUsers, selectedCondominium]);

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const currentMonthStats = monthlyStats.find(
    (stat) => stat.month === currentMonth
  );

  const currentMonthExpenseStats = expenseMonthlyStats.find(
    (stat) => stat.month === currentMonth
  );

  const monthlyIncome = currentMonthStats?.paid || 0;
  const monthlyExpenses = currentMonthExpenseStats?.spent || 0;
  const ratio =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const financialCards = [
    {
      title: "Ingresos del Mes",
      amount: monthlyIncome,
      tooltip: "Total de ingresos registrados en el mes actual",
      icon: ArrowTrendingUpIcon,
      iconBackground: "bg-green-500",
    },
    {
      title: "Egresos del Mes",
      amount: monthlyExpenses,
      tooltip: "Total de egresos registrados en el mes actual",
      icon: ArrowTrendingDownIcon,
      iconBackground: "bg-red-500",
    },
    {
      title: "Ratio Ingresos/Egresos",
      amount: ratio,
      isPercentage: true,
      tooltip:
        "Porcentaje que representa la relación entre ingresos y egresos del mes actual",
      icon: ScaleIcon,
      iconBackground: "bg-blue-500",
    },
  ];

  // Nuevas tarjetas para información de usuarios
  const userCards = [
    {
      title: "Total Condóminos",
      amount: userCount,
      tooltip: "Número total de condóminos registrados",
      icon: UserGroupIcon,
      iconBackground: "bg-purple-500",
    },
    {
      title: "Administradores",
      amount: adminUsersCount,
      tooltip: "Número total de administradores",
      icon: UserIcon,
      iconBackground: "bg-amber-500",
    },
    {
      title: "Condominio",
      text: condominiumInfo.name,
      tooltip: "Nombre del condominio actual",
      icon: HomeIcon,
      iconBackground: "bg-indigo-500",
    },
  ];

  // Mostrar skeleton mientras carga o no hay datos
  const shouldShowSkeleton =
    loading || localLoading || !hasCondominiumId || !dataFetchAttempted;

  const ratioHealth =
    ratio >= 35 ? "Saludable" : ratio >= 10 ? "Atención" : "Riesgo";
  const ratioHealthClass =
    ratio >= 35
      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30"
      : ratio >= 10
      ? "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30"
      : "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30";

  if (shouldShowSkeleton) {
    return (
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Card
            key={index}
            className="p-4 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 relative animate-pulse"
          >
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Información del condominio
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Datos operativos base para contexto del panel.
          </p>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        {userCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.05 }}
          >
            <Card
              className={
                `relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 ` +
                (card.title === "Total Condóminos"
                  ? "bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900"
                  : card.title === "Administradores"
                  ? "bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900"
                  : "bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900")
              }
            >
              <div className="absolute top-2 right-2">
                <Tooltip text={card.tooltip} />
              </div>
              <div className="flex items-center mb-2">
                <div className={`rounded-md p-2 ${card.iconBackground} mr-3`}>
                  <card.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="flex flex-col gap-y-1.5">
                <span className="text-sm font-medium text-default-500">
                  {card.title}
                </span>
                {card.text ? (
                  <span
                    className={
                      `text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ` +
                      (card.title === "Total Condóminos"
                        ? "from-purple-500 to-purple-600 dark:from-purple-300 dark:to-purple-400"
                        : card.title === "Administradores"
                        ? "from-amber-500 to-amber-600 dark:from-amber-300 dark:to-amber-400"
                        : "from-indigo-500 to-indigo-600 dark:from-indigo-300 dark:to-indigo-400")
                    }
                  >
                    {card.text}
                  </span>
                ) : (
                  <span
                    className={
                      `text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ` +
                      (card.title === "Total Condóminos"
                        ? "from-purple-500 to-purple-600 dark:from-purple-300 dark:to-purple-400"
                        : card.title === "Administradores"
                        ? "from-amber-500 to-amber-600 dark:from-amber-300 dark:to-amber-400"
                        : "from-indigo-500 to-indigo-600 dark:from-indigo-300 dark:to-indigo-400")
                    }
                  >
                    {card.amount}
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Estadísticas financieras del mes actual
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Corte operativo del mes para revisar tendencia inmediata.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ratioHealthClass}`}
        >
          Estado del ratio: {ratioHealth}
        </span>
      </div>
      <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
        {financialCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.05 }}
          >
            <Card
              className={
                `relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 ` +
                (card.title === "Ingresos del Mes"
                  ? "bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900"
                  : card.title === "Egresos del Mes"
                  ? "bg-gradient-to-br from-red-50 to-white dark:from-gray-800 dark:to-gray-900"
                  : "bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900")
              }
            >
              <div className="absolute top-2 right-2">
                <Tooltip text={card.tooltip} />
              </div>
              <div className="flex items-center mb-2">
                <div className={`rounded-md p-2 ${card.iconBackground} mr-3`}>
                  <card.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="flex flex-col gap-y-1.5">
                <span className="text-sm font-medium text-default-500">
                  {card.title}
                </span>
                <span
                  className={
                    `text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ` +
                    (card.title === "Ingresos del Mes"
                      ? "from-green-500 to-green-600 dark:from-green-300 dark:to-green-400"
                      : card.title === "Egresos del Mes"
                      ? "from-red-500 to-red-600 dark:from-red-300 dark:to-red-400"
                      : "from-blue-500 to-blue-600 dark:from-blue-300 dark:to-blue-400")
                  }
                >
                  {card.isPercentage
                    ? `${ratio.toFixed(2)}%`
                    : formatCurrency(card.amount)}
                </span>
                {card.title === "Ratio Ingresos/Egresos" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Objetivo sugerido: mantenerse por encima de 30%.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default CardsHomeSummary;
