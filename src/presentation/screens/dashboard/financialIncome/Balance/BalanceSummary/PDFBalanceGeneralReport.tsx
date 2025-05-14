// src/components/BalanceGeneral/PDFBalanceGeneralReport.tsx
import React, { useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useExpenseSummaryStore } from "../../../../../../store/expenseSummaryStore";
import {
  usePaymentSummaryStore,
  PaymentRecord,
} from "../../../../../../store/paymentSummaryStore";
import { DocumentChartBarIcon } from "@heroicons/react/16/solid";
import { useSignaturesStore } from "../../../../../../store/useSignaturesStore";

interface PDFBalanceGeneralReportProps {
  year: string;
}

interface FinancialAccount {
  id: string;
  name: string;
  initialBalance: number;
  creationMonth: string;
}

interface TrimestralAnalysis {
  trimestre: string;
  meses: string[];
  ingresos: number;
  egresos: number;
  balance: number;
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

const PDFBalanceGeneralReport: React.FC<PDFBalanceGeneralReportProps> = ({
  year,
}) => {
  // Datos de ingresos
  const {
    // totalIncome,
    monthlyStats: incomesMonthlyStats,
    logoBase64: logoIncome,
    financialAccountsMap,
    payments,
    detailed,
  } = usePaymentSummaryStore((state) => ({
    totalIncome: state.totalIncome,
    monthlyStats: state.monthlyStats,
    logoBase64: state.logoBase64,
    financialAccountsMap: state.financialAccountsMap,
    payments: state.payments,
    detailed: state.detailed,
  }));

  // Obtener firma y datos administrativos del store de firmas
  const {
    logoBase64: logoSignatures,
    signatureBase64,
    adminCompany,
    adminPhone,
    adminEmail,
    fetchSignatures,
  } = useSignaturesStore();

  // Cargar las firmas cuando se monta el componente
  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  // Datos de egresos
  const {
    totalSpent,
    monthlyStats: expensesMonthlyStats,
    logoBase64: logoExpense,
    expenses,
  } = useExpenseSummaryStore((state) => ({
    totalSpent: state.totalSpent,
    monthlyStats: state.monthlyStats,
    logoBase64: state.logoBase64,
    expenses: state.expenses,
  }));

  // Utilizar uno de los logos (se prioriza el de firmas, luego el de ingresos)
  const logoBase64 = logoSignatures || logoIncome || logoExpense;

  // Calcular el saldo a favor total
  const totalCreditGlobal = React.useMemo(
    () => incomesMonthlyStats.reduce((acc, stat) => acc + stat.saldo, 0),
    [incomesMonthlyStats]
  );

  // Calcular el total de ingresos incluyendo el saldo a favor
  const totalIncomeWithCredit = React.useMemo(() => {
    // Calculamos la suma de pagos, crédito usado y saldo de cada mes
    let computedTotalIncome = 0;
    incomesMonthlyStats.forEach((stat) => {
      computedTotalIncome += stat.paid + stat.creditUsed + stat.saldo;
    });

    // Añadimos los saldos iniciales de las cuentas financieras
    let totalInitialBalance = 0;
    for (const key in financialAccountsMap) {
      totalInitialBalance += financialAccountsMap[key].initialBalance;
    }
    computedTotalIncome += totalInitialBalance;

    return computedTotalIncome;
  }, [incomesMonthlyStats, financialAccountsMap]);

  // Calcular estadísticas adicionales y análisis
  const analisisAvanzado = React.useMemo(() => {
    // Función para calcular el total de ingresos de un mes usando el método correcto
    const calcularIngresosMes = (mes: string) => {
      // Obtener todos los registros del mes
      const monthRecords = Object.values(detailed)
        .flat()
        .filter((rec: PaymentRecord) => rec.month === mes);

      // Calcular los totales para este mes
      const totalPaid = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + rec.amountPaid,
        0
      );
      const totalCreditUsed = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + (rec.creditUsed || 0),
        0
      );
      const totalCreditBalance = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + rec.creditBalance,
        0
      );
      const totalCredit = totalCreditBalance - totalCreditUsed;
      const totalPaidWithCredit =
        totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;

      // Añadir saldos iniciales si corresponde
      const monthlyInitialBalance = Object.values(
        financialAccountsMap as Record<string, FinancialAccount>
      ).reduce((acc, account) => {
        if (account.creationMonth === mes && mes !== "01") {
          return acc + account.initialBalance;
        }
        return acc;
      }, 0);

      const initialBalances = Object.values(
        financialAccountsMap as Record<string, FinancialAccount>
      ).reduce((acc, account) => {
        if (account.creationMonth === "01" && mes === "01") {
          return acc + account.initialBalance;
        }
        return acc;
      }, 0);

      return (
        totalPaidWithCredit +
        (mes === "01" ? initialBalances : monthlyInitialBalance)
      );
    };

