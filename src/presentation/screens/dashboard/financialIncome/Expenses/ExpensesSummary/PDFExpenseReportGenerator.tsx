// src/components/PDFExpenseReportGenerator.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useExpenseSummaryStore, ExpenseRecord } from "../../../../../../store/expenseSummaryStore";
import { DocumentChartBarIcon } from '@heroicons/react/20/solid'
export interface PDFExpenseReportGeneratorProps {
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

const PDFExpenseReportGenerator: React.FC<PDFExpenseReportGeneratorProps> = ({
  year,
}) => {
  // Se obtienen los datos completos desde el store de egresos
  const {
    expenses,
    totalSpent,
    monthlyStats,
    logoBase64,
    signatureBase64,
    adminCompany,
    adminPhone,
    adminEmail,
  } = useExpenseSummaryStore((state) => ({
    expenses: state.expenses,
    totalSpent: state.totalSpent,
    monthlyStats: state.monthlyStats,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
    adminCompany: state.adminCompany || "Administradora S.A.",
    adminPhone: state.adminPhone || "Teléfono no disponible",
    adminEmail: state.adminEmail || "Email no disponible",
  }));

  const generatePDF = () => {
    const doc = new jsPDF();

    // Función para formatear números como moneda
    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    // --- Encabezado: Logo, Título, Fecha, Año y Total Egresos --- 
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    }
    doc.setFontSize(14);
    doc.text("Reporte General de Egresos", 14, 20);
    doc.setFontSize(12);
    // Se formatea la fecha para mostrar solo día, mes y año
    const reportDate = new Date().toLocaleDateString();
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Año:", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.text(year, 14 + doc.getTextWidth("Año:") + 2, 40);
    doc.setFont("helvetica", "bold");
    doc.text("Total Egresos:", 14, 50);
    // Se incrementa el margen para separar mejor el valor
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(totalSpent), 14 + doc.getTextWidth("Total Egresos:") + 5, 50);

    // --- Texto adicional antes de la primera tabla --- 
    doc.setFontSize(14);
    doc.text("Resumen anual", 14, 58);

    // --- Resumen mensual de egresos ---
    // Se ordenan los datos mensuales
    const sortedMonthlyStats = [...monthlyStats].sort(
      (a, b) => parseInt(a.month) - parseInt(b.month)
    );
    const summaryRows = sortedMonthlyStats.map((stat) => [
      monthNames[stat.month] || stat.month,
      formatCurrency(stat.spent),
    ]);
    // Se agrega la fila de totales
    const totalSummary = sortedMonthlyStats.reduce(
      (sum, stat) => sum + stat.spent,
      0
    );
    summaryRows.push(["Total", formatCurrency(totalSummary)]);

    autoTable(doc, {
      startY: 60,
      head: [["Mes", "Total Gastado"]],
      body: summaryRows,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      theme: "grid",
    });

    let currentY =
      (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : 80;

    // --- Nueva tabla de totales por concepto ---
    const expensesForYear = expenses.filter((exp: ExpenseRecord) =>
      exp.expenseDate.startsWith(year)
    );
    const conceptTotals: { [key: string]: number } = {};
    expensesForYear.forEach((exp: ExpenseRecord) => {
      if (conceptTotals[exp.concept]) {
        conceptTotals[exp.concept] += exp.amount;
      } else {
        conceptTotals[exp.concept] = exp.amount;
      }
    });
    const conceptRows = Object.entries(conceptTotals)
      .map(([concept, total]) => ({ concept, total }))
      .sort((a, b) => b.total - a.total);
    const conceptTableRows = conceptRows.map((item) => [
      item.concept,
      formatCurrency(item.total),
    ]);
    const totalAmount = expensesForYear.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    conceptTableRows.push(["Total", formatCurrency(totalAmount)]);

    autoTable(doc, {
      startY: currentY,
      head: [["Concepto", "Total"]],
      body: conceptTableRows,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      theme: "grid",
    });

    currentY = (doc as any).lastAutoTable
      ? (doc as any).lastAutoTable.finalY + 10
      : currentY + 20;

    // --- Detalle de egresos por mes ---
    const monthKeys = Object.keys(monthNames); // ["01", "02", ..., "12"]
    monthKeys.forEach((monthKey) => {
      // Se filtran los egresos del año y mes actual
      const monthExpenses = expenses.filter((exp: ExpenseRecord) => {
        return (
          exp.expenseDate.startsWith(year) &&
          exp.expenseDate.substring(5, 7) === monthKey
        );
      });
      if (monthExpenses.length === 0) return; // omitir si no hay egresos en el mes

      // Subtítulo para el mes
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Mes: ${monthNames[monthKey] || monthKey}`, 14, currentY);
      currentY += 6;

      // Construir las filas de la tabla
      const rows = monthExpenses.map((exp: ExpenseRecord, index: number) => [
        index + 1,
        // Se formatea la fecha para mostrar solo día, mes y año
        new Date(exp.expenseDate).toLocaleDateString(),
        exp.concept,
        exp.description || "",
        formatCurrency(exp.amount),
        "", // Columna para Totales (vacía en filas individuales)
      ]);

      // Se calcula el total del mes
      const monthTotal = monthExpenses.reduce(
        (sum: number, exp: ExpenseRecord) => sum + exp.amount,
        0
      );
      // Fila resumen con totales
      rows.push(["", "", "", "Total", "", formatCurrency(monthTotal)]);

      autoTable(doc, {
        startY: currentY,
        head: [["#", "Fecha", "Concepto", "Descripción", "Monto", "Total"]],
        body: rows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          // Se resalta la fila de totales
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      currentY =
        (doc as any).lastAutoTable
          ? (doc as any).lastAutoTable.finalY + 10
          : currentY + 20;
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

    const footerText = "Un servicio de Omnipixel.";
    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text(footerText, margin, footerY - 10);
    doc.text("Contacto: administracion@estate-admin.com", margin, footerY - 5);

    doc.save(`reporte_egresos_${year}.pdf`);
  };

  return (
    <div className="w-full flex justify-end items-center">
      <button
        onClick={generatePDF}
        className="bg-indigo-600  justify-center text-white text-sm py-2 px-1 flex items-center rounded w-[240px] font-medium hover:bg-indigo-700"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        Generar Reporte de Egresos
      </button>
    </div>
  );
};

export default PDFExpenseReportGenerator;
