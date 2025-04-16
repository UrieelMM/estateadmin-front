// src/components/Summary/DetailedConceptsTable.tsx
import React, { useMemo, useState } from "react";
import {
  usePaymentSummaryStore,
  PaymentRecord,
  MonthlyStat,
} from "../../../../../store/paymentSummaryStore";
import PDFReportGenerator from "../Income/PDFReportGenerator";
import useUserStore from "../../../../../store/UserDataStore";
// Add CSS animation keyframes
import "./DetailedConceptsTable.css";

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

type DetailedConceptsTableProps = {
  maxMonth?: string;
  minMonth?: string;
};

const DetailedConceptsTable: React.FC<DetailedConceptsTableProps> = React.memo(
  ({ maxMonth = "", minMonth = "" }) => {
    const {
      conceptRecords,
      selectedYear: year,
      totalIncome,
      totalPending,
      monthlyStats,
      detailed,
      adminCompany,
      adminPhone,
      adminEmail,
      logoBase64,
      signatureBase64,
    } = usePaymentSummaryStore((state) => ({
      conceptRecords: state.conceptRecords,
      selectedYear: state.selectedYear,
      totalIncome: state.totalIncome,
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
      detailed: state.detailed,
      adminCompany: state.adminCompany,
      adminPhone: state.adminPhone,
      adminEmail: state.adminEmail,
      logoBase64: state.logoBase64,
      signatureBase64: state.signatureBase64,
    }));

    const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
    const [showAll, setShowAll] = useState(false);
    const [openConcepts, setOpenConcepts] = useState<Record<string, boolean>>(
      {}
    );

    const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
      return [...monthlyStats].sort(
        (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
      );
    }, [monthlyStats]);

    const filteredConceptEntries = Object.entries(conceptRecords || {}).filter(
      ([concept]) => concept !== "Pago no identificado"
    );

    const displayedConceptEntries = showAll
      ? filteredConceptEntries
      : filteredConceptEntries.slice(0, 3);

    if (!conceptRecords || Object.keys(conceptRecords).length === 0)
      return null;

    return (
      <div className="mb-8 grid grid-cols-1 gap-6">
        <div className="mb-8 w-full">
          <h3 className="title text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 relative z-10">
            Ingresos por concepto
          </h3>

          {/* Mobile Concept Filter (Visible on small screens) */}
          <div className="mb-4 sm:hidden">
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              onChange={(e) =>
                e.target.value
                  ? document
                      .getElementById(`concept-${e.target.value}`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  : null
              }
            >
              <option value="">Todos los conceptos</option>
              {filteredConceptEntries.map(([concept]) => (
                <option key={concept} value={concept.replace(/\s+/g, "-")}>
                  {concept}
                </option>
              ))}
            </select>
          </div>

          {displayedConceptEntries.map(([concept, records]) => {
            const isOpen = openConcepts[concept] || false;
            const toggleConcept = () => {
              setOpenConcepts((prev) => ({
                ...prev,
                [concept]: !prev[concept],
              }));
            };

            return (
              <div
                key={concept}
                id={`concept-${concept.replace(/\s+/g, "-")}`}
                className="mb-6 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 concept-card overflow-hidden"
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleConcept();
                      e.preventDefault();
                    }
                  }}
                  onClick={toggleConcept}
                  className="cursor-pointer bg-gray-50 dark:from-gray-800 dark:to-gray-750 px-5 py-4 flex items-center justify-between"
                >
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 concept-header">
                    {concept}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm">
                      {records.length} registro{records.length !== 1 ? "s" : ""}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-5 bg-white dark:bg-gray-850 transition-all duration-300 dark:bg-gray-800">
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
                        totalPend = 0,
                        totalChargesSum = 0,
                        totalCredit = 0,
                        totalRecords = 0,
                        totalPaidRecords = 0;

                      const rows = monthKeys.map((m) => {
                        const recs = records.filter((r) => r.month === m);
                        const monthPaid = recs.reduce(
                          (sum, r) => sum + r.amountPaid,
                          0
                        );
                        const monthCreditUsed = recs.reduce(
                          (sum, r) => sum + (r.creditUsed || 0),
                          0
                        );
                        const monthCreditBalance = recs.reduce(
                          (sum, r) => sum + r.creditBalance,
                          0
                        );

                        const monthCharges = recs.reduce(
                          (sum, r) => sum + r.referenceAmount,
                          0
                        );

                        // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
                        const paid =
                          monthPaid +
                          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                          monthCreditUsed;
                        const pending = recs.reduce(
                          (sum, r) => sum + r.amountPending,
                          0
                        );
                        // Saldo es la diferencia entre cargos y monto abonado
                        const balance = monthCharges - paid;

                        totalPaid += paid;
                        totalPend += pending;
                        totalChargesSum += monthCharges;
                        totalCredit += balance;
                        totalRecords += recs.length;
                        totalPaidRecords += recs.filter((r) => r.paid).length;

                        const compliance =
                          recs.length > 0
                            ? (recs.filter((r) => r.paid).length /
                                recs.length) *
                              100
                            : 0;
                        const delinquency = 100 - compliance;

                        return (
                          <tr
                            key={m}
                            className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">
                                {monthNames[m] || m}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 data-value">
                              <div className="flex items-center">
                                <span className="text-gray-400 text-xs mr-1">
                                  $
                                </span>
                                {paid.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 data-value">
                              <div className="flex items-center">
                                <span className="text-gray-400 text-xs mr-1">
                                  $
                                </span>
                                {monthCharges.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm data-value">
                              <div
                                className={`
                            flex items-center gap-1 px-2 py-1 rounded-full 
                            ${
                              balance < 0
                                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            }
                          `}
                              >
                                <span className="text-xs">
                                  {balance < 0 ? "↓" : "↑"}
                                </span>
                                <span>
                                  $
                                  {Math.abs(balance).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                    style={{ width: `${compliance}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm data-value">
                                  {compliance.toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                                    style={{ width: `${delinquency}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm data-value">
                                  {delinquency.toFixed(2)}%
                                </span>
                              </div>
                            </td>
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
                          <div className="overflow-x-auto scrollbar-thin rounded-lg mb-5">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    Mes
                                  </th>
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    Monto Abonado
                                  </th>
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    Cargos
                                  </th>
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    Saldo
                                  </th>
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    % Cumplimiento
                                  </th>
                                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                                    % Morosidad
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, index) => {
                                  // Use existing row markup but with enhanced styling
                                  return React.cloneElement(row, {
                                    className: `border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors duration-150 table-row ${
                                      index % 2 === 0
                                        ? "bg-white dark:bg-gray-850"
                                        : "bg-gray-50 dark:bg-gray-800"
                                    }`,
                                  });
                                })}
                                <tr className="bg-gray-100 dark:bg-indigo-900/30 font-medium text-gray-800 dark:text-white">
                                  <td className="py-3 px-4 text-sm font-bold">
                                    Total
                                  </td>
                                  <td className="py-3 px-4 text-sm data-value font-bold">
                                    <div className="flex items-center">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">
                                        $
                                      </span>
                                      {totalPaid.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm data-value font-bold">
                                    <div className="flex items-center">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs mr-1">
                                        $
                                      </span>
                                      {totalChargesSum.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm data-value font-bold">
                                    <div
                                      className={`
                                  flex items-center gap-1 px-2 py-1 rounded-full 
                                  ${
                                    totalChargesSum - totalPaid < 0
                                      ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                  }
                                `}
                                    >
                                      <span className="text-xs">
                                        {totalChargesSum - totalPaid < 0
                                          ? "↓"
                                          : "↑"}
                                      </span>
                                      <span>
                                        $
                                        {Math.abs(
                                          totalChargesSum - totalPaid
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm font-bold">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                          style={{
                                            width: `${totalCompliance}%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-sm data-value">
                                        {totalCompliance.toFixed(2)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm font-bold">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                                          style={{
                                            width: `${totalDelinquency}%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-sm data-value">
                                        {totalDelinquency.toFixed(2)}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 flex justify-start">
                            <div className="relative group">
                              <PDFReportGenerator
                                year={year}
                                totalIncome={totalIncome}
                                totalPending={totalPending}
                                maxMonth={maxMonth}
                                minMonth={minMonth}
                                monthlyStats={sortedMonthlyStats}
                                detailed={
                                  detailed as unknown as Record<
                                    string,
                                    PaymentRecord[]
                                  >
                                }
                                allCondominiums={condominiumsUsers.map(
                                  (user) => ({
                                    number: String(user.number),
                                    name: user.name,
                                  })
                                )}
                                logoBase64={logoBase64}
                                signatureBase64={signatureBase64}
                                adminCompany={adminCompany}
                                adminPhone={adminPhone}
                                adminEmail={adminEmail}
                                concept={concept}
                                conceptData={records}
                                buttonClassName="flex items-center gap-2 px-5 py-2.5 rounded-lg 
                                          bg-gradient-to-br from-indigo-600 to-indigo-700 
                                          hover:from-indigo-500 hover:to-indigo-700
                                          text-white shadow-lg shadow-indigo-500/30
                                          dark:shadow-indigo-800/30 pulse-animation
                                          transition-all duration-300 focus:outline-none
                                          focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                          dark:focus:ring-offset-gray-900"
                              />

                              {/* Tooltip */}
                              <div
                                className="absolute ml-14 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 
                                        px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 
                                        group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                                        whitespace-nowrap mb-1 z-10"
                              >
                                Generar reporte detallado en PDF
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón para mostrar más/menos conceptos */}
          {filteredConceptEntries.length > 3 && (
            <div className="mt-6 flex justify-center">
              <button
                aria-label={
                  showAll ? "Mostrar menos conceptos" : "Mostrar más conceptos"
                }
                aria-expanded={showAll}
                className="group flex items-center gap-2 px-6 py-2.5 rounded-full 
                          text-sm font-medium text-indigo-600 dark:text-indigo-400 
                          border border-indigo-200 dark:border-indigo-800 
                          hover:bg-indigo-50 dark:hover:bg-indigo-900/30 
                          transition-all duration-300 focus:outline-none focus:ring-2 
                          focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={() => setShowAll(!showAll)}
              >
                <span>
                  {showAll ? "Mostrar menos" : "Mostrar más conceptos"}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${
                    showAll ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default React.memo(DetailedConceptsTable);
