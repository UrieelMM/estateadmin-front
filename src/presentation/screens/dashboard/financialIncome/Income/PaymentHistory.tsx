// src/components/PaymentHistory.tsx

import { useState, useEffect, useMemo } from "react";
import {
  usePaymentHistoryStore,
  PaymentRecord,
} from "../../../../../store/paymentHistoryStore";
import useUserStore from "../../../../../store/UserDataStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import PDFReportGeneratorSingle from "./PDFReportGeneratorSingle";

const chartColors = ["#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6"];

/**
 * Formato de moneda: $2,500.00
 */
const formatCurrency = (value: number): string => {
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const PaymentHistory = () => {
  const [selectedUserUid, setSelectedUserUid] = useState<string>("");
  const [selectedCondominiumNumber, setSelectedCondominiumNumber] =
    useState<string>("");

  // Obtener lista de condominios (usuarios)
  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  // Store de historial individual
  const {
    payments,
    detailed,
    detailedByConcept,
    loading,
    error,
    selectedYear,
    fetchPayments,
    setSelectedYear,
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    // currentCreditBalance, // NUEVO: saldo actual (en centavos)
    pendingAmount, // NUEVO: monto pendiente (suma de cargos no pagados)
  } = usePaymentHistoryStore();

  // Cargar usuarios al montar
  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  // Cuando el usuario selecciona un condómino, se actualiza el UID y el número
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    setSelectedUserUid(uid);
    const user = condominiumsUsers.find((u) => u.uid === uid);
    if (user) {
      setSelectedCondominiumNumber(user.number ? String(user.number) : "");
    }
  };

  // Actualizar año y recargar datos
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
    if (selectedCondominiumNumber) {
      fetchPayments(selectedCondominiumNumber, newYear);
    }
  };

  // Reconsultar historial si cambia el condómino o el año
  useEffect(() => {
    if (selectedCondominiumNumber && selectedYear) {
      fetchPayments(selectedCondominiumNumber, selectedYear);
    }
  }, [selectedCondominiumNumber, selectedYear, fetchPayments]);

  const monthNames: Record<string, string> = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };

  // Preparar datos para la gráfica: agrupar por mes (YYYY-MM) => { paid, pending, saldo }
  const chartData = payments.reduce(
    (
      acc: Record<
        string,
        {
          paid: number;
          pending: number;
          saldo: number;
          creditUsed: number;
          creditBalance: number;
        }
      >,
      payment: PaymentRecord
    ) => {
      let [_yearPart, monthPart] = ["", ""];
      if (payment.month.includes("-")) {
        [_yearPart, monthPart] = payment.month.split("-");
      } else {
        monthPart = payment.month;
      }

      if (!acc[monthPart]) {
        acc[monthPart] = {
          paid: 0,
          pending: 0,
          saldo: 0,
          creditUsed: 0,
          creditBalance: 0,
        };
      }
      acc[monthPart].paid += payment.amountPaid;
      acc[monthPart].pending += payment.referenceAmount;
      acc[monthPart].creditUsed += payment.creditUsed || 0;
      acc[monthPart].creditBalance += payment.creditBalance;
      acc[monthPart].saldo += payment.creditBalance - (payment.creditUsed || 0);
      return acc;
    },
    {}
  );

  // Convertir objeto en array ordenada por mes
  const chartArray = Object.entries(chartData)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([month, data]) => ({
      month: monthNames[month] || month,
      paid:
        data.paid +
        (data.creditBalance > 0 ? data.creditBalance : 0) -
        data.creditUsed,
      pending: data.pending,
      saldo: data.saldo,
    }));

  // Cálculos interesantes: totalPaidYear y mes con mayor recaudación se basan en el gráfico
  const { totalPaidYear, bestMonthName } = useMemo(() => {
    let totalPaidYear = 0;
    let monthMaxIndex = -1;
    let maxPaid = 0;

    chartArray.forEach((item, idx) => {
      totalPaidYear += item.paid;
      if (item.paid > maxPaid) {
        maxPaid = item.paid;
        monthMaxIndex = idx;
      }
    });

    const bestMonthName =
      monthMaxIndex !== -1 ? chartArray[monthMaxIndex].month : "N/A";
    return { totalPaidYear, bestMonthName };
  }, [chartArray]);

  // Obtenemos el condómino seleccionado (para el PDF)
  const selectedCondo = condominiumsUsers.find(
    (u) => u.uid === selectedUserUid
  );

  return (
    <div className="p-4">
      {/* Filtros: Selección de Condómino y Año */}
      <div className="flex flex-col gap-4 mb-4 mt-6">
        <div>
          <h2 className="text-xl font-bold mb-4">
            Resumen individual por condómino
          </h2>
          <label className="block font-medium mb-1">
            Selecciona un Condómino
          </label>
          <select
            value={selectedUserUid}
            onChange={handleUserChange}
            className="w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
          >
            <option value="">-- Selecciona un condómino --</option>
            {condominiumsUsers
              .filter(
                (user) =>
                  user.role !== "admin" &&
                  user.role !== "super-admin" &&
                  user.role !== "security"
              )
              .map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.number} {user.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Año</label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
          >
            {["2022", "2023", "2024", "2025"].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingApp />}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Tarjetas con datos interesantes del año */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Total Monto Abonado
          </p>
          <p className="text-xl font-semibold">
            {formatCurrency(totalPaidYear)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Total Cargos
          </p>
          <p className="text-xl font-semibold">
            {formatCurrency(pendingAmount)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Saldo</p>
          <p className="text-xl font-semibold">
            {formatCurrency(pendingAmount - totalPaidYear)}
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Mes con mayor recaudación
          </p>
          <p className="text-xl font-semibold">{bestMonthName}</p>
        </div>
      </div>

      {/* Gráfica: Resumen por Mes */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Resumen por mes</h3>
        {chartArray.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartArray}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(val: number) => formatCurrency(val)}
                width={80}
              />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="paid"
                name="Monto Abonado"
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Cargos"
                stroke={chartColors[1]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke={chartColors[2]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No hay datos para mostrar en el gráfico.</p>
        )}
      </div>

      {/* Reporte PDF individual */}
      {selectedUserUid && selectedCondo && (
        <PDFReportGeneratorSingle
          year={selectedYear}
          condominium={{
            number: selectedCondo.number || "",
            name: selectedCondo.name || "",
          }}
          detailed={detailed}
          detailedByConcept={detailedByConcept}
          adminCompany={adminCompany}
          adminPhone={adminPhone}
          adminEmail={adminEmail}
          logoBase64={logoBase64}
        />
      )}
    </div>
  );
};

export default PaymentHistory;
