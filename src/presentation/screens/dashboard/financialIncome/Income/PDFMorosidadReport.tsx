// src/components/Summary/MorosidadPDFReport.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { DocumentChartBarIcon } from "@heroicons/react/16/solid";

/**
 * Pequeño mapeo de "01" -> "Enero", etc.
 */
const MONTH_NAMES: Record<string, string> = {
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

const MorosidadPDFReport: React.FC = () => {
  // Obtenemos datos del store
  const {
    detailed,        // Record<string, PaymentRecord[]>, agrupados por número de condómino
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureBase64,
  } = usePaymentSummaryStore((state) => ({
    detailed: state.detailed,
    adminCompany: state.adminCompany,
    adminPhone: state.adminPhone,
    adminEmail: state.adminEmail,
    logoBase64: state.logoBase64,
    signatureBase64: state.signatureBase64,
  }));

  /**
   * Formatear números como moneda, por ejemplo: $2,500.00
   */
  const formatCurrency = (value: number): string => {
    return "$" + value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Generar reporte PDF al hacer clic en el botón
   */
  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const reportDateStr = now.toLocaleString();

    // 1. Encabezado: logo y datos generales
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    }
    doc.setFontSize(14);
    doc.text("Reporte de Morosidad", 14, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDateStr, 14 + doc.getTextWidth("Fecha:") + 2, 30);

    // 2. Listar usuarios morosos
    // Filtramos solo los usuarios que tengan al menos un cargo con paid === false
    // (es decir, un cargo pendiente)
    const allUsers = Object.keys(detailed); // ["101", "102", ...]
    const morosos = allUsers.filter((user) =>
      detailed[user].some((record) => !record.paid && record.amountPending > 0)
    );

    // Ordenar usuarios de manera numérica o alfanumérica (ej: "1", "2", "10"...)
    morosos.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) || isNaN(numB)) {
        return a.localeCompare(b);
      }
      return numA - numB;
    });

    let currentY = 50;
    let grandTotal = 0;

    // Para cada usuario moroso, generamos una tabla con sus cargos pendientes
    morosos.forEach((user, index) => {
      // Filtrar registros pendientes
      const pendingRecords = detailed[user].filter(
        (record) => !record.paid && record.amountPending > 0
      );
      // Calcular total de deuda de este usuario
      const userDebt = pendingRecords.reduce(
        (acc, record) => acc + record.amountPending,
        0
      );
      grandTotal += userDebt;

      // Título: "Usuario #101"
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      if (index > 0) {
        // Dejamos un espacio adicional si no es el primer usuario
        currentY += 5;
      }
      doc.text(`Usuario #${user} - Total: ${formatCurrency(userDebt)}`, 14, currentY);

      // Construimos las filas para la tabla: [Concepto, Mes, Monto Pendiente]
      const rows = pendingRecords.map((rec) => {
        const mes = MONTH_NAMES[rec.month] || rec.month;
        return [
          rec.concept,                // Concepto
          mes,                        // Mes
          formatCurrency(rec.amountPending), // Pendiente
        ];
      });

      // Agregamos una fila de "Total" al final para el usuario
      rows.push(["", "Total", formatCurrency(userDebt)]);

      // Renderizamos la tabla con autoTable
      currentY += 6;
      autoTable(doc, {
        startY: currentY,
        head: [["Concepto", "Mes", "Monto Pendiente"]],
        body: rows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          // Si es la última fila, ponerla en negrita
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Actualizamos la posición Y para la siguiente tabla
      // (doc as any).lastAutoTable contiene info de la última tabla
      currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : currentY + 20;

      // Control de salto de página manual si se acerca al final
      if (currentY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        currentY = 20;
      }
    });

    // 3. Mostrar un gran total de morosidad al final
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Global de Morosidad: ${formatCurrency(grandTotal)}`, 14, currentY);
    currentY += 20;

    // 4. Pie de página: firma y datos de la administradora (página nueva para consistencia)
    doc.addPage();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const adminSectionY = pageHeight - 80;

    // Firma (si existe)
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

    // Footer informativo
    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", margin, footerY - 10);
    doc.text("Correo: administracion@estate-admin.com", margin, footerY - 5);

    // 5. Guardar PDF
    doc.save("ReporteMorosidad.pdf");
  };

  return (
    <div>
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white py-2 px-4 rounded flex items-center font-bold hover:bg-indigo-700"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        Generar Reporte de Morosidad
      </button>
    </div>
  );
};

export default MorosidadPDFReport;
