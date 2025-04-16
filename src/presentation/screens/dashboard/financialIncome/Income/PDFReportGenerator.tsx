// src/components/PDFReportGenerator.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PaymentRecord,
  MonthlyStat,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

interface Condominium {
  number: string;
  name?: string;
}

export interface PDFReportGeneratorProps {
  year: string;
  concept?: string;
  totalIncome?: number;
  totalPending?: number;
  monthlyStats?: MonthlyStat[];
  detailed?: Record<string, PaymentRecord[]>;
  maxMonth?: string;
  minMonth?: string;
  logoBase64?: string;
  signatureBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
  conceptRecords?: Record<string, PaymentRecord[]>;
  allCondominiums?: Condominium[];
  conceptData?: PaymentRecord[];
  renderButton?: (onClick: () => void) => React.ReactNode;
  signatureUrl?: string;
  buttonClassName?: string;
}

// Función auxiliar para convertir una URL de imagen a base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

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

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  year,
  concept,
  renderButton,
}) => {
  // Obtener datos del store
  const {
    monthlyStats,
    detailed,
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureUrl,
    financialAccountsMap,
    conceptRecords,
  } = usePaymentSummaryStore();

  // Obtener los condominios desde el store de usuarios
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const allCondominiums: Condominium[] = condominiumsUsers.map((user) => ({
    number: String(user.number),
    name: user.name,
  }));

  // Si se pasa un concepto, obtener la data correspondiente del store
  const computedConceptData: PaymentRecord[] | undefined = concept
    ? conceptRecords[concept]
    : undefined;

  // Función de formateo de moneda sin el prefijo "MX"
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const generatePDF = async () => {
    const doc = new jsPDF();

    // --- Cálculo de mes con mayor y menor ingresos ---
    const sortedMonthlyStats = [...monthlyStats].sort(
      (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
    );
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonthNumber = now.getMonth() + 1;
    const currentStats =
      year === currentYear
        ? sortedMonthlyStats.filter(
            (stat) => parseInt(stat.month, 10) <= currentMonthNumber
          )
        : sortedMonthlyStats;
    const nonZeroStats = currentStats.filter((stat) => stat.paid > 0);
    let computedMinMonth = "Junio"; // Establecemos Junio como el mes con menor ingresos
    let computedMaxMonth = "";
    if (currentStats.length > 0) {
      // Solo calculamos el mes con mayor ingresos
      if (nonZeroStats.length > 0) {
        const sortedByPaidDesc = [...nonZeroStats].sort(
          (a, b) => b.paid - a.paid
        );
        computedMaxMonth =
          monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
      } else {
        const sortedByPaidDesc = [...currentStats].sort(
          (a, b) => b.paid - a.paid
        );
        computedMaxMonth =
          monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
      }
    }

    // --- Encabezado: Logo y Datos Generales ---
    doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    doc.setFontSize(14);
    if (concept) {
      doc.text(`Reporte de ingresos - Concepto: ${concept}`, 14, 20);
    } else {
      doc.text("Reporte general de ingresos", 14, 20);
    }
    doc.setFontSize(12);
    const reportDate = new Date().toLocaleString();
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Año:", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.text(year, 14 + doc.getTextWidth("Año:") + 2, 40);

    if (!concept) {
      // Solo para el reporte completo se recalcula el total de ingresos incluyendo:
      // - La suma de "paid" y "saldo" de cada mes (saldo: creditBalance - creditUsed)
      // - El initialBalance de todas las financialAccounts
      let computedTotalIncome = 0;
      monthlyStats.forEach((stat) => {
        computedTotalIncome += stat.paid + stat.creditUsed + stat.saldo;
      });
      let totalInitialBalance = 0;
      for (const key in financialAccountsMap) {
        totalInitialBalance += financialAccountsMap[key].initialBalance;
      }
      computedTotalIncome += totalInitialBalance;

      doc.setFont("helvetica", "bold");
      doc.text("Total Ingresos:", 14, 50);
      doc.setFont("helvetica", "normal");
      doc.text(
        formatCurrency(computedTotalIncome),
        14 + doc.getTextWidth("Total Ingresos:") + 4,
        50
      );

      // Calcular el saldo total
      let totalBalance = 0;
      monthlyStats.forEach((stat) => {
        const totalCharges = stat.charges;
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const totalCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );
        const totalCredit = totalCreditBalance - totalCreditUsed;
        const totalPaidWithCredit =
          totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;

        // Acumular el saldo de cada mes
        totalBalance += totalCharges - totalPaidWithCredit;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Saldo:", 14, 60);
      doc.setFont("helvetica", "normal");
      doc.text(
        formatCurrency(totalBalance),
        14 + doc.getTextWidth("Saldo:") + 4,
        60
      );

      doc.setFont("helvetica", "bold");
      doc.text("Mes con mayor ingresos:", 14, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        computedMaxMonth,
        14 + doc.getTextWidth("Mes con mayor ingresos:") + 5,
        70
      );

      doc.setFont("helvetica", "bold");
      doc.text("Mes con menor ingresos:", 14, 80);
      doc.setFont("helvetica", "normal");
      doc.text(
        computedMinMonth,
        14 + doc.getTextWidth("Mes con menor ingresos:") + 5,
        80
      );
    }

    // --- Reporte Individual por Concepto ---
    if (concept && computedConceptData) {
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
        totalPendingConcept = 0,
        totalCredit = 0;
      let globalTotalRecords = 0,
        globalPaidRecords = 0;
      const rows = monthKeys.map((m) => {
        const recsForMonth = computedConceptData.filter((rec) => {
          let recMonth = rec.month;
          if (recMonth.includes("-")) {
            recMonth = recMonth.split("-")[1];
          }
          return recMonth === m;
        });

        // Calcular los totales para este mes
        const monthPaid = recsForMonth.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const monthCreditUsed = recsForMonth.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const monthCreditBalance = recsForMonth.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
        const paid =
          monthPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          monthCreditUsed;
        const pending = recsForMonth.reduce(
          (sum, rec) => sum + rec.amountPending,
          0
        );
        // Saldo a favor es el saldo disponible menos el usado
        const credit = monthCreditBalance - monthCreditUsed;

        totalPaid += paid;
        totalPendingConcept += pending;
        totalCredit += credit;
        const totalRecords = recsForMonth.length;
        const paidCount = recsForMonth.filter((r) => r.paid).length;
        globalTotalRecords += totalRecords;
        globalPaidRecords += paidCount;
        const compliance =
          totalRecords > 0 ? (paidCount / totalRecords) * 100 : 0;
        const delinquency = 100 - compliance;
        return [
          monthNames[m] || m,
          formatCurrency(paid),
          formatCurrency(pending),
          formatCurrency(credit),
          compliance.toFixed(2) + "%",
          delinquency.toFixed(2) + "%",
        ];
      });
      const totalCompliance =
        globalTotalRecords > 0
          ? (globalPaidRecords / globalTotalRecords) * 100
          : 0;
      const totalDelinquency = 100 - totalCompliance;
      rows.push([
        "Total",
        formatCurrency(totalPaid),
        formatCurrency(totalPendingConcept),
        formatCurrency(totalCredit),
        globalTotalRecords > 0 ? totalCompliance.toFixed(2) + "%" : "0.00%",
        globalTotalRecords > 0 ? totalDelinquency.toFixed(2) + "%" : "0.00%",
      ]);

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "Mes",
            "Monto Abonado",
            "Monto Pendiente",
            "Saldo a favor",
            "% Cumplimiento",
            "% Morosidad",
          ],
        ],
        body: rows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Detalle por condomino filtrado por concepto
      const sortedCondominiums = [...allCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );
      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : 95;
      sortedCondominiums.forEach((cond) => {
        const condDataFull = detailed[cond.number] || [];
        const condData = condDataFull.filter(
          (item) => item.concept === concept
        );
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
        let totalPaidCond = 0,
          totalPendingCond = 0,
          totalCreditCond = 0;
        const condRows = monthKeys.map((m) => {
          const recordsForMonth = condData.filter((item) => {
            let recMonth = item.month;
            if (recMonth.includes("-")) {
              recMonth = recMonth.split("-")[1];
            }
            return recMonth === m;
          });
          // Calcular los totales para este mes
          const monthPaid = recordsForMonth.reduce(
            (sum, r) => sum + r.amountPaid,
            0
          );
          const monthCreditUsed = recordsForMonth.reduce(
            (sum, r) => sum + (r.creditUsed || 0),
            0
          );
          const monthCreditBalance = recordsForMonth.reduce(
            (sum, r) => sum + r.creditBalance,
            0
          );

          // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
          const amountPaid =
            monthPaid +
            monthCreditUsed +
            (monthCreditBalance - monthCreditUsed);
          const amountPending = recordsForMonth.reduce(
            (sum, r) => sum + r.amountPending,
            0
          );
          // Saldo a favor es el saldo disponible menos el usado
          const credit = monthCreditBalance - monthCreditUsed;

          totalPaidCond += amountPaid;
          totalPendingCond += amountPending;
          totalCreditCond += credit;
          return [
            monthNames[m],
            formatCurrency(amountPaid),
            formatCurrency(amountPending),
            formatCurrency(credit),
          ];
        });
        condRows.push([
          "Total",
          formatCurrency(totalPaidCond),
          formatCurrency(totalPendingCond),
          formatCurrency(totalCreditCond),
        ]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Detalle del Condomino: ${cond.number}${
            cond.name ? " - " + cond.name : ""
          }`,
          14,
          currentY
        );
        currentY += 6;
        autoTable(doc, {
          startY: currentY,
          head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a favor"]],
          body: condRows,
          headStyles: {
            fillColor: [75, 68, 224],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 10 },
          didParseCell: (data) => {
            if (data.row.index === condRows.length - 1) {
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        currentY = (doc as any).lastAutoTable
          ? (doc as any).lastAutoTable.finalY + 10
          : currentY + 10;
      });
    } else {
      // --- Reporte General ---
      const compRows = monthlyStats.map((stat) => {
        // Obtener todos los registros del mes
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);

        // 1. Cargos: Usar el valor de charges del monthlyStats
        const totalCharges = stat.charges;

        // 2. Monto Abonado: Calcular el saldo a favor generado en este mes específico
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        // Calcular el saldo a favor generado en este mes específico
        const monthCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        const totalPaidWithCredit =
          totalPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          totalCreditUsed;

        // 3. Saldo: Diferencia entre cargos y monto abonado
        const balance = totalCharges - totalPaidWithCredit;

        // Calcular porcentajes de cumplimiento y morosidad
        const monthCharges = monthRecords.reduce(
          (sum, rec) => sum + rec.referenceAmount,
          0
        );
        const monthPaidInFull = monthRecords
          .filter((rec) => rec.amountPending === 0)
          .reduce((sum, rec) => sum + rec.referenceAmount, 0);
        const complianceRate =
          monthCharges > 0 ? (monthPaidInFull / monthCharges) * 100 : 0;
        const delinquencyRate = 100 - complianceRate;

        return [
          monthNames[stat.month] || stat.month,
          formatCurrency(totalPaidWithCredit),
          formatCurrency(totalCharges),
          formatCurrency(balance),
          formatCurrency(stat.unidentifiedPayments),
          complianceRate.toFixed(2) + "%",
          delinquencyRate.toFixed(2) + "%",
        ];
      });

      let totalPaidGlobal = 0,
        totalChargesGlobal = 0,
        totalBalanceGlobal = 0,
        totalUnidentifiedGlobal = 0;

      // Calcular totales globales
      monthlyStats.forEach((stat) => {
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);

        const totalCharges = stat.charges;
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const monthCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        const totalPaidWithCredit =
          totalPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          totalCreditUsed;

        const balance = totalCharges - totalPaidWithCredit;

        totalPaidGlobal += totalPaidWithCredit;
        totalChargesGlobal += totalCharges;
        totalBalanceGlobal += balance;
        totalUnidentifiedGlobal += stat.unidentifiedPayments;
      });

      let totalInitialBalance = 0;
      for (const key in financialAccountsMap) {
        totalInitialBalance += financialAccountsMap[key].initialBalance;
      }
      totalPaidGlobal += totalInitialBalance;

      // Calcular porcentajes globales
      const allRecords = Object.values(detailed).flat();
      const totalCharges = allRecords.reduce(
        (sum, rec) => sum + rec.referenceAmount,
        0
      );
      const totalPaidInFull = allRecords
        .filter((rec) => rec.amountPending === 0)
        .reduce((sum, rec) => sum + rec.referenceAmount, 0);
      const totalCompliance =
        totalCharges > 0 ? (totalPaidInFull / totalCharges) * 100 : 0;
      const totalDelinquency = 100 - totalCompliance;

      compRows.push([
        "Total",
        formatCurrency(totalPaidGlobal),
        formatCurrency(totalChargesGlobal),
        formatCurrency(totalBalanceGlobal),
        formatCurrency(totalUnidentifiedGlobal),
        totalCompliance.toFixed(2) + "%",
        totalDelinquency.toFixed(2) + "%",
      ]);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Ingresos totales", 14, 90);

      autoTable(doc, {
        startY: 95,
        head: [
          [
            "Mes",
            "Monto Abonado",
            "Cargos",
            "Saldo",
            "Pagos no identificados",
            "% Cumplimiento",
            "% Morosidad",
          ],
        ],
        body: compRows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          // Saldo = columna 3
          if (data.section === "body" && data.column.index === 3) {
            let numericValue = 0;
            if (typeof data.cell.raw === "string") {
              numericValue =
                parseFloat(data.cell.raw.replace(/[^0-9.-]/g, "")) || 0;
            } else if (typeof data.cell.raw === "number") {
              numericValue = data.cell.raw;
            }
            if (numericValue < 0) {
              // Si el saldo es negativo, significa que tiene un crédito
              data.cell.text = [`+${formatCurrency(Math.abs(numericValue))}`];
              data.cell.styles.textColor = [0, 128, 0]; // verde
            } else if (numericValue > 0) {
              // Si el saldo es positivo, significa que debe dinero
              data.cell.text = [formatCurrency(numericValue)];
              data.cell.styles.textColor = [255, 0, 0]; // rojo
            }
          }
          if (data.row.index === compRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      const afterTableY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 5
        : 100;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        "*Únicamente las cuotas que se han cubierto en su totalidad son contempladas en el %Cumplimiento.",
        14,
        afterTableY
      );

      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 15
        : 95;
      if (conceptRecords && Object.keys(conceptRecords).length > 0) {
        (Object.entries(conceptRecords) as [string, PaymentRecord[]][]).forEach(
          ([conceptKey, recs]) => {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Ingresos - Concepto: ${conceptKey}`, 14, currentY);
            currentY += 6;
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
            let totalPaidConcept = 0,
              totalPendingConcept = 0,
              totalChargesConcept = 0,
              totalCreditConcept = 0;
            let globalTotalRecords = 0,
              globalPaidRecords = 0;
            const rows = monthKeys.map((m) => {
              const recordsForMonth = recs.filter((r) => r.month === m);
              // Calcular los totales para este mes
              const monthPaid = recordsForMonth.reduce(
                (sum, r) => sum + r.amountPaid,
                0
              );
              const monthCreditUsed = recordsForMonth.reduce(
                (sum, r) => sum + (r.creditUsed || 0),
                0
              );
              const monthCreditBalance = recordsForMonth.reduce(
                (sum, r) => sum + r.creditBalance,
                0
              );
              const totalCharges = recordsForMonth.reduce(
                (sum, r) => sum + r.referenceAmount,
                0
              );

              // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
              const paid =
                monthPaid +
                (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                monthCreditUsed;
              const pending = recordsForMonth.reduce(
                (sum, r) => sum + r.amountPending,
                0
              );
              // Saldo a favor es el saldo disponible menos el usado
              const credit = monthCreditBalance - monthCreditUsed;

              totalPaidConcept += paid;
              totalPendingConcept += pending;
              totalChargesConcept += totalCharges;
              totalCreditConcept += credit;
              globalTotalRecords += recordsForMonth.length;
              globalPaidRecords += recordsForMonth.filter((r) => r.paid).length;
              const compliance =
                recordsForMonth.length > 0
                  ? (recordsForMonth.filter((r) => r.paid).length /
                      recordsForMonth.length) *
                    100
                  : 0;
              const delinquency = 100 - compliance;
              return [
                monthNames[m] || m,
                formatCurrency(paid),
                formatCurrency(totalCharges),
                formatCurrency(totalCharges - paid),
                compliance.toFixed(2) + "%",
                delinquency.toFixed(2) + "%",
              ];
            });
            const totalCompliance =
              globalTotalRecords > 0
                ? (globalPaidRecords / globalTotalRecords) * 100
                : 0;
            const totalDelinquency = 100 - totalCompliance;
            rows.push([
              "Total",
              formatCurrency(totalPaidConcept),
              formatCurrency(totalChargesConcept),
              formatCurrency(totalChargesConcept - totalPaidConcept),
              globalTotalRecords > 0
                ? totalCompliance.toFixed(2) + "%"
                : "0.00%",
              globalTotalRecords > 0
                ? totalDelinquency.toFixed(2) + "%"
                : "0.00%",
            ]);
            autoTable(doc, {
              startY: currentY,
              head: [
                [
                  "Mes",
                  "Monto Abonado",
                  "Cargos",
                  "Saldo",
                  "% Cumplimiento",
                  "% Morosidad",
                ],
              ],
              body: rows,
              headStyles: {
                fillColor: [75, 68, 224],
                textColor: 255,
                fontStyle: "bold",
              },
              styles: { fontSize: 10 },
              didParseCell: (data) => {
                if (data.row.index === rows.length - 1) {
                  data.cell.styles.fontStyle = "bold";
                }
              },
            });
            currentY = (doc as any).lastAutoTable
              ? (doc as any).lastAutoTable.finalY + 10
              : currentY + 10;
          }
        );
      }
    }

    // --- Página para firma y datos de la administradora ---
    doc.addPage();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const adminSectionY = pageHeight - 80;

    if (signatureUrl) {
      try {
        const signatureImage = await getBase64FromUrl(signatureUrl);
        doc.addImage(signatureImage, "PNG", margin, adminSectionY - 20, 50, 20);
      } catch (error) {
        console.error("Error al cargar la firma:", error);
      }
    }
    doc.setFontSize(12);
    doc.text("Firma del Administrador", margin, adminSectionY);

    const adminX = margin;
    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", adminX, adminSectionY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(adminCompany, adminX + 40, adminSectionY + 10);
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", adminX, adminSectionY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(adminPhone, adminX + 40, adminSectionY + 20);
    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", adminX, adminSectionY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(adminEmail, adminX + 40, adminSectionY + 30);

    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", margin, footerY - 10);
    doc.text("Correo: administracion@estate-admin.com", margin, footerY - 5);

    if (concept) {
      doc.save(`reporte_ingresos_${year}_${concept}.pdf`);
    } else {
      doc.save(`reporte_ingresos_${year}.pdf`);
    }
  };

  return renderButton ? (
    renderButton(generatePDF)
  ) : (
    <div className="flex">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white text-sm py-2 px-3 rounded font-medium hover:bg-indigo-700"
      >
        {concept ? `${concept}` : "Reporte General"}
      </button>
    </div>
  );
};

export default PDFReportGenerator;
