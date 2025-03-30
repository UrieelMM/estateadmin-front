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
      className="flex items-center text-sm bg-indigo-600  dark:bg-indigo-500 text-white px-3 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-[20px] h-[20px] mr-1"
      >
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
      Generar PDF
    </button>
  );
};

export default UnidentifiedPaymentsPDF;
