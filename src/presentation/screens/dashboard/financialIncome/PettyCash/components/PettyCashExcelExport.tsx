import React from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import "moment/locale/es";
import {
  PettyCashTransaction,
  PettyCashTransactionType,
} from "../../../../../../store/pettyCashStore";

moment.locale("es");

interface PettyCashExcelExportProps {
  transactions: PettyCashTransaction[];
  providerNameById?: Record<string, string>;
  accountNameById?: Record<string, string>;
  renderButton?: (onClick: () => void) => React.ReactNode;
}

const PettyCashExcelExport: React.FC<PettyCashExcelExportProps> = ({
  transactions,
  providerNameById = {},
  accountNameById = {},
  renderButton,
}) => {
  // Función de formateo de moneda
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Obtener el tipo de transacción en formato legible
  const getTransactionTypeLabel = (type: PettyCashTransactionType): string => {
    switch (type) {
      case PettyCashTransactionType.EXPENSE:
        return "Gasto";
      case PettyCashTransactionType.REPLENISHMENT:
        return "Reposición";
      case PettyCashTransactionType.INITIAL:
        return "Saldo Inicial";
      case PettyCashTransactionType.ADJUSTMENT:
        return "Ajuste";
      default:
        return "Desconocido";
    }
  };

  // Obtener la categoría de transacción en formato legible
  const getCategoryLabel = (category?: string): string => {
    if (!category) return "N/A";
    
    switch (category) {
      case "office_supplies":
        return "Suministro de Papelería";
      case "cleaning":
        return "Limpieza";
      case "maintenance":
        return "Mantenimiento menor";
      case "transport":
        return "Transporte y mensajería";
      case "food":
        return "Alimentos y bebidas";
      case "miscellaneous":
        return "Varios";
      case "other":
        return "Otros gastos";
      default:
        return category;
    }
  };

  const getProviderName = (transaction: PettyCashTransaction): string => {
    if (transaction.provider?.name) {
      return transaction.provider.name;
    }

    if (transaction.providerId) {
      return providerNameById[transaction.providerId] || "Proveedor no encontrado";
    }

    return "-";
  };

  const getSourceAccountName = (transaction: PettyCashTransaction): string => {
    if (!transaction.sourceAccountId) {
      return "-";
    }

    return accountNameById[transaction.sourceAccountId] || "Cuenta no encontrada";
  };

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

    const positiveValueStyle = {
      numFmt: '"$"#,##0.00',
      alignment: { horizontal: "right", vertical: "middle" },
      font: { color: { argb: "FF047857" } }, // Verde
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
      font: { color: { argb: "FFDC2626" } }, // Rojo
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
      formatter: (cellValue: any, row: number, col: number) => any
    ) {
      const [start, end] = range.split(":");
      const startCell = decodeCell(start);
      const endCell = decodeCell(end);
      if (!startCell || !endCell) return;
      for (let r = startCell.row; r <= endCell.row; r++) {
        for (let c = startCell.col; c <= endCell.col; c++) {
          const cell = worksheet.getCell(r, c);
          const style = formatter(cell.value, r, c);
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
    // Hoja de información general
    // ========================
    const currentDate = moment().format("DD/MM/YYYY HH:mm:ss");
    
    // Cálculo de totales por tipo de transacción
    let totalExpenses = 0;
    let totalReplenishments = 0;
    let totalInitial = 0;
    let totalAdjustments = 0;
    let totalBalance = 0;

    transactions.forEach(tx => {
      const amountInPesos = tx.amount / 100;
      
      switch (tx.type) {
        case PettyCashTransactionType.EXPENSE:
          totalExpenses += amountInPesos;
          totalBalance -= amountInPesos;
          break;
        case PettyCashTransactionType.REPLENISHMENT:
          totalReplenishments += amountInPesos;
          totalBalance += amountInPesos;
          break;
        case PettyCashTransactionType.INITIAL:
          totalInitial += amountInPesos;
          totalBalance += amountInPesos;
          break;
        case PettyCashTransactionType.ADJUSTMENT:
          totalAdjustments += amountInPesos;
          totalBalance += amountInPesos; // Los ajustes pueden ser positivos o negativos
          break;
      }
    });

    const infoSheet = workbook.addWorksheet("Información General");
    infoSheet.addRow(["Reporte de Transacciones de Caja Chica"]);
    infoSheet.addRow(["Fecha de generación", currentDate]);
    infoSheet.addRow(["Total de transacciones", transactions.length.toString()]);
    infoSheet.addRow(["Saldo inicial", formatCurrency(totalInitial)]);
    infoSheet.addRow(["Total gastos", formatCurrency(totalExpenses)]);
    infoSheet.addRow(["Total reposiciones", formatCurrency(totalReplenishments)]);
    infoSheet.addRow(["Total ajustes", formatCurrency(totalAdjustments)]);
    infoSheet.addRow(["Saldo actual", formatCurrency(totalBalance)]);

    // Aplicar estilos
    infoSheet.mergeCells("A1:B1");
    applyStyles(infoSheet, "A1:B1", titleStyle);
    
    // Estilo para etiquetas
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

    // Estilo para valores
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

    applyStyles(infoSheet, "A2:A8", labelStyle);
    applyStyles(infoSheet, "B2:B8", valueStyle);
    
    // Aplicar formato de moneda
    applyStyles(infoSheet, "B4:B8", {...valueStyle, numFmt: '"$"#,##0.00'});
    
    // Aplicar colores condicionales para gastos (rojo) y saldo (verde/rojo)
    applyConditionalStyles(infoSheet, "B5:B5", (_value) => negativeValueStyle);
    applyConditionalStyles(infoSheet, "B8:B8", (value) => 
      value >= 0 ? positiveValueStyle : negativeValueStyle
    );

    // Ajustar anchos de columna
    infoSheet.columns = [
      { width: 30 },
      { width: 30 }
    ];
    infoSheet.getRow(1).height = 35;

    // ========================
    // Hoja de transacciones
    // ========================
    const txSheet = workbook.addWorksheet("Transacciones");
    
    // Encabezado
    txSheet.addRow(["Listado de Transacciones de Caja Chica"]);
    txSheet.addRow([
      "Fecha",
      "ID",
      "Tipo",
      "Categoría",
      "Descripción",
      "Usuario",
      "Cuenta origen",
      "Proveedor",
      "Monto"
    ]);

    // Ordenar transacciones por fecha (más reciente primero)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );

    // Agregar filas de datos
    sortedTransactions.forEach(tx => {
      txSheet.addRow([
        moment(tx.expenseDate).format("DD/MM/YYYY"),
        tx.id,
        getTransactionTypeLabel(tx.type),
        getCategoryLabel(tx.category),
        tx.description,
        tx.userName,
        getSourceAccountName(tx),
        getProviderName(tx),
        tx.amount / 100 // Convertir de centavos a pesos
      ]);
    });

    // Agregar fila de totales
    txSheet.addRow([
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      totalBalance
    ]);

    // Aplicar estilos
    txSheet.mergeCells("A1:I1");
    applyStyles(txSheet, "A1:I1", titleStyle);
    applyStyles(txSheet, "A2:I2", headerStyle);
    
    // Aplicar estilos a las filas de datos
    const lastRow = sortedTransactions.length + 2;
    applyAlternatingRowStyles(txSheet, 3, lastRow, "A-I");
    
    // Aplicar estilo a la fila de totales
    applyStyles(txSheet, `A${lastRow+1}:I${lastRow+1}`, totalRowStyle);
    
    // Aplicar formato de moneda a la columna de montos
    applyStyles(txSheet, `I3:I${lastRow+1}`, currencyStyle);
    
    // Aplicar colores condicionales para montos (verde para ingresos, rojo para gastos)
    for (let r = 3; r <= lastRow; r++) {
      const typeCell = txSheet.getCell(`C${r}`);
      const amountCell = txSheet.getCell(`I${r}`);
      const amountValue = Number(amountCell.value || 0);

      if (typeCell.value === "Gasto") {
        applyStyles(txSheet, `I${r}:I${r}`, negativeValueStyle);
        // Agregar signo negativo
        amountCell.value = -Math.abs(amountCell.value as number);
      } else if (typeCell.value === "Ajuste" && amountValue < 0) {
        applyStyles(txSheet, `I${r}:I${r}`, negativeValueStyle);
      } else {
        applyStyles(txSheet, `I${r}:I${r}`, positiveValueStyle);
      }
    }

    // Ajustar anchos de columna
    txSheet.columns = [
      { width: 15 }, // Fecha
      { width: 15 }, // ID
      { width: 15 }, // Tipo
      { width: 25 }, // Categoría
      { width: 40 }, // Descripción
      { width: 25 }, // Usuario
      { width: 30 }, // Cuenta origen
      { width: 28 }, // Proveedor
      { width: 20 }  // Monto
    ];
    txSheet.getRow(1).height = 35;
    txSheet.getRow(2).height = 25;

    // ========================
    // Hoja de resumen por tipo
    // ========================
    const typeSheet = workbook.addWorksheet("Resumen por Tipo");
    typeSheet.addRow(["Resumen por Tipo de Transacción"]);
    typeSheet.addRow(["Tipo", "Cantidad", "Monto Total"]);

    // Contar y sumar por tipo
    const typeStats: Record<string, {count: number, total: number}> = {
      "Gasto": {count: 0, total: 0},
      "Reposición": {count: 0, total: 0},
      "Saldo Inicial": {count: 0, total: 0},
      "Ajuste": {count: 0, total: 0}
    };

    transactions.forEach(tx => {
      const type = getTransactionTypeLabel(tx.type);
      const amount = tx.amount / 100;
      typeStats[type].count++;
      typeStats[type].total += amount;
    });

    // Agregar filas de datos
    Object.entries(typeStats).forEach(([type, stats]) => {
      if (stats.count > 0) {
        typeSheet.addRow([
          type,
          stats.count,
          stats.total
        ]);
      }
    });

    // Aplicar estilos
    typeSheet.mergeCells("A1:C1");
    applyStyles(typeSheet, "A1:C1", titleStyle);
    applyStyles(typeSheet, "A2:C2", headerStyle);
    
    // Aplicar estilos a las filas de datos
    const typeStatsRows = Object.values(typeStats).filter(s => s.count > 0).length;
    applyAlternatingRowStyles(typeSheet, 3, 2 + typeStatsRows, "A-C");
    
    // Aplicar formato de moneda a la columna de montos
    applyStyles(typeSheet, `C3:C${2 + typeStatsRows}`, currencyStyle);
    
    // Aplicar colores condicionales para tipos
    for (let r = 3; r <= 2 + typeStatsRows; r++) {
      const typeCell = typeSheet.getCell(`A${r}`);
      const amountCell = typeSheet.getCell(`C${r}`);
      const amountValue = Number(amountCell.value || 0);
      
      if (typeCell.value === "Gasto") {
        applyStyles(typeSheet, `C${r}:C${r}`, negativeValueStyle);
        // Hacer negativo el valor
        amountCell.value = -Math.abs(amountCell.value as number);
      } else if (amountValue < 0) {
        applyStyles(typeSheet, `C${r}:C${r}`, negativeValueStyle);
      } else {
        applyStyles(typeSheet, `C${r}:C${r}`, positiveValueStyle);
      }
    }

    // Ajustar anchos de columna
    typeSheet.columns = [
      { width: 25 }, // Tipo
      { width: 15 }, // Cantidad
      { width: 25 }  // Monto
    ];
    typeSheet.getRow(1).height = 35;
    typeSheet.getRow(2).height = 25;

    // ========================
    // Hoja de resumen por categoría
    // ========================
    if (transactions.some(tx => tx.category)) {
      const categorySheet = workbook.addWorksheet("Resumen por Categoría");
      categorySheet.addRow(["Resumen por Categoría de Gasto"]);
      categorySheet.addRow(["Categoría", "Cantidad", "Monto Total"]);

      // Contar y sumar por categoría (solo para gastos)
      const categoryStats: Record<string, {count: number, total: number}> = {};

      transactions
        .filter(tx => tx.type === PettyCashTransactionType.EXPENSE)
        .forEach(tx => {
          const category = getCategoryLabel(tx.category);
          const amount = tx.amount / 100;
          
          if (!categoryStats[category]) {
            categoryStats[category] = {count: 0, total: 0};
          }
          
          categoryStats[category].count++;
          categoryStats[category].total += amount;
        });

      // Agregar filas de datos
      Object.entries(categoryStats).forEach(([category, stats]) => {
        if (stats.count > 0) {
          categorySheet.addRow([
            category,
            stats.count,
            stats.total
          ]);
        }
      });

      // Aplicar estilos
      categorySheet.mergeCells("A1:C1");
      applyStyles(categorySheet, "A1:C1", titleStyle);
      applyStyles(categorySheet, "A2:C2", headerStyle);
      
      // Aplicar estilos a las filas de datos
      const categoryRows = Object.values(categoryStats).filter(s => s.count > 0).length;
      applyAlternatingRowStyles(categorySheet, 3, 2 + categoryRows, "A-C");
      
      // Aplicar formato de moneda a la columna de montos
      applyStyles(categorySheet, `C3:C${2 + categoryRows}`, negativeValueStyle);

      // Ajustar anchos de columna
      categorySheet.columns = [
        { width: 30 }, // Categoría
        { width: 15 }, // Cantidad
        { width: 25 }  // Monto
      ];
      categorySheet.getRow(1).height = 35;
      categorySheet.getRow(2).height = 25;
    }

    // ========================
    // Guardar el archivo
    // ========================
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `transacciones_caja_chica_${moment().format("YYYY-MM-DD")}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  return renderButton ? (
    renderButton(generateExcel)
  ) : (
    <button
      onClick={generateExcel}
      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
    >
      Exportar a Excel
    </button>
  );
};

export default PettyCashExcelExport;
