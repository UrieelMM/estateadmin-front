// src/components/PDFReportGeneratorMaintenance.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentRecord, usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

interface Condominium {
  number: string;
  name?: string;
}

export interface PDFReportGeneratorProps {
  year: string;
  concept?: string;
}

// Si no se pasa un concepto se asume "Cuota de mantenimiento"
const PDFReportGeneratorMaintenance: React.FC<PDFReportGeneratorProps> = ({ year, concept }) => {
  // Se obtienen datos del store de pagos
  const {
    detailed,
    logoBase64,
    signatureBase64,
    adminCompany,
    adminPhone,
    adminEmail,
  } = usePaymentSummaryStore((state) => ({
    detailed: state.detailed,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
    adminCompany: state.adminCompany,
    adminPhone: state.adminPhone,
    adminEmail: state.adminEmail,
    conceptRecords: state.conceptRecords,
  }));

  // Se obtienen los condóminos desde el store de usuarios
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const allCondominiums: Condominium[] = condominiumsUsers.map((user) => ({
    number: String(user.number),
    name: user.name,
  }));

  const reportConcept = concept ? concept : "Cuota de mantenimiento";

  // Función para formatear números como moneda
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Definir encabezado de la tabla global
  const tableHead = [[
    "Nombre y Número de Condomino",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
    "Monto pendiente",
  ]];

  // Armar el cuerpo de la tabla global
  const tableBody: any[][] = [];
  const totals: { [month: string]: number } = {
    "01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0,
    "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0,
  };
  let totalPendingGlobal = 0;

  allCondominiums.forEach((cond) => {
    // Se obtienen los registros de pago del condómino (clave: número)
    const condoRecords: PaymentRecord[] = detailed[cond.number] || [];
    // Filtrar registros correspondientes al concepto indicado
    const filteredRecords = condoRecords.filter(
      (rec) => rec.concept.toLowerCase() === reportConcept.toLowerCase()
    );
    const row = [];
    // Columna A: Nombre y Número de Condomino
    row.push(`${cond.number}${cond.name ? " - " + cond.name : ""}`);
    let totalPendingForCondo = 0;
    // Para cada mes, se suma el monto abonado (amountPaid + creditBalance) y se acumula el pendiente
    for (let m = 1; m <= 12; m++) {
      const monthKey = m.toString().padStart(2, "0");
      const monthRecords = filteredRecords.filter((rec) => rec.month === monthKey);
      const paidSum = monthRecords.reduce((sum, rec) => sum + rec.amountPaid + rec.creditBalance, 0);
      const pendingSum = monthRecords.reduce((sum, rec) => sum + rec.amountPending, 0);
      row.push(formatCurrency(paidSum));
      totals[monthKey] += paidSum;
      totalPendingForCondo += pendingSum;
    }
    row.push(formatCurrency(totalPendingForCondo));
    totalPendingGlobal += totalPendingForCondo;
    tableBody.push(row);

    // NUEVA FILA: Agregar fila con las fechas de pago por mes para este condómino.
    // En la primera celda se muestra "Fecha" en bold.
    const dateRow = [];
    dateRow.push({ content: "Fecha", styles: { fontStyle: "bold" } });
    for (let m = 1; m <= 12; m++) {
      const monthKey = m.toString().padStart(2, "0");
      const monthRecords = filteredRecords.filter((rec) => rec.month === monthKey);
      const dates = monthRecords
        .map((rec) => rec.paymentDate)
        .filter((d): d is string => !!d)
        .join(", ");
      dateRow.push(dates || "-");
    }
    dateRow.push("-");
    tableBody.push(dateRow);
  });

  // Fila de totales globales
  const totalsRow = ["Total"];
  for (let m = 1; m <= 12; m++) {
    const monthKey = m.toString().padStart(2, "0");
    totalsRow.push(formatCurrency(totals[monthKey]));
  }
  totalsRow.push(formatCurrency(totalPendingGlobal));
  tableBody.push(totalsRow);

  const generatePDF = () => {
    // Se crea el PDF en orientación horizontal
    const doc = new jsPDF({ orientation: "landscape" });

    // --- Encabezado del reporte ---
    if (logoBase64) {
      doc.addImage(
        logoBase64,
        "PNG",
        doc.internal.pageSize.getWidth() - 50,
        10,
        30,
        30
      );
    }
    doc.setFontSize(14);
    doc.text(`Reporte de Ingresos - ${reportConcept}`, 14, 20);
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

    // --- Agregar la tabla global con autoTable ---
    autoTable(doc, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      theme: "grid",
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // --- Página para firma y datos de la administradora ---
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

    doc.save(`reporte_ingresos_${year}_${reportConcept.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="w-full flex">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white text-sm py-2 px-1 rounded w-[220px] font-medium hover:bg-indigo-700"
      >
        {`Generar reporte`}
      </button>
    </div>
  );
};

export default PDFReportGeneratorMaintenance;
