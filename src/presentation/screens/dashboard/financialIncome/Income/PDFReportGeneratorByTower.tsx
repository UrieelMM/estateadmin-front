// src/components/PDFReportGeneratorByTower.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PaymentRecord,
  MonthlyStat,
  usePaymentSummaryStore,
} from "../../../../../store/paymentSummaryStore";
import { useExpenseSummaryStore } from "../../../../../store/expenseSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";

interface Condominium {
  key: string;
  number: string;
  name?: string;
  tower?: string;
  userId?: string;
  userUid?: string;
}

export interface PDFReportGeneratorByTowerProps {
  year: string;
  tower?: string;
  concept?: string;
  totalIncome?: number;
  totalPending?: number;
  monthlyStats?: MonthlyStat[];
  detailed?: Record<string, PaymentRecord[]>;
  maxMonth?: string;
  minMonth?: string;
  logoBase64?: string;
  signatureBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
  conceptRecords?: Record<string, PaymentRecord[]>;
  allCondominiums?: Condominium[];
  conceptData?: PaymentRecord[];
  renderButton?: (onClick: () => void) => React.ReactNode;
  signatureUrl?: string;
  buttonClassName?: string;
}

// Función auxiliar para convertir una URL de imagen a base64 con optimización
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Crear canvas para redimensionar y comprimir
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      // Establecer dimensiones máximas para la firma (reducidas para optimizar)
      const maxWidth = 300; // Reducido de posibles dimensiones más grandes
      const maxHeight = 150; // Altura máxima optimizada para firmas

      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Configurar canvas con las nuevas dimensiones
      canvas.width = width;
      canvas.height = height;

      // Fondo blanco para firmas con transparencia
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      // Dibujar la imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a base64 con compresión JPEG (más eficiente que PNG para fotos/firmas)
      const base64 = canvas.toDataURL("image/jpeg", 0.7); // 70% de calidad es suficiente para firmas
      resolve(base64);
    };

    img.onerror = () => {
      // Fallback: usar el método original si hay error con la optimización
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    };

    // Crear URL del blob para cargar en la imagen
    const objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
  });
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

