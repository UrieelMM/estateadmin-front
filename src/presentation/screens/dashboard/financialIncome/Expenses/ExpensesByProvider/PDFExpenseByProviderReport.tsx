import React, { useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentChartBarIcon } from "@heroicons/react/20/solid";
import { useSignaturesStore } from "../../../../../../store/useSignaturesStore";

interface PDFExpenseByProviderReportProps {
  year: string;
  providerSummaries: {
    providerId: string;
    providerName: string;
    serviceLabel: string;
    totalAmount: number;
    expenseCount: number;
    expenses: any[];
  }[];
}

const PDFExpenseByProviderReport: React.FC<PDFExpenseByProviderReportProps> = ({
  year,
  providerSummaries,
}) => {
  // Obtener datos de firma y administradora desde el store de firmas
  const {
    logoBase64,
    signatureBase64,
    adminCompany,
    adminPhone,
    adminEmail,
    fetchSignatures,
    isSignatureAvailable,
  } = useSignaturesStore();

  // Cargar las firmas cuando se monta el componente
  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  const generatePDF = async () => {
    // Asegurar que las firmas estén cargadas antes de generar el PDF
    const doc = new jsPDF();

    // Función para formatear números como moneda
    const formatCurrency = (value: number): string =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    // --- Encabezado: Logo, Título, Fecha y Año ---
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 160, 10, 30, 30);
    }
    doc.setFontSize(14);
    doc.text("Reporte de Egresos por Proveedor", 14, 20);
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

    // --- Resumen de Proveedores ---
    doc.setFontSize(14);
    doc.text("Resumen por Proveedor", 14, 50);

    // Tabla de resumen de proveedores
    const summaryRows = providerSummaries.map((summary) => [
      summary.providerName,
      summary.serviceLabel,
      summary.expenseCount.toString(),
      formatCurrency(summary.totalAmount),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["Proveedor", "Servicio", "Cantidad", "Total"]],
      body: summaryRows,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      theme: "grid",
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- Detalle por Proveedor ---
    providerSummaries.forEach((summary) => {
      // Verificar si necesitamos una nueva página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Título del proveedor
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${summary.providerName} - ${summary.serviceLabel}`,
        14,
        currentY
      );
      currentY += 6;

      // Tabla de egresos del proveedor
      const expenseRows = summary.expenses.map((expense) => [
        new Date(expense.expenseDate).toLocaleDateString(),
        expense.concept,
        formatCurrency(expense.amount),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Fecha", "Concepto", "Monto"]],
        body: expenseRows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        theme: "grid",
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    // --- Página final con firma y datos de la administradora ---
    doc.addPage();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const adminSectionY = pageHeight - 80;

    // Verificar disponibilidad y añadir firma
    if (isSignatureAvailable() && signatureBase64) {
      doc.addImage(signatureBase64, "JPEG", margin, adminSectionY - 20, 50, 20);
    }

    doc.setFontSize(12);
    doc.text("Firma del Administrador", margin, adminSectionY);

    const adminX = margin;
    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", adminX, adminSectionY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(
      adminCompany || "Administradora S.A.",
      adminX + 40,
      adminSectionY + 10
    );
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", adminX, adminSectionY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(
      adminPhone || "Teléfono no disponible",
      adminX + 40,
      adminSectionY + 20
    );
    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", adminX, adminSectionY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(
      adminEmail || "Email no disponible",
      adminX + 40,
      adminSectionY + 30
    );

    const footerText = "Un servicio de Omnipixel.";
    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text(footerText, margin, footerY - 10);
    doc.text("Contacto: administracion@estate-admin.com", margin, footerY - 5);

    doc.save(`reporte_egresos_proveedores_${year}.pdf`);
  };

  return (
    <div className="w-full flex justify-end items-center">
      <button
        onClick={() => generatePDF()}
        className="bg-indigo-600 justify-center text-white text-sm py-2 px-1 flex items-center rounded w-[240px] font-medium hover:bg-indigo-700"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        Generar Reporte por Proveedor
      </button>
    </div>
  );
};

export default PDFExpenseByProviderReport;
