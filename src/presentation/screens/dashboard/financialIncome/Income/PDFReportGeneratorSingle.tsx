// PDFReportGeneratorSingle.tsx
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentRecord } from "../../../../../store/paymentHistoryStore";

export interface PDFReportGeneratorSingleProps {
  year: string;
  condominium: { number: string; name: string };
  detailed: Record<string, PaymentRecord[]>; // Reporte general por mes
  detailedByConcept: Record<string, Record<string, PaymentRecord[]>>; // Reporte agrupado por concepto y mes
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
  signatureBase64: string;
}

const PDFReportGeneratorSingle: React.FC<PDFReportGeneratorSingleProps> = ({
  year,
  condominium,
  detailed,
  detailedByConcept,
  adminCompany,
  adminPhone,
  adminEmail,
  logoBase64,
  signatureBase64,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20; // Empezamos más arriba para los encabezados
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Función para formatear valores en USD (con el símbolo $)
    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value);

    // --- Encabezado ---
    // 1. Logo en la parte superior derecha
    if (logoBase64) {
      // Se coloca a 10 px desde el tope y 10 px desde el borde derecho
      doc.addImage(logoBase64, "PNG", pageWidth - 40, 10, 30, 30);
    }
    // 2. Fecha y datos generales en la parte superior izquierda
    const reportDate = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.text("Reporte general de ingresos por condomino", 14, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, yPos);
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Año:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(year, 14 + doc.getTextWidth("Año:") + 2, yPos);
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Condomino:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${condominium.number} - ${condominium.name}`, 14 + doc.getTextWidth("Condomino:") + 4, yPos); // Ajuste aquí
    yPos += 10;

    // --- Reporte General (por mes) ---
    doc.setFontSize(12);
    doc.text("Reporte General", 14, yPos);
    yPos += 6;

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

    const generalData: (string | number)[][] = [];
    let totalPaidGeneral = 0,
      totalPendingGeneral = 0,
      totalCreditGeneral = 0;
    for (let i = 1; i <= 12; i++) {
      const monthNum = i.toString().padStart(2, "0");
      const key = `${year}-${monthNum}`;
      const records = detailed[key] || [];
      const totalPaid = records.reduce((acc, rec) => acc + rec.amountPaid, 0);
      const totalPending = records.reduce((acc, rec) => acc + rec.amountPending, 0);
      const totalCredit = records.reduce((acc, rec) => acc + rec.creditBalance, 0);
      totalPaidGeneral += totalPaid;
      totalPendingGeneral += totalPending;
      totalCreditGeneral += totalCredit;
      generalData.push([
        monthNames[monthNum],
        formatCurrency(totalPaid),
        formatCurrency(totalPending),
        formatCurrency(totalCredit),
      ]);
    }
    // Agregar fila de totales
    generalData.push([
      "Total",
      formatCurrency(totalPaidGeneral),
      formatCurrency(totalPendingGeneral),
      formatCurrency(totalCreditGeneral),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a Favor"]],
      body: generalData,
      theme: "grid",
      headStyles: { fillColor: [77, 68, 224], fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.row.index === generalData.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;

    // --- Reporte por Concepto ---
    doc.setFontSize(14);
    doc.text("Ingresos - Concepto", 14, yPos);
    yPos += 6;

    for (const concept in detailedByConcept) {
      doc.setFontSize(12);
      doc.text(`Concepto: ${concept}`, 14, yPos);
      yPos += 6;
      const conceptData: (string | number)[][] = [];
      let totalPaidConcept = 0,
        totalPendingConcept = 0,
        totalCreditConcept = 0;
      for (let i = 1; i <= 12; i++) {
        const monthNum = i.toString().padStart(2, "0");
        const key = `${year}-${monthNum}`;
        const records = detailedByConcept[concept][key] || [];
        const totalPaid = records.reduce((acc, rec) => acc + rec.amountPaid, 0);
        const totalPending = records.reduce((acc, rec) => acc + rec.amountPending, 0);
        const totalCredit = records.reduce((acc, rec) => acc + rec.creditBalance, 0);
        totalPaidConcept += totalPaid;
        totalPendingConcept += totalPending;
        totalCreditConcept += totalCredit;
        conceptData.push([
          monthNames[monthNum],
          formatCurrency(totalPaid),
          formatCurrency(totalPending),
          formatCurrency(totalCredit),
        ]);
      }
      conceptData.push([
        "Total",
        formatCurrency(totalPaidConcept),
        formatCurrency(totalPendingConcept),
        formatCurrency(totalCreditConcept),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a Favor"]],
        body: conceptData,
        theme: "grid",
        headStyles: { fillColor: [77, 68, 224], fontStyle: "bold", textColor: 255 },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.row.index === conceptData.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;
    }

    // --- Nueva página para la firma y datos de la administradora ---
    doc.addPage();
    yPos = pageHeight - 80; // Ajustamos la posición para que quede al pie de página

    // Firma del Administrador
    if (signatureBase64) {
      doc.addImage(signatureBase64, "PNG", 14, yPos, 50, 20);
    }
    yPos += 25;
    doc.setFontSize(12);
    doc.text("Firma del Administrador", 14, yPos);
    yPos += 10;

    // Administradora, Teléfono y Contacto
    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminCompany, 14 + doc.getTextWidth("Administradora:") + 6, yPos); // Ajuste aquí
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminPhone, 14 + doc.getTextWidth("Teléfono:") + 6, yPos); // Ajuste aquí
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminEmail, 14 + doc.getTextWidth("Contacto:") + 6, yPos); // Ajuste aquí
    yPos += 10;

    // Un servicio de Omnipixel
    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", 14, yPos);
    yPos += 5;
    doc.text("Contacto: administracion@estate-admin.com", 14, yPos);

    // --- Guardar PDF ---
    // Nombre del archivo: reporte_individual_{numeroCondomino}.pdf
    doc.save(`reporte_individual_${condominium.number}.pdf`);
  };

  return (
    <div className="mt-8">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
      >
        Generar Reporte
      </button>
    </div>
  );
};

export default PDFReportGeneratorSingle;