    // Encontrar el mes con mayor ingreso
    const mesMaxIngreso = incomesMonthlyStats.reduce((max, stat) => {
      const ingresoActual = calcularIngresosMes(stat.month);
      const ingresoMax = max ? calcularIngresosMes(max.month) : 0;
      return ingresoActual > ingresoMax ? stat : max;
    }, incomesMonthlyStats[0]);

    // Encontrar el mes con mayor egreso
    const mesMaxEgreso = expensesMonthlyStats.reduce(
      (max, stat) => (stat.spent > (max?.spent || 0) ? stat : max),
      expensesMonthlyStats[0]
    );

    // Encontrar el mes con mejor balance
    const balanceMensual = incomesMonthlyStats.map((incomeStat) => {
      const expenseStat = expensesMonthlyStats.find(
        (exp) => exp.month === incomeStat.month
      ) || { spent: 0 };
      return {
        month: incomeStat.month,
        balance: incomeStat.paid + incomeStat.saldo - expenseStat.spent,
      };
    });

    const mejorMes = balanceMensual.reduce(
      (max, stat) => (stat.balance > (max?.balance || 0) ? stat : max),
      balanceMensual[0]
    );

    // Análisis Trimestral
    const trimestres = [
      { nombre: "Q1", meses: ["01", "02", "03"] },
      { nombre: "Q2", meses: ["04", "05", "06"] },
      { nombre: "Q3", meses: ["07", "08", "09"] },
      { nombre: "Q4", meses: ["10", "11", "12"] },
    ];

    const analisisTrimestral = trimestres.map((trimestre) => {
      const ingresosTrimestre = trimestre.meses.reduce((acc, mes) => {
        // Usamos la misma función de cálculo para mantener consistencia
        return acc + calcularIngresosMes(mes);
      }, 0);

      const egresosTrimestre = trimestre.meses.reduce((acc, mes) => {
        const stat = expensesMonthlyStats.find((s) => s.month === mes);
        return acc + (stat ? stat.spent : 0);
      }, 0);

      return {
        trimestre: trimestre.nombre,
        meses: trimestre.meses,
        ingresos: ingresosTrimestre,
        egresos: egresosTrimestre,
        balance: ingresosTrimestre - egresosTrimestre,
      } as TrimestralAnalysis;
    });

    // Promedios Mensuales
    const promedioIngresos = totalIncomeWithCredit / 12;
    const promedioEgresos = totalSpent / 12;

    // Análisis de Tendencias
    const tendenciaMensual = incomesMonthlyStats.map((stat, index) => {
      const mesActual = stat.paid + stat.saldo;
      const mesAnterior =
        index > 0
          ? incomesMonthlyStats[index - 1].paid +
            incomesMonthlyStats[index - 1].saldo
          : mesActual;
      const cambio = ((mesActual - mesAnterior) / mesAnterior) * 100;

      return {
        mes: stat.month,
        cambio: !isFinite(cambio) ? 0 : cambio,
      };
    });

    // Análisis de Estacionalidad
    const estacionalidad = incomesMonthlyStats.map((stat) => {
      const ingresoMes = calcularIngresosMes(stat.month);
      // Para calcular la proporción, sumamos todos los ingresos mensuales
      const totalIngresos = incomesMonthlyStats.reduce(
        (sum, s) => sum + calcularIngresosMes(s.month),
        0
      );
      const proporcionDelTotal = (ingresoMes / totalIngresos) * 100;
      return {
        mes: stat.month,
        proporcion: proporcionDelTotal,
      };
    });

