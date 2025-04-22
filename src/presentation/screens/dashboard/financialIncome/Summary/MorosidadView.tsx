// src/components/Summary/MorosidadView.tsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  usePaymentSummaryStore,
  PaymentRecord,
} from "../../../../../store/paymentSummaryStore";
import { useMorosityStore } from "../../../../../store/morosityStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import MorosidadPDFReport from "../Income/PDFMorosidadReport";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

// Interfaces para tipado
interface DebtorInfo {
  user: string;
  amount: number;
  userUID: string;
  numberCondominium: string;
}

interface ChartDataPoint {
  name: string;
  pending: number;
}

interface MorosityData {
  topDebtors: DebtorInfo[];
  totalPending: number;
  debtorsCount: number;
  maxDebtor: DebtorInfo;
  averageDebt: number;
  lineChartData: ChartDataPoint[];
}

// Caché global para almacenar los datos procesados entre renderizados
const globalMorosityCache: {
  allPayments: PaymentRecord[];
  lastFetchTimestamp: number;
  processedData: MorosityData | null;
} = {
  allPayments: [],
  lastFetchTimestamp: 0,
  processedData: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

const MorosidadView: React.FC = () => {
  const payments = usePaymentSummaryStore((state) => state.payments);
  const fetchSummary = usePaymentSummaryStore((state) => state.fetchSummary);
  const loading = usePaymentSummaryStore((state) => state.loading);
  const { notifyDebtor, initialize } = useMorosityStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  // Estado para controlar si ya se han cargado datos históricos
  const [historicalDataLoaded, setHistoricalDataLoaded] = useState(false);
  // Almacenar pagos históricos combinados
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>(
    () => globalMorosityCache.allPayments
  );

  // Función memoizada para formatear moneda
  const formatCurrency = useCallback(
    (value: number) =>
      "$" +
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  // Función memoizada para cargar datos históricos
  const loadAllPaymentData = useCallback(async () => {
    // Verificar si la caché es válida
    const now = Date.now();
    if (
      globalMorosityCache.lastFetchTimestamp > 0 &&
      now - globalMorosityCache.lastFetchTimestamp < CACHE_DURATION &&
      globalMorosityCache.allPayments.length > 0
    ) {
      setAllPayments(globalMorosityCache.allPayments);
      setHistoricalDataLoaded(true);
      return;
    }

    if (!historicalDataLoaded) {
      // Obtenemos el año actual
      const currentYear = new Date().getFullYear();

      // Cargamos datos de los últimos 3 años
      const yearsToLoad = [
        currentYear.toString(),
        (currentYear - 1).toString(),
        (currentYear - 2).toString(),
      ];

      for (const year of yearsToLoad) {
        await fetchSummary(year, true);
      }

      // Actualizamos el timestamp de la última carga
      globalMorosityCache.lastFetchTimestamp = now;
      setHistoricalDataLoaded(true);
    }
  }, [fetchSummary, historicalDataLoaded]);

  // Efecto para inicialización y carga de datos
  useEffect(() => {
    initialize();
    loadAllPaymentData();
  }, [initialize, loadAllPaymentData]);

  // Efecto para actualizar allPayments y la caché global cuando cambien los payments
  useEffect(() => {
    if (payments.length > 0) {
      setAllPayments((prev) => {
        // Combinamos los pagos existentes con los nuevos, evitando duplicados por ID
        const paymentMap = new Map<string, PaymentRecord>();

        // Primero añadimos los pagos previos
        prev.forEach((payment) => {
          paymentMap.set(payment.id, payment);
        });

        // Luego añadimos o actualizamos con los nuevos pagos
        payments.forEach((payment) => {
          paymentMap.set(payment.id, payment);
        });

        // Convertimos el mapa de vuelta a array
        const updatedPayments = Array.from(paymentMap.values());

        // Actualizamos la caché global
        globalMorosityCache.allPayments = updatedPayments;

        return updatedPayments;
      });
    }
  }, [payments]);

  // Cálculos de morosidad altamente optimizados con useMemo profundo
  const morosityStats = useMemo((): MorosityData => {
    // Si tenemos datos en caché y son recientes, usarlos
    if (
      globalMorosityCache.processedData &&
      Date.now() - globalMorosityCache.lastFetchTimestamp < CACHE_DURATION
    ) {
      return globalMorosityCache.processedData;
    }

    // Si no hay pagos, devolver valores por defecto
    if (allPayments.length === 0) {
      return {
        topDebtors: [],
        totalPending: 0,
        debtorsCount: 0,
        maxDebtor: {
          user: "N/A",
          amount: 0,
          userUID: "",
          numberCondominium: "",
        },
        averageDebt: 0,
        lineChartData: [],
      };
    }

    // Agrupamos por condómino y sumamos la morosidad
    const pendingByUser: Record<
      string,
      { amount: number; userUID: string; numberCondominium: string }
    > = {};

    // Usamos allPayments e incluimos la historia completa
    allPayments.forEach((p) => {
      const userKey = p.numberCondominium || "Desconocido";
      if (!pendingByUser[userKey]) {
        pendingByUser[userKey] = {
          amount: 0,
          userUID: p.userId || "",
          numberCondominium: userKey,
        };
      }
      // Si el pago no está marcado como pagado, sumamos el monto pendiente
      if (!p.paid) {
        pendingByUser[userKey].amount += p.amountPending;
      }
    });

    // Convertir en array para poder ordenar
    const pendingArray = Object.entries(pendingByUser).map(([user, data]) => ({
      user,
      ...data,
    }));

    // Ordenar desc para encontrar los top 20
    pendingArray.sort((a, b) => b.amount - a.amount);
    const topDebtors = pendingArray.slice(0, 20);

    // Estadísticas
    const totalPending = pendingArray.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    const debtorsCount = pendingArray.filter((item) => item.amount > 0).length;
    const maxDebtor =
      topDebtors.length > 0
        ? topDebtors[0]
        : { user: "N/A", amount: 0, userUID: "", numberCondominium: "" };
    const averageDebt = debtorsCount > 0 ? totalPending / debtorsCount : 0;

    // Datos para la gráfica de líneas (solo los top 10 para la gráfica)
    const lineChartData = topDebtors.slice(0, 10).map((debtor) => ({
      name: `#${debtor.user}`,
      pending: debtor.amount,
    }));

    // Guardar resultados procesados en la caché global
    const result: MorosityData = {
      topDebtors,
      totalPending,
      debtorsCount,
      maxDebtor,
      averageDebt,
      lineChartData,
    };

    globalMorosityCache.processedData = result;

    return result;
  }, [allPayments]);

  // Extraemos valores del resultado memoizado
  const {
    topDebtors,
    totalPending,
    debtorsCount,
    maxDebtor,
    averageDebt,
    lineChartData,
  } = morosityStats;

  // Función memoizada para enviar notificación a deudor
  const handleNotifyDebtor = useCallback(
    async (item: DebtorInfo) => {
      setLoadingStates((prev) => ({
        ...prev,
        [item.userUID]: true,
      }));
      try {
        await notifyDebtor({
          userUID: item.userUID,
          amount: item.amount,
          concept: "Adeudo pendiente",
          numberCondominium: item.numberCondominium,
        });
        toast.success(
          `Notificación enviada al condominio ${item.numberCondominium}`
        );
      } catch (error: any) {
        toast.error(error.message || "Error al enviar la notificación");
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [item.userUID]: false,
        }));
      }
    },
    [notifyDebtor]
  );

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">
        Vista de Morosidad
      </h2>

      {loading && !historicalDataLoaded ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-600 dark:text-gray-300">
            Cargando datos históricos de morosidad...
          </p>
        </div>
      ) : (
        <>
          {/* Tarjetas (cards) con detalles generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Total Pendiente
              </p>
              <p className="text-xl font-semibold">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Condominos con deuda &gt; 0
              </p>
              <p className="text-xl font-semibold">{debtorsCount}</p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Deudor Máximo
              </p>
              <p className="text-base font-semibold">#{maxDebtor.user}</p>
              <p className="text-xl font-semibold">
                {formatCurrency(maxDebtor.amount)}
              </p>
            </div>
            <div className="p-4 shadow-md rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Promedio de Deuda
              </p>
              <p className="text-xl font-semibold">
                {formatCurrency(averageDebt)}
              </p>
            </div>
          </div>

          {/* Nota sobre datos históricos */}
          <div className="mb-4 bg-indigo-50 dark:bg-indigo-900 p-3 rounded-md">
            <p className="text-sm text-indigo-700 dark:text-blue-200">
              Nota: Esta vista incluye deudas de todos los años para mostrar la
              morosidad total acumulada.
            </p>
          </div>

          {/* Tabla con top 20 morosos en dos columnas responsivas */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">
              Condominos con mayor monto pendiente{" "}
              <span className="text-gray-600 text-xs dark:text-gray-400">
                (20 condóminos con mayor deuda)
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primera columna (top 1-10) */}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        # Condómino
                      </th>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        Monto Pendiente
                      </th>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDebtors
                      .slice(0, 10)
                      .filter((item) => item.user !== "N/A")
                      .map((item) => (
                        <tr
                          key={item.user}
                          className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <td className="py-2 px-4 border-b">{item.user}</td>
                          <td className="py-2 px-4 border-b">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <button
                              onClick={() => handleNotifyDebtor(item)}
                              disabled={loadingStates[item.userUID]}
                              className="bg-[#f87171] w-32 justify-center text-white px-4 text-xs py-1 rounded hover:bg-[#ef4444] transition-colors flex items-center gap-2 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
                            >
                              <BellAlertIcon className="h-4 w-4" />
                              {loadingStates[item.userUID]
                                ? "Enviando..."
                                : "Notificar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Segunda columna (top 11-20) */}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        # Usuario
                      </th>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        Monto Pendiente
                      </th>
                      <th className="py-2 px-4 text-left border-b dark:bg-gray-900">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDebtors
                      .slice(10, 20)
                      .filter((item) => item.user !== "N/A")
                      .map((item) => (
                        <tr
                          key={item.user}
                          className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <td className="py-2 px-4 border-b">{item.user}</td>
                          <td className="py-2 px-4 border-b">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <button
                              onClick={() => handleNotifyDebtor(item)}
                              disabled={loadingStates[item.userUID]}
                              className="bg-[#f87171] w-32 justify-center text-white px-4 text-xs py-1 rounded hover:bg-[#ef4444] transition-colors flex items-center gap-2 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
                            >
                              <BellAlertIcon className="h-4 w-4" />
                              {loadingStates[item.userUID]
                                ? "Enviando..."
                                : "Notificar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Gráfica de líneas - Top 10 Morosos (se mantiene con los 10 principales) */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Condominos con morosidad</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={lineChartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(val: number) => formatCurrency(val)}
                    width={80}
                  />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pendiente"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={{ r: 4 }} // Pequeño círculo en cada punto
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Botón para generar el reporte PDF de morosidad */}
          <div className="mt-6 text-left">
            <p className="text-sm text-gray-600 mb-4 dark:text-gray-100">
              Descarga un reporte detallado con la lista de cargos pendientes
              por condomino.
            </p>
            <MorosidadPDFReport />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(MorosidadView);
