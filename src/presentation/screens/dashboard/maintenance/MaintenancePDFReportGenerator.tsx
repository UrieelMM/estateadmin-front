import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useMaintenanceReportStore,
  useMaintenanceAppointmentStore,
  useMaintenanceContractStore,
  useMaintenanceCostStore,
  MaintenanceReport,
  MaintenanceAppointment,
  MaintenanceContract,
  MaintenanceCost,
} from "../../../../store/useMaintenanceStore";
import { useTicketsStore, Ticket } from "./tickets/ticketsStore";
import { useSignaturesStore } from "../../../../store/useSignaturesStore";
import moment from "moment";
import "moment/locale/es";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";

// Configurar moment en español
moment.locale("es");

// Diccionario para traducir meses de inglés a español
const mesesEnEspanol: Record<string, string> = {
  January: "Enero",
  February: "Febrero",
  March: "Marzo",
  April: "Abril",
  May: "Mayo",
  June: "Junio",
  July: "Julio",
  August: "Agosto",
  September: "Septiembre",
  October: "Octubre",
  November: "Noviembre",
  December: "Diciembre",
};

// Función para traducir fecha con mes en español
const traducirFecha = (fecha: string): string => {
  // Si ya está en español, devolver como está
  if (Object.values(mesesEnEspanol).some((mes) => fecha.includes(mes))) {
    return fecha;
  }

  // Traducir mes en inglés a español
  for (const [mesIngles, mesEspanol] of Object.entries(mesesEnEspanol)) {
    if (fecha.includes(mesIngles)) {
      return fecha.replace(mesIngles, mesEspanol);
    }
  }

  return fecha; // Si no se encuentra coincidencia, devolver como está
};

// Formateador de moneda
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100); // Los costos se almacenan en centavos

interface DateFilter {
  startDate: string;
  endDate: string;
}

interface MaintenancePDFReportProps {
  dateFilter: DateFilter;
  buttonClassName?: string;
}

