// ProjectPDFGenerator.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Project,
  ProjectStatus,
  useProjectStore,
} from "../../../../../store/projectStore";
import {
  ProjectTask,
  TaskPriority,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { DocumentTextIcon } from "@heroicons/react/24/solid";

// Mapeo de estados de proyecto a español
const projectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.IN_PROGRESS]: "En Progreso",
  [ProjectStatus.CANCELLED]: "Cancelado",
  [ProjectStatus.COMPLETED]: "Finalizado",
};

// Mapeo de estados de tareas a español
const taskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: "Pendientes",
  [TaskStatus.IN_PROGRESS]: "En progreso",
  [TaskStatus.REVIEW]: "Revisión",
  [TaskStatus.COMPLETED]: "Completado",
};

// Mapeo de prioridades a español
const taskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Baja",
  [TaskPriority.MEDIUM]: "Media",
  [TaskPriority.HIGH]: "Alta",
  [TaskPriority.URGENT]: "Urgente",
};

// Etiquetas para las categorías de gastos
const expenseTagLabels: Record<string, string> = {
  labor: "Mano de obra",
  materials: "Materiales",
  equipment: "Equipamiento",
  tools: "Herramientas",
  transportation: "Transporte",
  permits: "Permisos y licencias",
  consulting: "Consultoría",
  design: "Diseño",
  maintenance: "Mantenimiento",
  other: "Otros",
};

// Tipos de pagos en español
const paymentTypeLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  check: "Cheque",
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
};

// Función para formatear moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
};

// Función para formatear fechas
const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export interface ProjectPDFGeneratorProps {
  project: Project;
  logoBase64?: string;
  signatureBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
}