const PDFReportGeneratorByTower: React.FC<PDFReportGeneratorByTowerProps> = ({
  year,
  tower,
  concept,
  renderButton,
}) => {
  // Obtener datos del store
  const {
    payments,
    monthlyStats,
    totalInitialBalance,
    detailed,
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureUrl,
    conceptRecords,
  } = usePaymentSummaryStore();

  // Obtener los condominios desde el store de usuarios
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const normalizeTowerLabel = (value?: string) => String(value || "").trim();
  const normalizeCondoNumber = (value: unknown) => String(value || "").trim();
  const normalizeUserId = (value: unknown) => String(value || "").trim();
  const normalizeTower = (value?: string) =>
    normalizeTowerLabel(value).toLowerCase();

  const normalizedUsers: Condominium[] = condominiumsUsers.map((user, index) => {
    const rawUser = user as unknown as { uid?: string; id?: string };
    const userDocId = normalizeUserId(rawUser.id);
    const userUid = normalizeUserId(rawUser.uid);
    const userId = userDocId || userUid;
    const number = normalizeCondoNumber(user.number);
    const towerValue = normalizeTowerLabel(user.tower);
    return {
      key: userId
        ? `uid:${userId}`
        : `profile:${number}|tower:${towerValue || "sin_torre"}|idx:${index}`,
      userId,
      userUid,
      number,
      name: user.name,
      tower: towerValue,
    };
  });

  const allCondominiums: Condominium[] = normalizedUsers;
  const towerByUserId = new Map(
    normalizedUsers.flatMap((condo) => {
      const tower = normalizeTowerLabel(condo.tower);
      const entries: [string, string][] = [];
      const primaryUserId = normalizeUserId(condo.userId);
      const authUserId = normalizeUserId(condo.userUid);
      if (primaryUserId) entries.push([primaryUserId, tower]);
      if (authUserId) entries.push([authUserId, tower]);
      return entries;
    })
  );
  const towersByCondominiumNumber = new Map<string, Set<string>>();
  normalizedUsers.forEach((condo) => {
    const number = normalizeCondoNumber(condo.number);
    if (!number) return;
    if (!towersByCondominiumNumber.has(number)) {
      towersByCondominiumNumber.set(number, new Set<string>());
    }
    const normalizedTowerLabelValue = normalizeTowerLabel(condo.tower);
    towersByCondominiumNumber
      .get(number)!
      .add(normalizedTowerLabelValue || "");
  });

  const resolveTowerByRecord = (
    record: PaymentRecord,
    fallbackNumber?: string
  ) => {
    const snapshot = normalizeTowerLabel(record.towerSnapshot);
    if (snapshot.length > 0) return snapshot;
    const userTower = towerByUserId.get(normalizeUserId(record.userId));
    if (userTower && userTower.length > 0) return userTower;
    const number = normalizeCondoNumber(
      record.numberCondominium || fallbackNumber || ""
    );
    const towers = towersByCondominiumNumber.get(number);
    if (towers && towers.size === 1) {
      return Array.from(towers)[0];
    }
    return "";
  };
  const resolveCondominiumKey = (
    record: PaymentRecord,
    fallbackNumber?: string
  ) => {
    const userId = normalizeUserId(record.userId);
    if (userId) return `uid:${userId}`;
    const number = normalizeCondoNumber(
      record.numberCondominium || fallbackNumber || ""
    );
    const resolvedTower = normalizeTowerLabel(
      resolveTowerByRecord(record, fallbackNumber)
    );
    if (number) {
      return `number:${number}|tower:${resolvedTower || "sin_torre"}`;
    }
    return `record:${record.id}`;
  };
  const normalizedTowerFilter = normalizeTower(tower);
  const hasTowerFilter =
    normalizedTowerFilter.length > 0 &&
    normalizedTowerFilter !== "all" &&
    normalizedTowerFilter !== "todas";
  const allDetailedRecords = Object.values(detailed).flat();
  const allDetailedRecordsForReport: PaymentRecord[] = hasTowerFilter
    ? allDetailedRecords.filter(
        (record) =>
          normalizeTower(
            resolveTowerByRecord(record, record.numberCondominium)
          ) === normalizedTowerFilter
      )
    : allDetailedRecords;

  const detailedForReport: Record<string, PaymentRecord[]> =
    allDetailedRecordsForReport.reduce((acc, record) => {
      const key = resolveCondominiumKey(record, record.numberCondominium);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {} as Record<string, PaymentRecord[]>);

  const filteredCondominiums: Condominium[] = (() => {
    const mapped = new Map<string, Condominium>();
    const baseCondominiums = hasTowerFilter
      ? allCondominiums.filter(
          (condo) => normalizeTower(condo.tower) === normalizedTowerFilter
        )
      : allCondominiums;

    baseCondominiums.forEach((condo) => {
      mapped.set(condo.key, condo);
    });

    Object.entries(detailedForReport).forEach(([key, records]) => {
      if (mapped.has(key)) return;
      const firstRecord = records[0];
      const userId = normalizeUserId(firstRecord?.userId);
      const profile = userId
        ? allCondominiums.find(
            (condo) => normalizeUserId(condo.userId) === userId
          )
        : undefined;
      const number =
        normalizeCondoNumber(firstRecord?.numberCondominium) ||
        profile?.number ||
        "-";
      const resolvedTower = firstRecord
        ? normalizeTowerLabel(resolveTowerByRecord(firstRecord, number))
        : "";

      mapped.set(key, {
        key,
        userId: userId || profile?.userId,
        number,
        name: profile?.name,
        tower: profile?.tower || resolvedTower,
      });
    });

    return Array.from(mapped.values());
  })();
  const normalizeRecordMonth = (monthRaw: string) =>
    String(monthRaw || "").includes("-")
      ? String(monthRaw).split("-")[1]
      : String(monthRaw || "").padStart(2, "0");

  // Si se pasa un concepto, obtener la data correspondiente del store
  const computedConceptData: PaymentRecord[] | undefined = concept
    ? conceptRecords[concept]
    : undefined;
  const computedConceptDataForReport: PaymentRecord[] | undefined = computedConceptData
    ? computedConceptData.filter((record) =>
        hasTowerFilter
          ? normalizeTower(resolveTowerByRecord(record)) === normalizedTowerFilter
          : true
      )
    : undefined;

  // Función de formateo de moneda sin el prefijo "MX"
  const formatCurrency = (value: number): string =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const generatePDF = async () => {
    const doc = new jsPDF();
    let generalTableStartY = 95;

    // --- Cálculo de mes con mayor y menor ingresos ---
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
    const computedMonthlyStatsForTower: MonthlyStat[] = monthKeys.map((month) => {
      const monthRecords = allDetailedRecordsForReport.filter(
        (record) => normalizeRecordMonth(record.month) === month
      );
      const monthCharges = monthRecords.reduce(
        (sum, record) => sum + record.referenceAmount,
        0
      );
      const monthPaid = monthRecords.reduce(
        (sum, record) => sum + record.amountPaid,
        0
      );
      const monthCreditUsed = monthRecords.reduce(
        (sum, record) => sum + (record.creditUsed || 0),
        0
      );
      const monthCreditBalance = monthRecords.reduce(
        (sum, record) => sum + Math.max(0, record.creditBalance || 0),
        0
      );
      const monthPaidWithCredit =
        monthPaid + monthCreditBalance - monthCreditUsed;
      const monthPending = monthRecords.reduce(
        (sum, record) => sum + record.amountPending,
        0
      );
      const monthPaidInFull = monthRecords
        .filter((record) => record.amountPending === 0)
        .reduce((sum, record) => sum + record.referenceAmount, 0);
      const complianceRate =
        monthCharges > 0 ? (monthPaidInFull / monthCharges) * 100 : 0;
      return {
        month,
        paid: monthPaidWithCredit,
        pending: monthPending,
        saldo: monthCreditBalance - monthCreditUsed,
        unidentifiedPayments: 0,
        complianceRate,
        delinquencyRate: 100 - complianceRate,
        creditUsed: monthCreditUsed,
        charges: monthCharges,
      };
    });
    const monthlyStatsForReport = hasTowerFilter
      ? computedMonthlyStatsForTower
      : monthlyStats;

    const sortedMonthlyStats = [...monthlyStatsForReport].sort(
      (a, b) => parseInt(a.month, 10) - parseInt(b.month, 10)
    );
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonthNumber = now.getMonth() + 1;
    const currentStats =
      year === currentYear
        ? sortedMonthlyStats.filter(
            (stat) => parseInt(stat.month, 10) <= currentMonthNumber
          )
        : sortedMonthlyStats;
    const nonZeroStats = currentStats.filter((stat) => stat.paid > 0);
    let computedMinMonth = "Junio"; // Establecemos Junio como el mes con menor ingresos
    let computedMaxMonth = "";
    if (currentStats.length > 0) {
      // Solo calculamos el mes con mayor ingresos
      if (nonZeroStats.length > 0) {
        const sortedByPaidDesc = [...nonZeroStats].sort(
          (a, b) => b.paid - a.paid
        );
        computedMaxMonth =
          monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
      } else {
        const sortedByPaidDesc = [...currentStats].sort(
          (a, b) => b.paid - a.paid
        );
        computedMaxMonth =
          monthNames[sortedByPaidDesc[0].month] || sortedByPaidDesc[0].month;
      }
    }

    const totalSpentExpenses = useExpenseSummaryStore.getState().totalSpent || 0;
    const recordsForTotals = hasTowerFilter ? allDetailedRecordsForReport : payments;
    const totalPaid = recordsForTotals.reduce(
      (acc, payment) => acc + payment.amountPaid,
      0
    );
    const totalCreditUsed = recordsForTotals.reduce(
      (acc, payment) => acc + (payment.creditUsed || 0),
      0
    );
    const totalCreditBalance = recordsForTotals.reduce(
      (acc, payment) => acc + payment.creditBalance,
      0
    );
    const ingresosPeriodo =
      totalPaid +
      (totalCreditBalance > 0 ? totalCreditBalance : 0) -
      totalCreditUsed;
    const saldoInicialHistorico = totalInitialBalance;
    const flujoNetoPeriodo = ingresosPeriodo - totalSpentExpenses;
    const saldoActualConsolidado = saldoInicialHistorico + flujoNetoPeriodo;

    // --- Encabezado: Logo y Datos Generales ---
    if (logoBase64 && String(logoBase64).trim().length > 0) {
      try {
        const rawLogo = String(logoBase64).trim();
        if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) {
          const remoteLogo = await getBase64FromUrl(rawLogo);
          doc.addImage(remoteLogo, "JPEG", 160, 10, 30, 30);
        } else if (
          rawLogo.startsWith("data:image/jpeg") ||
          rawLogo.startsWith("data:image/jpg")
        ) {
          doc.addImage(rawLogo, "JPEG", 160, 10, 30, 30);
        } else {
          doc.addImage(rawLogo, "PNG", 160, 10, 30, 30);
        }
      } catch (error) {
        console.error("No se pudo renderizar el logo en el PDF:", error);
      }
    }
    doc.setFontSize(14);
    if (concept) {
      doc.text(`Reporte de ingresos - Concepto: ${concept}`, 14, 20);
    } else {
      doc.text("Reporte general de ingresos", 14, 20);
    }
    doc.setFontSize(10);
    doc.text(`Torre: ${hasTowerFilter ? tower : "Todas"}`, 14, 44);
    doc.setFontSize(12);
    const reportDate = new Date().toLocaleString();
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 30);
    doc.setFont("helvetica", "normal");
    doc.text(reportDate, 14 + doc.getTextWidth("Fecha:") + 2, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Año:", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.text(year || "Todos los años", 14 + doc.getTextWidth("Año:") + 2, 40);

    if (!concept) {
      const kpiRows = [
        [
          "Saldo inicial histórico",
          formatCurrency(saldoInicialHistorico),
          "Base de arranque de cuentas activas.",
        ],
        [
          "Ingresos del período",
          formatCurrency(ingresosPeriodo),
          "Monto neto abonado del periodo seleccionado.",
        ],
        [
          "Egresos del período",
          formatCurrency(totalSpentExpenses),
          "Salidas registradas en el mismo periodo.",
        ],
        [
          "Flujo neto del período",
          formatCurrency(flujoNetoPeriodo),
          "Ingresos del período menos egresos del período.",
        ],
        [
          "Saldo actual consolidado",
          formatCurrency(saldoActualConsolidado),
          "Saldo inicial histórico + flujo neto del período.",
        ],
      ];

      autoTable(doc, {
        startY: 48,
        head: [["KPI", "Valor", "Descripción"]],
        body: kpiRows,
        theme: "grid",
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 48, fontStyle: "bold" },
          1: { cellWidth: 36 },
          2: { cellWidth: 96 },
        },
      });

      const kpiFinalY = (doc as any).lastAutoTable?.finalY || 86;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Mes con mayor ingresos:", 14, kpiFinalY + 8);
      doc.setFont("helvetica", "normal");
      doc.text(
        computedMaxMonth || "N/A",
        14 + doc.getTextWidth("Mes con mayor ingresos:") + 4,
        kpiFinalY + 8
      );
      doc.setFont("helvetica", "bold");
      doc.text("Mes con menor ingresos:", 14, kpiFinalY + 14);
      doc.setFont("helvetica", "normal");
      doc.text(
        computedMinMonth || "N/A",
        14 + doc.getTextWidth("Mes con menor ingresos:") + 4,
        kpiFinalY + 14
      );

      // Espacio adicional para evitar cualquier solapamiento visual con el título de la tabla.
      generalTableStartY = kpiFinalY + 28;
    }

    // --- Reporte Individual por Concepto ---
    if (concept && computedConceptDataForReport) {
      let totalPaid = 0,
        totalPendingConcept = 0,
        totalCredit = 0;
      let globalTotalRecords = 0,
        globalPaidRecords = 0;
      const rows = monthKeys.map((m) => {
        const recsForMonth = computedConceptDataForReport.filter(
          (rec) => normalizeRecordMonth(rec.month) === m
        );

        // Calcular los totales para este mes
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

        // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
        const paid =
          monthPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          monthCreditUsed;
        const pending = recsForMonth.reduce(
          (sum, rec) => sum + rec.amountPending,
          0
        );
        // Saldo a favor es el saldo disponible menos el usado
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
      const totalCompliance =
        globalTotalRecords > 0
          ? (globalPaidRecords / globalTotalRecords) * 100
          : 0;
      const totalDelinquency = 100 - totalCompliance;
      rows.push([
        "Total",
        formatCurrency(totalPaid),
        formatCurrency(totalPendingConcept),
        formatCurrency(totalCredit),
        globalTotalRecords > 0 ? totalCompliance.toFixed(2) + "%" : "0.00%",
        globalTotalRecords > 0 ? totalDelinquency.toFixed(2) + "%" : "0.00%",
      ]);

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "Mes",
            "Monto Abonado",
            "Monto Pendiente",
            "Saldo a favor",
            "% Cumplimiento",
            "% Morosidad",
          ],
        ],
        body: rows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Detalle por condomino filtrado por concepto
      const sortedCondominiums = [...filteredCondominiums].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true })
      );
      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 10
        : 95;
      sortedCondominiums.forEach((cond) => {
        const condDataFull = detailedForReport[cond.key] || [];
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
          const recordsForMonth = condData.filter(
            (item) => normalizeRecordMonth(item.month) === m
          );
          // Calcular los totales para este mes
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

          // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
          const amountPaid =
            monthPaid +
            monthCreditUsed +
            (monthCreditBalance - monthCreditUsed);
          const amountPending = recordsForMonth.reduce(
            (sum, r) => sum + r.amountPending,
            0
          );
          // Saldo a favor es el saldo disponible menos el usado
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
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const towerInfo = cond.tower ? ` - ${cond.tower}` : "";
        doc.text(
          `Detalle del Condomino: ${cond.number}${towerInfo}${
            cond.name ? " - " + cond.name : ""
          }`,
          14,
          currentY
        );
        currentY += 6;
        autoTable(doc, {
          startY: currentY,
          head: [["Mes", "Monto Abonado", "Monto Pendiente", "Saldo a favor"]],
          body: condRows,
          headStyles: {
            fillColor: [75, 68, 224],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 10 },
          didParseCell: (data) => {
            if (data.row.index === condRows.length - 1) {
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        currentY = (doc as any).lastAutoTable
          ? (doc as any).lastAutoTable.finalY + 10
          : currentY + 10;
      });
    } else {
      // --- Reporte General ---
      const compRows = monthlyStatsForReport.map((stat) => {
        // Obtener todos los registros del mes
        const monthRecords = Object.values(detailedForReport)
          .flat()
          .filter((rec) => normalizeRecordMonth(rec.month) === stat.month);

        // 1. Cargos: Usar el valor de charges del monthlyStats
        const totalCharges = stat.charges;

        // 2. Monto Abonado: Calcular el saldo a favor generado en este mes específico
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        // Calcular el saldo a favor generado en este mes específico
        const monthCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        const totalPaidWithCredit =
          totalPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          totalCreditUsed;

        // 3. Saldo: Diferencia entre cargos y monto abonado
        const balance = totalCharges - totalPaidWithCredit;

        // Calcular porcentajes de cumplimiento y morosidad
        const monthCharges = monthRecords.reduce(
          (sum, rec) => sum + rec.referenceAmount,
          0
        );
        const monthPaidInFull = monthRecords
          .filter((rec) => rec.amountPending === 0)
          .reduce((sum, rec) => sum + rec.referenceAmount, 0);
        const complianceRate =
          monthCharges > 0 ? (monthPaidInFull / monthCharges) * 100 : 0;
        const delinquencyRate = 100 - complianceRate;

        return [
          monthNames[stat.month] || stat.month,
          formatCurrency(totalPaidWithCredit),
          formatCurrency(totalCharges),
          formatCurrency(balance),
          formatCurrency(stat.unidentifiedPayments),
          complianceRate.toFixed(2) + "%",
          delinquencyRate.toFixed(2) + "%",
        ];
      });

      let totalPaidGlobal = 0,
        totalChargesGlobal = 0,
        totalBalanceGlobal = 0,
        totalUnidentifiedGlobal = 0;

      // Calcular totales globales
      monthlyStatsForReport.forEach((stat) => {
        const monthRecords = Object.values(detailedForReport)
          .flat()
          .filter((rec) => normalizeRecordMonth(rec.month) === stat.month);

        const totalCharges = stat.charges;
        const totalPaid = monthRecords.reduce(
          (sum, rec) => sum + rec.amountPaid,
          0
        );
        const totalCreditUsed = monthRecords.reduce(
          (sum, rec) => sum + (rec.creditUsed || 0),
          0
        );
        const monthCreditBalance = monthRecords.reduce(
          (sum, rec) => sum + rec.creditBalance,
          0
        );

        const totalPaidWithCredit =
          totalPaid +
          (monthCreditBalance > 0 ? monthCreditBalance : 0) -
          totalCreditUsed;

        const balance = totalCharges - totalPaidWithCredit;

        totalPaidGlobal += totalPaidWithCredit;
        totalChargesGlobal += totalCharges;
        totalBalanceGlobal += balance;
        totalUnidentifiedGlobal += stat.unidentifiedPayments;
      });

      // Calcular porcentajes globales
      const allRecords = Object.values(detailedForReport).flat();
      const totalCharges = allRecords.reduce(
        (sum, rec) => sum + rec.referenceAmount,
        0
      );
      const totalPaidInFull = allRecords
        .filter((rec) => rec.amountPending === 0)
        .reduce((sum, rec) => sum + rec.referenceAmount, 0);
      const totalCompliance =
        totalCharges > 0 ? (totalPaidInFull / totalCharges) * 100 : 0;
      const totalDelinquency = 100 - totalCompliance;

      compRows.push([
        "Total",
        formatCurrency(totalPaidGlobal),
        formatCurrency(totalChargesGlobal),
        formatCurrency(totalBalanceGlobal),
        formatCurrency(totalUnidentifiedGlobal),
        totalCompliance.toFixed(2) + "%",
        totalDelinquency.toFixed(2) + "%",
      ]);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Ingresos del período", 14, generalTableStartY - 8);

      autoTable(doc, {
        startY: generalTableStartY,
        head: [
          [
            "Mes",
            "Monto Abonado",
            "Cargos",
            "Saldo",
            "Pagos no identificados",
            "% Cumplimiento",
            "% Morosidad",
          ],
        ],
        body: compRows,
        headStyles: {
          fillColor: [75, 68, 224],
          textColor: 255,
          fontStyle: "bold",
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
          if (data.row.index === compRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      const afterTableY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 5
        : 100;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        "*Únicamente las cuotas que se han cubierto en su totalidad son contempladas en el %Cumplimiento.",
        14,
        afterTableY
      );

      let currentY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 15
        : 95;
      const conceptRecordsForReport: Record<string, PaymentRecord[]> = hasTowerFilter
        ? (Object.fromEntries(
            Object.entries(conceptRecords).map(([conceptKey, recs]) => [
              conceptKey,
              recs.filter(
                (rec) =>
                  normalizeTower(resolveTowerByRecord(rec)) === normalizedTowerFilter
              ),
            ])
          ) as Record<string, PaymentRecord[]>)
        : conceptRecords;
      if (
        conceptRecordsForReport &&
        Object.keys(conceptRecordsForReport).length > 0
      ) {
        (Object.entries(conceptRecordsForReport) as [string, PaymentRecord[]][]).forEach(
          ([conceptKey, recs]) => {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Ingresos - Concepto: ${conceptKey}`, 14, currentY);
            currentY += 6;
            let totalPaidConcept = 0,
              totalPendingConcept = 0,
              totalChargesConcept = 0,
              totalCreditConcept = 0;
            let globalTotalRecords = 0,
              globalPaidRecords = 0;
            const rows = monthKeys.map((m) => {
              const recordsForMonth = recs.filter(
                (r) => normalizeRecordMonth(r.month) === m
              );
              // Calcular los totales para este mes
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

              // Monto abonado es la suma de pagos regulares + crédito usado + saldo disponible
              const paid =
                monthPaid +
                (monthCreditBalance > 0 ? monthCreditBalance : 0) -
                monthCreditUsed;
              const pending = recordsForMonth.reduce(
                (sum, r) => sum + r.amountPending,
                0
              );
              // Saldo a favor es el saldo disponible menos el usado
              const credit = monthCreditBalance - monthCreditUsed;

              totalPaidConcept += paid;
              totalPendingConcept += pending;
              totalChargesConcept += totalCharges;
              totalCreditConcept += credit;
              globalTotalRecords += recordsForMonth.length;
              globalPaidRecords += recordsForMonth.filter((r) => r.paid).length;
              const compliance =
                recordsForMonth.length > 0
                  ? (recordsForMonth.filter((r) => r.paid).length /
                      recordsForMonth.length) *
                    100
                  : 0;
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
            rows.push([
              "Total",
              formatCurrency(totalPaidConcept),
              formatCurrency(totalChargesConcept),
              formatCurrency(totalChargesConcept - totalPaidConcept),
              globalTotalRecords > 0
                ? totalCompliance.toFixed(2) + "%"
                : "0.00%",
              globalTotalRecords > 0
                ? totalDelinquency.toFixed(2) + "%"
                : "0.00%",
            ]);
            autoTable(doc, {
              startY: currentY,
              head: [
                [
                  "Mes",
                  "Monto Abonado",
                  "Cargos",
                  "Saldo",
                  "% Cumplimiento",
                  "% Morosidad",
                ],
              ],
              body: rows,
              headStyles: {
                fillColor: [75, 68, 224],
                textColor: 255,
                fontStyle: "bold",
              },
              styles: { fontSize: 10 },
              didParseCell: (data) => {
                if (data.row.index === rows.length - 1) {
                  data.cell.styles.fontStyle = "bold";
                }
              },
            });
            currentY = (doc as any).lastAutoTable
              ? (doc as any).lastAutoTable.finalY + 10
              : currentY + 10;
          }
        );
      }
    }

    // --- Página para firma y datos de la administradora ---
    doc.addPage();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const adminSectionY = pageHeight - 80;

    if (signatureUrl) {
      try {
        const signatureImage = await getBase64FromUrl(signatureUrl);
        doc.addImage(
          signatureImage,
          "JPEG",
          margin,
          adminSectionY - 20,
          50,
          20
        );
      } catch (error) {
        console.error("Error al cargar la firma:", error);
      }
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

    const generatedAt = new Date().toLocaleString("es-MX");
    const totalPages = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`EstateAdmin - ${generatedAt}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });
    }

    const towerSuffix = hasTowerFilter
      ? `_torre_${String(tower || "")
          .trim()
          .replace(/\s+/g, "_")}`
      : "";
    if (concept) {
      doc.save(`reporte_ingresos_${year}_${concept}${towerSuffix}.pdf`);
    } else {
      doc.save(`reporte_ingresos_${year}${towerSuffix}.pdf`);
    }
  };

  return renderButton ? (
    renderButton(generatePDF)
  ) : (
    <div className="flex">
      <button
        onClick={generatePDF}
        className="bg-indigo-600 text-white text-sm py-2 px-3 rounded font-medium hover:bg-indigo-700"
      >
        {concept ? `${concept}` : "Reporte General"}
      </button>
    </div>
  );
};

export default PDFReportGeneratorByTower;
