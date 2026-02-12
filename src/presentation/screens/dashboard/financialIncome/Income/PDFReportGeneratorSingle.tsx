// PDFReportGeneratorSingle.tsx

import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentChartBarIcon } from "@heroicons/react/20/solid";
import { useSignaturesStore } from "../../../../../store/useSignaturesStore";

// Ajusta esta interfaz a como tengas tu PaymentRecord realmente.
// Se agregó la propiedad opcional creditUsed.
export interface PaymentRecord {
  amountPaid: number;
  amountPending: number;
  creditBalance: number;
  creditUsed?: number;
  referenceAmount: number; // Monto original del cargo que no se modifica con los pagos
  // Podría ser un string o arreglo de strings
  paymentDate?: string | string[];
  // ... otros campos ...
}

export interface PDFReportGeneratorSingleProps {
  year: string;
  condominium: { number: string; name: string };
  // Estructura: { '2025-01': [PaymentRecord, ...], '2025-02': [...], ... }
  detailed: Record<string, PaymentRecord[]>;
  // Estructura por concepto: { "Mantenimiento": { '2025-01': [PaymentRecord...], '2025-02': [...], ...}, ... }
  detailedByConcept: Record<string, Record<string, PaymentRecord[]>>;
  adminCompany: string;
  adminPhone: string;
  adminEmail: string;
  logoBase64: string;
}

// Mapeo de meses en español a número
const spanishMonths: Record<string, string> = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  septiembre: "09",
  setiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

// Función para formatear valores monetarios
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Recibe algo como "4 de marzo de 2025, 3:11:00 p.m. UTC-6"
 * Devuelve "04/03/2025" si logra parsear
 */
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return "";
  // Regex que busca "<dia> de <mes> de <year>"
  const regex = /(\d+)\s+de\s+([a-zA-ZñÑ]+)\s+de\s+(\d{4})/;
  const match = dateStr.match(regex);
  if (!match) {
    // Si no hace match, dejamos el string original
    return dateStr;
  }
  const day = match[1].padStart(2, "0");
  const monthName = match[2].toLowerCase();
  const year = match[3];
  const monthNum = spanishMonths[monthName] || "01";
  return `${day}/${monthNum}/${year}`;
}

/**
 * Extrae todas las fechas de paymentDate (puede ser string o string[])
 * de un arreglo de PaymentRecord, las formatea a dd/mm/aaaa
 * y las une separadas por coma.
 */
