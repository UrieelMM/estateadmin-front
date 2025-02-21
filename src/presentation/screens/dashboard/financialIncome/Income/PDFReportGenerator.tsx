// src/components/PDFReportGenerator.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentRecord } from "../../../../../store/paymentSummaryStore";

interface Condominium {
  number: string;
  name?: string;
}

export interface PDFReportGeneratorProps {
  year: string;
  totalIncome: number;
  totalPending: number;
  maxMonth: string;
  minMonth: string;
  monthlyStats: Array<{
    month: string; // en formato "01", "02", etc.
    paid: number;
    pending: number;
    saldo: number; // Saldo a favor (suma de creditBalance)
    complianceRate: number;
    delinquencyRate: number;
  }>;
  detailed: Record<
    string,
    Array<{
      month: string; // se espera "YYYY-MM" o "MM"
      amountPaid: number;
      amountPending: number;
      creditBalance?: number;
      concept?: string;
    }>
  >;
  allCondominiums: Condominium[];
  logoBase64: string;
  signatureBase64: string;
  adminCompany: string; // Administradora: companyName
  adminPhone: string; // Teléfono: phoneNumber
  adminEmail: string; // Contacto: email

  // Propiedades opcionales para reporte individual por concepto
  concept?: string;
  conceptData?: PaymentRecord[];

  // Propiedad opcional para reporte general: ingresos por concepto
  conceptRecords?: Record<string, PaymentRecord[]>;
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
  totalIncome,
  totalPending,
  maxMonth,
  minMonth,
  monthlyStats,
  detailed,
  allCondominiums,
  logoBase64,
  signatureBase64,
  adminCompany,
  adminPhone,
  adminEmail,
  concept,      // opcional
  conceptData,  // opcional
  conceptRecords, // opcional
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();

    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    // --- Encabezado (Logo y Datos Generales) ---
    doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    doc.setFontSize(14);

