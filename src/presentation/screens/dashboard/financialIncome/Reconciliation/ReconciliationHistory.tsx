import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useReconciliationHistoryStore } from "../../../../../store/useReconciliationHistoryStore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReconciliationHistoryProps = {
  onResumeDraft?: ( session: { id: string; type: "income" | "expenses"; } ) => void;
};

const ReconciliationHistory = ( { onResumeDraft }: ReconciliationHistoryProps ) => {
  const {
    loading,
    error,
    filteredSessions,
    filters,
    page,
    totalPages,
    totalItems,
    selectedSession,
    fetchSessions,
    setFilters,
    setPage,
    openSessionDetail,
    closeSessionDetail,
    hydrateSessionMovements,
  } = useReconciliationHistoryStore();

  const formatDateTime = ( value: Date | null ) =>
    value ? value.toLocaleString( "es-MX" ) : "-";

  const formatRange = ( from: string, to: string ) => {
    if ( !from && !to ) return "Sin rango";
    if ( from && to ) return `${ from } a ${ to }`;
    if ( from ) return `Desde ${ from }`;
    return `Hasta ${ to }`;
  };

  const downloadSessionPdf = async (session: any) => {
    const resolved = await hydrateSessionMovements(session.id, session.type);
    const reportSession = resolved || session;
    const parseAnyDate = ( value: any ): Date | null => {
      if ( !value ) return null;
      if ( value instanceof Date ) return value;
      if ( typeof value?.toDate === "function" ) return value.toDate();
      const parsed = new Date( value );
      return Number.isNaN( parsed.getTime() ) ? null : parsed;
    };
    const kpiLabelMap: Record<string, string> = {
      bankCredits: "Ingresos banco",
      bankCreditsMatched: "Ingresos banco conciliados",
      bankCreditsPending: "Ingresos banco pendientes",
      internalPayments: "Pagos internos",
      internalMatched: "Pagos internos conciliados",
      bankDebits: "Egresos banco",
      bankDebitsMatched: "Egresos banco conciliados",
      bankDebitsPending: "Egresos banco pendientes",
      internalExpenses: "Egresos internos",
      unmatchedDifference: "Diferencia no conciliada",
    };
    const statusLabelMap: Record<string, string> = {
      matched: "Conciliado automático",
      manual_match: "Conciliado manual",
      pending: "Pendiente",
      ignored: "Ignorado",
    };

    const doc = new jsPDF();
    const generatedAt = new Date();
    const title =
      reportSession.type === "income"
        ? "Reporte de Conciliacion de Ingresos"
        : "Reporte de Conciliacion de Egresos";

    doc.setFont( "helvetica", "bold" );
    doc.setFontSize( 14 );
    doc.text( title, 14, 16 );

    doc.setFont( "helvetica", "normal" );
    doc.setFontSize( 10 );
    doc.text( `Sesion: ${ reportSession.name }`, 14, 24 );
    doc.text( `ID: ${ reportSession.id }`, 14, 30 );
    doc.text(
      `Tipo: ${ reportSession.type === "income" ? "Ingresos" : "Egresos" }`,
      14,
      36
    );
    doc.text( `Estatus: ${ reportSession.status }`, 14, 42 );
    doc.text(
      `Creado por: ${ reportSession.createdByName || reportSession.createdByUid || "-" }`,
      14,
      48
    );
    doc.text(
      `Fecha: ${ reportSession.createdAt ? reportSession.createdAt.toLocaleString( "es-MX" ) : "-" }`,
      14,
      54
    );
    doc.text( `Hash: ${ reportSession.traceability?.snapshotHash || "-" }`, 14, 60 );

    const summaryRows = Object.entries( reportSession.summary || {} ).map( ( [ k, v ] ) => [
      kpiLabelMap[ k ] || k,
      typeof v === "number"
        ? v.toLocaleString( "es-MX", {
          style: "currency",
          currency: "MXN",
          minimumFractionDigits: 2,
        } )
        : String( v ),
    ] );

    autoTable( doc, {
      startY: 66,
      head: [ [ "KPI", "Valor" ] ],
      body: summaryRows.length > 0 ? summaryRows : [ [ "Sin resumen", "-" ] ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [ 79, 70, 229 ] },
    } );

    const bankMovements = Array.isArray( reportSession.raw?.bankMovements )
      ? reportSession.raw.bankMovements
      : [];
    const internalMovements =
      reportSession.type === "income"
        ? Array.isArray( reportSession.raw?.internalPayments )
          ? reportSession.raw.internalPayments
          : []
        : Array.isArray( reportSession.raw?.internalExpenses )
          ? reportSession.raw.internalExpenses
          : [];

    const afterSummaryY = ( doc as any ).lastAutoTable?.finalY || 80;
    autoTable( doc, {
      startY: afterSummaryY + 6,
      head: [ [ "#", "Fecha banco", "Descripción", "Referencia", "Monto", "Estado" ] ],
      body:
        bankMovements.length > 0
          ? bankMovements.map( ( item: any, index: number ) => [
            String( index + 1 ),
            parseAnyDate( item.date )?.toLocaleDateString( "es-MX" ) || "-",
            item.description || "-",
            item.reference || "-",
            Number( item.amount || 0 ).toLocaleString( "es-MX", {
              style: "currency",
              currency: "MXN",
              minimumFractionDigits: 2,
            } ),
            statusLabelMap[ item.status ] || item.status || "-",
          ] )
          : [ [ "-", "-", "Sin movimientos de banco", "-", "-", "-" ] ],
      styles: { fontSize: 8, cellWidth: "wrap" },
      headStyles: { fillColor: [ 67, 56, 202 ] },
    } );

    const afterBankY = ( doc as any ).lastAutoTable?.finalY || afterSummaryY + 16;
    autoTable( doc, {
      startY: afterBankY + 6,
      head: [ [
        "#",
        reportSession.type === "income" ? "ID de pago interno" : "ID de egreso interno",
        reportSession.type === "income" ? "Unidad" : "Folio interno",
        reportSession.type === "income" ? "Referencia de pago" : "Referencia",
        "Monto",
      ] ],
      body:
        internalMovements.length > 0
          ? internalMovements.map( ( item: any, index: number ) => [
            String( index + 1 ),
            item.paymentId || item.expenseId || item.id || "-",
            item.userNumber || item.folio || "-",
            reportSession.type === "income"
              ? item.paymentReference || "-"
              : item.referenceText || item.paymentReference || "-",
            Number( item.amount || 0 ).toLocaleString( "es-MX", {
              style: "currency",
              currency: "MXN",
              minimumFractionDigits: 2,
            } ),
          ] )
          : [ [ "-", "-", "Sin movimientos internos", "-", "-" ] ],
      styles: { fontSize: 8, cellWidth: "wrap" },
      headStyles: { fillColor: [ 99, 102, 241 ] },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        const pageCurrent = ( doc as any ).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize( 8 );
        doc.text(
          `EstateAdmin - ${ generatedAt.toLocaleString( "es-MX" ) } - Pagina ${ pageCurrent }/${ pageCount }`,
          105,
          290,
          { align: "center" }
        );
      },
    } );

    doc.save(
      `conciliacion_${ reportSession.type }_${ ( reportSession.name || "sesion" )
        .replace( /\s+/g, "_" )
        .toLowerCase() }.pdf`
    );
  };

  useEffect( () => {
    fetchSessions();
  }, [ fetchSessions ] );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Historial y seguimiento
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Filtra sesiones, revisa su rango y reanuda borradores pendientes.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <select
            value={ filters.type }
            onChange={ ( e ) =>
              setFilters( {
                type: e.target.value as "all" | "income" | "expenses",
              } )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expenses">Egresos</option>
          </select>
          <select
            value={ filters.status }
            onChange={ ( e ) =>
              setFilters( { status: e.target.value as "all" | "completed" | "draft" } )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">Todos los estatus</option>
            <option value="completed">Completado</option>
            <option value="draft">Borrador</option>
          </select>
          <input
            type="date"
            value={ filters.dateFrom }
            onChange={ ( e ) => setFilters( { dateFrom: e.target.value } ) }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="date"
            value={ filters.dateTo }
            onChange={ ( e ) => setFilters( { dateTo: e.target.value } ) }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o usuario"
            value={ filters.search }
            onChange={ ( e ) => setFilters( { search: e.target.value } ) }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <select
            value={ filters.updatedOrder }
            onChange={ ( e ) =>
              setFilters( { updatedOrder: e.target.value as "desc" | "asc" } )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="desc">Última actualización: más reciente</option>
            <option value="asc">Última actualización: más antigua</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={ () =>
              setFilters( {
                type: "all",
                status: "all",
                updatedOrder: "desc",
                search: "",
                dateFrom: "",
                dateTo: "",
              } )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tipo
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Nombre
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rango guardado
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Última actualización
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Banco movs
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Interno movs
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hash
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estatus
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              { filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={ 10 } className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    { loading ? "Cargando historial..." : "Sin conciliaciones para mostrar." }
                  </td>
                </tr>
              ) }
              { filteredSessions.map( ( session ) => (
                <tr key={ `${ session.type }-${ session.id }` } className="hover:bg-gray-50/70 dark:hover:bg-gray-700/20">
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    { session.createdAt
                      ? formatDateTime( session.createdAt )
                      : "-" }
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    { session.type === "income" ? "Ingresos" : "Egresos" }
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    { session.name }
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                    { formatRange( session.dateRangeFrom, session.dateRangeTo ) }
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                    { formatDateTime( session.updatedAt || session.createdAt ) }
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    { session.bankMovementsCount }
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    { session.internalMovementsCount }
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                    { session.traceability?.snapshotHash || "-" }
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    <span
                      className={ `inline-flex rounded-full px-2 py-1 text-xs font-semibold ${ session.status === "draft"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }` }
                    >
                      { session.status === "draft" ? "Borrador" : "Completada" }
                    </span>
                  </td>
                  <td className="px-3 py-3 flex flex-col items-center justify-center">
                    <button
                      onClick={ async () => {
                        openSessionDetail(session.id, session.type);
                        await hydrateSessionMovements(session.id, session.type);
                      }}
                      className="rounded-md border border-indigo-300 px-3 py-1 text-xs font-semibold mb-2 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={ () => downloadSessionPdf( session ) }
                      className="ml-2 rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      PDF
                    </button>
                    { session.status === "draft" && onResumeDraft && (
                      <button
                        onClick={ () => onResumeDraft( { id: session.id, type: session.type } ) }
                        className="ml-2 rounded-md border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                      >
                        Reanudar
                      </button>
                    ) }
                  </td>
                </tr>
              ) ) }
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            { totalItems } resultado(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={ () => setPage( page - 1 ) }
              disabled={ page <= 1 }
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Página { page } de { totalPages }
            </span>
            <button
              onClick={ () => setPage( page + 1 ) }
              disabled={ page >= totalPages }
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      { error && <p className="text-sm text-red-600 dark:text-red-400">{ error }</p> }

      <Transition.Root show={ !!selectedSession } as={ Fragment }>
        <Dialog as="div" className="relative z-50" onClose={ closeSessionDetail }>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child
                as={ Fragment }
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Detalle de conciliación
                  </Dialog.Title>

                  { selectedSession && (
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Nombre:</span> { selectedSession.name }
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Tipo:</span>{ " " }
                        { selectedSession.type === "income" ? "Ingresos" : "Egresos" }
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Creado por:</span>{ " " }
                        { selectedSession.createdByName || selectedSession.createdByUid || "-" }
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Fecha:</span>{ " " }
                        { selectedSession.createdAt
                          ? selectedSession.createdAt.toLocaleString( "es-MX" )
                          : "-" }
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Hash:</span>{ " " }
                        { selectedSession.traceability?.snapshotHash || "-" }
                      </p>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">Resumen guardado</p>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-700 dark:text-gray-300">
                          { JSON.stringify( selectedSession.summary || {}, null, 2 ) }
                        </pre>
                      </div>
                    </div>
                  ) }

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={ () => downloadSessionPdf( selectedSession ) }
                      className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Descargar PDF
                    </button>
                    <button
                      onClick={ closeSessionDetail }
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default ReconciliationHistory;
