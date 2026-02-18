// src/components/PaymentHistory.tsx

import { useState, useEffect, useMemo } from "react";
import {
  PaymentRecord,
  usePaymentHistoryStore,
} from "../../../../../store/paymentHistoryStore";
import useUserStore from "../../../../../store/UserDataStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import PDFReportGeneratorSingle from "./PDFReportGeneratorSingle";
import Modal from "../../../../../components/Modal";

const chartColors = [ "#8093E8", "#74B9E7", "#A7CFE6", "#B79FE6", "#C2ABE6" ];

/**
 * Formato de moneda: $2,500.00
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

const PaymentHistory = () => {
  const [ selectedUserUid, setSelectedUserUid ] = useState<string>( "" );
  const [ selectedCondominiumNumber, setSelectedCondominiumNumber ] =
    useState<string>( "" );
  const [ detailMonthFilter, setDetailMonthFilter ] = useState<string>( "" );
  const [ detailConceptFilter, setDetailConceptFilter ] = useState<string>( "" );
  const [ detailStatusFilter, setDetailStatusFilter ] = useState<string>( "all" );
  const [ detailSearch, setDetailSearch ] = useState<string>( "" );
  const [ selectedChargeDetailId, setSelectedChargeDetailId ] = useState<string | null>( null );

  // Obtener lista de condominios (usuarios)
  const fetchCondominiumsUsers = useUserStore(
    ( state ) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore( ( state ) => state.condominiumsUsers );

  // Store de historial individual
  const {
    payments,
    detailed,
    detailedByConcept,
    financialAccountsMap,
    loading,
    error,
    selectedYear,
    fetchPayments,
    setSelectedYear,
    adminCompany,
    adminPhone,
    adminEmail,
    logoBase64,
    currentCreditBalance,
    pendingAmount, // NUEVO: monto pendiente (suma de cargos no pagados)
  } = usePaymentHistoryStore();

  // Cargar usuarios al montar
  useEffect( () => {
    fetchCondominiumsUsers();
  }, [ fetchCondominiumsUsers ] );

  // Cuando el usuario selecciona un condómino, se actualiza el UID y el número
  const handleUserChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    const uid = e.target.value;
    setSelectedUserUid( uid );
    const user = condominiumsUsers.find( ( u ) => u.uid === uid );
    if ( user ) {
      setSelectedCondominiumNumber( user.number ? String( user.number ) : "" );
    }
  };

  // Actualizar año y recargar datos
  const handleYearChange = ( e: React.ChangeEvent<HTMLSelectElement> ) => {
    const newYear = e.target.value;
    setSelectedYear( newYear );
    if ( selectedCondominiumNumber ) {
      fetchPayments( selectedCondominiumNumber, newYear );
    }
  };

  // Reconsultar historial si cambia el condómino o el año
  useEffect( () => {
    if ( selectedCondominiumNumber ) {
      fetchPayments( selectedCondominiumNumber, selectedYear );
    }
  }, [ selectedCondominiumNumber, selectedYear, fetchPayments ] );

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

  const normalizeText = ( value: string ) =>
    value
      .toLowerCase()
      .normalize( "NFD" )
      .replace( /[\u0300-\u036f]/g, "" )
      .trim();

  const getMonthCodeFromRecord = ( record: PaymentRecord ) => {
    if ( record.month ) {
      const parts = record.month.split( "-" );
      if ( parts.length === 2 ) return parts[ 1 ];
      if ( parts.length === 1 ) return parts[ 0 ];
    }
    if ( record.paymentDateISO ) {
      const date = new Date( record.paymentDateISO );
      if ( !Number.isNaN( date.getTime() ) ) {
        return String( date.getMonth() + 1 ).padStart( 2, "0" );
      }
    }
    return "";
  };

  const getPeriodLabel = ( startAt?: string, fallbackMonth?: string ) => {
    if ( startAt ) {
      const values = startAt.split( "-" );
      if ( values.length >= 2 ) {
        const year = values[ 0 ];
        const month = values[ 1 ];
        return `${ monthNames[ month ] || month } ${ year }`;
      }
      return startAt;
    }
    if ( fallbackMonth ) {
      const values = fallbackMonth.split( "-" );
      if ( values.length >= 2 ) {
        const year = values[ 0 ];
        const month = values[ 1 ];
        return `${ monthNames[ month ] || month } ${ year }`;
      }
    }
    return "-";
  };

  const getFinancialAccountLabel = ( accountId?: string ) => {
    if ( !accountId ) return "-";
    return financialAccountsMap[ accountId ] || accountId;
  };

  const paymentRows = useMemo(
    () =>
      payments
        .filter( ( record ) => record.recordType === "payment" )
        .sort( ( a, b ) => {
          const dateA = a.paymentDateISO ? new Date( a.paymentDateISO ).getTime() : 0;
          const dateB = b.paymentDateISO ? new Date( b.paymentDateISO ).getTime() : 0;
          return dateB - dateA;
        } ),
    [ payments ]
  );

  const chargeRows = useMemo( () => {
    const map = new Map<
      string,
      {
        chargeId: string;
        concept: string;
        period: string;
        monthCode: string;
        referenceAmount: number;
        paidAccumulated: number;
        pendingAmount: number;
        status: "pending" | "settled";
      }
    >();

    payments.forEach( ( record ) => {
      const key = record.chargeId || record.referenceId || record.id;
      if ( !key ) return;

      const current = map.get( key ) || {
        chargeId: record.chargeId || record.id,
        concept: record.chargeConcept || record.concept || "Sin concepto",
        period: getPeriodLabel( record.chargeStartAt, record.month ),
        monthCode:
          record.chargeStartAt?.split( "-" )[ 1 ] ||
          getMonthCodeFromRecord( record ),
        referenceAmount:
          record.chargeReferenceAmount ?? record.referenceAmount ?? 0,
        paidAccumulated: 0,
        pendingAmount:
          typeof record.chargeCurrentPending === "number"
            ? record.chargeCurrentPending
            : Math.max(
              0,
              ( record.chargeReferenceAmount ?? record.referenceAmount ?? 0 ) -
              ( record.amountPaid || 0 )
            ),
        status: "pending" as const,
      };

      if ( record.recordType === "payment" ) {
        current.paidAccumulated += record.amountPaid || 0;
      }

      if ( typeof record.chargeCurrentPending === "number" ) {
        current.pendingAmount = record.chargeCurrentPending;
      } else {
        current.pendingAmount = Math.max(
          0,
          current.referenceAmount - current.paidAccumulated
        );
      }

      current.status = current.pendingAmount > 0 ? "pending" : "settled";
      map.set( key, current );
    } );

    return Array.from( map.values() ).sort( ( a, b ) => b.pendingAmount - a.pendingAmount );
  }, [ payments ] );

  const conceptSummaryRows = useMemo( () => {
    const map = new Map<
      string,
      { concept: string; paid: number; pending: number; paymentsCount: number; chargesCount: number }
    >();

    paymentRows.forEach( ( row ) => {
      const key = row.chargeConcept || row.concept || "Sin concepto";
      const current = map.get( key ) || {
        concept: key,
        paid: 0,
        pending: 0,
        paymentsCount: 0,
        chargesCount: 0,
      };
      current.paid += row.amountPaid || 0;
      current.paymentsCount += 1;
      map.set( key, current );
    } );

    chargeRows.forEach( ( row ) => {
      const key = row.concept || "Sin concepto";
      const current = map.get( key ) || {
        concept: key,
        paid: 0,
        pending: 0,
        paymentsCount: 0,
        chargesCount: 0,
      };
      current.pending += row.pendingAmount || 0;
      current.chargesCount += 1;
      map.set( key, current );
    } );

    return Array.from( map.values() ).sort( ( a, b ) => b.paid - a.paid );
  }, [ chargeRows, paymentRows ] );

  const conceptOptions = useMemo(
    () =>
      Array.from(
        new Set(
          conceptSummaryRows
            .map( ( row ) => row.concept )
            .filter( Boolean )
        )
      ).sort( ( a, b ) => a.localeCompare( b, "es", { sensitivity: "base" } ) ),
    [ conceptSummaryRows ]
  );

  const filteredPaymentRows = useMemo( () => {
    const search = normalizeText( detailSearch );
    return paymentRows.filter( ( row ) => {
      const monthCode = getMonthCodeFromRecord( row );
      if ( detailMonthFilter && monthCode !== detailMonthFilter ) return false;
      if ( detailConceptFilter ) {
        const concept = row.chargeConcept || row.concept || "";
        if ( normalizeText( concept ) !== normalizeText( detailConceptFilter ) ) return false;
      }
      if ( search ) {
        const haystack = normalizeText(
          [
            row.chargeConcept || row.concept || "",
            row.paymentReference || "",
            row.paymentType || "",
            row.financialAccountId || "",
            row.chargeId || "",
            row.id || "",
          ].join( " " )
        );
        if ( !haystack.includes( search ) ) return false;
      }
      return true;
    } );
  }, [ detailConceptFilter, detailMonthFilter, detailSearch, paymentRows ] );

  const filteredChargeRows = useMemo( () => {
    const search = normalizeText( detailSearch );
    return chargeRows.filter( ( row ) => {
      if ( detailMonthFilter && row.monthCode !== detailMonthFilter ) return false;
      if ( detailConceptFilter && normalizeText( row.concept ) !== normalizeText( detailConceptFilter ) ) {
        return false;
      }
      if ( detailStatusFilter !== "all" && row.status !== detailStatusFilter ) {
        return false;
      }
      if ( search ) {
        const haystack = normalizeText(
          [ row.concept, row.chargeId, row.period ].join( " " )
        );
        if ( !haystack.includes( search ) ) return false;
      }
      return true;
    } );
  }, [ chargeRows, detailConceptFilter, detailMonthFilter, detailSearch, detailStatusFilter ] );

  const filteredConceptSummaryRows = useMemo( () => {
    if ( !detailConceptFilter ) return conceptSummaryRows;
    return conceptSummaryRows.filter(
      ( row ) => normalizeText( row.concept ) === normalizeText( detailConceptFilter )
    );
  }, [ conceptSummaryRows, detailConceptFilter ] );

  const selectedChargeDetail = useMemo(
    () =>
      selectedChargeDetailId
        ? chargeRows.find( ( row ) => row.chargeId === selectedChargeDetailId ) || null
        : null,
    [ chargeRows, selectedChargeDetailId ]
  );

  const selectedChargePayments = useMemo(
    () =>
      selectedChargeDetailId
        ? paymentRows
          .filter( ( row ) => ( row.chargeId || row.id ) === selectedChargeDetailId )
          .sort( ( a, b ) => {
            const dateA = a.paymentDateISO ? new Date( a.paymentDateISO ).getTime() : 0;
            const dateB = b.paymentDateISO ? new Date( b.paymentDateISO ).getTime() : 0;
            return dateB - dateA;
          } )
        : [],
    [ paymentRows, selectedChargeDetailId ]
  );

  // Preparar datos para la gráfica: agrupar por mes (YYYY-MM) => { paid, pending, saldo }
  const chartData = useMemo( () => {
    // Inicializar el resultado
    const result: Record<
      string,
      {
        paid: number;
        pending: number;
        saldo: number;
        creditUsed: number;
        creditBalance: number;
      }
    > = {};

    // Inicializar todos los meses
    for ( let i = 1; i <= 12; i++ ) {
      const monthPart = i.toString().padStart( 2, "0" );
      result[ monthPart ] = {
        paid: 0,
        pending: 0,
        saldo: 0,
        creditUsed: 0,
        creditBalance: 0,
      };
    }

    // Procesar pagos por mes
    Object.entries( detailed ).forEach( ( [ monthKey, monthPayments ] ) => {
      // Extraer solo el mes (MM) de la clave YYYY-MM
      let monthPart = "";
      if ( monthKey.includes( "-" ) ) {
        const [ _yearPart, month ] = monthKey.split( "-" );
        monthPart = month;
      } else {
        monthPart = monthKey;
      }

      if ( !result[ monthPart ] ) return;

      // Acumular pagos
      let totalPaid = 0;
      let totalCreditUsed = 0;
      let totalCreditBalance = 0;

      // Sumar todos los pagos del mes
      monthPayments.forEach( ( payment ) => {
        totalPaid += payment.amountPaid;
        totalCreditUsed += payment.creditUsed || 0;
        totalCreditBalance += payment.creditBalance;
      } );

      // Asignar valores
      result[ monthPart ].paid += totalPaid;
      result[ monthPart ].creditUsed += totalCreditUsed;
      result[ monthPart ].creditBalance += totalCreditBalance;

      // Para los cargos, usar el primer payment que tiene el referenceAmount correcto para el mes
      if ( monthPayments.length > 0 ) {
        // Todos los pagos del mismo mes tienen el mismo referenceAmount que es el total de cargos del mes
        result[ monthPart ].pending += monthPayments[ 0 ].referenceAmount;
      }

      // Calcular saldo
      result[ monthPart ].saldo =
        result[ monthPart ].pending - result[ monthPart ].paid;
    } );

    return result;
  }, [ detailed ] );

  // Convertir objeto en array ordenada por mes
  const chartArray = Object.entries( chartData )
    .sort( ( a, b ) => parseInt( a[ 0 ] ) - parseInt( b[ 0 ] ) )
    .map( ( [ month, data ] ) => ( {
      month: monthNames[ month ] || month,
      paid:
        data.paid +
        ( data.creditBalance > 0 ? data.creditBalance : 0 ) -
        data.creditUsed,
      pending: data.pending,
      saldo: data.saldo,
    } ) );

  // Cálculos interesantes: totalPaidYear y mes con mayor recaudación se basan en el gráfico
  const { totalPaidYear, bestMonthName } = useMemo( () => {
    let totalPaidYear = 0;
    let monthMaxIndex = -1;
    let maxPaid = 0;

    chartArray.forEach( ( item, idx ) => {
      totalPaidYear += item.paid;
      if ( item.paid > maxPaid ) {
        maxPaid = item.paid;
        monthMaxIndex = idx;
      }
    } );

    const bestMonthName =
      monthMaxIndex !== -1 ? chartArray[ monthMaxIndex ].month : "N/A";
    return { totalPaidYear, bestMonthName };
  }, [ chartArray ] );

  // Obtenemos el condómino seleccionado (para el PDF)
  const selectedCondo = condominiumsUsers.find(
    ( u ) => u.uid === selectedUserUid
  );

  return (
    <div className="p-4">
      {/* Filtros: Selección de Condómino y Año */ }
      <div className="flex flex-col gap-4 mb-4 mt-6">
        <div>
          <h2 className="text-xl font-bold mb-4">
            Resumen individual por condómino
          </h2>
          <label className="block font-medium mb-1">
            Selecciona un Condómino
          </label>
          <select
            value={ selectedUserUid }
            onChange={ handleUserChange }
            className="w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
          >
            <option value="">-- Selecciona un condómino --</option>
            { condominiumsUsers
              .filter(
                ( user ) =>
                  user.role !== "admin" &&
                  user.role !== "super-admin" &&
                  user.role !== "security"
              )
              .map( ( user ) => (
                <option key={ user.uid } value={ user.uid }>
                  { user.number } { user.name }
                </option>
              ) ) }
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Año</label>
          <select
            value={ selectedYear }
            onChange={ handleYearChange }
            className="w-full pl-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
          >
            <option value="">Todos los años</option>
            { [ "2022", "2023", "2024", "2025", "2026" ].map( ( year ) => (
              <option key={ year } value={ year }>
                { year }
              </option>
            ) ) }
          </select>
        </div>
      </div>

      { loading && <LoadingApp /> }
      { error && <p className="text-red-500">Error: { error }</p> }

      {/* Tarjetas con datos interesantes del año */ }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Total Monto Abonado
          </p>
          <p className="text-xl font-semibold">
            { formatCurrency( totalPaidYear ) }
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Total Cargos
          </p>
          <p className="text-xl font-semibold">
            { formatCurrency( pendingAmount ) }
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">Saldo</p>
          <p className="text-xl font-semibold">
            { formatCurrency( pendingAmount - totalPaidYear ) }
          </p>
        </div>
        <div className="p-4 shadow-md rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-100">
            Mes con mayor recaudación
          </p>
          <p className="text-xl font-semibold">{ bestMonthName }</p>
        </div>
      </div>

      {/* Gráfica: Resumen por Mes */ }
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Resumen por mes</h3>
        { chartArray.length > 0 ? (
          <ResponsiveContainer width="100%" height={ 300 }>
            <LineChart
              data={ chartArray }
              margin={ { top: 20, right: 20, left: 0, bottom: 0 } }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={ ( val: number ) => formatCurrency( val ) }
                width={ 80 }
              />
              <Tooltip formatter={ ( val: number ) => formatCurrency( val ) } />
              <Legend />
              <Line
                type="monotone"
                dataKey="paid"
                name="Monto Abonado"
                stroke={ chartColors[ 0 ] }
                strokeWidth={ 2 }
                dot={ { r: 3 } }
                activeDot={ { r: 5 } }
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Cargos"
                stroke={ chartColors[ 1 ] }
                strokeWidth={ 2 }
                dot={ { r: 3 } }
                activeDot={ { r: 5 } }
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke={ chartColors[ 2 ] }
                strokeWidth={ 2 }
                dot={ { r: 3 } }
                activeDot={ { r: 5 } }
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No hay datos para mostrar en el gráfico.</p>
        ) }
      </div>

      { selectedUserUid && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detalle operativo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Filtra por mes, concepto, estado o referencia para revisar pagos y adeudos por cargo.
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
              Saldo a favor actual: { formatCurrency( currentCreditBalance || 0 ) }
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-4">
              <select
                value={ detailMonthFilter }
                onChange={ ( e ) => setDetailMonthFilter( e.target.value ) }
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Todos los meses</option>
                { Object.entries( monthNames ).map( ( [ code, name ] ) => (
                  <option key={ code } value={ code }>
                    { name }
                  </option>
                ) ) }
              </select>

              <select
                value={ detailConceptFilter }
                onChange={ ( e ) => setDetailConceptFilter( e.target.value ) }
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Todos los conceptos</option>
                { conceptOptions.map( ( conceptName ) => (
                  <option key={ conceptName } value={ conceptName }>
                    { conceptName }
                  </option>
                ) ) }
              </select>

              <select
                value={ detailStatusFilter }
                onChange={ ( e ) => setDetailStatusFilter( e.target.value ) }
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Con adeudo</option>
                <option value="settled">Saldado</option>
              </select>

              <input
                type="text"
                value={ detailSearch }
                onChange={ ( e ) => setDetailSearch( e.target.value ) }
                placeholder="Buscar referencia, cargo o cuenta"
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm dark:bg-gray-700 dark:text-gray-100"
              />

              <button
                type="button"
                onClick={ () => {
                  setDetailMonthFilter( "" );
                  setDetailConceptFilter( "" );
                  setDetailStatusFilter( "all" );
                  setDetailSearch( "" );
                } }
                className="h-10 rounded-lg border border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300 px-3 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Historial detallado de pagos ({ filteredPaymentRows.length })
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Concepto</th>
                    <th className="px-3 py-2 text-left">Periodo del cargo</th>
                    <th className="px-3 py-2 text-right">Monto pago</th>
                    <th className="px-3 py-2 text-right">Saldo cargo</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Referencia</th>
                    <th className="px-3 py-2 text-left">Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  { filteredPaymentRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500 dark:text-gray-400" colSpan={ 8 }>
                        Sin pagos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) }
                  { filteredPaymentRows.map( ( row ) => (
                    <tr
                      key={ row.id }
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer"
                      onClick={ () => setSelectedChargeDetailId( row.chargeId || row.id ) }
                      title="Ver trazabilidad del cargo"
                    >
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { row.paymentDate || "-" }
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { row.chargeConcept || row.concept || "-" }
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { getPeriodLabel( row.chargeStartAt, row.month ) }
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-emerald-700 dark:text-emerald-300">
                        { formatCurrency( row.amountPaid || 0 ) }
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                        { formatCurrency( row.chargeCurrentPending || 0 ) }
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { row.paymentType || "-" }
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { row.paymentReference || "-" }
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        { getFinancialAccountLabel( row.financialAccountId ) }
                      </td>
                    </tr>
                  ) ) }
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Adeudos por cargo ({ filteredChargeRows.length })
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Cargo</th>
                    <th className="px-3 py-2 text-left">ID cargo</th>
                    <th className="px-3 py-2 text-left">Periodo</th>
                    <th className="px-3 py-2 text-right">Referencia cargo</th>
                    <th className="px-3 py-2 text-right">Abonado</th>
                    <th className="px-3 py-2 text-right">Pendiente</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  { filteredChargeRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500 dark:text-gray-400" colSpan={ 7 }>
                        Sin cargos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) }
                  { filteredChargeRows.map( ( row ) => (
                    <tr
                      key={ row.chargeId }
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer"
                      onClick={ () => setSelectedChargeDetailId( row.chargeId ) }
                      title="Ver trazabilidad del cargo"
                    >
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{ row.concept }</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{ row.chargeId || "-" }</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{ row.period }</td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                        { formatCurrency( row.referenceAmount || 0 ) }
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300 font-medium">
                        { formatCurrency( row.paidAccumulated || 0 ) }
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-700 dark:text-rose-300">
                        { formatCurrency( row.pendingAmount || 0 ) }
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            row.status === "pending"
                              ? "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                              : "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          }
                        >
                          { row.status === "pending" ? "Con adeudo" : "Saldado" }
                        </span>
                      </td>
                    </tr>
                  ) ) }
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Desglose por concepto ({ filteredConceptSummaryRows.length })
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Concepto</th>
                    <th className="px-3 py-2 text-right">Pagado</th>
                    <th className="px-3 py-2 text-right">Pendiente</th>
                    <th className="px-3 py-2 text-right">Pagos</th>
                    <th className="px-3 py-2 text-right">Cargos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  { filteredConceptSummaryRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500 dark:text-gray-400" colSpan={ 5 }>
                        Sin conceptos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) }
                  { filteredConceptSummaryRows.map( ( row ) => (
                    <tr key={ row.concept } className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{ row.concept }</td>
                      <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300 font-medium">
                        { formatCurrency( row.paid ) }
                      </td>
                      <td className="px-3 py-2 text-right text-rose-700 dark:text-rose-300 font-medium">
                        { formatCurrency( row.pending ) }
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">{ row.paymentsCount }</td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">{ row.chargesCount }</td>
                    </tr>
                  ) ) }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) }

      <Modal
        title="Detalle del cargo y trazabilidad"
        isOpen={ !!selectedChargeDetailId }
        onClose={ () => setSelectedChargeDetailId( null ) }
        size="xl"
      >
        <div className="p-5 space-y-5">
          { !selectedChargeDetail ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No se encontró información del cargo seleccionado.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Concepto</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    { selectedChargeDetail.concept || "-" }
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Periodo</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    { selectedChargeDetail.period || "-" }
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Referencia del cargo</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    { formatCurrency( selectedChargeDetail.referenceAmount || 0 ) }
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Saldo pendiente</p>
                  <p className="text-sm font-semibold mt-1 text-rose-700 dark:text-rose-300">
                    { formatCurrency( selectedChargeDetail.pendingAmount || 0 ) }
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                    Timeline de pagos aplicados ({ selectedChargePayments.length })
                  </h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                        <th className="px-3 py-2 text-left">Folio</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Referencia</th>
                        <th className="px-3 py-2 text-left">Cuenta</th>
                        <th className="px-3 py-2 text-left">ID pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      { selectedChargePayments.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-center text-gray-500 dark:text-gray-400" colSpan={ 7 }>
                            Este cargo no tiene pagos aplicados aún.
                          </td>
                        </tr>
                      ) }
                      { selectedChargePayments.map( ( payment ) => (
                        <tr key={ payment.id } className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                            { payment.paymentDate || "-" }
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300 font-medium">
                            { formatCurrency( payment.amountPaid || 0 ) }
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                            { payment.folio || "-" }
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                            { payment.paymentType || "-" }
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                            { payment.paymentReference || "-" }
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                            { getFinancialAccountLabel( payment.financialAccountId ) }
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                            { payment.paymentId || payment.id }
                          </td>
                        </tr>
                      ) ) }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) }
        </div>
      </Modal>

      {/* Reporte PDF individual */ }
      { selectedUserUid && selectedCondo && (
        <PDFReportGeneratorSingle
          year={ selectedYear }
          condominium={ {
            number: selectedCondo.number || "",
            name: selectedCondo.name || "",
          } }
          detailed={ detailed }
          detailedByConcept={ detailedByConcept }
          adminCompany={ adminCompany }
          adminPhone={ adminPhone }
          adminEmail={ adminEmail }
          logoBase64={ logoBase64 }
        />
      ) }
    </div>
  );
};

export default PaymentHistory;
