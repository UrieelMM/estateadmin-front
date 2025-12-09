import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PerformanceEvaluation, PersonalProfile } from "../../../../store/PersonalAdministration";
import moment from "moment";

// Helper function to convert image URL to base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      // Max dimensions for logos/signatures
      const maxWidth = 300;
      const maxHeight = 150;

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL("image/jpeg", 0.7);
      resolve(base64);
    };

    img.onerror = () => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    };

    const objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
  });
}

export const generatePerformanceEvaluationPDF = async (
  evaluation: PerformanceEvaluation,
  employee: PersonalProfile | undefined,
  logoUrl?: string
) => {
  const doc = new jsPDF();

  // Load logo if available
  if (logoUrl) {
    try {
      const logoBase64 = await getBase64FromUrl(logoUrl);
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    } catch (error) {
      console.warn("Could not load logo for PDF", error);
    }
  }

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Evaluación de Desempeño", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const reportDate = new Date().toLocaleString();
  doc.text(`Fecha de generación: ${reportDate}`, 14, 28);

  // Employee Info
  const startY = 40;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Empleado", 14, startY);

  const employeeName = employee 
    ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` 
    : "No encontrado";
  const employeePosition = employee?.employmentInfo.position || "N/A";
  const employeeArea = employee?.employmentInfo.area || "N/A";

  const infoRows = [
    ["Nombre:", employeeName],
    ["Puesto:", employeePosition],
    ["Área:", employeeArea],
    ["Periodo Evaluado:", `${moment(evaluation.period.startDate).format("DD/MM/YYYY")} - ${moment(evaluation.period.endDate).format("DD/MM/YYYY")}`],
    ["Calificación Global:", `${evaluation.overallScore.toFixed(1)} / 5.0`]
  ];

  autoTable(doc, {
    startY: startY + 5,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });

  // Criteria Details
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Criterios", 14, currentY);

  const criteriaRows = [
    ["Puntualidad", `${evaluation.criteria.punctuality} / 5`],
    ["Cumplimiento de Tareas", `${evaluation.criteria.taskCompletion} / 5`],
    ["Relación con Residentes", `${evaluation.criteria.residentRelations} / 5`],
    ["Trabajo en Equipo", `${evaluation.criteria.teamwork} / 5`],
    ["Iniciativa", `${evaluation.criteria.initiative} / 5`],
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Criterio", "Puntuación"]],
    body: criteriaRows,
    headStyles: {
      fillColor: [75, 68, 224],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10 },
    theme: 'grid'
  });

  // Goals
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Check if we need a page break
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Objetivos para el siguiente periodo", 14, currentY);

  const goalsData = evaluation.goals.length > 0 
    ? evaluation.goals.map(g => [g]) 
    : [["Sin objetivos registrados"]];

  autoTable(doc, {
    startY: currentY + 5,
    body: goalsData,
    theme: 'striped',
    headStyles: { fillColor: [75, 68, 224] },
    styles: { fontSize: 10 }
  });

  // Improvement Areas
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
   if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Áreas de Mejora", 14, currentY);

  const improvementsData = evaluation.improvementAreas.length > 0
    ? evaluation.improvementAreas.map(i => [i])
    : [["Sin áreas de mejora registradas"]];

  autoTable(doc, {
    startY: currentY + 5,
    body: improvementsData,
    theme: 'striped',
    styles: { fontSize: 10 }
  });

  // Comments
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Comentarios Generales", 14, currentY);

  const commentsData = evaluation.comments ? [[evaluation.comments]] : [["Sin comentarios adicionales"]];
  
  autoTable(doc, {
    startY: currentY + 5,
    body: commentsData,
    theme: 'plain',
    styles: { fontSize: 10, fontStyle: 'italic' }
  });

  // Footer / Signatures space
  currentY = (doc as any).lastAutoTable.finalY + 30;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 40;
  }

  doc.setLineWidth(0.5);
  doc.line(20, currentY, 90, currentY); // Line for Employee Signature
  doc.line(120, currentY, 190, currentY); // Line for Evaluator Signature

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Firma del Empleado", 35, currentY + 5);
  doc.text("Firma del Evaluador", 135, currentY + 5);

  doc.save(`Evaluacion_${employeeName.replace(/\s+/g, '_')}_${moment(evaluation.period.endDate).format("YYYY-MM-DD")}.pdf`);
};
