// src/components/Summary/MorosidadPDFReport.tsx
import React, { useCallback, useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  usePaymentSummaryStore,
  PaymentRecord,
} from "../../../../../store/paymentSummaryStore";
import { useSignaturesStore } from "../../../../../store/useSignaturesStore";
import { DocumentChartBarIcon } from "@heroicons/react/16/solid";
import toast from "react-hot-toast";

/**
 * Pequeño mapeo de "01" -> "Enero", etc.
 */
const MONTH_NAMES: Record<string, string> = {
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

const MorosidadPDFReport: React.FC = () => {
  // Obtenemos datos del store de pagos
  const {
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    payments,
    fetchSummary,
    loading,
  } = usePaymentSummaryStore( ( state ) => ( {
    detailed: state.detailed,
    adminCompany: state.adminCompany,
    adminPhone: state.adminPhone,
    adminEmail: state.adminEmail,
    logoBase64: state.logoBase64,
    payments: state.payments,
    fetchSummary: state.fetchSummary,
    loading: state.loading,
  } ) );

  // Obtenemos la firma optimizada del store de firmas
  const { signatureBase64, ensureSignaturesLoaded } = useSignaturesStore();

  // Estados para controlar la carga de datos
  const [ historicalDataLoaded, setHistoricalDataLoaded ] = useState( false );
  const [ isGeneratingPDF, setIsGeneratingPDF ] = useState( false );
  const [ allPayments, setAllPayments ] = useState<PaymentRecord[]>( [] );

  /**
   * Formatear números como moneda, por ejemplo: $2,500.00
   */
  const formatCurrency = ( value: number ): string => {
    return (
      "$" +
      value.toLocaleString( "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      } )
    );
  };

  // Función para cargar los datos históricos (similar a la de MorosidadView)
  const loadAllPaymentData = useCallback( async () => {
    if ( !historicalDataLoaded ) {
      // Obtenemos el año actual
      const currentYear = new Date().getFullYear();

      // Cargamos datos de los últimos 3 años
      const yearsToLoad = [
        currentYear.toString(),
        ( currentYear - 1 ).toString(),
        ( currentYear - 2 ).toString(),
      ];

      for ( const year of yearsToLoad ) {
        await fetchSummary( year, true );
      }

      setHistoricalDataLoaded( true );
    }
  }, [ fetchSummary, historicalDataLoaded ] );

  // Efecto para cargar datos históricos al montar el componente
  useEffect( () => {
    loadAllPaymentData();
    // También aseguramos que las firmas estén cargadas
    ensureSignaturesLoaded();
  }, [ loadAllPaymentData, ensureSignaturesLoaded ] );

  // Efecto para actualizar allPayments cuando cambien los pagos
  useEffect( () => {
    if ( payments.length > 0 ) {
      setAllPayments( ( prev ) => {
        // Combinamos pagos existentes con nuevos, evitando duplicados
        const paymentMap = new Map<string, PaymentRecord>();

        // Añadimos pagos previos
        prev.forEach( ( payment ) => {
          paymentMap.set( payment.id, payment );
        } );

        // Añadimos o actualizamos con nuevos pagos
        payments.forEach( ( payment ) => {
          paymentMap.set( payment.id, payment );
        } );

        return Array.from( paymentMap.values() );
      } );
    }
  }, [ payments ] );

  /**
   * Generar reporte PDF al hacer clic en el botón
   */
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF( true );

      // Si aún no tenemos datos históricos cargados, los cargamos primero
      if ( !historicalDataLoaded ) {
        toast.loading( "Cargando datos históricos..." );
        await loadAllPaymentData();
        toast.dismiss();
      }

      const doc = new jsPDF();
      const now = new Date();
      const reportDateStr = now.toLocaleString();

      // 1. Encabezado: logo y datos generales
      if ( logoBase64 ) {
        doc.addImage( logoBase64, "PNG", 160, 10, 30, 30 );
      }
      doc.setFontSize( 14 );
      doc.text( "Reporte de Morosidad", 14, 20 );

      doc.setFontSize( 12 );
      doc.setFont( "helvetica", "bold" );
      doc.text( "Fecha:", 14, 30 );
      doc.setFont( "helvetica", "normal" );
      doc.text( reportDateStr, 14 + doc.getTextWidth( "Fecha:" ) + 2, 30 );

      // 2. Procesamos los datos de allPayments para crear una estructura similar a detailed
      const processedDetailed: Record<string, PaymentRecord[]> = {};

      allPayments.forEach( ( payment ) => {
        if ( !payment.paid && payment.amountPending > 0 ) {
          const userKey = payment.numberCondominium || "Desconocido";
          if ( !processedDetailed[ userKey ] ) {
            processedDetailed[ userKey ] = [];
          }
          processedDetailed[ userKey ].push( payment );
        }
      } );

      // 3. Listar usuarios morosos
      const allUsers = Object.keys( processedDetailed );
      const morosos = allUsers.filter( ( user ) =>
        processedDetailed[ user ].some(
          ( record ) => !record.paid && record.amountPending > 0
        )
      );

      // Ordenar usuarios de manera numérica o alfanumérica
      morosos.sort( ( a, b ) => {
        const numA = parseInt( a, 10 );
        const numB = parseInt( b, 10 );
        if ( isNaN( numA ) || isNaN( numB ) ) {
          return a.localeCompare( b );
        }
        return numA - numB;
      } );

      let currentY = 50;
      let grandTotal = 0;

      // Para cada usuario moroso, generamos una tabla con sus cargos pendientes
      morosos.forEach( ( user, index ) => {
        // Filtrar registros pendientes
        const pendingRecords = processedDetailed[ user ].filter(
          ( record ) => !record.paid && record.amountPending > 0
        );
        // Calcular total de deuda de este usuario
        const userDebt = pendingRecords.reduce(
          ( acc, record ) => acc + record.amountPending,
          0
        );
        grandTotal += userDebt;

        // Título: "Usuario #101"
        doc.setFontSize( 12 );
        doc.setFont( "helvetica", "bold" );
        if ( index > 0 ) {
          // Dejamos un espacio adicional si no es el primer usuario
          currentY += 5;
        }
        doc.text(
          `Condómino #${ user } - Total: ${ formatCurrency( userDebt ) }`,
          14,
          currentY
        );

        // Ordenamos los registros por mes (ordenados numéricamente) y luego construimos las filas
        const sortedPendingRecords = [ ...pendingRecords ].sort( ( a, b ) => {
          // Convertir a números para ordenar correctamente (01, 02... 10, 11, 12)
          const monthA = parseInt( a.month, 10 );
          const monthB = parseInt( b.month, 10 );
          return monthA - monthB;
        } );

        // Construimos las filas para la tabla: [Concepto, Mes, Monto Pendiente]
        const rows = sortedPendingRecords.map( ( rec ) => {
          const mes = MONTH_NAMES[ rec.month ] || rec.month;
          return [
            rec.concept, // Concepto
            mes, // Mes
            formatCurrency( rec.amountPending ), // Pendiente
          ];
        } );

        // Agregamos una fila de "Total" al final para el usuario
        rows.push( [ "", "Total", formatCurrency( userDebt ) ] );

        // Renderizamos la tabla con autoTable
        currentY += 6;
        autoTable( doc, {
          startY: currentY,
          head: [ [ "Concepto", "Mes", "Monto Pendiente" ] ],
          body: rows,
          headStyles: {
            fillColor: [ 75, 68, 224 ],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 10 },
          didParseCell: ( data ) => {
            // Si es la última fila, ponerla en negrita
            if ( data.row.index === rows.length - 1 ) {
              data.cell.styles.fontStyle = "bold";
            }
          },
        } );

        // Actualizamos la posición Y para la siguiente tabla
        // (doc as any).lastAutoTable contiene info de la última tabla
        currentY = ( doc as any ).lastAutoTable
          ? ( doc as any ).lastAutoTable.finalY + 10
          : currentY + 20;

        // Control de salto de página manual si se acerca al final
        if ( currentY > doc.internal.pageSize.height - 40 ) {
          doc.addPage();
          currentY = 20;
        }
      } );

      // 3. Mostrar un gran total de morosidad al final
      doc.setFontSize( 12 );
      doc.setFont( "helvetica", "bold" );
      doc.text(
        `Total Global de Morosidad: ${ formatCurrency( grandTotal ) }`,
        14,
        currentY
      );
      currentY += 20;

      // 4. Pie de página: firma y datos de la administradora (página nueva para consistencia)
      doc.addPage();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const adminSectionY = pageHeight - 80;

      // Firma (si existe)
      if ( signatureBase64 ) {
        doc.addImage(
          signatureBase64,
          "PNG",
          margin,
          adminSectionY - 20,
          50,
          20
        );
      }
      doc.setFontSize( 12 );
      doc.text( "Firma del Administrador", margin, adminSectionY );

      const adminX = margin;
      doc.setFont( "helvetica", "bold" );
      doc.text( "Administradora:", adminX, adminSectionY + 10 );
      doc.setFont( "helvetica", "normal" );
      doc.text( adminCompany, adminX + 40, adminSectionY + 10 );

      doc.setFont( "helvetica", "bold" );
      doc.text( "Teléfono:", adminX, adminSectionY + 20 );
      doc.setFont( "helvetica", "normal" );
      doc.text( adminPhone, adminX + 40, adminSectionY + 20 );

      doc.setFont( "helvetica", "bold" );
      doc.text( "Contacto:", adminX, adminSectionY + 30 );
      doc.setFont( "helvetica", "normal" );
      doc.text( adminEmail, adminX + 40, adminSectionY + 30 );

      // Footer informativo
      const footerY = pageHeight - 15;
      doc.setFontSize( 11 );
      doc.text( "Un servicio de Omnipixel.", margin, footerY - 10 );
      doc.text( "Correo: administracion@estate-admin.com", margin, footerY - 5 );

      const generatedAt = new Date().toLocaleString( "es-MX" );
      const totalPages = doc.getNumberOfPages();
      const pageWidthMor = doc.internal.pageSize.getWidth();
      const pageHeightMor = doc.internal.pageSize.getHeight();
      for ( let i = 1; i <= totalPages; i++ ) {
        doc.setPage( i );
        doc.setFontSize( 9 );
        doc.setTextColor( 120 );
        doc.text( `EstateAdmin - ${ generatedAt }`, pageWidthMor / 2, pageHeightMor - 8, { align: "center" } );
        doc.text( `Página ${ i } de ${ totalPages }`, pageWidthMor - 14, pageHeightMor - 8, { align: "right" } );
      }

      // 5. Guardar PDF
      doc.save( "ReporteMorosidad.pdf" );
    } catch ( error ) {
      console.error( "Error al generar PDF:", error );
      toast.error( "Error al generar el reporte de morosidad" );
    } finally {
      setIsGeneratingPDF( false );
    }
  };

  return (
    <div>
      <button
        onClick={ generatePDF }
        disabled={ isGeneratingPDF || loading }
        className="bg-indigo-600 flex text-white text-sm py-2 px-1 rounded w-[240px] font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <DocumentChartBarIcon className="w-5 h-5 text-white mr-1" />
        { isGeneratingPDF ? "Generando..." : "Generar Reporte de Morosidad" }
      </button>
      { loading && (
        <p className="text-sm text-gray-500 mt-2">
          Cargando datos históricos...
        </p>
      ) }
    </div>
  );
};

export default MorosidadPDFReport;
