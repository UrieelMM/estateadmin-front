// src/components/PaymentSummary.tsx
import React, { useEffect, useState } from "react";
import { usePaymentSummaryStore, MonthlyStat, PaymentRecord } from "../../../../../store/paymentSummaryStore";
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
import PDFReportGenerator from "./PDFReportGenerator";
import useUserStore from "../../../../../store/UserDataStore";
import { Card } from "@heroui/react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------- COMPONENTES DE CRECIMIENTO ------------------- */

// Tarjeta de crecimiento global para una métrica
type GrowthCardProps = {
  title: string;
  current: number;
  previous: number;
};

const GrowthCard = ({ title, current, previous }: GrowthCardProps) => {
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
          {"$" + current.toLocaleString()}
          <span className="ml-2 text-sm font-medium text-gray-500">
            desde {"$" + previous.toLocaleString()}
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

// Fila individual dentro de una card por concepto
type GrowthRowProps = {
  label: string;
  current: number;
  previous: number;
};

const GrowthRow = ({ label, current, previous }: GrowthRowProps) => {
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
          {"$" + current.toLocaleString()}
          <span className="ml-2 text-sm font-medium text-gray-500">
            desde {"$" + previous.toLocaleString()}
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
};

// Card de crecimiento para cada concepto.
// Se agrega la prop opcional maxMonth para filtrar meses futuros en el año en curso.
type GrowthConceptCardProps = {
  concept: string;
  records: PaymentRecord[];
  maxMonth?: number;
};

const GrowthConceptCard = ({ concept, records, maxMonth }: GrowthConceptCardProps) => {
  // Definimos los meses base
  const monthKeys = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  // Agrupar data por mes y, si se pasa maxMonth, solo incluir meses <= maxMonth
  const dataByMonth = monthKeys
    .filter((m) => {
      if (maxMonth) {
        return parseInt(m) <= maxMonth;
      }
      return true;
    })
    .map((m) => {
      const recs = records.filter((r) => r.month === m);
      return {
        month: m,
        paid: recs.reduce((sum: number, r: PaymentRecord) => sum + r.amountPaid, 0),
        pending: recs.reduce((sum: number, r: PaymentRecord) => sum + r.amountPending, 0),
        saldo: recs.reduce((sum: number, r: PaymentRecord) => sum + r.creditBalance, 0),
      };
    })
    .filter((item) => item.paid !== 0 || item.pending !== 0 || item.saldo !== 0);

  if (dataByMonth.length < 2) {
    return (
      <div className="px-2 py-3 sm:p-6 bg-white shadow rounded-lg w-full 2xl:w-[49%]">
        <h4 className="text-base font-semibold text-gray-900">{concept}</h4>
        <p className="mt-1 text-sm text-gray-500">
          No hay suficientes datos para calcular crecimiento.
        </p>
      </div>
    );
  }

  const previousData = dataByMonth[dataByMonth.length - 2];
  const currentData = dataByMonth[dataByMonth.length - 1];

  return (
    <div className="px-2 py-3 sm:p-6 bg-white shadow rounded-lg w-full 2xl:w-[49%]">
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
};

/* ------------------- COMPONENTE PAYMENT SUMMARY ------------------- */

const PaymentSummary = () => {
  const {
    totalIncome,
    totalPending,
    monthlyStats,
    loading,
    error,
    selectedYear,
    fetchSummary,
    setSelectedYear,
    totalCondominiums,
    detailed,
    conceptRecords,
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureBase64,
  } = usePaymentSummaryStore();

  const [year, setYear] = useState(selectedYear);
  const [showAllConceptCards, setShowAllConceptCards] = useState(false);


  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  useEffect(() => {
    fetchSummary(year);
  }, [year, fetchSummary]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setYear(newYear);
    setSelectedYear(newYear);
    fetchSummary(newYear);
  };

  // Ordenamos las estadísticas mensuales
  const sortedMonthlyStats = [...monthlyStats].sort(
    (a, b) => parseInt(a.month) - parseInt(b.month)
  );

  // Para el año en curso, filtramos solo los meses hasta el mes actual
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthNumber = now.getMonth() + 1;
  const filteredMonthlyStats = sortedMonthlyStats.filter((stat: MonthlyStat) => {
    if (year === currentYear) {
      return parseInt(stat.month) <= currentMonthNumber;
    }
    return true;
  });

  let maxMonth = "";
  let minMonth = "";
  if (filteredMonthlyStats.length > 0) {
    const sortedByPaid = [...filteredMonthlyStats].sort((a, b) => a.paid - b.paid);
    minMonth = monthNames[sortedByPaid[0].month] || sortedByPaid[0].month;
    maxMonth =
      monthNames[sortedByPaid[sortedByPaid.length - 1].month] ||
      sortedByPaid[sortedByPaid.length - 1].month;
  }

  // Cálculo de crecimiento global (si existen al menos 2 meses de data)
  let overallGrowthMetrics: Array<{
    title: string;
    current: number;
    previous: number;
  }> = [];
  if (filteredMonthlyStats.length >= 2) {
    const previousMonthStats =
      filteredMonthlyStats[filteredMonthlyStats.length - 2];
    const currentMonthStats =
      filteredMonthlyStats[filteredMonthlyStats.length - 1];
    overallGrowthMetrics = [
      {
        title: "Monto abonado",
        current: currentMonthStats.paid,
        previous: previousMonthStats.paid,
      },
      {
        title: "Monto pendiente",
        current: currentMonthStats.pending,
        previous: previousMonthStats.pending,
      },
      {
        title: "Saldo a favor",
        current: currentMonthStats.saldo,
        previous: previousMonthStats.saldo,
      },
    ];
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Reporte general</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Año:</label>
          <select
            value={year}
            onChange={handleYearChange}
            className="border border-gray-300 rounded py-2 px-8"
          >
            {["2022", "2023", "2024", "2025"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingApp />}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <>
          {/* Estadísticas principales con HeroUI */}
          <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
            <Card className="p-4 shadow-md rounded-md">
              <div className="flex flex-col gap-y-2">
                <span className="text-sm font-medium text-default-500">
                  Total ingresos:
                </span>
                <span className="text-2xl font-semibold text-default-700">
                  {"$" + totalIncome.toFixed(2)}
                </span>
              </div>
            </Card>
            <Card className="p-4 shadow-md rounded-md">
              <div className="flex flex-col gap-y-2">
                <span className="text-sm font-medium text-default-500">
                  Total pendiente:
                </span>
                <span className="text-2xl font-semibold text-default-700">
                  {"$" + totalPending.toFixed(2)}
                </span>
              </div>
            </Card>
            <Card className="p-4 shadow-md rounded-md">
              <div className="flex flex-col gap-y-2">
                <span className="text-sm font-medium text-default-500">
                  Total condominos:
                </span>
                <span className="text-2xl font-semibold text-default-700">
                  {totalCondominiums}
                </span>
              </div>
            </Card>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 mb-8 sm:grid-cols-2">
            <Card className="p-4 shadow-md rounded-md">
              <div className="flex flex-col gap-y-2">
                <span className="text-sm font-medium text-default-500">
                  Mes con mayor ingresos:
                </span>
                <span className="text-2xl font-semibold text-default-700">
                  {maxMonth || "N/D"}
                </span>
              </div>
            </Card>
            <Card className="p-4 shadow-md rounded-md">
              <div className="flex flex-col gap-y-2">
                <span className="text-sm font-medium text-default-500">
                  Mes con menor ingresos:
                </span>
                <span className="text-2xl font-semibold text-default-700">
                  {minMonth || "N/D"}
                </span>
              </div>
            </Card>
          </div>

          {/* Sección: Gráfico y Comparativa mes a mes (totales) */}
          <div className="mb-8" style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={sortedMonthlyStats.map((stat) => ({
                  month: monthNames[stat.month] || stat.month,
                  paid: stat.paid,
                  pending: stat.pending,
                  saldo: stat.saldo,
                }))}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" fill="#4D44E0" name="Monto Abonado" />
                <Bar dataKey="pending" fill="#819CFB" name="Monto Pendiente" />
                <Bar dataKey="saldo" fill="#9dcdfa" name="Saldo a favor" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sección: Crecimiento respecto al mes anterior */}
          {filteredMonthlyStats.length >= 2 && (
            <>
              <h3 className="text-xl font-bold mb-4">
                Recaudación respecto al mes anterior
              </h3>
              <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0 mb-8">
                {overallGrowthMetrics.map((metric) => (
                  <GrowthCard
                    key={metric.title}
                    title={metric.title}
                    current={metric.current}
                    previous={metric.previous}
                  />
                ))}
              </dl>
            </>
          )}

          <div className="mb-8 flex flex-col lg:flex-row gap-4">
            {/* Comparativa mes a mes (totales) */}
            <div className="mb-8 w-full">
              <h3 className="text-xl font-bold mb-2">Comparativa mes a mes (totales)</h3>
              <table className="min-w-full border-collapse border border-indigo-200">
                <thead>
                  <tr className="bg-indigo-500">
                    <th className="border p-2 text-white">Mes</th>
                    <th className="border p-2 text-white">Monto abonado</th>
                    <th className="border p-2 text-white">Monto pendiente</th>
                    <th className="border p-2 text-white">Saldo a favor</th>
                    <th className="border p-2 text-white">% Cumplimiento</th>
                    <th className="border p-2 text-white">% Morosidad</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthlyStats.map((row) => (
                    <tr key={row.month}>
                      <td className="border p-2">{monthNames[row.month] || row.month}</td>
                      <td className="border p-2">{"$" + row.paid.toFixed(2)}</td>
                      <td className="border p-2">{"$" + row.pending.toFixed(2)}</td>
                      <td className="border p-2">{"$" + row.saldo.toFixed(2)}</td>
                      <td className="border p-2">{row.complianceRate.toFixed(2)}%</td>
                      <td className="border p-2">{row.delinquencyRate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8 flex flex-col lg:flex-row gap-4">
            {/* Ingresos por concepto (tabla detallada) */}
            {conceptRecords && Object.keys(conceptRecords).length > 0 && (
              <div className="mb-8 w-full lg:w-3/5">
                <h3 className="text-xl font-bold mb-2">Ingresos por concepto</h3>
                {Object.entries(conceptRecords).map(([concept, records]) => (
                  <details key={concept} className="mb-6 border rounded">
                    <summary className="cursor-pointer bg-indigo-500 px-4 py-2 text-white font-bold">
                      {concept}
                    </summary>
                    <div className="p-4">
                      {(() => {
                        const monthKeys = [
                          "01",
                          "02",
                          "03",
                          "04",
                          "05",
                          "06",
                          "07",
                          "08",
                          "09",
                          "10",
                          "11",
                          "12",
                        ];
                        let totalPaid = 0,
                          totalPending = 0,
                          totalCredit = 0,
                          totalRecords = 0,
                          totalPaidRecords = 0;
                        const rows = monthKeys.map((m) => {
                          const recs = records.filter((r) => r.month === m);
                          const paid = recs.reduce(
                            (sum, r) => sum + r.amountPaid,
                            0
                          );
                          const pending = recs.reduce(
                            (sum, r) => sum + r.amountPending,
                            0
                          );
                          const credit = recs.reduce(
                            (sum, r) => sum + r.creditBalance,
                            0
                          );
                          totalPaid += paid;
                          totalPending += pending;
                          totalCredit += credit;
                          totalRecords += recs.length;
                          totalPaidRecords += recs.filter((r) => r.paid).length;
                          const compliance =
                            recs.length > 0
                              ? (recs.filter((r) => r.paid).length / recs.length) *
                              100
                              : 0;
                          const delinquency = 100 - compliance;
                          return (
                            <tr key={m}>
                              <td className="border p-2">{monthNames[m] || m}</td>
                              <td className="border p-2">{"$" + paid.toFixed(2)}</td>
                              <td className="border p-2">{"$" + pending.toFixed(2)}</td>
                              <td className="border p-2">{"$" + credit.toFixed(2)}</td>
                              <td className="border p-2">{compliance.toFixed(2)}%</td>
                              <td className="border p-2">{delinquency.toFixed(2)}%</td>
                            </tr>
                          );
                        });
                        const totalCompliance =
                          totalRecords > 0
                            ? (totalPaidRecords / totalRecords) * 100
                            : 0;
                        const totalDelinquency = 100 - totalCompliance;
                        return (
                          <>
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 mb-4 custom-scrollbar">
                              <table className="min-w-full border-collapse border border-indigo-200">
                                <thead>
                                  <tr className="bg-indigo-500">
                                    <th className="border p-2 text-white">Mes</th>
                                    <th className="border p-2 text-white">Monto abonado</th>
                                    <th className="border p-2 text-white">Monto pendiente</th>
                                    <th className="border p-2 text-white">Saldo a favor</th>
                                    <th className="border p-2 text-white">% Cumplimiento</th>
                                    <th className="border p-2 text-white">% Morosidad</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows}
                                  <tr>
                                    <td className="border p-2 font-bold">Total</td>
                                    <td className="border p-2 font-bold">{"$" + totalPaid.toFixed(2)}</td>
                                    <td className="border p-2 font-bold">{"$" + totalPending.toFixed(2)}</td>
                                    <td className="border p-2 font-bold">{"$" + totalCredit.toFixed(2)}</td>
                                    <td className="border p-2 font-bold">{totalCompliance.toFixed(2)}%</td>
                                    <td className="border p-2 font-bold">{totalDelinquency.toFixed(2)}%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <PDFReportGenerator
                              year={year}
                              totalIncome={totalIncome}
                              totalPending={totalPending}
                              maxMonth={maxMonth || ""}
                              minMonth={minMonth || ""}
                              monthlyStats={sortedMonthlyStats}
                              detailed={detailed}
                              allCondominiums={condominiumsUsers.map((user) => ({
                                number: String(user.number),
                                name: user.name,
                              }))}
                              logoBase64={logoBase64}
                              signatureBase64={signatureBase64}
                              adminCompany={adminCompany}
                              adminPhone={adminPhone}
                              adminEmail={adminEmail}
                              concept={concept}
                              conceptData={records}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </details>
                ))}
              </div>
            )}
            {/* Sección: Crecimiento por concepto */}
            {conceptRecords && Object.keys(conceptRecords).length > 0 && (
              <div className="mb-8 w-full lg:w-2/5">
                <h3 className="text-xl font-bold mb-4">
                  Recaudación por concepto{" "}
                  <span className="text-xs font-medium text-gray-500">
                    En comparación al mes anterior
                  </span>
                </h3>
                <div className="flex justify-between flex-wrap gap-4">
                  {(showAllConceptCards
                    ? Object.entries(conceptRecords)
                    : Object.entries(conceptRecords).slice(0, 4)
                  ).map(([concept, records]) => (
                    <GrowthConceptCard
                      key={concept}
                      concept={concept}
                      records={records}
                      maxMonth={year === currentYear ? currentMonthNumber : undefined}
                    />
                  ))}
                </div>
                {Object.entries(conceptRecords).length > 4 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      className="btn-primary px-4 py-2"
                      onClick={() => setShowAllConceptCards(!showAllConceptCards)}
                    >
                      {showAllConceptCards ? "Mostrar menos" : "Mostrar más"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <PDFReportGenerator
            year={year}
            totalIncome={totalIncome}
            totalPending={totalPending}
            maxMonth={maxMonth || ""}
            minMonth={minMonth || ""}
            monthlyStats={sortedMonthlyStats}
            detailed={detailed}
            allCondominiums={condominiumsUsers.map((user) => ({
              number: String(user.number),
              name: user.name,
            }))}
            logoBase64={logoBase64}
            signatureBase64={signatureBase64}
            adminCompany={adminCompany}
            adminPhone={adminPhone}
            adminEmail={adminEmail}
            conceptRecords={conceptRecords}
          />
        </>
      )}
    </div>
  );
};

export default PaymentSummary;
