// src/components/PaymentHistory.tsx

import { useState, useEffect } from "react";
import { usePaymentHistoryStore, PaymentRecord } from "../../../../../store/paymentHistoryStore";
import useUserStore from "../../../../../store/UserDataStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import PDFReportGeneratorSingle from "./PDFReportGeneratorSingle";


const PaymentHistory = () => {
  const [selectedUserUid, setSelectedUserUid] = useState<string>("");
  const [selectedCondominiumNumber, setSelectedCondominiumNumber] = useState<string>("");

  // Obtener lista de condominios (usuarios)
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  // Store de historial individual
  const {
    payments,
    detailed,
    detailedByConcept, // <-- nuevo: para reporte por concepto
    loading,
    error,
    selectedYear,
    fetchPayments,
    setSelectedYear,
    // Datos de la administradora y base64
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureBase64,
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

  // Reconsultar historial si cambia el condomino o el año
  useEffect(() => {
    if (selectedCondominiumNumber && selectedYear) {
      fetchPayments(selectedCondominiumNumber, selectedYear);
    }
  }, [selectedCondominiumNumber, selectedYear, fetchPayments]);

  // Preparar datos para la gráfica: agrupar por mes (se extrae el mes de "YYYY-MM")
  const chartData = payments.reduce(
    (acc: Record<string, { paid: number; pending: number; saldo: number }>, payment: PaymentRecord) => {
      const month = payment.month.split("-")[1]; // ej: "01"
      if (!acc[month]) {
        acc[month] = { paid: 0, pending: 0, saldo: 0 };
      }
      acc[month].paid += payment.amountPaid;
      acc[month].pending += payment.amountPending;
      acc[month].saldo += payment.creditBalance;
      return acc;
    },
    {}
  );

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

  const chartArray = Object.entries(chartData)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([month, data]) => ({
      month: monthNames[month] || month,
      ...data,
    }));

  const selectedCondo = condominiumsUsers.find((u) => u.uid === selectedUserUid);

  return (
    <div className="p-4">
      {/* Filtros: Selección de Condomino y Año */}
      <div className="flex flex-col gap-4 mb-4 mt-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Resumen individual por condomino</h2>
          <label className="block font-medium mb-1">Selecciona un Condomino</label>
          <select
            value={selectedUserUid}
            onChange={handleUserChange}
            className="border border-gray-300 rounded p-2 w-full"
          >
            <option value="">-- Selecciona un condomino --</option>
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
            className="border border-gray-300 rounded p-2 w-full"
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

      {/* Gráfica: Resumen por Mes */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Resumen por Mes</h3>
        {chartArray.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartArray}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" fill="#4D44E0" name="Monto Abonado" />
              <Bar dataKey="pending" fill="#819CFB" name="Monto Pendiente" />
              <Bar dataKey="saldo" fill="#9dcdfa" name="Saldo a favor" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No hay datos para mostrar en el gráfico.</p>
        )}
      </div>

      {/* Componente para generar reporte PDF individual */}
      {selectedUserUid && selectedCondo && (
        <PDFReportGeneratorSingle
          year={selectedYear}
          condominium={{
            number: selectedCondo.number || "",
            name: selectedCondo.name || "",
          }}
          // Se pasa la agrupación por mes para el reporte general
          detailed={detailed}
          // Se pasa la agrupación por concepto para el reporte por concepto
          detailedByConcept={detailedByConcept}
          // Se pasan los datos de la administradora
          adminCompany={adminCompany}
          adminPhone={adminPhone}
          adminEmail={adminEmail}
          // Se pasa el logo y firma desde el store, no desde utils/base64
          logoBase64={logoBase64}
          signatureBase64={signatureBase64}
        />
      )}
    </div>
  );
};

export default PaymentHistory;
