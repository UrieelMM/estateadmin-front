// src/components/PDFReportGenerator.tsx
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

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ year, concept }) => {
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

    // Si no se pasa un concepto se asume "Cuota de mantenimiento"
    const reportConcept = concept ? concept : "Cuota de mantenimiento";

    // Función para formatear números como moneda
    const formatCurrency = (value: number): string =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);

    // Definir encabezado de la tabla
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

    // Se arma el cuerpo de la tabla:
    // Se recorre la lista completa de condóminos (incluso aquellos sin registro, quedarán con montos en $0.00)
    const tableBody: any[][] = [];
    // Totales acumulados por mes y total pendiente global
    const totals: { [month: string]: number } = {
        "01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0,
        "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0,
    };
    let totalPendingGlobal = 0;

    allCondominiums.forEach((cond) => {
        // Se obtienen los registros de pago del condómino (clave: número)
        const condoRecords: PaymentRecord[] = detailed[cond.number] || [];
        // Se filtran únicamente los registros correspondientes al concepto indicado
        const filteredRecords = condoRecords.filter(
            (rec) => rec.concept.toLowerCase() === reportConcept.toLowerCase()
        );
        const row = [];
        // Columna A: Nombre y Número de Condomino (opcionalmente se muestra el nombre)
        row.push(`${cond.number}${cond.name ? " - " + cond.name : ""}`);

        let totalPendingForCondo = 0;
        // Para cada mes, se suma el monto abonado y se acumula el pendiente
        for (let m = 1; m <= 12; m++) {
            const monthKey = m.toString().padStart(2, "0");
            const monthRecords = filteredRecords.filter((rec) => rec.month === monthKey);
            const paidSum = monthRecords.reduce((sum, rec) => sum + rec.amountPaid, 0);
            const pendingSum = monthRecords.reduce((sum, rec) => sum + rec.amountPending, 0);
            row.push(formatCurrency(paidSum));
            totals[monthKey] += paidSum;
            totalPendingForCondo += pendingSum;
        }
        row.push(formatCurrency(totalPendingForCondo));
        totalPendingGlobal += totalPendingForCondo;
        tableBody.push(row);
    });

    // Fila de totales: se muestra "Total" en la primera celda y luego se suman los montos por mes y el total pendiente global
    const totalsRow = ["Total"];
    for (let m = 1; m <= 12; m++) {
        const monthKey = m.toString().padStart(2, "0");
        totalsRow.push(formatCurrency(totals[monthKey]));
    }
    totalsRow.push(formatCurrency(totalPendingGlobal));
    tableBody.push(totalsRow);

    const generatePDF = () => {
        // Se crea el PDF en orientación horizontal para que quepan todas las columnas
        const doc = new jsPDF({ orientation: "landscape" });

        // --- Encabezado del reporte ---
        if (logoBase64) {
            // Logo más pequeño (30x30)
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

        // --- Se agrega la tabla con autoTable ---
        autoTable(doc, {
            startY: 50,
            head: tableHead,
            body: tableBody,
            headStyles: { fillColor: [75, 68, 224], textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 10 },
            theme: "grid",
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                // Si es la última fila (totales), se pone en bold
                if (data.row.index === tableBody.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                }
            },
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

        doc.save(`reporte_ingresos_${year}_${reportConcept.replace(/\s+/g, "_")}.pdf`);
    };

    return (
        <div className="w-full flex">
            <button
                onClick={generatePDF}
                className="bg-indigo-600 text-white py-2 px-4 rounded w-[300px] font-bold hover:bg-indigo-500"
            >
                {`Generar reporte`}
            </button>
        </div>
    );
};

export default PDFReportGenerator;