function getAllPaymentDates(records: PaymentRecord[]): string {
  const allDates: string[] = [];
  records.forEach((rec) => {
    const field = rec.paymentDate;
    if (!field) return; // no hay fecha
    if (Array.isArray(field)) {
      // Múltiples fechas
      field.forEach((f) => {
        allDates.push(formatDateDMY(f));
      });
    } else {
      // Solo una fecha
      allDates.push(formatDateDMY(field));
    }
  });
  // quitamos duplicados
  const uniqueDates = Array.from(new Set(allDates));
  return uniqueDates.join(", ");
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
}) => {
  // Obtener la firma desde el store de firmas
  const {
    signatureBase64,
    ensureSignaturesLoaded,
    isSignatureAvailable,
    fetchSignatures,
  } = useSignaturesStore((state) => ({
    signatureBase64: state.signatureBase64,
    ensureSignaturesLoaded: state.ensureSignaturesLoaded,
    isSignatureAvailable: state.isSignatureAvailable,
    fetchSignatures: state.fetchSignatures,
  }));

  // Cargar las firmas al montar el componente
  React.useEffect(() => {
    const loadSignatures = async () => {
      try {
        await fetchSignatures();
      } catch (error) {
        console.error("Error al cargar firmas en el componente:", error);
      }
    };
    loadSignatures();
  }, [fetchSignatures]);

  // Usar directamente los datos del historial individual (props)
  const processedData = React.useMemo(
    () => ({ detailed, detailedByConcept }),
    [detailed, detailedByConcept]
  );

  const generatePDF = async () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- ENCABEZADO ---
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", pageWidth - 40, 10, 30, 30);
    }
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
    doc.text(year || "Todos los años", 14 + doc.getTextWidth("Año:") + 2, yPos);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Condomino:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${condominium.number} - ${condominium.name}`,
      14 + doc.getTextWidth("Condomino:") + 4,
      yPos
    );
    yPos += 10;

    // --- REPORTE GENERAL (SIN FECHA) ---
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
      totalChargesGeneral = 0,
      totalBalanceGeneral = 0;

    for (let i = 1; i <= 12; i++) {
      const monthNum = i.toString().padStart(2, "0");
      const records = year
        ? processedData.detailed[`${year}-${monthNum}`] || []
        : Object.entries(processedData.detailed)
            .filter(([k]) => k.endsWith(`-${monthNum}`))
            .flatMap(([, recs]) => recs);
      // Calculamos el total pagado
      const totalPaid = records.reduce((acc, rec) => acc + rec.amountPaid, 0);
      // Cargos: misma lógica de la UI del historial.
      // Cada clave YYYY-MM representa el cargo total del mes y se toma una sola vez por clave.
      const monthGroups = year
        ? [[`${year}-${monthNum}`, processedData.detailed[`${year}-${monthNum}`] || []] as const]
        : (Object.entries(processedData.detailed).filter(([k]) =>
            k.endsWith(`-${monthNum}`)
          ) as [string, PaymentRecord[]][]);

      const totalCharges = monthGroups.reduce((acc, [, recs]) => {
        if (!recs || recs.length === 0) return acc;
        return acc + (recs[0].referenceAmount || 0);
      }, 0);
      const totalCreditUsed = records.reduce(
        (acc, rec) => acc + (rec.creditUsed || 0),
        0
      );
      const totalCreditBalance = records.reduce(
        (acc, rec) => acc + rec.creditBalance,
        0
      );
      const totalCredit = totalCreditBalance - totalCreditUsed;

      // Monto Abonado incluye los pagos menos el saldo a favor usado, más el saldo a favor disponible
      const totalPaidWithCredit =
        totalPaid - totalCreditUsed + (totalCredit > 0 ? totalCredit : 0);

      // El saldo es la diferencia entre cargos y pagos (incluyendo créditos)
      const balance = totalCharges - totalPaidWithCredit;

      totalPaidGeneral += totalPaidWithCredit;
      totalChargesGeneral += totalCharges;
      totalBalanceGeneral += balance;

      if (!records.length && !year) {
        continue;
      }

      generalData.push([
        monthNames[monthNum],
        formatCurrency(totalPaidWithCredit),
        formatCurrency(totalCharges),
        formatCurrency(balance),
      ]);
    }
    // Agregamos fila de Totales
    generalData.push([
      "Total",
      formatCurrency(totalPaidGeneral),
      formatCurrency(totalChargesGeneral),
      formatCurrency(totalBalanceGeneral),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Mes", "Monto Abonado", "Cargos", "Saldo"]],
      body: generalData,
      theme: "grid",
      headStyles: {
        fillColor: [77, 68, 224],
        fontStyle: "bold",
        textColor: 255,
      },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        // Saldo = columna 3
        if (data.section === "body" && data.column.index === 3) {
          let numericValue = 0;
          if (typeof data.cell.raw === "string") {
            numericValue =
              parseFloat(data.cell.raw.replace(/[^0-9.-]/g, "")) || 0;
          } else if (typeof data.cell.raw === "number") {
            numericValue = data.cell.raw;
          }
          if (numericValue < 0) {
            // Si el saldo es negativo, significa que tiene un crédito
            data.cell.text = [`+${formatCurrency(Math.abs(numericValue))}`];
            data.cell.styles.textColor = [0, 128, 0]; // verde
          } else if (numericValue > 0) {
            // Si el saldo es positivo, significa que debe dinero
            data.cell.text = [formatCurrency(numericValue)];
            data.cell.styles.textColor = [255, 0, 0]; // rojo
          }
        }
        // Última fila => Totales
        if (data.row.index === generalData.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    yPos = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 10
      : yPos + 10;

    // --- REPORTE POR CONCEPTO (CON COLUMNA "FECHA(S) DE PAGO") ---
    doc.setFontSize(14);
    doc.text("Ingresos por concepto", 14, yPos);
    yPos += 6;

    for (const concept in processedData.detailedByConcept) {
      doc.setFontSize(12);
      doc.text(`Concepto: ${concept}`, 14, yPos);
      yPos += 6;

      const conceptData: (string | number)[][] = [];
      let totalPaidConcept = 0,
        totalChargesConcept = 0,
        totalBalanceConcept = 0;

      for (let i = 1; i <= 12; i++) {
        const monthNum = i.toString().padStart(2, "0");
        const records =
          year && year.length === 4
            ? processedData.detailedByConcept[concept]?.[
                `${year}-${monthNum}`
              ] || []
            : Object.entries(processedData.detailedByConcept[concept] || {})
                .filter(([k]) => k.endsWith(`-${monthNum}`))
                .flatMap(([, recs]) => recs);
        // Calculamos el total pagado para este concepto
        const totalPaid = records.reduce((acc, rec) => acc + rec.amountPaid, 0);
        // Evita sobreconteo cuando hay varios registros por el mismo mes.
        // referenceAmount ya representa el cargo del mes para esa clave YYYY-MM.
        const conceptMonthGroups = year
          ? [[
              `${year}-${monthNum}`,
              processedData.detailedByConcept[concept]?.[
                `${year}-${monthNum}`
              ] || [],
            ] as const]
          : (Object.entries(processedData.detailedByConcept[concept] || {}).filter(
              ([k]) => k.endsWith(`-${monthNum}`)
            ) as [string, PaymentRecord[]][]);

        const totalCharges = conceptMonthGroups.reduce((acc, [, recs]) => {
          if (!recs || recs.length === 0) return acc;
          return acc + (recs[0].referenceAmount || 0);
        }, 0);
        const totalCreditUsed = records.reduce(
          (acc, rec) => acc + (rec.creditUsed || 0),
          0
        );
        const totalCreditBalance = records.reduce(
          (acc, rec) => acc + rec.creditBalance,
          0
        );
        const totalCredit = totalCreditBalance - totalCreditUsed;

        // Monto Abonado incluye los pagos menos el saldo a favor usado, más el saldo a favor disponible
        const totalPaidWithCredit =
          totalPaid - totalCreditUsed + (totalCredit > 0 ? totalCredit : 0);

        // El saldo es la diferencia entre cargos y pagos (incluyendo créditos)
        const balance = totalCharges - totalPaidWithCredit;

        totalPaidConcept += totalPaidWithCredit;
        totalChargesConcept += totalCharges;
        totalBalanceConcept += balance;

        // Obtener fecha(s) de pago
        const allDates = getAllPaymentDates(records);

        if (!records.length && !year) {
          continue;
        }

        conceptData.push([
          monthNames[monthNum],
          formatCurrency(totalPaidWithCredit),
          formatCurrency(totalCharges),
          formatCurrency(balance),
          allDates,
        ]);
      }

      if (conceptData.length === 0) {
        continue;
      }

      conceptData.push([
        "Total",
        formatCurrency(totalPaidConcept),
        formatCurrency(totalChargesConcept),
        formatCurrency(totalBalanceConcept),
        "",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Mes", "Monto Abonado", "Cargos", "Saldo", "Fecha(s) de Pago"]],
        body: conceptData,
        theme: "grid",
        headStyles: {
          fillColor: [77, 68, 224],
          fontStyle: "bold",
          textColor: 255,
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          // Saldo = columna 3
          if (data.section === "body" && data.column.index === 3) {
            let numericValue = 0;
            if (typeof data.cell.raw === "string") {
              numericValue =
                parseFloat(data.cell.raw.replace(/[^0-9.-]/g, "")) || 0;
            } else if (typeof data.cell.raw === "number") {
              numericValue = data.cell.raw;
            }
            if (numericValue < 0) {
              // Si el saldo es negativo, significa que tiene un crédito
              data.cell.text = [`+${formatCurrency(Math.abs(numericValue))}`];
              data.cell.styles.textColor = [0, 128, 0]; // verde
            } else if (numericValue > 0) {
              // Si el saldo es positivo, significa que debe dinero
              data.cell.text = [formatCurrency(numericValue)];
              data.cell.styles.textColor = [255, 0, 0]; // rojo
            }
          }
          // Fila totales => la última
          if (data.row.index === conceptData.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      yPos = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 10
        : yPos + 10;
    }

    // --- Nueva página para firma/administradora ---
    doc.addPage();
    yPos = pageHeight - 80;

    // Asegurar que las firmas estén cargadas antes de usarlas
    try {
      const signaturesLoaded = await ensureSignaturesLoaded();

      if (signaturesLoaded && isSignatureAvailable() && signatureBase64) {
        try {
          // Verificar que la imagen base64 sea válida
          if (signatureBase64.startsWith("data:image/")) {
            doc.addImage(signatureBase64, "JPEG", 14, yPos, 50, 20);
          }
        } catch (error) {
          console.error("Error al agregar la firma al PDF:", error);
        }
      } else {
        console.warn("No se pudo cargar la firma - Reintentando...");
        // Intentar cargar las firmas de nuevo como último recurso
        try {
          await fetchSignatures(true); // Forzar recarga
          if (signatureBase64 && signatureBase64.startsWith("data:image/")) {
            doc.addImage(signatureBase64, "JPEG", 14, yPos, 50, 20);
          }
        } catch (retryError) {
          console.error("Error en el reintento de carga de firma:", retryError);
        }
      }
    } catch (error) {
      console.error("Error al asegurar la carga de firmas:", error);
    }

    yPos += 25;

    doc.setFontSize(12);
    doc.text("Firma del Administrador", 14, yPos);
    yPos += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminCompany, 14 + doc.getTextWidth("Administradora:") + 6, yPos);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminPhone, 14 + doc.getTextWidth("Teléfono:") + 6, yPos);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(adminEmail, 14 + doc.getTextWidth("Contacto:") + 6, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", 14, yPos);
    yPos += 5;
    doc.text("Contacto: administracion@estate-admin.com", 14, yPos);

    const generatedAt = new Date().toLocaleString("es-MX");
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `EstateAdmin - ${generatedAt}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });
    }

    doc.save(`reporte_individual_${condominium.number}.pdf`);
  };

  return (
    <div className="mt-8">
      <button
        onClick={() => generatePDF()}
        className="bg-indigo-600 flex justify-center text-white text-sm py-2 px-1 rounded w-[160px] font-medium hover:bg-indigo-700"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        Generar Reporte
      </button>
    </div>
  );
};

export default PDFReportGeneratorSingle;
