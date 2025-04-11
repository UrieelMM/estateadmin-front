// ProjectExcelGenerator.tsx
import React from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Project,
  ProjectStatus,
  useProjectStore,
} from "../../../../../store/projectStore";
import {
  ProjectTask,
  TaskStatus,
  useProjectTaskStore,
} from "../../../../../store/projectTaskStore";
import { TableCellsIcon } from "@heroicons/react/24/solid";

// Mapeo de estados de proyecto a español
const projectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.IN_PROGRESS]: "En Progreso",
  [ProjectStatus.CANCELLED]: "Cancelado",
  [ProjectStatus.COMPLETED]: "Finalizado",
};

// Mapeo de estados de tareas a español
const taskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "Pendientes",
  [TaskStatus.TODO]: "Por hacer",
  [TaskStatus.IN_PROGRESS]: "En progreso",
  [TaskStatus.REVIEW]: "Revisión",
  [TaskStatus.DONE]: "Completado",
};

// Mapeo de prioridades a español
const priorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
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

export interface ProjectExcelGeneratorProps {
  project: Project;
  logoBase64?: string;
  signatureBase64?: string;
  adminCompany?: string;
  adminPhone?: string;
  adminEmail?: string;
}

const ProjectExcelGenerator: React.FC<ProjectExcelGeneratorProps> = ({
  project,
}) => {
  // Obtener los gastos del proyecto
  const { projectExpenses, fetchProjectExpenses } = useProjectStore();

  // Obtener las tareas del proyecto
  const { tasks, fetchProjectTasks } = useProjectTaskStore();

  // Función para generar el Excel
  const generateExcel = async () => {
    // Primero, aseguramos de tener los datos más recientes
    await fetchProjectExpenses(project.id);
    await fetchProjectTasks(project.id);

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EstateAdmin";
    workbook.lastModifiedBy = "EstateAdmin";
    workbook.created = new Date();
    workbook.modified = new Date();

    // ========================
    // Definición de estilos
    // ========================
    const titleStyle = {
      font: { bold: true, size: 18, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center" as const, vertical: "middle" as const },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF4B1CE1" },
      },
    };

    const headerStyle = {
      font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center" as const, vertical: "middle" as const },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF818CF8" },
      },
    };

    const evenRowStyle = {
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFFFFFFF" },
      },
    };

    const oddRowStyle = {
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFF3F4F6" },
      },
    };

    const totalRowStyle = {
      font: { bold: true, size: 12, color: { argb: "FF4B1CE1" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFEDF2F7" },
      },
    };

    // --- HOJA DE RESUMEN DEL PROYECTO ---
    const summarySheet = workbook.addWorksheet("Resumen del Proyecto");

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

    // Título
    summarySheet.mergeCells("A1:B1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "RESUMEN DEL PROYECTO";
    titleCell.font = titleStyle.font;
    titleCell.alignment = titleStyle.alignment;
    titleCell.fill = titleStyle.fill;
    summarySheet.getRow(1).height = 35;

    // Datos de resumen del proyecto
    const summaryData = [
      ["Nombre", project.name],
      ["Descripción", project.description],
      ["Estado", projectStatusLabels[project.status]],
      ["Fecha de inicio", formatDate(project.startDate)],
      ["Fecha estimada de finalización", formatDate(project.endDate)],
      ["Presupuesto inicial", formatCurrency(project.initialBudget)],
      ["Presupuesto restante", formatCurrency(project.currentBudget || 0)],
      ["Porcentaje utilizado", `${budgetUsedPercent.toFixed(2)}%`],
      ["Días transcurridos", daysElapsed.toString()],
      [
        "Días restantes",
        daysRemaining > 0 ? daysRemaining.toString() : "Vencido",
      ],
      ["Fecha del reporte", new Date().toLocaleDateString("es-MX")],
    ];

    // Añadir datos
    summaryData.forEach((row) => {
      const dataRow = summarySheet.addRow(row);
      dataRow.getCell(1).font = { bold: true };
    });

    // Ajustar anchos de columnas
    summarySheet.getColumn("A").width = 30;
    summarySheet.getColumn("B").width = 50;

    // --- HOJA DE GASTOS ---
    if (projectExpenses.length > 0) {
      const expensesSheet = workbook.addWorksheet("Gastos del Proyecto");

      // Título
      expensesSheet.mergeCells("A1:E1");
      const expensesTitleCell = expensesSheet.getCell("A1");
      expensesTitleCell.value = "REGISTRO DE GASTOS";
      expensesTitleCell.font = titleStyle.font;
      expensesTitleCell.alignment = titleStyle.alignment;
      expensesTitleCell.fill = titleStyle.fill;
      expensesSheet.getRow(1).height = 35;

      // Encabezados
      const headersRow = expensesSheet.addRow([
        "Fecha",
        "Concepto",
        "Categoría",
        "Monto",
        "Tipo de Pago",
      ]);

      headersRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.alignment = headerStyle.alignment;
        cell.fill = headerStyle.fill;
      });
      headersRow.height = 30;

      // Agregar datos
      projectExpenses.forEach((expense) => {
        const row = expensesSheet.addRow([
          formatDate(expense.expenseDate),
          expense.concept,
          expense.tags.map((tag) => expenseTagLabels[tag] || tag).join(", "),
          expense.amount,
          paymentTypeLabels[expense.paymentType] || expense.paymentType,
        ]);

        // Formatear columna de montos
        const amountCell = row.getCell(4);
        amountCell.numFmt = '"$"#,##0.00';
      });

      // Aplicar estilos alternados
      for (let row = 3; row <= projectExpenses.length + 2; row++) {
        const currentRow = expensesSheet.getRow(row);
        const style = row % 2 === 0 ? evenRowStyle : oddRowStyle;
        currentRow.eachCell((cell) => {
          if (!cell.font || !cell.font.bold) {
            cell.fill = style.fill;
          }
        });
      }

      // Agregar fila de totales
      const totalAmount = projectExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const totalRow = expensesSheet.addRow(["Total", "", "", totalAmount, ""]);

      // Aplicar estilo a la fila de totales
      totalRow.eachCell((cell) => {
        cell.font = totalRowStyle.font;
        cell.fill = totalRowStyle.fill;
      });

      // Formatear celda de monto total
      const totalAmountCell = totalRow.getCell(4);
      totalAmountCell.numFmt = '"$"#,##0.00';

      // Ajustar anchos de columnas
      expensesSheet.getColumn("A").width = 15; // Fecha
      expensesSheet.getColumn("B").width = 30; // Concepto
      expensesSheet.getColumn("C").width = 25; // Categoría
      expensesSheet.getColumn("D").width = 15; // Monto
      expensesSheet.getColumn("E").width = 20; // Tipo de Pago
    }

    // --- HOJA DE GASTOS POR CATEGORÍA ---
    const expensesByCategory: Record<string, number> = {};
    projectExpenses.forEach((expense) => {
      expense.tags.forEach((tag) => {
        if (!expensesByCategory[tag]) {
          expensesByCategory[tag] = 0;
        }
        expensesByCategory[tag] += expense.amount / expense.tags.length;
      });
    });

    if (Object.keys(expensesByCategory).length > 0) {
      const categorySheet = workbook.addWorksheet("Gastos por Categoría");

      // Título
      categorySheet.mergeCells("A1:C1");
      const categoryTitleCell = categorySheet.getCell("A1");
      categoryTitleCell.value = "GASTOS POR CATEGORÍA";
      categoryTitleCell.font = titleStyle.font;
      categoryTitleCell.alignment = titleStyle.alignment;
      categoryTitleCell.fill = titleStyle.fill;
      categorySheet.getRow(1).height = 35;

      // Encabezados
      const headersRow = categorySheet.addRow([
        "Categoría",
        "Monto",
        "Porcentaje",
      ]);

      headersRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.alignment = headerStyle.alignment;
        cell.fill = headerStyle.fill;
      });
      headersRow.height = 30;

      // Calcular el total para los porcentajes
      const totalExpenses = projectExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      // Agregar datos
      const entries = Object.entries(expensesByCategory);
      entries.forEach(([tag, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        const row = categorySheet.addRow([
          expenseTagLabels[tag] || tag,
          amount,
          percentage,
        ]);

        // Formatear celdas
        const amountCell = row.getCell(2);
        amountCell.numFmt = '"$"#,##0.00';

        const percentageCell = row.getCell(3);
        percentageCell.numFmt = '0.00"%"';
      });

      // Aplicar estilos alternados
      for (let row = 3; row <= entries.length + 2; row++) {
        const currentRow = categorySheet.getRow(row);
        const style = row % 2 === 0 ? evenRowStyle : oddRowStyle;
        currentRow.eachCell((cell) => {
          if (!cell.font || !cell.font.bold) {
            cell.fill = style.fill;
          }
        });
      }

      // Agregar fila de totales
      const totalAmount = entries.reduce((sum, [_, amount]) => sum + amount, 0);
      const totalRow = categorySheet.addRow(["Total", totalAmount, 100]);

      // Aplicar estilo a la fila de totales
      totalRow.eachCell((cell) => {
        cell.font = totalRowStyle.font;
        cell.fill = totalRowStyle.fill;
      });

      // Formatear celdas de totales
      const totalAmountCell = totalRow.getCell(2);
      totalAmountCell.numFmt = '"$"#,##0.00';

      const totalPercentageCell = totalRow.getCell(3);
      totalPercentageCell.numFmt = '0.00"%"';

      // Ajustar anchos de columnas
      categorySheet.getColumn("A").width = 30; // Categoría
      categorySheet.getColumn("B").width = 20; // Monto
      categorySheet.getColumn("C").width = 15; // Porcentaje
    }

    // --- HOJA DE TAREAS ---
    const projectTasks = tasks.filter((task) => task.projectId === project.id);

    if (projectTasks.length > 0) {
      const tasksSheet = workbook.addWorksheet("Tareas del Proyecto");

      // Título
      tasksSheet.mergeCells("A1:E1");
      const tasksTitleCell = tasksSheet.getCell("A1");
      tasksTitleCell.value = "TAREAS DEL PROYECTO";
      tasksTitleCell.font = titleStyle.font;
      tasksTitleCell.alignment = titleStyle.alignment;
      tasksTitleCell.fill = titleStyle.fill;
      tasksSheet.getRow(1).height = 35;

      // Encabezados
      const headersRow = tasksSheet.addRow([
        "Título",
        "Descripción",
        "Estado",
        "Prioridad",
        "Fecha Límite",
      ]);

      headersRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.alignment = headerStyle.alignment;
        cell.fill = headerStyle.fill;
      });
      headersRow.height = 30;

      // Agregar datos de tareas
      projectTasks.forEach((task) => {
        const row = tasksSheet.addRow([
          task.title,
          task.description,
          taskStatusLabels[task.status],
          priorityLabels[task.priority] || task.priority,
          task.dueDate ? formatDate(task.dueDate) : "",
        ]);

        // Aplicar estilo alternado a la fila
        const style =
          tasksSheet.rowCount % 2 === 0 ? evenRowStyle : oddRowStyle;
        row.eachCell((cell) => {
          if (!cell.font || !cell.font.bold) {
            cell.fill = style.fill;
          }
        });
      });

      // Ajustar anchos de columnas dinámicamente
      const columnWidths = {
        A: 25, // Título
        B: 50, // Descripción
        C: 15, // Estado
        D: 15, // Prioridad
        E: 15, // Fecha Límite
      };

      // Ajustar anchos solo para columnas con contenido
      Object.entries(columnWidths).forEach(([col, width]) => {
        const hasContent = projectTasks.some((task) => {
          switch (col) {
            case "A":
              return task.title;
            case "B":
              return task.description;
            case "C":
              return task.status;
            case "D":
              return task.priority;
            case "E":
              return task.dueDate;
            default:
              return false;
          }
        });
        if (hasContent) {
          tasksSheet.getColumn(col).width = width;
        } else {
          tasksSheet.getColumn(col).hidden = true;
        }
      });

      // --- HOJA DE TAREAS POR ESTADO ---
      const tasksByStatus: Record<TaskStatus, ProjectTask[]> = {} as Record<
        TaskStatus,
        ProjectTask[]
      >;

      // Inicializar objeto para cada estado
      Object.values(TaskStatus).forEach((status) => {
        tasksByStatus[status] = [];
      });

      // Agrupar tareas por estado
      projectTasks.forEach((task) => {
        tasksByStatus[task.status].push(task);
      });

      const statusSheet = workbook.addWorksheet("Resumen de Tareas");

      // Título
      statusSheet.mergeCells("A1:C1");
      const statusTitleCell = statusSheet.getCell("A1");
      statusTitleCell.value = "RESUMEN DE TAREAS POR ESTADO";
      statusTitleCell.font = titleStyle.font;
      statusTitleCell.alignment = titleStyle.alignment;
      statusTitleCell.fill = titleStyle.fill;
      statusSheet.getRow(1).height = 35;

      // Encabezados
      const statusHeadersRow = statusSheet.addRow([
        "Estado",
        "Cantidad",
        "Porcentaje",
      ]);

      statusHeadersRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.alignment = headerStyle.alignment;
        cell.fill = headerStyle.fill;
      });
      statusHeadersRow.height = 30;

      // Agregar datos
      const statusEntries = Object.entries(tasksByStatus);
      statusEntries.forEach(([status, tasksInStatus]) => {
        const percentage = (tasksInStatus.length / projectTasks.length) * 100;
        const row = statusSheet.addRow([
          taskStatusLabels[status as TaskStatus],
          tasksInStatus.length,
          percentage,
        ]);

        // Formatear celdas
        const percentageCell = row.getCell(3);
        percentageCell.numFmt = '0.00"%"';
      });

      // Aplicar estilos alternados
      for (let row = 3; row <= statusEntries.length + 2; row++) {
        const currentRow = statusSheet.getRow(row);
        const style = row % 2 === 0 ? evenRowStyle : oddRowStyle;
        currentRow.eachCell((cell) => {
          if (!cell.font || !cell.font.bold) {
            cell.fill = style.fill;
          }
        });
      }

      // Agregar fila de totales
      const totalRow = statusSheet.addRow(["Total", projectTasks.length, 100]);

      // Aplicar estilo a la fila de totales
      totalRow.eachCell((cell) => {
        cell.font = totalRowStyle.font;
        cell.fill = totalRowStyle.fill;
      });

      // Formatear celda de porcentaje total
      const totalPercentageCell = totalRow.getCell(3);
      totalPercentageCell.numFmt = '0.00"%"';

      // Ajustar anchos de columnas
      statusSheet.getColumn("A").width = 25; // Estado
      statusSheet.getColumn("B").width = 15; // Cantidad
      statusSheet.getColumn("C").width = 15; // Porcentaje
    }

    // Guardar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `proyecto_${project.name.replace(/\s+/g, "_").toLowerCase()}.xlsx`
    );
  };

  return (
    <button
      onClick={generateExcel}
      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
    >
      <TableCellsIcon className="h-5 w-5 text-green-600" />
      Reporte General Excel
    </button>
  );
};

export default ProjectExcelGenerator;