const MaintenancePDFReportGenerator: React.FC<MaintenancePDFReportProps> = ({
  dateFilter,
  buttonClassName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { reports } = useMaintenanceReportStore();
  const { tickets } = useTicketsStore();
  const { appointments } = useMaintenanceAppointmentStore();
  const { contracts } = useMaintenanceContractStore();
  const { costs } = useMaintenanceCostStore();
  const {
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    signatureUrl,
    fetchSignatures,
    ensureSignaturesLoaded,
  } = useSignaturesStore();
  const [providers, setProviders] = useState<Record<string, string>>({});

  // Función para obtener proveedores desde Firestore
  const fetchProviders = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      if (!clientId) throw new Error("No se encontró clientId en los claims");

      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const providersRef = collection(
        db,
        "clients",
        clientId,
        "condominiums",
        condominiumId,
        "providersList"
      );

      const providersSnap = await getDocs(query(providersRef));
      const providersData: Record<string, string> = {};

      providersSnap.forEach((doc) => {
        const providerData = doc.data();
        providersData[doc.id] =
          providerData.companyName ||
          providerData.name ||
          "Proveedor sin nombre";
      });

      setProviders(providersData);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

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

  // Obtener proveedores al cargar el componente
  useEffect(() => {
    fetchProviders();
  }, []);

  // Mapear estados de tickets a español
  const mapTicketStatus = (status: string) => {
    switch (status) {
      case "abierto":
        return "Abierto";
      case "en_progreso":
        return "En progreso";
      case "cerrado":
        return "Cerrado";
      default:
        return status;
    }
  };

  // Mapear prioridades de tickets a español
  const mapTicketPriority = (priority?: string) => {
    if (!priority) return "Normal";
    switch (priority) {
      case "baja":
        return "Baja";
      case "media":
        return "Media";
      case "alta":
        return "Alta";
      default:
        return priority;
    }
  };

  // Función para filtrar datos por el rango de fechas
  const filterByDateRange = <T extends { [key: string]: any }>(
    items: T[],
    dateField: string
  ): T[] => {
    const start = new Date(dateFilter.startDate);
    const end = new Date(dateFilter.endDate);

    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Agrupar elementos por mes
  const groupByMonth = <T extends { [key: string]: any }>(
    items: T[],
    dateField: string
  ): Record<string, T[]> => {
    const grouped: Record<string, T[]> = {};

    items.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(item);
    });

    return grouped;
  };

  // Función para limpiar HTML y limitar caracteres
  const cleanHtml = (htmlString: string, maxChars: number = 250): string => {
    if (!htmlString) return "";

    // Eliminar todas las etiquetas HTML
    const textOnly = htmlString
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limitar a maxChars caracteres
    if (textOnly.length > maxChars) {
      return textOnly.substring(0, maxChars) + "...";
    }

    return textOnly;
  };

  // Funciones para generar secciones específicas del reporte
  const generateReportSection = (doc: jsPDF, currentY: number): number => {
    const filteredReports = filterByDateRange<MaintenanceReport>(
      reports,
      "fecha"
    );
    const reportsByMonth = groupByMonth<MaintenanceReport>(
      filteredReports,
      "fecha"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reportes de Mantenimiento", 14, currentY);
    currentY += 6;

    // Si no hay reportes, mostrar mensaje
    if (filteredReports.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay reportes en el periodo seleccionado", 14, currentY);
      return currentY + 10;
    }

    // Agrupar por área
    const reportsByArea: Record<string, number> = {};
    filteredReports.forEach((report) => {
      if (!reportsByArea[report.area]) {
        reportsByArea[report.area] = 0;
      }
      reportsByArea[report.area]++;
    });

    // Tabla de reportes por área
    const areaRows = Object.entries(reportsByArea).map(([area, count]) => [
      area,
      count.toString(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Área", "Cantidad de Reportes"]],
      body: areaRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Tabla por mes
    const monthRows = Object.entries(reportsByMonth).map(
      ([month, monthReports]) => {
        const [year, monthNum] = month.split("-");
        const monthName = moment(`${year}-${monthNum}-01`).format("MMMM YYYY");
        // Traducir el nombre del mes
        const monthNameSpanish = traducirFecha(monthName);
        return [monthNameSpanish, monthReports.length.toString()];
      }
    );

    doc.setFont("helvetica", "bold");
    doc.text("Reportes por Mes", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [["Mes", "Cantidad de Reportes"]],
      body: monthRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // NUEVO: Tabla detallada de reportes
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Reportes", 14, currentY);
    currentY += 6;

    // Preparar filas de reportes con detalles
    const detailedReportRows = filteredReports.map((report) => [
      moment(report.fecha).format("DD/MM/YYYY"),
      report.area,
      report.encargado || "Sin responsable",
      cleanHtml(report.detalle, 250), // Limpiamos HTML y limitamos a 250 caracteres
      report.evidenciaUrl ? "Con evidencia" : "Sin evidencia",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Fecha", "Área", "Encargado", "Detalle", "Evidencia"]],
      body: detailedReportRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { cellWidth: 50 },
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  };

  const generateTicketSection = (doc: jsPDF, currentY: number): number => {
    const filteredTickets = filterByDateRange<Ticket>(tickets, "createdAt");
    const ticketsByMonth = groupByMonth<Ticket>(filteredTickets, "createdAt");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Tickets de Mantenimiento", 14, currentY);
    currentY += 6;

    // Si no hay tickets, mostrar mensaje
    if (filteredTickets.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay tickets en el periodo seleccionado", 14, currentY);
      return currentY + 10;
    }

    // Estadísticas por estado
    const ticketsByStatus: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      const status = mapTicketStatus(ticket.status);
      if (!ticketsByStatus[status]) {
        ticketsByStatus[status] = 0;
      }
      ticketsByStatus[status]++;
    });

    const statusRows = Object.entries(ticketsByStatus).map(
      ([status, count]) => [status, count.toString()]
    );

    autoTable(doc, {
      startY: currentY,
      head: [["Estado", "Cantidad"]],
      body: statusRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Estadísticas por prioridad
    const ticketsByPriority: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      const priority = mapTicketPriority(ticket.priority);
      if (!ticketsByPriority[priority]) {
        ticketsByPriority[priority] = 0;
      }
      ticketsByPriority[priority]++;
    });

    const priorityRows = Object.entries(ticketsByPriority).map(
      ([priority, count]) => [priority, count.toString()]
    );

    doc.setFont("helvetica", "bold");
    doc.text("Tickets por Prioridad", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [["Prioridad", "Cantidad"]],
      body: priorityRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Tickets por mes
    const monthRows = Object.entries(ticketsByMonth).map(
      ([month, monthTickets]) => {
        const [year, monthNum] = month.split("-");
        const monthName = moment(`${year}-${monthNum}-01`).format("MMMM YYYY");
        // Traducir el nombre del mes
        const monthNameSpanish = traducirFecha(monthName);

        const open = monthTickets.filter((t) => t.status === "abierto").length;
        const inProgress = monthTickets.filter(
          (t) => t.status === "en_progreso"
        ).length;
        const closed = monthTickets.filter(
          (t) => t.status === "cerrado"
        ).length;

        return [
          monthNameSpanish,
          monthTickets.length.toString(),
          open.toString(),
          inProgress.toString(),
          closed.toString(),
        ];
      }
    );

    doc.setFont("helvetica", "bold");
    doc.text("Tickets por Mes", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [["Mes", "Total", "Abiertos", "En Progreso", "Cerrados"]],
      body: monthRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // NUEVO: Tabla detallada de tickets
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Tickets", 14, currentY);
    currentY += 6;

    // Preparar filas de tickets con detalles
    const detailedTicketRows = filteredTickets.map((ticket) => [
      moment(ticket.createdAt).format("DD/MM/YYYY"),
      ticket.folio || "N/A",
      ticket.title
        ? ticket.title.length > 30
          ? ticket.title.substring(0, 30) + "..."
          : ticket.title
        : "Sin título",
      cleanHtml(ticket.description, 250), // Limpiamos HTML y limitamos a 250 caracteres
      mapTicketStatus(ticket.status),
      ticket.area || "No especificada",
      // Mostrar nombre del proveedor en lugar del ID
      ticket.providerId
        ? providers[ticket.providerId] || "Proveedor no encontrado"
        : "No asignado",
      mapTicketPriority(ticket.priority),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Fecha",
          "Núm. Ticket",
          "Título",
          "Descripción",
          "Estado",
          "Área Común",
          "Proveedor",
          "Prioridad",
        ],
      ],
      body: detailedTicketRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { cellWidth: 50 },
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  };

  const generateAppointmentSection = (doc: jsPDF, currentY: number): number => {
    const filteredAppointments = filterByDateRange<MaintenanceAppointment>(
      appointments,
      "date"
    );
    const appointmentsByMonth = groupByMonth<MaintenanceAppointment>(
      filteredAppointments,
      "date"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Citas de Mantenimiento", 14, currentY);
    currentY += 6;

    // Si no hay citas, mostrar mensaje
    if (filteredAppointments.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay citas en el periodo seleccionado", 14, currentY);
      return currentY + 10;
    }

    // Estadísticas por estado
    const appointmentsByStatus: Record<string, number> = {};
    filteredAppointments.forEach((appointment) => {
      if (!appointmentsByStatus[appointment.status]) {
        appointmentsByStatus[appointment.status] = 0;
      }
      appointmentsByStatus[appointment.status]++;
    });

    const statusRows = Object.entries(appointmentsByStatus).map(
      ([status, count]) => {
        let statusText = status;
        switch (status) {
          case "pending":
            statusText = "Pendiente";
            break;
          case "completed":
            statusText = "Completada";
            break;
          case "cancelled":
            statusText = "Cancelada";
            break;
          case "in_progress":
            statusText = "En Progreso";
            break;
        }
        return [statusText, count.toString()];
      }
    );

    autoTable(doc, {
      startY: currentY,
      head: [["Estado", "Cantidad"]],
      body: statusRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Citas por mes
    const monthRows = Object.entries(appointmentsByMonth).map(
      ([month, monthAppointments]) => {
        const [year, monthNum] = month.split("-");
        const monthName = moment(`${year}-${monthNum}-01`).format("MMMM YYYY");
        // Traducir el nombre del mes
        const monthNameSpanish = traducirFecha(monthName);

        const pending = monthAppointments.filter(
          (a) => a.status === "pending"
        ).length;
        const inProgress = monthAppointments.filter(
          (a) => a.status === "in_progress"
        ).length;
        const completed = monthAppointments.filter(
          (a) => a.status === "completed"
        ).length;
        const cancelled = monthAppointments.filter(
          (a) => a.status === "cancelled"
        ).length;

        return [
          monthNameSpanish,
          monthAppointments.length.toString(),
          pending.toString(),
          inProgress.toString(),
          completed.toString(),
          cancelled.toString(),
        ];
      }
    );

    doc.setFont("helvetica", "bold");
    doc.text("Citas por Mes", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Mes",
          "Total",
          "Pendientes",
          "En Progreso",
          "Completadas",
          "Canceladas",
        ],
      ],
      body: monthRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // NUEVO: Tabla detallada de citas
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Citas", 14, currentY);
    currentY += 6;

    // Preparar filas de citas con detalles
    const detailedAppointmentRows = filteredAppointments.map((appointment) => {
      let statusText;
      switch (appointment.status) {
        case "pending":
          statusText = "Pendiente";
          break;
        case "completed":
          statusText = "Completada";
          break;
        case "cancelled":
          statusText = "Cancelada";
          break;
        case "in_progress":
          statusText = "En Progreso";
          break;
        default:
          statusText = appointment.status;
      }

      return [
        moment(appointment.date).format("DD/MM/YYYY"),
        appointment.time || "No especificada",
        appointment.title || "Sin título",
        cleanHtml(appointment.description, 250), // Limpiamos HTML y limitamos a 250 caracteres
        statusText,
        appointment.location || "No especificada",
        appointment.technician || "No asignado",
        appointment.contactPhone || "No especificado",
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Fecha",
          "Hora",
          "Título",
          "Descripción",
          "Estado",
          "Ubicación",
          "Técnico",
          "Teléfono",
        ],
      ],
      body: detailedAppointmentRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { cellWidth: 50 },
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  };

  const generateContractSection = (doc: jsPDF, currentY: number): number => {
    const filteredContracts = filterByDateRange<MaintenanceContract>(
      contracts,
      "startDate"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Contratos de Mantenimiento", 14, currentY);
    currentY += 6;

    // Si no hay contratos, mostrar mensaje
    if (filteredContracts.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay contratos en el periodo seleccionado", 14, currentY);
      return currentY + 10;
    }

    // Estadísticas por estado
    const contractsByStatus: Record<string, number> = {};
    filteredContracts.forEach((contract) => {
      if (!contractsByStatus[contract.status]) {
        contractsByStatus[contract.status] = 0;
      }
      contractsByStatus[contract.status]++;
    });

    const statusRows = Object.entries(contractsByStatus).map(
      ([status, count]) => {
        let statusText = status;
        switch (status) {
          case "active":
            statusText = "Activo";
            break;
          case "pending":
            statusText = "Pendiente";
            break;
          case "expired":
            statusText = "Vencido";
            break;
          case "cancelled":
            statusText = "Cancelado";
            break;
        }
        return [statusText, count.toString()];
      }
    );

    autoTable(doc, {
      startY: currentY,
      head: [["Estado", "Cantidad"]],
      body: statusRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // NUEVO: Tabla detallada de contratos con más información
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Contratos", 14, currentY);
    currentY += 6;

    // Preparar filas de contratos con detalles
    const detailedContractRows = filteredContracts.map((contract) => {
      let statusText;
      switch (contract.status) {
        case "active":
          statusText = "Activo";
          break;
        case "pending":
          statusText = "Pendiente";
          break;
        case "expired":
          statusText = "Vencido";
          break;
        case "cancelled":
          statusText = "Cancelado";
          break;
        default:
          statusText = contract.status;
      }

      return [
        contract.id?.substring(0, 8) || "N/A",
        contract.providerName,
        contract.serviceType,
        formatCurrency(contract.value),
        moment(contract.startDate).format("DD/MM/YYYY"),
        moment(contract.endDate).format("DD/MM/YYYY"),
        statusText,
        cleanHtml(contract.description, 250), // Limpiamos HTML y limitamos a 250 caracteres
        contract.contactName || "No especificado",
        contract.notes || "No especificado",
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "#ID",
          "Proveedor",
          "Servicio",
          "Valor",
          "Inicio",
          "Fin",
          "Estado",
          "Descripción",
          "Contacto",
          "Notas",
        ],
      ],
      body: detailedContractRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
      columnStyles: {
        7: { cellWidth: 40 },
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  };

  const generateCostSection = (doc: jsPDF, currentY: number): number => {
    const filteredCosts = filterByDateRange<MaintenanceCost>(costs, "date");
    const costsByMonth = groupByMonth<MaintenanceCost>(filteredCosts, "date");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Costos de Mantenimiento", 14, currentY);
    currentY += 6;

    // Si no hay costos, mostrar mensaje
    if (filteredCosts.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay costos en el periodo seleccionado", 14, currentY);
      return currentY + 10;
    }

    // Totales
    const totalAmount = filteredCosts.reduce(
      (sum, cost) => sum + cost.amount,
      0
    );
    const totalPending = filteredCosts
      .filter((cost) => cost.status === "pending")
      .reduce((sum, cost) => sum + cost.amount, 0);
    const totalPaid = filteredCosts
      .filter((cost) => cost.status === "paid")
      .reduce((sum, cost) => sum + cost.amount, 0);

    // Estadísticas por categoría
    const costsByCategory: Record<string, number> = {};
    filteredCosts.forEach((cost) => {
      if (!costsByCategory[cost.category]) {
        costsByCategory[cost.category] = 0;
      }
      costsByCategory[cost.category] += cost.amount;
    });

    const categoryRows = Object.entries(costsByCategory).map(
      ([category, amount]) => [category, formatCurrency(amount)]
    );

    // Añadir fila de totales
    categoryRows.push(["Total", formatCurrency(totalAmount)]);

    autoTable(doc, {
      startY: currentY,
      head: [["Categoría", "Monto"]],
      body: categoryRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.row.index === categoryRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Costos por mes
    const monthRows = Object.entries(costsByMonth).map(
      ([month, monthCosts]) => {
        const [year, monthNum] = month.split("-");
        const monthName = moment(`${year}-${monthNum}-01`).format("MMMM YYYY");

        const total = monthCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const pending = monthCosts
          .filter((cost) => cost.status === "pending")
          .reduce((sum, cost) => sum + cost.amount, 0);
        const paid = monthCosts
          .filter((cost) => cost.status === "paid")
          .reduce((sum, cost) => sum + cost.amount, 0);

        return [
          traducirFecha(monthName),
          formatCurrency(total),
          formatCurrency(paid),
          formatCurrency(pending),
        ];
      }
    );

    // Añadir fila de totales
    monthRows.push([
      "Total",
      formatCurrency(totalAmount),
      formatCurrency(totalPaid),
      formatCurrency(totalPending),
    ]);

    doc.setFont("helvetica", "bold");
    doc.text("Costos por Mes", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [["Mes", "Total", "Pagado", "Pendiente"]],
      body: monthRows,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.row.index === monthRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // Asegurar que las firmas estén cargadas antes de generar el PDF
      await ensureSignaturesLoaded();

      // Asegurarse de que las firmas se carguen correctamente
      await fetchSignatures();

      if (!logoBase64) {
        console.warn("No se pudo cargar el logo después de reintentar.");
      }

      const doc = new jsPDF();

      // Configuración de Página
      const startDate = moment(dateFilter.startDate).format("DD/MM/YYYY");
      const endDate = moment(dateFilter.endDate).format("DD/MM/YYYY");
      const title = `Reporte de Mantenimiento (${startDate} - ${endDate})`;

      // --- Encabezado: Logo y Datos Generales ---
      if (logoBase64) {
        doc.addImage(logoBase64, "JPEG", 160, 10, 30, 30);
      }

      doc.setFontSize(14);
      doc.text(title, 14, 20);

      doc.setFontSize(12);
      const reportDate = new Date().toLocaleString("es-MX");
      doc.setFont("helvetica", "bold");
      doc.text("Fecha de generación:", 14, 30);
      doc.setFont("helvetica", "normal");
      doc.text(
        reportDate,
        14 + doc.getTextWidth("Fecha de generación:") + 2,
        30
      );

      doc.setFont("helvetica", "bold");
      doc.text("Periodo:", 14, 40);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${startDate} al ${endDate}`,
        14 + doc.getTextWidth("Periodo:") + 2,
        40
      );

      // --- Resumen General ---
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen General", 14, 50);

      const reportCount = filterByDateRange(reports, "fecha").length;
      const ticketCount = filterByDateRange(tickets, "createdAt").length;
      const appointmentCount = filterByDateRange(appointments, "date").length;
      const contractCount = filterByDateRange(contracts, "startDate").length;
      const costTotal = filterByDateRange(costs, "date").reduce(
        (sum, cost) => sum + cost.amount,
        0
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`• Reportes de mantenimiento: ${reportCount}`, 20, 60);
      doc.text(`• Tickets generados: ${ticketCount}`, 20, 68);
      doc.text(`• Citas agendadas: ${appointmentCount}`, 20, 76);
      doc.text(`• Contratos activos: ${contractCount}`, 20, 84);
      doc.text(
        `• Costo total de mantenimiento: ${formatCurrency(costTotal)}`,
        20,
        92
      );

      // --- Secciones Detalladas ---
      let currentY = 105;

      // Sección de Reportes
      currentY = generateReportSection(doc, currentY);

      // Añadir nueva página si no hay suficiente espacio
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 20;
      }

      // Sección de Tickets
      currentY = generateTicketSection(doc, currentY);

      // Añadir nueva página
      doc.addPage();
      currentY = 20;

      // Sección de Citas
      currentY = generateAppointmentSection(doc, currentY);

      // Añadir nueva página si no hay suficiente espacio
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 20;
      }

      // Sección de Contratos
      currentY = generateContractSection(doc, currentY);

      // Añadir nueva página
      doc.addPage();
      currentY = 20;

      // Sección de Costos
      currentY = generateCostSection(doc, currentY);

      // Página para firma y datos de la administradora
      doc.addPage();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const adminSectionY = pageHeight - 80;

      // Gestión de firma
      if (signatureUrl) {
         try {
           const processedSignature = await getBase64FromUrl(signatureUrl);
           doc.addImage(
             processedSignature,
             "JPEG",
             margin,
             adminSectionY - 20,
             50,
             20
           );
         } catch (error) {
           console.error("Error al procesar la firma:", error);
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

      // Guardar PDF
      const fileName = `reporte_mantenimiento_${moment().format(
        "YYYYMMDD_HHmmss"
      )}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className={
        buttonClassName ||
        "bg-indigo-600 text-white text-sm py-2 px-3 rounded font-medium hover:bg-indigo-700 disabled:bg-indigo-400"
      }
    >
      {isGenerating ? "Generando..." : "Generar Reporte PDF"}
    </button>
  );
};

export default MaintenancePDFReportGenerator;
