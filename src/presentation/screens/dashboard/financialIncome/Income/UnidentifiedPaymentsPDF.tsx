import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";

export interface UnidentifiedPayment {
  id: string;
  paymentDate: Date;
  registrationDate: Date;
  amountPaid: number;
  paymentType: string;
  appliedToUser: boolean;
  attachmentPayment?: string;
  financialAccountId?: string;
}

interface UnidentifiedPaymentsPDFProps {
  payments: UnidentifiedPayment[];
}

const UnidentifiedPaymentsPDF: React.FC<UnidentifiedPaymentsPDFProps> = ({
  payments,
}) => {
  const { logoBase64, signatureBase64, adminCompany, adminPhone, adminEmail } =
    usePaymentSummaryStore();

  const generatePDF = () => {
    const doc = new jsPDF();

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    }

    // Título
    doc.setFontSize(14);
    doc.text("Reporte de Pagos No Identificados", 14, 20);
    doc.setFontSize(12);

    // Fecha del reporte
    const reportDate = new Date().toLocaleString();
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, 30);

    // Datos de la tabla
    const tableData = payments.map((payment) => [
      new Date(payment.paymentDate).toLocaleDateString("es-MX"),
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(payment.amountPaid),
      payment.paymentType,
    ]);

    // Configuración de la tabla
    autoTable(doc, {
      head: [["Fecha", "Monto", "Tipo de Pago"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Fecha
        1: { cellWidth: 60 }, // Monto
        2: { cellWidth: 80 }, // Tipo de pago
      },
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Página para firma y datos de la administradora
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

    // Guardar el PDF
    doc.save("pagos_no_identificados.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-1"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Generar PDF
    </button>
  );
};

export default UnidentifiedPaymentsPDF;
