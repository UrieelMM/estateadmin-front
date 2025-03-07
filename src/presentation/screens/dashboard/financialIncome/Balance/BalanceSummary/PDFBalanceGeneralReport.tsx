// src/components/BalanceGeneral/PDFBalanceGeneralReport.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import { usePaymentSummaryStore } from "../../../../../../store/paymentSummaryStore";

interface PDFBalanceGeneralReportProps {
  year: string;
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

const PDFBalanceGeneralReport: React.FC<PDFBalanceGeneralReportProps> = ({ year }) => {
  // Datos de ingresos
  const {
    totalIncome,
    monthlyStats: incomesMonthlyStats,
    logoBase64: logoIncome,
    signatureBase64: signatureIncome,
    adminCompany,
    adminPhone,
    adminEmail,
  } = usePaymentSummaryStore((state) => ({
    totalIncome: state.totalIncome,
    monthlyStats: state.monthlyStats,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
    adminCompany: state.adminCompany,
    adminPhone: state.adminPhone,
    adminEmail: state.adminEmail,
  }));

  // Datos de egresos
  const {
    totalSpent,
    monthlyStats: expensesMonthlyStats,
    logoBase64: logoExpense,
    signatureBase64: signatureExpense,
  } = useExpenseSummaryStore((state) => ({
    totalSpent: state.totalSpent,
    monthlyStats: state.monthlyStats,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
  }));

  // Utilizar uno de los logos (se prioriza el de ingresos)
  const logoBase64 = logoIncome || logoExpense;
  const signatureBase64 = signatureIncome || signatureExpense;
  const netBalance = totalIncome - totalSpent;

  const generatePDF = () => {
    const doc = new jsPDF();

    // Helper para formatear números como moneda
    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);

    // --- Encabezado ---
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    }
    doc.setFontSize(16);
    doc.text("Reporte Balance General", 14, 20);
    doc.setFontSize(12);
    const reportDate = new Date().toLocaleDateString();
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Año:", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.text(year, 14 + doc.getTextWidth("Año:") + 2, 40);

    // --- Indicadores Clave ---
    doc.setFont("helvetica", "bold");
    doc.text("Total Ingresos:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(totalIncome), 14 + doc.getTextWidth("Total Ingresos:") + 5, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Total Egresos:", 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(totalSpent), 14 + doc.getTextWidth("Total Egresos:") + 5, 60);
    doc.setFont("helvetica", "bold");
    doc.text("Balance Neto:", 14, 70);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(netBalance), 14 + doc.getTextWidth("Balance Neto:") + 5, 70);

    // --- Detalle Mensual ---
    doc.setFontSize(14);
    doc.text("Detalle Mensual", 14, 80);

    const tableData = [];
    for (let i = 1; i <= 12; i++) {
      const m = i.toString().padStart(2, "0");
      const monthLabel = monthNames[m] || m;
      const incomeStat = incomesMonthlyStats.find((stat) => stat.month === m);
      const expenseStat = expensesMonthlyStats.find((stat) => stat.month === m);
      const ingresos = incomeStat ? incomeStat.paid : 0;
      const egresos = expenseStat ? expenseStat.spent : 0;
      const balance = ingresos - egresos;
      tableData.push([
        monthLabel,
        formatCurrency(ingresos),
        formatCurrency(egresos),
        formatCurrency(balance),
      ]);
    }

    autoTable(doc, {
      startY: 85,
      head: [["Mes", "Ingresos", "Egresos", "Balance"]],
      body: tableData,
      headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

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
    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", margin, adminSectionY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(adminCompany, margin + 40, adminSectionY + 10);
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", margin, adminSectionY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(adminPhone, margin + 40, adminSectionY + 20);
    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", margin, adminSectionY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(adminEmail, margin + 40, adminSectionY + 30);

    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", margin, footerY - 10);
    doc.text("Correo: administracion@estate-admin.com", margin, footerY - 5);

    doc.save(`reporte_balance_general_${year}.pdf`);
  };

  return (
    <div className="w-full flex justify-end mb-4">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white py-2 px-4 rounded w-full lg:w-[300px] font-bold hover:bg-indigo-500"
      >
        Generar Reporte Balance General
      </button>
    </div>
  );
};

export default PDFBalanceGeneralReport;