    // Meses consecutivos de crecimiento
    const mesesCrecimiento = tendenciaMensual.reduce((acc, curr) => {
      if (curr.cambio > 0) return acc + 1;
      return 0;
    }, 0);

    return {
      mesMaxIngreso,
      mesMaxEgreso,
      mejorMes,
      trimestral: analisisTrimestral,
      promedios: {
        ingresos: promedioIngresos,
        egresos: promedioEgresos,
      },
      tendencias: tendenciaMensual,
      estacionalidad,
      mesesCrecimiento,
    };
  }, [
    incomesMonthlyStats,
    expensesMonthlyStats,
    detailed,
    financialAccountsMap,
    totalSpent,
  ]);

  // Function to format detailed date
  const formatDetailedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Preparar datos para la tabla de movimientos detallados
  const getMovimientosDetallados = () => {
    // Combinar pagos y gastos
    const movimientos = [
      // Pagos (ingresos)
      ...payments.map((payment) => ({
        tipo: "Ingreso",
        fecha: payment.paymentDate || "",
        concepto: payment.concept || "Pago",
        monto: payment.amountPaid,
        detalles: `Referencia: ${payment.id || "N/A"}`,
        mes: (payment.paymentDate || "").substring(0, 7), // Formato YYYY-MM de la fecha
      })),

      // Gastos (egresos)
      ...expenses.map((expense) => ({
        tipo: "Egreso",
        fecha: expense.expenseDate || "",
        concepto: expense.concept,
        monto: expense.amount, // Ya está en pesos, no necesita conversión
        detalles: expense.description || "",
        mes: (expense.expenseDate || "").substring(0, 7), // Formato YYYY-MM de la fecha
      })),
    ];

    // Filtrar por año si es necesario
    const movimientosFiltrados = year
      ? movimientos.filter((m) => m.fecha && m.fecha.startsWith(year))
      : movimientos;

    // Ordenar por fecha
    return movimientosFiltrados.sort((a, b) =>
      (a.fecha || "").localeCompare(b.fecha || "")
    );
  };

  const generatePDF = async () => {
    const doc = new jsPDF();

    // Helper para formatear números como moneda
    const formatCurrency = (value: number): string =>
      "$" +
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // Helper para manejar valores indefinidos
    const formatValue = (value: number | undefined): string => {
      if (value === undefined || isNaN(value)) return "-";
      return formatCurrency(value);
    };

    // Helper para calcular porcentajes
    const formatPercentage = (value: number | undefined): string => {
      if (value === undefined || isNaN(value)) return "-";
      return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
    };

    // --- Encabezado ---
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    }
    doc.setFontSize(16);
    doc.text("Reporte Balance General", 14, 20);
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

    // --- Tabla Mensual Original ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle Mensual", 14, 85);

    const tableData = [];
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalBalance = 0;

    // Distribuir los saldos iniciales en el primer mes del año
    const initialBalances = Object.values(
      financialAccountsMap as Record<string, FinancialAccount>
    ).reduce((acc, account) => {
      if (account.creationMonth === "01") {
        return acc + account.initialBalance;
      }
      return acc;
    }, 0);

    // Iterar por todos los meses, usando la misma lógica que PDFReportGenerator.tsx
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
    monthKeys.forEach((m) => {
      const monthLabel = monthNames[m] || m;
      // const incomeStat = incomesMonthlyStats.find((stat) => stat.month === m);
      const expenseStat = expensesMonthlyStats.find((stat) => stat.month === m);

      // Obtener todos los registros del mes
      const monthRecords = Object.values(detailed)
        .flat()
        .filter((rec: PaymentRecord) => rec.month === m);

      // Calcular los totales para este mes usando la misma lógica que PDFReportGenerator.tsx
      const totalPaid = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + rec.amountPaid,
        0
      );
      const totalCreditUsed = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + (rec.creditUsed || 0),
        0
      );
      const totalCreditBalance = monthRecords.reduce(
        (sum, rec: PaymentRecord) => sum + rec.creditBalance,
        0
      );
      const totalCredit = totalCreditBalance - totalCreditUsed;
      const totalPaidWithCredit =
        totalPaid + (totalCredit > 0 ? totalCredit : 0) - totalCreditUsed;

      // Añadir saldos iniciales de las cuentas creadas en este mes
      const monthlyInitialBalance = Object.values(
        financialAccountsMap as Record<string, FinancialAccount>
      ).reduce((acc, account) => {
        if (account.creationMonth === m && m !== "01") {
          return acc + account.initialBalance;
        }
        return acc;
      }, 0);

      // Calcular ingresos, egresos y balance
      const ingresos =
        totalPaidWithCredit +
        (m === "01" ? initialBalances : monthlyInitialBalance);
      const egresos = expenseStat ? expenseStat.spent : 0;
      const balance = ingresos - egresos;
      const porcentajeMensual =
        ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : 0;

      // Acumular totales
      totalIngresos += ingresos;
      totalEgresos += egresos;
      totalBalance += balance;

      // Agregar a la tabla
      tableData.push([
        monthLabel,
        formatValue(ingresos),
        formatValue(egresos),
        formatValue(balance),
        formatPercentage(porcentajeMensual),
      ]);
    });

    // Añadir fila de totales
    const porcentajeTotal =
      totalIngresos > 0 ? (totalBalance / totalIngresos) * 100 : 0;
    tableData.push([
      "TOTAL",
      formatValue(totalIngresos),
      formatValue(totalEgresos),
      formatValue(totalBalance),
      formatPercentage(porcentajeTotal),
    ]);

    // --- Indicadores Clave ---
    doc.setFont("helvetica", "bold");
    doc.text("Total Ingresos:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(
      formatCurrency(totalIngresos),
      14 + doc.getTextWidth("Total Ingresos:") + 5,
      50
    );
    doc.setFont("helvetica", "bold");
    doc.text("Total Egresos:", 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(
      formatCurrency(totalEgresos),
      14 + doc.getTextWidth("Total Egresos:") + 5,
      60
    );
    doc.setFont("helvetica", "bold");
    doc.text("Balance Neto:", 14, 70);
    doc.setFont("helvetica", "normal");
    doc.text(
      formatCurrency(totalBalance),
      14 + doc.getTextWidth("Balance Neto:") + 5,
      70
    );

    autoTable(doc, {
      startY: 90,
      head: [["Mes", "Ingresos", "Egresos", "Balance", "% Balance"]],
      body: tableData,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        valign: "middle",
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: "auto", halign: "center" },
        3: { cellWidth: "auto", halign: "center" },
        4: { cellWidth: "auto", halign: "center" },
      },
      didParseCell: function (data) {
        // Dar formato especial a la fila de totales
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // --- Estadísticas Destacadas y Análisis Trimestral (Nueva página) ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Estadísticas Destacadas", 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const stats = [
      `• Mes con mayores ingresos: ${
        monthNames[analisisAvanzado.mesMaxIngreso?.month || "01"]
      } (${formatValue(
        analisisAvanzado.mesMaxIngreso?.paid +
          analisisAvanzado.mesMaxIngreso?.saldo
      )})`,
      `• Mes con mayores egresos: ${
        monthNames[analisisAvanzado.mesMaxEgreso?.month || "01"]
      } (${formatValue(analisisAvanzado.mesMaxEgreso?.spent)})`,
      `• Mes con mejor balance: ${
        monthNames[analisisAvanzado.mejorMes?.month || "01"]
      } (${formatValue(analisisAvanzado.mejorMes?.balance)})`,
      `• Saldo a favor acumulado: ${formatValue(totalCreditGlobal)}`,
    ];

    stats.forEach((stat, index) => {
      doc.text(stat, 14, 30 + index * 6);
    });

    // Análisis Trimestral (misma página)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis Trimestral", 14, 60);

    const trimestralData = analisisAvanzado.trimestral.map(
      (t: TrimestralAnalysis) => {
        // Calcular saldos iniciales para este trimestre
        const trimesterInitialBalance = Object.values(
          financialAccountsMap as Record<string, FinancialAccount>
        ).reduce((acc, account) => {
          if (t.trimestre === "Q1" && account.creationMonth === "01") {
            return acc + account.initialBalance;
          }
          if (
            t.meses.includes(account.creationMonth) &&
            account.creationMonth !== "01"
          ) {
            return acc + account.initialBalance;
          }
          return acc;
        }, 0);

        const ingresosTotales = t.ingresos + trimesterInitialBalance;
        const balance = ingresosTotales - t.egresos;

        return [
          t.trimestre,
          formatValue(ingresosTotales),
          formatValue(t.egresos),
          formatValue(balance),
          formatPercentage((balance / ingresosTotales) * 100),
        ];
      }
    );

    // Añadir fila de totales para análisis trimestral
    const totalTrimestral = {
      ingresos: analisisAvanzado.trimestral.reduce(
        (acc, t) => acc + t.ingresos,
        0
      ),
      egresos: analisisAvanzado.trimestral.reduce(
        (acc, t) => acc + t.egresos,
        0
      ),
      balance: analisisAvanzado.trimestral.reduce(
        (acc, t) => acc + t.balance,
        0
      ),
    };

    const porcentajeTotalTrimestral =
      totalTrimestral.ingresos > 0
        ? (totalTrimestral.balance / totalTrimestral.ingresos) * 100
        : 0;

    trimestralData.push([
      "TOTAL",
      formatValue(totalTrimestral.ingresos),
      formatValue(totalTrimestral.egresos),
      formatValue(totalTrimestral.balance),
      formatPercentage(porcentajeTotalTrimestral),
    ]);

    autoTable(doc, {
      startY: 65,
      head: [["Trimestre", "Ingresos", "Egresos", "Balance", "% Rendimiento"]],
      body: trimestralData,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        valign: "middle",
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: "auto", halign: "center" },
        3: { cellWidth: "auto", halign: "center" },
        4: { cellWidth: "auto", halign: "center" },
      },
      didParseCell: function (data) {
        // Dar formato especial a la fila de totales
        if (data.row.index === trimestralData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // --- Análisis de Estacionalidad y Comparación Mensual (Nueva página) ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis de Estacionalidad", 14, 20);

    const estacionalidadData = analisisAvanzado.estacionalidad.map((e) => [
      monthNames[e.mes],
      formatPercentage(e.proporcion),
      e.proporcion > 8.33
        ? "Por encima del promedio"
        : "Por debajo del promedio",
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["Mes", "% del Total Anual", "Comportamiento"]],
      body: estacionalidadData,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        valign: "middle",
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: "auto", halign: "center" },
      },
    });

    // Comparación Mensual (misma página)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Comparación Mensual", 14, 128);

    const comparacionData = analisisAvanzado.tendencias.map((t) => [
      monthNames[t.mes],
      formatPercentage(t.cambio),
      t.cambio > 0 ? "Crecimiento" : "Decrecimiento",
    ]);

    autoTable(doc, {
      startY: 133,
      head: [["Mes", "% Cambio", "Tendencia"]],
      body: comparacionData,
      headStyles: {
        fillColor: [75, 68, 224],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        valign: "middle",
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: "auto", halign: "center" },
      },
    });

    // --- Nueva tabla de movimientos detallados (estado de cuenta) ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Estado de Cuenta - Movimientos Detallados", 14, 20);

    const movimientosDetallados = getMovimientosDetallados();

    // Agrupar por mes
    const movimientosPorMes: { [key: string]: typeof movimientosDetallados } =
      {};

    movimientosDetallados.forEach((movimiento) => {
      const mes = movimiento.mes;
      if (!movimientosPorMes[mes]) {
        movimientosPorMes[mes] = [];
      }
      movimientosPorMes[mes].push(movimiento);
    });

    // Inicializar y aumentar hasta que se necesite una nueva página
    let startY = 25;

    Object.keys(movimientosPorMes)
      .sort()
      .forEach((mes) => {
        const movimientosDelMes = movimientosPorMes[mes];

        // Extraer año y mes, y convertir mes a nombre
        const [anio, mesNum] = mes.split("-");
        const mesNombre = monthNames[mesNum] || mesNum;

        // Encabezado del mes
        if (startY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${mesNombre} ${anio}`, 14, startY);
        startY += 5;

        // Crear tabla para este mes
        const detallesMes = movimientosDelMes.map((m) => [
          formatDetailedDate(m.fecha || ""),
          m.tipo,
          m.concepto,
          m.tipo === "Ingreso" ? formatCurrency(m.monto) : "-",
          m.tipo === "Egreso" ? formatCurrency(m.monto) : "-",
          m.detalles,
        ]);

        autoTable(doc, {
          startY: startY,
          head: [
            ["Fecha", "Tipo", "Concepto", "Ingreso", "Egreso", "Detalles"],
          ],
          body: detallesMes,
          headStyles: {
            fillColor: [75, 68, 224],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 8,
            valign: "middle",
          },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: "auto", halign: "left" },
            1: { cellWidth: "auto", halign: "center" },
            2: { cellWidth: "auto", halign: "left" },
            3: { cellWidth: "auto", halign: "right" },
            4: { cellWidth: "auto", halign: "right" },
            5: { cellWidth: "auto", halign: "left" },
          },
          didDrawPage: (data) => {
            if (data.cursor) {
              startY = data.cursor.y;
            }
          },
        });

        // Calcular totales del mes
        const ingresosDelMes = movimientosDelMes
          .filter((m) => m.tipo === "Ingreso")
          .reduce((sum, m) => sum + m.monto, 0);

        const egresosDelMes = movimientosDelMes
          .filter((m) => m.tipo === "Egreso")
          .reduce((sum, m) => sum + m.monto, 0);

        const saldoDelMes = ingresosDelMes - egresosDelMes;

        // Añadir resumen del mes
        const resumenDelMes = [
          [
            "TOTALES DEL MES",
            "",
            "",
            formatCurrency(ingresosDelMes),
            formatCurrency(egresosDelMes),
            formatCurrency(saldoDelMes),
          ],
        ];

        autoTable(doc, {
          startY: startY,
          body: resumenDelMes,
          styles: {
            fontSize: 8,
            valign: "middle",
            fontStyle: "bold",
            fillColor: [240, 240, 240],
          },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: "auto", halign: "left" },
            1: { cellWidth: "auto", halign: "center" },
            2: { cellWidth: "auto", halign: "left" },
            3: { cellWidth: "auto", halign: "right" },
            4: { cellWidth: "auto", halign: "right" },
            5: { cellWidth: "auto", halign: "right" },
          },
          didDrawPage: (data) => {
            if (data.cursor) {
              startY = data.cursor.y + 15; // Añadir espacio después del resumen
            }
          },
        });
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
    doc.text(
      adminCompany || "Administradora S.A.",
      margin + 40,
      adminSectionY + 10
    );
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", margin, adminSectionY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(
      adminPhone || "Teléfono no disponible",
      margin + 40,
      adminSectionY + 20
    );
    doc.setFont("helvetica", "bold");
    doc.text("Contacto:", margin, adminSectionY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(
      adminEmail || "Email no disponible",
      margin + 40,
      adminSectionY + 30
    );

    const footerY = pageHeight - 15;
    doc.setFontSize(11);
    doc.text("Un servicio de Omnipixel.", margin, footerY - 10);
    doc.text("Correo: administracion@estate-admin.com", margin, footerY - 5);

    doc.save(`reporte_balance_general_${year}.pdf`);
  };

  return (
    <div className="w-full flex justify-end mb-4">
      <button
        onClick={() => generatePDF()}
        className="bg-indigo-600 text-white text-sm py-2 px-1 rounded flex justify-center items-center w-[270px] font-medium hover:bg-indigo-700"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        Generar Reporte Balance General
      </button>
    </div>
  );
};

export default PDFBalanceGeneralReport;
