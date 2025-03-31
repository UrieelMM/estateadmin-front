import React from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  PaymentRecord,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

interface Condominium {
  number: string;
  name?: string;
}

export interface ExcelReportGeneratorProps {
  year: string;
  concept?: string;
  renderButton?: (onClick: () => void) => React.ReactNode;
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

const ExcelReportGenerator: React.FC<ExcelReportGeneratorProps> = ({
  year,
  concept,
  renderButton,
}) => {
  // Obtener datos del store
  const { monthlyStats, detailed, conceptRecords } = usePaymentSummaryStore(
    (state) => ({
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
      detailed: state.detailed,
      adminCompany: state.adminCompany,
      adminPhone: state.adminPhone,
      adminEmail: state.adminEmail,
      conceptRecords: state.conceptRecords,
    })
  );

  // Obtener los condominios desde el store de usuarios
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const allCondominiums: Condominium[] = condominiumsUsers.map((user) => ({
    number: String(user.number),
    name: user.name,
  }));

  // Si se pasa un concepto, obtener la data correspondiente del store
  const computedConceptData: PaymentRecord[] | undefined = concept
    ? conceptRecords[concept]
    : undefined;

  // Función de formateo de moneda
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    // ========================
    // Definición de estilos (usando ExcelJS)
    // ========================
    const titleStyle = {
      font: { bold: true, size: 18, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF4B1CE1" }, // Color principal #4b1ce1
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const headerStyle = {
      font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF818CF8" }, // Color secundario #818cf8
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const evenRowStyle = {
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFFFFFF" },
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const oddRowStyle = {
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFF3F4F6" },
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const totalRowStyle = {
      font: { bold: true, size: 12, color: { argb: "FF4B1CE1" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFEDF2F7" },
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "medium", color: { argb: "FF4B1CE1" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const currencyStyle = {
      numFmt: '"$"#,##0.00',
      alignment: { horizontal: "right", vertical: "middle" },
      font: { color: { argb: "FF1A202C" } },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const percentageStyle = {
      numFmt: "0.00%",
      alignment: { horizontal: "right", vertical: "middle" },
      font: { color: { argb: "FF1A202C" } },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const positiveValueStyle = {
      numFmt: '"$"#,##0.00',
      alignment: { horizontal: "right", vertical: "middle" },
      font: { color: { argb: "FF047857" } },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const negativeValueStyle = {
      numFmt: '"$"#,##0.00',
      alignment: { horizontal: "right", vertical: "middle" },
      font: { color: { argb: "FFDC2626" } },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    // ========================
    // Funciones auxiliares para aplicar estilos en un rango
    // ========================
    function decodeCell(cellRef: string) {
      const match = cellRef.match(/([A-Z]+)([0-9]+)/);
      if (!match) return null;
      const colLetters = match[1];
      const row = parseInt(match[2], 10);
      let col = 0;
      for (let i = 0; i < colLetters.length; i++) {
        col = col * 26 + (colLetters.charCodeAt(i) - 64);
      }
      return { row, col };
    }

    function applyStyles(
      worksheet: ExcelJS.Worksheet,
      range: string,
      style: any
    ) {
      const [start, end] = range.split(":");
      const startCell = decodeCell(start);
      const endCell = decodeCell(end);
      if (!startCell || !endCell) return;
      for (let r = startCell.row; r <= endCell.row; r++) {
        for (let c = startCell.col; c <= endCell.col; c++) {
          const cell = worksheet.getCell(r, c);
          if (style.font) cell.font = style.font;
          if (style.alignment) cell.alignment = style.alignment;
          if (style.fill) cell.fill = style.fill;
          if (style.border) cell.border = style.border;
          if (style.numFmt) cell.numFmt = style.numFmt;
        }
      }
    }

    function applyConditionalStyles(
      worksheet: ExcelJS.Worksheet,
      range: string,
      formatter: (cellValue: any) => any
    ) {
      const [start, end] = range.split(":");
      const startCell = decodeCell(start);
      const endCell = decodeCell(end);
      if (!startCell || !endCell) return;
      for (let r = startCell.row; r <= endCell.row; r++) {
        for (let c = startCell.col; c <= endCell.col; c++) {
          const cell = worksheet.getCell(r, c);
          const style = formatter(cell.value);
          if (style) {
            if (style.font) cell.font = style.font;
            if (style.alignment) cell.alignment = style.alignment;
            if (style.fill) cell.fill = style.fill;
            if (style.border) cell.border = style.border;
            if (style.numFmt) cell.numFmt = style.numFmt;
          }
        }
      }
    }

    function applyAlternatingRowStyles(
      worksheet: ExcelJS.Worksheet,
      startRow: number,
      endRow: number,
      cols: string
    ) {
      let columns: number[] = [];
      if (cols.includes("-")) {
        const [startColLetter, endColLetter] = cols.split("-");
        const startCol = decodeCell(startColLetter + "1")!.col;
        const endCol = decodeCell(endColLetter + "1")!.col;
        for (let c = startCol; c <= endCol; c++) {
          columns.push(c);
        }
      } else {
        for (let i = 0; i < cols.length; i++) {
          const letter = cols[i];
          const colNum = decodeCell(letter + "1")!.col;
          columns.push(colNum);
        }
      }
      for (let r = startRow; r <= endRow; r++) {
        // Se considera la primera fila de datos (startRow) como impar para aplicar el sombreado
        const isOdd = (r - startRow) % 2 === 0;
        const rowStyle = isOdd ? oddRowStyle : evenRowStyle;
        columns.forEach((col) => {
          const cell = worksheet.getCell(r, col);
          if (rowStyle.fill) cell.fill = rowStyle.fill;
        });
      }
    }

    // ========================
    // Hoja de Información General
    // ========================
    const generalInfo = [
      ["Información General"],
      ["Fecha", new Date().toLocaleString()],
      ["Año", year],
    ];

    if (!concept) {
      let computedTotalIncome = 0;
      monthlyStats.forEach((stat) => {
        computedTotalIncome += stat.paid + stat.creditUsed + stat.saldo;
      });
      const financialAccountsMap =
        usePaymentSummaryStore.getState().financialAccountsMap;
      let totalInitialBalance = 0;
      for (const key in financialAccountsMap) {
        totalInitialBalance += financialAccountsMap[key].initialBalance;
      }
      computedTotalIncome += totalInitialBalance;

      // Calcular el saldo total
      let totalBalance = 0;
      monthlyStats.forEach((stat) => {
        const totalCharges = stat.charges;
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const totalCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );
        const totalCredit = totalCreditBalance - totalCreditUsed;
        const totalPaidWithCredit =
          totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;

        // Acumular el saldo de cada mes
        totalBalance += totalCharges - totalPaidWithCredit;
      });

      generalInfo.push(
        ["Total Ingresos", formatCurrency(computedTotalIncome)],
        ["Saldo", formatCurrency(totalBalance)],
        [
          "Mes con mayor ingresos",
          computedTotalIncome ? monthNames[monthlyStats[0].month] : "",
        ],
        [
          "Mes con menor ingresos",
          computedTotalIncome ? monthNames[monthlyStats[0].month] : "",
        ]
      );
    }

    const generalSheet = workbook.addWorksheet("Información General");
    generalSheet.addRows(generalInfo);

    // Unir celdas del título para centrarlo en toda la tabla
    generalSheet.mergeCells("A1:B1");

    applyStyles(generalSheet, "A1:B1", titleStyle);

    // Crear estilo para etiquetas y valores en negro (no indigo)
    const labelStyle = {
      font: { bold: true, size: 12, color: { argb: "FF000000" } }, // Color negro
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const valueStyle = {
      font: { size: 12, color: { argb: "FF000000" } }, // Color negro
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    applyStyles(generalSheet, "A2:A5", labelStyle);
    applyStyles(generalSheet, "B2:B5", valueStyle);
    if (!concept) {
      applyStyles(
        generalSheet,
        "B4:B5",
        Object.assign({}, valueStyle, { numFmt: '"$"#,##0.00' })
      );
    }

    generalSheet.columns = [{ width: 30 }, { width: 40 }];
    generalSheet.getRow(1).height = 35;

    // ========================
    // Reporte Individual por Concepto (cuando se pasa un concepto)
    // ========================
    if (concept && computedConceptData) {
      const monthKeys = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];
      let totalPaid = 0,
        totalPendingConcept = 0,
        totalCredit = 0;
      let globalTotalRecords = 0,
        globalPaidRecords = 0;

      const conceptData = monthKeys.map((m) => {
        const recsForMonth = computedConceptData.filter((rec) => {
          let recMonth = rec.month;
          if (recMonth.includes("-")) {
            recMonth = recMonth.split("-")[1];
          }
          return recMonth === m;
        });

        const monthPaid = recsForMonth.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const monthCreditUsed = recsForMonth.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const monthCreditBalance = recsForMonth.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        const paid =
          monthPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          monthCreditUsed;
        const pending = recsForMonth.reduce(
          (sum, rec) => sum + rec.amountPending,
          0
        );
        const credit = monthCreditBalance - monthCreditUsed;

        totalPaid += paid;
        totalPendingConcept += pending;
        totalCredit += credit;
        const totalRecords = recsForMonth.length;
        const paidCount = recsForMonth.filter((r) => r.paid).length;
        globalTotalRecords += totalRecords;
        globalPaidRecords += paidCount;
        const compliance =
          totalRecords > 0 ? (paidCount / totalRecords) * 100 : 0;
        const delinquency = 100 - compliance;

        return [
          monthNames[m] || m,
          formatCurrency(paid),
          formatCurrency(pending),
          formatCurrency(credit),
          compliance.toFixed(2) + "%",
          delinquency.toFixed(2) + "%",
        ];
      });

      conceptData.push([
        "Total",
        formatCurrency(totalPaid),
        formatCurrency(totalPendingConcept),
        formatCurrency(totalCredit),
        globalTotalRecords > 0
          ? ((globalPaidRecords / globalTotalRecords) * 100).toFixed(2) + "%"
          : "0.00%",
        globalTotalRecords > 0
          ? (100 - (globalPaidRecords / globalTotalRecords) * 100).toFixed(2) +
            "%"
          : "0.00%",
      ]);

      const conceptSheet = workbook.addWorksheet(`Concepto ${concept}`);
      conceptSheet.addRow([`Reporte por Concepto: ${concept}`]);
      conceptSheet.addRow([
        "Mes",
        "Monto Abonado",
        "Monto Pendiente",
        "Saldo a favor",
        "% Cumplimiento",
        "% Morosidad",
      ]);
      conceptData.forEach((row) => conceptSheet.addRow(row));

      applyStyles(conceptSheet, "A1:F1", titleStyle);
      // Unir celdas del título para centrarlo en toda la tabla
      conceptSheet.mergeCells("A1:F1");
      applyStyles(conceptSheet, "A2:F2", headerStyle);
      applyStyles(
        conceptSheet,
        `A${conceptData.length + 3}:F${conceptData.length + 3}`,
        totalRowStyle
      );
      applyAlternatingRowStyles(
        conceptSheet,
        3,
        conceptData.length + 2,
        "ABCDEF"
      );
      applyStyles(conceptSheet, `B3:B${conceptData.length + 3}`, currencyStyle);
      applyStyles(conceptSheet, `C3:C${conceptData.length + 3}`, currencyStyle);
      applyStyles(conceptSheet, `D3:D${conceptData.length + 3}`, currencyStyle);
      applyStyles(
        conceptSheet,
        `E3:E${conceptData.length + 3}`,
        percentageStyle
      );
      applyStyles(
        conceptSheet,
        `F3:F${conceptData.length + 3}`,
        percentageStyle
      );
      applyConditionalStyles(
        conceptSheet,
        `D3:D${conceptData.length + 3}`,
        (value) => (value > 0 ? positiveValueStyle : currencyStyle)
      );
      applyConditionalStyles(
        conceptSheet,
        `C3:C${conceptData.length + 3}`,
        (value) => (value > 0 ? negativeValueStyle : currencyStyle)
      );
      conceptSheet.columns = [
        { width: 20 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
      ];
      conceptSheet.getRow(1).height = 35;
      conceptSheet.getRow(2).height = 30;

      // Detalle por condomino
      const sortedCondominiums = [...allCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );

      sortedCondominiums.forEach((cond) => {
        const condDataFull = detailed[cond.number] || [];
        const condData = condDataFull.filter(
          (item) => item.concept === concept
        );
        const monthKeys = [
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
          "12",
        ];
        let totalPaidCond = 0,
          totalPendingCond = 0,
          totalCreditCond = 0;

        const condRows = monthKeys.map((m) => {
          const recordsForMonth = condData.filter((item) => {
            let recMonth = item.month;
            if (recMonth.includes("-")) {
              recMonth = recMonth.split("-")[1];
            }
            return recMonth === m;
          });

          const monthPaid = recordsForMonth.reduce(
            (sum, r) => sum + r.amountPaid,
            0
          );
          const monthCreditUsed = recordsForMonth.reduce(
            (sum, r) => sum + (r.creditUsed || 0),
            0
          );
          const monthCreditBalance = recordsForMonth.reduce(
            (sum, r) => sum + r.creditBalance,
            0
          );

          const amountPaid =
            monthPaid +
            monthCreditUsed +
            (monthCreditBalance - monthCreditUsed);
          const amountPending = recordsForMonth.reduce(
            (sum, r) => sum + r.amountPending,
            0
          );
          const credit = monthCreditBalance - monthCreditUsed;

          totalPaidCond += amountPaid;
          totalPendingCond += amountPending;
          totalCreditCond += credit;

          return [
            monthNames[m],
            formatCurrency(amountPaid),
            formatCurrency(amountPending),
            formatCurrency(credit),
          ];
        });

        condRows.push([
          "Total",
          formatCurrency(totalPaidCond),
          formatCurrency(totalPendingCond),
          formatCurrency(totalCreditCond),
        ]);

        const condSheet = workbook.addWorksheet(`Condomino ${cond.number}`);
        condSheet.addRow([
          `Detalle del Condomino: ${cond.number}${
            cond.name ? " - " + cond.name : ""
          }`,
        ]);
        condSheet.addRow([
          "Mes",
          "Monto Abonado",
          "Monto Pendiente",
          "Saldo a favor",
        ]);
        condRows.forEach((row) => condSheet.addRow(row));

        applyStyles(condSheet, "A1:D1", titleStyle);
        // Unir celdas del título para centrarlo en toda la tabla
        condSheet.mergeCells("A1:D1");
        applyStyles(condSheet, "A2:D2", headerStyle);
        applyStyles(
          condSheet,
          `A${condRows.length + 3}:D${condRows.length + 3}`,
          totalRowStyle
        );
        applyAlternatingRowStyles(condSheet, 3, condRows.length + 2, "ABCD");
        applyStyles(condSheet, `B3:B${condRows.length + 3}`, currencyStyle);
        applyStyles(condSheet, `C3:C${condRows.length + 3}`, currencyStyle);
        applyStyles(condSheet, `D3:D${condRows.length + 3}`, currencyStyle);
        applyConditionalStyles(
          condSheet,
          `D3:D${condRows.length + 3}`,
          (value) => (value > 0 ? positiveValueStyle : currencyStyle)
        );
        applyConditionalStyles(
          condSheet,
          `C3:C${condRows.length + 3}`,
          (value) => (value > 0 ? negativeValueStyle : currencyStyle)
        );
        condSheet.columns = [
          { width: 20 },
          { width: 25 },
          { width: 25 },
          { width: 25 },
        ];
        condSheet.getRow(1).height = 35;
        condSheet.getRow(2).height = 30;
      });
    } else {
      // ========================
      // Reporte General (cuando no se pasa concepto)
      // ========================
      const compRows = monthlyStats.map((stat) => {
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);

        const totalCharges = stat.charges;
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const totalCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );
        const totalCredit = totalCreditBalance - totalCreditUsed;
        const totalPaidWithCredit =
          totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;
        const balance = totalCharges - totalPaidWithCredit;

        return [
          monthNames[stat.month] || stat.month,
          formatCurrency(totalPaidWithCredit),
          formatCurrency(totalCharges),
          formatCurrency(balance),
          formatCurrency(stat.unidentifiedPayments),
          stat.complianceRate.toFixed(2) + "%",
          stat.delinquencyRate.toFixed(2) + "%",
        ];
      });

      let totalPaidGlobal = 0,
        totalChargesGlobal = 0,
        totalBalanceGlobal = 0,
        totalUnidentifiedGlobal = 0;

      monthlyStats.forEach((stat) => {
        const totalCharges = stat.charges;
        const monthRecords = Object.values(detailed)
          .flat()
          .filter((rec) => rec.month === stat.month);
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const totalCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );
        const totalCredit = totalCreditBalance - totalCreditUsed;
        const totalPaidWithCredit =
          totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;
        const balance = totalCharges - totalPaidWithCredit;

        totalPaidGlobal += totalPaidWithCredit;
        totalChargesGlobal += totalCharges;
        totalBalanceGlobal += balance;
        totalUnidentifiedGlobal += stat.unidentifiedPayments;
      });

      const financialAccountsMap =
        usePaymentSummaryStore.getState().financialAccountsMap;
      let totalInitialBalance = 0;
      for (const key in financialAccountsMap) {
        totalInitialBalance += financialAccountsMap[key].initialBalance;
      }
      totalPaidGlobal += totalInitialBalance;

      const avgCompliance =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.complianceRate, 0) /
            monthlyStats.length
          : 0;
      const avgDelinquency =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, stat) => sum + stat.delinquencyRate, 0) /
            monthlyStats.length
          : 0;

      compRows.push([
        "Total",
        formatCurrency(totalPaidGlobal),
        formatCurrency(totalChargesGlobal),
        formatCurrency(totalBalanceGlobal),
        formatCurrency(totalUnidentifiedGlobal),
        avgCompliance.toFixed(2) + "%",
        avgDelinquency.toFixed(2) + "%",
      ]);

      const generalReportSheet = workbook.addWorksheet("Reporte General");
      generalReportSheet.addRow(["Reporte General de Ingresos"]);
      generalReportSheet.addRow([
        "Mes",
        "Monto Abonado",
        "Cargos",
        "Saldo",
        "Pagos no identificados",
        "% Cumplimiento",
        "% Morosidad",
      ]);
      compRows.forEach((row) => generalReportSheet.addRow(row));

      applyStyles(generalReportSheet, "A1:G1", titleStyle);
      // Unir celdas del título para centrarlo en toda la tabla
      generalReportSheet.mergeCells("A1:G1");
      applyStyles(generalReportSheet, "A2:G2", headerStyle);
      applyStyles(
        generalReportSheet,
        `A${compRows.length + 3}:G${compRows.length + 3}`,
        totalRowStyle
      );
      applyAlternatingRowStyles(
        generalReportSheet,
        3,
        compRows.length + 2,
        "ABCDEFG"
      );
      applyStyles(
        generalReportSheet,
        `B3:B${compRows.length + 3}`,
        currencyStyle
      );
      applyStyles(
        generalReportSheet,
        `C3:C${compRows.length + 3}`,
        currencyStyle
      );
      applyStyles(
        generalReportSheet,
        `D3:D${compRows.length + 3}`,
        currencyStyle
      );
      applyStyles(
        generalReportSheet,
        `E3:E${compRows.length + 3}`,
        currencyStyle
      );
      applyStyles(
        generalReportSheet,
        `F3:F${compRows.length + 3}`,
        percentageStyle
      );
      applyStyles(
        generalReportSheet,
        `G3:G${compRows.length + 3}`,
        percentageStyle
      );
      applyConditionalStyles(
        generalReportSheet,
        `B3:B${compRows.length + 3}`,
        (value) => (value > 0 ? positiveValueStyle : currencyStyle)
      );
      applyConditionalStyles(
        generalReportSheet,
        `D3:D${compRows.length + 3}`,
        (value) => (value > 0 ? negativeValueStyle : currencyStyle)
      );
      generalReportSheet.columns = [
        { width: 20 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 30 },
        { width: 25 },
        { width: 25 },
      ];
      generalReportSheet.getRow(1).height = 35;
      generalReportSheet.getRow(2).height = 30;

      // ========================
      // Reportes por concepto (para cada entrada en conceptRecords)
      // Se generan hojas adicionales por cada concepto registrado
      // ========================
      if (conceptRecords && Object.keys(conceptRecords).length > 0) {
        Object.entries(conceptRecords).forEach(([conceptKey, recs]) => {
          const monthKeys = [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
          ];
          let totalPaidConcept = 0,
            totalPendingConcept = 0,
            totalCreditConcept = 0;
          let globalTotalRecords = 0,
            globalPaidRecords = 0;

          const conceptRows = monthKeys.map((m) => {
            const recordsForMonth = recs.filter((r) => r.month === m);
            const monthPaid = recordsForMonth.reduce(
              (sum, r) => sum + r.amountPaid,
              0
            );
            const monthCreditUsed = recordsForMonth.reduce(
              (sum, r) => sum + (r.creditUsed || 0),
              0
            );
            const monthCreditBalance = recordsForMonth.reduce(
              (sum, r) => sum + r.creditBalance,
              0
            );
            const totalCharges = recordsForMonth.reduce(
              (sum, r) => sum + r.referenceAmount,
              0
            );

            const paid =
              monthPaid +
              (monthCreditBalance > 0 ? monthCreditBalance : 0) -
              monthCreditUsed;
            const pending = recordsForMonth.reduce(
              (sum, r) => sum + r.amountPending,
              0
            );
            const credit = monthCreditBalance - monthCreditUsed;

            totalPaidConcept += paid;
            totalPendingConcept += pending;
            totalCreditConcept += credit;
            const totalRecords = recordsForMonth.length;
            const paidCount = recordsForMonth.filter((r) => r.paid).length;
            globalTotalRecords += totalRecords;
            globalPaidRecords += paidCount;
            const compliance =
              totalRecords > 0 ? (paidCount / totalRecords) * 100 : 0;
            const delinquency = 100 - compliance;

            return [
              monthNames[m] || m,
              formatCurrency(paid),
              formatCurrency(totalCharges),
              formatCurrency(totalCharges - paid),
              compliance.toFixed(2) + "%",
              delinquency.toFixed(2) + "%",
            ];
          });

          const totalCompliance =
            globalTotalRecords > 0
              ? (globalPaidRecords / globalTotalRecords) * 100
              : 0;
          const totalDelinquency = 100 - totalCompliance;

          conceptRows.push([
            "Total",
            formatCurrency(totalPaidConcept),
            formatCurrency(totalPendingConcept),
            formatCurrency(totalPendingConcept - totalPaidConcept),
            globalTotalRecords > 0 ? totalCompliance.toFixed(2) + "%" : "0.00%",
            globalTotalRecords > 0
              ? totalDelinquency.toFixed(2) + "%"
              : "0.00%",
          ]);

          const conceptSheet = workbook.addWorksheet(`Concepto ${conceptKey}`);
          conceptSheet.addRow([`Reporte por Concepto: ${conceptKey}`]);
          conceptSheet.addRow([
            "Mes",
            "Monto Abonado",
            "Cargos",
            "Saldo",
            "% Cumplimiento",
            "% Morosidad",
          ]);
          conceptRows.forEach((row) => conceptSheet.addRow(row));

          applyStyles(conceptSheet, "A1:F1", titleStyle);
          // Unir celdas del título para centrarlo en toda la tabla
          conceptSheet.mergeCells("A1:F1");
          applyStyles(conceptSheet, "A2:F2", headerStyle);
          applyStyles(
            conceptSheet,
            `A${conceptRows.length + 3}:F${conceptRows.length + 3}`,
            totalRowStyle
          );
          applyAlternatingRowStyles(
            conceptSheet,
            3,
            conceptRows.length + 2,
            "ABCDEF"
          );
          applyStyles(
            conceptSheet,
            `B3:B${conceptRows.length + 3}`,
            currencyStyle
          );
          applyStyles(
            conceptSheet,
            `C3:C${conceptRows.length + 3}`,
            currencyStyle
          );
          applyStyles(
            conceptSheet,
            `D3:D${conceptRows.length + 3}`,
            currencyStyle
          );
          applyStyles(
            conceptSheet,
            `E3:E${conceptRows.length + 3}`,
            percentageStyle
          );
          applyStyles(
            conceptSheet,
            `F3:F${conceptRows.length + 3}`,
            percentageStyle
          );
          applyConditionalStyles(
            conceptSheet,
            `B3:B${conceptRows.length + 3}`,
            (value) => (value > 0 ? positiveValueStyle : currencyStyle)
          );
          applyConditionalStyles(
            conceptSheet,
            `D3:D${conceptRows.length + 3}`,
            (value) => (value > 0 ? negativeValueStyle : currencyStyle)
          );
          conceptSheet.columns = [
            { width: 20 },
            { width: 25 },
            { width: 25 },
            { width: 25 },
            { width: 25 },
            { width: 25 },
          ];
          conceptSheet.getRow(1).height = 35;
          conceptSheet.getRow(2).height = 30;
        });
      }
    }

    // NOTA: Se eliminó la hoja "Administradora" según lo solicitado.

    // ========================
    // Guardar el archivo
    // ========================
    const buffer = await workbook.xlsx.writeBuffer();
    if (concept) {
      saveAs(new Blob([buffer]), `reporte_ingresos_${year}_${concept}.xlsx`);
    } else {
      saveAs(new Blob([buffer]), `reporte_ingresos_${year}.xlsx`);
    }
  };

  return renderButton ? (
    renderButton(generateExcel)
  ) : (
    <div className="flex">
      <button
        onClick={generateExcel}
        className="bg-green-600 text-white text-sm py-2 px-3 rounded font-medium hover:bg-green-700"
      >
        {concept ? `Exportar Excel para ${concept}` : "Exportar Excel General"}
      </button>
    </div>
  );
};

export default ExcelReportGenerator;