const ProjectPDFGenerator: React.FC<ProjectPDFGeneratorProps> = ({
  project,
  logoBase64,
  signatureBase64,
  adminCompany,
  adminPhone,
  adminEmail,
}) => {
  // Obtener los gastos del proyecto
  const { projectExpenses, fetchProjectExpenses } = useProjectStore();

  // Obtener las tareas del proyecto
  const { tasks, fetchProjectTasks } = useProjectTaskStore();

  const generatePDF = async () => {
    // Primero, aseguramos de tener los datos más recientes
    await fetchProjectExpenses(project.id);
    await fetchProjectTasks(project.id);

    // Crear documento PDF
    const doc = new jsPDF();

    // Variables para posicionamiento
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- ENCABEZADO ---
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", pageWidth - 40, 10, 30, 30);
    }

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE PROYECTO", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Información general del proyecto
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(project.name, 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Estatus: ${projectStatusLabels[project.status]}`, 14, yPos);
    yPos += 7;

    doc.text(
      `Fecha del reporte: ${new Date().toLocaleDateString("es-MX")}`,
      14,
      yPos
    );
    yPos += 7;

    // Descripción del proyecto
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descriptionLines = doc.splitTextToSize(
      project.description,
      pageWidth - 28
    );
    doc.text(descriptionLines, 14, yPos);
    yPos += descriptionLines.length * 5 + 10;

    // --- RESUMEN DEL PROYECTO ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen del Proyecto", 14, yPos);
    yPos += 10;

    // Calcular días transcurridos y restantes
    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    const daysElapsed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.floor(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular porcentaje de presupuesto utilizado
    const budgetUsedPercent =
      project.initialBudget > 0
        ? 100 - ((project.currentBudget || 0) / project.initialBudget) * 100
        : 0;

    // Tabla de resumen
    autoTable(doc, {
      startY: yPos,
      head: [["Concepto", "Valor"]],
      body: [
        ["Presupuesto inicial", formatCurrency(project.initialBudget)],
        ["Presupuesto restante", formatCurrency(project.currentBudget || 0)],
        ["Presupuesto utilizado", `${budgetUsedPercent.toFixed(2)}%`],
        ["Fecha de inicio", formatDate(project.startDate)],
        ["Fecha estimada de finalización", formatDate(project.endDate)],
        ["Días transcurridos", daysElapsed.toString()],
        [
          "Días restantes",
          daysRemaining > 0 ? daysRemaining.toString() : "Vencido",
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [67, 97, 238] },
      alternateRowStyles: { fillColor: [240, 240, 250] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- GASTOS DEL PROYECTO ---
    // Verificar si necesitamos agregar una nueva página
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Registro de Gastos", 14, yPos);
    yPos += 10;

    // Tabla de gastos
    if (projectExpenses.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Concepto", "Categoría", "Monto", "Tipo de Pago"]],
        body: projectExpenses.map((expense) => [
          formatDate(expense.expenseDate),
          expense.concept,
          expense.tags.map((tag) => expenseTagLabels[tag] || tag).join(", "),
          formatCurrency(expense.amount),
          paymentTypeLabels[expense.paymentType] || expense.paymentType,
        ]),
        theme: "striped",
        headStyles: { fillColor: [67, 97, 238] },
        alternateRowStyles: { fillColor: [240, 240, 250] },
        didDrawPage: (_data) => {
          // Agregar número de página en cada página
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Página ${
              doc.getCurrentPageInfo().pageNumber
            } / ${doc.getNumberOfPages()}`,
            pageWidth - 20,
            pageHeight - 10,
            { align: "right" }
          );
        },
      });

      // Agregar fila con el total de gastos
      const totalExpenses = projectExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(67, 97, 238);
      doc.text(
        `Total de gastos: ${formatCurrency(totalExpenses)}`,
        pageWidth - 20,
        (doc as any).lastAutoTable.finalY + 10,
        { align: "right" }
      );

      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No hay gastos registrados para este proyecto.", 14, yPos);
      yPos += 10;
    }

    // --- RESUMEN DE GASTOS POR CATEGORÍA ---
    // Verificar si necesitamos agregar una nueva página
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Gastos por Categoría", 14, yPos);
    yPos += 10;

    // Calcular gastos por categoría
    const expensesByCategory: Record<string, number> = {};
    projectExpenses.forEach((expense) => {
      expense.tags.forEach((tag) => {
        if (!expensesByCategory[tag]) {
          expensesByCategory[tag] = 0;
        }
        expensesByCategory[tag] += expense.amount / expense.tags.length;
      });
    });

    // Tabla de gastos por categoría
    if (Object.keys(expensesByCategory).length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Categoría", "Monto", "Porcentaje"]],
        body: Object.entries(expensesByCategory).map(([tag, amount]) => {
          // Calcular el porcentaje sobre el total de gastos, no sobre el presupuesto
          const totalExpenses = projectExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );
          const percentage =
            totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

          return [
            expenseTagLabels[tag] || tag,
            formatCurrency(amount),
            `${percentage.toFixed(2)}%`,
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: [67, 97, 238] },
        alternateRowStyles: { fillColor: [240, 240, 250] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No hay categorías de gastos para analizar.", 14, yPos);
      yPos += 10;
    }

    // --- TAREAS DEL PROYECTO ---
    // Agregar nueva página para las tareas
    doc.addPage();
    yPos = 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Tareas del Proyecto", 14, yPos);
    yPos += 10;

    // Filtrar tareas de este proyecto
    const projectTasks = tasks.filter((task) => task.projectId === project.id);

    // Resumen de tareas por estado
    if (projectTasks.length > 0) {
      // Agrupar tareas por estado
      const tasksByStatus: Record<TaskStatus, ProjectTask[]> = {} as Record<
        TaskStatus,
        ProjectTask[]
      >;

      // Inicializar objeto
      Object.values(TaskStatus).forEach((status) => {
        tasksByStatus[status] = [];
      });

      // Agrupar tareas
      projectTasks.forEach((task) => {
        tasksByStatus[task.status].push(task);
      });

      // Preparar datos para el resumen de tareas por estado
      const tasksStatusData = Object.entries(tasksByStatus).map(
        ([status, tasks]) => {
          const percentage = (tasks.length / projectTasks.length) * 100;
          return [
            taskStatusLabels[status as TaskStatus],
            tasks.length.toString(),
            `${percentage.toFixed(2)}%`,
          ];
        }
      );

      // Agregar fila de total
      tasksStatusData.push(["Total", projectTasks.length.toString(), "100%"]);

      // Tabla de resumen de tareas por estado
      autoTable(doc, {
        startY: yPos,
        head: [["Estado", "Cantidad", "Porcentaje"]],
        body: tasksStatusData,
        theme: "striped",
        headStyles: { fillColor: [67, 97, 238] },
        alternateRowStyles: { fillColor: [240, 240, 250] },
        didParseCell: (data) => {
          // Aplicar estilo al total
          if (data.row.index === tasksStatusData.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Para cada estado, mostrar una tabla de tareas
      for (const status of Object.values(TaskStatus)) {
        const tasksInStatus = tasksByStatus[status];

        if (tasksInStatus.length > 0) {
          // Verificar si necesitamos agregar una nueva página
          if (yPos > 220) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(
            `${taskStatusLabels[status]} (${tasksInStatus.length})`,
            14,
            yPos
          );
          yPos += 6;

          autoTable(doc, {
            startY: yPos,
            head: [["Título", "Descripción", "Prioridad", "Fecha Límite"]],
            body: tasksInStatus.map((task) => [
              task.title,
              task.description.length > 50
                ? task.description.substring(0, 50) + "..."
                : task.description,
              taskPriorityLabels[task.priority],
              task.dueDate ? formatDate(task.dueDate) : "No definida",
            ]),
            theme: "striped",
            headStyles: { fillColor: [67, 97, 238] },
            alternateRowStyles: { fillColor: [240, 240, 250] },
            didDrawPage: (_data) => {
              // Agregar número de página en cada página
              doc.setFontSize(8);
              doc.setTextColor(150);
              doc.text(
                `Página ${
                  doc.getCurrentPageInfo().pageNumber
                } / ${doc.getNumberOfPages()}`,
                pageWidth - 20,
                pageHeight - 10,
                { align: "right" }
              );
            },
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      }
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No hay tareas registradas para este proyecto.", 14, yPos);
    }

    // --- PÁGINA PARA FIRMA DEL ADMINISTRADOR ---
    doc.addPage();
    const adminSectionY = 40;

    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL ADMINISTRADOR", pageWidth / 2, 20, { align: "center" });

    // Línea para firma
    doc.setDrawColor(0);
    doc.line(
      pageWidth / 2 - 40,
      adminSectionY + 30,
      pageWidth / 2 + 40,
      adminSectionY + 30
    );

    // Texto "Firma del Administrador"
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Firma del Administrador", pageWidth / 2, adminSectionY + 40, {
      align: "center",
    });

    // Datos del administrador
    const adminX = pageWidth / 2 - 50;
    const adminInfoY = adminSectionY + 50;

    doc.setFont("helvetica", "bold");
    doc.text("Administradora:", adminX, adminInfoY);
    doc.setFont("helvetica", "normal");
    doc.text(adminCompany || "EstateAdmin", adminX + 40, adminInfoY);

    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", adminX, adminInfoY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(adminPhone || "No especificado", adminX + 40, adminInfoY + 10);

    doc.setFont("helvetica", "bold");
    doc.text("Correo:", adminX, adminInfoY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(adminEmail || "No especificado", adminX + 40, adminInfoY + 20);

    // Agregar firma si está disponible
    if (signatureBase64) {
      doc.addImage(
        signatureBase64,
        "PNG",
        pageWidth / 2 - 25,
        adminSectionY + 10,
        50,
        20
      );
    }

    // Pie de página con info de EstateAdmin
    const footerY = pageHeight - 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Un servicio de Omnipixel.", pageWidth / 2, footerY - 10, {
      align: "center",
    });
    doc.text(
      "Correo: administracion@estate-admin.com",
      pageWidth / 2,
      footerY - 5,
      { align: "center" }
    );

    // --- PIE DE PÁGINA en todas las páginas ---
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generado el ${new Date().toLocaleString(
          "es-MX"
        )} - Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Guardar el PDF
    doc.save(`proyecto_${project.name.replace(/\s+/g, "_").toLowerCase()}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
    >
      <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
      Reporte General PDF
    </button>
  );
};

export default ProjectPDFGenerator;
