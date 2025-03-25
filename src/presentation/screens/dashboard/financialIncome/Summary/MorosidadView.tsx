// src/components/Summary/MorosidadView.tsx
import React, { useMemo, useEffect, useState } from "react";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
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

const MorosidadView: React.FC = () => {
  const payments = usePaymentSummaryStore((state) => state.payments);
  const { notifyDebtor, initialize } = useMorosityStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    initialize();
  }, []);

  // Función para formatear moneda
  const formatCurrency = (value: number) =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /**
   * Cálculo de estadísticas de morosidad:
   * - Sumamos 'amountPending' por usuario.
   */
  const {
    topDebtors, // array con los 10 usuarios con mayor pendiente
    totalPending, // monto total pendiente de todos los usuarios
    debtorsCount, // cuántos usuarios tienen deuda > 0
    maxDebtor, // usuario con mayor deuda
    averageDebt, // promedio de deuda por usuario
  } = useMemo(() => {
    // Agrupamos por condómino y sumamos la morosidad
    const pendingByUser: Record<
      string,
      { amount: number; userUID: string; numberCondominium: string }
    > = {};

    payments.forEach((p) => {
      const userKey = p.numberCondominium || "Desconocido";
      if (!pendingByUser[userKey]) {
        pendingByUser[userKey] = {
          amount: 0,
          userUID: p.userId || "",
          numberCondominium: userKey,
        };
      }
      pendingByUser[userKey].amount += p.amountPending;
    });

    // Convertir en array para poder ordenar
    const pendingArray = Object.entries(pendingByUser).map(([user, data]) => ({
      user,
      ...data,
    }));

    // Ordenar desc para encontrar los top 10
    pendingArray.sort((a, b) => b.amount - a.amount);
    const topDebtors = pendingArray.slice(0, 10);

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

    return {
      topDebtors,
      totalPending,
      debtorsCount,
      maxDebtor,
      averageDebt,
    };
  }, [payments]);

  /**
   * Datos para la gráfica de líneas
   * Cada objeto es { name: "#101", pending: 5000 }
   */
  const lineChartData = useMemo(
    () =>
      topDebtors.map((debtor) => ({
        name: `#${debtor.user}`,
        pending: debtor.amount,
      })),
    [topDebtors]
  );

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">
        Vista de Morosidad
      </h2>

      {/* Tarjetas (cards) con detalles generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Total Pendiente
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Condominos con deuda &gt; 0
          </p>
          <p className="text-2xl font-semibold">{debtorsCount}</p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Deudor Máximo
          </p>
          <p className="text-base font-semibold">#{maxDebtor.user}</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(maxDebtor.amount)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Promedio de Deuda
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(averageDebt)}
          </p>
        </div>
      </div>

      {/* Tabla con top 10 morosos */}
      <div className="overflow-x-auto mb-6">
        <h3 className="text-lg font-bold mb-2">
          Condominos con mayor monto pendiente
        </h3>
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
                      onClick={async () => {
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
                          toast.error(
                            error.message || "Error al enviar la notificación"
                          );
                        } finally {
                          setLoadingStates((prev) => ({
                            ...prev,
                            [item.userUID]: false,
                          }));
                        }
                      }}
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

      {/* Gráfica de líneas - Top 10 Morosos */}
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
          Descarga un reporte detallado con la lista de cargos pendientes por
          condomino.
        </p>
        <MorosidadPDFReport />
      </div>
    </div>
  );
};

export default MorosidadView;
