import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/20/solid";
import ApplyPaymentModal from "./ApplyPaymentModal"; // Asegúrate de tener este componente implementado
import { useUnidentifiedPaymentsStore } from "../../../../../store/useUnidentifiedPaymentsStore";
import UnidentifiedPaymentsPDF from "./UnidentifiedPaymentsPDF";
import UnidentifiedPaymentsQR from "./UnidentifiedPaymentsQR";

const UnidentifiedPaymentsTable = () => {
  const {
    payments,
    fetchPayments,
    hasMore,
    openPaymentModal,
    selectedPayment,
    closePaymentModal,
  } = useUnidentifiedPaymentsStore();

  // Estados para filtros de mes, año y aplicado.
  // Se asigna por defecto el año actual para que el filtro de mes funcione desde el inicio.
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);
  const [filterYear, setFilterYear] = useState<number>(
    new Date().getFullYear()
  );
  const [filterApplied, setFilterApplied] = useState<string>("todos");

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<any[]>([null]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [localHasMore, setLocalHasMore] = useState(true);
  const pageSize = 20;

  // Cargar pagos inicialmente usando los filtros actuales
  useEffect(() => {
    const loadInitialPayments = async () => {
      setLoadingPayments(true);
      try {
        const count = await fetchPayments(
          pageSize,
          null,
          filterMonth,
          filterYear
        );
        setLocalHasMore(count === pageSize);
        const updatedLastVisible =
          useUnidentifiedPaymentsStore.getState().lastVisible;
        if (updatedLastVisible) {
          setPageCursors([null, updatedLastVisible]);
        } else {
          setPageCursors([null]);
        }
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar pagos iniciales:", error);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadInitialPayments();
  }, [fetchPayments, filterMonth, filterYear]);

  // Manejo de cambio de filtros: se reinicia la paginación
  const handleFilterChange = async (newMonth?: number, newYear?: number) => {
    setFilterMonth(newMonth);
    setFilterYear(newYear ?? new Date().getFullYear());
    setCurrentPage(1);
    setPageCursors([null]);
    setLocalHasMore(true);
    setLoadingPayments(true);
    try {
      const count = await fetchPayments(pageSize, null, newMonth, newYear);
      setLocalHasMore(count === pageSize);
      const updatedLastVisible =
        useUnidentifiedPaymentsStore.getState().lastVisible;
      if (updatedLastVisible) {
        setPageCursors([null, updatedLastVisible]);
      } else {
        setPageCursors([null]);
      }
    } catch (error) {
      console.error("Error al cambiar filtros:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value ? Number(e.target.value) : undefined;
    handleFilterChange(month, filterYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? Number(e.target.value) : undefined;
    handleFilterChange(filterMonth, year);
  };

  // Manejo de cambio de página
  const handlePageChange = async (newPage: number) => {
    if (loadingPayments) return;
    if (newPage === currentPage) return;
    setLoadingPayments(true);
    try {
      let startAfter: any = null;
      if (newPage === 1) {
        startAfter = null;
      } else {
        startAfter = pageCursors[newPage - 1];
      }
      const count = await fetchPayments(
        pageSize,
        startAfter,
        filterMonth,
        filterYear
      );
      if (newPage > currentPage && count === 0) {
        setLocalHasMore(false);
        return;
      }
      setLocalHasMore(count === pageSize);
      if (
        newPage > pageCursors.length - 1 &&
        useUnidentifiedPaymentsStore.getState().lastVisible &&
        count > 0
      ) {
        setPageCursors((prev) => [
          ...prev,
          useUnidentifiedPaymentsStore.getState().lastVisible,
        ]);
      }
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Filtrado adicional según el estado aplicado
  const filteredPayments = payments.filter((payment) => {
    if (filterApplied === "todos") return true;
    return filterApplied === "aplicado"
      ? payment.appliedToUser
      : !payment.appliedToUser;
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalPages = localHasMore ? currentPage + 1 : currentPage;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
      {/* Filtros y botones */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            value={filterMonth || ""}
            onChange={handleMonthChange}
          >
            <option value="">Todos los meses</option>
            {[
              { value: 1, label: "Enero" },
              { value: 2, label: "Febrero" },
              { value: 3, label: "Marzo" },
              { value: 4, label: "Abril" },
              { value: 5, label: "Mayo" },
              { value: 6, label: "Junio" },
              { value: 7, label: "Julio" },
              { value: 8, label: "Agosto" },
              { value: 9, label: "Septiembre" },
              { value: 10, label: "Octubre" },
              { value: 11, label: "Noviembre" },
              { value: 12, label: "Diciembre" },
            ].map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            value={filterYear || ""}
            onChange={handleYearChange}
          >
            <option value="">Año</option>
            {Array.from({ length: 11 }, (_, i) => 2022 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            value={filterApplied}
            onChange={(e) => setFilterApplied(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="aplicado">Aplicados</option>
            <option value="no_aplicado">No Aplicados</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <UnidentifiedPaymentsPDF payments={filteredPayments} />
          <UnidentifiedPaymentsQR />
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-indigo-600 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Fecha de pago
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Fecha de registro
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Monto abonado
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Comprobante
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Tipo de pago
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Aplicado
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-white">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="dark:text-gray-100">
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {formatDate(payment.paymentDate)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {formatDate(payment.registrationDate)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(payment.amountPaid)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex justify-center items-center w-full">
                    {payment.attachmentPayment ? (
                      <a
                        href={payment.attachmentPayment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                      >
                        <EyeIcon className="h-5 w-5 mr-1 bg-indigo-500 hover:bg-indigo-600 rounded-full" />
                        Ver
                      </a>
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {payment.paymentType}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex justify-center items-center w-full">
                    {payment.appliedToUser ? (
                      <CheckCircleIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex justify-center items-center w-full">
                    {!payment.appliedToUser && (
                      <button
                        onClick={() => openPaymentModal(payment)}
                        className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        Aplicar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loadingPayments}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={loadingPayments || !hasMore}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-medium">{currentPage}</span> de{" "}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loadingPayments}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2 cursor-pointer"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? "z-10 bg-indigo-700 border-2 border-indigo-700 rounded-md text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                        : "z-10  border-2 border-indigo-700  rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loadingPayments || !hasMore}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2 cursor-pointer "
              >
                Siguiente
              </button>
            </nav>
          </div>
        </div>
      </div>

      {selectedPayment && (
        <ApplyPaymentModal
          amount={selectedPayment.amountPaid}
          paymentDate={selectedPayment.paymentDate}
          paymentId={selectedPayment.id}
          paymentType={selectedPayment.paymentType}
          financialAccountId={selectedPayment.financialAccountId!}
          attachmentPayment={selectedPayment.attachmentPayment}
          open={true}
          setOpen={(open) => {
            if (!open) closePaymentModal();
          }}
        />
      )}
    </div>
  );
};

export default UnidentifiedPaymentsTable;
