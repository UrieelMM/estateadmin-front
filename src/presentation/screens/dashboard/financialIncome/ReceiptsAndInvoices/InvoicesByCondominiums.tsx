import { useState, useEffect } from "react";
import {
  EyeIcon,
  CheckIcon,
  ArrowPathIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";
import { usePaymentVouchersStore } from "../../../../../store/paymentVouchersStore";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import {
  formatCurrency,
  formatDateToSpanish,
} from "../../../../../utils/curreyncy";

const ITEMS_PER_PAGE = 20;

// Función para vaciar el caché de vouchersCache
// Esto es un workaround ya que no podemos modificar directamente el store
const clearVouchersCache = () => {
  // Podemos usar localStorage como señal para indicar al store que debe invalidar su caché
  const timestamp = Date.now();
  localStorage.setItem("vouchers_cache_invalidation", timestamp.toString());
};

const InvoicesByCondominiums = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<any[]>([null]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [reloadCounter, setReloadCounter] = useState(0);

  const { vouchers, fetchVouchers, applyVoucher, loading, lastVoucherDoc } =
    usePaymentVouchersStore((state) => ({
      vouchers: state.vouchers,
      fetchVouchers: state.fetchVouchers,
      applyVoucher: state.applyVoucher,
      loading: state.loading,
      lastVoucherDoc: state.lastVoucherDoc,
    }));

  // Función para determinar el tipo de archivo
  const getFileType = (url: string): "image" | "pdf" | "other" => {
    if (!url) return "other";

    const extension = url.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return "pdf";
    } else if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension || "")
    ) {
      return "image";
    }

    // Para URLs que no tienen una extensión clara, intentamos adivinar por la URL
    if (url.includes("image") || url.includes("img")) {
      return "image";
    } else if (url.includes("pdf")) {
      return "pdf";
    }

    return "other";
  };

  // Función para recargar los datos
  const handleRefresh = async () => {
    if (loadingPayments || loading) return;

    setLoadingPayments(true);
    try {
      // Forzar invalidación del caché antes de recargar
      clearVouchersCache();

      // Forzar recarga completa limpiando el cursor y volviendo a la primera página
      setPageCursors([null]);
      setCurrentPage(1);

      // Incrementar el contador de recarga para forzar el efecto
      setReloadCounter((prev) => prev + 1);

      // Limpiar filtros para forzar recarga completa
      const tempFilters = { ...filters };
      await fetchVouchers(ITEMS_PER_PAGE, null, tempFilters);
    } catch (error) {
      console.error("Error al recargar comprobantes:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Cargar la primera página al montar o cuando cambian los filtros o se solicita una recarga
  useEffect(() => {
    const loadInitialVouchers = async () => {
      setLoadingPayments(true);
      try {
        // Si es una recarga forzada por el botón, invalidar caché primero
        if (reloadCounter > 0) {
          clearVouchersCache();
        }

        const count = await fetchVouchers(ITEMS_PER_PAGE, null, filters);
        setHasMore(count === ITEMS_PER_PAGE);
        if (lastVoucherDoc) {
          setPageCursors([null, lastVoucherDoc]);
        } else {
          setPageCursors([null]);
        }
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar comprobantes iniciales:", error);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadInitialVouchers();
  }, [fetchVouchers, filters, reloadCounter]);

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
      const count = await fetchVouchers(ITEMS_PER_PAGE, startAfter, filters);
      if (newPage > currentPage && count === 0) {
        setHasMore(false);
        return;
      }
      setHasMore(count === ITEMS_PER_PAGE);
      if (newPage > pageCursors.length - 1 && lastVoucherDoc && count > 0) {
        setPageCursors((prev) => [...prev, lastVoucherDoc]);
      }
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleApplyVoucher = async (voucherId: string) => {
    try {
      await applyVoucher(voucherId);
      // Recargar la lista después de aplicar
      handleRefresh();
    } catch (error) {
      console.error("Error al aplicar el comprobante:", error);
    }
  };

  const handleViewFile = (fileUrl: string) => {
    const fileType = getFileType(fileUrl);

    if (fileType === "image") {
      setSelectedImage(fileUrl);
      setShowImageModal(true);
    } else {
      // Para PDFs y otros tipos de archivos, abrir en una nueva pestaña
      window.open(fileUrl, "_blank");
    }
  };

  const totalPages = hasMore ? currentPage + 1 : currentPage;

  return (
    <div className="px-4 sm:px-6 lg:px-8 dark:bg-gray-900 p-4 rounded-lg">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Comprobantes de Pago
          </h1>
          <p className="mt-2 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg inline-block dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700">
            Lista de comprobantes enviados a través del{" "}
            <span className="font-bold">ChatBot de EstateAdmin</span>
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                status: e.target.value || undefined,
              })
            }
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
          >
            <option value="">Todos los estados</option>
            <option value="pending_review">Pendiente de revisión</option>
            <option value="applied">Aplicado</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading || loadingPayments}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 mr-1.5 ${
                loadingPayments ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
            Recargar
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {(loading || loadingPayments) && (
        <div className="flex justify-center items-center py-8">
          <LoadingApp />
        </div>
      )}

      {/* Tabla de datos cuando no está cargando */}
      {!loading && !loadingPayments && vouchers.length > 0 && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                      >
                        Fecha en que se envió el comprobante
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Departamento
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Condomino
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Conceptos seleccionados
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Monto Total
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="cursor-pointer">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                          {voucher.createdAt?.toDate
                            ? formatDateToSpanish(
                                voucher.createdAt.toDate().toISOString()
                              )
                            : formatDateToSpanish(voucher.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {voucher.departmentNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {`${voucher.userName || ""} ${
                            voucher.userLastName || ""
                          }`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {voucher.charges?.map((charge) => (
                            <div key={charge.concept}>
                              {charge.concept} -{" "}
                              {formatDateToSpanish(charge.startAt)}
                            </div>
                          ))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {formatCurrency(
                            voucher.charges?.reduce(
                              (sum, charge) =>
                                sum +
                                (charge.chargeAmountReference !== undefined
                                  ? charge.chargeAmountReference
                                  : charge.amount),
                              0
                            ) || 0
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              voucher.status === "applied"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {voucher.status === "applied"
                              ? "Aplicado"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleViewFile(voucher.paymentProofUrl)
                              }
                              className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                            >
                              {getFileType(voucher.paymentProofUrl) ===
                              "image" ? (
                                <EyeIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <DocumentIcon className="h-3 w-3 mr-1" />
                              )}
                              Ver
                            </button>
                            {voucher.status !== "applied" && (
                              <button
                                onClick={() => handleApplyVoucher(voucher.id)}
                                className="flex items-center bg-green-600 dark:bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 dark:hover:bg-green-700"
                              >
                                <CheckIcon className="h-3 w-3 mr-1" />
                                Aplicado
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No hay resultados */}
      {!loading && !loadingPayments && vouchers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No hay comprobantes disponibles.
          </p>
        </div>
      )}

      {/* Paginación */}
      {!loading && !loadingPayments && vouchers.length > 0 && (
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
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 mr-2"
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
                          ? "z-10 bg-indigo-700 border-2 text-white border-indigo-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                          : "z-10 border-2 border-indigo-700 rounded-md text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={loadingPayments || !hasMore}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 ml-2"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver la imagen */}
      {showImageModal && (
        <div className="fixed inset-0 bg-indigo-400 bg-opacity-15 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowImageModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Comprobante de Pago
                  </h3>
                  <div className="mt-2">
                    <img
                      src={selectedImage}
                      alt="Comprobante de pago"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesByCondominiums;
