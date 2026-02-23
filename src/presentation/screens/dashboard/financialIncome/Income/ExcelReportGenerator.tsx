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

const ExcelReportGenerator: React.FC<ExcelReportGeneratorProps> = ({
  year,
  concept,
  renderButton,
}) => {
  // Obtener datos del store
  const {
    payments,
    monthlyStats,
    detailed,
    conceptRecords,
    totalInitialBalance,
    byFinancialAccount,
    financialAccountsMap,
  } = usePaymentSummaryStore(
    (state) => ({
      payments: state.payments,
      totalPending: state.totalPending,
      monthlyStats: state.monthlyStats,
      detailed: state.detailed,
      adminCompany: state.adminCompany,
      adminPhone: state.adminPhone,
      adminEmail: state.adminEmail,
      conceptRecords: state.conceptRecords,
      totalInitialBalance: state.totalInitialBalance,
      byFinancialAccount: state.byFinancialAccount,
      financialAccountsMap: state.financialAccountsMap,
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
    const allRecords = Object.values(detailed).flat();

    // Métricas canónicas alineadas con PaymentSummary (monto abonado con saldo a favor aplicado/generado)
    const totalCharges = payments.reduce(
      (acc, payment) => acc + payment.referenceAmount,
      0
    );
    const totalPaid = payments.reduce((acc, payment) => acc + payment.amountPaid, 0);
    const totalCreditUsed = payments.reduce(
      (acc, payment) => acc + (payment.creditUsed || 0),
      0
    );
    const totalCreditBalance = payments.reduce(
      (acc, payment) => acc + payment.creditBalance,
      0
    );
    const canonicalIncome =
      totalPaid +
      (totalCreditBalance > 0 ? totalCreditBalance : 0) -
      totalCreditUsed;
    const canonicalBalance = totalCharges - canonicalIncome;
    const unidentifiedPaymentsTotal = monthlyStats.reduce(
      (acc, stat) => acc + stat.unidentifiedPayments,
      0
    );

    const monthlyIncomeByMonth = monthKeys.map((month) => {
      const monthRecords = allRecords.filter((rec) => rec.month === month);
      const monthPaid = monthRecords.reduce((sum, rec) => sum + rec.amountPaid, 0);
      const monthCreditUsed = monthRecords.reduce(
        (sum, rec) => sum + (rec.creditUsed || 0),
        0
      );
      const monthCreditBalance = monthRecords.reduce(
        (sum, rec) => sum + rec.creditBalance,
        0
      );
      const income =
        monthPaid +
        (monthCreditBalance > 0 ? monthCreditBalance : 0) -
        monthCreditUsed;
      return {
        month,
        income,
      };
    });

    const monthsWithIncome = monthlyIncomeByMonth.filter(
      (monthData) => monthData.income > 0
    );
    const monthWithMostIncome = [...monthsWithIncome].sort(
      (a, b) => b.income - a.income
    )[0];
    const monthWithLeastIncome = [...monthsWithIncome].sort(
      (a, b) => a.income - b.income
    )[0];

    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const previousMonth = String(
      currentMonth === "01" ? 12 : Number(currentMonth) - 1
    ).padStart(2, "0");
    const currentMonthIncome =
      monthlyIncomeByMonth.find((m) => m.month === currentMonth)?.income || 0;
    const previousMonthIncome =
      monthlyIncomeByMonth.find((m) => m.month === previousMonth)?.income || 0;
    const incomeVariationAmount = currentMonthIncome - previousMonthIncome;
    const incomeVariationPercent =
      previousMonthIncome > 0
        ? (incomeVariationAmount / previousMonthIncome) * 100
        : currentMonthIncome > 0
        ? 100
        : 0;

    const collectionRateByAmount =
      totalCharges > 0 ? (canonicalIncome / totalCharges) * 100 : 0;
    const delinquencyRateByAmount =
      totalCharges > 0 ? (Math.max(canonicalBalance, 0) / totalCharges) * 100 : 0;

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

    const riskHighStyle = {
      font: { bold: true, color: { argb: "FFB91C1C" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFEE2E2" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const riskMediumStyle = {
      font: { bold: true, color: { argb: "FFB45309" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFEF3C7" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const riskLowStyle = {
      font: { bold: true, color: { argb: "FF047857" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFD1FAE5" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const labelStyle = {
      font: { bold: true, size: 12, color: { argb: "FF000000" } },
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const valueStyle = {
      font: { size: 12, color: { argb: "FF000000" } },
      alignment: { horizontal: "left", vertical: "middle" },
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
    // Hoja Resumen Ejecutivo (solo reporte general)
    // ========================
    if (!concept) {
      const executiveSheet = workbook.addWorksheet("Resumen Ejecutivo");
      executiveSheet.addRow(["Resumen Ejecutivo de Ingresos"]);
      executiveSheet.addRow(["Fecha de generación", new Date().toLocaleString()]);
      executiveSheet.addRow(["Año de referencia", year || "Todos los años"]);
      executiveSheet.addRow([]);
      executiveSheet.addRow([
        "Indicador",
        "Valor",
        "Objetivo",
        "Estado",
        "Comentario",
      ]);

      const collectionStatus =
        collectionRateByAmount >= 85
          ? "Saludable"
          : collectionRateByAmount >= 70
          ? "En seguimiento"
          : "Atención inmediata";
      const delinquencyStatus =
        delinquencyRateByAmount <= 15
          ? "Saludable"
          : delinquencyRateByAmount <= 25
          ? "En seguimiento"
          : "Atención inmediata";
      const unidentifiedStatus =
        unidentifiedPaymentsTotal === 0
          ? "Saludable"
          : unidentifiedPaymentsTotal < 1000
          ? "En seguimiento"
          : "Atención inmediata";
      const variationStatus =
        incomeVariationAmount >= 0 ? "Saludable" : "En seguimiento";

      const execRows = [
        {
          metric: "Ingresos del período",
          value: canonicalIncome,
          valueType: "currency" as const,
          target: "N/A",
          status: "Saludable",
          comment: "Monto abonado neto (incluye saldo a favor aplicado/generado).",
        },
        {
          metric: "Cargos generados",
          value: totalCharges,
          valueType: "currency" as const,
          target: "N/A",
          status: "Saludable",
          comment: "Suma de cargos del período según referencia.",
        },
        {
          metric: "Saldo pendiente",
          value: canonicalBalance,
          valueType: "currency" as const,
          target: "<= 15% de cargos",
          status: delinquencyStatus,
          comment: "Diferencia entre cargos y monto abonado neto.",
        },
        {
          metric: "Cobranza por monto",
          value: collectionRateByAmount / 100,
          valueType: "percent" as const,
          target: ">= 85%",
          status: collectionStatus,
          comment: "Ingresos del período dividido entre cargos generados.",
        },
        {
          metric: "Morosidad por monto",
          value: delinquencyRateByAmount / 100,
          valueType: "percent" as const,
          target: "<= 15%",
          status: delinquencyStatus,
          comment: "Saldo pendiente entre cargos generados.",
        },
        {
          metric: "Pagos no identificados",
          value: unidentifiedPaymentsTotal,
          valueType: "currency" as const,
          target: "0.00",
          status: unidentifiedStatus,
          comment: "Pagos pendientes de aplicar a un condómino/cargo.",
        },
        {
          metric: "Variación vs mes anterior",
          value: incomeVariationAmount,
          valueType: "currency" as const,
          target: "Tendencia >= 0",
          status: variationStatus,
          comment: `${incomeVariationPercent.toFixed(2)}% vs ${monthNames[previousMonth]}`,
        },
      ];

      execRows.forEach((row) => {
        const newRow = executiveSheet.addRow([
          row.metric,
          row.value,
          row.target,
          row.status,
          row.comment,
        ]);

        const valueCell = newRow.getCell(2);
        if (row.valueType === "currency") {
          valueCell.numFmt = '"$"#,##0.00';
          valueCell.alignment = { horizontal: "right", vertical: "middle" };
        } else {
          valueCell.numFmt = "0.00%";
          valueCell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });

      const alerts: string[] = [];
      if (collectionRateByAmount < 85) {
        alerts.push(
          `Cobranza por monto en ${collectionRateByAmount.toFixed(
            2
          )}%. Revisar cuentas con mayor adeudo.`
        );
      }
      if (delinquencyRateByAmount > 15) {
        alerts.push(
          `Morosidad por monto en ${delinquencyRateByAmount.toFixed(
            2
          )}%. Activar plan de cobranza.`
        );
      }
      if (unidentifiedPaymentsTotal > 0) {
        alerts.push(
          `Existen pagos no identificados por ${formatCurrency(
            unidentifiedPaymentsTotal
          )}. Conciliar para no subestimar cobranza.`
        );
      }
      if (alerts.length === 0) {
        alerts.push("Sin alertas críticas en el período analizado.");
      }

      executiveSheet.addRow([]);
      executiveSheet.addRow(["Alertas accionables"]);
      alerts.forEach((alert) => {
        const alertRow = executiveSheet.addRow([alert]);
        executiveSheet.mergeCells(`A${alertRow.number}:E${alertRow.number}`);
      });

      executiveSheet.mergeCells("A1:E1");
      applyStyles(executiveSheet, "A1:E1", titleStyle);
      applyStyles(executiveSheet, "A5:E5", headerStyle);
      applyAlternatingRowStyles(executiveSheet, 6, 12, "ABCDE");
      applyStyles(executiveSheet, "A2:A3", labelStyle);
      applyStyles(executiveSheet, "B2:B3", valueStyle);

      for (let row = 6; row <= 12; row++) {
        const statusValue = String(executiveSheet.getCell(`D${row}`).value || "");
        if (statusValue === "Atención inmediata") {
          applyStyles(executiveSheet, `D${row}:D${row}`, riskHighStyle);
        } else if (statusValue === "En seguimiento") {
          applyStyles(executiveSheet, `D${row}:D${row}`, riskMediumStyle);
        } else {
          applyStyles(executiveSheet, `D${row}:D${row}`, riskLowStyle);
        }
      }

      const alertsStartRow = 14;
      applyStyles(executiveSheet, `A${alertsStartRow}:E${alertsStartRow}`, headerStyle);
      for (let row = alertsStartRow + 1; row <= alertsStartRow + alerts.length; row++) {
        applyStyles(executiveSheet, `A${row}:E${row}`, valueStyle);
      }

      executiveSheet.columns = [
        { width: 30 },
        { width: 20 },
        { width: 22 },
        { width: 20 },
        { width: 60 },
      ];
      executiveSheet.getRow(1).height = 35;
      executiveSheet.getRow(5).height = 30;
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
      const ingresosPeriodo = canonicalIncome;
      const saldoInicial = totalInitialBalance;
      const disponibleBruto = ingresosPeriodo + saldoInicial;

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
        ["Ingresos del período", formatCurrency(ingresosPeriodo)],
        ["Saldo inicial", formatCurrency(saldoInicial)],
        ["Disponible total (bruto)", formatCurrency(disponibleBruto)],
        ["Saldo", formatCurrency(canonicalBalance)],
        [
          "Mes con mayor ingresos",
          monthWithMostIncome && monthWithMostIncome.income > 0
            ? monthNames[monthWithMostIncome.month] || monthWithMostIncome.month
            : "",
        ],
        [
          "Mes con menor ingresos",
          monthWithLeastIncome && monthWithLeastIncome.income > 0
            ? monthNames[monthWithLeastIncome.month] || monthWithLeastIncome.month
            : "",
        ]
      );
    }

    const generalSheet = workbook.addWorksheet("Información General");
    generalSheet.addRows(generalInfo);

    // Unir celdas del título para centrarlo en toda la tabla
    generalSheet.mergeCells("A1:B1");

    applyStyles(generalSheet, "A1:B1", titleStyle);

    applyStyles(generalSheet, `A2:A${generalInfo.length}`, labelStyle);
    applyStyles(generalSheet, `B2:B${generalInfo.length}`, valueStyle);
    if (!concept) {
      applyStyles(
        generalSheet,
        "B4:B7",
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
        const monthRecords = allRecords
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
        const monthPaidInFull = monthRecords
          .filter((rec) => rec.amountPending === 0)
          .reduce((sum, rec) => sum + rec.referenceAmount, 0);
        const monthComplianceRate =
          totalCharges > 0 ? (monthPaidInFull / totalCharges) * 100 : 0;
        const monthDelinquencyRate = 100 - monthComplianceRate;

        return [
          monthNames[stat.month] || stat.month,
          formatCurrency(totalPaidWithCredit),
          formatCurrency(totalCharges),
          formatCurrency(balance),
          formatCurrency(stat.unidentifiedPayments),
          monthComplianceRate.toFixed(2) + "%",
          monthDelinquencyRate.toFixed(2) + "%",
        ];
      });

      let totalPaidGlobal = 0,
        totalChargesGlobal = 0,
        totalBalanceGlobal = 0,
        totalUnidentifiedGlobal = 0;

      monthlyStats.forEach((stat) => {
        const totalCharges = stat.charges;
        const monthRecords = allRecords
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

      const globalPaidInFull = allRecords
        .filter((rec) => rec.amountPending === 0)
        .reduce((sum, rec) => sum + rec.referenceAmount, 0);
      const avgCompliance =
        totalChargesGlobal > 0
          ? (globalPaidInFull / totalChargesGlobal) * 100
          : 0;
      const avgDelinquency = 100 - avgCompliance;

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
      // Bloque 2: Hojas operativas
      // ========================

      // 1) Cartera por antigüedad (aproximada por mes de cargo)
      const now = new Date();
      const reportYear = Number(year) || now.getFullYear();
      const pendingChargeRecords = allRecords.filter(
        (record) =>
          record.amountPending > 0 && record.concept !== "Pago no identificado"
      );

      const agingBuckets = [
        { name: "0-30 días", min: 0, max: 30, total: 0 },
        { name: "31-60 días", min: 31, max: 60, total: 0 },
        { name: "61-90 días", min: 61, max: 90, total: 0 },
        { name: "90+ días", min: 91, max: Infinity, total: 0 },
      ];

      pendingChargeRecords.forEach((record) => {
        const monthNumber = Number(record.month || "0");
        if (!monthNumber || monthNumber < 1 || monthNumber > 12) return;

        const dueDate = new Date(reportYear, monthNumber, 0);
        const diffMs = now.getTime() - dueDate.getTime();
        const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        const targetBucket = agingBuckets.find(
          (bucket) => daysOverdue >= bucket.min && daysOverdue <= bucket.max
        );
        if (targetBucket) {
          targetBucket.total += record.amountPending;
        }
      });

      const agingSheet = workbook.addWorksheet("Cartera Antigüedad");
      agingSheet.addRow(["Cartera por Antigüedad"]);
      agingSheet.addRow(["Rango", "Monto pendiente"]);
      agingBuckets.forEach((bucket) => {
        agingSheet.addRow([bucket.name, bucket.total]);
      });
      agingSheet.addRow([
        "Total",
        agingBuckets.reduce((sum, bucket) => sum + bucket.total, 0),
      ]);

      applyStyles(agingSheet, "A1:B1", titleStyle);
      agingSheet.mergeCells("A1:B1");
      applyStyles(agingSheet, "A2:B2", headerStyle);
      applyStyles(
        agingSheet,
        `A${agingBuckets.length + 3}:B${agingBuckets.length + 3}`,
        totalRowStyle
      );
      applyAlternatingRowStyles(agingSheet, 3, agingBuckets.length + 2, "AB");
      applyStyles(agingSheet, `B3:B${agingBuckets.length + 3}`, currencyStyle);
      agingSheet.columns = [{ width: 24 }, { width: 22 }];
      agingSheet.getRow(1).height = 35;
      agingSheet.getRow(2).height = 30;

      // 2) Top 20 adeudos y cumplimiento por cargo
      const chargeProgressRows = allRecords
        .filter(
          (record) =>
            record.referenceAmount > 0 && record.concept !== "Pago no identificado"
        )
        .map((record) => {
          const paidAmount = Math.max(0, record.referenceAmount - record.amountPending);
          const complianceRate =
            record.referenceAmount > 0
              ? Math.min(100, Math.max(0, (paidAmount / record.referenceAmount) * 100))
              : 0;
          return {
            numberCondominium: record.numberCondominium || "N/A",
            concept: record.concept || "Sin concepto",
            month: monthNames[record.month] || record.month || "N/A",
            charges: record.referenceAmount,
            paidAmount,
            pendingAmount: record.amountPending,
            complianceRate,
          };
        });

      const topDebtRows = [...chargeProgressRows]
        .sort((a, b) => b.pendingAmount - a.pendingAmount)
        .slice(0, 20);
      const topComplianceRows = [...chargeProgressRows]
        .sort((a, b) => b.complianceRate - a.complianceRate)
        .slice(0, 20);

      const topDebtSheet = workbook.addWorksheet("Top 20 Adeudos");
      topDebtSheet.addRow(["Top 20 adeudos por cargo"]);
      topDebtSheet.addRow([
        "#",
        "Condómino",
        "Concepto",
        "Mes",
        "Cargos",
        "Abonado",
        "Pendiente",
        "% Cumplimiento",
      ]);
      topDebtRows.forEach((row, index) => {
        topDebtSheet.addRow([
          index + 1,
          row.numberCondominium,
          row.concept,
          row.month,
          row.charges,
          row.paidAmount,
          row.pendingAmount,
          row.complianceRate / 100,
        ]);
      });

      applyStyles(topDebtSheet, "A1:H1", titleStyle);
      topDebtSheet.mergeCells("A1:H1");
      applyStyles(topDebtSheet, "A2:H2", headerStyle);
      if (topDebtRows.length > 0) {
        applyAlternatingRowStyles(topDebtSheet, 3, topDebtRows.length + 2, "A-H");
        applyStyles(topDebtSheet, `E3:G${topDebtRows.length + 2}`, currencyStyle);
        applyStyles(topDebtSheet, `H3:H${topDebtRows.length + 2}`, percentageStyle);
      }
      topDebtSheet.columns = [
        { width: 8 },
        { width: 14 },
        { width: 34 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
      ];
      topDebtSheet.getRow(1).height = 35;
      topDebtSheet.getRow(2).height = 30;

      const topComplianceSheet = workbook.addWorksheet("Top 20 Cumplimiento");
      topComplianceSheet.addRow(["Top 20 cumplimiento por cargo"]);
      topComplianceSheet.addRow([
        "#",
        "Condómino",
        "Concepto",
        "Mes",
        "Cargos",
        "Abonado",
        "Pendiente",
        "% Cumplimiento",
      ]);
      topComplianceRows.forEach((row, index) => {
        topComplianceSheet.addRow([
          index + 1,
          row.numberCondominium,
          row.concept,
          row.month,
          row.charges,
          row.paidAmount,
          row.pendingAmount,
          row.complianceRate / 100,
        ]);
      });

      applyStyles(topComplianceSheet, "A1:H1", titleStyle);
      topComplianceSheet.mergeCells("A1:H1");
      applyStyles(topComplianceSheet, "A2:H2", headerStyle);
      if (topComplianceRows.length > 0) {
        applyAlternatingRowStyles(
          topComplianceSheet,
          3,
          topComplianceRows.length + 2,
          "A-H"
        );
        applyStyles(
          topComplianceSheet,
          `E3:G${topComplianceRows.length + 2}`,
          currencyStyle
        );
        applyStyles(
          topComplianceSheet,
          `H3:H${topComplianceRows.length + 2}`,
          percentageStyle
        );
      }
      topComplianceSheet.columns = [
        { width: 8 },
        { width: 14 },
        { width: 34 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
      ];
      topComplianceSheet.getRow(1).height = 35;
      topComplianceSheet.getRow(2).height = 30;

      // 3) Ingresos por cuenta (incluye saldo a favor generado/usado)
      const accountRows = Object.entries(byFinancialAccount).map(
        ([accountId, accountRecords]) => {
          const paidAmount = accountRecords.reduce(
            (sum, record) => sum + record.amountPaid,
            0
          );
          const creditGenerated = accountRecords.reduce(
            (sum, record) => sum + Math.max(0, record.creditBalance || 0),
            0
          );
          const creditUsed = accountRecords.reduce(
            (sum, record) => sum + (record.creditUsed || 0),
            0
          );
          const netIncome = paidAmount + creditGenerated - creditUsed;
          const initialBalance = financialAccountsMap[accountId]?.initialBalance || 0;

          return {
            accountName: financialAccountsMap[accountId]?.name || "Cuenta sin nombre",
            paidAmount,
            creditGenerated,
            creditUsed,
            netIncome,
            initialBalance,
            analyticalTotal: initialBalance + netIncome,
          };
        }
      );

      const accountSheet = workbook.addWorksheet("Ingresos por Cuenta");
      accountSheet.addRow(["Ingresos por cuenta"]);
      accountSheet.addRow([
        "Cuenta",
        "Ingresos directos",
        "Saldo a favor generado",
        "Saldo a favor aplicado",
        "Ingreso neto",
        "Saldo inicial",
        "Total analítico",
      ]);
      accountRows
        .sort((a, b) => b.netIncome - a.netIncome)
        .forEach((row) => {
          accountSheet.addRow([
            row.accountName,
            row.paidAmount,
            row.creditGenerated,
            row.creditUsed,
            row.netIncome,
            row.initialBalance,
            row.analyticalTotal,
          ]);
        });
      accountSheet.addRow([
        "Total",
        accountRows.reduce((sum, row) => sum + row.paidAmount, 0),
        accountRows.reduce((sum, row) => sum + row.creditGenerated, 0),
        accountRows.reduce((sum, row) => sum + row.creditUsed, 0),
        accountRows.reduce((sum, row) => sum + row.netIncome, 0),
        accountRows.reduce((sum, row) => sum + row.initialBalance, 0),
        accountRows.reduce((sum, row) => sum + row.analyticalTotal, 0),
      ]);

      applyStyles(accountSheet, "A1:G1", titleStyle);
      accountSheet.mergeCells("A1:G1");
      applyStyles(accountSheet, "A2:G2", headerStyle);
      if (accountRows.length > 0) {
        applyAlternatingRowStyles(accountSheet, 3, accountRows.length + 2, "A-G");
        applyStyles(accountSheet, `B3:G${accountRows.length + 2}`, currencyStyle);
      }
      applyStyles(
        accountSheet,
        `A${accountRows.length + 3}:G${accountRows.length + 3}`,
        totalRowStyle
      );
      applyStyles(accountSheet, `B${accountRows.length + 3}:G${accountRows.length + 3}`, currencyStyle);
      accountSheet.columns = [
        { width: 30 },
        { width: 18 },
        { width: 22 },
        { width: 22 },
        { width: 18 },
        { width: 16 },
        { width: 18 },
      ];
      accountSheet.getRow(1).height = 35;
      accountSheet.getRow(2).height = 30;

      // 4) Conciliación (resumen de identificados vs no identificados)
      const unidentifiedRecords = allRecords.filter(
        (record) => record.concept === "Pago no identificado"
      );
      const identifiedRecords = allRecords.filter(
        (record) => record.concept !== "Pago no identificado"
      );
      const identifiedAmount = identifiedRecords.reduce(
        (sum, record) => sum + record.amountPaid,
        0
      );
      const unidentifiedAmount = unidentifiedRecords.reduce(
        (sum, record) => sum + record.amountPaid,
        0
      );
      const totalMovementsAmount = identifiedAmount + unidentifiedAmount;
      const identifiedRate =
        totalMovementsAmount > 0 ? identifiedAmount / totalMovementsAmount : 0;
      const pendingApplyRate =
        totalMovementsAmount > 0 ? unidentifiedAmount / totalMovementsAmount : 0;

      const reconciliationSheet = workbook.addWorksheet("Conciliación");
      reconciliationSheet.addRow(["Resumen de conciliación"]);
      reconciliationSheet.addRow(["Indicador", "Valor", "Detalle"]);
      reconciliationSheet.addRow([
        "Movimientos identificados",
        identifiedAmount,
        `${identifiedRecords.length} registros`,
      ]);
      reconciliationSheet.addRow([
        "Movimientos no identificados",
        unidentifiedAmount,
        `${unidentifiedRecords.length} registros`,
      ]);
      reconciliationSheet.addRow([
        "Tasa identificación",
        identifiedRate,
        "Monto identificado / total movimientos",
      ]);
      reconciliationSheet.addRow([
        "Tasa pendiente de aplicar",
        pendingApplyRate,
        "Monto no identificado / total movimientos",
      ]);
      reconciliationSheet.addRow([
        "Saldo pendiente global",
        canonicalBalance,
        "Diferencia entre cargos y monto abonado neto",
      ]);

      applyStyles(reconciliationSheet, "A1:C1", titleStyle);
      reconciliationSheet.mergeCells("A1:C1");
      applyStyles(reconciliationSheet, "A2:C2", headerStyle);
      applyAlternatingRowStyles(reconciliationSheet, 3, 7, "A-C");
      applyStyles(reconciliationSheet, "B3:B4", currencyStyle);
      applyStyles(reconciliationSheet, "B5:B6", percentageStyle);
      applyStyles(reconciliationSheet, "B7:B7", currencyStyle);
      reconciliationSheet.columns = [
        { width: 34 },
        { width: 20 },
        { width: 44 },
      ];
      reconciliationSheet.getRow(1).height = 35;
      reconciliationSheet.getRow(2).height = 30;

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
