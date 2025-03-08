// src/components/Summary/DetailedConceptsTable.tsx
import React, { useMemo } from "react";
import { usePaymentSummaryStore, PaymentRecord, MonthlyStat } from "../../../../../store/paymentSummaryStore";
import PDFReportGenerator from "../Income/PDFReportGenerator";
import useUserStore from "../../../../../store/UserDataStore";

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
    // Suscribirse directamente al store para obtener todos los datos necesarios
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

    // Suscribirse al store de usuarios para obtener condominiumsUsers
    const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

    if (!conceptRecords || Object.keys(conceptRecords).length === 0) return null;

    // Calcular sortedMonthlyStats a partir de monthlyStats
    const sortedMonthlyStats: MonthlyStat[] = useMemo(() => {
      return [...monthlyStats].sort((a, b) => parseInt(a.month, 10) - parseInt(b.month, 10));
    }, [monthlyStats]);

    return (
      <div className="mb-8 flex flex-col lg:flex-row gap-4">
        <div className="mb-8 w-full">
          <h3 className="text-xl font-bold mb-2">Ingresos por concepto</h3>
          {Object.entries(conceptRecords).map(([concept, records]) => (
            <details key={concept} className="mb-6 border rounded">
              <summary className="cursor-pointer bg-gray-100 px-4 py-2 text-black font-bold dark:bg-gray-800 dark:border-gray-200 dark:text-gray-100 dark:ring-0">
                {concept}
              </summary>
              <div className="p-4">
                {(() => {
                  const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                  let totalPaid = 0,
                    totalPend = 0,
                    totalCredit = 0,
                    totalRecords = 0,
                    totalPaidRecords = 0;

                  const rows = monthKeys.map((m) => {
                    const recs = records.filter((r) => r.month === m);
                    const paid = recs.reduce((sum, r) => sum + r.amountPaid + r.creditBalance, 0);
                    const pending = recs.reduce((sum, r) => sum + r.amountPending, 0);
                    // Nuevo: calcular saldo a favor como creditBalance - creditUsed
                    const credit = recs.reduce((sum, r) => sum + (r.creditBalance - (r.creditUsed || 0)), 0);

                    totalPaid += paid;
                    totalPend += pending;
                    totalCredit += credit;
                    totalRecords += recs.length;
                    totalPaidRecords += recs.filter((r) => r.paid).length;

                    const compliance = recs.length > 0 ? (recs.filter((r) => r.paid).length / recs.length) * 100 : 0;
                    const delinquency = 100 - compliance;

                    return (
                      <tr key={m} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer">
                        <td className="border p-2">{monthNames[m] || m}</td>
                        <td className="border p-2">
                          {"$" +
                            paid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border p-2">
                          {"$" +
                            pending.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border p-2">
                          {"$" +
                            credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border p-2">{compliance.toFixed(2)}%</td>
                        <td className="border p-2">{delinquency.toFixed(2)}%</td>
                      </tr>
                    );
                  });

                  const totalCompliance = totalRecords > 0 ? (totalPaidRecords / totalRecords) * 100 : 0;
                  const totalDelinquency = 100 - totalCompliance;

                  return (
                    <>
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 mb-4 custom-scrollbar">
                        <table className="min-w-full border-collapse border border-indigo-200">
                          <thead>
                            <tr>
                              <th className="border p-2">Mes</th>
                              <th className="border p-2">Monto abonado</th>
                              <th className="border p-2">Monto pendiente</th>
                              <th className="border p-2">Saldo a favor</th>
                              <th className="border p-2">% Cumplimiento</th>
                              <th className="border p-2">% Morosidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows}
                            <tr>
                              <td className="border p-2 font-bold">Total</td>
                              <td className="border p-2 font-bold">
                                {"$" +
                                  totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="border p-2 font-bold">
                                {"$" +
                                  totalPend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="border p-2 font-bold">
                                {"$" +
                                  totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
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
                        maxMonth={maxMonth}
                        minMonth={minMonth}
                        monthlyStats={sortedMonthlyStats}
                        detailed={detailed as unknown as Record<string, PaymentRecord[]>}
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
      </div>
    );
  }
);

export default React.memo(DetailedConceptsTable);
