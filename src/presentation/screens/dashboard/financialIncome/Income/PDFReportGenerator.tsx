// src/components/PDFReportGenerator.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentRecord, MonthlyStat, usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
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

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ year, concept }) => {
  // Obtener datos del store
  const {
    totalIncome,
    totalPending,
    monthlyStats,
    detailed,
    logoBase64,
    signatureBase64,
    adminCompany,
    adminPhone,
    adminEmail,
    conceptRecords,
  } = usePaymentSummaryStore((state) => ({
    totalIncome: state.totalIncome,
    totalPending: state.totalPending,
    monthlyStats: state.monthlyStats,
    detailed: state.detailed,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
    adminCompany: state.adminCompany,
    adminPhone: state.adminPhone,
    adminEmail: state.adminEmail,
    conceptRecords: state.conceptRecords,
  }));

  // Obtener los condominios desde el store de usuarios
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const allCondominiums: Condominium[] = condominiumsUsers.map((user) => ({
    number: String(user.number),
    name: user.name,
  }));

  // Si se pasa un concepto, obtener la data correspondiente del store
  const computedConceptData: PaymentRecord[] | undefined = concept ? conceptRecords[concept] : undefined;

  const generatePDF = () => {
    const doc = new jsPDF();

    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    // --- Cálculo de mes con mayor y menor ingresos ---
    const sortedMonthlyStats = [...monthlyStats].sort((a, b) => parseInt(a.month) - parseInt(b.month));
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonthNumber = now.getMonth() + 1;
    const currentStats: MonthlyStat[] =
      year === currentYear
        ? sortedMonthlyStats.filter((stat) => parseInt(stat.month) <= currentMonthNumber)
        : sortedMonthlyStats;
    const nonZeroStats = currentStats.filter((stat) => stat.paid > 0);
    let computedMinMonth = "";
    let computedMaxMonth = "";
    if (currentStats.length > 0) {
      if (nonZeroStats.length > 0) {
        const sortedByPaidAsc = [...nonZeroStats].sort((a, b) => a.paid - b.paid);
        computedMinMonth = monthNames[sortedByPaidAsc[0].month] || sortedByPaidAsc[0].month;
        const sortedByPaidDesc = [...nonZeroStats].sort((a, b) => b.paid - a.paid);
        computedMaxMonth = monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
      } else {
        const sortedByPaidAsc = [...currentStats].sort((a, b) => a.paid - b.paid);
        computedMinMonth = monthNames[sortedByPaidAsc[0].month] || sortedByPaidAsc[0].month;
        const sortedByPaidDesc = [...currentStats].sort((a, b) => b.paid - a.paid);
        computedMaxMonth = monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
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
      doc.text(computedMaxMonth, 14 + doc.getTextWidth("Mes con mayor ingresos:") + 5, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Mes con menor ingresos:", 14, 80);
      doc.setFont("helvetica", "normal");
      doc.text(computedMinMonth, 14 + doc.getTextWidth("Mes con menor ingresos:") + 5, 80);
    }

    // --- Reporte Individual por Concepto ---
    if (concept && computedConceptData) {
      const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
      let totalPaid = 0,
        totalPendingConcept = 0,
        totalCredit = 0;
      let globalTotalRecords = 0,
        globalPaidRecords = 0;
      const rows = monthKeys.map((m) => {
        let paid = 0,
          pending = 0,
          credit = 0;
        const recsForMonth = computedConceptData.filter((rec) => {
          let recMonth = rec.month;
          if (recMonth.includes("-")) {
            recMonth = recMonth.split("-")[1];
          }
          return recMonth === m;
        });
        recsForMonth.forEach((rec) => {
          paid += rec.amountPaid;
          pending += rec.amountPending;
          credit += rec.creditBalance;
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
      const totalCompliance = globalTotalRecords > 0 ? (globalPaidRecords / globalTotalRecords) * 100 : 0;
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

      // Detalle por condomino filtrado por concepto
      const sortedCondominiums = [...allCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );
      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : 95;
      sortedCondominiums.forEach((cond) => {
        const condDataFull = detailed[cond.number] || [];
        const condData = condDataFull.filter((item) => item.concept === concept);
        const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
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
          const creditBalance = recordsForMonth.reduce((sum: number, r) => sum + r.creditBalance, 0);
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
      const avgCompliance =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.complianceRate, 0) / monthlyStats.length
          : 0;
      const avgDelinquency =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.delinquencyRate, 0) / monthlyStats.length
          : 0;
      compRows.push([
        "Total",
        formatCurrency(totalPaidGlobal),
        formatCurrency(totalPendingGlobal),
        formatCurrency(totalSaldoGlobal),
        avgCompliance.toFixed(2) + "%",
        avgDelinquency.toFixed(2) + "%",
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
        (Object.entries(conceptRecords) as [string, PaymentRecord[]][]).forEach(([conceptKey, recs]) => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Ingresos - Concepto: ${conceptKey}`, 14, currentY);
          currentY += 6;
          const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
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
              ["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a favor", "% Cumplimiento", "% Morosidad"],
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
        const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
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
          return [monthNames[m], formatCurrency(amountPaid), formatCurrency(amountPending), formatCurrency(creditBalance)];
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

    // --- Nueva página para firma y datos de la administradora ---
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
    <div className="w-full flex justify-end">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white py-2 px-4 rounded w-full lg:w-[300px] font-bold hover:bg-indigo-500"
      >
        {concept ? `Generar reporte para ${concept}` : "Generar reporte General"}
      </button>
    </div>
  );
};

export default PDFReportGenerator;
