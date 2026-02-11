import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type IncomeAIReportPdfParams = {
  report: string;
  templateLabel: string;
  selectedYear: string;
  generatedAt: Date;
  logoBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
  canonical: {
    saldoInicialHistorico: number;
    ingresosPeriodo: number;
    totalEgresosPeriodo: number;
    flujoNetoPeriodo: number;
    saldoActualConsolidado: number;
    totalCargos: number;
    saldo: number;
  };
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    });

function sanitizeForPdf(value: string): string {
  // jsPDF con fuentes base no soporta emojis ni muchos símbolos Unicode.
  // Conservamos ASCII + Latin-1 para mantener legibilidad en español.
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toPlainText(value: string): string {
  return sanitizeForPdf(
    value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
      .trim()
  );
}

function parseMarkdownTable(block: string[]): { head: string[]; body: string[][] } {
  const rows = block
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((c) => toPlainText(c.trim()))
    );

  if (rows.length < 2) {
    return { head: [], body: [] };
  }

  const header = rows[0];
  const body = rows.slice(2);
  return { head: header, body };
}

export function downloadIncomeAIReportPdf(params: IncomeAIReportPdfParams) {
  const {
    report,
    templateLabel,
    selectedYear,
    generatedAt,
    logoBase64,
    adminCompany,
    adminPhone,
    adminEmail,
    canonical,
  } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFillColor(248, 250, 255);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setFillColor(224, 231, 255);
  doc.rect(0, 31, pageWidth, 3, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", pageWidth - 38, 7, 24, 20);
    } catch (_err) {
      // Si el formato de logo no es compatible, el reporte se genera sin logo.
    }
  }

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Reporte Financiero", margin, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tipo: ${templateLabel}`, margin, 21);
  doc.text("Resumen ejecutivo de ingresos y salud financiera", margin, 27);

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Contexto del reporte", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Periodo: ${selectedYear || "Todos los años"}`, margin, 48);
  doc.text(`Generado: ${generatedAt.toLocaleString("es-MX")}`, margin, 53);

  if (adminCompany || adminPhone || adminEmail) {
    const company = adminCompany || "N/A";
    const phone = adminPhone || "N/A";
    const email = adminEmail || "N/A";
    doc.text(`Administración: ${company}`, margin, 58);
    doc.text(`Tel: ${phone}`, margin, 63);
    doc.text(`Email: ${email}`, margin, 68);
  }

  autoTable(doc, {
    startY: 74,
    head: [["KPI", "Valor"]],
    body: [
      ["Saldo inicial histórico", formatCurrency(canonical.saldoInicialHistorico)],
      ["Ingresos del período", formatCurrency(canonical.ingresosPeriodo)],
      ["Egresos del período", formatCurrency(canonical.totalEgresosPeriodo)],
      ["Flujo neto del período", formatCurrency(canonical.flujoNetoPeriodo)],
      ["Saldo actual consolidado", formatCurrency(canonical.saldoActualConsolidado)],
      ["Cargos del período", formatCurrency(canonical.totalCargos)],
      ["Saldo (cargos - abonado)", formatCurrency(canonical.saldo)],
    ],
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 52, halign: "right" },
    },
  });

  let currentY = (doc as any).lastAutoTable?.finalY + 8 || 110;
  const lineHeight = 5;
  const maxTextWidth = pageWidth - margin * 2;
  const lines = report.split("\n");

  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 18;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = sanitizeForPdf(lines[i].trim());
    if (!line) {
      currentY += 2;
      continue;
    }

    const isTableHeader =
      line.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|\s*:?-{3,}/.test(lines[i + 1].trim());

    if (isTableHeader) {
      const tableBlock: string[] = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableBlock.push(lines[i]);
        i += 1;
      }
      i -= 1;

      const parsedTable = parseMarkdownTable(tableBlock);
      if (parsedTable.head.length > 0) {
        ensureSpace(28);
        autoTable(doc, {
          startY: currentY,
          head: [parsedTable.head],
          body: parsedTable.body,
          styles: { fontSize: 8.5, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        });
        currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(toPlainText(line), margin, currentY);
      currentY += 6;
      continue;
    }

    if (line.startsWith("## ")) {
      ensureSpace(11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(toPlainText(line), margin, currentY);
      currentY += 6;
      continue;
    }

    if (line.startsWith("# ")) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(toPlainText(line), margin, currentY);
      currentY += 7;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const bulletText = `• ${toPlainText(line.slice(2))}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const wrapped = doc.splitTextToSize(bulletText, maxTextWidth);
      ensureSpace(wrapped.length * lineHeight);
      doc.text(wrapped, margin, currentY);
      currentY += wrapped.length * lineHeight;
      continue;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const wrapped = doc.splitTextToSize(toPlainText(line), maxTextWidth);
    ensureSpace(wrapped.length * lineHeight);
    doc.text(wrapped, margin, currentY);
    currentY += wrapped.length * lineHeight;
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Powered by EstateAdmin IA", margin, pageHeight - 8);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 36, pageHeight - 8);
  }

  const safeYear = selectedYear || "all-years";
  doc.save(`reporte-ia-ingresos-${safeYear}.pdf`);
}