    if (concept) {
      // Reporte individual por concepto
      doc.text(`Reporte de ingresos - Concepto: ${concept}`, 14, 20);
    } else {
      // Reporte general
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
      // Datos generales solo para el reporte completo
      doc.setFont("helvetica", "bold");
      doc.text("Total Ingresos:", 14, 50);
      doc.setFont("helvetica", "normal");
      doc.text(formatCurrency(totalIncome), 14 + doc.getTextWidth("Total Ingresos:") + 4, 50);

      doc.setFont("helvetica", "bold");
      doc.text("Total Pendiente:", 14, 60);
      doc.setFont("helvetica", "normal");
      doc.text(formatCurrency(totalPending), 14 + doc.getTextWidth("Total Pendiente:") + 4, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Mes con mayor ingresos:", 14, 70);
      doc.setFont("helvetica", "normal");
      doc.text(maxMonth, 14 + doc.getTextWidth("Mes con mayor ingresos:") + 5, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Mes con menor ingresos:", 14, 80);
      doc.setFont("helvetica", "normal");
      doc.text(minMonth, 14 + doc.getTextWidth("Mes con menor ingresos:") + 5, 80);
    }

    if (concept && conceptData) {
      // --- Reporte individual por concepto ---
      const monthKeys = [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12",
      ];
      let totalPaid = 0,
        totalPendingConcept = 0,
        totalCredit = 0;
      let globalTotalRecords = 0,
        globalPaidRecords = 0;
      const rows = monthKeys.map((m) => {
        let paid = 0, pending = 0, credit = 0;
        const recsForMonth = conceptData.filter((rec) => {
          let recMonth = rec.month;
          if (recMonth.includes("-")) {
            recMonth = recMonth.split("-")[1];
          }
          return recMonth === m;
        });
        recsForMonth.forEach((rec) => {
          paid += rec.amountPaid;
          pending += rec.amountPending;
          credit += rec.creditBalance || 0;
        });
        totalPaid += paid;
        totalPendingConcept += pending;
        totalCredit += credit;
        const totalRecords = recsForMonth.length;
        const paidCount = recsForMonth.filter((r) => r.paid).length;
        globalTotalRecords += totalRecords;
        globalPaidRecords += paidCount;
        const compliance = totalRecords > 0 ? (paidCount / totalRecords) * 100 : 0;
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
        globalTotalRecords > 0 ? (globalPaidRecords / globalTotalRecords) * 100 : 0;
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
        headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Ordenar condóminos de forma natural
      const sortedCondominiums = [...allCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );
      // Detalle por condomino filtrado por concepto
      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : 95;
      sortedCondominiums.forEach((cond) => {
        const condDataFull = detailed[cond.number] || [];
        const condData = condDataFull.filter((item) => item.concept === concept);
        const monthKeys = [
          "01", "02", "03", "04", "05", "06",
          "07", "08", "09", "10", "11", "12",
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
          const amountPaid = recordsForMonth.reduce((sum: number, r) => sum + r.amountPaid, 0);
          const amountPending = recordsForMonth.reduce((sum: number, r) => sum + r.amountPending, 0);
          const creditBalance = recordsForMonth.reduce((sum: number, r) => sum + (r.creditBalance || 0), 0);
          totalPaidCond += amountPaid;
          totalPendingCond += amountPending;
          totalCreditCond += creditBalance;
          return [
            monthNames[m],
            formatCurrency(amountPaid),
            formatCurrency(amountPending),
            formatCurrency(creditBalance),
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
          `Detalle del Condomino: ${cond.number}${cond.name ? " - " + cond.name : ""}`,
          14,
          currentY
        );
        currentY += 6;
        autoTable(doc, {
          startY: currentY,
          head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a favor"]],
          body: condRows,
          headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
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
      // 1. Tabla comparativa global mes a mes (se modifica para incluir los % totales)
      const compRows = monthlyStats.map((stat) => [
        monthNames[stat.month] || stat.month,
        formatCurrency(stat.paid),
        formatCurrency(stat.pending),
        formatCurrency(stat.saldo),
        stat.complianceRate.toFixed(2) + "%",
        stat.delinquencyRate.toFixed(2) + "%",
      ]);
      let totalPaidGlobal = 0,
        totalPendingGlobal = 0,
        totalSaldoGlobal = 0;
      monthlyStats.forEach((stat) => {
        totalPaidGlobal += stat.paid;
        totalPendingGlobal += stat.pending;
        totalSaldoGlobal += stat.saldo;
      });
      // Calcular promedios de porcentajes (simple promedio de los 12 meses)
      const avgCompliance =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.complianceRate, 0) /
            monthlyStats.length
          : 0;
      const avgDelinquency =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.delinquencyRate, 0) /
            monthlyStats.length
          : 0;
      compRows.push([
        "Total",
        formatCurrency(totalPaidGlobal),
        formatCurrency(totalPendingGlobal),
        formatCurrency(totalSaldoGlobal),
        avgCompliance.toFixed(2) + "%",
        avgDelinquency.toFixed(2) + "%",
      ]);

      // ----- NUEVO: Texto "Ingresos totales" antes de la primera tabla -----
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Ingresos totales", 14, 90);

      autoTable(doc, {
        startY: 95,
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
        body: compRows,
        headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.row.index === compRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // ----- NUEVO: Texto explicativo justo abajo de la primera tabla -----
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

      // 2. Ingresos por concepto: se generan tablas por cada concepto
      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 15
        : 95;
      if (conceptRecords && Object.keys(conceptRecords).length > 0) {
        (Object.entries(conceptRecords) as [string, PaymentRecord[]][]).forEach(([conceptKey, recs]) => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Ingresos - Concepto: ${conceptKey}`, 14, currentY);
          currentY += 6;
          const monthKeys = [
            "01", "02", "03", "04", "05", "06",
            "07", "08", "09", "10", "11", "12",
          ];
          let totalPaidConcept = 0,
            totalPendingConcept = 0,
            totalCreditConcept = 0;
          let globalTotalRecords = 0,
            globalPaidRecords = 0;
          const rows = monthKeys.map((m) => {
            const recordsForMonth = recs.filter((r) =>
              r.month.includes("-") ? r.month.split("-")[1] === m : r.month === m
            );
            const paid = recordsForMonth.reduce((sum: number, r: PaymentRecord) => sum + r.amountPaid, 0);
            const pending = recordsForMonth.reduce((sum: number, r: PaymentRecord) => sum + r.amountPending, 0);
            const credit = recordsForMonth.reduce((sum: number, r: PaymentRecord) => sum + (r.creditBalance || 0), 0);
            totalPaidConcept += paid;
            totalPendingConcept += pending;
            totalCreditConcept += credit;
            const totalRecords = recordsForMonth.length;
            const paidCount = recordsForMonth.filter((r) => r.paid).length;
            globalTotalRecords += totalRecords;
            globalPaidRecords += paidCount;
            const compliance = totalRecords > 0 ? (paidCount / totalRecords) * 100 : 0;
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
            globalTotalRecords > 0 ? (globalPaidRecords / globalTotalRecords) * 100 : 0;
          const totalDelinquency = 100 - totalCompliance;
          rows.push([
            "Total",
            formatCurrency(totalPaidConcept),
            formatCurrency(totalPendingConcept),
            formatCurrency(totalCreditConcept),
            globalTotalRecords > 0 ? totalCompliance.toFixed(2) + "%" : "0.00%",
            globalTotalRecords > 0 ? totalDelinquency.toFixed(2) + "%" : "0.00%",
          ]);
          autoTable(doc, {
            startY: currentY,
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
            headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
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
        });
      }

      // 3. Detalle por condomino para el reporte general...
      // Ordenar los condominios de forma natural
      const sortedCondominiums = [...allCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );
      sortedCondominiums.forEach((cond) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Detalle del Condomino: ${cond.number}${cond.name ? " - " + cond.name : ""}`,
          14,
          currentY
        );
        currentY += 6;

        const condData = detailed[cond.number] || [];
        const monthKeys = [
          "01", "02", "03", "04", "05", "06",
          "07", "08", "09", "10", "11", "12",
        ];
        let totalPaidCond = 0,
          totalPendingCond = 0,
          totalCreditCond = 0;
        const rows = monthKeys.map((m) => {
          const recordsForMonth = condData.filter((item) => {
            let recMonth = item.month;
            if (recMonth.includes("-")) {
              recMonth = recMonth.split("-")[1];
            }
            return recMonth === m;
          });
          const amountPaid = recordsForMonth.reduce((sum: number, r) => sum + r.amountPaid, 0);
          const amountPending = recordsForMonth.reduce((sum: number, r) => sum + r.amountPending, 0);
          const creditBalance = recordsForMonth.reduce((sum: number, r) => sum + (r.creditBalance || 0), 0);
          totalPaidCond += amountPaid;
          totalPendingCond += amountPending;
          totalCreditCond += creditBalance;
          return [
            monthNames[m],
            formatCurrency(amountPaid),
            formatCurrency(amountPending),
            formatCurrency(creditBalance),
          ];
        });
        rows.push([
          "Total",
          formatCurrency(totalPaidCond),
          formatCurrency(totalPendingCond),
          formatCurrency(totalCreditCond),
        ]);
        autoTable(doc, {
          startY: currentY,
          head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a favor"]],
          body: rows,
          headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
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
      });
    }

    // --- Nueva página para la firma y datos de la administradora ---
    doc.addPage();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const adminSectionY = pageHeight - 80;

    if (signatureBase64) {
      doc.addImage(signatureBase64, "PNG", margin, adminSectionY - 20, 50, 20);
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

  return (
    <button
      onClick={generatePDF}
      className="bg-indigo-600 text-white py-2 px-4 rounded w-full font-bold"
    >
      {concept ? `Generar reporte para ${concept}` : "Generar reporte General"}
    </button>
  );
};

export default PDFReportGenerator;
